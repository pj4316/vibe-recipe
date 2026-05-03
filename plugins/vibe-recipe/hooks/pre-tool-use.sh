#!/usr/bin/env bash
set -euo pipefail

stdin_payload=""
if [[ ! -t 0 ]]; then
  stdin_payload="$(cat || true)"
fi

payload="${1:-} ${VIBE_RECIPE_TOOL_INPUT:-} ${stdin_payload}"
sanitized_payload="${payload//.env.example/}"

deny() {
  printf 'vibe-recipe pre-tool-use blocked: %s\n' "$1" >&2
  exit 1
}

case "$payload" in
  *"rm -rf /"*|*"git reset --hard"*|*"git push --force"*|*"DROP DATABASE"*|*"chmod -R 777"*)
    deny "dangerous command pattern"
    ;;
esac

case "$payload" in
  *".agent/constitution.md"*|*".agent/spec/INDEX.md"*|*".git/"*)
    if [[ "${VIBE_RECIPE_ALLOW_PROTECTED_WRITE:-}" != "1" ]]; then
      deny "protected file access requires explicit override"
    fi
    ;;
esac

case "$sanitized_payload" in
  *".env"*)
    if [[ "${VIBE_RECIPE_ALLOW_PROTECTED_WRITE:-}" != "1" ]]; then
      deny "protected file access requires explicit override"
    fi
    ;;
esac

exit 0
