# Taste 동작 문서

`taste`는 `cook`, `fix`, `tidy` 이후 변경을 검수하는 review orchestrator입니다. 코드를 수정하지 않고, spec과 구현 증거를 비교해 `APPROVE`, `REQUEST_CHANGES`, `BLOCK` 중 하나의 verdict를 냅니다.

`taste`는 subagent가 아니라 사용자가 호출할 수 있는 top-level skill입니다. 내부에서 `tester`, `reviewer`, `security-auditor`, `red-team` subagent를 조율하지만, verdict와 loop recommendation은 `taste`가 합성합니다. report 이후 실제 다음 skill 실행은 parent agent 또는 opt-in된 `autopilot`이 맡습니다.

## 목표

- recipe acceptance matrix와 task-runner handoff를 읽고 요구사항 충족 여부를 확인합니다.
- focused command, `test`, `e2e`, `verify`, manual check 증거를 분리합니다.
- `tester`, `reviewer`, `security-auditor`, `red-team` 결과를 합성합니다.
- merge blocker와 follow-up concern을 구분합니다.
- 다음 loop를 `cook`, `fix`, `recipe`, `tidy`, `wrap`, `serve` 중 하나로 명확히 추천합니다.
- review report를 현재 spec 번호에 맞는 `.agent/spec/handoffs/NNNN-taste.md`에 남겨 `peek`, `wrap`, `serve`가 같은 spec의 최신 verdict를 재사용할 수 있게 합니다.
- blocked 또는 request_changes면 reason만이 아니라 why/how-to-unblock도 함께 남깁니다.

## 시작 조건

- active spec 또는 완료 직전 spec의 path와 status를 확인합니다.
- `cook`, `fix`, `tidy` 중 직전 실행의 summary 또는 handoff를 읽습니다.
- 변경 diff 범위와 `git status`를 확인해 관련 없는 사용자 변경을 review 범위에서 분리합니다.
- `.agent/commands.json`에서 focused command, `test`, `e2e`, `verify` 상태를 확인합니다.
- `.agent/spec/design.md`, 관련 ADR, `.agent/memory/red-team-findings.md`를 필요한 범위에서 읽습니다.
- release, deploy, push, auth/payment/data-loss 같은 human gate가 필요한 변경은 승인 상태를 확인합니다.

## Context hygiene

`taste`의 메인 에이전트는 원자료를 장시간 들고 있는 reviewer가 아니라 bounded evidence를 합성하는 orchestrator입니다. 메인 컨텍스트에는 최종 판단에 필요한 최소 요약, path, command 결과, finding만 유지합니다.

- 전체 diff, 긴 로그, 큰 파일 본문을 메인 대화나 report에 복사하지 않습니다.
- subagent에는 원문 내용 대신 spec path, diff scope, handoff path, command profile, focus area를 우선 전달합니다.
- raw file이나 raw diff는 blocker 판단에 꼭 필요한 짧은 범위만 읽고, 합성 후 report에는 file/line, command, handoff path 같은 evidence reference로 남깁니다.
- subagent 결과는 severity, affected behavior, evidence reference, recommended next skill 중심으로 compact하게 받습니다.
- 반복되는 red-team/security pattern은 긴 설명을 메인 컨텍스트에 유지하지 말고 `librarian`이 `.agent/memory/red-team-findings.md`에 정리하도록 recommendation에 남깁니다.
- `taste` 완료 후 메인 응답은 verdict, blocker, coverage gap, next loop만 요약하고 상세 원자료는 현재 spec의 `.agent/spec/handoffs/NNNN-taste.md`를 가리킵니다.

## Verdict 기준

| Verdict | 의미 |
| --- | --- |
| `APPROVE` | acceptance가 covered이고 BLOCKER가 없으며 남은 항목은 선택적 follow-up입니다. |
| `REQUEST_CHANGES` | 요구사항 충족을 위해 추가 구현, bugfix, test 보강이 필요합니다. |
| `BLOCK` | spec mismatch, failing release gate, security/data-loss 위험, human gate 미승인이 있습니다. |

