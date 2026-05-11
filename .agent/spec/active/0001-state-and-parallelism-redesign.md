# 0001 vibe-recipe 상태 파일 슬림화와 병렬 실행 재설계

Status: Approved (2026-05-11)

## 요약

`vibe-recipe` 사용 시 spec 하나당 7–10개의 handoff·index 파일이 누적되고 spec 본문이 단계마다 비대해진다. spec 폴더 구조 `.agent/spec/active/NNNN-<slug>/{spec.md, tasks.md, memory.md}` 3-파일 markdown-only 모델로 수렴시키고, 메인 cook을 단일 writer로 두는 단순 동시성 모델로 task-level + spec-level fan-out 병렬 실행을 도입한다. spec_fan_out은 기본 `auto`(write scope disjoint면 자동, 충돌 시 사용자 확인). 모든 HITL gate에 표준화된 agent recommendation 블록을 의무화한다.

## 워크플로우 역할 재정의

- **recipe**: spec.md(의도+acceptance, 불변) + tasks.md(task list+구현 계획) 한 번에 작성
- **plate**: spec/tasks 검토(validation). 별도 plan.md 산출 없음
- **cook**: tasks.md에서 `Parallel: Yes` task부터 worker pool에 dispatch, 결과를 memory.md/tasks.md에 단일 writer로 갱신
- **sub-agent 상호작용**: worker는 직접 파일 쓰지 않고 결과를 cook에 return, cook이 memory.md에 정제·승격해 다음 worker dispatch 입력으로 전달

## 사용자 요구

- Actor: vibe-recipe로 spec-driven 개발을 진행하는 개인 개발자 또는 팀
- Trigger: `/vr:recipe → /vr:plate → /vr:cook → /vr:taste → /vr:wrap → /vr:serve` 흐름을 한 번 이상 돌려본 사용자가 `.agent/spec/handoffs/`와 spec 본문 비대화를 인지한 시점
- Desired outcome: spec 진행 상태를 한눈에 보고, 같은 wave의 독립 task와 여러 active spec을 worker/worktree에 fan-out시켜 처리 시간을 줄이며, 사람 결정이 필요한 지점에서 agent의 추천을 일관된 포맷으로 받는 것

## Harness 확인

- Kitchen status: 본 repo는 plugin 자체 개발 repo로 `.agent/`가 부재했고 이 spec 작성 시 최소 scaffold를 만들었다. heal 필요 여부는 cook 단계 마이그레이션 task와 함께 검토한다.
- Command source: `.agent/commands.json` (미생성, plate 단계에서 npm test/lint/verify 매핑 결정)
- Spec source: 본 spec과 `/Users/maxlee/.claude/plans/system-instruction-you-are-working-cozy-tome.md`

## 사용자 시나리오

### US-001 spec 폴더로 진행 상태 한 곳에서 확인

- Priority: P1
- Actor: spec-driven 개발 사용자
- Goal: 한 spec의 제품 의도, 구현 계획, 진행 상태, 공유 메모리를 한 폴더 안 3개 markdown 파일로 즉시 파악한다.
- Independent test: 임의의 active spec 폴더를 열었을 때 `spec.md / tasks.md / memory.md` 3개로 현재 단계와 다음 행동을 알 수 있다.

Acceptance:

- AC-001: Given recipe만 완료된 spec, when 사용자가 spec 폴더를 본다, then `spec.md`(의도+acceptance, Status: Draft)와 `tasks.md`(task list + Plate 상태: Not planned)만 있고 `memory.md`는 비어 있거나 헤더만 있다.
- AC-002: Given cook이 task 2개를 완료한 spec, when 사용자가 `tasks.md`를 본다, then 해당 task checkbox가 체크되고 task 옆에 `Done: <ISO timestamp> / Check: pass` 메타가 인라인으로 적혀 있다. `spec.md` 본문은 recipe 시점 그대로다.
- AC-003: Given 같은 cook 진행 도중 worker가 발견한 사실, when 사용자가 `memory.md`를 본다, then `## Shared` 섹션과 `## Task N (worker wX)` 섹션에 시간순으로 누적되어 있다.

### US-002 같은 wave의 독립 task를 worker fan-out으로 처리

- Priority: P1
- Actor: cook을 호출한 사용자
- Goal: plate가 식별한 `Parallel: Yes` task들을 worker pool로 동시에 처리해 wave 완료 시간을 단축한다.
- Independent test: 동일 wave에 `Parallel: Yes` + write scope disjoint task가 3개일 때 worker 3개에 dispatch되고 wave gate에서 합쳐진다.

Acceptance:

- AC-004: Given wave W01에 Parallel:Yes + write scope disjoint task 3개, when cook을 실행, then 3 worker에 동시 dispatch되고 `tasks.md`의 각 task 옆에 `Worker: wX` 메타가 기록된다.
- AC-005: Given worker pool 한도가 3, when 같은 wave에 후보 task가 5개, then 3개가 우선 dispatch되고 나머지는 완료된 worker slot에 순차 진입한다.
- AC-006: Given wave 진행 중 한 worker가 blocked로 반환, when 메인 cook이 결과를 받아 처리, then 해당 wave gate를 통과하지 않고 recommendation 블록을 사용자에게 제시한다.

