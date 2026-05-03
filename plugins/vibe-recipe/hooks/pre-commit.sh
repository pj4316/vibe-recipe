#!/usr/bin/env bash
set -euo pipefail

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [[ "$branch" == "main" || "$branch" == "master" ]]; then
  printf 'vibe-recipe: direct commits to %s are blocked. Use a branch.\n' "$branch" >&2
  exit 1
fi

if [[ -n "${1:-}" && -f "$1" ]]; then
  msg_file="$1"
else
  msg_file=""
fi

if [[ -n "$msg_file" ]]; then
  first_line="$(sed -n '1p' "$msg_file")"
  if ! printf '%s\n' "$first_line" | grep -Eq '^(feat|fix|refactor|docs|chore|test|build|ci|perf|style)(\([^)]+\))?!?: .+'; then
    printf 'vibe-recipe: commit message must follow Conventional Commits.\n' >&2
    exit 1
  fi
  if ! grep -Eq '^Refs: \.agent/spec/(active|done|archived|abandoned)/[0-9]{4}-[-a-z0-9]+\.md$' "$msg_file"; then
    printf 'vibe-recipe: commit message must include a spec Refs footer.\n' >&2
    exit 1
  fi
fi

if command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect --source . --redact --no-banner
fi

verify_cmd=""
if [[ -f .agent/commands.json ]]; then
  verify_cmd="$(python3 - <<'PY'
import json
from pathlib import Path

path = Path(".agent/commands.json")
try:
    value = json.loads(path.read_text()).get("verify")
except Exception:
    value = None
if isinstance(value, str) and value.strip():
    print(value.strip())
PY
)"
fi

if [[ -n "$verify_cmd" ]]; then
  printf 'vibe-recipe: running project verify command: %s\n' "$verify_cmd" >&2
  bash -lc "$verify_cmd"
else
  printf 'vibe-recipe: project verify command not configured in .agent/commands.json; metadata checks only.\n' >&2
fi
