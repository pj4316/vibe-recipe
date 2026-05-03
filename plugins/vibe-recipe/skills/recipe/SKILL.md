---
name: recipe
description: /vr:recipe 또는 /vr:plan 호출 시 사용합니다. 비개발자도 답할 수 있는 제품 질문으로 사용자 요구사항을 상세화하고, 구현 전에 번호가 붙은 feature spec과 승인 가능한 작업 레시피를 준비합니다.
---

# recipe (plan) - 레시피 작성

자연어 요청을 구현 전에 번호가 붙은 feature spec으로 바꿀 때 사용합니다. 목표는 사용자가 기술 용어를 몰라도, 구현자가 바로 task를 나눌 수 있을 만큼 정확한 요구사항을 끌어내는 것입니다.

`recipe`는 코드를 구현하지 않습니다. 제품 행동, 사용자 흐름, 예외, 성공 기준, 검증 방법을 확정하고, 승인된 뒤 `cook/dev`가 구현할 수 있는 spec을 만듭니다.

## Resources

- `resources/question-bank.md`: 요구사항을 세분화할 때 쓰는 비개발자 친화 질문 은행입니다. 답이 부족하거나 기능 유형별 drill-down이 필요할 때 읽습니다.
- `resources/spec-template.md`: `.agent/spec/active/NNNN-<slug>.md` 생성 시 사용하는 고정 템플릿입니다. spec 파일을 만들 때 읽습니다.
- 같은 대화의 제품 brief나 이전 alignment 메모: 있으면 사용자 요구, 목표, 제외 범위, 성공 기준, domain term 초안으로 사용합니다.

## Routing

시작 전에 `AGENTS.md`의 `Recipe Routing`을 먼저 읽고, 요청이 정말 `recipe` 대상인지 확인합니다.

| 요청 | 처리 |
| --- | --- |
| 새 기능, 제품 동작 변경, scope 변경 | `recipe`에서 spec 작성 |
| 접근 방식, library, vendor, API 선택이 불명확함 | `forage`로 ADR 초안 작성 후 `recipe` |
| 장애, bug, failing test, 원인 불명 | `fix`로 root cause 분석 |
| 동작 변경 없는 구조 개선 | `tidy`로 refactor spec 또는 작업 |
| UI token, component pattern, visual drift 정리 | `recipe`로 design-system 정책 spec 작성, 코드 이관은 `tidy` |
| version, changelog, release 준비 | `wrap` |
| release gate, tag, push/deploy 전 점검 | `serve` |

요청이 다른 skill에 더 적합하면 이유를 짧게 설명하고 해당 skill로 라우팅합니다. 단, 사용자가 명시적으로 “이것을 spec으로 만들어줘”라고 요청하면 `recipe`가 follow-up spec을 작성할 수 있습니다.

## Preflight

작업을 시작하기 전에 kitchen harness가 준비되었는지 확인합니다.

- `AGENTS.md`, `CLAUDE.md`, `.agent/constitution.md`, `.agent/spec/prd.md`, `.agent/spec/design.md`, `.agent/commands.json`이 없으면 spec을 만들지 말고 `kitchen/init`을 먼저 안내합니다.
- `.agent/memory/gotchas.md`, `.agent/spec/active/0001-health-check.md`, `.agent/runbooks/verification.md`, `.agent/runbooks/debugging.md`, `.agent/runbooks/deployment.md`, `.hooks/pre-commit.sh`가 없으면 불완전 harness로 보고 `kitchen/heal`을 먼저 안내합니다.
- `.agent/constitution.md`와 `.agent/spec/prd.md`의 product scope를 벗어나는 요청이면 scope 변경으로 표시하고 사용자 확인을 받습니다.
- `.agent/commands.json`의 `test`, `e2e`, `verify` 상태를 확인해 spec의 test plan에 반영합니다.
- 같은 대화에 `Alignment Brief`가 있으면 `Goal`, `Audience`, `MVP`, `Non-goals`, `Success criteria`, `Domain terms`, `Assumptions`, `AI interpretation`을 읽고 spec과 domain update 초안에 반영합니다.
- 관련 ADR이 있으면 읽고, 접근 방식이 불명확하면 구현 spec을 쓰기 전에 `forage/research`로 보냅니다.

