# AGENTS.md 템플릿

> Kitchen 리소스입니다. 제품 답변, 저장소 감지 결과, vibe-recipe 기본값으로 생성합니다.
> 최종 프로젝트 파일은 에이전트가 매 세션 읽을 수 있을 만큼 간결하게 유지합니다.

## 프로젝트 문맥

- 제품 설명: {{product_pitch}}
- 핵심 사용자: {{primary_user}}
- MVP 기능:
  - {{mvp_capability_1}}
  - {{mvp_capability_2}}
  - {{mvp_capability_3}}
- 제외 범위:
  - {{anti_scope_1}}
  - {{anti_scope_2}}
- 성공 기준: {{success_metric}}

## Vibe Recipe 작업 흐름

1. `kitchen/init`: harness를 초기화하거나 `.agent`, hooks, commands, 생성된 에이전트 지침을 개선합니다.
2. `peek/status`: 현재 spec, git 상태, review, command, release readiness를 읽기 전용으로 확인합니다.
3. `forage/research`: 접근 방식이 불명확할 때 option을 비교하고 ADR 초안을 작성합니다.
4. `recipe/plan`: 제품 요청을 번호가 붙은 spec으로 바꿉니다.
5. `cook/dev`: 승인된 spec task를 하나씩 구현합니다.
6. `fix/debug`: 실패를 진단하고 코드를 고치거나 spec 변경으로 escalation합니다.
7. `tidy/refactor`: 동작 변경 없이 구조를 개선합니다.
8. `taste/review`: regression, coverage, code review, security, red-team review를 실행합니다.
9. `plate/design-tune`: 실제 UI가 생긴 뒤 design-system drift를 정리합니다.
10. `wrap/bump`: version과 changelog를 준비합니다.
11. `serve/release`: release gate를 실행하고 push/deploy 승인 전 멈춥니다.

## .agent 계약

작업 시작 시 다음 문서를 먼저 읽고 현재 작업의 기준으로 삼습니다.

- `.agent/constitution.md`: 초기화 이후 human-only입니다. 에이전트가 임의로 수정하지 않습니다.
- `.agent/spec/prd.md`: 제품 scope, MVP, anti-scope의 기준입니다.
- `.agent/spec/design.md`: repo 구조, architecture 추론, verification strategy의 기준입니다.
- `.agent/commands.json`: native command profile이며 `verify`가 release gate입니다.
- `.agent/memory/gotchas.md`: 반복 실수를 피하기 위한 누적 주의사항입니다.

충돌이 있으면 현재 사용자 지시를 우선하되, constitution 또는 product scope와 충돌하는 변경은 진행 전에 확인합니다. 기능 개발은 `recipe/plan`으로 spec을 만든 뒤 `cook/dev`로 진행합니다. `.agent/`, `.hooks/`, command profile, generated agent instructions 같은 harness를 개선하려면 다시 `kitchen/init`을 사용합니다.

## 스킬별 Harness 연계

모든 스킬은 이 표의 입력 문서를 기준으로 판단하고, 출력 문서 외의 harness를 임의로 갱신하지 않습니다.

| 스킬 | 반드시 읽는 기준 | 주요 출력 |
| --- | --- | --- |
| `peek/status` | `AGENTS.md`, `.agent/commands.json`, `.agent/spec/`, git 상태 | 읽기 전용 상태 요약 |
| `forage/research` | `.agent/spec/prd.md`, `.agent/spec/design.md`, `.agent/wiki/decisions/` | proposed ADR, option 비교 |
| `recipe/plan` | `.agent/constitution.md`, `.agent/spec/prd.md`, `.agent/spec/design.md` | `.agent/spec/active/NNNN-*.md` |
| `cook/dev` | active spec, `.agent/spec/design.md`, `.agent/commands.json` | 코드 변경, task handoff |
| `fix/debug` | failing context, active spec, `.agent/runbooks/debugging.md`, `.agent/commands.json` | 최소 수정, 원인 기록 |
| `tidy/refactor` | active spec 또는 tidy 요청, `.agent/spec/design.md`, `.agent/commands.json` | 동작 보존 refactor |
| `taste/review` | 변경 diff, active spec, handoff, `.agent/commands.json` | review verdict, red-team/security finding |
| `plate/design-tune` | 실제 UI 코드, `.agent/wiki/design-system.md` | design-system 보강, UI drift 정리 |
| `wrap/bump` | done/active spec, taste verdict, changelog/version 파일 | version/changelog 준비 |
| `serve/release` | `.agent/constitution.md`, `.agent/commands.json`, taste verdict, clean tree | release gate 결과, push/deploy 전 정지 |

새 기능은 `recipe` 없이 `cook`으로 건너뛰지 않습니다. `cook`, `fix`, `tidy`는 실행한 command와 결과를 handoff 또는 관련 spec에 남깁니다. `taste`, `wrap`, `serve`는 `verify`가 없거나 실패하면 release를 진행하지 않습니다.

## 다음 단계

