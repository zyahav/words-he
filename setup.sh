#!/usr/bin/env bash
set -euo pipefail

# Wrapper to match setup_instructions.md
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/setup_script.sh"