verdict 우선순위는 `BLOCK` > `REQUEST_CHANGES` > `APPROVE`입니다. project `verify`가 `null`이거나 실패하면 기본 verdict는 `BLOCK`입니다.

## 6단계 Flow

1. Preflight: active spec, cook summary, task handoff, git diff, command profile을 확인합니다.
2. Regression: focused command와 project verify 결과를 확인하거나 필요한 범위에서 실행합니다.
3. Coverage: acceptance criteria별 evidence를 `covered`, `blocked`, `not covered`, `manual only`로 분류합니다.
4. Code review: `reviewer`가 spec 부합성, correctness, maintainability, local convention을 점검합니다.
5. Security/red-team: `security-auditor`와 `red-team`이 release blocker와 adversarial risk를 분리합니다.
6. Synthesis: 중복 finding을 합치고 verdict, coverage gap, loop recommendation을 작성합니다.

## Subagent 역할

| Agent | 역할 |
| --- | --- |
| `tester` | acceptance별 verification evidence와 coverage gap 확인 |
| `reviewer` | diff가 spec, architecture, local convention에 맞는지 검토 |
| `security-auditor` | auth, secret, injection, dependency, data-loss 위험 검토 |
| `red-team` | abuse, replay, race, boundary, timezone/locale 위험 검토 |

모든 subagent는 read-only입니다. 수정은 `taste`가 아니라 후속 `cook`, `fix`, `tidy`에서 수행합니다. `taste` 자체도 제품 코드, test, generated artifact, active spec 본문을 수정하지 않으며, 허용되는 쓰기는 현재 spec 번호에 해당하는 `.agent/spec/handoffs/NNNN-taste.md` report뿐입니다.

각 subagent에는 동일한 입력 패킷을 넘깁니다.

```markdown
Spec:
Diff scope:
Handoff:
Command profile:
Focus area:
Return format: severity, affected behavior, evidence reference, recommendation
Forbidden writes: product code, tests, generated artifacts, spec edits
```

## Report 필수 항목

- verdict와 한 문장 이유
- source spec, diff scope, handoff source, evidence refs
- regression 결과
- acceptance coverage
- project verify 결과 또는 blocked 이유
- BLOCKER, CONCERN, SUGGESTION
- coverage gap
- loop recommendation
- blocked 또는 request_changes인 경우 why this gate exists, how to unblock

report 저장 위치는 현재 spec 번호에 해당하는 `.agent/spec/handoffs/NNNN-taste.md`입니다. spec 자체가 틀렸다면 active spec을 고치지 말고 report에서 `recipe` escalation을 남깁니다.

## Loop Recommendation 매핑

- scope mismatch, acceptance criteria 오류, 제품 결정 누락은 `recipe`로 보냅니다.
- 승인된 task가 남았거나 구현 slice가 미완성이면 추가 `cook`으로 보냅니다.
- regression, bug, failing test처럼 원인이 좁혀진 구현 결함은 `fix`로 보냅니다.
- 동작 변경 없이 구조나 boundary 정리가 필요하면 `tidy`로 보냅니다.
- verdict가 `APPROVE`이고 version/changelog 준비가 필요하면 `wrap`으로 보냅니다.
- `wrap`이 끝났고 release gate만 남았으면 `serve`로 보냅니다.

## 검증 포인트

`taste` 스킬을 변경할 때는 다음을 확인합니다.

```bash
test -f plugins/vibe-recipe/skills/taste/SKILL.md
test -f plugins/vibe-recipe/docs/skills/TASTE.md
grep -q 'APPROVE / REQUEST_CHANGES / BLOCK' plugins/vibe-recipe/skills/taste/SKILL.md
grep -q '.agent/spec/handoffs/NNNN-taste.md' plugins/vibe-recipe/skills/taste/SKILL.md
node plugins/vibe-recipe/scripts/build-universal-agents-md.mjs /tmp/vibe-recipe-AGENTS.md
grep -q 'taste (review)' /tmp/vibe-recipe-AGENTS.md
```
