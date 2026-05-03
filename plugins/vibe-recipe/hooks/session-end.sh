#!/usr/bin/env bash
set -euo pipefail

if [[ -d .agent/spec ]]; then
  active_files="$(find .agent/spec/active -maxdepth 1 -type f -name '[0-9][0-9][0-9][0-9]-*.md' 2>/dev/null | sort || true)"
  done_files="$(find .agent/spec/done -maxdepth 1 -type f -name '[0-9][0-9][0-9][0-9]-*.md' 2>/dev/null | sort || true)"
  abandoned_count="$(find .agent/spec/abandoned -maxdepth 1 -type f -name '[0-9][0-9][0-9][0-9]-*.md' 2>/dev/null | wc -l | tr -d ' ' || true)"
  archived_count="$(find .agent/spec/archived -maxdepth 1 -type f -name '[0-9][0-9][0-9][0-9]-*.md' 2>/dev/null | wc -l | tr -d ' ' || true)"
  active_count="$(printf '%s\n' "$active_files" | sed '/^$/d' | wc -l | tr -d ' ')"
  done_count="$(printf '%s\n' "$done_files" | sed '/^$/d' | wc -l | tr -d ' ')"
  total_count=$((active_count + done_count + abandoned_count + archived_count))

  {
    printf '# Spec Index\n\n'
    printf '_Last regenerated: %s by session-end. Do not edit by hand._\n\n' "$(date +%Y-%m-%d)"
    printf '## Active (%s)\n\n' "$active_count"
    printf '| # | Title | Status | Branch | Updated |\n'
    printf '| --- | --- | --- | --- | --- |\n'
    printf '%s\n' "$active_files" | sed '/^$/d' | while IFS= read -r spec; do
      base="$(basename "$spec" .md)"
      num="${base%%-*}"
      title="${base#*-}"
      printf '| %s | %s | unknown | unknown | unknown |\n' "$num" "$title"
    done
    printf '\n## Done (last 10 of %s)\n\n' "$done_count"
    printf '| # | Title | Released | PR |\n'
    printf '| --- | --- | --- | --- |\n'
    printf '%s\n' "$done_files" | sed '/^$/d' | tail -n 10 | while IFS= read -r spec; do
      base="$(basename "$spec" .md)"
      num="${base%%-*}"
      title="${base#*-}"
      printf '| %s | %s | unknown | unknown |\n' "$num" "$title"
    done
    printf '\n## Stats\n\n'
    printf -- '- Total: %s | Active: %s / Done: %s / Abandoned: %s / Archived: %s\n' "$total_count" "$active_count" "$done_count" "$abandoned_count" "$archived_count"
  } > .agent/spec/INDEX.md
fi

if [[ -f .agent/memory/MEMORY.md ]]; then
  tmp="$(mktemp)"
  tail -n 200 .agent/memory/MEMORY.md > "$tmp"
  mv "$tmp" .agent/memory/MEMORY.md
fi
