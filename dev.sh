#!/usr/bin/env bash
#
# CourseFlix local development launcher.
#
#   ./dev.sh            bring the whole stack up (infra + migrations + seed + API + web)
#   ./dev.sh stop       stop the API/web processes and the Docker services
#   ./dev.sh reset      drop the database volume and rebuild it from scratch
#   ./dev.sh status     show what is currently running
#   ./dev.sh logs       follow the API and web logs
#
# Flags (for the default "up" command):
#   --no-seed           run migrations but skip seeding
#   --no-infra          assume Postgres/Redis/Chroma are already running
#
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

LOG_DIR="$ROOT/.dev-logs"
API_LOG="$LOG_DIR/api.log"
WEB_LOG="$LOG_DIR/web.log"
WORKER_LOG="$LOG_DIR/worker.log"
WORKER_PID_FILE="$LOG_DIR/worker.pid"

API_PORT="${PORT:-}"
WEB_PORT="${VITE_WEB_PORT:-}"
POSTGRES_PORT="${POSTGRES_PORT:-}"
REDIS_PORT="${REDIS_PORT:-}"
CHROMA_PORT="${CHROMA_PORT:-}"

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
# Membership in the `docker` group only takes effect after a fresh login.
# If the group is granted but not yet active in this shell, `sg` runs the
# command under it rather than making the user log out and back in.
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
    [ "$waited" -ge 60 ] && { printf '\n'; die "Postgres did not become healthy within 60s. Try: ./dev.sh logs"; }
    printf '.'
    sleep 1
    waited=$((waited + 1))
  done
  printf '\n'
}

postgres_published_port() {
  dk port courseflix-postgres 5432/tcp 2>/dev/null | awk -F: 'NR == 1 { print $NF }'
}

ensure_postgres_port_published() {
  local published
  published="$(postgres_published_port)"

  if [ "$published" = "$POSTGRES_PORT" ]; then
    return
  fi

  warn "Postgres is not published on host port $POSTGRES_PORT — recreating its container."
  compose up -d --force-recreate postgres > "$LOG_DIR/postgres-recreate.log" 2>&1 \
    || { tail -20 "$LOG_DIR/postgres-recreate.log"; die "could not publish Postgres on port $POSTGRES_PORT. If another local Postgres is using it, change POSTGRES_PORT and DATABASE_URL in .env."; }

  wait_for_postgres_container
  published="$(postgres_published_port)"
  [ "$published" = "$POSTGRES_PORT" ] \
    || die "Postgres container is healthy, but host port $POSTGRES_PORT is not mapped. Check $LOG_DIR/postgres-recreate.log."
}

