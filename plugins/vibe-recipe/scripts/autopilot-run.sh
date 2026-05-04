#!/usr/bin/env bash
set -euo pipefail

repo="."
tool="codex"
max_iterations=10
max_followups=3
max_same_recommendation_retries=2
max_taste_loops=3
stop_point="taste"
dry_run=0
once=0
status_only=0

usage() {
  cat <<'USAGE'
Usage: autopilot-run.sh [options]

Options:
  --repo DIR                 Target repository root. Default: .
  --tool codex|claude        Fresh agent CLI to run. Default: codex.
  --max-iterations N         Maximum fresh-agent iterations. Default: 10.
  --max-followups N          Maximum cook/fix follow-up attempts after taste. Default: 3.
  --max-same-recommendation-retries N
                             Maximum consecutive retries for the same cook/fix recommendation. Default: 2.
  --max-taste-loops N        Maximum REQUEST_CHANGES taste loops. Default: 3.
  --stop-point taste|wrap    Stop after taste report or wrap summary. Default: taste.
  --dry-run                  Print the next prompt and update no files.
  --once                     Run at most one fresh-agent iteration.
  --status                   Show active spec and next task without running an agent.
  -h, --help                 Show this help.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      repo="$2"
      shift 2
      ;;
    --repo=*)
      repo="${1#*=}"
      shift
      ;;
    --tool)
      tool="$2"
      shift 2
      ;;
    --tool=*)
      tool="${1#*=}"
      shift
      ;;
    --max-iterations)
      max_iterations="$2"
      shift 2
      ;;
    --max-iterations=*)
      max_iterations="${1#*=}"
      shift
      ;;
    --max-followups)
      max_followups="$2"
      shift 2
      ;;
    --max-followups=*)
      max_followups="${1#*=}"
      shift
      ;;
    --max-same-recommendation-retries)
      max_same_recommendation_retries="$2"
      shift 2
      ;;
    --max-same-recommendation-retries=*)
      max_same_recommendation_retries="${1#*=}"
      shift
      ;;
    --max-taste-loops)
      max_taste_loops="$2"
      shift 2
      ;;
    --max-taste-loops=*)
      max_taste_loops="${1#*=}"
      shift
      ;;
    --stop-point)
      stop_point="$2"
      shift 2
      ;;
    --stop-point=*)
      stop_point="${1#*=}"
      shift
      ;;
    --dry-run)
      dry_run=1
      shift
      ;;
    --once)
      once=1
      shift
      ;;
    --status)
      status_only=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown option: %s\n' "$1" >&2
      usage >&2
      exit 64
      ;;
  esac
done

if [[ "$tool" != "codex" && "$tool" != "claude" ]]; then
  printf 'Unsupported --tool %s. Expected codex or claude.\n' "$tool" >&2
  exit 64
fi

if [[ "$stop_point" != "taste" && "$stop_point" != "wrap" ]]; then
  printf 'Unsupported --stop-point %s. Expected taste or wrap.\n' "$stop_point" >&2
  exit 64
fi

if ! [[ "$max_iterations" =~ ^[0-9]+$ ]] || [[ "$max_iterations" -lt 1 ]]; then
  printf '%s\n' '--max-iterations must be a positive integer.' >&2
  exit 64
fi

if ! [[ "$max_followups" =~ ^[0-9]+$ ]] || [[ "$max_followups" -lt 1 ]]; then
  printf '%s\n' '--max-followups must be a positive integer.' >&2
  exit 64
fi

if ! [[ "$max_same_recommendation_retries" =~ ^[0-9]+$ ]] || [[ "$max_same_recommendation_retries" -lt 1 ]]; then
  printf '%s\n' '--max-same-recommendation-retries must be a positive integer.' >&2
  exit 64
fi

if ! [[ "$max_taste_loops" =~ ^[0-9]+$ ]] || [[ "$max_taste_loops" -lt 1 ]]; then
  printf '%s\n' '--max-taste-loops must be a positive integer.' >&2
  exit 64
fi

repo="$(cd "$repo" && pwd)"
agent_dir="$repo/.agent"
autopilot_dir="$agent_dir/autopilot"
state_file="$autopilot_dir/state.json"
progress_file="$autopilot_dir/progress.md"

require_tool() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Required command not found: %s\n' "$1" >&2
    exit 69
  fi
}

require_tool jq

if [[ "$dry_run" -eq 0 && "$status_only" -eq 0 ]]; then
  require_tool "$tool"
fi

init_progress() {
  if [[ "$dry_run" -eq 1 ]]; then
    return 0
  fi

  if [[ ! -f "$progress_file" ]]; then
    {
      printf '# Autopilot Progress\n\n'
      printf 'Append-only progress log for fresh autopilot iterations.\n'
    } > "$progress_file"
  fi
}

