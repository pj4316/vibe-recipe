#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
plugin_dir="$(cd "$script_dir/.." && pwd)"
target_dir="${1:-.cursor/rules}"
mkdir -p "$target_dir"

target="$target_dir/vibe-recipe.mdc"
if [[ -e "$target" ]]; then
  cp "$target" "$target.bak.$(date +%Y%m%d%H%M%S)"
fi

"$plugin_dir/scripts/build-universal-agents-md.sh" "$target" >/dev/null
printf 'Installed Cursor rules to %s\n' "$target"
