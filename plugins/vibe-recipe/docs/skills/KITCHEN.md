# Kitchen 동작 문서

`kitchen`은 vibe-recipe orchestration harness를 target project에 설치하거나 기존 서비스에 도입할 때 실행하는 초기화 skill입니다. 사용자는 제품에 대한 질문에만 답하고, spec-first workflow, 문서 권한, human gate, review/release gate 같은 harness 규칙은 vibe-recipe 기본값으로 적용합니다.

사용자에게 설명할 때는 내부 파일명을 먼저 나열하지 않고, “작업 규칙 안내”, “프로젝트 이해 메모”, “실행/검증 설정”, “안전장치”, “첫 점검용 예제 작업”처럼 쉬운 말로 번역해서 안내합니다. 실제 파일 경로는 사용자가 요청했거나 preview 승인에 꼭 필요할 때만 함께 보여줍니다.

대화 톤은 실제 VC에서 고객에게 제품 방향과 운영 세팅을 제안해주는 상담가에 가깝게 유지합니다. 단순 체크리스트 질문보다 “제가 이해한 현재 상태”, “제가 추천하는 기본 방향”, “다만 이 우려는 지금 확인하고 싶다”는 흐름으로 티키타카를 이어갑니다.

orchestration harness는 `AGENTS.md`, hooks, `.agent/`, plugin bootstrap으로 구성됩니다.

- `AGENTS.md`: skill 라우팅, 역할 경계, parent/orchestrator agent 책임, human gate를 정의합니다.
- hooks: constitution 수정, push/deploy/release, secret, release gate처럼 결정적으로 검사 가능한 안전장치를 강제합니다.
- `.agent/`: spec, command profile, runbook, domain language, memory, handoff를 저장합니다.
- plugin bootstrap: Codex와 Claude Code 참여자가 같은 프로젝트에서 `vibe-recipe` 플러그인을 쓸 수 있도록 설정과 bootstrap 경로를 남깁니다.

`.agent/commands.json`은 각 skill이나 기능을 정의하는 파일이 아닙니다. target project의 native command profile이며 `cook`, `taste`, `serve`가 어떤 test/build/e2e/verify/dev 명령을 실행할지 판단하는 기준입니다.

초기화가 끝나면 target project는 별도 harness 작업 없이 바로 `recipe/plan`으로 첫 제품 spec을 만들고, `plate/plan`으로 구현 계획을 만든 뒤 `cook/dev`로 구현을 시작할 수 있어야 합니다.

Codex는 현재 Claude Code의 `.claude/settings.json`처럼 repository-scoped marketplace/plugin enablement를 공식 지원하지 않습니다. `kitchen`은 Codex용 `.codex/config.toml`에 지원되지 않는 plugin block을 만들지 않고, `.agent/setup/vibe-recipe-codex.mjs`를 생성해 각 참여자의 `~/.codex/config.toml`을 백업 후 자동 패치합니다. Claude Code는 project-scoped plugin 설정을 지원하므로 `.claude/settings.json`에 marketplace와 enabled plugin을 병합합니다.

같은 대화에 제품 brief나 이전 alignment 메모가 있으면 `kitchen`은 이를 제품 답변 초안으로 사용합니다. 별도 brief가 없어도 빠른 `/vr:kitchen` 초기화 흐름은 그대로 진행합니다.

## 목표

- target project 루트에 에이전트가 매 세션 읽을 `AGENTS.md`를 생성합니다.
- `.agent/` 아래에 제품 문맥, 기술 설계, command profile, memory, spec, runbook 문서를 구성합니다.
- `.agent/wiki/domain.md`에 유비쿼터스 용어집을 만들어 사용자, spec, 코드 설명, review가 같은 도메인 언어로 소통하게 합니다.
- release/deploy/push, auth/payment/data-loss, constitution 변경 같은 위험 작업에 human gate를 둡니다.
- 첫 health-check spec을 만들어 harness가 실제로 동작하는지 rehearsal할 수 있게 합니다.
- UI/browser workflow는 `e2e` command 또는 Playwright MCP로 acceptance를 확인할 수 있게 합니다.
- 초기 구성이 끝나면 “프로젝트 초기 구성이 끝났습니다. 레시피를 작성해볼까요?”라고 안내합니다.

