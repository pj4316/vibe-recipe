---
name: kitchen
description: /vr:kitchen 호출 시 사용합니다. 새 프로젝트 또는 기존 서비스에 vibe-recipe orchestration harness를 설치/도입/복구합니다. AGENTS.md, hooks, .agent, command profile을 구성해 recipe -> cook -> taste workflow가 재현 가능하게 동작해야 할 때 사용합니다.
---

# kitchen (init) - 주방 차리기

`kitchen`은 vibe-recipe orchestration harness를 구축하는 skill입니다. 새 프로젝트에는 기본 harness를 설치하고, 기존 서비스에는 현재 구조와 명령을 존중하며 비침투적으로 도입합니다.

orchestration harness는 세 층입니다.

- `AGENTS.md`: skill 라우팅, 역할 경계, parent/orchestrator agent 책임, human gate.
- hooks: constitution 수정, push/deploy/release, secret, release gate처럼 결정적으로 검사 가능한 안전장치.
- `.agent/`: spec, command profile, runbook, domain language, memory, handoff.

`.agent/commands.json`은 스킬 정의 파일이 아닙니다. target project의 native command profile이며 `cook`, `taste`, `serve`가 어떤 setup/build/test/e2e/lint/verify/dev 명령을 실행할지 판단하는 기준입니다.

## 대화 톤

- 처음 쓰는 사용자도 따라올 수 있게 “지금 무엇을 만드는지”와 “왜 필요한지”를 쉬운 말로 설명합니다.
- 질문은 제품 언어로 친절하게 묻고, 모르면 고를 수 있는 추천안을 함께 제시합니다.
- 생성하거나 건드릴 파일은 미리 예고하고, 사용자가 놀라지 않게 바뀌는 범위를 분명하게 안내합니다.
- 제한이나 human gate가 있으면 딱 잘라 거절하기보다 이유와 안전한 다음 경로를 함께 설명합니다.
- 실제 VC에서 고객에게 제품 설계와 운영 방향을 제안해주는 상담가처럼 대화합니다.
- 지시문을 읽어주는 느낌보다, “제가 보기엔 지금은 A로 시작하는 게 가장 안전합니다”처럼 의견과 이유를 함께 제안합니다.
- 사용자의 답을 받은 뒤에는 곧바로 반영된 이해를 다시 짧게 요약해 티키타카가 이어지도록 합니다.

## 사용자 설명 원칙

- 사용자에게는 내부 파일 경로를 먼저 나열하지 말고, “작업 규칙 안내”, “프로젝트 이해 메모”, “실행/검증 설정”, “안전장치”, “첫 점검용 예제 작업”처럼 쉬운 말로 설명합니다.
- 실제 파일 경로는 사용자가 요청했거나, preview 승인에 필요한 경우, 또는 최종 보고에서 근거를 남겨야 할 때만 함께 보여줍니다.
- “`.agent/commands.json`을 만들겠습니다”보다 “테스트와 실행에 쓸 프로젝트 명령을 정리하겠습니다”처럼 먼저 설명합니다.
- setup이 비어 있거나 깨져 있어도 곧바로 누락 파일 목록부터 말하지 말고, 무엇이 아직 준비되지 않았는지 사용자 관점의 기능으로 번역해 설명합니다.

## Human-in-the-loop 정렬 루프

초기 설정은 agent가 이해한 프로젝트 모습과 사용자가 기대하는 설정이 맞을 때까지 확인 루프를 돌립니다.

1. repo 탐색 후 “제가 이해한 프로젝트”를 쉬운 말로 요약합니다.
2. 제품 목적, 사용자, 첫 버전 범위, 이미 있는 구조에 대한 추정이 맞는지 확인받습니다.
3. 사용자가 수정하면 그 내용을 반영해 다시 짧게 요약합니다.
4. 사용자가 “맞다”, “그렇게 진행해도 된다”는 의미로 확인하기 전에는 scaffold 쓰기를 시작하지 않습니다.
5. 기존 서비스 도입에서는 특히 “유지할 것”과 “새로 추가할 것”을 구분해 확인받을 때까지 반복합니다.

이 루프의 목적은 질문을 많이 하는 것이 아니라, 초기 프로젝트 설정 인식이 어긋난 상태로 파일을 만들지 않도록 하는 것입니다.

