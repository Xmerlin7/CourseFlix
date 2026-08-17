#!/usr/bin/env bash
#
# CourseFlix local development launcher.
#
#   ./dev.sh            bring the whole stack up (infra + migrations + seed + API + web)
#   ./dev.sh fast       restart just the API/web/worker — skips Docker,
#                       migrations, seeding and ngrok. Use once the full
#                       `up` has already been run and infra is still up;
#                       this is the ~10s "I just changed code" restart.
#   ./dev.sh stop       stop the API/web processes and the Docker services
#   ./dev.sh reset      drop the database volume and rebuild it from scratch
#   ./dev.sh status     show what is currently running
#   ./dev.sh logs       follow the API and web logs
#   ./dev.sh payment    check the Paymob payment setup and print the callback URL
#
# ngrok is auto-installed (if missing) and tunnels the API port so Paymob
# callbacks can reach the local server: https://<subdomain>.ngrok-free.dev
#
# Flags (for the default "up" command):
#   --no-seed           run migrations but skip seeding
#   --no-infra          assume Postgres/Redis/Chroma are already running
#   --no-payment-check  skip the Paymob setup check
#
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

LOG_DIR="$ROOT/.dev-logs"
API_LOG="$LOG_DIR/api.log"
WEB_LOG="$LOG_DIR/web.log"
WORKER_LOG="$LOG_DIR/worker.log"
WORKER_PID_FILE="$LOG_DIR/worker.pid"
NGROK_LOG="$LOG_DIR/ngrok.log"
NGROK_PID_FILE="$LOG_DIR/ngrok.pid"
NGROK_CONFIG="$LOG_DIR/ngrok.yml"

API_PORT="${PORT:-}"
WEB_PORT="${VITE_WEB_PORT:-}"
POSTGRES_PORT="${POSTGRES_PORT:-}"
REDIS_PORT="${REDIS_PORT:-}"
CHROMA_PORT="${CHROMA_PORT:-}"
NGROK_AUTHTOKEN="${NGROK_AUTHTOKEN:-}"

# ─── output helpers ──────────────────────────────────────────────────────
if [ -t 1 ]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'
  YELLOW=$'\033[33m'; BLUE=$'\033[34m'; RESET=$'\033[0m'
else
  BOLD=""; DIM=""; RED=""; GREEN=""; YELLOW=""; BLUE=""; RESET=""
fi

step() { printf '%s==>%s %s\n' "$BLUE$BOLD" "$RESET$BOLD" "$1$RESET"; }
ok()   { printf '  %s✓%s %s\n' "$GREEN" "$RESET" "$1"; }
warn() { printf '  %s!%s %s\n' "$YELLOW" "$RESET" "$1"; }
die()  { printf '\n%sERROR:%s %s\n' "$RED$BOLD" "$RESET" "$1" >&2; exit 1; }

trap 'die "failed at line $LINENO. Check $LOG_DIR for details."' ERR

# ─── docker access ───────────────────────────────────────────────────────
DOCKER_PREFIX=""

detect_docker() {
  command -v docker >/dev/null 2>&1 || die "docker is not installed."

  if docker info >/dev/null 2>&1; then
    DOCKER_PREFIX=""
  elif id -nG "$USER" 2>/dev/null | tr ' ' '\n' | grep -qx docker \
       && sg docker -c "docker info" >/dev/null 2>&1; then
    DOCKER_PREFIX="sg-docker"
    warn "using 'sg docker' — your shell hasn't picked up the docker group yet."
    warn "log out and back in once to make this permanent."
  else
    die "cannot talk to the Docker daemon.
  Is it running?           sudo systemctl start docker
  Are you in the group?    sudo usermod -aG docker \$USER   (then log out and back in)"
  fi
}

dk() {
  if [ "$DOCKER_PREFIX" = "sg-docker" ]; then
    sg docker -c "docker $*"
  else
    docker "$@"
  fi
}

