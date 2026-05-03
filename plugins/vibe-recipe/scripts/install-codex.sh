#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
plugin_dir="$(cd "$script_dir/.." && pwd)"
target="${1:-AGENTS.md}"

if [[ -e "$target" ]]; then
  cp "$target" "$target.bak.$(date +%Y%m%d%H%M%S)"
fi

"$plugin_dir/scripts/build-universal-agents-md.sh" "$target" >/dev/null
printf 'Installed Codex fallback instructions to %s\n' "$target"