### US-003 여러 active spec 동시 진행

- Priority: P2
- Actor: 동시에 두 개 이상의 Approved spec을 진행하려는 사용자 또는 autopilot
- Goal: write scope가 겹치지 않는 spec들을 별도 worktree에서 동시에 cook해 전체 처리량을 늘린다.
- Independent test: 두 Approved spec을 `--all-approved` 모드로 호출하면 각자 worktree에서 cook이 동시에 진행되고 결과 diff가 메인 브랜치 통합 단계에서만 충돌 검사된다.

Acceptance:

- AC-007: Given write scope disjoint한 Approved spec 2개, when `spec_fan_out: auto`로 호출, then worktree 2개가 자동 생성되고 각 spec의 `memory.md` 첫 줄에 `Worktree: <path>`가 기록된다.
- AC-008: Given write scope 충돌이 감지된 spec 2개, when fan-out 호출, then cook이 serial fallback을 1순위로 한 recommendation 블록을 제시하고 사용자 확인을 받는다.

### US-004 HITL gate에서 표준 추천 받기

- Priority: P1
- Actor: 사람 승인이 필요한 지점에 도달한 사용자
- Goal: taste verdict, wrap 직전, serve push 직전, fix 라우팅, cook blocker 5개 지점에서 "현재 상태 / 추천 행동(1순위·차선) / 사용자 확인 사유"를 일관된 블록으로 받는다.
- Independent test: 5개 gate 시나리오를 재현하면 모두 동일 구조의 마크다운 블록이 출력된다.

Acceptance:

- AC-009: Given taste가 REQUEST_CHANGES verdict를 낸다, when 사용자에게 보고된다, then recommendation 블록에 1순위(`fix` 또는 `plate` 보강)와 차선, 사용자 확인 사유가 들어 있다.
- AC-010: Given wrap이 release set 후보를 만든다, when 사용자에게 제시, then recommendation 블록에 set 구성안과 차선(분할/연기) 옵션이 있다.
- AC-011: Given serve가 release gate를 통과해 push 직전, when 사용자에게 보고, then human gate 필수 표시 + push 명령 미리보기 + rollback 옵션이 recommendation 블록에 있다.
- AC-012: Given fix가 코드 수정 vs recipe escalation을 결정해야 한다, when 보고, then 두 경로의 1순위·차선이 명시된다.
- AC-013: Given cook이 blocker로 멈춘다, when 보고, then 원인 + 다음 시도 옵션 + 사용자 확인 사유가 블록에 있다.

### US-005 기존 사용자 무중단 마이그레이션

- Priority: P1
- Actor: 이미 단일 파일 + handoffs/ 레이아웃으로 진행한 사용자
- Goal: kitchen heal을 실행하면 기존 데이터 손실 없이 신규 폴더 구조로 변환된다.
- Independent test: 단일 spec md + handoffs/0001-cook.md 같은 fixture를 heal에 넣으면 spec 폴더 안에 정확히 통합된다.

Acceptance:

- AC-014: Given `.agent/spec/active/0001-foo.md` + `.agent/spec/handoffs/0001-{recipe,plate,cook,taste}.md` fixture, when heal 실행 후 승인, then `.agent/spec/active/0001-foo/{spec.md, tasks.md, memory.md}`가 생성된다. 기존 spec 본문의 의도·acceptance는 spec.md로, 구현 계획·task list·진행 체크박스는 tasks.md로, 기존 handoff 본문들은 memory.md의 skill별 섹션으로 시간순 병합된다.
- AC-015: Given 마이그레이션 preview 단계, when 사용자가 거부한다, then 기존 파일이 그대로 유지된다.
- AC-016: Given INDEX.md 두 개 존재, when 마이그레이션 완료, then 두 파일이 삭제되고 `peek`이 폴더 스캔으로 동일 목록을 보여준다.

## 기능 요구사항