compose() { dk compose "$@"; }

env_value() {
  [ -f "$ROOT/.env" ] || return 0
  sed -n "s/^$1=//p" "$ROOT/.env" | tail -n 1
}

load_local_env_settings() {
  local value

  value="$(env_value PORT)"
  API_PORT="${API_PORT:-${value:-3000}}"

  value="$(env_value VITE_WEB_PORT)"
  WEB_PORT="${WEB_PORT:-${value:-5173}}"

  value="$(env_value POSTGRES_PORT)"
  POSTGRES_PORT="${POSTGRES_PORT:-${value:-5432}}"

  value="$(env_value REDIS_PORT)"
  REDIS_PORT="${REDIS_PORT:-${value:-6379}}"

  value="$(env_value CHROMA_PORT)"
  CHROMA_PORT="${CHROMA_PORT:-${value:-8000}}"

  value="$(env_value NGROK_AUTHTOKEN)"
  NGROK_AUTHTOKEN="${NGROK_AUTHTOKEN:-$value}"
}

# ─── prerequisites ───────────────────────────────────────────────────────
check_prereqs() {
  step "Checking prerequisites"

  command -v node >/dev/null 2>&1 || die "node is not installed."
  local node_major
  node_major="$(node -v | sed 's/^v\([0-9]*\).*/\1/')"
  [ "$node_major" -ge 20 ] || die "node 20+ required (found $(node -v))."
  ok "node $(node -v)"

  command -v npm >/dev/null 2>&1 || die "npm is not installed."
  ok "npm $(npm -v)"

  detect_docker
  compose version >/dev/null 2>&1 \
    || die "the 'docker compose' plugin is missing. Install it: sudo pacman -S docker-compose"
  ok "docker $(dk --version | sed 's/Docker version //;s/,.*//')"

  if [ ! -f "$ROOT/.env" ]; then
    warn ".env was missing — created it from .env.example"
    cp "$ROOT/.env.example" "$ROOT/.env"
  fi

  load_local_env_settings
  ok ".env present"
}

install_deps() {
  step "Installing dependencies"

  for app in api web worker; do
    if [ -d "$ROOT/apps/$app/node_modules" ]; then
      ok "apps/$app (already installed)"
    else
      printf '  installing apps/%s ...\n' "$app"
      npm install --prefix "apps/$app" --silent
      ok "apps/$app"
    fi
  done
}

# ─── ngrok tunnel ────────────────────────────────────────────────────────
NGROK_DOWNLOAD_BASE="https://bin.equinox.io/c/bNyj1mQVY4c"

ngrok_arch() {
  case "$(uname -s)-$(uname -m)" in
    Linux-x86_64) echo "linux-amd64" ;;
    Linux-aarch64) echo "linux-arm64" ;;
    Darwin-x86_64) echo "darwin-amd64" ;;
    Darwin-arm64) echo "darwin-arm64" ;;
    *) echo "" ;;
  esac
}

install_ngrok() {
  local arch url dest

  step "Installing ngrok"

  arch="$(ngrok_arch)"

  if [ -z "$arch" ]; then
    warn "unsupported platform for ngrok auto-install: $(uname -s) $(uname -m)"
    return 1
  fi

  dest="$HOME/.local/bin"
  mkdir -p "$dest"

  url="$NGROK_DOWNLOAD_BASE/ngrok-v3-stable-$arch.tgz"

  printf '  downloading ngrok (%s) ...\n' "$arch"

  if ! curl --connect-timeout 10 --max-time 60 -fsSL "$url" -o "$LOG_DIR/ngrok.tgz"; then
    warn "failed to download ngrok from $url"
    return 1
  fi

  if ! tar -xzf "$LOG_DIR/ngrok.tgz" -C "$dest" ngrok; then
    warn "failed to extract ngrok."
    rm -f "$LOG_DIR/ngrok.tgz"
    return 1
  fi

  rm -f "$LOG_DIR/ngrok.tgz"
  chmod +x "$dest/ngrok"

  ok "installed ngrok to $dest/ngrok"
}