## 동작 모드

| Mode | Trigger | 동작 |
| --- | --- | --- |
| `fresh` | `.agent/constitution.md`가 없고 새 프로젝트 성격이 강함 | 제품 중심 질문을 실행하고 기본 scaffold를 생성합니다. |
| `adopt` | 기존 서비스에 처음 vibe-recipe를 도입하려는 요청 | repo 구조, 기존 문서, command, agent 지침을 감지해 비침투적 harness를 생성합니다. |
| `abort` | `.agent/constitution.md`가 있고 별도 요청이 없음 | 현재 harness 요약만 보여주고 파일을 쓰지 않습니다. |
| `heal` | 누락 파일 복구 요청 | 빠진 scaffold만 복구하고 기존 사용자 파일은 덮어쓰지 않습니다. |
| `patch <file>` | 특정 생성 파일 갱신 요청 | 지정한 파일만 제품 정보 또는 운영 모델 기준으로 재생성합니다. |
| `harness` | `.agent`, hooks, command profile, 생성 지침 개선 요청 | 제품 scope는 유지하고 주방기구만 점검/개선합니다. |
| `reset` | 명시적 reset 요청 | clean tree, backup, double confirm 후 fresh를 다시 실행합니다. |

mode가 애매하면 기존 harness가 있을 때는 `abort`로 처리합니다. harness가 없고 기존 서비스 흔적이 강하면 `adopt`, 빈 repo 또는 새 제품 요청이면 `fresh`로 처리합니다.

## 기존 서비스 도입

`adopt` 모드는 이미 운영 중인 서비스에 vibe-recipe를 입힙니다.

- 기존 README, docs, ADR, runbook, CI workflow를 읽습니다.
- package scripts, Makefile, test/build/lint/e2e command를 `.agent/commands.json` stable key로 매핑합니다.
- 기존 architecture와 module boundary를 `.agent/spec/design.md` 아키텍처 문서로 요약합니다.
- 아키텍처 문서는 감지된 entry point, source/test/config 경로, 외부 interface, data store, deploy surface를 “감지된 사실 + 미확정 항목”으로 정리합니다.
- 아키텍처 문서는 Hexagonal architecture를 실제 경계 모델로 설명해야 하며, driving/driven port, adapter 책임, dependency direction, boundary ownership을 문장과 표로 드러냅니다.
- 아키텍처 문서는 TDD를 단순 권장사항으로 끝내지 않고, outside-in use case test, inside-out domain invariant test, adapter seam verification까지 포함한 검증 전략으로 설명합니다.
- 기존 제품 용어를 `.agent/wiki/domain.md` 초안으로 추출하고, 비어 있는 부분은 선택된 preset의 glossary stance로 채웁니다.
- 기존 `AGENTS.md`, `CLAUDE.md`, copilot 지침이 있으면 보존하고 충돌 없이 vibe-recipe routing을 추가합니다.
- hooks는 non-destructive guardrail부터 설치하고, 차단성 hook은 preview와 승인 후 활성화합니다.
- 확신할 수 없는 항목은 추측하지 않고 `Adoption Questions`로 남깁니다.

## 질문 범위

`kitchen`은 제품 정의에 필요한 것만 묻습니다.

- 어떤 제품을 만들고 싶은가.
- 누구를 먼저 만족시켜야 하는가.
- 첫 버전에서 꼭 동작해야 하는 것은 무엇인가.
- 첫 버전에서 일부러 만들지 않을 것은 무엇인가.
- 성공했다고 볼 기준은 무엇인가.
- 중요한 용어, 역할, 상태, 오해하면 안 되는 규칙이 있는가.
- UI가 있다면 어떤 느낌과 밀도를 원하는가.

질문은 한 번에 하나씩 진행하고, 각 질문에는 추천 답변과 추천 이유를 함께 제시합니다. `Alignment Brief`가 있으면 `Goal`, `Audience`, `MVP`, `Non-goals`, `Success criteria`, `Domain terms`, `Assumptions`를 각각 product pitch, primary user, MVP, anti-scope, success metric, domain terminology draft, dangerous assumptions 초안으로 매핑합니다.
사용자가 architecture shape, UI reference/density/mode, domain tone을 직접 지정하지 않으면 `kitchen`은 질문으로 비우기보다 type-based preset 기본값을 적용합니다.

