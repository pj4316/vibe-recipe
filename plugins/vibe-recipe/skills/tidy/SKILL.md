---
name: tidy
description: /vr:tidy 또는 /vr:refactor 호출 시 사용합니다. 동작 변경 없이 구조를 개선하고 test로 동등성을 증명합니다. improve codebase architecture 요청은 shallow module을 줄이고 deep module boundary를 만드는 작업으로 처리합니다.
---

# tidy (refactor) - 정리정돈

구조 개선, naming 정리, module boundary 개선, improve codebase architecture, 성능 중립적 단순화, design-system migration에 사용합니다.

`tidy`는 동작 변경 없는 refactor skill입니다. 목적은 기능을 추가하지 않고, 기존 behavior를 보존한다는 증거를 남기면서 shallow module과 흐트러진 boundary를 더 깊고 응집도 높은 module로 정리하는 것입니다.

## 시작 조건

- 의도한 동작이 이미 test로 보호되어 있거나 변경 전에 characterization할 수 있어야 합니다.
- feature 추가를 refactor로 포장하면 안 됩니다.
- architecture 개선은 동작 변경 없이 수행해야 하며, 변경 전 behavior를 검증할 수 있어야 합니다.
- shallow module 제거 또는 deep module 재구성이 목표여야 합니다. 새 계층 추가 자체를 목표로 삼지 않습니다.
- 관련 active spec, design note, ADR, command profile, 이전 handoff를 필요한 범위에서 읽었습니다.
- `git status --short`로 작업 트리를 확인했고, 관련 없는 사용자 변경을 되돌리지 않습니다.
- public API, migration, data model, user-visible behavior 변경이 필요하면 `tidy`가 아니라 `recipe` 또는 `cook`으로 라우팅합니다.

## Refactor scope

| Scope | 허용 여부 | 처리 |
| --- | --- | --- |
| naming, module boundary, duplicate policy consolidation | 허용 | 동등성 검증과 함께 변경 |
| shallow wrapper 제거, deep module extraction | 허용 | 호출부 interface가 더 단순해지는지 확인 |
| design-system migration | 조건부 허용 | token/pattern 결정은 `recipe`, 코드 이관은 `tidy` |
| performance-neutral simplification | 허용 | behavior와 complexity risk를 함께 확인 |
| feature addition, acceptance 변경 | 금지 | `recipe`/`cook`으로 escalation |
| schema/data migration, public contract 변경 | 금지 | 별도 spec과 human gate 필요 |

## 흐름

1. test, snapshot, 명시적 manual check로 현재 동작을 포착합니다.
2. shallow module, pass-through layer, 흩어진 policy, 모호한 boundary를 식별합니다.
3. 작은 public interface 뒤에 내부 복잡도와 invariant를 숨기는 deep module 방향으로 재구성합니다.
4. 동작을 보존하는 작은 변경을 수행합니다.
5. focused check와 project verify command를 실행합니다.
6. documented convention이나 system architecture 원칙이 바뀌는 경우에만 `.agent/spec/design.md`, ADR, design-system 문서를 갱신합니다.
7. 동등성 근거와 architecture 개선 의도를 설명하는 handoff note를 작성합니다.

## 동등성 증명

`tidy`는 변경 전후가 같은 동작임을 설명해야 합니다.

- 기존 test가 있으면 가장 좁은 focused test를 먼저 실행합니다.
- test가 없으면 characterization test, snapshot, golden fixture, CLI output, API contract check, manual check 중 하나를 먼저 만듭니다.
- UI refactor는 visual behavior, responsive behavior, accessibility-critical behavior가 유지되는지 확인합니다.
- manual check는 누가 무엇을 확인했는지와 자동화하지 못한 이유를 남깁니다.
- 검증 없이 “동작 변경 없음”이라고 주장하지 않습니다.

## Architecture 원칙

- deep module을 선호합니다. 호출부에는 작은 interface를 제공하고 내부에서 복잡도, policy, error handling을 책임집니다.
- shallow module을 지양합니다. 단순 wrapper나 책임 없는 pass-through layer는 제거하거나 더 깊은 module로 합칩니다.
- Hexagonal architecture나 ports-and-adapters는 boundary와 testability를 개선할 때만 사용합니다.
- module boundary 변경이 product behavior를 바꾸면 `tidy`가 아니라 `recipe` 또는 `cook`으로 라우팅합니다.

## Subagent 사용

- `implementor`: write scope가 작고 root behavior가 characterization된 refactor slice를 맡길 때 사용합니다.
- `tester`: 동등성 검증 방법, focused command, UI/manual check 판단이 필요할 때 사용합니다.
- `reviewer`: architecture boundary, public interface, local convention 위험을 read-only로 확인할 때 사용합니다.

worker에게는 다른 작업자가 있을 수 있고, 관련 없는 변경이나 다른 worker의 변경을 되돌리지 말라고 명시합니다.

## Escalation

| 상황 | 다음 skill |
| --- | --- |
| behavior 또는 acceptance 변경이 필요함 | `recipe` |
| 승인된 feature task 구현이 필요함 | `cook` |
| refactor 중 regression/failing test 발생 | `fix` |
| design token/pattern 결정이 필요함 | `recipe` |
| architecture decision이 되돌리기 어렵고 tradeoff가 큼 | `forage` |
| refactor 후 검수가 필요함 | `taste` |

## Handoff 형식

권장 경로는 `.agent/spec/handoffs/NNNN-tidy.md`입니다.

```markdown
# Tidy Summary: NNNN <slug>
Status: done / blocked / escalated

## Scope
- Refactor goal:
- Non-behavior-change boundary:
- Changed files:

## Equivalence
- Before check:
- After check:
- Manual check:

## Architecture
- Shallow module removed:
- Deep module/interface:
- Convention/design docs updated:

## Risks
- Remaining risk:
- Follow-up:
- Next skill:
```

## 완료 조건

- 변경 전 behavior를 test, snapshot, fixture, command, manual check 중 하나로 포착했습니다.
- 변경이 동작 추가나 acceptance 변경을 포함하지 않습니다.
- 변경 후 focused check와 가능한 `verify`를 실행했습니다.
- architecture 개선 의도와 동등성 근거가 handoff에 남았습니다.
- 다음 단계가 `taste`, `fix`, `recipe` 중 하나로 분명합니다.

## Git

spec과 연결된 작업이면 `refactor/NNNN-slug` branch를 사용합니다. commit prefix는 `refactor:`이고 필수 `Refs:` footer를 포함합니다.