ensure_ngrok() {
  if command -v ngrok >/dev/null 2>&1; then
    ok "ngrok $(ngrok version | sed 's/^version //' || true)"
    return 0
  fi

  install_ngrok || return 1

  if [ -x "$HOME/.local/bin/ngrok" ]; then
    export PATH="$HOME/.local/bin:$PATH"
  fi

  if ! command -v ngrok >/dev/null 2>&1; then
    warn "ngrok installed but not on PATH ($HOME/.local/bin)"
    return 1
  fi
}

configure_ngrok() {
  if [ -z "$NGROK_AUTHTOKEN" ]; then
    warn "NGROK_AUTHTOKEN is not set in .env"
    return 1
  fi

  # Use a project-local config so a stale/corrupt ~/.config/ngrok/ngrok.yml
  # (which makes `add-authtoken` silently no-op and ngrok fail with
  # ERR_NGROK_4018) can't break the tunnel for whoever pulls this repo.
  rm -f "$NGROK_CONFIG"

  if ! ngrok config add-authtoken "$NGROK_AUTHTOKEN" --config "$NGROK_CONFIG" >/dev/null 2>&1; then
    warn "failed to configure ngrok authentication"
    return 1
  fi

  if ! grep -q "$NGROK_AUTHTOKEN" "$NGROK_CONFIG"; then
    warn "ngrok did not persist the authtoken — check NGROK_AUTHTOKEN in .env"
    return 1
  fi

  ok "ngrok authentication configured"
}

ngrok_public_url() {
  curl -s --max-time 3 http://127.0.0.1:4040/api/tunnels 2>/dev/null \
    | sed -n 's/.*"public_url":"\([^"]*ngrok[^"]*\)".*/\1/p' \
    | head -n 1
}

start_ngrok() {
  step "Starting ngrok tunnel (API port $API_PORT)"

  if ! ensure_ngrok; then
    warn "ngrok unavailable — continuing without a tunnel (Paymob callbacks won't reach this machine)"
    return 0
  fi

  if ! configure_ngrok; then
    warn "ngrok authentication unavailable — continuing without a tunnel"
    return 0
  fi

  if curl -sf --max-time 3 http://127.0.0.1:4040/api/tunnels >/dev/null 2>&1; then
    local existing

    existing="$(ngrok_public_url)"

    if [ -n "$existing" ]; then
      ok "ngrok already running — $existing -> http://localhost:$API_PORT"
      return 0
    fi
  fi

  free_port 4040

  setsid ngrok http "$API_PORT" --config "$NGROK_CONFIG" --log stdout > "$NGROK_LOG" 2>&1 < /dev/null &
  local ngrok_pid="$!"
  echo "$ngrok_pid" > "$NGROK_PID_FILE"

  printf '  waiting for ngrok tunnel'

  local waited=0
  local url=""

  until url="$(ngrok_public_url)" && [ -n "$url" ]; do
    if ! kill -0 "$ngrok_pid" 2>/dev/null; then
      printf '\n'
      if grep -q "ERR_NGROK_4018" "$NGROK_LOG" 2>/dev/null; then
        warn "ngrok rejected the authtoken (ERR_NGROK_4018) — NGROK_AUTHTOKEN in .env is invalid or revoked."
        warn "Get a fresh token at https://dashboard.ngrok.com/get-started/your-authtoken"
      else
        tail -5 "$NGROK_LOG" >&2
        warn "ngrok exited unexpectedly — continuing without a tunnel. See $NGROK_LOG"
      fi
      return 0
    fi

    if [ "$waited" -ge 30 ]; then
      printf '\n'
      tail -5 "$NGROK_LOG" >&2
      warn "ngrok did not start within 30s — continuing without a tunnel. See $NGROK_LOG"
      return 0
    fi


    printf '.'
    sleep 1
    waited=$((waited + 1))
  done


  printf '\n'
  ok "ngrok tunnel ready — $url -> http://localhost:$API_PORT"
}

