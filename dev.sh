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

API_PORT="${PORT:-3000}"
WEB_PORT="${VITE_WEB_PORT:-5173}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

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
  ok ".env present"
}

install_deps() {
  step "Installing dependencies"
  for app in api web; do
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

  printf '  waiting for Postgres to accept connections'
  local waited=0
  until [ "$(dk inspect --format '{{.State.Health.Status}}' courseflix-postgres 2>/dev/null)" = "healthy" ]; do
    [ "$waited" -ge 60 ] && { printf '\n'; die "Postgres did not become healthy within 60s. Try: ./dev.sh logs"; }
    printf '.'
    sleep 1
    waited=$((waited + 1))
  done
  printf '\n'
  ok "Postgres healthy on port $POSTGRES_PORT"
}

# ─── database ────────────────────────────────────────────────────────────
setup_database() {
  step "Preparing the database"

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

free_port() {
  local pid
  pid="$(port_pid "$1")"
  if [ -n "$pid" ]; then
    warn "port $1 was busy — stopping pid $pid"
    kill $pid 2>/dev/null || true
    sleep 1
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

  ${BOLD}Logs${RESET}
    ./dev.sh logs  ${DIM}(or tail $API_LOG / $WEB_LOG)${RESET}

  ${BOLD}Stop${RESET}
    ./dev.sh stop

${DIM}Note: uploaded PDFs stay at "في الانتظار" — the ingestion worker that
would process them (apps/worker) isn't built yet, so nothing picks the job
up. Everything else in the demo is live data from Postgres.${RESET}
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
  for port in "$API_PORT" "$WEB_PORT"; do
    local pid
    pid="$(port_pid "$port")"
    if [ -n "$pid" ]; then
      kill $pid 2>/dev/null || true
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
}

cmd_logs() {
  [ -f "$API_LOG" ] || die "no logs yet — run ./dev.sh first."
  step "Following API and web logs (Ctrl+C to stop)"
  tail -f "$API_LOG" "$WEB_LOG"
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

case "$COMMAND" in
  up)     cmd_up ;;
  stop)   cmd_stop ;;
  reset)  cmd_reset ;;
  status) cmd_status ;;
  logs)   cmd_logs ;;
esac
