#!/usr/bin/env bash
set -euo pipefail

msg_file="${1:-}"
if [[ -z "$msg_file" || ! -f "$msg_file" ]]; then
  printf 'vibe-recipe: commit-msg hook requires a commit message file.\n' >&2
  exit 1
fi

first_line="$(sed -n '1p' "$msg_file")"
if ! printf '%s\n' "$first_line" | grep -Eq '^(feat|fix|refactor|docs|chore|test|build|ci|perf|style)(\([^)]+\))?!?: .+'; then
  printf 'vibe-recipe: commit message must follow Conventional Commits.\n' >&2
  exit 1
fi

if ! grep -Eq '^Refs: \.agent/spec/(active|done|archived|abandoned)/[0-9]{4}-[-a-z0-9]+\.md$' "$msg_file"; then
  printf 'vibe-recipe: commit message must include a spec Refs footer.\n' >&2
  exit 1
fi
