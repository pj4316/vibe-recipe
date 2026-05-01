---
name: kitchen
description: /vr:kitchen 또는 /vr:init 호출 시 사용합니다. 설치 후 첫 실행 wizard로 사용자가 만들 제품만 묻고, vibe-recipe 기본 운영 원칙으로 AGENTS.md, constitution, design.md, commands profile, hooks, health-check spec을 생성해 바로 recipe -> cook 개발이 가능하게 합니다.
---

# kitchen (init) - 주방 차리기

`kitchen`은 vibe-recipe 설치 후 첫 실행하는 제품 중심 온보딩 skill입니다. 사용자는 운영 원칙을 설계하지 않습니다. 사용자는 “무엇을 만들고 싶은지”만 설명하고, 나머지 workflow 원칙과 안전장치는 플러그인이 강한 기본값으로 자동 적용합니다.

`kitchen` 완료 후 target repo는 사용자가 harness를 크게 만지지 않아도 바로 `recipe/plan`으로 spec을 만들고 `cook/dev`로 구현할 수 있어야 합니다. 이후 `.agent/`, `.hooks/`, command profile, generated agent instructions 같은 주방기구를 보수하거나 개선하고 싶을 때도 `kitchen`을 다시 사용합니다.

초기 구성이 끝나면 사용자에게 “프로젝트 초기 구성이 끝났습니다. 레시피를 작성해볼까요?”라고 안내하고, 다음 단계로 `recipe/plan`에서 첫 기능 spec을 만든 뒤 `cook/dev`로 구현하는 흐름을 제안합니다.

필수 생성 문서:

- `AGENTS.md`: vibe-recipe 기본 workflow, skill 순서, 문서 권한, git/review/release 규칙.
- `.agent/constitution.md`: 플러그인이 고정하는 불가침 원칙, human gate, safety rule.
- `.agent/spec/design.md`: repo 감지 결과, architecture 추론, command profile, verification strategy.
- `.agent/wiki/design-system.md`: frontend/UI 프로젝트일 때만 생성하는 UI seed.
- `.agent/memory/gotchas.md`: agent가 반복해서 놓치면 안 되는 주의사항의 누적 기록.

제품별 정보는 위 문서에 필요한 만큼만 반영합니다. 생성 문서 언어는 사용자의 호출 언어를 따릅니다.

## Kitchen resources

핵심 문서 템플릿은 이 skill 내부의 `resources/` 폴더에 보관합니다.

- `resources/AGENTS.md`
- `resources/constitution.md`
- `resources/design.md`
- `resources/design-system.md`
- `resources/commands.json`
- `resources/health-check.md`
- `resources/runbook-verification.md`
- `resources/runbook-debugging.md`
- `resources/runbook-deployment.md`

각 resource는 250줄을 넘지 않아야 합니다. `kitchen`은 이 resource를 그대로 복사하지 않고, 제품 답변과 repo 감지 결과를 채워 프로젝트별 문서를 생성합니다.

## 사용자가 집중할 것

사용자에게 묻는 내용은 제품 정의에 한정합니다.

- 무엇을 만들고 싶은가.
- 누구를 위한 제품인가.
- 첫 버전에서 꼭 동작해야 하는 것은 무엇인가.
- 지금 만들지 않을 것은 무엇인가.
- 성공했다고 볼 기준은 무엇인가.
- 제품 안에서 중요한 용어, 역할, 상태는 무엇인가.
- UI가 있다면 원하는 느낌은 무엇인가.

다음은 사용자에게 묻지 않습니다. 모두 vibe-recipe 기본값으로 적용합니다.

- spec-first를 쓸지 여부.
- constitution을 누가 수정할지.
- review에 security/red-team을 포함할지.
- INDEX를 누가 관리할지.
- release/deploy/push를 자동화할지.
- destructive/auth/payment/data-loss 변경에 human gate를 둘지.

## vibe-recipe 기본 운영 원칙

`kitchen`은 모든 프로젝트에 다음 기본값을 적용합니다.