프로젝트 초기 구성이 끝났다면 “레시피를 작성해볼까요?”라고 안내합니다. 첫 기능 개발은 `recipe/plan`으로 numbered spec을 만들고, 승인된 task를 `cook/dev`로 구현합니다. 하네스 자체를 고치거나 보강하려면 기능 개발로 처리하지 말고 `kitchen/init`을 다시 사용합니다.

## 필수 규칙

- 모든 의미 있는 변경은 번호가 붙은 spec에서 시작합니다.
- `.agent/constitution.md`는 kitchen 이후 human-only입니다.
- scope 변경은 구현 중이 아니라 `recipe`에서 다룹니다.
- `taste`에는 security-auditor와 red-team review가 포함됩니다.
- `.agent/commands.json`의 `verify`가 release gate입니다.
- release, deploy, push, payment, auth, data-loss 작업은 사람 승인이 필요합니다.
- 생성된 index는 사람이 직접 관리하지 않고 librarian이 관리합니다.
- 관련 없는 사용자 변경을 보호합니다.

## 프로젝트 디렉터리 맵

| 경로 | 목적 |
| --- | --- |
| `.agent/spec/active/` | draft, approved, in-progress spec |
| `.agent/spec/done/` | 완료되고 병합된 spec |
| `.agent/spec/archived/` | review 이후 보관한 오래된 spec |
| `.agent/spec/abandoned/` | 취소되고 배운 점을 남긴 spec |
| `.agent/spec/handoffs/` | 구현, 테스트, review handoff |
| `.agent/wiki/architecture.md` | 시스템 architecture 메모 |
| `.agent/wiki/domain.md` | 도메인 용어, 역할, 상태, 비즈니스 규칙 |
| `.agent/wiki/design-system.md` | UI가 있을 때만 쓰는 design system |
| `.agent/wiki/decisions/` | ADR과 기술 결정 |
| `.agent/memory/MEMORY.md` | librarian이 크기를 관리하는 짧은 rolling memory |
| `.agent/memory/gotchas.md` | 반복되는 함정과 예방 메모 |
| `.agent/memory/red-team-findings.md` | 반복되는 adversarial finding |
| `.agent/runbooks/` | verification, debugging, deployment runbook |
| `.hooks/` | 결정적 local gate |
| `docs/` | 사람이 읽는 프로젝트 문서 |

## Recipe 라우팅

| 요청 | 경로 |
| --- | --- |
| 새 기능, 제품 동작, scope 변경 | `recipe` |
| library/vendor/API/접근 방식이 불명확함 | `forage` 후 `recipe` |
| bug, failure, regression, 원인 불명 | `fix` |
| 동작을 보존하는 구조 개선 | `tidy` |
| UI token, component pattern, visual drift | `plate` |
| version과 changelog 준비 | `wrap` |
| release gate, tag, push/deploy checkpoint | `serve` |

## 문서 권한

| 파일 | 권한 |
| --- | --- |
| `.agent/constitution.md` | kitchen 이후 human-only |
| `.agent/spec/prd.md` | scope 변경은 `recipe`가 담당 |
| `.agent/spec/design.md` | kitchen, forage, recipe, tidy |
| `.agent/wiki/design-system.md` | `plate`가 재생성하고 다른 흐름은 관찰만 추가 |
| `.agent/wiki/decisions/*.md` | 승인된 ADR은 append-only |
| `.agent/spec/INDEX.md` | librarian generated |
| `.agent/spec/handoffs/INDEX.md` | librarian generated |
| `CHANGELOG.md` | `wrap` generated |

## Command 계약

프로젝트 native command는 `.agent/commands.json`에 둡니다.

- debugging 또는 구현 중에는 focused command를 먼저 실행합니다.
- merge/release 전에는 `verify`를 실행합니다.
- `verify`가 `null`이면 설정될 때까지 release는 blocked입니다.

## Gotchas

항상 필요한 gotcha 요약만 여기에 둡니다.

- 상세 기록: `.agent/memory/gotchas.md`
- Red-team pattern: `.agent/memory/red-team-findings.md`
- 같은 gotcha가 두 번 반복되면 이 섹션으로 승격합니다.

현재 gotcha:

- {{gotcha_summary_or_none}}

## Git

- Conventional Commits를 사용합니다.
- spec-linked commit에는 `Refs: .agent/spec/.../NNNN-slug.md`를 포함합니다.
- `cook`, `fix`, `tidy`는 task 단위 atomic commit을 선호합니다.
- 자동 push는 하지 않습니다.

## Release 전 필수 조건

- active spec이 해결되었거나 명시적으로 deferred 상태입니다.
- project `verify` command가 green입니다.
- 최신 `taste` verdict가 APPROVE입니다.
- BLOCKER 또는 critical audit finding이 남아 있지 않습니다.
- version과 changelog가 `wrap`으로 준비되었습니다.
- working tree가 clean입니다.
- push/deploy 전 사람 승인이 있습니다.

## Best-practice 근거

- 에이전트 지침은 command, file ownership, routing, gate처럼 구체적으로 유지합니다.
- architecture/design reference와 운영 규칙을 분리합니다.
- AGENTS에는 짧은 gotcha만 두고 자세한 내용은 memory에 둡니다.
