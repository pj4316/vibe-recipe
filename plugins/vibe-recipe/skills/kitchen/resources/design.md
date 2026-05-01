# 기술 설계 템플릿

> Kitchen 리소스입니다. 제품 답변, 저장소 감지 결과, command 감지 결과로 생성합니다.
> 에이전트가 file, command, constraint를 고를 수 있을 만큼 실용적으로 유지합니다.

## 제품 문맥

- 제품 설명: {{product_pitch}}
- 핵심 사용자: {{primary_user}}
- MVP 기능:
  - {{mvp_capability_1}}
  - {{mvp_capability_2}}
  - {{mvp_capability_3}}
- 제외 범위:
  - {{anti_scope_1}}
  - {{anti_scope_2}}

## 품질 목표

중요도 순서로 최대 다섯 개만 둡니다.

1. End-to-end MVP workflow가 안정적으로 동작합니다.
2. 변경은 spec에 연결되고 review 가능하게 유지됩니다.
3. verification이 설정되고 green이기 전에는 release가 blocked입니다.
4. 제품 핵심 state는 보이고 test 가능해야 합니다.
5. UI가 있다면 접근 가능하고 일관되어야 합니다.

## 제약

- stack, database, auth, queue, external API 선택을 임의로 만들지 않습니다.
- 새 architecture보다 기존 저장소 구조를 우선합니다.
- native command는 `.agent/commands.json`을 사용합니다.
- release/deploy/push에는 사람 승인이 필요합니다.

## Stack과 Runtime 감지

- Stack: {{detected_stack}}
- Package manager: {{detected_package_manager}}
- Runtime: {{detected_runtime}}
- Frontend hint: {{frontend_hints}}
- Backend/API hint: {{backend_hints}}

## Architecture 추론

- 형태: {{architecture_shape}}
- 주요 entry point: {{entry_points}}
- Source directory: {{source_directories}}
- Test directory: {{test_directories}}
- Configuration file: {{config_files}}

## Context와 외부 Interface

- User/actor: {{actors}}
- External APIs: {{external_apis_or_none}}
- Data store: {{data_stores_or_none}}
- Background job/queue: {{jobs_or_none}}
- Auth/payment: {{auth_payment_or_none}}

## Data와 Domain

- 핵심 entity: {{core_entities}}
- 중요한 state: {{important_states}}
- 위험한 assumption: {{dangerous_assumptions}}
- Domain source of truth: `.agent/wiki/domain.md`

## Command Profile

Command는 `.agent/commands.json`에 둡니다.

```json
{
  "setup": {{setup_command_or_null}},
  "build": {{build_command_or_null}},
  "test": {{test_command_or_null}},
  "lint": {{lint_command_or_null}},
  "verify": {{verify_command_or_null}},
  "dev": {{dev_command_or_null}}
}
```

## Verification 전략

- 구현 중에는 focused command를 사용합니다.
- merge/release 전에는 `verify`를 사용합니다.
- `verify`가 `null`이면 설정될 때까지 release는 blocked입니다.
- automation이 없으면 manual check를 handoff에 기록합니다.

## 실행 시나리오

핵심 MVP 흐름이 명확해지는 대로 기록합니다.

| Scenario | Trigger | Expected outcome | Verification |
| --- | --- | --- | --- |
| {{scenario}} | {{trigger}} | {{outcome}} | {{verification}} |

## 아키텍처 결정

수락된 기술 결정은 `.agent/wiki/decisions/`에 둡니다.

- Proposed decision은 `forage` 또는 `recipe`가 작성합니다.
- 승인된 ADR은 supersession note를 제외하고 append-only입니다.

## 위험과 기술 부채

- 알 수 없는 verification command는 release를 막습니다.
- 확인되지 않은 integration을 assumption으로 구현하지 않습니다.
- 반복되는 project trap은 `.agent/memory/gotchas.md`에 둡니다.

## Best-practice 근거

- goal, constraint, context, building block, runtime scenario, decision, quality requirement, risk, glossary-like domain term을 포함합니다.
- architecture 문서는 그 자체로 방대하기보다 변경 작업에 유용해야 합니다.