초기 설정은 human-in-the-loop로 진행합니다.

1. repo를 읽고 “제가 이해한 현재 프로젝트”를 쉬운 말로 먼저 요약합니다.
2. 사용자가 맞는지 확인하거나 수정합니다.
3. 수정된 내용을 반영해 다시 짧게 요약합니다.
4. 사용자가 “맞다” 또는 “그렇게 진행해도 된다”고 확인하기 전에는 scaffold 쓰기를 시작하지 않습니다.

특히 기존 서비스 도입에서는 유지할 것과 새로 추가할 것을 분리해 합의할 때까지 이 루프를 반복합니다.

각 라운드는 아래 순서를 따릅니다.

1. 현재 이해 요약
2. 추천 설정 방향
3. 우려사항 질문 1-3개
4. 모를 때 선택할 수 있는 추천 답
5. 반영된 다음 설정 요약

다음은 사용자에게 묻지 않고 기본값으로 적용합니다.

- spec-first를 사용할지 여부.
- constitution을 누가 수정할지.
- review에 security/red-team을 포함할지.
- release/deploy/push를 자동화할지.
- auth/payment/data-loss 작업에 human gate를 둘지.

## 생성 파일

아래는 agent 내부에서 다루는 실제 target입니다. 사용자에게는 먼저 “무엇을 위한 설정인지”를 쉬운 말로 설명하고, 필요할 때만 경로를 함께 보여줍니다.

| Resource | Target | 설명 |
| --- | --- | --- |
| `resources/AGENTS.md` | `AGENTS.md` | 에이전트 운영 계약과 `.agent` 준수 규칙 |
| `resources/constitution.md` | `.agent/constitution.md` | 초기화 이후 human-only인 프로젝트 헌장 |
| `resources/design.md` | `.agent/spec/design.md` | arc42 + C4 hybrid architecture 문서. repo facts와 Mermaid diagram skeleton 포함 |
| `resources/domain.md` | `.agent/wiki/domain.md` | 유비쿼터스 용어집 문서 |
| `resources/design-system.md` | `.agent/wiki/design-system.md` | UI 프로젝트일 때만 생성하는 foundations-first design system 문서 |
| `resources/commands.json` | `.agent/commands.json` | stable command profile |
| `resources/release-manifest.json` | `.agent/release-manifest.json` | real product manifest가 없을 때 쓰는 `0.0.0` bootstrap version source |
| `resources/CHANGELOG.md` | project release notes source | 기존 release notes file이 없을 때 wrap이 재사용할 bootstrap `CHANGELOG.md` source |
| `resources/setup-vibe-recipe-codex.mjs` | `.agent/setup/vibe-recipe-codex.mjs` | Codex marketplace 등록과 `~/.codex/config.toml` plugin enablement 자동 패치. Windows/macOS/Linux 공통 실행 경로 |
| `resources/claude-settings.json` | `.claude/settings.json` | Claude Code project marketplace와 enabled plugin 설정. 기존 JSON은 보존 병합 |
| `resources/health-check.md` | `.agent/spec/active/0001-health-check.md` | harness rehearsal용 첫 spec |
| `resources/runbook-verification.md` | `.agent/runbooks/verification.md` | 검증 절차 |
| `resources/runbook-debugging.md` | `.agent/runbooks/debugging.md` | 디버깅 절차 |
| `resources/runbook-deployment.md` | `.agent/runbooks/deployment.md` | 배포 전 점검 절차 |
| `examples/presets/<type>/design.md` | plugin authoring source | 미지정 시 architecture stance 기본값 |
| `examples/presets/<type>/domain.md` | plugin authoring source | 미지정 시 domain glossary stance 기본값 |
| `examples/presets/web-app/design-system.md` | plugin authoring source | 미지정 시 design-system stance 기본값 |
| `examples/presets/web-app/themes/*.md` | plugin authoring source | 미지정 시 theme packet 주입 |

