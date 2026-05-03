#!/usr/bin/env bash
set -euo pipefail

memory=".agent/memory/MEMORY.md"
agent="${VIBE_RECIPE_AGENT_NAME:-subagent}"
summary="${VIBE_RECIPE_AGENT_SUMMARY:-completed}"

if [[ -f "$memory" ]]; then
  printf -- '- %s: %s: %s\n' "$(date +%Y-%m-%d)" "$agent" "$summary" >> "$memory"
fi
