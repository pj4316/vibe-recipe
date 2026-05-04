---
name: autopilot
description: /vr:autopilot 호출 시 사용합니다. 명시적으로 동의한 경우에만 forage -> recipe -> cook -> taste 흐름을 예산, 중단 조건, 체크포인트와 함께 자동 진행합니다. serve는 자동 실행하지 않습니다.
---

# autopilot - 자동 운항

명시적으로 사용자가 opt-in한 경우에만 이 skill을 사용합니다. `autopilot`은 manual workflow를 bounded run으로 묶는 orchestrator이며, human approval이 필요한 결정을 대신 승인하지 않습니다.

## 대화 톤

- 사용자에게 서비스를 제공하는 담당자처럼 친절하고 차분하게 안내합니다.
- 지금 무엇을 확인했고 왜 필요한지 쉬운 말로 먼저 설명한 뒤 다음 단계를 제안합니다.
- budget, stop point, human gate처럼 제한이 있는 항목은 이유와 함께 설명하고, 가능한 대안을 같이 안내합니다.
- 비개발자도 이해할 수 있게 technical term은 바로 짧게 풀어주고, 결정이 필요한 경우에는 추천안을 먼저 제시합니다.

## 역할 구분

- `autopilot`은 `forage` -> `recipe` -> `cook` -> `taste` loop를 제한된 budget 안에서 조율합니다.
- `autopilot`은 subagent가 아니라 top-level orchestrator skill입니다.
- 실제 구현은 `cook`, 실패 진단은 `fix`, review는 `taste`, release prep은 명시 요청이 있을 때만 `wrap`이 담당합니다.
- `serve`, push, deploy, publish, auth/payment/data-loss 승인, spec approval은 자동 실행하거나 자동 승인하지 않습니다.
- Ralph식 fresh context 반복 실행은 `plugins/vibe-recipe/scripts/autopilot-run.sh`가 담당합니다.

## Runner

`autopilot-run.sh`는 active spec의 task checkbox를 source of truth로 사용합니다. Ralph의 `prd.json.userStories[].passes`를 별도 source로 복제하지 않습니다.

```bash
plugins/vibe-recipe/scripts/autopilot-run.sh --repo . --tool codex --max-iterations 10
plugins/vibe-recipe/scripts/autopilot-run.sh --repo . --dry-run --once
plugins/vibe-recipe/scripts/autopilot-run.sh --repo . --status
```

- 기본 tool은 `codex`이고 `--tool claude`를 선택할 수 있습니다.
- 기본 bounded loop budget은 `--max-followups 3`, `--max-same-recommendation-retries 2`, `--max-taste-loops 3`입니다.
- 각 iteration은 fresh CLI instance를 실행합니다.
- `--max-iterations`는 task, `taste`, follow-up, `wrap`을 포함한 전체 fresh-agent 실행 횟수 상한입니다.
- Codex 기본 호출은 `codex exec --cd <repo> --sandbox workspace-write`입니다.
- 상태 파일은 `.agent/autopilot/state.json`, append-only log는 `.agent/autopilot/progress.md`입니다.
- runner는 첫 unchecked `Task N` 하나만 fresh agent에 맡깁니다.
- fresh agent가 `<autopilot>DONE</autopilot>`을 반환하면 runner가 `- [x] Task N`으로 표시하고 task commit을 만듭니다.
- fresh agent가 성공 신호를 냈는데 task handoff, follow-up handoff, taste report 같은 coordination artifact가 빠졌다면 runner가 progress log에 남기고 최소 artifact를 self-heal 생성합니다.
- 모든 task가 완료되면 runner가 fresh `taste` iteration을 실행합니다.
- `taste`가 `REQUEST_CHANGES`를 반환하면 runner가 taste report의 loop recommendation을 읽어 bounded `cook`/`fix` follow-up을 반복합니다.
- 같은 recommendation이 연속으로 반복되거나 같은 `REQUEST_CHANGES` fingerprint가 blocker 감소 없이 반복되면 runner가 더 돌리지 않고 중단합니다.
- `taste APPROVE`이면 `<promise>COMPLETE</promise>`로 종료합니다.
- `--stop-point wrap`을 명시한 경우에만 `wrap`까지 진행합니다.

## 안전장치

- opt-in은 필수이며 현재 run brief에 기록되어야 합니다.
- 시작 시 stop point, 최대 turn 수, 최대 시간, 예산 cap, dry-run 여부를 정합니다.
- 기본 stop point는 `taste` report입니다. `wrap`은 명시 요청이 있을 때만 실행하고, `serve`는 절대 자동 실행하지 않습니다.
- `--dry-run` 모드에서는 계획, routing, 예상 변경 범위만 작성하고 파일을 수정하지 않습니다.
- 승인된 spec 없이 `cook`, `fix`, `tidy`를 실행하지 않습니다. 사용자가 spec을 승인하기 전에는 `recipe` draft에서 멈춥니다.
- human gate가 필요한 release/deploy/push, auth/payment/data-loss, external API side effect는 즉시 중단하고 승인 요청으로 바꿉니다.
- 설정된 경우 phase 경계마다 checkpoint commit을 만들 수 있지만, dirty tree와 unrelated change가 있으면 commit하지 않습니다.
- 모호성, scope 폭증, 반복 실패, BLOCK finding, 예산 초과, user-visible risk 증가가 발생하면 즉시 사람에게 중단 보고합니다.
- dirty tree에 unrelated change가 있으면 runner는 시작하지 않습니다.