추가로 `.agent/spec/{active,done,archived,abandoned,handoffs}`, `.agent/wiki/decisions`, `.agent/memory/{topics,handoffs}`, `.agent/runbooks`, `.agent/setup`, `.claude` 디렉터리를 준비합니다. `CLAUDE.md`는 `AGENTS.md` symlink를 우선하고, 실패하면 generated copy로 둡니다. release 계열 skill의 source 부재를 줄이기 위해 `kitchen`은 project release notes source가 없을 때만 `CHANGELOG.md` bootstrap skeleton을 만들고, public manifest가 없으면 `.agent/release-manifest.json`을 `0.0.0` 초기 version source로 둡니다.

Claude Code 설정 병합은 다음 정책을 따릅니다.

- 기존 `.claude/settings.json`이 없으면 `resources/claude-settings.json`을 기반으로 생성합니다.
- 기존 파일이 있으면 `permissions`, `env`, MCP, hook 같은 다른 키는 그대로 두고 `extraKnownMarketplaces.vibe-recipe-marketplace`와 `enabledPlugins["vibe-recipe@vibe-recipe-marketplace"] = true`만 추가하거나 갱신합니다.
- JSON이 깨져 있으면 덮어쓰지 말고 blocked로 보고하고, 사용자가 파일을 고치거나 백업 승인할 때까지 멈춥니다.

Codex bootstrap은 다음 정책을 따릅니다.

- `.agent/setup/vibe-recipe-codex.mjs`는 create only로 둡니다. Node.js가 있는 Windows/macOS/Linux에서 `node .agent/setup/vibe-recipe-codex.mjs`로 실행합니다.
- Node bootstrap은 `codex plugin marketplace add https://github.com/pj4316/vibe-recipe.git`를 시도합니다.
- 이어서 `~/.codex/config.toml`에 `[marketplaces.vibe-recipe-marketplace]`와 `[plugins."vibe-recipe@vibe-recipe-marketplace"] enabled = true`를 idempotent하게 남깁니다.
- 패치 전 `config.toml.bak-vibe-recipe-<timestamp>` 백업을 만듭니다.
- 테스트나 CI에서는 `CODEX_HOME`으로 임시 config 위치를 바꾸고, 필요하면 `VIBE_RECIPE_SKIP_MARKETPLACE_ADD=1`로 CLI marketplace 호출만 건너뜁니다.

`examples/`는 plugin repo 내부 authoring asset입니다. fallback 설치에서는 universal `AGENTS.md`에 preset/theme 예시 본문을 임베드해 self-contained reference로 제공합니다. target project에 생성되는 `.agent/spec/design.md`, `.agent/wiki/design-system.md`, `.agent/wiki/domain.md`는 examples 경로를 참조하는 문서가 아니라, 선택된 preset/theme를 바탕으로 생성된 결과물입니다.

preset 규칙은 다음과 같습니다.

- `web-app`: frontend 힌트가 강한 repo
- `backend-service`: backend/API 힌트만 강한 repo
- `cli-tool`: command/terminal 중심 entry point
- `library-package`: package/export 중심이고 app surface가 약한 repo
- 혼합형 우선순위: `web-app -> backend-service -> cli-tool -> library-package`
- precedence: 사용자 명시 입력 -> repo facts -> preset defaults -> generic fallback
- architecture는 선택된 preset의 architecture packet stance를 출발점으로 사용합니다. 기본값은 Hexagonal architecture와 TDD입니다.
- domain은 선택된 preset의 domain packet glossary stance를 출발점으로 사용합니다.
- `design-system.md`는 `web-app` preset일 때만 기본 프리셋 source가 있습니다. `backend-service`, `cli-tool`, `library-package`는 기본적으로 design-system 대상이 아니며, 명시적 요청이나 실제 UI surface가 있을 때만 생성합니다.
- `web-app`에서는 다시 theme example을 고릅니다. admin/dashboard/backoffice면 `enterprise-professional`, 일반 B2B SaaS면 `modern-minimal`, consumer/collab면 `friendly-colorful`을 기본으로 씁니다.
- 선택된 theme packet의 실제 값을 generated design-system 문서에 직접 주입합니다. target project 문서에는 preset/theme 이름, 선택 이유, 그리고 실제 주입된 결과만 남기고 plugin 내부 경로는 남기지 않습니다. color palette, typography, spacing/radius, button design, chip/badge, icon style, card/input이 최소 주입 대상입니다. 여기에 더해 border/focus/selection token, fallback font policy와 heading/body weight, control height/icon size/shadow token, navigation/tabs/selected state, table/list density와 numeric alignment, dialog/drawer/toast/skeleton/empty state tone까지 문서에 남겨야 합니다.

