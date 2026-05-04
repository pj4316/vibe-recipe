---
name: taste
description: cook, fix, tidy 이후 recipe acceptance, task handoff, diff, verification evidence를 종합해 APPROVE / REQUEST_CHANGES / BLOCK verdict를 냅니다. /vr:taste 호출, merge 전 review, TDD loop 판정, security/red-team 검수가 필요할 때 사용합니다.
---

# taste (review) - 맛보기

`cook`, `fix`, `tidy` 이후와 merge 전에 사용합니다. `taste`는 코드를 수정하지 않는 review orchestrator입니다. 목적은 recipe가 요구한 행동이 실제 변경과 검증 증거로 충족됐는지 판단하고, 다음 loop를 명확히 정하는 것입니다.

## 대화 톤

- 리뷰 결과는 사람을 평가하듯 말하지 않고, 변경 사항과 남은 위험을 차분하게 설명합니다.
- blocker가 있으면 먼저 이유를 쉽게 설명하고, 어떤 후속 skill로 어떻게 풀 수 있는지 같이 안내합니다.
- technical finding은 사용자가 이해할 수 있는 영향 중심으로 요약하고, 자세한 근거는 report path로 연결합니다.
- 승인 가능한 상태라면 안심할 수 있게 근거를 짧게 정리하고 다음 단계를 분명하게 제안합니다.

## 역할 구분

- `taste`는 사용자가 호출할 수 있는 top-level orchestrator skill입니다.
- `taste`는 reviewer, tester, security-auditor, red-team subagent를 조율합니다.
- subagent는 finding을 반환하고, verdict와 loop recommendation은 `taste`가 합성합니다.
- 다음 skill을 실제 실행하는 것은 parent agent 또는 opt-in된 `autopilot`입니다.
- `taste`와 review subagent는 제품 코드를 수정하지 않습니다. 허용되는 쓰기는 현재 spec 번호에 해당하는 `.agent/spec/handoffs/NNNN-taste.md` report뿐입니다.

## 시작 조건

- active spec 또는 완료 직전 spec이 있고, spec path와 status를 확인했습니다.
- `cook`, `fix`, `tidy` 중 직전 실행의 summary 또는 handoff를 읽었습니다.
- 변경 diff 범위와 `git status`를 확인했고, 관련 없는 사용자 변경을 review 범위에 섞지 않습니다.
- `.agent/commands.json`에서 focused command, `test`, `e2e`, `verify` 상태를 확인했습니다.
- `.agent/spec/design.md`, 관련 ADR, `.agent/memory/red-team-findings.md`를 필요한 범위에서 읽었습니다.
- human gate가 필요한 release, deploy, push, auth/payment/data-loss 변경은 승인 상태를 확인했습니다.

## Context hygiene

`taste`의 메인 에이전트는 원자료를 장시간 들고 있는 reviewer가 아니라 bounded evidence를 합성하는 orchestrator입니다. 메인 컨텍스트에는 최종 판단에 필요한 최소 요약, path, command 결과, finding만 유지합니다.

- 전체 diff, 긴 로그, 큰 파일 본문을 메인 대화나 report에 복사하지 않습니다.
- subagent에는 원문 내용 대신 spec path, diff scope, handoff path, command profile, focus area를 우선 전달합니다.
- raw file이나 raw diff는 blocker 판단에 꼭 필요한 짧은 범위만 읽고, 합성 후 report에는 file/line, command, handoff path 같은 evidence reference로 남깁니다.
- subagent 결과는 severity, affected behavior, evidence reference, recommended next skill 중심으로 compact하게 받습니다.
- 반복되는 red-team/security pattern은 긴 설명을 메인 컨텍스트에 유지하지 말고 `librarian`이 `.agent/memory/red-team-findings.md`에 정리하도록 recommendation에 남깁니다.
- `taste` 완료 후 메인 응답은 verdict, blocker, coverage gap, next loop만 요약하고 상세 원자료는 현재 spec의 `.agent/spec/handoffs/NNNN-taste.md`를 가리킵니다.

## Verdict

- verdict 우선순위는 `BLOCK` > `REQUEST_CHANGES` > `APPROVE`입니다.
- project `verify`가 `null`이거나 실패하면 기본 verdict는 `BLOCK`입니다.
- `APPROVE`: acceptance가 covered이고 BLOCKER가 없으며 merge 전 남은 것은 선택적 follow-up뿐입니다.
- `REQUEST_CHANGES`: 요구사항 충족을 위해 추가 `cook` 또는 `fix`가 필요합니다.
- `BLOCK`: spec mismatch, failing release gate, security/data-loss 위험, human gate 미승인이 있어 진행을 멈춥니다.