각 라운드는 아래 흐름을 기본으로 합니다.

1. 현재 이해 요약: “제가 이해한 현재 프로젝트는 이렇습니다.”
2. 제안: “이 기준이라면 이런 방식으로 세팅하는 것을 추천합니다.”
3. 우려사항 질문: “다만 이 부분은 확인이 필요합니다.”
4. 선택지 또는 추천 답: “모르면 우선 이렇게 가도 됩니다.”
5. 반영 요약: “그 답을 기준으로 다음 설정은 이렇게 잡겠습니다.”

질문은 checklist 심문처럼 길게 이어가지 않습니다. 한 번에 핵심 우려 1-3개만 다루고, 답을 받으면 바로 요약해 다음 라운드로 넘어갑니다.

## Resources

핵심 템플릿은 `resources/`에 있습니다. `kitchen`은 템플릿을 그대로 복사하지 않고 제품 답변과 repo 감지 결과를 채워 생성합니다.

- `resources/AGENTS.md`
- `resources/constitution.md`
- `resources/design.md`
- `resources/design-system.md`
- `resources/domain.md`
- `resources/commands.json`
- `resources/health-check.md`
- `resources/runbook-verification.md`
- `resources/runbook-debugging.md`
- `resources/runbook-deployment.md`
- kitchen에 번들된 preset architecture packets
- kitchen에 번들된 preset domain packets
- kitchen에 번들된 web-app design-system preset packet
- kitchen에 번들된 web-app theme packets (`modern-minimal`, `friendly-colorful`, `enterprise-professional`)

세부 동작 문서는 `plugins/vibe-recipe/docs/skills/KITCHEN.md`를 따릅니다.

`examples/`는 plugin repo 내부 authoring source입니다. slash command가 없는 fallback 설치에서는 `build-universal-agents-md.sh`가 이 예시 본문을 universal `AGENTS.md`에 임베드해 self-contained reference로 제공합니다. target project에 생성되는 `.agent/spec/design.md`, `.agent/wiki/design-system.md`, `.agent/wiki/domain.md`는 examples 경로를 참조하는 문서가 아니라, 선택된 preset/theme를 바탕으로 생성된 결과물이어야 합니다.

핵심 seed의 의도는 다음과 같습니다.

- `resources/design.md`: arc42 섹션 구조와 C4 계층 사고방식을 섞은 architecture 플레이북입니다. repo 감지 결과를 바로 매핑하고, context/building blocks/runtime/deployment에 Mermaid skeleton을 남겨 implementer가 추가 질문 없이 채울 수 있게 합니다.
- `resources/design-system.md`: foundations-first design system 플레이북입니다. token hierarchy, focus visible을 포함한 accessibility checklist, composition pattern, governance까지 한 번에 seed해 UI 정책을 바로 결정할 수 있게 합니다.

## Preset selection

사용자가 architecture, design-system, domain 방향을 직접 주지 않으면 `kitchen`은 repo 감지 결과로 preset 타입을 고르고 kitchen에 번들된 preset packets를 사용합니다. architecture는 선택된 preset의 architecture packet, domain은 선택된 preset의 domain packet 기본 stance를 따릅니다. architecture 기본값은 Hexagonal architecture와 TDD입니다.

- `web-app`: frontend 힌트가 강한 repo
- `backend-service`: backend/API 힌트만 강한 repo
- `cli-tool`: command/terminal 중심 entry point
- `library-package`: package/export 중심이며 app surface가 약한 repo
- 혼합형 우선순위: `web-app -> backend-service -> cli-tool -> library-package`

precedence는 다음 순서를 고정합니다.

1. 사용자 명시 입력
2. repo facts에서 직접 감지된 사실
3. 선택된 preset의 기본값
4. generic fallback

`design-system.md`는 `web-app` preset일 때만 기본 프리셋 source가 있습니다. `backend-service`, `cli-tool`, `library-package`는 기본적으로 design-system 대상이 아니며, 사용자가 명시적으로 요구하거나 repo facts가 실제 UI를 보여줄 때만 생성합니다.
`web-app`에서는 다시 theme packet을 고릅니다. 기본 theme는 다음처럼 선택합니다.