강화된 초기 문서는 다음 기준을 따릅니다.

- `design.md`는 Introduction/Goals, Constraints, Context/Scope, Solution Strategy, Building Blocks, Runtime Scenarios, Deployment/Operational Notes, Cross-cutting Concepts, Decisions, Quality, Risks/Tech Debt, Glossary를 고정 섹션으로 둡니다.
- `design.md`의 Context, Building Blocks, Runtime, Deployment에는 Mermaid skeleton을 넣고, Mermaid renderer가 없어도 읽히도록 제목, 범위, 범례, 관계 label을 함께 적습니다.
- `design.md`는 구현 전에 가장 먼저 읽는 architecture source of truth이며, 기본 코딩 stance로 Hexagonal architecture와 TDD를 강조합니다.
- 별도 `architecture.md` 본문은 유지하지 않습니다. architecture guidance는 `.agent/spec/design.md`에 통합해 중복 source of truth와 문서 drift를 피합니다.
- `design.md`는 Clean/Hexagonal/TDD를 “바뀌는 I/O로부터 domain/application core를 보호하는 실무 경계 모델”로 설명하고, driving/driven port, adapter 책임, dependency direction, test pyramid, architecture review checklist를 포함합니다.
- `design-system.md`는 foundations-first 구조를 따르며 Accessibility, Content, Spacing/Grid, Color, Typography, Motion, Iconography, Empty/Error/Loading states를 기본 foundation으로 둡니다.
- token은 primitive -> semantic alias -> component/state 계층으로 설명하고, 문서에서는 semantic token 중심으로 정책을 세웁니다.
- UI 프로젝트에서는 focus visible, color-only 금지, reduced motion 존중, contrast 기준, keyboard path를 직접 체크리스트로 문서화합니다.
- layout/composition에는 app shell, form, table/list, detail panel, empty/loading/error, destructive action 패턴 슬롯을 둡니다.
- `design.md`, `design-system.md`, `domain.md`는 선택된 preset 이름, 선택 이유, 자동 적용된 핵심 기본값을 함께 기록합니다.

## 생성된 AGENTS.md 계약

생성된 `AGENTS.md`는 에이전트에게 다음을 요구합니다.

- 작업 시작 시 `.agent/constitution.md`, `.agent/spec/prd.md`, `.agent/spec/design.md`, `.agent/commands.json`, `.agent/memory/gotchas.md`를 먼저 읽습니다.
- 사용자 질문, spec, handoff, review, 코드 설명은 `.agent/wiki/domain.md`의 용어를 기준으로 맞춥니다.
- 기능 개발은 `recipe/plan`으로 numbered 제품 spec을 만들고 `plate/plan`으로 task를 준비한 뒤 `cook/dev`로 구현합니다.
- 구현은 red -> green -> refactor를 기본으로 하고, UI/browser 변경은 Given/When/Then scenario와 `e2e` command 또는 Playwright MCP 검증을 남깁니다.
- harness 자체를 보수하거나 개선할 때는 ad hoc edit이 아니라 `kitchen/init`을 다시 사용합니다.
- `.agent/constitution.md`와 제품 scope에 충돌하는 변경은 진행 전에 사람에게 확인합니다.

## 완료 기준

`kitchen`은 다음이 만족되면 완료로 봅니다.

