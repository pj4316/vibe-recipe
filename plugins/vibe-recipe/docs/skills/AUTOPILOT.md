# Autopilot 동작 문서

`autopilot`은 사용자가 명시적으로 opt-in한 경우에만 `forage` -> `recipe` -> `plate` -> `cook` -> `taste` loop를 제한된 budget 안에서 조율하는 top-level orchestrator입니다. human approval이 필요한 결정을 대신 승인하지 않으며, `serve`, push, deploy, publish는 절대 자동 실행하지 않습니다.

## 목표

- run brief로 goal, stop point, budget, forbidden action을 고정합니다.
- 접근 방식이 불명확하면 `forage`로 option과 proposed ADR을 만듭니다.
- `recipe`로 spec을 만들고, 승인 전에는 구현으로 넘어가지 않습니다.
- spec이 충분하면 먼저 `plate`로 task breakdown을 만들고, 승인된 뒤 `cook`으로 구현하고 `taste`로 review합니다.
- `taste` report에서 기본적으로 멈춥니다.
- release-prep opt-in이 있을 때만 `wrap`까지 진행합니다.

## Runner

Ralph식 fresh context 반복 실행은 `plugins/vibe-recipe/scripts/autopilot-run.mjs`가 담당합니다.

```bash
node plugins/vibe-recipe/scripts/autopilot-run.mjs --repo . --tool codex --max-iterations 10
node plugins/vibe-recipe/scripts/autopilot-run.mjs --repo . --dry-run --once
node plugins/vibe-recipe/scripts/autopilot-run.mjs --repo . --status
```

- 기본 tool은 `codex`이고 `--tool claude`를 선택할 수 있습니다.
- 기본 bounded loop budget은 `--max-followups 3`, `--max-same-recommendation-retries 2`, `--max-taste-loops 3`입니다.
- 각 iteration은 fresh CLI instance를 실행합니다.
- `--max-iterations`는 task, `taste`, follow-up, `wrap`을 포함한 전체 fresh-agent 실행 횟수 상한입니다.
- Codex 기본 호출은 `codex exec --cd <repo> --sandbox workspace-write`입니다.
- active spec의 task checkbox가 Ralph의 `passes` 상태 역할을 합니다.
- `.agent/autopilot/state.json`은 run metadata만 저장합니다.
- `.agent/autopilot/progress.md`는 append-only progress log입니다.
- fresh agent가 `<autopilot>DONE</autopilot>`을 반환하면 runner가 task checkbox를 완료로 바꾸고 task commit을 만듭니다.
- fresh agent가 성공 신호를 냈는데 task handoff, follow-up handoff, taste report가 빠지면 runner가 progress log에 기록하고 최소 artifact를 self-heal 생성합니다.
- `taste`가 `REQUEST_CHANGES`를 반환하면 runner가 현재 spec의 taste report를 읽어 bounded `cook`/`fix` follow-up을 반복합니다.
- 같은 recommendation이 반복되거나 같은 `REQUEST_CHANGES` finding fingerprint가 blocker 감소 없이 반복되면 runner가 progress log에 이유를 남기고 중단합니다.

## 안전장치

- opt-in은 필수이며 현재 run brief에 기록합니다.
- 시작 시 stop point, 최대 turn 수, 최대 시간, 예산 cap, dry-run 여부를 정합니다.
- 승인된 spec 없이 `cook`, `fix`, `tidy`를 실행하지 않습니다.
- release/deploy/push, auth/payment/data-loss, external API side effect는 즉시 중단하고 승인 요청으로 바꿉니다.
- `taste` `BLOCK`, 반복 실패, scope 폭증, budget 초과는 즉시 중단 조건입니다.
- `serve`는 always forbidden입니다.
- dirty tree에 unrelated change가 있으면 runner는 시작하지 않습니다.

## Run brief 필수 항목

- mode: `dry-run`, `bounded-run`, `release-prep`
- goal
- stop point: `recipe draft`, `taste report`, `wrap summary`
- max turns, max time, cost cap
- allowed phases
- forbidden actions
- checkpoint commits on/off

