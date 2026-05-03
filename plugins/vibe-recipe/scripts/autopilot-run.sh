#!/usr/bin/env bash
set -euo pipefail

repo="."
tool="codex"
max_iterations=10
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

active_spec() {
  if [[ ! -d "$agent_dir/spec/active" ]]; then
    return 0
  fi

  find "$agent_dir/spec/active" -maxdepth 1 -type f -name '[0-9][0-9][0-9][0-9]-*.md' 2>/dev/null | sort | head -n 1
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

latest_taste_report() {
  if [[ ! -d "$agent_dir/spec/handoffs" ]]; then
    return 0
  fi

  find "$agent_dir/spec/handoffs" -maxdepth 1 -type f -name '*taste*.md' 2>/dev/null | sort | tail -n 1
}

task_handoff_exists() {
  local spec="$1"
  local task_number="$2"
  local spec_number
  spec_number="$(basename "$spec" | sed -E 's/^([0-9]{4}).*/\1/')"

  find "$agent_dir/spec/handoffs" -maxdepth 1 -type f -name "${spec_number}-task${task_number}*.md" 2>/dev/null | grep -q .
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

  cat <<PROMPT
You are a fresh vibe-recipe autopilot review iteration.

Use the taste/review contract for $spec_rel.
Read AGENTS.md, the active spec, cook/task handoffs, git diff, and .agent/commands.json.
Write the taste report to .agent/spec/handoffs/NNNN-taste.md.
Do not modify product code or spec scope.

Final response contract:
- If verdict is APPROVE, include exactly: <autopilot>APPROVE</autopilot>
- If verdict is REQUEST_CHANGES, include exactly: <autopilot>REQUEST_CHANGES</autopilot>
- If verdict is BLOCK, include exactly: <autopilot>BLOCKED</autopilot>
PROMPT
}

build_wrap_prompt() {
  cat <<'PROMPT'
You are a fresh vibe-recipe release-prep iteration.

Use the wrap/bump contract.
Read latest taste report, release commit range, version manifest, CHANGELOG.md if present, and .agent/commands.json.
Prepare version/changelog only if taste verdict is APPROVE and verify is configured.
Do not tag, push, deploy, publish, or run serve.

Final response contract:
- If wrap summary is complete, include exactly: <autopilot>WRAPPED</autopilot>
- If blocked or approval is needed, include exactly: <autopilot>BLOCKED</autopilot>
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
append_progress "Run started" "- Spec: $spec_rel"$'\n'"- Tool: $tool"$'\n'"- Stop point: $stop_point"$'\n'"- Max iterations: $max_iterations"

for iteration in $(seq 1 "$max_iterations"); do
  next_line="$(next_task_line "$spec")"

  if [[ -n "$next_line" ]]; then
    task_number="$(printf '%s\n' "$next_line" | task_number_from_line)"
    task_title="$(printf '%s\n' "$next_line" | task_title_from_line)"
    output_file="$(mktemp)"
    prompt="$(build_task_prompt "$spec_rel" "$task_number" "$task_title")"

    write_state "$spec_rel" "$iteration" "Task $task_number" "running"
    append_progress "Iteration $iteration started" "- Task: Task $task_number - $task_title"
    run_fresh_agent "$prompt" "$output_file"

    if [[ "$dry_run" -eq 1 ]]; then
      rm -f "$output_file"
      exit 0
    fi

    if grep -q '<autopilot>DONE</autopilot>' "$output_file"; then
      if ! task_handoff_exists "$spec" "$task_number"; then
        append_progress "Task $task_number blocked" "- Task: $task_title"$'\n'"- DONE signal was present but expected task handoff was missing."
        write_state "$spec_rel" "$iteration" "Task $task_number" "blocked"
        rm -f "$output_file"
        printf 'BLOCKED: Task %s reported DONE but no matching handoff exists.\n' "$task_number" >&2
        exit 2
      fi

      mark_task_done "$spec" "$task_number"
      append_progress "Task $task_number done" "- Task: $task_title"$'\n'"- Output: <autopilot>DONE</autopilot>"
      write_state "$spec_rel" "$iteration" "Task $task_number" "done"
      git -C "$repo" add -A
      git -C "$repo" commit -m "autopilot: complete Task $task_number" -m "Refs: $spec_rel"
      rm -f "$output_file"
      if [[ "$once" -eq 1 ]]; then
        printf 'PAUSED: completed one iteration.\n'
        exit 0
      fi
      continue
    fi

    append_progress "Task $task_number blocked" "- Task: $task_title"$'\n'"- Output did not report DONE."
    write_state "$spec_rel" "$iteration" "Task $task_number" "blocked"
    rm -f "$output_file"
    printf 'BLOCKED: fresh agent did not complete Task %s.\n' "$task_number" >&2
    exit 2
  fi

  output_file="$(mktemp)"
  prompt="$(build_taste_prompt "$spec_rel")"
  write_state "$spec_rel" "$iteration" "taste" "running"
  append_progress "Taste started" "- Spec: $spec_rel"
  run_fresh_agent "$prompt" "$output_file"

  if [[ "$dry_run" -eq 1 ]]; then
    rm -f "$output_file"
    exit 0
  fi

  taste_report="$(latest_taste_report)"
  if grep -q '<autopilot>APPROVE</autopilot>' "$output_file" || { [[ -n "$taste_report" ]] && grep -q 'Verdict: APPROVE' "$taste_report"; }; then
    append_progress "Taste approved" "- Taste report: ${taste_report:-from fresh-agent output}"
    write_state "$spec_rel" "$iteration" "taste" "approved"
    if [[ "$stop_point" == "taste" ]]; then
      printf '<promise>COMPLETE</promise>\n'
      rm -f "$output_file"
      exit 0
    fi

    wrap_output="$(mktemp)"
    wrap_prompt="$(build_wrap_prompt)"
    write_state "$spec_rel" "$iteration" "wrap" "running"
    append_progress "Wrap started" "- Stop point: wrap"
    run_fresh_agent "$wrap_prompt" "$wrap_output"

    if grep -q '<autopilot>WRAPPED</autopilot>' "$wrap_output"; then
      append_progress "Wrap complete" "- Output: <autopilot>WRAPPED</autopilot>"
      write_state "$spec_rel" "$iteration" "wrap" "wrapped"
      printf '<promise>COMPLETE</promise>\n'
      rm -f "$output_file" "$wrap_output"
      exit 0
    fi

    append_progress "Wrap blocked" "- Output did not report WRAPPED."
    write_state "$spec_rel" "$iteration" "wrap" "blocked"
    rm -f "$output_file" "$wrap_output"
    printf 'BLOCKED: wrap did not complete.\n' >&2
    exit 2
  fi

  if grep -q '<autopilot>REQUEST_CHANGES</autopilot>' "$output_file"; then
    append_progress "Taste requested changes" "- Budget allows one follow-up cook/fix iteration."
    write_state "$spec_rel" "$iteration" "taste" "request_changes"
    rm -f "$output_file"
    if [[ "$once" -eq 1 ]]; then
      printf 'PAUSED: taste requested changes.\n'
      exit 2
    fi
    continue
  fi

  append_progress "Taste blocked" "- Output did not report APPROVE."
  write_state "$spec_rel" "$iteration" "taste" "blocked"
  rm -f "$output_file"
  printf 'BLOCKED: taste did not approve.\n' >&2
  exit 2
done

write_state "$spec_rel" "$max_iterations" "" "max_iterations"
append_progress "Max iterations reached" "- Max iterations: $max_iterations"
printf 'BLOCKED: reached max iterations (%s).\n' "$max_iterations" >&2
exit 1
