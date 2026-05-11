# Customization

## Templates

Project fallback templates live in `templates/`. `kitchen` uses `skills/kitchen/resources/` as the source for generated harness files and may use `templates/` for generic fallback files that are copied without product-specific interpolation.

## Command Contract

Target projects store native commands in `.agent/commands.json`:

- `setup`
- `build`
- `test`
- `e2e`
- `lint`
- `verify`
- `dev`

If a stack changes, update the command values and keep the keys stable. Skills and hooks should read the `verify` command instead of guessing stack-specific commands.

Parallel execution settings also live in `.agent/commands.json`:

```json
{
  "parallelism": {
    "worker_pool": 3,
    "spec_fan_out": "auto"
  }
}
```

`worker_pool` controls task fan-out within one wave. `spec_fan_out` controls whether multiple Approved/In Progress specs can be planned for worktree fan-out; use `auto`, `ask`, or `off`.

## Spec Folder Contract

New specs use `.agent/spec/active/NNNN-<slug>/{spec.md,tasks.md,memory.md}`.

- `spec.md`: product intent, scenarios, acceptance, requirements, non-goals.
- `tasks.md`: plate plan, task checkboxes, wave/dependency metadata, verification plan.
- `memory.md`: append-only handoff and shared findings.

Do not regenerate `.agent/spec/INDEX.md` or `.agent/spec/handoffs/INDEX.md`; status views should scan folders on read.

## Hooks

Hooks are conservative defaults. They block destructive command patterns, protected file writes, direct commits to main, commit messages without Conventional Commit shape, and missing spec footers. `.env.example` is treated as a safe scaffold file; real `.env` files still require an explicit override.

Set `VIBE_RECIPE_ALLOW_PROTECTED_WRITE=1` only for intentional maintenance operations.

## Skills

Each skill lives in `skills/<name>/SKILL.md`. Keep the cooking name and developer alias together in the description so users can trigger either style.

## Subagents

Subagent prompts live in `agents/`. Keep each role narrow and tool access minimal.

## Design System

`design-system.md` starts as an initial document. Do not try to perfect it during `kitchen`; use `recipe` for design-system policy changes and `tidy` for behavior-preserving UI token or component migrations after real UI exists.