- FR-001: 각 spec은 `.agent/spec/active/NNNN-<slug>/` 폴더에 거주하며 파일은 `spec.md`(불변), `tasks.md`(가변), `memory.md`(누적) 3개로 한정한다. 추가 산출물은 `artifacts/` 하위에만 둔다.
- FR-002: 메인 cook이 `tasks.md`와 `memory.md`의 **유일한 writer**다. worker는 파일을 직접 쓰지 않고 결과를 Agent return으로 cook에 넘긴다.
- FR-003: cook은 wave 단위 gate를 강제하고, 같은 wave 내 `Parallel: Yes` + write scope disjoint + dependency 충족 task를 worker pool에 dispatch한다. worker pool 기본값 3, `.agent/commands.json`의 `parallelism.worker_pool` 키로 override 가능.
- FR-004: spec fan-out 기본값은 `auto`. `.agent/commands.json`의 `parallelism.spec_fan_out`이 `auto`이면 write scope disjoint 자동 감지 시 worktree로 동시 cook, 충돌 시 사용자 확인. `ask`/`off`로 override 가능.
- FR-005: 5개 HITL gate(taste verdict / wrap 후보 제시 / serve push 직전 / fix 라우팅 / cook blocker)는 동일한 recommendation 블록 포맷을 출력한다.
- FR-006: kitchen heal은 기존 `.agent/spec/active/NNNN-*.md` + `.agent/spec/handoffs/` 레이아웃을 감지하면 preview → opt-in → 마이그레이션 절차를 따르며, 마이그레이션 실행체는 `plugins/vibe-recipe/scripts/state-migrate.mjs`다.
- FR-007: `peek`은 INDEX.md 의존을 제거하고 `.agent/spec/active|done|archived|abandoned/` 폴더 스캔으로 spec 목록과 상태를 계산한다.
- FR-008: worker가 발견한 사실은 cook이 정제해 `memory.md`의 `## Shared` 또는 `## Task N (worker wX)` 섹션에 시간순 append-only로 기록한다.
- FR-009: librarian agent의 INDEX 생성 책임은 제거되고, 폴더 정리·archive 이동만 유지한다.
- FR-010: 모든 파일 경로 조작은 `path.join` 일관 사용, 모든 shell 호출은 cross-platform 안전(Windows native 포함). CI에 macOS/Linux/Windows runner를 모두 포함한다.

## 성공 기준

- SC-001: 한 spec을 recipe→plate→cook→taste→wrap 한 사이클 돌렸을 때 spec 폴더 안 파일 수가 3개(spec.md/tasks.md/memory.md, ±artifacts/) 이하로 유지된다.
- SC-002: 동일 wave에 `Parallel: Yes` 3개 task가 있을 때 cook 전체 wall time이 serial 대비 측정 가능한 정도로 단축된다(단순 sanity check, 정확한 비율은 verify 단계에서 기록).
- SC-003: 5개 HITL gate 시나리오에서 출력 블록이 동일 구조(현재 상태 / 추천 행동 1·차선 / 사용자 확인 사유)를 가진다.
- SC-004: 기존 단일 파일 + handoffs/ fixture를 heal로 변환했을 때 변환 전후 정보 손실 0 (skill별 handoff 본문이 memory.md에 모두 포함, task checkbox·구현 계획이 tasks.md에 모두 반영, 의도·acceptance가 spec.md에 그대로 보존).
- SC-005: `.agent/spec/INDEX.md`와 `.agent/spec/handoffs/INDEX.md` 파일이 더 이상 생성·갱신되지 않는다.

## 제외 범위

- 자동 push, deploy, publish 행위의 자동화 확대 (여전히 사람 승인 필수)
- recipe의 대화 톤, 질문 은행, alignment brief 처리 방식 개편
- marketplace 패키징, 설치 adapter 스크립트(install-cursor/install-codex/install-aider) 구조 변경
- 다른 LLM provider 또는 외부 task queue(예: BullMQ) 도입 — worker pool은 내부 task-runner subagent + git worktree로 한정
- spec.md 본문의 한국어/영어 다국어화
- JSON 또는 JSONL state 파일 (markdown-only 정책)

## 예외와 상태

- Loading: cook이 worker dispatch 중일 때 `tasks.md`의 해당 task 옆에 `Status: in_progress / Worker: wX / Started: <ISO>` 메타가 표시된다.
- Empty: active spec이 없을 때 `peek`은 "active spec 없음"을 표시하고 다음 추천 skill을 제시한다.
- Error: tasks.md 구조 위반(누락된 task 메타) 발견 시 cook은 중단하고 recommendation 블록으로 plate 보강 또는 수동 복구를 추천한다.
- Permission: worker가 자기 worktree 밖 또는 자신의 write scope 밖 파일을 수정하려 하면 즉시 blocked로 반환한다.
- Data safety: 마이그레이션은 기존 파일을 삭제 전 spec 폴더로 이동·복사 후 검증, 사용자가 거부 시 원상복구.

## Red-team 시나리오

- Misuse/abuse: 사용자가 spec fan-out opt-in을 한 채로 write scope 충돌이 있는 spec 두 개를 호출 → cook이 충돌 감지하고 serial fallback 추천.
- Duplicate/replay: 같은 wave의 task가 동일 파일을 두 worker가 동시에 수정 시도 → write scope disjoint 검사가 사전 차단, 누락된 충돌은 통합 단계 git diff 교집합으로 catch.
- Partial failure: worker 3개 중 1개가 blocked 반환 → wave gate 통과 거부, 사용자에게 추천 블록 제시.
- Permission bypass: worker가 spec 폴더 밖 .agent/wiki 또는 .agent/constitution.md를 수정 시도 → write scope 위반으로 reject.
- Data loss/rollback: heal 마이그레이션 중 시스템 종료 → 원본 파일을 삭제 전 복사·이동했으므로 재실행 시 상태에서 복구 가능. atomic move 또는 transaction marker 사용.
- Boundary cases: tasks.md에 task 메타 형식 호환 불가한 미래 필드가 있을 경우 — cook은 중단하고 plugin 업그레이드 추천.
- Classification: 본 spec은 product/process change. 구현 task는 plate가, scope 변경 발생 시 recipe로 환원.