- `enterprise-professional`: admin, dashboard, workflow tool, backoffice
- `modern-minimal`: 일반적인 B2B SaaS, polished product UI
- `friendly-colorful`: consumer-friendly, onboarding-heavy, collaborative product

선택된 theme packet의 실제 값을 설명으로 요약하지 말고 generated design-system seed에 직접 반영합니다. target project 문서에는 preset/theme 이름, 선택 이유, 그리고 실제 주입된 결과만 남기고 plugin 내부 경로는 남기지 않습니다. 최소 주입 대상은 color palette, typography, spacing/radius, button design, chip/badge, icon style, card/input입니다.

## Mode

파일을 쓰기 전에 mode를 판정합니다.

| Mode | Trigger | Behavior |
| --- | --- | --- |
| `fresh` | 새 프로젝트 성격이 강하고 `.agent/constitution.md`가 없음 | 제품 질문 후 기본 harness를 생성합니다. |
| `adopt` | 기존 서비스에 처음 vibe-recipe를 도입 | 기존 문서, 구조, command, agent 지침을 읽고 비침투적 harness를 생성합니다. |
| `abort` | 이미 harness가 있고 별도 요청이 없음 | 현재 셋업 요약만 보여주고 쓰지 않습니다. |
| `heal` | 누락 파일 복구 요청 | 누락 scaffold만 복구하고 사용자 파일은 덮어쓰지 않습니다. |
| `patch <file>` | 특정 생성 파일 갱신 요청 | 지정 파일만 preview와 승인 후 재생성합니다. |
| `harness` | command profile, hooks, `.agent/`, generated instructions 개선 | 제품 scope는 유지하고 주방기구만 점검/개선합니다. |
| `reset` | 명시적 reset 요청 | clean tree, backup, double confirm 후 fresh를 다시 실행합니다. |

mode가 애매하면 기존 harness가 있을 때는 `abort`입니다. harness가 없고 기존 서비스 흔적이 강하면 `adopt`, 빈 repo 또는 새 제품 요청이면 `fresh`입니다.

## Preflight

질문 전에 repo 사실을 조용히 수집합니다.

- `git status --short`
- stack 후보: `package.json`, `pyproject.toml`, `requirements.txt`, `Cargo.toml`, `go.mod`, `Gemfile`
- package manager와 lockfile
- frontend/backend/API/worker/CLI/shared package hint
- command 후보: package scripts, Makefile, CI workflow, test/build/lint/e2e 도구
- 기존 지침: `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`
- 기존 harness: `.agent/`, `.hooks/`, pre-commit, release/deploy script
- preset 판정을 위한 project type 힌트: browser entry, HTTP/API surface, CLI entry point, export/package surface

감지 결과는 사용자 선택지를 늘리기 위한 것이 아니라 `AGENTS.md`, `.agent/spec/design.md`, `.agent/commands.json` 생성 근거입니다.

## 사용자 질문 범위

사용자에게 묻는 내용은 제품 정의에 한정합니다.

- 어떤 제품을 만들고 싶은가.
- 누구를 위한 제품인가.
- 첫 버전에서 꼭 동작해야 하는 것은 무엇인가.
- 지금 만들지 않을 것은 무엇인가.
- 성공했다고 볼 기준은 무엇인가.
- 중요한 용어, 역할, 상태, 오해하면 안 되는 규칙이 있는가.
- UI가 있다면 원하는 느낌과 밀도는 무엇인가.

같은 대화의 제품 brief나 이전 alignment 메모가 있으면 제품 답변 초안으로 사용합니다. 운영 원칙은 묻지 않고 vibe-recipe 기본값으로 적용합니다.
사용자가 architecture shape, UI reference/density/mode, domain tone을 말하지 않으면 질문으로 빈칸을 남기지 말고 선택된 preset 기본값을 적용합니다.

질문은 한 번에 전부 쏟아내지 않습니다. 각 라운드마다 아래 형식으로 진행합니다.

- 제가 이해한 현재 상황
- 제가 추천하는 기본 방향
- 지금 꼭 확인해야 하는 1-3개 우려사항 질문
- 모를 때 선택할 수 있는 추천 답
- 답이 반영되면 설정이 어떻게 바뀌는지

질문 자체도 상담형으로 표현합니다. 예를 들면:

- “처음 버전은 내부 팀이 쓰는 도구에 가깝나요, 아니면 외부 고객이 바로 쓰는 서비스인가요?”
- “지금은 속도가 더 중요한가요, 아니면 실수 없이 운영 규칙을 먼저 단단히 잡는 게 더 중요한가요?”
- “제가 보기엔 첫 설정은 가볍게 시작하고 검증 흐름만 먼저 잡는 쪽이 좋아 보이는데, 이 방향으로 괜찮을까요?”

## Adopt 규칙

기존 서비스에 도입할 때는 기존 운영 방식을 덮지 않는 것을 우선합니다.

- 기존 README, docs, ADR, runbook, CI workflow를 읽습니다.
- 기존 명령을 `.agent/commands.json` stable key로 매핑합니다.
- 기존 architecture와 module boundary를 `.agent/spec/design.md` seed로 요약합니다.
- architecture seed는 감지된 entry point, source/test/config 경로, 외부 interface, data store, deploy surface를 “감지된 사실 + 미확정 항목”으로 기록합니다.
- 기존 제품 용어를 `.agent/wiki/domain.md` 초안으로 추출하고, 비어 있는 부분은 선택된 preset의 glossary stance로 채웁니다.
- architecture 문서는 구현 전 반드시 읽는 기준 문서로 두고, 기본 코딩 stance는 Hexagonal architecture와 TDD를 우선합니다.
- 기존 agent 지침은 보존하고 vibe-recipe routing과 gate를 추가합니다.
- hooks는 non-destructive guardrail부터 설치하고, 차단성 hook은 preview와 승인 후 활성화합니다.
- 확신할 수 없는 항목은 추측하지 않고 `Adoption Questions`로 남깁니다.

## 기본 운영 원칙

`kitchen`은 모든 프로젝트에 다음 기본값을 적용합니다.

- 모든 의미 있는 변경은 numbered spec에서 시작합니다.
- `.agent/constitution.md`는 초기화 이후 human-only입니다.
- `recipe`는 요구사항과 acceptance를 확정합니다.
- `cook`은 approved recipe 전체 구현을 지휘합니다.
- `taste`는 recipe 기준 review verdict와 loop recommendation을 냅니다.
- release, deploy, push, payment, auth, data-loss 가능 작업은 human gate가 필요합니다.
- `.agent/commands.json`의 `verify` command가 release gate입니다.
- `.agent/spec/INDEX.md`, handoff index, ADR index는 librarian generated입니다.
- agent는 관련 없는 사용자 변경을 보호하고 자동 push/deploy를 하지 않습니다.

## Preview

파일을 쓰기 전에 preview를 보여주고 승인을 받습니다.

- 제품 요약: 어떤 서비스를 만들려는지, 누구를 위한지, 첫 버전 범위가 무엇인지.
- 도메인 요약: 중요한 용어, 역할, 상태, 오해하면 안 되는 규칙이 무엇인지.
- 기술 요약: 현재 프로젝트 구조를 어떻게 이해했고, 어떤 실행/검증 흐름으로 볼 것인지.
- setup 요약: 작업 규칙 안내, 프로젝트 이해 메모, 실행/검증 설정, 안전장치, 첫 점검용 예제 작업 중 무엇을 만들지.
- 기존 서비스 도입이면 보존할 파일과 변경할 파일을 분리합니다.

preview를 사용자에게 설명할 때는 category 중심으로 먼저 보여주고, 실제 파일 경로는 필요할 때만 덧붙입니다.

preview도 대화형으로 진행합니다.

- “제가 이해한 제품 방향”
- “그래서 이렇게 세팅하려는 이유”
- “이번 라운드에서 실제로 준비할 것”
- “아직 열어둬야 하는 우려사항”

사용자가 우려를 말하면 방어적으로 대응하지 않고, 해당 우려를 제품/운영 리스크로 번역한 뒤 설정안에 어떻게 반영할지 다시 제안합니다.

사용자가 제품 설명을 수정하고 싶다면 해당 제품 질문만 다시 묻습니다. 운영 원칙 예외는 `patch` 또는 `harness` flow로 안내합니다.

## Scaffold

승인 후 다음을 생성하거나 보강합니다.