- `AGENTS.md`, `.agent/constitution.md`, `.agent/spec/design.md`, `.agent/spec/prd.md`가 생성됩니다.
- `.agent/wiki/domain.md`가 유비쿼터스 용어집으로 생성됩니다.
- `.agent/commands.json`이 valid JSON이고 stable key를 모두 포함합니다.
- UI/browser 프로젝트이면 `e2e` command 가능 여부 또는 Playwright MCP manual check 기준이 명확합니다.
- `.agent/spec/active/0001-health-check.md`가 생성됩니다.
- `.agent/autopilot/state.json`과 `.agent/autopilot/progress.md`가 생성됩니다.
- `.agent/runbooks/verification.md`, `.agent/runbooks/debugging.md`, `.agent/runbooks/deployment.md`가 생성됩니다.
- `.agent/setup/vibe-recipe-codex.mjs`가 생성되고 Codex plugin bootstrap 경로가 `AGENTS.md`와 verification runbook에 설명됩니다.
- `.claude/settings.json`이 생성되거나 보존 병합되어 `vibe-recipe@vibe-recipe-marketplace` project plugin enablement를 포함합니다.
- Codex용 `.codex/config.toml`에는 marketplace/plugin block을 만들지 않습니다. Codex 참여자는 `.agent/setup/vibe-recipe-codex.mjs`로 user config를 백업 후 자동 패치합니다.
- `.agent/spec/design.md`가 repo facts 기반 architecture 플레이북으로 생성되고 Mermaid skeleton이 포함됩니다. 선택된 preset과 architecture 기본값도 보이며, Hexagonal architecture와 TDD 기본 원칙이 드러납니다.
- `.agent/wiki/domain.md`가 선택된 preset, glossary depth, role/state style, domain tone을 포함합니다.
- UI/frontend 프로젝트이면 `.agent/wiki/design-system.md`가 foundations, token hierarchy, accessibility, composition, governance를 포함한 정책 문서로 생성됩니다. 또한 color/font/spacing/state/component detail이 category 수준이 아니라 token/value 수준으로 충분히 채워져 있어야 하며, navigation/table/overlay 같은 실제 화면 패턴 디테일까지 포함해야 합니다. backend/cli/library preset은 기본적으로 design-system을 포함하지 않습니다.
- public manifest가 없으면 `.agent/release-manifest.json` `0.0.0` baseline이 있고, project release notes source가 없으면 bootstrap `CHANGELOG.md` source가 있어 wrap/serve가 source 부재만으로는 막히지 않습니다.
- 생성/skip한 파일 목록과 command profile을 사용자에게 보고합니다.
- 마지막 안내로 “프로젝트 초기 구성이 끝났습니다. 레시피를 작성해볼까요?”를 보여줍니다.

`verify` command가 `null`이면 kitchen 완료는 가능하지만 release 상태는 blocked로 보고합니다.
blocked를 보고할 때는 원인만이 아니라 왜 막는지와 어떻게 풀지까지 같이 설명합니다.

## 검증 포인트

`kitchen` 변경을 커밋하기 전에는 다음을 확인합니다.

```bash
test -f plugins/vibe-recipe/skills/kitchen/resources/AGENTS.md
test -f plugins/vibe-recipe/skills/kitchen/resources/commands.json
test -f plugins/vibe-recipe/skills/kitchen/resources/release-manifest.json
test -f plugins/vibe-recipe/skills/kitchen/resources/CHANGELOG.md
test -f plugins/vibe-recipe/skills/kitchen/resources/setup-vibe-recipe-codex.mjs
test -f plugins/vibe-recipe/skills/kitchen/resources/claude-settings.json
python3 -m json.tool plugins/vibe-recipe/skills/kitchen/resources/commands.json >/dev/null
python3 -m json.tool plugins/vibe-recipe/skills/kitchen/resources/release-manifest.json >/dev/null
python3 -m json.tool plugins/vibe-recipe/skills/kitchen/resources/claude-settings.json >/dev/null
node --check plugins/vibe-recipe/skills/kitchen/resources/setup-vibe-recipe-codex.mjs
node plugins/vibe-recipe/scripts/build-universal-agents-md.mjs /tmp/vibe-recipe-AGENTS.md
grep -q 'kitchen' /tmp/vibe-recipe-AGENTS.md
grep -q 'recipe' /tmp/vibe-recipe-AGENTS.md
grep -q 'vibe-recipe@vibe-recipe-marketplace' /tmp/vibe-recipe-AGENTS.md
grep -q 'codex plugin marketplace add' /tmp/vibe-recipe-AGENTS.md
```

hooks나 install script까지 함께 바꿨다면 관련 `.mjs` 파일에 `node --check`를 실행합니다.
