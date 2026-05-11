---
name: fix
description: /vr:fix 호출 시 사용합니다. 실패를 진단하고 잘못된 가정을 의심하며, 코드를 수정하거나 spec 변경으로 escalation합니다.
---

# fix (debug) - 문제 해결하기

동작이 깨졌거나 test가 실패하거나 production symptom이 보고되거나 review/release gate에서 blocker가 발견됐을 때 사용합니다.

`fix`는 실패 원인을 좁히고 최소 수정으로 회귀를 막는 execution/support skill입니다. 새 기능 scope를 추가하지 않고, spec이 틀렸거나 제품 결정이 필요한 경우에는 `recipe`로 되돌립니다.

## 대화 톤

- 사용자를 탓하거나 “망가졌다”는 식으로 몰아붙이지 않고, 현재 증상과 확인 결과를 차분하게 설명합니다.
- 어려운 오류는 바로 기술 용어로 밀어붙이지 말고, 사용자 관점의 증상과 영향부터 쉽게 풀어줍니다.
- 재현 여부, 원인 후보, 다음 점검 순서를 짧고 명확하게 공유해 사용자가 불안하지 않게 안내합니다.
- 해결이 막히는 경우에는 왜 막히는지와 필요한 추가 정보 또는 안전한 우회 경로를 함께 제시합니다.

## 시작 조건

- failing test, failing focused command, failing `verify`, production symptom, review blocker, release gate failure 중 하나가 있습니다.
- 관련 active spec, cook/taste/wrap/serve handoff, 실패 로그, 재현 절차 중 최소 하나를 읽었습니다.
- `.agent/runbooks/debugging.md`, `.agent/runbooks/verification.md`, `.agent/commands.json`을 확인했습니다.
- `git status --short`로 작업 트리를 확인했고, 관련 없는 사용자 변경을 되돌리지 않습니다.
- 승인된 spec 없이 `fix`를 실행하지 않습니다. 단, 사용자가 emergency debug mode를 명시하고 증상 재현이 필요한 경우에는 읽기와 최소 재현까지만 먼저 진행할 수 있습니다.
- auth/payment/data-loss/external API/release/deploy/push처럼 human gate가 필요한 수정은 승인 없이 적용하지 않습니다.

## 태도

spec이 항상 옳다고 가정하지 않습니다. 실패 원인이 구현, test 기대값, 환경, 요구사항 중 어디에 있는지 먼저 판단합니다.

한 번에 많은 코드를 고치지 않습니다. 재현 가능한 증거, root cause, 가장 작은 수정, regression coverage가 연결되어야 합니다.

## 실패 원인 분류

| 분류 | 의미 | 다음 행동 |
| --- | --- | --- |
| `code defect` | 승인된 spec과 test가 맞고 구현이 틀렸습니다. | 최소 코드 수정과 regression coverage를 추가합니다. |
| `test expectation` | 구현은 spec에 맞지만 test가 잘못된 기대값을 검증합니다. | test를 고치되 spec 근거를 handoff에 남깁니다. |
| `environment/tooling` | 의존성, command, fixture, local setup, flaky 외부 조건 문제입니다. | command/profile/runbook 수정 필요 여부를 분리합니다. |
| `spec mismatch` | acceptance criteria나 제품 의도가 실제 요구와 맞지 않습니다. | 코드를 고치지 않고 `recipe`로 escalation합니다. |
| `human-gated decision` | auth/payment/data-loss/release/deploy/push 결정이 필요합니다. | 변경을 멈추고 사용자 승인을 요청합니다. |

## 진단 루프

1. Reproduce: 가장 저렴하고 신뢰할 수 있는 command로 실패를 재현하거나, 재현 불가 상태를 명확히 기록합니다.
2. Minimize: 실패 입력, 파일, command, diff 범위를 줄여 영향을 받는 contract를 찾습니다.
3. Hypothesize: 원인 후보를 `code defect`, `test expectation`, `environment/tooling`, `spec mismatch`, `human-gated decision` 중 하나로 분류합니다.
4. Instrument: 필요한 경우 log, assertion, focused test, temporary diagnostic command로 가설을 검증합니다. 임시 instrumentation은 최종 변경에 남기지 않습니다.
5. Root cause: 관찰 증거와 실제 원인을 연결하고, spec/acceptance와 모순되는지 확인합니다.
6. Fix: spec이 유효할 때만 가장 작은 코드 또는 test 수정을 적용합니다.
7. Regression: 같은 실패가 다시 발생하지 않도록 실패 test, focused check, snapshot, e2e 또는 manual check를 추가하거나 보강합니다.
8. Verify: focused command를 먼저 실행하고, 필요한 `test`, `e2e`, 가능한 `verify` 순서로 확인합니다.
9. Handoff: 원인, 수정, 검증, 남은 risk, 다음 skill을 `Fix Summary`로 남깁니다.