stop_ngrok() {
  if [ -f "$NGROK_PID_FILE" ]; then
    local pid


    pid="$(cat "$NGROK_PID_FILE" 2>/dev/null || true)"


    if [ -n "$pid" ] && ps -p "$pid" >/dev/null 2>&1; then
      stop_pid_group "$pid"
      rm -f "$NGROK_PID_FILE"
      ok "stopped ngrok"
      return
    fi
  fi


  ok "ngrok was not running"
}

# ─── payment setup ───────────────────────────────────────────────────────
PAYMOB_BASE_URL_FALLBACK="https://accept.paymob.com/api"

check_payment_config() {
  step "Checking Paymob payment setup"

  local base key integration iframe hmac missing url

  base="$(env_value PAYMOB_BASE_URL)"
  base="${base:-$PAYMOB_BASE_URL_FALLBACK}"
  key="$(env_value PAYMOB_API_KEY)"
  integration="$(env_value PAYMOB_INTEGRATION_ID)"
  iframe="$(env_value PAYMOB_IFRAME_ID)"
  hmac="$(env_value PAYMOB_HMAC_SECRET)"

  missing=""

  [ -n "$key" ] && [ "$key" != "replace-me" ] || missing="${missing} PAYMOB_API_KEY"
  [ -n "$integration" ] && [ "$integration" != "replace-me" ] || missing="${missing} PAYMOB_INTEGRATION_ID"
  [ -n "$iframe" ] && [ "$iframe" != "replace-me" ] || missing="${missing} PAYMOB_IFRAME_ID"
  [ -n "$hmac" ] && [ "$hmac" != "replace-me" ] || missing="${missing} PAYMOB_HMAC_SECRET"

  if [ -n "$missing" ]; then
    warn "payment will not work — missing in .env:$missing"
    return 0
  fi

  ok "integration $integration · iframe $iframe · key ${key:0:6}… · HMAC ${hmac:0:4}…"

  printf '  verifying the API key against %s ...\n' "$base"

  if curl -fsSL --connect-timeout 8 --max-time 15 \
      -X POST "$base/auth/tokens" \
      -H 'Content-Type: application/json' \
      -d "{\"api_key\":\"$key\"}" 2>/dev/null \
      | grep -q '"token"'; then
    ok "Paymob API key accepted"
  else
    warn "Paymob rejected the API key or is unreachable — real payments will fail"
    warn "  check PAYMOB_API_KEY and PAYMOB_BASE_URL in .env"
  fi

  url="$(ngrok_public_url || true)"

  if [ -n "$url" ]; then
    ok "webhook callback: $url/api/v1/paymob/webhook"
    warn "set this exact URL as the Paymob 'transaction processed' callback in the dashboard"
  else
    warn "ngrok is not running — Paymob's server-to-server webhook cannot reach this API"
    warn "  (the browser GET redirect still fulfils orders end-to-end)"
  fi
}

# ─── infrastructure ──────────────────────────────────────────────────────
start_infra() {
  step "Starting infrastructure (Postgres, Redis, Chroma)"


  compose up -d >/dev/null 2>&1
  ok "containers up"

  wait_for_postgres_container
  ensure_postgres_port_published


  ok "Postgres healthy on port $POSTGRES_PORT"
}

wait_for_postgres_container() {
  printf '  waiting for Postgres to accept connections'


  local waited=0

  until [ "$(dk inspect --format '{{.State.Health.Status}}' courseflix-postgres 2>/dev/null)" = "healthy" ]; do
    [ "$waited" -ge 60 ] && {
      printf '\n'
      die "Postgres did not become healthy within 60s. Try: ./dev.sh logs"
    }

    printf '.'
    sleep 1
    waited=$((waited + 1))
  done

  printf '\n'
}

