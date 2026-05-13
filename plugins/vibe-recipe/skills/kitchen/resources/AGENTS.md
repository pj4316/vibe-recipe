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

## 첫 세션 Bootstrap

새로 clone한 프로젝트에서 `kitchen`, `recipe`, `plate`, `cook`, `taste` 같은 vibe-recipe skill이 보이지 않으면 먼저 plugin bootstrap을 실행합니다.

Codex:

```bash
node .agent/setup/vibe-recipe-codex.mjs
```

Claude Code에서는 `.claude/settings.json`의 project plugin 설정을 확인합니다. bootstrap 이후에는 새 Codex/Claude Code 세션을 열어 plugin discovery를 다시 시작합니다.

이 bootstrap은 기능 개발이 아니라 local tool setup입니다. `~/.codex/config.toml`을 수정하기 전 백업을 만들고, 프로젝트 안의 `.codex/config.toml`에는 지원되지 않는 plugin 설정을 만들지 않습니다.

## Vibe Recipe 작업 흐름

1. `kitchen/init`: harness를 초기화하거나 `.agent`, hooks, commands, 생성된 에이전트 지침을 개선합니다.
2. `peek/status`: 현재 spec, git 상태, review, command, release readiness를 읽기 전용으로 확인합니다.
3. `forage/research`: 접근 방식이 불명확할 때 option을 비교하고 ADR 초안을 작성합니다.
4. `recipe/plan`: 제품 요청을 번호가 붙은 제품 spec으로 바꿉니다.
5. `plate/plan`: 제품 spec을 구현 계획, task breakdown, 검증 계획으로 바꿉니다.
6. `cook/dev`: 승인되고 plated된 recipe 전체 구현을 지휘하고 task-runner 결과를 통합합니다.
7. `fix/debug`: 실패를 진단하고 코드를 고치거나 spec 변경으로 escalation합니다.
8. `tidy/refactor`: 동작 변경 없이 구조를 개선합니다.
9. `taste/review`: 구현 결과를 recipe 기준으로 검수하고 APPROVE / REQUEST_CHANGES / BLOCK verdict를 냅니다.
10. `wrap/bump`: version과 changelog를 준비합니다.
11. `serve/release`: release gate를 실행하고 push/deploy 승인 전 멈춥니다.

## 스킬 호출 규칙

- 새 기능, 제품 동작 변경, scope 변경은 항상 `recipe/plan`에서 요구사항과 acceptance를 먼저 확정합니다.
- `recipe/plan`은 grill-me처럼 사용자의 의도, actor, trigger, 성공 결과, 제외 범위, failure/abuse case를 대화로 좁힌 뒤 spec을 작성합니다.
- 구현 설계, 파일 경계, task breakdown, dependency, 병렬 가능 여부, 검증 명령은 `plate/plan`에서만 확정합니다.
- `plan-eng-review` 같은 engineering review는 `plate/plan` 이후, `cook/dev` 이전에 사용합니다. review 대상은 `spec.md`가 아니라 `tasks.md`의 실행 계획, write scope, dependency, test plan입니다.
- `cook/dev`는 승인된 spec과 planned task만 구현합니다. 제품 scope가 흔들리면 구현하지 말고 `recipe/plan`으로 되돌립니다.
- `fix/debug`, `tidy/refactor`, `taste/review`, `wrap/bump`, `serve/release`는 현재 상태와 blocker에 따라 라우팅하되, release/deploy/push/payment/auth/data-loss는 자동 승인하지 않습니다.
- 반복되는 수동 절차가 3회 이상 나오고 입력, 출력, 중단 조건이 명확하면 새 skill 또는 template 후보로 `memory.md`에 기록하고 `recipe/plan` 또는 `kitchen/init`으로 제안합니다.

## .agent 계약

작업 시작 시 다음 문서를 먼저 읽고 현재 작업의 기준으로 삼습니다.

