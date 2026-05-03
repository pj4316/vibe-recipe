---
name: kitchen
description: /vr:kitchen 또는 /vr:init 호출 시 사용합니다. 새 프로젝트 또는 기존 서비스에 vibe-recipe orchestration harness를 설치/도입/복구합니다. AGENTS.md, hooks, .agent, command profile을 구성해 recipe -> cook -> taste workflow가 재현 가능하게 동작해야 할 때 사용합니다.
---

# kitchen (init) - 주방 차리기

`kitchen`은 vibe-recipe orchestration harness를 구축하는 skill입니다. 새 프로젝트에는 기본 harness를 설치하고, 기존 서비스에는 현재 구조와 명령을 존중하며 비침투적으로 도입합니다.

orchestration harness는 세 층입니다.

- `AGENTS.md`: skill 라우팅, 역할 경계, parent/orchestrator agent 책임, human gate.
- hooks: constitution 수정, push/deploy/release, secret, release gate처럼 결정적으로 검사 가능한 안전장치.
- `.agent/`: spec, command profile, runbook, domain language, memory, handoff.

`.agent/commands.json`은 스킬 정의 파일이 아닙니다. target project의 native command profile이며 `cook`, `taste`, `serve`가 어떤 setup/build/test/e2e/lint/verify/dev 명령을 실행할지 판단하는 기준입니다.

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

세부 동작 문서는 `plugins/vibe-recipe/docs/skills/KITCHEN.md`를 따릅니다.

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

`grill/align`의 `Alignment Brief`가 있으면 제품 답변 초안으로 사용합니다. 운영 원칙은 묻지 않고 vibe-recipe 기본값으로 적용합니다.

## Adopt 규칙

기존 서비스에 도입할 때는 기존 운영 방식을 덮지 않는 것을 우선합니다.

- 기존 README, docs, ADR, runbook, CI workflow를 읽습니다.
- 기존 명령을 `.agent/commands.json` stable key로 매핑합니다.
- 기존 architecture와 module boundary를 `.agent/spec/design.md` seed로 요약합니다.
- 기존 제품 용어를 `.agent/wiki/domain.md` 초안으로 추출합니다.
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

- 제품 요약: pitch, primary user, MVP, anti-scope, success metric.
- domain 요약: 용어, 역할, 상태, dangerous assumptions.
- 기술 요약: 감지된 stack, architecture 추론, command profile.
- harness 요약: 생성/skip할 파일, AGENTS 구조, hooks, human gate.
- 기존 서비스 도입이면 보존할 파일과 변경할 파일을 분리합니다.

사용자가 제품 설명을 수정하고 싶다면 해당 제품 질문만 다시 묻습니다. 운영 원칙 예외는 `patch` 또는 `harness` flow로 안내합니다.

## Scaffold

승인 후 다음을 생성하거나 보강합니다.

| Target | 정책 |
| --- | --- |
| `AGENTS.md` | 필수. 기존 파일은 preview와 승인 없이 덮어쓰지 않습니다. |
| `.agent/constitution.md` | fresh/reset에서 생성. 이후 human-only. |
| `.agent/spec/prd.md` | 제품 답변 기반 create only. |
| `.agent/spec/design.md` | repo 감지와 command profile 기반. |
| `.agent/commands.json` | stable key 유지: setup/build/test/e2e/lint/verify/dev. |
| `.agent/wiki/domain.md` | 유비쿼터스 용어집 source of truth. |
| `.agent/wiki/design-system.md` | frontend/UI 프로젝트일 때만 생성. |
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
- UI/frontend 프로젝트이면 design-system seed가 있거나 생성하지 않은 이유가 명확합니다.
- `.hooks/pre-commit.sh`와 `CLAUDE.md` 처리 결과가 보고됩니다.
- 생성/skip한 파일 목록, command profile, release blocked 여부를 사용자에게 보고합니다.
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