write_state() {
  if [[ "$dry_run" -eq 1 ]]; then
    return 0
  fi

  local spec_path="$1"
  local iteration="$2"
  local last_task="$3"
  local last_status="$4"

  jq -n \
    --arg spec "$spec_path" \
    --arg stop "$stop_point" \
    --arg tool "$tool" \
    --arg last_task "$last_task" \
    --arg last_status "$last_status" \
    --argjson iteration "$iteration" \
    --arg updated_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{
      activeSpec: $spec,
      iteration: $iteration,
      stopPoint: $stop,
      tool: $tool,
      lastTask: $last_task,
      lastStatus: $last_status,
      updatedAt: $updated_at
    }' > "$state_file"
}

append_progress() {
  if [[ "$dry_run" -eq 1 ]]; then
    return 0
  fi

  local title="$1"
  local body="$2"

  init_progress
  {
    printf '\n## %s - %s\n\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$title"
    printf '%s\n' "$body"
  } >> "$progress_file"
}

next_agent_iteration() {
  if (( agent_runs >= max_iterations )); then
    append_progress "Max iterations reached" "- Max iterations: $max_iterations"$'\n'"- Reason: fresh-agent budget exhausted before the next phase."
    write_state "$spec_rel" "$agent_runs" "" "max_iterations"
    printf 'BLOCKED: reached max iterations (%s).\n' "$max_iterations" >&2
    exit 1
  fi

  agent_runs=$((agent_runs + 1))
  next_agent_iteration_id="$agent_runs"
}

ensure_handoffs_dir() {
  if [[ "$dry_run" -eq 1 ]]; then
    return 0
  fi

  mkdir -p "$agent_dir/spec/handoffs"
}

active_spec() {
  if [[ ! -d "$agent_dir/spec/active" ]]; then
    return 0
  fi

  find "$agent_dir/spec/active" -maxdepth 1 -type f -name '[0-9][0-9][0-9][0-9]-*.md' 2>/dev/null | sort | head -n 1
}

spec_number_from_path() {
  basename "$1" | sed -E 's/^([0-9]{4}).*/\1/'
}

spec_status() {
  awk -F': *' '/^Status:/ {print $2; exit}' "$1"
}

task_count() {
  grep -Ec '^- \[[ xX]\] Task [0-9]+:' "$1" || true
}

done_task_count() {
  grep -Ec '^- \[[xX]\] Task [0-9]+:' "$1" || true
}

next_task_line() {
  grep -nE '^- \[ \] Task [0-9]+:' "$1" | head -n 1 || true
}

task_number_from_line() {
  sed -E 's/^[0-9]+:- \[ \] Task ([0-9]+):.*/\1/'
}

task_title_from_line() {
  sed -E 's/^[0-9]+:- \[ \] Task [0-9]+: *//'
}