- 모든 의미 있는 변경은 numbered spec에서 시작합니다.
- `.agent/constitution.md`는 초기화 이후 human-only입니다.
- release, deploy, push, payment, auth, data-loss 가능성이 있는 작업은 human gate가 필요합니다.
- `taste`는 security-auditor와 red-team review를 포함합니다.
- `.agent/commands.json`의 `verify` command가 release gate입니다.
- agent는 작업 시작 시 `AGENTS.md`와 `.agent/constitution.md`, `.agent/spec/prd.md`, `.agent/spec/design.md`, `.agent/commands.json`을 읽고 해당 contract를 준수합니다.
- `.agent/spec/INDEX.md`, handoff index, ADR index는 librarian generated입니다.
- agent는 관련 없는 사용자 변경을 보호하고 자동 push/deploy를 하지 않습니다.
- release 전에는 active spec 정리, project verify green, latest taste APPROVE, BLOCKER/critical audit 없음, changelog/version 준비, clean working tree, human approval이 필요합니다.
- 예외 조정과 harness 개선은 첫 제품 질문이 아니라 나중의 `kitchen` heal/patch/harness flow에서 다룹니다.

## Mode

파일을 쓰기 전에 mode를 판정합니다.

| Mode | Trigger | Behavior |
| --- | --- | --- |
| `fresh` | `.agent/constitution.md`가 없음 | 제품 중심 AskQuestion을 실행하고 기본 운영 모델로 scaffold를 생성합니다. |
| `abort` | `.agent/constitution.md`가 있고 별도 요청이 없음 | 현재 셋업 요약만 보여주고 쓰지 않습니다. |
| `heal` | 누락 파일 복구 요청 | 누락 scaffold만 복구합니다. 기존 사용자 작성 파일은 덮어쓰지 않습니다. |
| `patch <file>` | 특정 생성 파일 갱신 요청 | 해당 파일만 제품 정보 또는 운영 모델 기준으로 재생성합니다. |
| `harness` | command profile, hooks, `.agent/` 구조, generated agent instructions 개선 요청 | 제품 scope는 유지하고 주방기구만 점검/개선합니다. 기존 사용자 파일은 preview와 승인 없이 덮어쓰지 않습니다. |
| `reset` | 명시적 reset 요청 | clean tree, backup, double confirm 후 fresh를 다시 실행합니다. |

mode가 애매하면 기존 harness가 있을 때는 `abort`, 없을 때는 `fresh`입니다.

## AskQuestion 고정 포맷

사용자에게 묻는 질문은 아래 필드를 갖는 블록으로 정의합니다.

```yaml
id: stable_snake_case_id
question: 사용자에게 보여줄 제품 중심 질문
choices:
  - label: 선택지 이름
    meaning: 이 선택이 제품 정의에 주는 의미
recommended: 추천 선택지 label
unknown_option: 잘 모르겠어요, 추천해주세요
writes_to:
  - .agent/spec/prd.md
  - .agent/spec/design.md
  - AGENTS.md
default_if_unknown:
  choice: 추천 선택지 label
  reason: 추천 이유
```

규칙:

- 질문은 제품 정의, MVP, 도메인, UI 취향에 한정합니다.
- 모든 객관식 질문은 `unknown_option`을 포함합니다.
- 자유 입력이 필요한 질문은 짧은 예시를 제공합니다.
- phase가 끝날 때마다 “이 답변으로 제품 문맥이 어디에 반영되는지”만 요약합니다.
- 운영 원칙을 사용자가 고르게 하지 않습니다.

## Phase 0 - Repo 감지

질문 전에 조용히 repo 사실을 수집합니다.

- `git status --short`
- stack 후보: `package.json`, `pyproject.toml`, `requirements.txt`, `Cargo.toml`, `go.mod`, `Gemfile`
- package manager 후보: `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`
- frontend/backend hint: `src/`, `app/`, `pages/`, `frontend/`, `backend/`, API route, server dependency
- command 후보: package scripts, cargo/go/python test tool presence
- 기존 agent 파일: `AGENTS.md`, `CLAUDE.md`, `.agent/`, `.hooks/`