- `.agent/constitution.md`: 초기화 이후 human-only입니다. 에이전트가 임의로 수정하지 않습니다.
- `.agent/spec/prd.md`: 제품 scope, MVP, anti-scope의 기준입니다.
- `.agent/spec/design.md`: repo 구조, architecture 추론, verification strategy의 기준입니다.
- `.agent/spec/design.md`는 구현 전에 가장 먼저 읽는 architecture source of truth입니다. 기본 원칙으로 Hexagonal architecture와 TDD를 우선합니다.
- `.agent/wiki/domain.md`: 유비쿼터스 용어집이며 제품 용어, 역할, 상태, 비즈니스 규칙의 기준입니다.
- `.agent/commands.json`: native command profile이며 `verify`가 release gate입니다.
- `.agent/memory/gotchas.md`: 반복 실수를 피하기 위한 누적 주의사항입니다.
- `.agent/setup/vibe-recipe-codex.mjs`: Codex 참여자가 `vibe-recipe` plugin marketplace와 enablement를 사용자 config에 준비하는 cross-platform bootstrap입니다.
- `kitchen`이 생성한 design/domain 문서에는 type-based preset 기본값이 포함될 수 있으며, 사용자 명시 입력이 그것보다 우선합니다.

충돌이 있으면 현재 사용자 지시를 우선하되, constitution 또는 product scope와 충돌하는 변경은 진행 전에 확인합니다. 기능 개발은 `recipe/plan`으로 제품 spec을 만들고 `plate/plan`으로 구현 계획을 만든 뒤 `cook/dev`로 진행합니다. `.agent/`, `.hooks/`, command profile, generated agent instructions 같은 harness를 개선하려면 다시 `kitchen/init`을 사용합니다.

## Orchestration Harness

- `AGENTS.md`는 skill 라우팅, 역할 경계, parent/orchestrator agent 책임, human gate를 정의합니다.
- hooks는 constitution 수정, push/deploy/release, secret, release gate처럼 결정적으로 검사 가능한 안전장치를 강제합니다.
- `.agent/`는 spec, command profile, runbook, domain language, memory, handoff를 저장합니다.
- `.agent/commands.json`은 스킬 정의 파일이 아니라 이 프로젝트의 native command profile입니다.
- plugin bootstrap은 Claude Code project settings와 Codex user-config bootstrap을 준비합니다. Codex는 현재 repo-scoped plugin enablement가 없으므로 `.codex/config.toml`에 fake plugin block을 만들지 않습니다.

## 질문과 모호성

- 사용자 요청, 요구사항, 구현 의도에 모호함이 있으면 추측하지 말고 질문합니다.
- 파일 위치, 구조, 명령, 기존 구현처럼 저장소에서 확인 가능한 사실은 먼저 탐색합니다.
- 탐색 뒤에도 제품 의도, scope, 용어, acceptance criteria, architecture 방향이 불명확하면 진행 전에 질문합니다.
- 구현 전 가정, 해석, 성공 기준, 검증 방법을 짧게 명시합니다.
- 여러 해석이 가능하면 선택지를 제시하고 조용히 결정하지 않습니다.
- 더 단순한 접근이 있거나 요청 범위가 과해 보이면 tradeoff를 말합니다.
- 질문은 `.agent/wiki/domain.md`, `.agent/spec/prd.md`, `.agent/spec/design.md`와 충돌하는 지점을 구체적으로 짚습니다.

## 작업 실행 원칙

- 요청받지 않은 기능, 추상화, 설정 가능성은 추가하지 않습니다.
- 변경은 승인된 spec task 또는 사용자 요청에 직접 연결되는 범위로 제한합니다.
- 관련 없는 refactor, formatting, comment 정리, dead-code 삭제는 하지 않고 필요하면 보고만 합니다.
- 기존 스타일을 따르고, 내 변경으로 생긴 unused import, 변수, 함수만 정리합니다.
- bugfix는 재현 가능한 실패를 먼저 확인하고, refactor는 전후 동작 보존 검증을 남깁니다.
- diff가 요청보다 커졌다면 단순화할 수 있는지 다시 봅니다.

## 컨텍스트와 커밋 경계

