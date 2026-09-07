#!/usr/bin/env bash
set -euo pipefail

CONTAINER="ricehub-mongo"
VOLUME="ricehub-mongo-data"
PORT=27017

usage() {
  echo "Usage: $0 {start|stop|status|logs|reset}"
  exit 1
}

cmd_start() {
  if podman container exists "$CONTAINER" 2>/dev/null; then
    podman start "$CONTAINER"
    echo "Container '$CONTAINER' started."
  else
    podman volume create "$VOLUME" 2>/dev/null || true
    podman run -d \
      --name "$CONTAINER" \
      -p "${PORT}:27017" \
      -v "${VOLUME}:/data/db:Z" \
      mongo:7
    echo "Container '$CONTAINER' created and started on port $PORT."
  fi
}

cmd_stop() {
  podman stop "$CONTAINER" 2>/dev/null && echo "Stopped." || echo "Not running."
}

cmd_status() {
  podman ps -a --filter "name=$CONTAINER" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

cmd_logs() {
  podman logs -f "$CONTAINER"
}

cmd_reset() {
  podman rm -f "$CONTAINER" 2>/dev/null || true
  podman volume rm "$VOLUME" 2>/dev/null || true
  echo "Container and volume removed."
  cmd_start
}

[[ $# -lt 1 ]] && usage
case "$1" in
  start)  cmd_start  ;;
  stop)   cmd_stop   ;;
  status) cmd_status ;;
  logs)   cmd_logs   ;;
  reset)  cmd_reset  ;;
  *)      usage      ;;
esac