감지 결과는 사용자에게 선택지를 늘리기 위한 것이 아니라 `design.md`와 `.agent/commands.json`을 자동 작성하기 위한 근거입니다.

## Phase 1 - 제품 브리프

목표: 사용자가 만들 제품을 한 문맥으로 고정합니다.

```yaml
id: product_kind
question: 어떤 제품을 만들고 싶나요?
choices:
  - label: 웹앱/웹사이트
    meaning: 브라우저에서 쓰는 UI 중심 제품
  - label: API/백엔드
    meaning: API, 서버, worker 중심 제품
  - label: 자동화 도구
    meaning: 반복 작업을 줄이는 script, CLI, internal tool
  - label: 데이터/분석 도구
    meaning: 데이터 수집, 처리, 리포트, dashboard
  - label: 기타
    meaning: 한 문장으로 직접 설명
recommended: repo 감지 결과와 가장 가까운 선택지
unknown_option: 잘 모르겠어요, 추천해주세요
writes_to:
  - .agent/spec/prd.md
  - .agent/spec/design.md
  - AGENTS.md
default_if_unknown:
  choice: repo 감지 결과와 가장 가까운 선택지
  reason: 현재 repo 구조와 dependency를 기준으로 제품 형태를 추정합니다.
```

```yaml
id: product_pitch
question: 이 제품이 해줬으면 하는 일을 한 문장으로 말해주세요.
choices:
  - label: 자유 입력
    meaning: 예: "팀원이 회의록을 업로드하면 액션아이템을 자동 정리하는 웹앱"
recommended: 자유 입력
unknown_option: 잘 모르겠어요, 예시를 바탕으로 같이 정해주세요
writes_to:
  - .agent/spec/prd.md
  - .agent/constitution.md
  - AGENTS.md
default_if_unknown:
  choice: 자유 입력
  reason: 제품 목적은 사용자가 가장 잘 알고 있으므로 짧은 초안이라도 받아야 합니다.
```

```yaml
id: primary_user
question: 가장 먼저 만족시켜야 할 사용자는 누구인가요?
choices:
  - label: 나 자신
    meaning: 개인 workflow 개선이 목표
  - label: 내부 팀
    meaning: 사내 운영자, 동료, 팀원이 사용
  - label: 외부 고객
    meaning: 제품 사용자나 유료 고객이 사용
  - label: 개발자
    meaning: API, SDK, CLI 사용자
  - label: 기타
    meaning: 직접 설명
recommended: 나 자신
unknown_option: 잘 모르겠어요, 추천해주세요
writes_to:
  - .agent/spec/prd.md
  - .agent/constitution.md
default_if_unknown:
  choice: 나 자신
  reason: 초기 제품은 가장 가까운 사용자를 기준으로 동작을 검증하는 편이 안전합니다.
```

## Phase 2 - MVP와 제외범위

목표: 첫 version에서 동작해야 하는 것과 지금 하지 않을 것을 정합니다.

```yaml
id: mvp_capabilities
question: 첫 버전에서 꼭 동작해야 하는 핵심 기능 3-5개를 적어주세요.
choices:
  - label: 자유 입력
    meaning: bullet list로 작성. 예: "업로드, 자동 요약, 액션아이템 표시"
recommended: 자유 입력
unknown_option: 잘 모르겠어요, 제품 설명 기준으로 초안을 추천해주세요
writes_to:
  - .agent/spec/prd.md
  - .agent/spec/active/0001-health-check.md
default_if_unknown:
  choice: 자유 입력
  reason: product pitch에서 가장 작은 end-to-end 흐름을 뽑아 MVP 초안으로 제안합니다.
```

```yaml
id: anti_scope
question: 이번 첫 버전에서 일부러 만들지 않을 것은 무엇인가요?
choices:
  - label: 자유 입력
    meaning: 예: "결제, 팀 권한 관리, 모바일 앱, 고급 분석"
  - label: 추천 받기
    meaning: agent가 MVP 밖으로 밀어낼 항목을 제안
recommended: 추천 받기
unknown_option: 잘 모르겠어요, 추천해주세요
writes_to:
  - .agent/spec/prd.md
  - AGENTS.md
default_if_unknown:
  choice: 추천 받기
  reason: 초기에 scope가 커지는 것을 막기 위해 명시적 anti-scope를 둡니다.
```