relative_path() {
  local path="$1"
  case "$path" in
    "$repo"/*) printf '%s\n' "${path#"$repo"/}" ;;
    *) printf '%s\n' "$path" ;;
  esac
}

ensure_clean_tree() {
  if ! git -C "$repo" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    printf 'BLOCKED: %s is not a git repository.\n' "$repo" >&2
    exit 2
  fi

  local dirty
  dirty="$(git -C "$repo" status --short)"
  if [[ -n "$dirty" ]]; then
    printf 'BLOCKED: working tree is not clean. Autopilot will not mix unrelated changes.\n' >&2
    printf '%s\n' "$dirty" >&2
    exit 2
  fi
}

mark_task_done() {
  local spec="$1"
  local task_number="$2"
  local tmp
  tmp="$(mktemp)"
  awk -v task="$task_number" '
    BEGIN { done = 0 }
    $0 ~ "^- \\[ \\] Task " task ":" && done == 0 {
      sub(/^- \[ \]/, "- [x]")
      done = 1
    }
    { print }
  ' "$spec" > "$tmp"
  mv "$tmp" "$spec"
}

task_handoff_path() {
  local spec="$1"
  local task_number="$2"
  local spec_number
  spec_number="$(spec_number_from_path "$spec")"
  printf '%s\n' "$agent_dir/spec/handoffs/${spec_number}-task${task_number}.md"
}

taste_report_path() {
  local spec="$1"
  local spec_number
  spec_number="$(spec_number_from_path "$spec")"
  printf '%s\n' "$agent_dir/spec/handoffs/${spec_number}-taste.md"
}

latest_taste_report() {
  local spec="$1"
  local report
  report="$(taste_report_path "$spec")"

  if [[ -f "$report" ]]; then
    printf '%s\n' "$report"
  fi
}

autopilot_verdict_from_output() {
  local output_file="$1"

  if grep -q '<autopilot>APPROVE</autopilot>' "$output_file"; then
    printf '%s\n' 'APPROVE'
    return 0
  fi

  if grep -q '<autopilot>REQUEST_CHANGES</autopilot>' "$output_file"; then
    printf '%s\n' 'REQUEST_CHANGES'
    return 0
  fi

  if grep -q '<autopilot>BLOCKED</autopilot>' "$output_file"; then
    printf '%s\n' 'BLOCK'
    return 0
  fi
}

output_excerpt() {
  local output_file="$1"

  awk '
    /<autopilot>/ { next }
    NF == 0 { next }
    { print }
  ' "$output_file" | sed -n '1,12p'
}

recommended_followup_from_output() {
  local output_file="$1"
  local recommendation

  recommendation="$(grep -Eio '\b(cook|fix)\b' "$output_file" | head -n 1 | tr '[:upper:]' '[:lower:]' || true)"
  if [[ -n "$recommendation" ]]; then
    printf '%s\n' "$recommendation"
  fi
}

taste_blocker_count() {
  local report="$1"

  if [[ ! -f "$report" ]]; then
    printf '0\n'
    return 0
  fi

  awk '
    /^## Findings/ { in_section = 1; next }
    /^## / && in_section { exit }
    in_section && /BLOCKER/ { count += 1 }
    END { print count + 0 }
  ' "$report"
}

taste_fingerprint() {
  local report="$1"

  if [[ ! -f "$report" ]]; then
    return 0
  fi

  awk '
    /^## Findings/ { in_findings = 1; print; next }
    /^## Coverage Gap/ { in_findings = 0; in_gap = 1; print; next }
    /^## Loop Recommendation/ { in_gap = 0; in_loop = 1; print; next }
    /^## / { in_findings = 0; in_gap = 0; in_loop = 0 }
    in_findings || in_gap || in_loop { print }
  ' "$report" | tr '[:upper:]' '[:lower:]' | sed 's/[[:space:]]\+/ /g' | cksum | awk '{print $1 ":" $2}'
}

write_output_bullets() {
  local output_file="$1"
  local excerpt

  excerpt="$(output_excerpt "$output_file")"
  if [[ -n "$excerpt" ]]; then
    printf '%s\n' "$excerpt" | sed 's/^/- /'
    return 0
  fi

  printf '%s\n' '- fresh-agent output was empty; runner only observed the completion tag.'
}

write_self_healed_task_handoff() {
  local path="$1"
  local spec_rel="$2"
  local task_number="$3"
  local task_title="$4"
  local output_file="$5"

  ensure_handoffs_dir
  {
    printf '# Task Handoff: Task %s\n' "$task_number"
    printf 'Status: done\n'
    printf 'Source spec: %s\n' "$spec_rel"
    printf 'Generated by: autopilot runner self-heal\n'
    printf 'Task: %s\n\n' "$task_title"
    printf '## Summary\n'
    printf 'Fresh agent returned `<autopilot>DONE</autopilot>`, but the expected task handoff file was missing. The runner synthesized this handoff to keep coordination state aligned.\n\n'
    printf '## Evidence\n'
    write_output_bullets "$output_file"
    printf '\n## Next\n'
    printf 'Use the existing spec and diff as the source of truth if a richer handoff is needed later.\n'
  } > "$path"
}

write_self_healed_followup_handoff() {
  local path="$1"
  local spec_rel="$2"
  local recommended_skill="$3"
  local output_file="$4"

  ensure_handoffs_dir
  {
    printf '# %s Follow-up Handoff\n' "$(printf '%s' "$recommended_skill" | tr '[:lower:]' '[:upper:]')"
    printf 'Status: done\n'
    printf 'Source spec: %s\n' "$spec_rel"
    printf 'Generated by: autopilot runner self-heal\n'
    printf 'Loop skill: %s\n\n' "$recommended_skill"
    printf '## Summary\n'
    printf 'Fresh agent returned `<autopilot>DONE</autopilot>`, but the expected follow-up handoff file was missing. The runner synthesized this handoff so the loop can continue without user cleanup.\n\n'
    printf '## Evidence\n'
    write_output_bullets "$output_file"
    printf '\n## Next\n'
    printf 'Re-run `taste` against the current diff and this spec.\n'
  } > "$path"
}

write_self_healed_taste_report() {
  local path="$1"
  local spec="$2"
  local spec_rel="$3"
  local verdict="$4"
  local recommended_skill="$5"
  local output_file="$6"
  local spec_base
  local spec_number
  local spec_slug
  local next_skill

  spec_base="$(basename "$spec" .md)"
  spec_number="$(spec_number_from_path "$spec")"
  spec_slug="${spec_base#*-}"
  next_skill="recipe"

  if [[ "$verdict" == "APPROVE" ]]; then
    next_skill="wrap"
  elif [[ "$verdict" == "REQUEST_CHANGES" ]]; then
    next_skill="${recommended_skill:-cook}"
  fi

  ensure_handoffs_dir
  {
    printf '# Taste Report: %s %s\n' "$spec_number" "$spec_slug"
    printf 'Verdict: %s\n' "$verdict"
    printf 'Reason: runner self-healed a missing taste report from the fresh-agent verdict.\n'
    printf 'Source spec: %s\n' "$spec_rel"
    printf 'Diff scope: current working tree for the active spec\n'
    printf 'Handoff source: autopilot runner self-heal\n'
    printf 'Evidence refs:\n'
    printf '%s\n\n' '- Fresh-agent output captured by the runner for this iteration.'
    printf '## Summary\n'
    printf 'Fresh agent returned `%s`, but the expected taste report file was missing. The runner synthesized this report so downstream coordination can proceed without manual cleanup.\n\n' "$verdict"
    printf '## Verification\n'
    printf '%s\n' '- Regression: see evidence excerpt below.'
    printf '%s\n' '- Acceptance coverage: not normalized by the runner.'
    printf '%s\n' '- Project verify: not normalized by the runner.'
    printf '%s\n' '- Manual checks: not recorded by the runner.'
    printf '\n## Findings\n'
    printf '%s\n' '- CONCERN: the original taste iteration omitted its structured report, so this synthesized report preserves only the runner-visible evidence.'
    printf '\n## Coverage Gap\n'
    printf 'The original iteration did not leave the expected structured taste artifact.\n\n'
    printf '## Loop Recommendation\n'
    printf 'Recommended skill: %s\n' "$next_skill"
    if [[ "$verdict" == "REQUEST_CHANGES" ]]; then
      printf 'Reason: continue the bounded loop with `%s` based on the fresh-agent verdict and output hints.\n' "$next_skill"
    else
      printf 'Reason: proceed according to the verdict while keeping the synthesized report as the coordination source.\n'
    fi
    printf '\n## Evidence Excerpt\n'
    write_output_bullets "$output_file"
  } > "$path"
}

task_handoff_exists() {
  local spec="$1"
  local task_number="$2"
  local handoff
  handoff="$(task_handoff_path "$spec" "$task_number")"

  [[ -f "$handoff" ]]
}

followup_handoff_path() {
  local spec="$1"
  local skill="$2"
  local spec_number
  spec_number="$(spec_number_from_path "$spec")"
  printf '%s\n' "$agent_dir/spec/handoffs/${spec_number}-${skill}-followup.md"
}

taste_loop_recommendation() {
  local report="$1"

  if [[ ! -f "$report" ]]; then
    return 0
  fi

  awk '
    /^## Loop Recommendation/ { in_section = 1; next }
    /^## / && in_section { exit }
    in_section { print }
  ' "$report" | grep -Eo '\b(cook|fix)\b' | head -n 1 || true
}

build_task_prompt() {
  local spec_rel="$1"
  local task_number="$2"
  local task_title="$3"
  local spec_number
  spec_number="$(basename "$spec_rel" | sed -E 's/^([0-9]{4}).*/\1/')"

  cat <<PROMPT
You are a fresh vibe-recipe autopilot iteration. Work in exactly one bounded slice.

Read:
- AGENTS.md
- $spec_rel
- .agent/commands.json
- .agent/autopilot/progress.md if present
- relevant handoffs under .agent/spec/handoffs/

Task:
- Use the cook/dev contract.
- Implement only Task $task_number: $task_title
- Preserve unrelated user changes and do not expand scope.
- Do not mark the task checkbox yourself; the runner will mark it after completion.
- Write or update the task handoff at .agent/spec/handoffs/${spec_number}-task${task_number}.md.
- Run the focused check for this task, then the relevant test command, and verify when practical.

Forbidden:
- Do not run serve.
- Do not push, deploy, publish, or call external release APIs.
- Do not approve specs or human-gated work.
- Stop if auth/payment/data-loss/external side effects require human approval.

Final response contract:
- If the task is complete and checks pass, include exactly: <autopilot>DONE</autopilot>
- If blocked or approval is needed, include exactly: <autopilot>BLOCKED</autopilot>
- Include concise evidence paths and command results. Do not paste long logs.
PROMPT
}