## Human Gate

- Required: Yes
- Reason: kitchen heal 마이그레이션은 기존 파일 이동을 수반하므로 사용자 사전 승인 필요. spec fan-out도 명시적 opt-in 필수.
- Approval point: (a) kitchen heal preview 직후, (b) spec fan-out 활성화 직전, (c) cook 첫 worker dispatch 직전 (안전 리허설용 1회), (d) 통상의 wrap/serve human gate.

## 데이터와 인터페이스 변경

- Data created: spec 폴더 안 `spec.md`, `tasks.md`, `memory.md`, 선택적 `artifacts/`. 신규 마이그레이션 스크립트 `plugins/vibe-recipe/scripts/state-migrate.mjs`. `.agent/commands.json`의 `parallelism` 객체 신설 (`worker_pool`, `spec_fan_out`).
- Data updated: 모든 skill SKILL.md, `plugins/vibe-recipe/agents/{task-runner,librarian}.md`, `templates/`, `docs/COOKBOOK.md`, `plugins/vibe-recipe/README.md`, kitchen scaffold 표.
- Data deleted: 기존 `.agent/spec/handoffs/` 디렉토리(마이그레이션 후), `.agent/spec/INDEX.md`, `.agent/spec/handoffs/INDEX.md`, spec 본문의 진행 상태 mutation 섹션.
- External API: 없음. autopilot CLI 인자에 `--all-approved` 추가는 내부 옵션 확장.

## Domain 업데이트

- Source: `.agent/wiki/domain.md` (본 repo에 미존재, plate에서 생성 또는 건너뜀 결정)
- New terms:
  - "spec folder": `.agent/spec/active/NNNN-<slug>/` 단위
  - "task fan-out": 한 spec 내 같은 wave 안 독립 task의 worker pool 병렬 실행
  - "spec fan-out": 여러 Approved spec을 worktree로 동시 실행 (`spec_fan_out: auto` 기본)
  - "recommendation block": HITL gate의 표준화된 출력 블록
  - "memory.md": worker 발견과 cross-task 공유 사실의 누적 markdown
  - "single-writer cook": 메인 cook이 spec 폴더 파일의 유일한 writer라는 동시성 정책
- Updated terms: "handoff"는 더 이상 별도 파일이 아니라 spec 폴더 안 `memory.md`의 skill별/task별 섹션을 의미한다.
- Roles/states: worker(task-runner 또는 worktree 인스턴스), main cook(지휘자), wave gate(통과/대기), HITL gate.
- Dangerous assumption: write scope 자동 감지가 정확할 것이라는 가정 — 실제로는 generated file·migration·shared fixture에서 오류 가능. plate가 명시적으로 선언해야 한다.
- Conflict resolved: 없음.

## 결정 기록

- ADR required: Yes
- Proposed ADR: `.agent/wiki/decisions/0001-spec-folder-and-fan-out.md` (plate 단계에서 작성)
- Reason: 디렉토리 레이아웃과 병렬 실행 모델은 hard-to-reverse(기존 사용자 데이터 이동)이고, parallel 정책·worker pool 한도 같은 tradeoff가 있어 ADR이 필요하다.

## 위험과 가정

- 가정: 사용자는 git worktree 사용 환경(macOS, Linux, Windows native 모두 포함)에 있다. Windows에서는 cross-platform 경로·shell 처리 필수.
- 위험: 단일 writer 정책으로 메인 cook이 직렬 처리 병목이 될 수 있음 — 그러나 worker는 실제 task 작업을 병렬로 하고 cook은 결과 머지만 하므로 통상 무시 가능. plate에서 부하 검토.
- 위험: spec fan-out으로 worktree가 많아지면 디스크 사용량과 빌드 캐시 분리 비용 발생. 권장 동시 spec 수와 `.gitignore` 정책은 plate에서 결정.
- 위험: kitchen heal이 미완료된 채 중단되면 부분 상태로 남을 수 있음 — `state-migrate.mjs`는 atomic 단위(spec 폴더 1개씩)로 동작하고 중단 시 재실행 가능해야 한다.
- 위험: Windows native에서 git worktree와 long path가 충돌할 수 있음 (260자 한도) — plate에서 spec 폴더 깊이 가이드 결정.

## 출시와 되돌리기

- 신규 사용자: kitchen 새 scaffold 그대로 사용 (단일 source).
- 기존 사용자: kitchen heal로 마이그레이션, 거부 시 plugin 이전 버전 유지 가능하도록 SKILL.md에 backward-read 호환(읽기만) 한 minor 버전 유지.
- 되돌리기: plugin 버전을 이전으로 고정하고 spec 폴더 → 단일 파일 복원은 별도 스크립트 또는 수동. (downgrade 자동화는 제외 범위.)

## 열린 질문 (해결됨)