```yaml
id: success_metric
question: 이 제품이 성공적으로 동작한다고 볼 기준은 무엇인가요?
choices:
  - label: 사용자가 작업을 완료함
    meaning: 핵심 workflow가 끝까지 완료되는지
  - label: 시간 절약
    meaning: 기존 수동 작업보다 빠른지
  - label: 정확도/품질
    meaning: 결과 품질이 기준을 넘는지
  - label: 직접 입력
    meaning: 제품에 맞는 성공 기준을 직접 설명
recommended: 사용자가 작업을 완료함
unknown_option: 잘 모르겠어요, 추천해주세요
writes_to:
  - .agent/spec/prd.md
  - .agent/constitution.md
default_if_unknown:
  choice: 사용자가 작업을 완료함
  reason: 첫 버전에서는 end-to-end 동작이 가장 중요한 성공 기준입니다.
```

## Phase 3 - 도메인 언어

목표: agent가 제품 용어를 임의로 해석하지 않게 합니다.

```yaml
id: domain_terms
question: 이 제품에서 중요한 용어, 역할, 상태가 있나요?
choices:
  - label: 자유 입력
    meaning: 예: "관리자, 멤버, 초안, 승인됨, 보관됨"
  - label: 아직 없음
    meaning: 제품 구현 중 발견하면 domain 문서에 추가
recommended: 아직 없음
unknown_option: 잘 모르겠어요, 추천해주세요
writes_to:
  - .agent/wiki/domain.md
  - .agent/spec/prd.md
default_if_unknown:
  choice: 아직 없음
  reason: 불명확한 용어를 agent가 지어내지 않도록 비워두고 발견 시 추가합니다.
```

```yaml
id: dangerous_assumptions
question: agent가 오해하면 안 되는 중요한 규칙이 있나요?
choices:
  - label: 자유 입력
    meaning: 예: "삭제는 실제 삭제가 아니라 보관 처리", "환불은 관리자만 가능"
  - label: 아직 없음
    meaning: 기본 safety gate만 적용
recommended: 아직 없음
unknown_option: 잘 모르겠어요, 추천해주세요
writes_to:
  - .agent/wiki/domain.md
  - .agent/constitution.md
default_if_unknown:
  choice: 아직 없음
  reason: 확인되지 않은 business rule을 agent가 임의로 만들지 않습니다.
```

## Phase 4 - UI 취향

frontend가 감지되었거나 제품이 UI 중심일 때만 가볍게 묻습니다. 세부 design system은 첫 UI 이후 `plate`가 다룹니다.

```yaml
id: ui_reference
question: UI 느낌은 어디에 가까우면 좋을까요?
choices:
  - label: 업무용 SaaS
    meaning: 조용하고 밀도 높은 dashboard/work tool
  - label: 문서/노트형
    meaning: 읽기 쉽고 차분한 문서 중심 UI
  - label: 마케팅/브랜드형
    meaning: 첫 화면에서 제품 가치가 강하게 드러나는 UI
  - label: 잘 모르겠음
    meaning: 제품 종류에 맞춰 추천
recommended: 업무용 SaaS
unknown_option: 잘 모르겠어요, 추천해주세요
writes_to:
  - .agent/wiki/design-system.md
  - .agent/spec/design.md
default_if_unknown:
  choice: 업무용 SaaS
  reason: agent-built app은 반복 사용과 정보 탐색이 편한 기본 UI가 안전합니다.
```

```yaml
id: ui_mode_density
question: 화면 밀도와 색상 모드는 어떻게 할까요?
choices:
  - label: comfortable + system
    meaning: 기본 밀도, OS light/dark 설정 따름
  - label: compact + light
    meaning: 정보량이 많은 밝은 UI
  - label: spacious + system
    meaning: 여백이 넓고 OS 설정 따름
  - label: 직접 입력
    meaning: density, mode, brand color를 직접 설명
recommended: comfortable + system
unknown_option: 잘 모르겠어요, 추천해주세요
writes_to:
  - .agent/wiki/design-system.md
default_if_unknown:
  choice: comfortable + system
  reason: 접근성과 유지보수성이 가장 안정적인 기본값입니다.
```