build_taste_prompt() {
  local spec_rel="$1"
  local spec_number="$2"
  local taste_report_rel=".agent/spec/handoffs/${spec_number}-taste.md"

  cat <<PROMPT
You are a fresh vibe-recipe autopilot review iteration.

Use the taste/review contract for $spec_rel.
Read AGENTS.md, the active spec, cook/task handoffs, git diff, and .agent/commands.json.
Write the taste report to $taste_report_rel.
Do not modify product code or spec scope.

Final response contract:
- If verdict is APPROVE, include exactly: <autopilot>APPROVE</autopilot>
- If verdict is REQUEST_CHANGES, include exactly: <autopilot>REQUEST_CHANGES</autopilot>
- If verdict is BLOCK, include exactly: <autopilot>BLOCKED</autopilot>
PROMPT
}

build_wrap_prompt() {
  local spec_rel="$1"
  local taste_report_rel="$2"

  cat <<PROMPT
You are a fresh vibe-recipe release-prep iteration.

Use the wrap/bump contract.
Read AGENTS.md, $spec_rel, $taste_report_rel, release commit range, and .agent/commands.json.
Resolve exact release files before editing:
- Version source: use one public manifest path if the repo already has one; if the repo intentionally keeps mirrored public manifests in sync, treat that mirrored set as the version source; otherwise use '.agent/release-manifest.json'.
- Changelog source: use the repo's existing release notes file if one already exists; otherwise use 'CHANGELOG.md' at the repo root.
- Choose one canonical changelog source. For versioning, either choose one canonical source or one mirrored manifest set, cite the exact path or paths in the wrap summary, and do not update unrelated competing files.
Prepare version/changelog only if taste verdict is APPROVE and verify is configured.
Do not tag, push, deploy, publish, or run serve.

Final response contract:
- If wrap summary is complete, include exactly: <autopilot>WRAPPED</autopilot>
- If blocked or approval is needed, include exactly: <autopilot>BLOCKED</autopilot>
PROMPT
}

