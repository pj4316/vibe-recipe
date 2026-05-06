# Recipe 동작 문서

`recipe`는 자연어 요청을 numbered 제품 spec으로 바꾸는 planning skill입니다. 코드를 구현하지 않고, 구현 task도 작성하지 않습니다. 제품 행동, scope, 사용자 시나리오, 수락 기준, 성공 기준, domain 용어, 결정 기록을 확정합니다.

대화는 실제 VC 상담가처럼 진행합니다. 막연한 아이디어를 그대로 문서화하는 것이 아니라, 추천 방향을 먼저 제시하고, 우려사항을 자연스럽게 질문하고, 사용자의 답을 반영해 다시 요약하는 티키타카로 spec을 확정합니다.

기본 루프는 다음과 같습니다.

1. 현재 이해 요약
2. 추천 방향 제안
3. 우려사항 질문 1-3개
4. 추천 답 또는 선택지 제시
5. 반영된 spec 방향 재요약

사용자가 “맞다”라고 확인하기 전에는 확정된 요구사항처럼 밀어붙이지 않습니다.

## 목표

- 비개발자도 답할 수 있는 제품 언어로 요구사항을 구체화합니다.
- 구현 전에 `.agent/spec/active/NNNN-<slug>.md` draft spec을 만듭니다.
- `Alignment Brief`가 있으면 goal, audience, MVP, non-goal, success criteria를 spec 초안으로 사용합니다.
- `US-###`, `AC-###`, `FR-###`, `SC-###`로 후속 `plate`가 추적할 수 있는 요구사항 ID를 남깁니다.
- 새 용어, 역할, 상태, 위험한 오해를 `.agent/wiki/domain.md`와 맞춥니다.
- 되돌리기 어렵고 맥락 없이는 놀라운 trade-off만 `.agent/wiki/decisions/` ADR 후보로 남깁니다.
- agent가 red-team 시나리오를 먼저 채우고, 사용자는 제품적으로 관찰되는 결과만 결정합니다.
- 구현 접근, 파일 경계, task breakdown, command별 검증 계획은 `plate`가 작성하도록 남깁니다.

## Alignment Brief 연계

| Alignment Brief | Recipe 반영 위치 |
| --- | --- |
| `Goal` | spec 요약과 사용자 시나리오 |
| `Audience` | 사용자 요구의 Actor |
| `MVP` | P1 사용자 시나리오와 independent test |
| `Non-goals` | 제외 범위 |
| `Success criteria` | `SC-###` 성공 기준과 acceptance |
| `Domain terms` | `.agent/wiki/domain.md` update 후보 |
| `Assumptions` | 위험과 가정, dangerous assumption |
| `AI interpretation` | scope boundary와 open question |

`Alignment Brief`는 spec approval을 대체하지 않습니다. `recipe`는 brief를 draft 입력으로 쓰고, 구현을 막는 빈칸과 위험한 scope는 다시 확인합니다.

## Domain 용어집

`recipe`는 `CONTEXT.md`를 만들지 않습니다. `vibe-recipe` 프로젝트에서 domain language의 source of truth는 `.agent/wiki/domain.md`입니다.

- 사용자-facing 용어와 내부 운영 용어가 충돌하면 즉시 확인합니다.
- 모호한 단어는 canonical term을 정하고 피해야 할 표현을 남깁니다.
- 새 term, role, state, dangerous assumption은 spec의 `Domain 업데이트`에 적고 domain 문서에 반영합니다.
- 일반 프로그래밍 개념은 domain 문서에 넣지 않습니다.
- 구현 중 발견한 용어 충돌은 handoff에 남기고 `recipe` 또는 `librarian`으로 정리합니다.

## Red-team 보강

`recipe`는 사용자에게 기술 구현 질문을 늘리지 않고, spec 단계에서 실패/악용 시나리오를 먼저 점검합니다.

- happy path acceptance와 failure/abuse acceptance를 각각 최소 1개 둡니다.
- duplicate/replay, partial failure, permission bypass, data-loss/rollback, boundary input을 검토합니다.
- 관련 없는 항목은 `none`으로 두고 이유를 짧게 남깁니다.
- scenario는 `spec change`, `code fix`, `follow-up`, `not applicable` 중 하나로 분류합니다.
- idempotency key, transaction boundary, lock, rollback pattern 같은 구현 방식은 사용자에게 묻지 않습니다.
- 제품 scope나 human gate가 바뀌면 open question으로 남기고 Draft 상태를 유지합니다.

## Plate와의 경계

`recipe`가 완료된 뒤에도 바로 `cook`으로 넘어가지 않습니다. `plate`가 같은 spec을 읽고 아래 항목을 채워야 합니다.

- 구현 계획
- 작업 목록
- 검증 계획
- `Plate 상태: Planned`

`recipe`에는 `Task 0`, 파일 경로, write scope, check command, 작업 실행 기록을 쓰지 않습니다. 이 정보가 필요해지는 순간은 `plate` 단계입니다.

## ADR 후보

ADR 후보는 세 조건을 모두 만족할 때만 `.agent/wiki/decisions/NNNN-<slug>.md`에 `Status: Proposed`로 남깁니다.

- 나중에 바꾸기 어렵습니다.
- 맥락 없이 보면 미래 reader가 의아해할 수 있습니다.
- 실제 trade-off가 있었고 대안 중 하나를 고른 결정입니다.

기술 선택 조사, vendor 비교, architecture option 비교가 필요하면 `recipe`가 직접 결정하지 않고 `forage/research`로 보냅니다.

## 완료 조건

- blocking open question이 없습니다.
- goal과 non-goal이 분리되어 있습니다.
- 사용자 시나리오와 수락 기준이 관찰 가능한 결과로 작성되어 있습니다.
- `US-###`, `AC-###`, `FR-###`, `SC-###`가 후속 계획에서 참조할 수 있게 작성되어 있습니다.
- 구현 task와 검증 command mapping이 섞이지 않았습니다.
- red-team scenario가 검토되고 분류되어 있습니다.
- domain 용어 충돌이 해결되었거나 open question으로 남아 있습니다.
- ADR 후보가 필요한 결정은 proposed ADR로 남았거나 `forage`로 라우팅되었습니다.
- `Plate 상태`가 `Not planned`이며 다음 단계가 `plate`인지 명확합니다.
- 사람 승인 전에는 spec status를 `Approved`로 바꾸지 않습니다.
