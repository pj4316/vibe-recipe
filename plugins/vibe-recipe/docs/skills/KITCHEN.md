# Kitchen 동작 문서

`kitchen`은 vibe-recipe orchestration harness를 target project에 설치하거나 기존 서비스에 도입할 때 실행하는 초기화 skill입니다. 사용자는 제품에 대한 질문에만 답하고, spec-first workflow, 문서 권한, human gate, review/release gate 같은 harness 규칙은 vibe-recipe 기본값으로 적용합니다.

orchestration harness는 `AGENTS.md`, hooks, `.agent/`로 구성됩니다.

- `AGENTS.md`: skill 라우팅, 역할 경계, parent/orchestrator agent 책임, human gate를 정의합니다.
- hooks: constitution 수정, push/deploy/release, secret, release gate처럼 결정적으로 검사 가능한 안전장치를 강제합니다.
- `.agent/`: spec, command profile, runbook, domain language, memory, handoff를 저장합니다.

`.agent/commands.json`은 각 skill이나 기능을 정의하는 파일이 아닙니다. target project의 native command profile이며 `cook`, `taste`, `serve`가 어떤 test/build/e2e/verify/dev 명령을 실행할지 판단하는 기준입니다.

초기화가 끝나면 target project는 별도 harness 작업 없이 바로 `recipe/plan`으로 첫 spec을 만들고 `cook/dev`로 구현을 시작할 수 있어야 합니다.

같은 대화에 제품 brief나 이전 alignment 메모가 있으면 `kitchen`은 이를 제품 답변 초안으로 사용합니다. 별도 brief가 없어도 빠른 `/vr:kitchen` 초기화 흐름은 그대로 진행합니다.

## 목표

- target project 루트에 에이전트가 매 세션 읽을 `AGENTS.md`를 생성합니다.
- `.agent/` 아래에 제품 문맥, 기술 설계, command profile, memory, spec, runbook seed를 구성합니다.
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
- 기존 architecture와 module boundary를 `.agent/spec/design.md` seed로 요약합니다.
- 기존 제품 용어를 `.agent/wiki/domain.md` 초안으로 추출합니다.
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

질문은 한 번에 하나씩 진행하고, 각 질문에는 추천 답변과 추천 이유를 함께 제시합니다. `Alignment Brief`가 있으면 `Goal`, `Audience`, `MVP`, `Non-goals`, `Success criteria`, `Domain terms`, `Assumptions`를 각각 product pitch, primary user, MVP, anti-scope, success metric, domain seed, dangerous assumptions 초안으로 매핑합니다.

다음은 사용자에게 묻지 않고 기본값으로 적용합니다.

- spec-first를 사용할지 여부.
- constitution을 누가 수정할지.
- review에 security/red-team을 포함할지.
- release/deploy/push를 자동화할지.
- auth/payment/data-loss 작업에 human gate를 둘지.

## 생성 파일

| Resource | Target | 설명 |
| --- | --- | --- |
| `resources/AGENTS.md` | `AGENTS.md` | 에이전트 운영 계약과 `.agent` 준수 규칙 |
| `resources/constitution.md` | `.agent/constitution.md` | 초기화 이후 human-only인 프로젝트 헌장 |
| `resources/design.md` | `.agent/spec/design.md` | 저장소 감지 결과와 기술 설계 seed |
| `resources/domain.md` | `.agent/wiki/domain.md` | 유비쿼터스 용어집 seed |
| `resources/design-system.md` | `.agent/wiki/design-system.md` | UI 프로젝트일 때만 생성하는 design system seed |
| `resources/commands.json` | `.agent/commands.json` | stable command profile |
| `resources/health-check.md` | `.agent/spec/active/0001-health-check.md` | harness rehearsal용 첫 spec |
| `resources/runbook-verification.md` | `.agent/runbooks/verification.md` | 검증 절차 |
| `resources/runbook-debugging.md` | `.agent/runbooks/debugging.md` | 디버깅 절차 |
| `resources/runbook-deployment.md` | `.agent/runbooks/deployment.md` | 배포 전 점검 절차 |

추가로 `.agent/spec/{active,done,archived,abandoned,handoffs}`, `.agent/wiki/decisions`, `.agent/memory/{topics,handoffs}`, `.agent/runbooks` 디렉터리를 준비합니다. `CLAUDE.md`는 `AGENTS.md` symlink를 우선하고, 실패하면 generated copy로 둡니다.

## 생성된 AGENTS.md 계약

생성된 `AGENTS.md`는 에이전트에게 다음을 요구합니다.

- 작업 시작 시 `.agent/constitution.md`, `.agent/spec/prd.md`, `.agent/spec/design.md`, `.agent/commands.json`, `.agent/memory/gotchas.md`를 먼저 읽습니다.
- 사용자 질문, spec, handoff, review, 코드 설명은 `.agent/wiki/domain.md`의 용어를 기준으로 맞춥니다.
- 기능 개발은 `recipe/plan`으로 numbered spec을 만든 뒤 `cook/dev`로 구현합니다.
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
- UI/frontend 프로젝트이면 `.agent/wiki/design-system.md`가 생성됩니다.
- 생성/skip한 파일 목록과 command profile을 사용자에게 보고합니다.
- 마지막 안내로 “프로젝트 초기 구성이 끝났습니다. 레시피를 작성해볼까요?”를 보여줍니다.

`verify` command가 `null`이면 kitchen 완료는 가능하지만 release 상태는 blocked로 보고합니다.

## 검증 포인트

`kitchen` 변경을 커밋하기 전에는 다음을 확인합니다.

```bash
test -f plugins/vibe-recipe/skills/kitchen/resources/AGENTS.md
test -f plugins/vibe-recipe/skills/kitchen/resources/commands.json
python3 -m json.tool plugins/vibe-recipe/skills/kitchen/resources/commands.json >/dev/null
plugins/vibe-recipe/scripts/build-universal-agents-md.sh /tmp/vibe-recipe-AGENTS.md
grep -q 'kitchen' /tmp/vibe-recipe-AGENTS.md
grep -q 'recipe' /tmp/vibe-recipe-AGENTS.md
```

hooks나 install script까지 함께 바꿨다면 관련 shell 파일에 `bash -n`을 실행합니다.