## 흐름

1. `AGENTS.md`의 `Recipe Routing`, constitution, PRD, design, architecture, domain, command profile, 관련 ADR을 읽습니다.
2. 사용자 요청을 제품 언어로 요약하고, 구현에 필요한 정보 중 비어 있는 부분만 질문합니다.
3. 같은 대화에 `Alignment Brief`가 있으면 spec의 goal/non-goal/success criteria/domain draft로 매핑하고, 사용자에게 수정할 기회를 줍니다.
4. 답이 부족하면 `resources/question-bank.md`에서 기능 유형에 맞는 질문을 고릅니다.
5. 새 용어, 역할, 상태, 위험한 assumption은 `.agent/wiki/domain.md`와 비교해 충돌과 모호성을 먼저 해결합니다.
6. hard-to-reverse, surprising-without-context, real-tradeoff 조건을 모두 만족하는 결정만 `.agent/wiki/decisions/NNNN-<slug>.md` proposed ADR 후보로 남깁니다.
7. agent가 misuse, duplicate/replay, partial failure, permission bypass, data-loss/rollback 가능성을 먼저 추론하고, 제품 결정이 필요한 경우만 사용자에게 쉬운 말로 확인합니다.
8. active, done, archived, abandoned folder 전체에서 다음 global spec number를 찾습니다.
9. `resources/spec-template.md`를 기준으로 `.agent/spec/active/NNNN-<slug>.md`를 `Status: Draft`로 생성합니다.
10. user flow, acceptance criteria, edge cases, red-team scenarios, task breakdown, test plan, risk, rollout, open questions, domain updates, ADR 후보를 포함합니다.
11. 사람 승인 전에는 `Approved`로 바꾸지 않습니다. 승인 후에만 status를 `Approved`로 바꾸고 `feat/NNNN-slug`, `fix/NNNN-slug`, `refactor/NNNN-slug` branch를 준비합니다.

## Alignment Brief 반영

같은 대화에 제품 brief나 이전 alignment 메모가 있으면 아래처럼 반영합니다.

| Alignment Brief | Recipe 반영 위치 |
| --- | --- |
| `Goal` | spec `요약`, `목표` |
| `Audience` | spec `사용자 요구`의 Actor |
| `MVP` | spec `목표`, `사용자 흐름`, task 후보 |
| `Non-goals` | spec `제외 범위` |
| `Success criteria` | spec `수락 기준`, `검증 계획` |
| `Domain terms` | `.agent/wiki/domain.md` update 후보 |
| `Assumptions` | spec `위험과 가정`, domain dangerous assumption 후보 |
| `AI interpretation` | spec `요약`, open question, scope boundary |
| `Recommended next skill` | routing 확인. 기술 선택이면 `forage`, 구현 가능하면 `cook` 준비 |

Alignment 메모는 사용자가 승인한 의도 정렬 결과일 수 있지만, spec approval을 대체하지 않습니다. `recipe`는 brief를 draft 입력으로 사용하고, 구현을 막는 빈칸이나 위험한 scope는 다시 확인합니다.

brief가 현재 `.agent/constitution.md`, `.agent/spec/prd.md`, `.agent/spec/design.md`, `.agent/wiki/domain.md`와 충돌하거나 오래된 전제에 기대면 그대로 반영하지 않습니다. 충돌은 spec의 `위험과 가정` 또는 `열린 질문`에 남기고, 제품 의도가 필요한 부분만 사용자에게 확인합니다.

## Domain 문서 갱신

`recipe`는 용어와 결정 정리를 `vibe-recipe`의 `.agent` 구조에 맞춰 수행합니다.

- `CONTEXT.md`를 만들지 않습니다. source of truth는 `.agent/wiki/domain.md`입니다.
- 사용자-facing 용어와 내부 운영 용어가 충돌하면 즉시 짚고 canonical term을 고릅니다.
- 사용자가 모호한 단어를 쓰면 “이 문맥에서는 A인가요, B인가요?”처럼 제품 언어로 좁혀 묻습니다.
- 코드나 기존 문서가 사용자 설명과 다르면 contradiction을 보여주고 어느 쪽을 기준으로 할지 확인합니다.
- 확정된 제품 용어, 역할, 상태, 위험한 오해는 spec의 `Domain 업데이트`에 적고 `.agent/wiki/domain.md`에 반영합니다.
- 일반 프로그래밍 개념은 domain 문서에 넣지 않습니다. 이 프로젝트의 제품 언어로 의미가 있는 개념만 추가합니다.
- domain 문서를 갱신할 때는 기존 용어를 덮어쓰기보다 충돌/변경 이유를 spec 또는 handoff에 남깁니다.