UI/frontend 프로젝트가 아니면 `.agent/wiki/design-system.md`는 생성하지 않습니다. UI가 나중에 생기면 `plate` 또는 `patch .agent/wiki/design-system.md` 흐름에서 생성합니다.

## Phase 5 - Preview와 승인

파일을 쓰기 전에 preview를 보여줍니다.

Preview에는 다음이 포함되어야 합니다.

- 제품 요약: pitch, primary user, MVP, anti-scope, success metric.
- domain 요약: 용어, 역할, 상태, dangerous assumptions.
- 기술 요약: 감지된 stack, architecture 추론, command profile.
- vibe-recipe 기본 운영 원칙: spec-first, human gate, security+red-team review, constitution human-only, librarian generated indexes.
- AGENTS.md 구조: Project Directory Map, Recipe Routing, Gotchas, Required Before Release 포함 여부.
- 생성/skip할 file list.

사용자가 제품 설명을 수정하고 싶다면 해당 제품 phase만 다시 묻습니다. 운영 원칙 예외는 이 wizard에서 묻지 않고 customization/patch flow로 안내합니다.

## 문서 생성 모델

### `.agent/constitution.md`

제품 답변은 최소한만 반영하고, 대부분은 vibe-recipe 기본 운영 원칙으로 생성합니다.

반드시 포함:

- 생성일과 “human-only after initialization”.
- Product intent: pitch, primary user, success metric.
- Default operating principles: spec-first, reversible changes, command contract.
- Safety gates: release/deploy/push/payment/auth/data-loss human gate.
- Review defaults: taste includes security-auditor and red-team.
- Recommended defaults applied.

### `.agent/spec/design.md`

repo 감지와 command profile 중심으로 생성합니다.

반드시 포함:

- Product context summary.
- Stack and package manager detection.
- Architecture inference.
- Frontend/backend/data/integration assumptions.
- `.agent/commands.json` summary.
- Verification strategy and release block if `verify` is `null`.
- Known product constraints from MVP/anti-scope.

### `AGENTS.md`

플러그인 기본 workflow를 자동 생성하고 제품별 context만 추가합니다.

반드시 포함:

- Project context: product pitch, primary user, MVP/anti-scope.
- `.agent` contract: 작업 시작 시 constitution, PRD, design, commands를 읽고 준수하는 규칙.
- vibe-recipe workflow: kitchen -> recipe -> cook -> taste -> wrap -> serve.
- next step guidance: kitchen 완료 후 `recipe/plan`으로 첫 recipe를 작성하고 `cook/dev`로 구현하도록 안내.
- Project Directory Map.
- Recipe Routing.
- Document authority table.
- Gotchas 요약 규칙과 `.agent/memory/gotchas.md` 링크.
- Spec-first policy.
- Command contract.
- Git policy with `Refs:` footer.
- Review policy with security+red-team.
- Release policy with human gates.
- Required Before Release checklist.

### `.agent/wiki/design-system.md`

frontend/UI 프로젝트일 때만 생성합니다.

반드시 포함:

- Product UI intent.
- Reference and density.
- Mode and accessibility.
- Tokens.
- Component primitives.
- Composition rules.
- Anti-patterns.
- Plate follow-up instructions.

## Scaffold 생성

AskQuestion 승인 후 다음을 생성합니다.