- 작업 순서는 먼저 요구사항을 명확히 하고, 그 다음 실행 순서와 검증 기준을 정한 뒤 구현합니다.
- `cook/dev`의 자동 커밋은 task 단위가 기본입니다. task 하나의 `Check`가 통과하고 `tasks.md`와 `memory.md`가 갱신된 경우에만 커밋합니다.
- 자동 커밋은 task의 `Write scope`와 runner가 갱신하는 coordination 파일만 포함합니다. `git add -A`로 unrelated change를 섞지 않습니다.
- 아래 기준 중 하나라도 넘으면 현재 성공한 단위를 커밋하거나 멈추고 `plate/plan` 보강으로 돌아갑니다.
  - 변경 파일 8개 초과
  - diff 500 lines 초과
  - 2개 이상 top-level module 변경
  - public API, manifest, hook, migration 중 2종 이상 동시 변경
  - 같은 command 또는 acceptance가 2회 연속 실패
  - task `Write scope` 밖 파일 변경 감지
  - acceptance 또는 제품 요구사항 변경 필요
- 긴 diff, test log, subagent transcript는 대화에 누적하지 않습니다. `memory.md`에는 evidence path, command, 결과, 남은 risk만 짧게 기록합니다.
- 컨텍스트가 커졌다면 새 worker를 더 투입하기보다 현재 phase summary, 변경 파일, 검증 결과, 다음 task만 남기고 다음 커밋 단위로 넘어갑니다.

## 유비쿼터스 용어집

`.agent/wiki/domain.md`를 제품 소통의 공통 언어로 사용합니다.

- 사용자 질문, spec, handoff, review, 코드 설명에서는 용어집의 표현을 우선합니다.
- 같은 개념을 여러 이름으로 부르지 않습니다.
- 새 용어, 역할, 상태, 비즈니스 규칙이 생기면 `recipe/plan`에서 확인하고 용어집에 반영합니다.
- 구현 중 용어 충돌을 발견하면 임의로 이름을 정하지 말고 handoff에 남긴 뒤 `recipe` 또는 `librarian` 정리로 넘깁니다.
- code identifier는 기존 저장소 관례를 따르되, 설명성 문서와 사용자 커뮤니케이션은 용어집 기준으로 맞춥니다.

## 개발 원칙

- 개발 순서는 `recipe/plan` -> `plate/plan` -> `cook/dev` -> `taste/review`를 기본으로 합니다. architecture 선택이 불명확하면 `forage/research`를 먼저 사용합니다.
- `cook/dev`는 가능한 한 실패하는 test 또는 executable acceptance check를 먼저 만들고 red -> green -> refactor 순서로 진행합니다.
- multi-step 작업은 각 단계의 성공 기준과 verify 방법을 남깁니다.
- 도메인 규칙은 UI, framework, database, external API에서 분리하고, 외부 I/O는 adapter 뒤에 둡니다.
- Hexagonal architecture 또는 ports-and-adapters는 기본 선호 아키텍처입니다. 작은 script나 prototype에서도 boundary를 설명하는 기본 사고방식으로 사용하되, 과한 layer 수는 만들지 않습니다.
- deep module을 선호하고 shallow module을 지양합니다. 작은 public interface가 의미 있는 내부 복잡도와 policy를 감추는 구조를 우선합니다.
- 단순 wrapper, 책임 없는 pass-through layer, 호출부보다 내부 복잡도를 숨기지 못하는 module은 만들지 않습니다.
- UI/browser workflow는 Given/When/Then scenario로 acceptance를 적고, 필요한 경우 `e2e` command 또는 Playwright MCP로 검증합니다.
- secret, personal data, schema migration, external contract, dependency 추가는 security, rollback, compatibility 영향을 함께 확인합니다.
- user-facing failure는 logging, error boundary, retry, loading/error/empty state처럼 관찰 가능하고 복구 가능한 형태로 설계합니다.

## 스킬별 Harness 연계

모든 스킬은 이 표의 입력 문서를 기준으로 판단하고, 출력 문서 외의 harness를 임의로 갱신하지 않습니다.