## ADR 후보 작성

`recipe`는 구현 방식 자체를 깊게 조사하지 않습니다. 다만 spec 작성 중 명백한 제품/운영 결정이 확정되면 ADR 후보를 남길 수 있습니다.

ADR 후보는 아래 세 조건을 모두 만족할 때만 작성합니다.

- 나중에 바꾸기 어렵습니다.
- 맥락 없이 보면 미래의 reader가 의아해할 수 있습니다.
- 실제 trade-off가 있었고 대안 중 하나를 고른 결정입니다.

대상 경로는 `.agent/wiki/decisions/NNNN-<slug>.md`이고, 상태는 `Status: Proposed`입니다. 기술 선택 조사나 vendor 비교가 필요하면 ADR을 직접 쓰지 말고 `forage/research`로 라우팅합니다.

## User Ask Question 원칙

질문은 비개발자도 답할 수 있는 제품 언어로 합니다.

- 기술 용어 대신 사용자 행동, 화면, 결과, 예외, 데이터 변화로 묻습니다.
- 한 번에 너무 많은 질문을 던지지 말고, 구현을 막는 핵심 질문 3-5개씩 묶습니다.
- 각 질문에는 “잘 모르겠어요, 추천해주세요” 선택지를 둘 수 있습니다.
- 사용자가 모르면 현재 PRD/design과 요청을 기준으로 추천안을 제시하되, 중요한 scope나 위험 변경은 추측하지 않습니다.
- 질문 답변이 어떤 spec 항목에 반영되는지 짧게 요약합니다.
- red-team 보강은 사용자 질문을 늘리기 위한 것이 아닙니다. agent가 기본 위험 시나리오를 먼저 채우고, 사용자는 제품적으로 관찰되는 결과만 결정합니다.
- idempotency, transaction, lock, rollback pattern 같은 구현 방식은 사용자에게 묻지 않습니다. 필요한 경우 `cook`, `forage`, `taste`가 기술 선택으로 다룹니다.

추천안을 제시할 때는 다음을 함께 남깁니다.

- 추천값: 사용자가 바로 수락하거나 고칠 수 있는 짧은 답.
- 이유: PRD, design, 기존 요청 중 어떤 근거로 추천했는지.
- 반영 위치: spec의 어느 섹션에 들어가는지.
- 확인 필요: scope, data-loss, auth/payment, external API, release/deploy 영향이 있으면 사용자 확인 필요로 표시.

반드시 확인할 축:

- Actor: 누가 이 기능을 사용하나요?
- Trigger: 사용자는 어디서 무엇을 눌러 시작하나요?
- Flow: 성공까지 어떤 순서로 진행되나요?
- Result: 성공하면 무엇이 보이거나 저장되나요?
- States: loading, empty, error, success 상태가 필요한가요?
- Data: 새로 저장, 수정, 삭제되는 정보가 있나요?
- Rules: 권한, 제한, 중복, 취소, 되돌리기 규칙이 있나요?
- Non-goals: 이번 spec에서 일부러 하지 않을 것은 무엇인가요?
- Verification: 사용자가 무엇을 하면 성공이라고 볼 수 있나요?
- Domain language: 새 용어, 역할, 상태가 기존 `.agent/wiki/domain.md`와 충돌하나요?
- Decision record: 되돌리기 어렵고 맥락 없이는 놀라운 결정이 있나요?
- Red-team: 같은 행동을 두 번 하거나, 중간에 실패하거나, 권한 없는 사용자가 시도해도 제품적으로 안전한 결과가 정해져 있나요?

## Red-team spec 보강

`recipe`는 spec 단계에서 최소한의 adversarial scenario를 먼저 작성합니다. 이 작업은 agent가 기본값을 추천하고, 사용자는 제품 결과만 확인합니다.