## Run brief

시작 전 아래 brief를 대화와 handoff에 남깁니다.

```markdown
# Autopilot Run Brief
Mode: dry-run / bounded-run / release-prep
Goal:
Stop point: recipe draft / taste report / wrap summary
Budget:
- Max turns:
- Max time:
- Cost cap:
Allowed phases:
Forbidden actions: serve, push, deploy, publish, human-gated approval
Checkpoint commits: yes / no
```

## 상태 모델

- `.agent/spec/active/NNNN-*.md`의 `## 작업 목록` checkbox가 task completion source입니다.
- `.agent/autopilot/state.json`은 현재 run metadata만 저장합니다.
- `.agent/autopilot/progress.md`는 iteration별 append-only progress log입니다.
- task별 근거는 `.agent/spec/handoffs/NNNN-task<N>.md`, cook summary, taste report입니다.
- handoff나 report가 누락되면 runner가 self-heal artifact를 생성하고 그 사실을 progress log에 남깁니다.
- fresh agent transcript, 긴 diff, 긴 test log는 progress log에 붙이지 않고 evidence path만 남깁니다.

## 흐름

1. Preflight: `peek` 수준으로 git status, active spec, command profile, latest taste/wrap 상태를 확인합니다.
2. Route: 접근 방식이나 vendor 선택이 불명확하면 `forage`로 option과 proposed ADR을 만듭니다.
3. Plan: `recipe`로 승인 가능한 spec을 만들거나 보강합니다.
4. Approval gate: spec이 `Approved`가 아니면 여기서 멈추고 사용자 승인을 요청합니다.
5. Execute: 승인된 spec을 `cook`으로 task 단위 구현합니다.
6. Review: 구현 후 `taste`를 실행하고 verdict를 확인합니다.
7. Loop: `REQUEST_CHANGES`는 taste report의 loop recommendation을 따라 bounded `cook` 또는 `fix` follow-up을 반복합니다. 기본값은 follow-up 최대 3회, 같은 recommendation 최대 2회, `taste` loop 최대 3회입니다. 같은 finding이 반복되고 blocker가 줄지 않으면 중단합니다. `BLOCK`은 즉시 중단합니다.
8. Stop: 기본적으로 `taste` report에서 멈춥니다. 사용자가 release-prep opt-in을 한 경우에만 `wrap`까지 진행합니다.

## Context hygiene

- 메인 컨텍스트에는 run brief, phase summary, current blocker, next action만 유지합니다.
- phase 간 원자료는 handoff path, spec path, command 결과 요약으로 넘깁니다.
- 긴 diff, test log, subagent transcript를 메인 대화에 누적하지 않습니다.
- 각 phase가 끝나면 “무엇이 바뀌었는지, 어떤 evidence가 있는지, 다음 gate가 무엇인지”만 compact summary로 남깁니다.
- budget을 아끼기 위해 같은 실패 로그를 반복 분석하지 않고, 두 번째 반복 실패부터 `fix` 또는 사람에게 escalate합니다.

## Checkpoint와 Git

- checkpoint commit은 사용자가 opt-in했고 phase 산출물이 self-contained일 때만 만듭니다.
- task commit은 `chore(autopilot): complete Task N` 형식을 사용하고 active spec을 `Refs:` footer로 남깁니다.
- checkpoint commit은 runner 외부에서 별도 opt-in된 경우에만 `autopilot: checkpoint <phase>` 형식을 사용합니다.
- release prep commit은 `wrap`의 `chore(release): X.Y.Z` 계약을 따릅니다.
- 자동 push는 절대 하지 않습니다.
- unrelated dirty change가 있으면 checkpoint를 만들지 않고 현재 run을 paused로 보고합니다.

## Stop 조건

- spec approval, release/deploy/push, auth/payment/data-loss, external API side effect가 필요합니다.
- `taste` verdict가 `BLOCK`입니다.
- 같은 command 또는 acceptance가 두 번 연속 실패합니다.
- budget, time, turn cap 중 하나를 초과했습니다.
- active spec scope가 커져서 새 `recipe`가 필요합니다.
- user-facing risk가 증가했지만 acceptance나 rollback 기준이 없습니다.

## 기본값

새 사용자는 manual mode가 기본입니다. autopilot을 켜기 전에 작은 feature 하나를 manual로 끝까지 rehearsal하는 것을 권장합니다.

기본값은 `bounded-run`, stop point는 `taste report`, checkpoint commit은 off, `wrap`은 off, `serve`는 always forbidden입니다.