## 상태 모델

- `.agent/spec/active/NNNN-*.md`의 `## 작업 목록` checkbox가 task completion source입니다.
- `.agent/autopilot/state.json`은 active spec, iteration count, stop point, last task, last status를 저장합니다.
- `.agent/autopilot/progress.md`는 iteration별 append-only progress log입니다.
- task별 근거는 `.agent/spec/handoffs/NNNN-task<N>.md`, cook summary, taste report입니다.
- handoff나 report가 누락되면 runner가 self-heal artifact를 생성하고 그 사실을 progress log에 남깁니다.

## Flow

1. Preflight: `peek` 수준으로 git status, active spec, command profile, latest taste/wrap 상태를 확인합니다.
2. Route: 접근 방식이나 vendor 선택이 불명확하면 `forage`를 사용합니다.
3. Plan: `recipe`로 승인 가능한 spec을 만들거나 보강합니다.
4. Plate: 승인된 spec에 `plate` 구현 계획과 task breakdown이 없으면 먼저 작성합니다.
5. Approval gate: spec이 `Approved`가 아니면 멈추고 사용자 승인을 요청합니다.
6. Execute: 승인되고 plated된 spec을 `cook`으로 task 단위 구현합니다.
7. Review: `taste`를 실행하고 verdict를 확인합니다.
8. Loop: `REQUEST_CHANGES`는 taste report의 loop recommendation을 따라 bounded `cook` 또는 `fix` follow-up을 반복합니다. 기본값은 follow-up 최대 3회, 같은 recommendation 최대 2회, `taste` loop 최대 3회입니다. 같은 finding이 반복되고 blocker가 줄지 않으면 중단합니다. `BLOCK`은 즉시 중단합니다.
9. Stop: 기본적으로 `taste` report에서 멈춥니다. release-prep opt-in이 있으면 `wrap`까지 진행합니다.

## Context hygiene

- 메인 컨텍스트에는 run brief, phase summary, current blocker, next action만 유지합니다.
- phase 간 원자료는 handoff path, spec path, command 결과 요약으로 넘깁니다.
- 긴 diff, test log, subagent transcript를 메인 대화에 누적하지 않습니다.
- 각 phase가 끝나면 evidence와 다음 gate만 compact summary로 남깁니다.

## Checkpoint와 Git

- checkpoint commit은 사용자가 opt-in했고 phase 산출물이 self-contained일 때만 만듭니다.
- task commit은 `chore(autopilot): complete Task N` 형식을 사용하고 active spec을 `Refs:` footer로 남깁니다.
- checkpoint commit은 runner 외부에서 별도 opt-in된 경우에만 `autopilot: checkpoint <phase>` 형식을 사용합니다.
- release prep commit은 `wrap`의 `chore(release): X.Y.Z` 계약을 따릅니다.
- 자동 push는 절대 하지 않습니다.
- unrelated dirty change가 있으면 checkpoint를 만들지 않고 현재 run을 paused로 보고합니다.

## 검증 포인트

`autopilot` 스킬을 변경할 때는 다음을 확인합니다.

```bash
test -f plugins/vibe-recipe/skills/autopilot/SKILL.md
test -f plugins/vibe-recipe/docs/skills/AUTOPILOT.md
test -f plugins/vibe-recipe/scripts/autopilot-run.mjs
node --check plugins/vibe-recipe/scripts/autopilot-run.mjs
grep -q 'serve' plugins/vibe-recipe/skills/autopilot/SKILL.md
grep -q 'Run brief' plugins/vibe-recipe/skills/autopilot/SKILL.md
grep -q 'autopilot-run.mjs' plugins/vibe-recipe/skills/autopilot/SKILL.md
node plugins/vibe-recipe/scripts/build-universal-agents-md.mjs /tmp/vibe-recipe-AGENTS.md
grep -q 'autopilot - 자동 운항' /tmp/vibe-recipe-AGENTS.md
```