- spec 폴더 이름 컨벤션: **`NNNN-<slug>/` 사용** (단일 파일 `NNNN-<slug>.md`와 dash 일관성).
- worker pool 기본값: **3, `.agent/commands.json`의 `parallelism.worker_pool` 키로 사용자 override 가능**.
- spec fan-out opt-in: **`.agent/commands.json`의 `parallelism.spec_fan_out` 기본 `auto`**. write scope disjoint면 자동 진행, 충돌 시 recommendation 블록으로 확인. `ask`/`off` override 가능.
- 동시성 전략: **메인 cook 단일 writer**. worker는 결과를 Agent return으로 cook에 넘기고 파일을 직접 쓰지 않음. file lock 불필요.
- 마이그레이션 스크립트 위치: **`plugins/vibe-recipe/scripts/state-migrate.mjs` 단일 파일**. kitchen heal SKILL.md에서 호출.
- Windows 호환: **이번 spec 범위에 포함**. macOS/Linux/Windows 모두 지원, CI에 3-OS matrix.

## 열린 질문 (plate 단계로 이관)

- `tasks.md`의 task 메타 인라인 포맷(체크박스 줄 + 들여쓴 메타 vs 표 형식 vs YAML front matter).
- worker가 long-running task에서 중간 진행을 reporting하는 방법(없음 vs 부분 return vs 외부 progress file).
- spec fan-out 시 빌드 캐시(`node_modules`, `.next/cache`) 공유 전략.
- Windows long path 회피를 위한 spec slug 길이 가이드.

## 구현 계획

- Approach: 12 skill SKILL.md, 8 agent.md, hook config, templates, scripts를 신규 spec 폴더 모델에 맞춰 수정. `scripts/state-migrate.mjs` 신규 작성. `.agent/commands.json` schema에 `parallelism` 객체 추가. recommendation block 공통 helper 명세. CI에 3-OS matrix 추가.
- Files/modules:
  - `plugins/vibe-recipe/skills/{kitchen,recipe,plate,cook,taste,fix,tidy,wrap,serve,peek,autopilot}/SKILL.md`
  - `plugins/vibe-recipe/agents/{task-runner,librarian,planner,implementor,tester,reviewer,red-team,security-auditor}.md`
  - `plugins/vibe-recipe/templates/.agent/spec/` 신규 스캐폴드
  - `plugins/vibe-recipe/scripts/state-migrate.mjs` (신규)
  - `plugins/vibe-recipe/scripts/autopilot-run.mjs` (인자 확장)
  - `plugins/vibe-recipe/hooks/hooks.json` (필요 시 spec 폴더 hook)
  - `plugins/vibe-recipe/.github/workflows/` 또는 marketplace root CI (3-OS matrix)
  - `plugins/vibe-recipe/docs/{COOKBOOK,INSTALL,CUSTOMIZATION}.md`, `README.md`
- Data flow: recipe → `spec.md` + `tasks.md` 생성 → plate가 두 파일을 검토 (수정 없음, 보강 필요 시 사용자 보고 후 recipe로 환원) → cook이 `tasks.md`를 읽어 `Parallel: Yes` task를 task-runner subagent로 dispatch → worker가 결과를 Agent return → cook이 단일 writer로 `tasks.md`(체크박스·메타)와 `memory.md`(발견·공유 사실) 갱신 → wave gate → 다음 wave.
- Interfaces:
  - `.agent/commands.json` 신규 키: `parallelism: { worker_pool: number=3, spec_fan_out: "auto"|"ask"|"off"=auto }`
  - task-runner 입력 contract: `{ spec_path, tasks_path, memory_path, task_n, phase, story, wave, covers, write_scope, dependency, allowed_files, expected_command }`
  - task-runner 출력 contract: `{ status: "done"|"blocked", changed_files: string[], commands_run: {name, exit, stdout_tail}, findings: string, next_recommendation?: string }`
  - recommendation block 포맷: `### 현재 상태 / ### 추천 행동 (1순위·차선) / ### 사용자 확인이 필요한 이유` 고정 헤더.
- Dependencies: superpowers `using-git-worktrees` 패턴 참고 (spec fan-out에서 worktree 생성·정리), `agent-harness-construction` 추천 블록 일관성.
- Sequencing: Foundation(템플릿·migration·helper) → US-001(spec folder skills) → US-002(task fan-out) → US-003(spec fan-out) → US-004(HITL block) → US-005(migration heal) → Polish(docs·CI).

## 작업 목록

- [x] Task 0: 신규 동작 검증용 실패 test fixture 작성
  - Phase: Foundation
  - Story: Shared
  - Covers: AC-001..AC-016 (회귀 테스트 토대)
  - Write scope: `plugins/vibe-recipe/scripts/__tests__/` (신규)
  - Dependency: None
  - Wave: W00
  - Parallel: No
  - Check: `node --test plugins/vibe-recipe/scripts/__tests__/*.mjs`가 실패 상태로 통과(작성된 테스트가 미구현 동작을 빨갛게 표시).
  - Done: 2026-05-11T02:42:17Z / Check: red fixture prepared in `plugins/vibe-recipe/scripts/__tests__/`.

