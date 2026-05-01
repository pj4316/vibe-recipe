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

## 구현 원칙

- 도메인 규칙이 있는 제품은 UI, framework, database, external API로부터 domain/application logic을 분리합니다.
- Hexagonal architecture 또는 ports-and-adapters 구조는 domain-heavy, integration-heavy, long-lived service에서 우선 고려합니다.
- 작은 script, 정적 site, 단순 prototype에는 과한 layer를 만들지 않고 기존 repo 구조 안에서 boundary만 명확히 둡니다.
- business rule은 framework callback이나 UI component 안에 숨기지 않고 test 가능한 module로 분리합니다.
- 외부 I/O는 adapter 뒤에 두고, core logic은 fake 또는 stub으로 검증 가능해야 합니다.
- dependency direction은 entry point -> application -> domain으로 흐르게 하고, domain이 infrastructure를 직접 import하지 않게 합니다.
- cross-cutting concern은 logging, configuration, error handling, auth boundary를 명시하고 흩어지게 두지 않습니다.

## 개발 순서

1. `recipe/plan`에서 user-visible behavior, acceptance criteria, non-goal을 먼저 고정합니다.
2. architecture 선택이 불명확하면 구현 전에 `forage/research`로 option과 ADR 초안을 만듭니다.
3. `cook/dev`는 active spec의 가장 작은 task 하나를 골라 실패하는 test 또는 executable acceptance check부터 작성합니다.
4. domain/application logic을 먼저 green으로 만들고, adapter, UI, integration은 얇게 연결합니다.
5. UI/browser workflow는 happy path와 핵심 failure path를 BDD style scenario로 남기고, 필요한 경우 Playwright MCP 또는 project e2e command로 확인합니다.
6. task가 끝나면 실행한 command, 남은 risk, deferred item을 handoff에 기록하고 `taste/review`로 넘깁니다.

## TDD와 Test Strategy

- 새 behavior는 가능하면 실패하는 test 또는 executable acceptance check를 먼저 작성합니다.
- 구현은 red -> green -> refactor 순서로 진행하고, refactor는 behavior-preserving이어야 합니다.
- test pyramid는 unit/domain test를 가장 빠른 feedback으로 두고, integration/e2e test는 핵심 workflow에 집중합니다.
- E2E가 필요한 영역은 UI navigation, auth/payment/data-loss, multi-step workflow, browser-only regression, 접근성 tree로 검증 가능한 interaction입니다.
- E2E scenario는 Given/When/Then 형태로 작성하고, flaky하거나 느린 부분은 core `verify`와 분리할지 명시합니다.
- bug fix는 재현 test를 먼저 추가하거나, 자동화가 어렵다면 handoff에 재현 절차와 manual check를 기록합니다.
- flaky test, 느린 e2e, 외부 API 의존 test는 release gate를 불안정하게 만들지 않도록 격리합니다.
- `.agent/commands.json`의 `test`, `e2e`, `lint`, `build`, `verify` command가 이 전략을 실행하는 공식 경로입니다.
- Claude Code에서는 플러그인이 제공하는 Playwright MCP를 browser-facing acceptance check의 기본 도구로 사용할 수 있습니다.

## 운영 품질 원칙

- secret, token, credential, personal data는 source에 커밋하지 않고 configuration boundary를 명시합니다.
- schema, storage, external contract 변경은 migration, backward compatibility, rollback path를 함께 기록합니다.
- user-facing failure는 관찰 가능해야 하며 logging, error boundary, retry, alerting 필요 여부를 판단합니다.
- performance budget이 필요한 workflow는 latency, payload, query count 같은 측정 가능한 기준을 둡니다.
- UI는 keyboard navigation, focus state, readable contrast, loading/error/empty state를 acceptance에 포함합니다.
- dependency 추가는 license, maintenance status, bundle/runtime cost, lockfile 변화를 확인합니다.

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
  "e2e": {{e2e_command_or_null}},
  "lint": {{lint_command_or_null}},
  "verify": {{verify_command_or_null}},
  "dev": {{dev_command_or_null}}
}
```

## Verification 전략

- 구현 중에는 focused command를 사용합니다.
- merge/release 전에는 `verify`를 사용합니다.
- UI/browser 변경은 `e2e` command가 있으면 우선 실행하고, 없으면 Playwright MCP로 핵심 scenario를 수동 검증한 뒤 handoff에 남깁니다.
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
