#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
plugin_dir="$(cd "$script_dir/.." && pwd)"
out="${1:-AGENTS.md}"

append_kitchen_examples() {
  local examples_dir="$plugin_dir/skills/kitchen/examples"
  local example
  local preset_type
  local packet_name

  [ -d "$examples_dir" ] || return 0

  printf '\n## Kitchen Preset References\n\n'
  cat <<'EOF'
These preset/theme references are embedded here so fallback installations remain self-contained.
Use them as the authoring source when slash commands are unavailable. Generated target-project
documents should keep the selected preset/theme name and injected values, not these plugin paths.
EOF
  printf '\n'

  while IFS= read -r example; do
    preset_type="$(basename "$(dirname "$example")")"
    packet_name="$(basename "$example" .md)"
    if [[ "$packet_name" == "$preset_type" ]]; then
      printf '\n<!-- kitchen-preset: %s -->\n\n' "$packet_name"
    else
      printf '\n<!-- kitchen-preset: %s / %s -->\n\n' "$preset_type" "$packet_name"
    fi
    cat "$example"
    printf '\n'
  done < <(find "$examples_dir" -type f | sort)
}

{
  printf '# vibe-recipe Universal Agent Instructions\n\n'
  printf 'Use these instructions when slash commands are unavailable. Natural language examples: "use kitchen", "use recipe", "taste the changes".\n\n'
  printf '## Core Contract\n\n'
  cat <<'EOF'
You are working with the vibe-recipe workflow.

- Start meaningful product or behavior changes with `recipe` so requirements, acceptance criteria, task breakdown, verification, and human gates are explicit.
- Use `kitchen` to initialize, adopt, heal, or adjust the project harness. Do not use feature work to patch harness files ad hoc.
- Use `peek` for read-only status before changing direction.
- Use `forage` before `recipe` when library, vendor, API, architecture, or approach choices are unclear.
- Use `cook` only for approved or in-progress specs. It orchestrates task work and preserves recipe scope.
- Use `fix` for failing tests, regressions, production symptoms, or review/release blockers.
- Use `tidy` only for behavior-preserving refactors and prove equivalence with tests, snapshots, commands, or manual checks.
- Use `taste` after `cook`, `fix`, or `tidy` to review acceptance coverage, regression evidence, security, red-team risk, and next loop.
- Use `wrap` to prepare version and changelog after `taste APPROVE`.
- Use `serve` to run release gates and create a local annotated tag. Never push, deploy, publish, or approve human-gated actions automatically.
- Use `autopilot` only after explicit opt-in. It never approves specs, `serve`, push, deploy, publish, payment, auth, or data-loss decisions.

Respect existing project instructions, user changes, and dirty working trees. Read repo facts before asking questions that can be answered locally. If harness files are missing, recommend `kitchen` instead of inventing local conventions.
EOF
  printf '\n\n## Skills\n\n'
  for skill in "$plugin_dir"/skills/*/SKILL.md; do
    local_skill="$(basename "$(dirname "$skill")")"
    printf '\n<!-- %s -->\n\n' "$local_skill"
    cat "$skill"
    printf '\n'
    if [[ "$local_skill" == "kitchen" ]]; then
      append_kitchen_examples
    fi
  done
  printf '\n## Subagents\n\n'
  for agent in "$plugin_dir"/agents/*.md; do
    printf '\n<!-- %s -->\n\n' "$(basename "$agent")"
    cat "$agent"
    printf '\n'
  done
} > "$out"

printf 'Wrote %s\n' "$out"