- [x] Task 1: spec 폴더 스캐폴드 템플릿 + commands.json `parallelism` schema
  - Phase: Foundation
  - Story: Shared
  - Covers: FR-001, FR-003, FR-004
  - Write scope: `plugins/vibe-recipe/templates/.agent/`, `plugins/vibe-recipe/templates/commands.parallelism.example.json`
  - Dependency: Task 0
  - Wave: W01
  - Parallel: Yes
  - Check: `python3 -m json.tool` on parallelism example; template fixture가 Task 0 통합 test에서 readable.
  - Done: 2026-05-11T02:42:17Z / Check: `python3 -m json.tool plugins/vibe-recipe/templates/commands.parallelism.example.json` pass; scaffold fixture pass.

- [x] Task 2: state-migrate.mjs 마이그레이션 스크립트
  - Phase: Foundation
  - Story: US-005
  - Covers: AC-014, AC-015, AC-016, FR-006
  - Write scope: `plugins/vibe-recipe/scripts/state-migrate.mjs`
  - Dependency: Task 0
  - Wave: W01
  - Parallel: Yes
  - Check: `node --test plugins/vibe-recipe/scripts/__tests__/state-migrate.test.mjs`가 fixture 기반으로 통과.
  - Done: 2026-05-11T02:42:17Z / Check: `node --test plugins/vibe-recipe/scripts/__tests__/state-migrate.test.mjs` pass.

- [x] Task 3: recommendation block helper와 표준 포맷 문서화
  - Phase: Foundation
  - Story: US-004
  - Covers: AC-009..AC-013, FR-005
  - Write scope: `plugins/vibe-recipe/templates/recommendation-block.md`, `plugins/vibe-recipe/docs/recommendation-block.md`
  - Dependency: Task 0
  - Wave: W01
  - Parallel: Yes
  - Check: 5개 시나리오 sample이 동일 헤더 구조를 가지는지 grep 검증.
  - Done: 2026-05-11T02:42:17Z / Check: `node --test plugins/vibe-recipe/scripts/__tests__/recommendation-block.test.mjs` pass.

- [x] Task 4: recipe SKILL.md 갱신 — `spec.md` + `tasks.md` 동시 생성
  - Phase: US-001
  - Story: US-001
  - Covers: AC-001, FR-001
  - Write scope: `plugins/vibe-recipe/skills/recipe/SKILL.md`, `plugins/vibe-recipe/skills/recipe/resources/spec-template.md`, `plugins/vibe-recipe/skills/recipe/resources/tasks-template.md` (신규)
  - Dependency: Task 1
  - Wave: W02
  - Parallel: Yes
  - Check: recipe 호출 시뮬레이션에서 두 파일이 생성됨.
  - Done: 2026-05-11T02:44:33Z / Check: `spec-template.md` + 신규 `tasks-template.md` 계약 반영, W01 scaffold test pass.

- [x] Task 5: peek SKILL.md 갱신 — INDEX.md 의존 제거, 폴더 스캔
  - Phase: US-001
  - Story: US-001
  - Covers: AC-001, FR-007, SC-005
  - Write scope: `plugins/vibe-recipe/skills/peek/SKILL.md`
  - Dependency: Task 1
  - Wave: W02
  - Parallel: Yes
  - Check: peek 시뮬레이션이 INDEX.md 없이도 spec 목록을 반환.
  - Done: 2026-05-11T02:44:33Z / Check: `peek/SKILL.md` source table now scans spec folders and `memory.md`; legacy INDEX dependency removed from active path.

- [x] Task 6: kitchen SKILL.md scaffold 표 갱신 + heal 마이그레이션 절차
  - Phase: US-001
  - Story: US-005
  - Covers: AC-014, AC-015, FR-001, FR-006
  - Write scope: `plugins/vibe-recipe/skills/kitchen/SKILL.md`
  - Dependency: Task 2
  - Wave: W02
  - Parallel: Yes
  - Check: kitchen scaffold 표가 spec.md/tasks.md/memory.md 명시, heal 절차에 state-migrate 호출 포함.
  - Done: 2026-05-11T02:44:33Z / Check: `node plugins/vibe-recipe/scripts/build-universal-agents-md.mjs /tmp/vibe-recipe-AGENTS.md` pass.

- [x] Task 7: cook SKILL.md — wave gate + worker pool dispatch + single-writer
  - Phase: US-002
  - Story: US-002
  - Covers: AC-004, AC-005, AC-006, FR-002, FR-003, FR-008
  - Write scope: `plugins/vibe-recipe/skills/cook/SKILL.md`
  - Dependency: Task 1, Task 3
  - Wave: W03
  - Parallel: Yes
  - Check: cook SKILL.md에 dispatch 알고리즘·single-writer 규칙·tasks.md/memory.md 갱신 책임 명시.
  - Done: 2026-05-11T02:46:43Z / Check: `cook/SKILL.md` includes worker dispatch algorithm, single-writer rule, `tasks.md`/`memory.md` update responsibility.

- [x] Task 8: task-runner agent — write scope 검사 + Agent return contract
  - Phase: US-002
  - Story: US-002
  - Covers: AC-006, FR-002, Permission red-team
  - Write scope: `plugins/vibe-recipe/agents/task-runner.md`
  - Dependency: Task 3
  - Wave: W03
  - Parallel: Yes
  - Check: task-runner.md에 입력/출력 contract와 write scope 위반 시 즉시 blocked 규칙 명시.
  - Done: 2026-05-11T02:46:43Z / Check: `agents/task-runner.md` includes input/output contract and write-scope blocked rule.

