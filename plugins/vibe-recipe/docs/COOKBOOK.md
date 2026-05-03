# Cookbook

## First Run

Start with:

```text
/vr:kitchen
```

Developer alias:

```text
/vr:init
```

`kitchen` runs an AskQuestion wizard, then generates `AGENTS.md`, `.agent/constitution.md`, `.agent/spec/design.md`, records native project commands, and seeds the first health-check spec.

## Rehearsal

Run one safe loop before real feature work:

```text
/vr:recipe
/vr:cook
/vr:taste
/vr:wrap
```

Stop before `/vr:serve` unless you are ready for release gates.

## Real Feature Loop

Use:

```text
/vr:forage
/vr:recipe
/vr:cook
/vr:taste
```

Skip `forage` when the approach is obvious.

## Autopilot Loop

After `recipe` has an approved active spec, use Ralph-style fresh iterations:

```bash
plugins/vibe-recipe/scripts/autopilot-run.sh --repo . --tool codex --max-iterations 10
```

Check what would run without changing files:

```bash
plugins/vibe-recipe/scripts/autopilot-run.sh --repo . --dry-run --once
```

`autopilot` works one unchecked spec task per fresh agent instance. It stops at `taste` by default and never runs `serve`, push, deploy, or publish.

## Debug Loop

Use:

```text
/vr:fix
/vr:taste
```

`fix` may escalate back to `recipe` when the spec is wrong.

## Design Loop

After the first one or two UI screens:

```text
/vr:plate
```

`plate` measures drift between actual UI code and `design-system.md`.

## Release Loop

Use:

```text
/vr:wrap
/vr:serve
```

`wrap` prepares version and changelog. `serve` runs gates and stops before human-approved push or deploy.
