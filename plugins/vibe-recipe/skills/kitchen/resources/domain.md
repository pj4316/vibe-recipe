# 도메인 용어집

> Kitchen 리소스입니다. 제품 답변과 이후 `recipe`에서 확인한 용어로 생성합니다.
> 이 문서는 프로젝트의 유비쿼터스 언어 source of truth입니다.
> 사용자가 domain 문서 톤이나 깊이를 지정하지 않으면 선택된 `{{preset_type}}` preset의 기본 stance를 먼저 적용합니다.

## Preset defaults applied

- Selected preset: {{preset_type}}
- Selection reason: {{preset_reason}}
- Precedence: user explicit input -> repo facts -> preset defaults -> generic fallback
- Glossary depth: {{glossary_depth}}
- Role/state style: {{role_state_style}}
- Domain tone: {{domain_tone}}

이 문서는 preset을 가리키는 참조본이 아니라, 선택된 preset을 바탕으로 kitchen이 생성한 domain 결과물입니다.

## 원칙

- 사용자, 기획, spec, 코드, 테스트, 문서에서 같은 개념은 같은 이름으로 부릅니다.
- 새 용어를 임의로 만들지 않고, 기존 용어와 충돌하면 먼저 이 문서를 확인합니다.
- 용어가 모호하면 `recipe/plan`에서 사용자에게 제품 언어로 질문하고 이 문서를 갱신합니다.
- code identifier는 저장소 관례를 따르되, spec과 설명에서는 이 용어집의 표현을 우선합니다.
- glossary depth와 role/state 밀도는 preset을 출발점으로 삼되, 실제 제품 용어가 생기면 그것으로 덮어씁니다.

## 핵심 용어

| 용어 | 뜻 | 사용 예 | 피해야 할 표현 |
| --- | --- | --- | --- |
| {{term}} | {{definition}} | {{usage_example}} | {{avoid_or_none}} |

## 역할

| 역할 | 설명 | 권한 또는 제한 |
| --- | --- | --- |
| {{actor}} | {{actor_description}} | {{actor_rule}} |

## 상태

| 상태 | 뜻 | 전이 규칙 |
| --- | --- | --- |
| {{state}} | {{state_definition}} | {{transition_rule}} |

## 비즈니스 규칙

- {{business_rule_or_none}}

## 위험한 오해

- {{dangerous_assumption_or_none}}

## 갱신 규칙

- scope나 제품 의미가 바뀌는 용어 변경은 `recipe/plan`에서 다룹니다.
- 구현 중 발견한 용어 충돌은 handoff에 기록하고 `recipe` 또는 `librarian`에게 정리를 맡깁니다.
- 반복되는 오해는 `.agent/memory/gotchas.md`에도 짧게 연결합니다.