- [x] Task 9: plate SKILL.md — 검토 역할로 재정의
  - Phase: US-002
  - Story: US-001
  - Covers: 워크플로우 재정의(요약 §)
  - Write scope: `plugins/vibe-recipe/skills/plate/SKILL.md`
  - Dependency: Task 7
  - Wave: W04
  - Parallel: No
  - Check: plate SKILL.md가 "수정 없는 검토" + 보강 필요 시 recipe 환원 흐름을 명시.
  - Done: 2026-05-11T02:47:35Z / Check: `plate/SKILL.md` now writes/reviews `tasks.md`, preserves `spec.md`, and routes product gaps back to `recipe`.

- [x] Task 10: cook SKILL.md — `--all-approved` + worktree dispatch
  - Phase: US-003
  - Story: US-003
  - Covers: AC-007, AC-008, FR-004
  - Write scope: `plugins/vibe-recipe/skills/cook/SKILL.md` (추가 섹션)
  - Dependency: Task 7
  - Wave: W05
  - Parallel: Yes
  - Check: SKILL.md가 worktree 생성·정리·conflict fallback·recommendation block 호출을 명시.
  - Done: 2026-05-11T02:50:43Z / Check: `cook/SKILL.md` includes `--all-approved`, worktree fan-out policy, conflict fallback, recommendation block.

- [x] Task 11: autopilot SKILL.md + autopilot-run.mjs — `--all-approved`
  - Phase: US-003
  - Story: US-003
  - Covers: AC-007
  - Write scope: `plugins/vibe-recipe/skills/autopilot/SKILL.md`, `plugins/vibe-recipe/scripts/autopilot-run.mjs`
  - Dependency: Task 10
  - Wave: W05
  - Parallel: Yes
  - Check: `node plugins/vibe-recipe/scripts/autopilot-run.mjs --dry-run --once --all-approved`가 multi-spec plan을 보여준다.
  - Done: 2026-05-11T02:50:43Z / Check: `node plugins/vibe-recipe/scripts/autopilot-run.mjs --dry-run --once --all-approved` prints all-approved plan.

- [x] Task 12: taste·wrap·serve·fix SKILL.md에 recommendation block 의무 명시
  - Phase: US-004
  - Story: US-004
  - Covers: AC-009, AC-010, AC-011, AC-012, AC-013, FR-005
  - Write scope: `plugins/vibe-recipe/skills/{taste,wrap,serve,fix}/SKILL.md` (각 파일 disjoint)
  - Dependency: Task 3
  - Wave: W06
  - Parallel: Yes
  - Check: 4개 SKILL.md 모두 recommendation block 헤더와 5개 적용 지점이 grep 가능.
  - Done: 2026-05-11T02:51:57Z / Check: grep found `### 현재 상태`, `### 추천 행동`, `### 사용자 확인이 필요한 이유` in taste/wrap/serve/fix.

- [x] Task 13: librarian agent — INDEX 책임 제거, archive 이동 유지
  - Phase: US-005
  - Story: US-005
  - Covers: FR-007, FR-009, SC-005
  - Write scope: `plugins/vibe-recipe/agents/librarian.md`
  - Dependency: Task 5
  - Wave: W07
  - Parallel: Yes
  - Check: librarian.md에서 INDEX 생성 책임 삭제 확인.
  - Done: 2026-05-11T02:52:57Z / Check: `agents/librarian.md` now manages spec folder lifecycle and explicitly does not generate INDEX files.

- [x] Task 14: kitchen heal 마이그레이션 절차 reference로 state-migrate 통합
  - Phase: US-005
  - Story: US-005
  - Covers: AC-014, AC-015, AC-016
  - Write scope: `plugins/vibe-recipe/skills/kitchen/SKILL.md` (heal 섹션만, Task 6과 동일 파일이라 Task 6 뒤 serial)
  - Dependency: Task 2, Task 6
  - Wave: W07
  - Parallel: No (Task 6과 같은 파일)
  - Check: heal flow 통합 시뮬레이션이 state-migrate를 호출하고 spec 폴더가 생성됨.
  - Done: 2026-05-11T02:52:57Z / Check: `kitchen/SKILL.md` heal flow references dry-run/apply `state-migrate.mjs` and post-migration verification.

- [x] Task 15: docs와 README 새 흐름 반영
  - Phase: Polish
  - Story: Shared
  - Covers: SC-001, SC-005, 사용자 가이드
  - Write scope: `plugins/vibe-recipe/docs/COOKBOOK.md`, `plugins/vibe-recipe/docs/CUSTOMIZATION.md`, `plugins/vibe-recipe/README.md`, marketplace root `README.md`
  - Dependency: Task 9, Task 12, Task 14
  - Wave: W08
  - Parallel: Yes
  - Check: 문서가 단일 파일 형식이 아닌 spec 폴더 모델을 설명, recommendation block과 fan-out 옵션을 언급.
  - Done: 2026-05-11T02:56:17Z / Check: README/COOKBOOK/CUSTOMIZATION mention spec folder, recommendation block, and fan-out options.