## 수정 범위

- 허용: 실패 원인을 고치는 product code, test, fixture, command profile의 최소 변경.
- 조건부 허용: `.agent/runbooks/debugging.md`, `.agent/runbooks/verification.md`, `.agent/memory/gotchas.md` 보강. 반복 실패나 환경 함정이 확인된 경우에만 사용합니다.
- 금지: 새 기능 scope, 승인되지 않은 acceptance 변경, release version/changelog/tag, deploy/push/publish.
- spec 본문이 틀렸다면 직접 고치지 않고 `recipe`로 넘깁니다. 단, handoff에는 어떤 acceptance가 왜 틀렸는지 증거를 남깁니다.

## Subagent 사용

- `tester`: 재현 test, focused command, e2e/manual check 판단이 필요할 때 사용합니다.
- `implementor`: root cause가 확인된 뒤 최소 코드 수정이 분리 가능한 경우에만 사용합니다.
- `security-auditor`: auth, secret, injection, unsafe IO, dependency, data-loss 위험이 실패 원인에 포함될 때 사용합니다.

subagent에는 증상, 재현 command, 관련 spec, 실패 로그 경로, write scope, 금지 작업을 명시합니다. 원인이 확인되기 전에는 구현을 위임하지 않습니다.

## Escalation

| 상황 | 다음 skill |
| --- | --- |
| spec/acceptance/product decision이 틀렸거나 비어 있음 | `recipe` |
| 승인된 task가 남았고 실패가 미완성 구현 때문임 | `cook` |
| 동작 변경 없이 boundary, naming, 구조 정리가 필요함 | `tidy` |
| version/changelog/release prep 불일치가 원인임 | `wrap` |
| 수정 후 acceptance와 regression 검수가 필요함 | `taste` |

## Handoff 형식

권장 위치는 현재 spec folder의 `memory.md`에 append하는 `fix` 섹션입니다. spec과 연결되지 않은 emergency debug라면 최종 응답에 같은 형식을 남기고, 이후 `recipe`가 필요하면 그렇게 추천합니다.

```markdown
# Fix Summary: NNNN <slug>
Status: fixed / blocked / escalated

## Symptom
- Reported:
- Repro command:
- Failing evidence:

## Diagnosis
- Classification: code defect / test expectation / environment/tooling / spec mismatch / human-gated decision
- Root cause:
- Affected contract:

## Change
- Changed files:
- Regression coverage:

## Verification
- Focused:
- Test:
- E2E/manual:
- Verify:

## Risks
- Remaining risk:
- Not fixed:
- Next skill:
```

## Recommendation block

원인 분류가 `spec mismatch`, `human-gated decision`, `environment/tooling`처럼 다음 경로를 선택해야 하는 경우와 fix 완료 후 `taste`로 넘길 때는 최종 응답에 `templates/recommendation-block.md`와 같은 헤더를 포함합니다.

- 코드 결함이 확인됨: 1순위는 최소 `fix` 적용 후 focused check, 차선은 `cook`으로 미완성 task 보강입니다.
- spec mismatch: 1순위는 `recipe` escalation, 차선은 코드 변경 없이 재현 evidence만 남기는 것입니다.
- release/version 문제: 1순위는 `wrap` 또는 `serve` gate 복구, 차선은 release 중단입니다.
- 수정 완료: 1순위는 `taste`, 차선은 추가 focused verification입니다.

필수 헤더:

```markdown
### 현재 상태
### 추천 행동
### 사용자 확인이 필요한 이유
```

## 완료 조건

- 실패가 재현되었거나 재현 불가 이유가 명확합니다.
- root cause가 실패 증거와 연결되어 있습니다.
- 수정이 원인에 비례해 작고, unrelated change를 되돌리지 않았습니다.
- regression coverage 또는 manual 재현 절차가 남았습니다.
- focused command와 가능한 상위 검증 결과가 기록되어 있습니다.
- 다음 단계가 `taste`, `recipe`, `plate`, `cook`, `tidy`, `wrap` 중 하나로 분명합니다.

## Git

spec과 연결된 작업이면 `fix/NNNN-slug` branch를 사용합니다. commit prefix는 `fix:`이고 필수 `Refs:` footer를 포함합니다.

Emergency debug에서 spec이 아직 없으면 branch와 commit을 만들기 전에 `recipe`가 필요한지 먼저 판단합니다. 자동 push는 하지 않습니다.
