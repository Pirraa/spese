#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
COMPOSE="docker compose -f \"$COMPOSE_FILE\""

ensure_postgres_image() {
  image="postgres:15-alpine"
  if ! docker image inspect "$image" >/dev/null 2>&1; then
    echo "Pulling $image..."
    docker pull "$image"
  fi
}

action="${1:-}"

case "$action" in
  setup)
    ensure_postgres_image
    eval "$COMPOSE build"
    ;;
  up)
    eval "$COMPOSE up -d"
    ;;
  down)
    eval "$COMPOSE down"
    ;;
  restart)
    eval "$COMPOSE down"
    eval "$COMPOSE up -d"
    ;;
  status)
    eval "$COMPOSE ps"
    ;;
  logs)
    tail_lines="${2:-200}"
    eval "$COMPOSE logs -f --tail $tail_lines"
    ;;
  backup)
    backup_dir="$ROOT_DIR/backups"
    mkdir -p "$backup_dir"
    timestamp="$(date +%Y%m%d_%H%M%S)"
    output="$backup_dir/spese_db_$timestamp.sql"
    docker exec spese-db pg_dump -U spese_user -d spese_db > "$output"
    echo "Backup scritto in $output"
    ;;
  monitor)
    docker stats --no-stream
    ;;
  *)
    echo "Usage: $0 {setup|up|down|restart|status|logs|backup|monitor}"
    exit 1
    ;;
esac
