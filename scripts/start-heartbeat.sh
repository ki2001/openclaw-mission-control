#!/usr/bin/env bash
# OpenClaw Heartbeat Launcher
# Usage: ./scripts/start-heartbeat.sh --agent-id dev --agent-name "Dev Agent" --agent-emoji "🔧" --agent-role "Engineering"
#
# Add to crontab for auto-start: @reboot /path/to/scripts/start-heartbeat.sh --agent-id dev --agent-name "Dev Agent"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env if present
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

# Default dashboard URL
export DASHBOARD_URL="${DASHBOARD_URL:-http://localhost:3000}"

# Check for tsx
if ! command -v npx &>/dev/null; then
  echo "Error: npx not found. Install Node.js first."
  exit 1
fi

# Forward all arguments
exec npx tsx "$SCRIPT_DIR/openclaw-heartbeat.ts" "$@"