| 스킬 | 반드시 읽는 기준 | 주요 출력 |
| --- | --- | --- |
| `peek/status` | `AGENTS.md`, `.agent/commands.json`, `.agent/spec/`, git 상태 | 읽기 전용 상태 요약 |
| `forage/research` | `.agent/spec/prd.md`, `.agent/spec/design.md`, `.agent/wiki/decisions/` | proposed ADR, option 비교 |
| `recipe/plan` | `.agent/constitution.md`, `.agent/spec/prd.md`, `.agent/spec/design.md`, `.agent/wiki/domain.md` | `.agent/spec/active/NNNN-<slug>/spec.md`, `tasks.md`, domain 용어 보강 |
| `plate/plan` | active spec, `.agent/spec/design.md`, `.agent/commands.json`, 관련 ADR | 구현 계획, phase/wave 작업 목록, 실행 순서, 검증 계획 |
| `cook/dev` | plated active spec folder, `.agent/spec/design.md`, `.agent/commands.json` | `tasks.md` 상태 갱신, `memory.md` handoff, acceptance matrix |
| `fix/debug` | failing context, active spec, `.agent/runbooks/debugging.md`, `.agent/commands.json` | 최소 수정, 원인 기록 |
| `tidy/refactor` | active spec 또는 tidy 요청, `.agent/spec/design.md`, `.agent/commands.json` | 동작 보존 refactor, improve codebase architecture |
| `taste/review` | 변경 diff, active spec, cook summary, handoff, `.agent/commands.json` | review verdict, release readiness, loop recommendation, red-team/security finding |
| `wrap/bump` | `Ready for Wrap` active spec release set, taste verdicts, changelog/version 파일 | version/changelog 준비, release set summary |
| `serve/release` | `.agent/constitution.md`, `.agent/commands.json`, wrap release set, clean tree | release gate 결과, release set done 이동, push/deploy 전 정지 |
| `autopilot/run` | 명시적 사용자 승인, active spec, `.agent/commands.json`, release gate | bounded multi-step execution |

새 기능은 `recipe`와 `plate` 없이 `cook`으로 건너뛰지 않습니다. `recipe`는 `.agent/spec/active/NNNN-<slug>/spec.md`와 `tasks.md`를 만들고, `plate` task는 `Phase`, `Story`, `Wave`, `Covers`, `Write scope`, `Dependency`, `Parallel`, `Check`를 가져야 합니다. `cook`, `fix`, `tidy`는 실행한 command와 결과를 spec 폴더의 `tasks.md` 또는 `memory.md`에 남깁니다. `taste`, `wrap`, `serve`는 `verify`가 없거나 실패하면 release를 진행하지 않습니다. 여러 active spec은 허용하지만, `wrap`은 `Ready for Wrap` spec만 release set으로 묶습니다.

## 다음 단계

프로젝트 초기 구성이 끝났다면 “레시피를 작성해볼까요?”라고 안내합니다. 첫 기능 개발은 `recipe/plan`으로 numbered 제품 spec을 만들고, `plate/plan`으로 task를 준비한 뒤 `cook/dev`로 구현합니다. 하네스 자체를 고치거나 보강하려면 기능 개발로 처리하지 말고 `kitchen/init`을 다시 사용합니다.

## 필수 규칙

- 모든 의미 있는 변경은 번호가 붙은 spec folder에서 시작합니다.
- `.agent/constitution.md`는 kitchen 이후 human-only입니다.
- scope 변경은 구현 중이 아니라 `recipe`에서 다룹니다.
- `taste`에는 security-auditor와 red-team review가 포함됩니다.
- `.agent/commands.json`의 `verify`가 release gate입니다.
- release, deploy, push, payment, auth, data-loss 작업은 사람 승인이 필요합니다.
- `.agent/spec/INDEX.md`와 `.agent/spec/handoffs/INDEX.md`는 생성하지 않습니다. 상태 조회는 폴더 스캔으로 계산합니다.
- 관련 없는 사용자 변경을 보호합니다.

## 프로젝트 디렉터리 맵