## 6단계 Flow

1. Preflight: spec status, cook summary, handoff, git diff, command profile을 확인합니다.
2. Regression: focused command와 project `verify` 결과를 확인하고 필요하면 실행합니다.
3. Coverage: acceptance matrix와 task `Check`별 evidence를 대조합니다.
4. Code review: `reviewer`로 spec 부합성, maintainability, local convention을 점검합니다.
5. Security and red-team: `security-auditor`, `red-team`으로 위험을 분리 검토합니다.
6. Synthesis: findings를 중복 제거하고 verdict와 다음 loop를 정합니다.

## Subagent 사용

- `tester`: acceptance별 verification evidence와 coverage gap을 확인합니다.
- `reviewer`: diff가 spec, architecture, local convention에 맞는지 봅니다.
- `security-auditor`: auth, secret, injection, unsafe IO, dependency, data-loss 위험을 봅니다.
- `red-team`: abuse, replay, race, boundary, timezone/locale, automation 위험을 봅니다.

모든 review subagent는 read-only입니다. 파일을 고치지 않고 finding만 부모 `taste`에 반환합니다.

각 subagent에는 아래 입력 패킷을 넘깁니다.

```markdown
Spec:
Diff scope:
Handoff:
Command profile:
Focus area:
Return format: severity, affected behavior, evidence reference, recommendation
Forbidden writes: product code, tests, generated artifacts, spec edits
```

## Coverage 판단

- 각 acceptance는 `covered`, `blocked`, `not covered`, `manual only` 중 하나로 분류합니다.
- manual check는 누가 무엇을 확인했는지와 자동화할 수 없는 이유가 있어야 합니다.
- UI/browser workflow는 `e2e` command 또는 Playwright MCP evidence가 없으면 coverage gap으로 표시합니다.
- `verify`가 `null`이거나 실패하면 release-ready가 아니며 verdict는 `BLOCK`입니다.

## 출력 계약

`taste`는 review report를 현재 spec 번호에 맞는 `.agent/spec/handoffs/NNNN-taste.md`에 남깁니다. 이 파일은 `peek`, `wrap`, `serve`가 같은 spec의 최신 verdict를 재사용할 수 있는 source입니다.

제품 코드, test, generated artifact, active spec 본문은 수정하지 않습니다. spec 자체가 틀렸다면 report에 `recipe` escalation을 남깁니다.

## Report format

```markdown
# Taste Report: NNNN <slug>
Verdict: APPROVE / REQUEST_CHANGES / BLOCK
Reason:
Source spec:
Diff scope:
Handoff source:
Evidence refs:

## Summary
무엇이 바뀌었고, recipe가 어디까지 충족됐으며, 무엇이 merge를 막는지 설명합니다.

## Verification
- Regression:
- Acceptance coverage:
- Project verify:
- Manual checks:

## Findings
- BLOCKER:
- CONCERN:
- SUGGESTION:

## Coverage Gap
## Loop Recommendation
`cook`, `fix`, `recipe`, `tidy`, `wrap`, `serve` 중 다음 경로와 이유를 제안합니다.

blocked 또는 request_changes면 report와 최종 응답에 아래를 함께 남깁니다.

- `Blocked reason` 또는 `Change needed`
- `Why this gate exists`
- `How to unblock`
```

## Loop Recommendation 매핑

- scope mismatch, acceptance criteria 오류, 제품 결정 누락은 `recipe`로 보냅니다.
- 승인된 task가 남았거나 구현 slice가 미완성이면 추가 `cook`으로 보냅니다.
- regression, bug, failing test처럼 원인이 좁혀진 구현 결함은 `fix`로 보냅니다.
- 동작 변경 없이 구조나 boundary 정리가 필요하면 `tidy`로 보냅니다.
- verdict가 `APPROVE`이고 version/changelog 준비가 필요하면 `wrap`으로 보냅니다.
- `wrap`이 끝났고 release gate만 남았으면 `serve`로 보냅니다.

## 규칙

- blocker를 먼저 제시하고 merge blocker와 follow-up concern을 분리합니다.
- product scope를 조용히 바꾸지 않습니다. scope 문제는 `recipe`로 돌려보냅니다.
- 구현 결함은 `fix` 또는 추가 `cook`, 구조 개선은 `tidy`, release 준비는 `wrap`으로 보냅니다.
- failing command를 숨기거나 manual check를 자동 검증처럼 보고하지 않습니다.
- 사람이 승인해야 하는 release, deploy, push, auth/payment/data-loss 작업은 승인 전 `BLOCK`입니다.
- report 저장 외의 파일 변경이 필요하면 `taste`에서 직접 수행하지 말고 loop recommendation으로 넘깁니다.