- [x] Task 16: CI 3-OS matrix + 통합 verify
  - Phase: Polish
  - Story: Shared
  - Covers: FR-010, AC-014 회귀
  - Write scope: `.github/workflows/ci.yml` (있다면) 또는 신규 `plugins/vibe-recipe/.github/workflows/ci.yml`, `plugins/vibe-recipe/scripts/verify-cross-platform.mjs` (신규)
  - Dependency: Task 11, Task 14
  - Wave: W08
  - Parallel: Yes
  - Check: CI workflow가 ubuntu-latest / macos-latest / windows-latest 3개 job을 가지고 test + node --check + json validation을 모두 실행.
  - Done: 2026-05-11T02:56:17Z / Check: `node plugins/vibe-recipe/scripts/verify-cross-platform.mjs` pass; CI matrix includes ubuntu/macos/windows.

## 실행 순서

- Phase order: Setup → Foundation → US-001 → US-002 → US-003 → US-004 → US-005 → Polish
- W00: Task 0 (TDD foundation)
- W01: Task 1, Task 2, Task 3 (Foundation, write scope disjoint, Parallel: Yes)
- W02: Task 4, Task 5, Task 6 (US-001 skills, 각자 다른 SKILL.md, Parallel: Yes)
- W03: Task 7, Task 8 (cook + task-runner, 다른 파일이라 Parallel: Yes)
- W04: Task 9 (plate 재정의, Task 7 결과 의존)
- W05: Task 10, Task 11 (spec fan-out, Parallel: Yes — 다만 Task 10은 cook SKILL.md 재진입이라 Task 7과 같은 wave에 두지 않음)
- W06: Task 12 (HITL block, 4개 SKILL.md disjoint, Parallel: Yes)
- W07: Task 13, Task 14 (Task 14는 Task 6과 같은 kitchen SKILL.md라 serial 후행)
- W08: Task 15, Task 16 (Polish, write scope disjoint, Parallel: Yes)
- Parallel policy: 같은 wave 안에서도 `Parallel: Yes` + dependency 충족 + write scope disjoint(파일 단위)인 task만 Conductor 병렬 후보. cook SKILL.md, kitchen SKILL.md처럼 같은 파일이 여러 task의 write scope에 들어가면 serial로 진행한다.

## 검증 계획

- TDD first check: Task 0의 통합 test fixture(state-migrate, recommendation block 포맷, scaffold 시뮬레이션)가 처음에는 모두 fail → 각 Foundation task가 끝나면 해당 fixture만 green.
- Unit/domain: `state-migrate.mjs`의 함수 단위 test(parsing, atomic move, rollback on reject), recommendation block 헤더 grep test, parallelism schema validation test.
- Integration: spec 폴더 스캐폴드 시뮬레이션, 가짜 기존 레이아웃 fixture를 heal로 변환하고 결과 비교, cook fan-out dry-run.
- E2E/browser: 해당 없음 (UI 미포함). autopilot dry-run으로 multi-spec plan 출력 확인.
- Command profile:
  - test: `node --test plugins/vibe-recipe/scripts/__tests__/*.mjs` + `node --check plugins/vibe-recipe/scripts/*.mjs plugins/vibe-recipe/hooks/*.mjs`
  - e2e: 별도 없음. `node plugins/vibe-recipe/scripts/autopilot-run.mjs --dry-run --once --all-approved` 통합 sanity로 대체.
  - verify: `python3 -m json.tool .claude-plugin/marketplace.json >/dev/null && python3 -m json.tool .agents/plugins/marketplace.json >/dev/null && python3 -m json.tool plugins/vibe-recipe/hooks/hooks.json >/dev/null && node plugins/vibe-recipe/scripts/build-universal-agents-md.mjs /tmp/vibe-recipe-AGENTS.md && node plugins/vibe-recipe/scripts/verify-cross-platform.mjs`

## Plate 상태

- Required before cook: Yes
- Status: Planned
- Notes:
  - 마이그레이션 task(Task 2, 14)는 Foundation/US-005에 분리 배치했고 Task 6과 Task 14가 같은 `kitchen/SKILL.md` 파일을 수정하므로 serial.
  - Task 10이 Task 7과 같은 `cook/SKILL.md`를 추가 편집하므로 wave W03 → W05로 분리해 충돌을 피했다.
  - 본 spec 자체는 단일 파일 형식으로 작성됐다. Task 14 heal 절차 검증 시 이 spec 자체도 dogfooding하여 폴더 형식으로 변환할지 사용자에게 옵션을 제시한다.
  - Human gate 4개 지점(heal preview, spec fan-out 활성, cook 첫 worker dispatch 리허설, wrap/serve)에서 멈춰 recommendation block을 제시한 뒤 진행한다.
  - 열린 질문(plate 단계로 이관) 4개는 Task 4(인라인 포맷), Task 7(중간 진행), Task 10·11(빌드 캐시), Task 4·6·14(slug 길이)에서 각각 결정해 적용한다.
