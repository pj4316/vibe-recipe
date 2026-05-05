# Fix 동작 문서

`fix`는 실패를 재현하고 root cause를 좁힌 뒤, 최소 수정과 regression coverage로 같은 실패가 반복되지 않게 만드는 debug skill입니다. 사용자는 `/vr:fix`로 호출할 수 있습니다.

`fix`는 새 기능을 구현하는 흐름이 아닙니다. 승인된 spec이 틀렸거나 제품 결정이 필요한 경우에는 코드를 고치기보다 `recipe`로 되돌립니다.

## 목표

- failing test, production symptom, review blocker, release gate failure를 재현하거나 재현 불가 상태를 명확히 기록합니다.
- 실패 원인을 `code defect`, `test expectation`, `environment/tooling`, `spec mismatch`, `human-gated decision`으로 분류합니다.
- root cause와 영향을 받는 contract를 확인합니다.
- spec이 유효할 때만 최소 코드 또는 test 수정을 적용합니다.
- regression coverage와 focused verification을 남깁니다.
- `Fix Summary`를 통해 `taste/review` 또는 후속 skill이 이어받을 수 있게 합니다.

## 시작 조건

| 조건 | 처리 |
| --- | --- |
| failing command가 있음 | 같은 command 또는 더 좁은 focused command로 재현 |
| production symptom만 있음 | 사용자 관찰 결과를 재현 절차로 변환 |
| review blocker가 있음 | `taste` report의 evidence reference를 기준으로 진단 |
| release gate failure가 있음 | `serve`/`wrap` 입력과 `verify` 실패를 분리 |
| active spec 없음 | emergency debug mode가 아니면 `recipe`로 라우팅 |
| human gate 위험 있음 | auth/payment/data-loss/external API/release/deploy/push 승인 전 중단 |

## 진단 루프

1. Reproduce: 가장 저렴하고 신뢰할 수 있는 command로 실패를 재현합니다.
2. Minimize: 실패 입력, 파일, command, diff 범위를 줄입니다.
3. Hypothesize: 원인 후보를 다섯 분류 중 하나로 둡니다.
4. Instrument: 필요한 assertion, log, focused test로 가설을 확인합니다.
5. Root cause: 관찰 증거와 실제 원인을 연결합니다.
6. Fix: spec이 유효한 경우에만 최소 변경을 적용합니다.
7. Regression: 같은 실패를 막는 test/check/manual 절차를 남깁니다.
8. Verify: focused command, `test`, `e2e`, 가능한 `verify` 순서로 확인합니다.
9. Handoff: `Fix Summary`에 원인, 수정, 검증, 남은 risk, 다음 skill을 기록합니다.

## 원인 분류

| 분류 | 의미 | 기본 후속 |
| --- | --- | --- |
| `code defect` | 구현이 승인된 spec과 다름 | 최소 수정 후 `taste` |
| `test expectation` | test가 spec과 다른 기대값을 검증 | test 수정 후 `taste` |
| `environment/tooling` | setup, dependency, fixture, command 문제 | runbook/profile 보강 후 `taste` 또는 `recipe` |
| `spec mismatch` | acceptance나 제품 의도가 틀림 | `recipe` |
| `human-gated decision` | 승인 없이는 고칠 수 없는 결정 | 사용자 승인 요청 |

## 수정 범위

허용되는 변경은 실패 원인에 직접 연결된 product code, test, fixture, command profile의 최소 수정입니다. 반복되는 함정이 확인된 경우에만 debugging/verification runbook이나 memory를 보강합니다.

금지되는 변경은 새 기능 scope, 승인되지 않은 acceptance 변경, version/changelog/tag, deploy/push/publish입니다. release 준비 파일의 불일치는 `wrap`, release gate와 local tag 문제는 `serve`의 책임입니다.

## Subagent 연계

| Subagent | 사용 시점 |
| --- | --- |
| `tester` | 재현 test, focused command, e2e/manual check 판단 |
| `implementor` | root cause 확인 후 최소 코드 수정이 분리 가능할 때 |
| `security-auditor` | auth, secret, injection, unsafe IO, data-loss 위험이 관련될 때 |

원인이 확인되기 전에는 구현을 위임하지 않습니다. subagent에는 증상, 재현 command, 관련 spec, 실패 로그 경로, write scope, 금지 작업을 함께 전달합니다.

## Handoff 필수 항목

권장 경로는 `.agent/spec/handoffs/NNNN-fix.md`입니다.

- symptom과 reported context
- repro command와 failing evidence
- classification과 root cause
- affected contract
- changed files
- regression coverage
- focused/test/e2e/verify 결과
- remaining risk와 not fixed 범위
- next skill

## Loop Recommendation

- 수정이 완료됐고 regression coverage가 있으면 `taste`로 보냅니다.
- spec/acceptance가 틀렸으면 `recipe`로 보냅니다.
- 구현 slice가 아직 남았으면 `cook`으로 보냅니다.
- 동작 변경 없이 구조 개선이 필요하면 `tidy`로 보냅니다.
- version/changelog/release prep 문제면 `wrap`으로 보냅니다.

## 검증 포인트

`fix` 스킬을 변경할 때는 다음을 확인합니다.

```bash
test -f plugins/vibe-recipe/skills/fix/SKILL.md
test -f plugins/vibe-recipe/docs/skills/FIX.md
grep -q 'Fix Summary' plugins/vibe-recipe/skills/fix/SKILL.md
grep -q 'code defect' plugins/vibe-recipe/skills/fix/SKILL.md
node plugins/vibe-recipe/scripts/build-universal-agents-md.mjs /tmp/vibe-recipe-AGENTS.md
grep -q 'fix (debug)' /tmp/vibe-recipe-AGENTS.md
```

스크립트나 JSON을 함께 수정했다면 해당 파일에는 별도 문법 검증을 실행합니다.