| Target | 정책 |
| --- | --- |
| `AGENTS.md` | 필수. 기존 파일은 preview와 승인 없이 덮어쓰지 않습니다. |
| `.agent/constitution.md` | fresh/reset에서 생성. 이후 human-only. |
| `.agent/spec/prd.md` | 제품 답변 기반 create only. |
| `.agent/spec/design.md` | repo 감지와 command profile 기반의 arc42 + C4 hybrid architecture seed. preset defaults와 Mermaid skeleton 포함. |
| `.agent/commands.json` | stable key 유지: setup/build/test/e2e/lint/verify/dev. |
| `.agent/wiki/domain.md` | 유비쿼터스 용어집 source of truth. preset의 glossary depth와 tone을 출발점으로 삼습니다. |
| `.agent/wiki/design-system.md` | `web-app` 또는 명시적 UI 프로젝트일 때만 생성. backend/cli/library preset에는 기본 포함하지 않습니다. |
| `.agent/spec/active/0001-health-check.md` | harness rehearsal용 create only. |
| `.agent/autopilot/state.json`, `.agent/autopilot/progress.md` | autopilot runner state seed. Source of truth는 active spec task checkbox입니다. |
| `.agent/runbooks/*` | verification/debugging/deployment seed. |
| `.agent/memory/*`, indexes | create only. librarian이 이후 관리. |
| `.hooks/*` | create only. 차단성 hook은 승인 후 활성화. |
| `CLAUDE.md` | `AGENTS.md` symlink 우선, 실패 시 generated copy. |

필요한 directory도 함께 만듭니다: `.agent/spec/{active,done,archived,abandoned,handoffs}`, `.agent/autopilot`, `.agent/wiki/decisions`, `.agent/memory/{topics,handoffs}`, `.agent/runbooks`.

## 완료 기준

- `AGENTS.md`, `.agent/constitution.md`, `.agent/spec/prd.md`, `.agent/spec/design.md`가 있습니다.
- `.agent/commands.json`이 valid JSON이고 stable key를 모두 포함합니다.
- `.agent/wiki/domain.md`, `.agent/memory/gotchas.md`, health-check spec, runbooks가 있습니다.
- `.agent/autopilot/state.json`과 `.agent/autopilot/progress.md`가 있습니다.
- `.agent/spec/design.md`는 Introduction/Goals, Constraints, Context/Scope, Solution Strategy, Building Blocks, Runtime Scenarios, Deployment/Operational Notes, Cross-cutting Concepts, Decisions, Quality, Risks/Tech Debt, Glossary를 포함하고, 선택된 preset과 핵심 기본값을 기록합니다.
- `.agent/spec/design.md`는 source of truth로서 구현 전에 먼저 읽혀야 하고, 기본 원칙으로 Hexagonal architecture와 TDD를 강조합니다.
- `.agent/wiki/domain.md`는 선택된 preset, glossary depth, role/state style, domain tone을 기록합니다.
- UI/frontend 프로젝트이면 design-system seed가 있거나 생성하지 않은 이유가 명확합니다. 생성 시 foundations, token hierarchy, focus visible을 포함한 state/accessibility rule, composition pattern, governance가 보입니다. backend/cli/library preset은 기본적으로 design-system을 포함하지 않습니다.
- `.hooks/pre-commit.sh`와 `CLAUDE.md` 처리 결과가 보고됩니다.
- 생성/skip한 항목은 사용자 친화적인 category 이름으로 먼저 보고하고, 필요하면 실제 파일 목록을 덧붙입니다.
- command profile은 “이 프로젝트에서 실행/검증에 쓸 명령 정리”로 설명하고, release blocked 여부는 이유와 다음 단계까지 함께 안내합니다.
- 마지막에 “프로젝트 초기 구성이 끝났습니다. 레시피를 작성해볼까요?”라고 안내합니다.

`verify` command가 `null`이면 kitchen 완료는 가능하지만 release 상태는 blocked로 보고합니다.

## Git 의례

- 시작 시 현재 branch와 dirty file을 보고합니다.
- fresh 실행 시 `feat/0001-health-check` branch를 제안합니다.
- 종료 시 제품 요약, 적용한 기본 운영 원칙, command profile, `git diff --stat`을 보여줍니다.
- 추천 commit:

```text
chore: initialize vibe-recipe kitchen

Refs: .agent/spec/active/0001-health-check.md
```