# ─── database ────────────────────────────────────────────────────────────
check_database_connection() {
  (cd "$ROOT/apps/api" && node <<'NODE'
const { resolve } = require('path');
const { config } = require('dotenv');
const { Client } = require('pg');

config({ path: resolve(process.cwd(), '../../.env') });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  const result = await client.query('select current_user as "user", current_database() as "database"');
  const row = result.rows[0];

  if (process.env.POSTGRES_USER && row.user !== process.env.POSTGRES_USER) {
    throw new Error(`DATABASE_URL connected as ${row.user}, expected ${process.env.POSTGRES_USER}`);
  }

  if (process.env.POSTGRES_DB && row.database !== process.env.POSTGRES_DB) {
    throw new Error(`DATABASE_URL connected to ${row.database}, expected ${process.env.POSTGRES_DB}`);
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
    || { printf '%s\n' "$db_check" | sed 's/^/    /'; die "database connection failed — verify DATABASE_URL in .env points at the Docker Postgres port."; }
  ok "database reachable ($db_check)"

  printf '  running migrations ...\n'
  npm run migration:run --prefix apps/api --silent > "$LOG_DIR/migrations.log" 2>&1 \
    || { tail -20 "$LOG_DIR/migrations.log"; die "migrations failed — see $LOG_DIR/migrations.log"; }
  ok "migrations applied"

  if [ "$SKIP_SEED" = "true" ]; then
    warn "seeding skipped (--no-seed)"
    return
  fi

  printf '  seeding demo data ...\n'
  npm run seed --prefix apps/api --silent > "$LOG_DIR/seed.log" 2>&1 \
    || { tail -20 "$LOG_DIR/seed.log"; die "seed failed — see $LOG_DIR/seed.log"; }
  # The seed prints its own summary; surface it rather than hiding it in a log.
  grep -A 20 '^Seed complete:' "$LOG_DIR/seed.log" | sed 's/^/  /' || true
}

# ─── app processes ───────────────────────────────────────────────────────
port_pid() { lsof -ti:"$1" -sTCP:LISTEN 2>/dev/null || true; }

stop_process_for_port() {
  local pid="$1" pgid current_pgid
  pgid="$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ' || true)"
  current_pgid="$(ps -o pgid= -p "$$" 2>/dev/null | tr -d ' ' || true)"

  if [ -n "$pgid" ] && [ "$pgid" != "$current_pgid" ]; then
    kill -TERM -- "-$pgid" 2>/dev/null || kill "$pid" 2>/dev/null || true
  else
    kill "$pid" 2>/dev/null || true
  fi
}

stop_pid_group() {
  local pid="$1" pgid current_pgid
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
  local pids pid
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
  local url="$1" name="$2" waited=0
  printf '  waiting for %s' "$name"
  until curl -sf "$url" >/dev/null 2>&1; do
    [ "$waited" -ge 90 ] && { printf '\n'; die "$name did not start within 90s. Check the log."; }
    printf '.'
    sleep 1
    waited=$((waited + 1))
  done
  printf '\n'
}

wait_for_log() {
  local file="$1" pattern="$2" name="$3" waited=0
  printf '  waiting for %s' "$name"
  until [ -f "$file" ] && grep -q "$pattern" "$file"; do
    [ "$waited" -ge 45 ] && { printf '\n'; die "$name did not start within 45s. Check the log."; }
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

  # setsid detaches them from this script's process group, so they survive
  # once the script exits and are stopped explicitly by `./dev.sh stop`.
  setsid npm run start:dev --prefix apps/api > "$API_LOG" 2>&1 < /dev/null &
  wait_for_http "http://localhost:$API_PORT/api/v1/health" "API"
  ok "API listening on http://localhost:$API_PORT"

  setsid npm run dev --prefix apps/web > "$WEB_LOG" 2>&1 < /dev/null &
  wait_for_http "http://localhost:$WEB_PORT" "web app"
  ok "web app listening on http://localhost:$WEB_PORT"

  if [ -f "$WORKER_PID_FILE" ]; then
    local old_worker_pid
    old_worker_pid="$(cat "$WORKER_PID_FILE" 2>/dev/null || true)"
    if [ -n "$old_worker_pid" ] && ps -p "$old_worker_pid" >/dev/null 2>&1; then
      warn "worker was already running — stopping pid $old_worker_pid"
      stop_pid_group "$old_worker_pid"
      sleep 2
    fi
  fi

  setsid npm run start:dev --prefix apps/worker > "$WORKER_LOG" 2>&1 < /dev/null &
  echo "$!" > "$WORKER_PID_FILE"
  wait_for_log "$WORKER_LOG" "Worker started" "worker"
  ok "worker running (PDF ingestion)"
}

# ─── summary ─────────────────────────────────────────────────────────────
print_summary() {
  local teacher_email teacher_password student_email student_password
  teacher_email="$(grep -E '^SEED_TEACHER_EMAIL=' .env | cut -d= -f2-)"
  teacher_password="$(grep -E '^SEED_TEACHER_PASSWORD=' .env | cut -d= -f2-)"
  student_email="$(grep -E '^SEED_STUDENT_EMAIL=' .env | cut -d= -f2-)"
  student_password="$(grep -E '^SEED_STUDENT_PASSWORD=' .env | cut -d= -f2-)"

  local db_health
  db_health="$(curl -s "http://localhost:$API_PORT/api/v1/health" || echo '{}')"

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

  ${BOLD}Logs${RESET}
    ./dev.sh logs  ${DIM}(or tail $API_LOG / $WEB_LOG / $WORKER_LOG)${RESET}

  ${BOLD}Stop${RESET}
    ./dev.sh stop

EOF
}

# ─── commands ────────────────────────────────────────────────────────────
cmd_up() {
  mkdir -p "$LOG_DIR"
  check_prereqs
  install_deps
  [ "$SKIP_INFRA" = "true" ] && warn "skipping infrastructure (--no-infra)" || start_infra
  setup_database
  start_apps
  print_summary
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
    local pid single_pid
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

  step "Stopping infrastructure"
  detect_docker
  compose down >/dev/null 2>&1
  ok "containers stopped (data volumes kept — use './dev.sh reset' to wipe)"
}

cmd_reset() {
  printf '%sThis deletes the database volume and all local data.%s Continue? [y/N] ' "$YELLOW$BOLD" "$RESET"
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
  # Only our own processes are checked here. Docker-published ports are
  # bound by root-owned docker-proxy, which lsof can't see as a normal
  # user — the container table above is the source of truth for those.
  step "App processes"
  for entry in "API:$API_PORT" "web:$WEB_PORT"; do
    local name="${entry%%:*}" port="${entry##*:}" pid
    pid="$(port_pid "$port")"
    if [ -n "$pid" ]; then ok "$name listening on $port (pid $pid)"; else warn "$name not running on $port"; fi
  done
  if [ -f "$WORKER_PID_FILE" ]; then
    local worker_pid
    worker_pid="$(cat "$WORKER_PID_FILE" 2>/dev/null || true)"
    if [ -n "$worker_pid" ] && ps -p "$worker_pid" >/dev/null 2>&1; then ok "worker running (pid $worker_pid)"; else warn "worker not running"; fi
  else
    warn "worker not running"
  fi
}

cmd_logs() {
  [ -f "$API_LOG" ] || die "no logs yet — run ./dev.sh first."
  step "Following API and web logs (Ctrl+C to stop)"
  tail -f "$API_LOG" "$WEB_LOG" "$WORKER_LOG"
}

# ─── entrypoint ──────────────────────────────────────────────────────────
COMMAND="up"
SKIP_SEED="false"
SKIP_INFRA="false"

for arg in "$@"; do
  case "$arg" in
    up|stop|reset|status|logs) COMMAND="$arg" ;;
    --no-seed)  SKIP_SEED="true" ;;
    --no-infra) SKIP_INFRA="true" ;;
    -h|--help)
      sed -n '2,18p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) die "unknown argument: $arg  (try --help)" ;;
  esac
done

[ -f "$ROOT/.env" ] && load_local_env_settings

case "$COMMAND" in
  up)     cmd_up ;;
  stop)   cmd_stop ;;
  reset)  cmd_reset ;;
  status) cmd_status ;;
  logs)   cmd_logs ;;
esac