postgres_published_port() {
  dk port courseflix-postgres 5432/tcp 2>/dev/null \
    | awk -F: 'NR == 1 { print $NF }'
}

ensure_postgres_port_published() {
  local published


  published="$(postgres_published_port)"

  if [ "$published" = "$POSTGRES_PORT" ]; then
    return
  fi

  warn "Postgres is not published on host port $POSTGRES_PORT — recreating its container."


  compose up -d --force-recreate postgres > "$LOG_DIR/postgres-recreate.log" 2>&1 \
    || {
      tail -20 "$LOG_DIR/postgres-recreate.log"
      die "could not publish Postgres on port $POSTGRES_PORT. If another local Postgres is using it, change POSTGRES_PORT and DATABASE_URL in .env."
    }

  wait_for_postgres_container

  published="$(postgres_published_port)"

  [ "$published" = "$POSTGRES_PORT" ] \
    || die "Postgres container is healthy, but host port $POSTGRES_PORT is not mapped. Check $LOG_DIR/postgres-recreate.log."
}

# ─── database ────────────────────────────────────────────────────────────
check_database_connection() {
  (
    cd "$ROOT/apps/api"

    node <<'NODE'
const { resolve } = require('path');
const { config } = require('dotenv');
const { Client } = require('pg');

config({ path: resolve(process.cwd(), '../../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  await client.connect();

  const result = await client.query(
    'select current_user as "user", current_database() as "database"'
  );

  const row = result.rows[0];

  if (process.env.POSTGRES_USER && row.user !== process.env.POSTGRES_USER) {
    throw new Error(
      `DATABASE_URL connected as ${row.user}, expected ${process.env.POSTGRES_USER}`
    );
  }

  if (process.env.POSTGRES_DB && row.database !== process.env.POSTGRES_DB) {
    throw new Error(
      `DATABASE_URL connected to ${row.database}, expected ${process.env.POSTGRES_DB}`
    );
  }

  console.log(`${row.user}@${row.database}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => undefined);
  });
NODE
  )
}

setup_database() {
  step "Preparing the database"

  printf '  checking database connection ...\n'

  local db_check

  db_check="$(check_database_connection 2>&1)" \
    || {
      printf '%s\n' "$db_check" | sed 's/^/    /'
      die "database connection failed — verify DATABASE_URL in .env points at the Docker Postgres port."
    }

  ok "database reachable ($db_check)"

  printf '  running migrations ...\n'

  TS_NODE_TRANSPILE_ONLY=true npm run migration:run --prefix apps/api --silent > "$LOG_DIR/migrations.log" 2>&1 \
    || {
      tail -20 "$LOG_DIR/migrations.log"
      die "migrations failed — see $LOG_DIR/migrations.log"
    }

  ok "migrations applied"

  if [ "$SKIP_SEED" = "true" ]; then
    warn "seeding skipped (--no-seed)"
    return
  fi

  printf '  seeding demo data ...\n'

  TS_NODE_TRANSPILE_ONLY=true npm run seed --prefix apps/api --silent > "$LOG_DIR/seed.log" 2>&1 \
    || {
      tail -20 "$LOG_DIR/seed.log"
      die "seed failed — see $LOG_DIR/seed.log"
    }

  grep -A 20 '^Seed complete:' "$LOG_DIR/seed.log" | sed 's/^/  /' || true

  printf '  backfilling missing/failed video transcripts ...\n'

  TS_NODE_TRANSPILE_ONLY=true npm run backfill:video-transcripts --prefix apps/api --silent > "$LOG_DIR/backfill.log" 2>&1 \
    && grep '^Backfill complete:' "$LOG_DIR/backfill.log" | sed 's/^/  /' \
    || warn "video transcript backfill failed — see $LOG_DIR/backfill.log (non-fatal, continuing)"
}

# ─── app processes ───────────────────────────────────────────────────────
port_pid() {
  lsof -ti:"$1" -sTCP:LISTEN 2>/dev/null || true
}

stop_process_for_port() {
  local pid="$1"
  local pgid
  local current_pgid

  pgid="$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ' || true)"
  current_pgid="$(ps -o pgid= -p "$$" 2>/dev/null | tr -d ' ' || true)"

  if [ -n "$pgid" ] && [ "$pgid" != "$current_pgid" ]; then
    kill -TERM -- "-$pgid" 2>/dev/null || kill "$pid" 2>/dev/null || true
  else
    kill "$pid" 2>/dev/null || true
  fi
}

stop_pid_group() {
  local pid="$1"
  local pgid
  local current_pgid

  [ -n "$pid" ] || return

  pgid="$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ' || true)"
  current_pgid="$(ps -o pgid= -p "$$" 2>/dev/null | tr -d ' ' || true)"

  if [ -n "$pgid" ] && [ "$pgid" != "$current_pgid" ]; then
    kill -TERM -- "-$pgid" 2>/dev/null || kill "$pid" 2>/dev/null || true
  else
    kill "$pid" 2>/dev/null || true
  fi
}

free_port() {
  local pids
  local pid

  pids="$(port_pid "$1")"

  if [ -n "$pids" ]; then
    warn "port $1 was busy — stopping pid(s) $(echo "$pids" | tr '\n' ' ')"

    for pid in $pids; do
      stop_process_for_port "$pid"
    done

    sleep 2
  fi
}

wait_for_http() {
  local url="$1"
  local name="$2"
  local waited=0

  printf '  waiting for %s' "$name"

  until curl -sf "$url" >/dev/null 2>&1; do
    [ "$waited" -ge 90 ] && {
      printf '\n'
      die "$name did not start within 90s. Check the log."
    }

    printf '.'
    sleep 1
    waited=$((waited + 1))
  done

  printf '\n'
}

wait_for_log() {
  local file="$1"
  local pattern="$2"
  local name="$3"
  local waited=0

  printf '  waiting for %s' "$name"

  until [ -f "$file" ] && grep -q "$pattern" "$file"; do
    [ "$waited" -ge 45 ] && {
      printf '\n'
      die "$name did not start within 45s. Check the log."
    }

    printf '.'
    sleep 1
    waited=$((waited + 1))
  done

  printf '\n'
}

start_apps() {
  step "Starting the API and web app"

  free_port "$API_PORT"
  free_port "$WEB_PORT"

  if [ -f "$WORKER_PID_FILE" ]; then
    local old_worker_pid

    old_worker_pid="$(cat "$WORKER_PID_FILE" 2>/dev/null || true)"

    if [ -n "$old_worker_pid" ] && ps -p "$old_worker_pid" >/dev/null 2>&1; then
      warn "worker was already running — stopping pid $old_worker_pid"
      stop_pid_group "$old_worker_pid"
      sleep 2
    fi
  fi

  # Launch API, web and worker together, and kick off the ngrok tunnel
  # right away too — none of these actually depend on each other being
  # *ready*, only on their ports being free (handled above). Waiting for
  # each one in turn before starting the next serializes work that can
  # run concurrently, so every wait below is really just waiting out
  # whichever of these was slowest to boot.
  setsid npm run start:dev --prefix apps/api > "$API_LOG" 2>&1 < /dev/null &
  setsid npm run dev --prefix apps/web > "$WEB_LOG" 2>&1 < /dev/null &
  setsid npm run start:dev --prefix apps/worker > "$WORKER_LOG" 2>&1 < /dev/null &
  echo "$!" > "$WORKER_PID_FILE"

  start_ngrok

  wait_for_http \
    "http://localhost:$API_PORT/api/v1/health" \
    "API"

  ok "API listening on http://localhost:$API_PORT"

  wait_for_http \
    "http://localhost:$WEB_PORT" \
    "web app"

  ok "web app listening on http://localhost:$WEB_PORT"

  wait_for_log \
    "$WORKER_LOG" \
    "Worker started" \
    "worker"

  ok "worker running (PDF ingestion)"
}

# ─── summary ─────────────────────────────────────────────────────────────
print_summary() {
  local teacher_email
  local teacher_password
  local student_email
  local student_password

  teacher_email="$(grep -E '^SEED_TEACHER_EMAIL=' .env | cut -d= -f2-)"
  teacher_password="$(grep -E '^SEED_TEACHER_PASSWORD=' .env | cut -d= -f2-)"
  student_email="$(grep -E '^SEED_STUDENT_EMAIL=' .env | cut -d= -f2-)"
  student_password="$(grep -E '^SEED_STUDENT_PASSWORD=' .env | cut -d= -f2-)"

  local db_health
  local ngrok_url

  db_health="$(curl -s "http://localhost:$API_PORT/api/v1/health" || echo '{}')"
  ngrok_url="$(ngrok_public_url || true)"

  cat <<EOF

${GREEN}${BOLD}CourseFlix is running.${RESET}

  ${BOLD}Open this${RESET}       ${BLUE}http://localhost:$WEB_PORT${RESET}

  ${BOLD}Sign in as${RESET}
    teacher        $teacher_email  /  $teacher_password
    student        $student_email  /  $student_password
    other students student2@courseflix.local … student10@courseflix.local
                   (same password as the student above)

  ${BOLD}Services${RESET}
    web            http://localhost:$WEB_PORT
    API            http://localhost:$API_PORT/api/v1
    health         http://localhost:$API_PORT/api/v1/health
                   ${DIM}$db_health${RESET}
    Postgres       localhost:$POSTGRES_PORT
    Redis          localhost:${REDIS_PORT:-6379}
    Chroma         http://localhost:${CHROMA_PORT:-8000}
    worker         PDF ingestion jobs

  ${BOLD}Paymob callbacks${RESET}
    ngrok tunnel   ${ngrok_url:-not running}
    webhook        $ngrok_url/api/v1/paymob/webhook

  ${BOLD}Logs${RESET}
    ./dev.sh logs  ${DIM}(or tail $API_LOG / $WEB_LOG / $WORKER_LOG / $NGROK_LOG)${RESET}

  ${BOLD}Stop${RESET}
    ./dev.sh stop

EOF
}

# ─── commands ────────────────────────────────────────────────────────────
cmd_up() {
  mkdir -p "$LOG_DIR"

  check_prereqs
  install_deps

  [ "$SKIP_INFRA" = "true" ] \
    && warn "skipping infrastructure (--no-infra)" \
    || start_infra

  setup_database
  start_apps

  [ "$SKIP_PAYMENT_CHECK" = "true" ] \
    && warn "skipping Paymob setup check (--no-payment-check)" \
    || check_payment_config

  print_summary
}

cmd_fast() {
  mkdir -p "$LOG_DIR"

  step "Fast restart — API + web + worker only (no Docker/migrations/seed/ngrok)"
  warn "the ngrok tunnel is not (re)started in fast mode — Paymob callbacks rely on an existing tunnel"

  start_apps

  [ "$SKIP_PAYMENT_CHECK" = "true" ] \
    && warn "skipping Paymob setup check (--no-payment-check)" \
    || check_payment_config

  print_summary
}

cmd_payment() {
  mkdir -p "$LOG_DIR"

  [ -f "$ROOT/.env" ] || die "no .env yet — run ./dev.sh up first."

  check_payment_config
}

cmd_stop() {
  step "Stopping the API and web app"

  if [ -f "$WORKER_PID_FILE" ]; then
    local worker_pid

    worker_pid="$(cat "$WORKER_PID_FILE" 2>/dev/null || true)"

    if [ -n "$worker_pid" ] && ps -p "$worker_pid" >/dev/null 2>&1; then
      stop_pid_group "$worker_pid"
      ok "stopped worker"
    else
      ok "worker was not running"
    fi
  else
    ok "worker was not running"
  fi

  for port in "$API_PORT" "$WEB_PORT"; do
    local pid
    local single_pid

    pid="$(port_pid "$port")"

    if [ -n "$pid" ]; then
      for single_pid in $pid; do
        stop_process_for_port "$single_pid"
      done

      ok "stopped whatever was on port $port"
    else
      ok "nothing running on port $port"
    fi
  done

  stop_ngrok

  step "Stopping infrastructure"

  detect_docker
  compose down >/dev/null 2>&1

  ok "containers stopped (data volumes kept — use './dev.sh reset' to wipe)"
}

cmd_reset() {
  printf '%sThis deletes the database volume and all local data.%s Continue? [y/N] ' \
    "$YELLOW$BOLD" "$RESET"

  read -r reply

  case "$reply" in
    [yY]*) ;;
    *) echo "Cancelled."; exit 0 ;;
  esac

  detect_docker

  step "Removing containers and volumes"

  compose down -v >/dev/null 2>&1

  ok "volumes removed"

  SKIP_INFRA="false"

  cmd_up
}

cmd_status() {
  detect_docker

  step "Containers"
  compose ps

  step "App processes"

  for entry in "API:$API_PORT" "web:$WEB_PORT"; do
    local name="${entry%%:*}"
    local port="${entry##*:}"
    local pid

    pid="$(port_pid "$port")"

    if [ -n "$pid" ]; then
      ok "$name listening on $port (pid $pid)"
    else
      warn "$name not running on $port"
    fi
  done

  if [ -f "$WORKER_PID_FILE" ]; then
    local worker_pid

    worker_pid="$(cat "$WORKER_PID_FILE" 2>/dev/null || true)"

    if [ -n "$worker_pid" ] && ps -p "$worker_pid" >/dev/null 2>&1; then
      ok "worker running (pid $worker_pid)"
    else
      warn "worker not running"
    fi
  else
    warn "worker not running"
  fi

  local ngrok_url

  ngrok_url="$(ngrok_public_url || true)"

  if [ -n "$ngrok_url" ]; then
    ok "ngrok tunnel $ngrok_url"
  else
    warn "ngrok not running"
  fi
}

cmd_logs() {
  [ -f "$API_LOG" ] || die "no logs yet — run ./dev.sh first."

  step "Following API, web and worker logs (Ctrl+C to stop)"

  tail -f \
    "$API_LOG" \
    "$WEB_LOG" \
    "$WORKER_LOG" \
    "$NGROK_LOG"
}

# ─── entrypoint ──────────────────────────────────────────────────────────
COMMAND="up"
SKIP_SEED="false"
SKIP_INFRA="false"
SKIP_PAYMENT_CHECK="false"

for arg in "$@"; do
  case "$arg" in
    up|fast|stop|reset|status|logs|payment)
      COMMAND="$arg"
      ;;

    --no-seed)
      SKIP_SEED="true"
      ;;

    --no-infra)
      SKIP_INFRA="true"
      ;;

    --no-payment-check)
      SKIP_PAYMENT_CHECK="true"
      ;;

    -h|--help)
      sed -n '2,21p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;

    *)
      die "unknown argument: $arg  (try --help)"
      ;;
  esac
done

[ -f "$ROOT/.env" ] && load_local_env_settings

case "$COMMAND" in
  up)
    cmd_up
    ;;

  fast)
    cmd_fast
    ;;

  stop)
    cmd_stop
    ;;

  reset)
    cmd_reset
    ;;

  status)
    cmd_status
    ;;

  logs)
    cmd_logs
    ;;

  payment)
    cmd_payment
    ;;
esac