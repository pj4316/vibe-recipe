---
name: forage
description: /vr:forage 또는 /vr:research 호출 시 사용합니다. 계획 전에 옵션을 조사하고 구현 없이 proposed ADR을 작성합니다.
---

# forage (research) - 재료 찾기

접근 방식, 라이브러리, vendor, API, architecture 선택지가 불명확할 때 `recipe` 전에 사용합니다.

`forage`는 구현을 하지 않는 planning/research skill입니다. 목표는 선택지를 줄이고, 선택 이유와 뒤집힐 조건을 proposed ADR로 남겨 `recipe`가 구현 가능한 spec을 작성하게 만드는 것입니다.

## 시작 조건

- 사용자가 `/vr:forage`, `/vr:research`, 기술 조사, vendor 비교, library 선택, API 선택, architecture 선택을 요청했습니다.
- 같은 대화의 `Alignment Brief` 또는 product goal이 있고, 없다면 결정 질문을 제품 언어로 먼저 좁힙니다.
- `.agent/spec/prd.md`, `.agent/spec/design.md`, `.agent/wiki/domain.md`, `.agent/wiki/decisions/`를 필요한 범위에서 읽었습니다.
- 관련 active/done spec과 기존 ADR을 확인해 이미 accepted된 결정을 다시 열지 않습니다.
- `git status --short`로 작업 트리를 확인했고, 관련 없는 사용자 변경을 되돌리지 않습니다.

## Decision question

조사 전에 하나의 결정 질문을 명확히 씁니다.

```markdown
Decision question:
Context:
Must-have constraints:
Nice-to-have preferences:
Out of scope:
Decision owner: human / team / default recommendation
```

결정 질문이 둘 이상이면 가장 blocking한 질문 하나만 먼저 다룹니다. 제품 scope 자체가 불명확하면 `recipe`에서 제품 질문으로 먼저 정렬합니다.

## Evidence 기준

- 외부 기술 사실은 official docs, standards, release notes, source repository, vendor pricing/security page 같은 primary source를 우선합니다.
- 블로그, benchmark, community 글은 보조 근거로만 사용하고 primary source와 충돌하면 primary source를 따릅니다.
- 최신 model, API, pricing, dependency, security, license, platform support처럼 변할 수 있는 정보는 현재 source로 확인합니다.
- 확인하지 못한 사실은 확정처럼 쓰지 않고 `Unknown` 또는 `Needs verification`으로 표시합니다.
- source link, 확인 날짜, 버전 또는 문서 위치를 ADR 초안에 남깁니다.

## Option 비교

가능한 선택지는 2-4개로 제한합니다. 각 option은 같은 기준으로 비교합니다.

| 항목 | 내용 |
| --- | --- |
| Fit | 제품 goal, current architecture, domain constraint에 맞는 정도 |
| Tradeoff | 얻는 것과 포기하는 것 |
| Risk | security, reliability, migration, lock-in, operations 위험 |
| Cost | money, complexity, maintenance, learning cost |
| Migration | 기존 코드와 데이터에 미치는 영향 |
| Reversal | 선택을 되돌리는 난이도 |
| Verification | 선택이 맞는지 확인할 spike/check |

선택지를 일부러 많이 늘리지 않습니다. 명백히 부적합한 option은 짧게 제외 이유만 남깁니다.

## 흐름

1. PRD/design 문서에서 decision question과 제약을 확인합니다.
2. 기존 accepted ADR, architecture note, dependency, package manifest를 읽어 이미 결정된 경계를 확인합니다.
3. 가능한 선택지 2-4개를 같은 비교 기준으로 조사합니다.
4. 외부 기술 사실은 primary source로 확인하고 source와 확인 날짜를 남깁니다.
5. 하나의 선택지를 추천하고, 그 추천을 뒤집을 조건을 명시합니다.
6. `.agent/wiki/decisions/NNNN-<slug>.md`에 `Status: Proposed` ADR 초안을 작성합니다.
7. `recipe`가 반영할 constraint, task implication, validation check를 요약합니다.

## ADR 초안 형식

권장 경로는 `.agent/wiki/decisions/NNNN-<slug>.md`입니다. 번호는 기존 decision 문서와 충돌하지 않는 다음 번호를 사용합니다.

```markdown
# NNNN: <decision title>

Status: Proposed
Date: YYYY-MM-DD
Owner: human approval required

## Decision question

## Context

## Constraints

## Options considered

| Option | Fit | Tradeoff | Risk | Cost | Migration | Reversal |
| --- | --- | --- | --- | --- | --- | --- |

## Recommendation

## Why this could be wrong

## Validation plan

## Impact on recipe

## Sources
```

## Escalation

| 상황 | 다음 skill |
| --- | --- |
| 제품 goal, audience, success criteria가 불명확함 | `recipe` alignment 질문 |
| 기능 scope와 acceptance를 spec으로 써야 함 | `recipe` |
| 이미 승인된 spec 구현 중 발견한 세부 선택임 | `cook`에서 bounded spike 또는 `recipe` 보강 |
| 선택 후 코드 변경이 필요함 | `recipe` 승인 후 `cook` |
| 승인된 ADR이 오래됐거나 충돌함 | 사람 승인 후 supersession ADR 제안 |

## 완료 조건

- 결정 질문이 하나로 좁혀져 있습니다.
- 2-4개 option이 같은 기준으로 비교되었습니다.
- 추천 option과 추천을 뒤집을 조건이 있습니다.
- primary source 또는 확인 불가 표시가 남았습니다.
- proposed ADR이 작성되었고 accepted로 표시되지 않았습니다.
- `recipe`가 반영할 constraint와 validation check가 명확합니다.

## Git

ADR을 작성할 때는 `research/NNNN-slug` branch를 사용합니다. 추천 commit prefix는 `docs(adr):`입니다.

## 경계

- product code를 구현하지 않습니다.
- `prd.md` scope를 수정하지 않습니다.
- 사람 승인 없이 ADR을 accepted로 표시하지 않습니다.
- 승인된 ADR을 조용히 수정하지 않습니다. 바뀐 결정은 새 supersession ADR 후보로 남깁니다.
- vendor signup, purchase, cloud resource 생성, external API side effect를 실행하지 않습니다.