- Happy path acceptance 외에 failure/abuse acceptance를 최소 1개 포함합니다.
- duplicate/replay, partial failure, permission bypass, data-loss/rollback, boundary input 중 관련 있는 항목을 검토합니다.
- 관련 없는 항목은 `none`으로 두되, 왜 관련 없는지 짧게 남깁니다.
- scenario는 `spec change`, `code fix`, `follow-up`, `not applicable` 중 하나로 분류합니다.
- red-team scenario가 제품 scope나 human gate를 바꾸면 open question으로 남기고 spec status는 `Draft`로 유지합니다.

## Spec 작성 규칙

- acceptance criteria는 사용자가 관찰할 수 있는 결과로 씁니다.
- 모든 user-visible 또는 agent-visible workflow는 Given/When/Then 형식의 happy path acceptance를 최소 1개 포함합니다.
- 모든 의미 있는 workflow는 Given/When/Then 형식의 failure 또는 abuse acceptance를 최소 1개 포함합니다.
- 작업 목록은 `Task 0`을 실패 test 또는 executable acceptance check 작성으로 시작합니다.
- 이후 task는 `cook/dev`가 하나씩 처리할 수 있게 작고 검증 가능한 단위로 나눕니다.
- 각 task에는 가능한 test 또는 manual check를 연결합니다.
- `test`, `e2e`, `verify` command가 `null`이면 test plan에 blocked 또는 manual fallback을 명시합니다.
- 새 domain term, 역할, 상태, 위험한 assumption이 있으면 `Domain 업데이트`에 명시하고 `.agent/wiki/domain.md` 반영 여부를 표시합니다.
- ADR 후보가 있으면 `결정 기록`에 경로와 `Status: Proposed`를 남깁니다.
- red-team scenario와 그 분류를 `Red-team 시나리오`에 남깁니다.
- open question이 구현을 막으면 spec status는 `Draft`로 유지합니다.

## 승인 가능 체크리스트

`Approved`로 바꾸기 전 다음을 모두 확인합니다.

- blocking open question이 없습니다.
- goal과 non-goal이 분리되어 있습니다.
- user flow가 시작점부터 성공 결과까지 이어집니다.
- happy path와 failure/abuse acceptance criteria가 사용자 또는 agent 관찰 결과로 작성되어 있습니다.
- UI/browser 변경이면 Given/When/Then acceptance와 `e2e` 또는 Playwright MCP 검증 계획이 있습니다.
- data 생성, 수정, 삭제, 권한, 외부 연동, migration/rollback 영향이 표시되어 있습니다.
- red-team scenario가 최소 1개 이상 검토되었고, `spec change`, `code fix`, `follow-up`, `not applicable` 중 하나로 분류되어 있습니다.
- `Task 0`이 실패 test 또는 executable acceptance check 작성이고, 이후 task가 `cook/dev`에서 하나씩 처리 가능한 크기로 나뉘며 각 task에 check가 있습니다.
- `.agent/commands.json`의 `test`, `e2e`, `verify` 상태가 test plan에 반영되어 있습니다.
- `Alignment Brief`가 있으면 현재 PRD/constitution/design/domain과 충돌하지 않거나 blocking open question으로 남아 있습니다.
- domain 용어 충돌이 해결되었거나 blocking open question으로 남아 있습니다.
- ADR 후보가 필요한 결정은 `.agent/wiki/decisions/`에 proposed 상태로 남았거나 `forage`로 라우팅되었습니다.
- 첫 구현 task 전에 작성할 실패 test 또는 executable acceptance check가 정해져 있습니다.
- human gate가 필요한 위험 작업은 명시되어 있습니다.

## Git

추천 commit:

```text
docs(spec): add NNNN <title>

Refs: .agent/spec/active/NNNN-<slug>.md
```

## Hard rules

- 관련 spec이 approved가 아니면 `cook`, `fix`, `tidy`를 시작하지 않습니다. 단, 사용자가 emergency debug mode를 명시하면 예외입니다.
- scope 변경은 구현 중이 아니라 여기서 처리합니다.
- 사용자의 승인 없이 spec을 `Approved`로 바꾸지 않습니다.