| 경로 | 목적 |
| --- | --- |
| `.agent/spec/active/` | draft, approved, in-progress, ready-for-wrap spec folder |
| `.agent/spec/done/` | `serve`가 tag 성공 뒤 release set으로 닫은 spec |
| `.agent/spec/archived/` | review 이후 보관한 오래된 spec |
| `.agent/spec/abandoned/` | 취소되고 배운 점을 남긴 spec |
| `.agent/spec/active/NNNN-<slug>/spec.md` | 제품 의도와 acceptance source of truth |
| `.agent/spec/active/NNNN-<slug>/tasks.md` | plate 계획, task checkbox, wave/check 상태 |
| `.agent/spec/active/NNNN-<slug>/memory.md` | 구현, 테스트, review handoff와 공유 사실 |
| `.agent/autopilot/` | Ralph식 fresh iteration state와 append-only progress |
| `.agent/spec/design.md` | 시스템 architecture와 verification 전략의 source of truth |
| `.agent/release-manifest.json` | bootstrap version source. public release manifest 전까지 wrap/serve 입력으로 사용 |
| `.agent/wiki/domain.md` | 유비쿼터스 용어집, 역할, 상태, 비즈니스 규칙 |
| `.agent/wiki/design-system.md` | UI가 있을 때만 쓰는 design system |
| `.agent/wiki/decisions/` | ADR과 기술 결정 |
| `.agent/memory/MEMORY.md` | librarian이 크기를 관리하는 짧은 rolling memory |
| `.agent/memory/gotchas.md` | 반복되는 함정과 예방 메모 |
| `.agent/memory/red-team-findings.md` | 반복되는 adversarial finding |
| `.agent/runbooks/` | verification, debugging, deployment runbook |
| `.agent/setup/vibe-recipe-codex.mjs` | Codex plugin bootstrap. `~/.codex/config.toml`을 백업 후 `vibe-recipe@vibe-recipe-marketplace`를 enabled로 둡니다 |
| `.agent/setup/vibe-recipe-codex.mjs` | macOS/Linux/Git Bash wrapper |
| `.claude/settings.json` | Claude Code project-scoped marketplace와 enabled plugin 설정 |
| `.hooks/` | 결정적 local gate |
| project release notes source | 기존 release notes file을 우선하고, 없으면 kitchen이 bootstrap `CHANGELOG.md`를 만듭니다 |
| `docs/` | 사람이 읽는 프로젝트 문서 |

## Recipe 라우팅

| 요청 | 경로 |
| --- | --- |
| 새 기능, 제품 동작, scope 변경 | `recipe` |
| 구현 접근, 파일 경계, task breakdown, 검증 계획 | `plate` |
| library/vendor/API/접근 방식이 불명확함 | `forage` 후 `recipe` 또는 `plate` |
| bug, failure, regression, 원인 불명 | `fix` |
| 동작을 보존하는 구조 개선, improve codebase architecture | `tidy` |
| UI token, component pattern, visual drift | `recipe`로 정책 spec 작성, 동작 보존 migration은 `tidy` |
| version과 changelog 준비 | `wrap` |
| release gate, tag, push/deploy checkpoint | `serve` |

## 문서 권한

| 파일 | 권한 |
| --- | --- |
| `.agent/constitution.md` | kitchen 이후 human-only |
| `.agent/spec/prd.md` | scope 변경은 `recipe`가 담당 |
| `.agent/spec/design.md` | kitchen, forage, plate, tidy |
| `.agent/wiki/domain.md` | kitchen이 초기 문서 생성, 용어 변경은 `recipe`, 정리는 `librarian` |
| `.agent/wiki/design-system.md` | 정책 변경은 `recipe`, 동작 보존 migration은 `tidy` |
| `.agent/wiki/decisions/*.md` | 승인된 ADR은 append-only |
| `.agent/spec/INDEX.md` | 생성하지 않음. `peek`이 폴더를 스캔 |
| `.agent/spec/handoffs/INDEX.md` | 생성하지 않음. handoff는 각 spec folder의 `memory.md`에 누적 |
| `.agent/release-manifest.json` | kitchen generated bootstrap version source. real product manifest가 생기면 교체 또는 retire |
| project release notes source | 기존 release notes file을 우선합니다. 없을 때만 kitchen bootstrap `CHANGELOG.md`를 source로 사용합니다 |

## Command 계약

프로젝트 native command는 `.agent/commands.json`에 둡니다. 이 파일은 skill 목록이나 workflow 정의가 아니라 실행 가능한 command profile입니다.

- debugging 또는 구현 중에는 focused command를 먼저 실행합니다.
- UI/browser 변경은 `e2e` command가 있으면 실행하고, 없으면 Playwright MCP로 핵심 scenario를 확인한 뒤 결과를 기록합니다.
- merge/release 전에는 `verify`를 실행합니다.
- `verify`가 `null`이면 설정될 때까지 release는 blocked입니다.

## Plugin Bootstrap

