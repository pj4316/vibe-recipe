# Cookbook

## First Run

Start with:

```text
/vr:kitchen
```

`kitchen` runs an AskQuestion wizard, then generates `AGENTS.md`, `.agent/constitution.md`, `.agent/spec/design.md`, records native project commands, and creates the first health-check spec.

## Rehearsal

Run one safe loop before real feature work:

```text
/vr:recipe
/vr:plate
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
/vr:plate
/vr:cook
/vr:taste
```

Skip `forage` when the approach is obvious. Do not skip `plate`; `cook` expects an implementation plan and executable task list.

## Autopilot Loop

After `recipe` has an approved active spec and `plate` has produced task breakdown, use Ralph-style fresh iterations:

```bash
node plugins/vibe-recipe/scripts/autopilot-run.mjs --repo . --tool codex --max-iterations 10
```

Check what would run without changing files:

```bash
node plugins/vibe-recipe/scripts/autopilot-run.mjs --repo . --dry-run --once
```

`autopilot` works one unchecked spec task per fresh agent instance. It stops at `taste` by default and never runs `serve`, push, deploy, or publish.

`taste APPROVE` 뒤에도 spec은 `.agent/spec/active/`에 남고 report에 `Release readiness: Ready for Wrap`이 기록됩니다. 다른 active spec을 계속 진행한 뒤 함께 `wrap`할 수 있습니다.

## Debug Loop

Use:

```text
/vr:fix
/vr:taste
```

`fix` may escalate back to `recipe` when the spec is wrong.

## Design-System Loop

Use `recipe` for design-system policy changes and `tidy` for behavior-preserving UI token or component migrations.

## Release Loop

Use:

```text
/vr:wrap
/vr:serve
```

`wrap`은 사용자가 특정 spec을 지정하지 않으면 모든 `Ready for Wrap` active spec으로 release set을 만듭니다. `serve`는 gate와 local tag를 처리한 뒤 release set에 포함된 spec만 `.agent/spec/done/`으로 닫고, push 또는 deploy는 사람 승인 전에서 멈춥니다.