build_followup_prompt() {
  local spec_rel="$1"
  local taste_report_rel="$2"
  local recommended_skill="$3"
  local followup_handoff_rel="$4"

  cat <<PROMPT
You are a fresh vibe-recipe autopilot follow-up iteration.

Use the ${recommended_skill} contract for $spec_rel.
Read AGENTS.md, $spec_rel, $taste_report_rel, relevant task handoffs, and .agent/commands.json.
Address the current REQUEST_CHANGES findings without expanding scope.
Write or update the follow-up handoff at $followup_handoff_rel.
Run the focused check for this follow-up, then the relevant test command, and verify when practical.

Forbidden:
- Do not run serve.
- Do not push, deploy, publish, or call external release APIs.
- Do not approve specs or human-gated work.
- Stop if auth/payment/data-loss/external side effects require human approval.

Final response contract:
- If the follow-up is complete and checks pass, include exactly: <autopilot>DONE</autopilot>
- If blocked or approval is needed, include exactly: <autopilot>BLOCKED</autopilot>
- Include concise evidence paths and command results. Do not paste long logs.
PROMPT
}

run_fresh_agent() {
  local prompt="$1"
  local output_file="$2"
  local prompt_file
  prompt_file="$(mktemp)"
  printf '%s\n' "$prompt" > "$prompt_file"

  if [[ "$dry_run" -eq 1 ]]; then
    printf '%s\n' "$prompt"
    rm -f "$prompt_file"
    return 0
  fi

  if [[ "$tool" == "codex" ]]; then
    codex exec --cd "$repo" --sandbox workspace-write - < "$prompt_file" | tee "$output_file"
  else
    (cd "$repo" && claude --print < "$prompt_file") | tee "$output_file"
  fi

  rm -f "$prompt_file"
}

print_status() {
  local spec="$1"
  local status="$2"
  local next_line="$3"
  local total="$4"
  local done="$5"

  printf 'Autopilot status\n'
  printf '%s\n' "- Repo: $repo"
  printf '%s\n' "- Active spec: $(relative_path "$spec")"
  printf '%s\n' "- Spec status: $status"
  printf '%s\n' "- Tasks: $done/$total done"
  if [[ -n "$next_line" ]]; then
    printf '%s\n' "- Next task: Task $(printf '%s\n' "$next_line" | task_number_from_line) - $(printf '%s\n' "$next_line" | task_title_from_line)"
  else
    printf '%s\n' '- Next task: none'
  fi
}

spec="$(active_spec)"
if [[ -z "$spec" ]]; then
  printf 'BLOCKED: no active spec found under .agent/spec/active/.\n' >&2
  exit 2
fi

status="$(spec_status "$spec")"
if [[ "$status" != "Approved" && "$status" != "In Progress" ]]; then
  printf 'PAUSED: active spec is %s. Autopilot requires Approved or In Progress.\n' "$status" >&2
  exit 2
fi