- Claude Code에서는 `.claude/settings.json`의 `extraKnownMarketplaces.vibe-recipe-marketplace`와 `enabledPlugins["vibe-recipe@vibe-recipe-marketplace"]`를 project scope 기준으로 사용합니다.
- Codex에서는 `node .agent/setup/vibe-recipe-codex.mjs`를 실행해 각 참여자의 user config를 준비합니다.
- Codex bootstrap은 `codex plugin marketplace add https://github.com/pj4316/vibe-recipe.git`를 시도하고, `~/.codex/config.toml`을 `config.toml.bak-vibe-recipe-<timestamp>`로 백업한 뒤 `[plugins."vibe-recipe@vibe-recipe-marketplace"] enabled = true`를 남깁니다.
- Codex용 `.codex/config.toml`에는 marketplace/plugin 설정을 추가하지 않습니다. 현재 Codex에서 plugin 설정은 사용자 config 중심이기 때문입니다.
- 새 참여자가 `recipe`, `plate`, `cook`, `taste`를 찾지 못하면 먼저 `.agent/setup/vibe-recipe-codex.mjs` 실행 여부와 Claude Code plugin scope를 확인합니다.

## Blocked 응답 계약

- 어떤 skill이든 blocked면 단순히 막혔다고 끝내지 않습니다.
- 응답에는 최소한 다음이 있어야 합니다.
  - `Blocked reason`: 지금 진행할 수 없는 직접 원인
  - `Why this gate exists`: 왜 이 조건이 필요한지
  - `How to unblock`: 사용자가 바로 실행할 수 있는 해결 순서
  - `Recommended next skill`: 보통 `recipe`, `plate`, `cook`, `fix`, `taste`, `wrap`, `serve` 중 하나
- unblock 단계는 추상적인 조언 대신 파일, command, 필요한 승인 여부를 포함한 짧은 순서로 씁니다.
- release 관련 blocked면 `verify`, latest `taste` verdict, `Ready for Wrap` release set, version source, project changelog source, clean tree 중 무엇이 비었는지 분리해서 설명합니다.
- release set 관련 blocked면 포함할 `Ready for Wrap` spec이 없는지, excluded active spec이 왜 제외됐는지, wrap summary에 release set이 명시됐는지까지 분리해서 설명합니다.

## Gotchas

항상 필요한 gotcha 요약만 여기에 둡니다.

- 상세 기록: `.agent/memory/gotchas.md`
- Red-team pattern: `.agent/memory/red-team-findings.md`
- 같은 gotcha가 두 번 반복되면 이 섹션으로 승격합니다.

현재 gotcha:

- {{gotcha_summary_or_none}}

## Git

- Conventional Commits를 사용합니다.
- spec-linked commit에는 `Refs: .agent/spec/active/NNNN-<slug>/spec.md`를 포함합니다.
- `cook`, `fix`, `tidy`는 task 단위 atomic commit을 선호합니다.
- 자동 push는 하지 않습니다.

## Release 전 필수 조건

- release set에 포함할 active spec은 모두 latest `taste APPROVE`와 `Release readiness: Ready for Wrap` 상태입니다.
- release set에 포함되지 않은 active spec은 있어도 되지만, `wrap` summary에 excluded active specs와 제외 이유가 명시되어 있습니다.
- project `verify` command가 green입니다.
- release set 각 spec의 최신 `taste` verdict가 APPROVE입니다.
- BLOCKER 또는 critical security/review finding이 남아 있지 않습니다.
- version source는 public manifest가 있으면 그것을 우선하고, repo가 mirror public manifests를 의도적으로 함께 유지하면 그 manifest set 전체를 같은 version source로 다룰 수 있습니다. public manifest가 없으면 kitchen이 만든 `.agent/release-manifest.json` `0.0.0` baseline을 초기 source로 사용할 수 있습니다.
- changelog source는 project가 이미 쓰는 release notes file을 우선하고, 없으면 kitchen이 만든 `CHANGELOG.md`를 사용합니다.
- version과 changelog가 `wrap`으로 준비되었습니다.
- working tree가 clean입니다.
- push/deploy 전 사람 승인이 있습니다.

## Best-practice 근거

- 에이전트 지침은 command, file ownership, routing, gate처럼 구체적으로 유지합니다.
- architecture/design reference와 운영 규칙을 분리합니다.
- AGENTS에는 짧은 gotcha만 두고 자세한 내용은 memory에 둡니다.