| Source 또는 생성 방식 | Target | 정책 |
| --- | --- | --- |
| 제품 답변 + 기본 운영 모델 | `AGENTS.md` | 필수. 기존 파일은 덮어쓰기 전 preview 필요. |
| 제품 답변 + 기본 운영 모델 | `.agent/constitution.md` | 필수. fresh/reset에서만 생성. 이후 human-only. |
| 제품 답변 + repo 감지 결과 | `.agent/spec/design.md` | 필수. |
| `resources/commands.json` + command detection | `.agent/commands.json` | 필수. stable key 유지. |
| 제품 답변 | `.agent/spec/prd.md` | create only. |
| repo 감지 또는 fallback | `.agent/wiki/architecture.md` | create only. |
| 제품 답변 | `.agent/wiki/domain.md` | create only. |
| UI 답변 또는 fallback | `.agent/wiki/design-system.md` | frontend/UI 프로젝트일 때만 create only. UI가 아니면 생성하지 않음. |
| fallback | `.agent/memory/gotchas.md` | create only. AGENTS.md에는 요약만 둠. |
| `resources/health-check.md` | `.agent/spec/active/0001-health-check.md` | create only. |
| generated/fallback | `.agent/spec/INDEX.md`, handoff/ADR indexes | create only, librarian regenerates later. |
| `resources/runbook-verification.md` | `.agent/runbooks/verification.md` | create only. |
| `resources/runbook-debugging.md` | `.agent/runbooks/debugging.md` | create only. |
| `resources/runbook-deployment.md` | `.agent/runbooks/deployment.md` | create only. |
| plugin hooks | `.hooks/*` | create only, executable bit 보존. |
| symlink/copy | `CLAUDE.md` | `AGENTS.md` symlink 우선, 실패 시 generated copy. |

필요한 directory도 함께 만듭니다: `.agent/spec/{active,done,archived,abandoned,handoffs}`, `.agent/wiki/decisions`, `.agent/memory/{topics,handoffs}`, `.agent/runbooks`.

Core document source:

- `AGENTS.md`는 `resources/AGENTS.md`를 기반으로 생성합니다.
- `.agent/constitution.md`는 `resources/constitution.md`를 기반으로 생성합니다.
- `.agent/spec/design.md`는 `resources/design.md`를 기반으로 생성합니다.
- `.agent/wiki/design-system.md`는 frontend/UI 프로젝트일 때 `resources/design-system.md`를 기반으로 생성합니다.
- `.agent/commands.json`, health-check spec, runbook seed는 depth 1 `resources/` 파일을 기반으로 target path에 생성합니다.

## 완료 기준

다음이 모두 만족되어야 완료입니다.

- `AGENTS.md`가 생성됨.
- `.agent/constitution.md`가 생성됨.
- `.agent/spec/design.md`가 생성됨.
- `.agent/commands.json`이 valid JSON이고 stable key를 모두 포함함.
- `.agent/spec/prd.md`가 제품 답변을 반영함.
- frontend/UI 프로젝트이면 `.agent/wiki/design-system.md`가 생성됨.
- `.agent/memory/gotchas.md`가 생성됨.
- `.agent/spec/active/0001-health-check.md`가 생성됨.
- `.hooks/pre-commit.sh`가 설치됨.
- `CLAUDE.md`가 symlink 또는 generated copy로 존재함.

`verify` command가 `null`이면 완료는 가능하지만 release 상태는 blocked로 보고합니다.

## Git 의례

시작:

- 현재 branch와 dirty file을 보고합니다.
- fresh 실행 시 `feat/0001-health-check` branch를 제안합니다.

종료:

- 제품 답변 요약을 보여줍니다.
- 적용한 vibe-recipe 기본 운영 원칙을 보여줍니다.
- AGENTS.md의 Project Directory Map, Recipe Routing, Gotchas, Required Before Release 요약을 보여줍니다.
- `.agent/commands.json` command profile을 보여줍니다.
- “프로젝트 초기 구성이 끝났습니다. 레시피를 작성해볼까요?”라고 말하고, 다음 개발 단계가 `recipe/plan`이며 이후 `cook/dev`로 구현한다고 안내합니다.
- harness 개선은 다시 `kitchen`으로 처리한다고 안내합니다.
- 생성/skip한 파일 목록과 `git diff --stat`을 보여줍니다.
- 추천 commit:

```text
docs(spec): initialize vibe-recipe kitchen

Refs: .agent/spec/active/0001-health-check.md
```

자동 push는 하지 않습니다.