next_line="$(next_task_line "$spec")"
total="$(task_count "$spec")"
done_count="$(done_task_count "$spec")"
spec_rel="$(relative_path "$spec")"

if [[ "$status_only" -eq 1 ]]; then
  print_status "$spec" "$status" "$next_line" "$total" "$done_count"
  exit 0
fi

if [[ "$dry_run" -eq 0 ]]; then
  ensure_clean_tree
  mkdir -p "$autopilot_dir"
fi

write_state "$spec_rel" 0 "" "started"
append_progress "Run started" "- Spec: $spec_rel"$'\n'"- Tool: $tool"$'\n'"- Stop point: $stop_point"$'\n'"- Max iterations: $max_iterations"$'\n'"- Max follow-ups: $max_followups"$'\n'"- Max same recommendation retries: $max_same_recommendation_retries"$'\n'"- Max taste loops: $max_taste_loops"
agent_runs=0
followup_count=0
taste_loop_count=0
last_recommendation=""
same_recommendation_count=0
last_taste_fingerprint=""
last_taste_blockers=-1

for iteration in $(seq 1 "$max_iterations"); do
  next_line="$(next_task_line "$spec")"

  if [[ -n "$next_line" ]]; then
    next_agent_iteration
    run_iteration="$next_agent_iteration_id"
    task_number="$(printf '%s\n' "$next_line" | task_number_from_line)"
    task_title="$(printf '%s\n' "$next_line" | task_title_from_line)"
    task_handoff="$(task_handoff_path "$spec" "$task_number")"
    output_file="$(mktemp)"
    prompt="$(build_task_prompt "$spec_rel" "$task_number" "$task_title")"

    write_state "$spec_rel" "$run_iteration" "Task $task_number" "running"
    append_progress "Iteration $run_iteration started" "- Task: Task $task_number - $task_title"
    run_fresh_agent "$prompt" "$output_file"

    if [[ "$dry_run" -eq 1 ]]; then
      rm -f "$output_file"
      exit 0
    fi

    if grep -q '<autopilot>DONE</autopilot>' "$output_file"; then
      if ! task_handoff_exists "$spec" "$task_number"; then
        write_self_healed_task_handoff "$task_handoff" "$spec_rel" "$task_number" "$task_title" "$output_file"
        append_progress "Task $task_number self-healed" "- Task: $task_title"$'\n'"- Runner synthesized the missing task handoff: $(relative_path "$task_handoff")"
      fi

      mark_task_done "$spec" "$task_number"
      append_progress "Task $task_number done" "- Task: $task_title"$'\n'"- Output: <autopilot>DONE</autopilot>"
      write_state "$spec_rel" "$run_iteration" "Task $task_number" "done"
      git -C "$repo" add -A
      git -C "$repo" commit -m "chore(autopilot): complete Task $task_number" -m "Refs: $spec_rel"
      rm -f "$output_file"
      if [[ "$once" -eq 1 ]]; then
        printf 'PAUSED: completed one iteration.\n'
        exit 0
      fi
      continue
    fi

    append_progress "Task $task_number blocked" "- Task: $task_title"$'\n'"- Output did not report DONE."
    write_state "$spec_rel" "$run_iteration" "Task $task_number" "blocked"
    rm -f "$output_file"
    printf 'BLOCKED: fresh agent did not complete Task %s.\n' "$task_number" >&2
    exit 2
  fi

  next_agent_iteration
  run_iteration="$next_agent_iteration_id"
  output_file="$(mktemp)"
  spec_number="$(spec_number_from_path "$spec")"
  prompt="$(build_taste_prompt "$spec_rel" "$spec_number")"
  write_state "$spec_rel" "$run_iteration" "taste" "running"
  append_progress "Iteration $run_iteration started" "- Phase: taste"$'\n'"- Spec: $spec_rel"
  run_fresh_agent "$prompt" "$output_file"

  if [[ "$dry_run" -eq 1 ]]; then
    rm -f "$output_file"
    exit 0
  fi

  taste_report="$(latest_taste_report "$spec")"
  taste_verdict="$(autopilot_verdict_from_output "$output_file")"
  if [[ -z "$taste_report" && -n "$taste_verdict" ]]; then
    recommended_skill="$(recommended_followup_from_output "$output_file")"
    write_self_healed_taste_report "$(taste_report_path "$spec")" "$spec" "$spec_rel" "$taste_verdict" "$recommended_skill" "$output_file"
    taste_report="$(latest_taste_report "$spec")"
    append_progress "Taste self-healed" "- Verdict: $taste_verdict"$'\n'"- Runner synthesized the missing taste report: $(relative_path "$taste_report")"
  fi

  if [[ "$taste_verdict" == "APPROVE" ]] || { [[ -n "$taste_report" ]] && grep -q 'Verdict: APPROVE' "$taste_report"; }; then
    if [[ -z "$taste_report" ]]; then
      append_progress "Taste blocked" "- Verdict was APPROVE but no spec-specific taste report could be synthesized."
      write_state "$spec_rel" "$run_iteration" "taste" "blocked"
      rm -f "$output_file"
      printf 'BLOCKED: taste approved but no spec-specific taste report was available.\n' >&2
      exit 2
    fi

    append_progress "Taste approved" "- Taste report: ${taste_report:-from fresh-agent output}"
    write_state "$spec_rel" "$run_iteration" "taste" "approved"
    if [[ "$stop_point" == "taste" ]]; then
      printf '<promise>COMPLETE</promise>\n'
      rm -f "$output_file"
      exit 0
    fi

    next_agent_iteration
    wrap_iteration="$next_agent_iteration_id"
    wrap_output="$(mktemp)"
    wrap_prompt="$(build_wrap_prompt "$spec_rel" "$(relative_path "$taste_report")")"
    write_state "$spec_rel" "$wrap_iteration" "wrap" "running"
    append_progress "Iteration $wrap_iteration started" "- Phase: wrap"$'\n'"- Stop point: wrap"
    run_fresh_agent "$wrap_prompt" "$wrap_output"

    if grep -q '<autopilot>WRAPPED</autopilot>' "$wrap_output"; then
      append_progress "Wrap complete" "- Output: <autopilot>WRAPPED</autopilot>"
      write_state "$spec_rel" "$wrap_iteration" "wrap" "wrapped"
      printf '<promise>COMPLETE</promise>\n'
      rm -f "$output_file" "$wrap_output"
      exit 0
    fi

    append_progress "Wrap blocked" "- Output did not report WRAPPED."
    write_state "$spec_rel" "$wrap_iteration" "wrap" "blocked"
    rm -f "$output_file" "$wrap_output"
    printf 'BLOCKED: wrap did not complete.\n' >&2
    exit 2
  fi

  if [[ "$taste_verdict" == "REQUEST_CHANGES" ]]; then
    write_state "$spec_rel" "$run_iteration" "taste" "request_changes"
    if [[ "$once" -eq 1 ]]; then
      rm -f "$output_file"
      printf 'PAUSED: taste requested changes.\n'
      exit 2
    fi

    if (( followup_count >= max_followups )); then
      rm -f "$output_file"
      append_progress "Taste blocked" "- Reason: follow-up budget exhausted"$'\n'"- Follow-ups used: $followup_count/$max_followups"
      printf 'BLOCKED: taste requested changes after follow-up budget was exhausted.\n' >&2
      exit 2
    fi

    if [[ -z "$taste_report" ]]; then
      rm -f "$output_file"
      printf 'BLOCKED: taste requested changes but no spec-specific taste report was written.\n' >&2
      exit 2
    fi

    recommended_skill="$(taste_loop_recommendation "$taste_report")"
    if [[ -z "$recommended_skill" ]]; then
      recommended_skill="$(recommended_followup_from_output "$output_file")"
    fi
    if [[ -z "$recommended_skill" ]]; then
      recommended_skill="cook"
    fi

    current_taste_blockers="$(taste_blocker_count "$taste_report")"
    current_taste_fingerprint="$(taste_fingerprint "$taste_report")"
    taste_loop_count=$((taste_loop_count + 1))

    if [[ "$recommended_skill" == "$last_recommendation" ]]; then
      same_recommendation_count=$((same_recommendation_count + 1))
    else
      same_recommendation_count=1
    fi

    progress_reason="first request-changes loop"
    if [[ -n "$last_taste_fingerprint" ]]; then
      if [[ "$current_taste_fingerprint" == "$last_taste_fingerprint" && "$recommended_skill" == "$last_recommendation" && "$current_taste_blockers" -ge "$last_taste_blockers" ]]; then
        progress_reason="no structural change: same findings, same recommendation, blockers did not decrease"
      elif [[ "$current_taste_blockers" -lt "$last_taste_blockers" ]]; then
        progress_reason="progress: blocker count decreased from $last_taste_blockers to $current_taste_blockers"
      elif [[ "$current_taste_fingerprint" != "$last_taste_fingerprint" ]]; then
        progress_reason="progress: taste findings changed"
      elif [[ "$recommended_skill" != "$last_recommendation" ]]; then
        progress_reason="progress: loop recommendation changed from $last_recommendation to $recommended_skill"
      else
        progress_reason="progress: bounded retry remains available"
      fi
    fi

    append_progress "Taste requested changes" "- Recommended skill: $recommended_skill"$'\n'"- Follow-ups used: $followup_count/$max_followups"$'\n'"- Taste loops: $taste_loop_count/$max_taste_loops"$'\n'"- Same recommendation retries: $same_recommendation_count/$max_same_recommendation_retries"$'\n'"- Blockers: $current_taste_blockers"$'\n'"- Progress signal: $progress_reason"

    if (( taste_loop_count > max_taste_loops )); then
      rm -f "$output_file"
      append_progress "Taste blocked" "- Reason: taste loop budget exhausted"$'\n'"- Taste loops used: $taste_loop_count/$max_taste_loops"
      printf 'BLOCKED: taste requested changes exceeded max taste loops (%s).\n' "$max_taste_loops" >&2
      exit 2
    fi

    if (( same_recommendation_count > max_same_recommendation_retries )); then
      rm -f "$output_file"
      append_progress "Taste blocked" "- Reason: same follow-up recommendation repeated too many times"$'\n'"- Recommended skill: $recommended_skill"$'\n'"- Same recommendation retries: $same_recommendation_count/$max_same_recommendation_retries"
      printf 'BLOCKED: follow-up recommendation %s repeated more than %s times.\n' "$recommended_skill" "$max_same_recommendation_retries" >&2
      exit 2
    fi

    if [[ -n "$last_taste_fingerprint" && "$current_taste_fingerprint" == "$last_taste_fingerprint" && "$recommended_skill" == "$last_recommendation" && "$current_taste_blockers" -ge "$last_taste_blockers" ]]; then
      rm -f "$output_file"
      append_progress "Taste blocked" "- Reason: repeated REQUEST_CHANGES fingerprint without improvement"$'\n'"- Recommended skill: $recommended_skill"$'\n'"- Blockers: $current_taste_blockers"
      printf 'BLOCKED: taste repeated the same REQUEST_CHANGES findings without measurable improvement.\n' >&2
      exit 2
    fi

    last_taste_fingerprint="$current_taste_fingerprint"
    last_taste_blockers="$current_taste_blockers"
    last_recommendation="$recommended_skill"
    rm -f "$output_file"

    next_agent_iteration
    followup_iteration="$next_agent_iteration_id"
    followup_handoff="$(followup_handoff_path "$spec" "$recommended_skill")"
    followup_handoff_rel="$(relative_path "$followup_handoff")"
    followup_output="$(mktemp)"
    followup_prompt="$(build_followup_prompt "$spec_rel" "$(relative_path "$taste_report")" "$recommended_skill" "$followup_handoff_rel")"

    write_state "$spec_rel" "$followup_iteration" "${recommended_skill}-followup" "running"
    append_progress "Iteration $followup_iteration started" "- Phase: ${recommended_skill}-followup"$'\n'"- Taste report: $(relative_path "$taste_report")"
    followup_count=$((followup_count + 1))
    run_fresh_agent "$followup_prompt" "$followup_output"

    if grep -q '<autopilot>DONE</autopilot>' "$followup_output"; then
      if [[ ! -f "$followup_handoff" ]]; then
        write_self_healed_followup_handoff "$followup_handoff" "$spec_rel" "$recommended_skill" "$followup_output"
        append_progress "Follow-up self-healed" "- Recommended skill: $recommended_skill"$'\n'"- Runner synthesized the missing follow-up handoff: $(relative_path "$followup_handoff")"
      fi

      append_progress "Follow-up done" "- Recommended skill: $recommended_skill"$'\n'"- Output: <autopilot>DONE</autopilot>"
      write_state "$spec_rel" "$followup_iteration" "${recommended_skill}-followup" "done"
      git -C "$repo" add -A
      git -C "$repo" commit -m "chore(autopilot): address taste follow-up" -m "Refs: $spec_rel"
      rm -f "$followup_output"
      continue
    fi

    append_progress "Follow-up blocked" "- Recommended skill: $recommended_skill"$'\n'"- Output did not report DONE."
    write_state "$spec_rel" "$followup_iteration" "${recommended_skill}-followup" "blocked"
    rm -f "$followup_output"
    printf 'BLOCKED: %s follow-up did not complete.\n' "$recommended_skill" >&2
    exit 2

    continue
  fi

  append_progress "Taste blocked" "- Output did not report APPROVE."
  write_state "$spec_rel" "$run_iteration" "taste" "blocked"
  rm -f "$output_file"
  printf 'BLOCKED: taste did not approve.\n' >&2
  exit 2
done

write_state "$spec_rel" "$agent_runs" "" "max_iterations"
append_progress "Max iterations reached" "- Max iterations: $max_iterations"$'\n'"- Used fresh-agent runs: $agent_runs"
printf 'BLOCKED: reached max iterations (%s).\n' "$max_iterations" >&2
exit 1
