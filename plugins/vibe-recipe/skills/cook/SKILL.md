---
name: cook
description: Approved 또는 In Progress recipe와 plate implementation plan을 task 단위 TDD 실행으로 지휘하고, task-runner 결과를 통합해 taste/review까지 이어지게 합니다. /vr:cook 호출, plated task orchestration, acceptance matrix, TDD review loop가 필요할 때 사용합니다.
---

# cook (dev) - 요리하기

승인되고 `plate`가 계획한 recipe를 코드로 완성할 때 사용합니다. 메인 에이전트는 지휘자 역할을 하며, task 하나의 실제 구현은 `task-runner` agent에 맡기고 결과를 받아 통합합니다.

`cook`은 사용자가 호출할 수 있는 top-level orchestrator skill입니다. 제품 scope는 `recipe`에서 승인된 spec을 기준으로 하고, 실행 계획은 `plate`가 작성한 `구현 계획`, `작업 목록`, `검증 계획`을 기준으로 합니다. `task-runner`는 subagent이고 recipe 전체 책임과 다음 loop 판단은 부모 `cook`이 유지합니다.

## 대화 톤

- 구현 상황을 설명할 때는 “무엇을 만들고 있는지”, “지금 어디까지 왔는지”, “다음에 무엇을 확인할지”를 먼저 알려줍니다.
- 기술 설명은 사용자가 이해하기 쉬운 결과 중심 문장으로 시작하고, 필요한 기술 용어는 짧게 덧붙입니다.
- blocker나 실패가 있으면 원인, 영향, 다음 선택지를 차분하게 정리해 안내합니다.
- 사용자가 선택해야 할 지점에서는 추천 방향을 먼저 제시하고, scope를 넓히지 않도록 이유를 함께 설명합니다.

## 시작 조건

- `.agent/spec/active/NNNN-<slug>.md`가 있고 `Status: Approved` 또는 `Status: In Progress`입니다.
- active spec에 `Plate 상태: Planned`, `구현 계획`, `작업 목록`, `검증 계획`이 있습니다.
- 사용자가 task를 지정하지 않았으면 recipe 전체 구현 모드입니다.
- `Task 0`의 실패 test 또는 executable acceptance check가 `plate` 작업 목록에 있습니다.
- `AGENTS.md`, active spec, `.agent/spec/design.md`, `.agent/commands.json`, 관련 ADR과 handoff를 읽었습니다.
- `git status --short`로 작업 트리를 확인했고, 관련 없는 사용자 변경을 되돌리지 않습니다.
- human gate가 필요한 auth/payment/data-loss/external API/release/deploy/push 작업이면 사용자 승인 없이 진행하지 않습니다.

`plate` 계획이 없거나 task가 자유형이라 acceptance와 연결되지 않으면 구현하지 않고 `plate`로 라우팅합니다.

## 지휘 흐름

1. Preflight: 기준 문서, plate 계획, command profile, branch, working tree, 이전 handoff를 확인합니다.
2. Matrix: `US/AC/FR/SC`, tasks, `Check`, command를 연결한 acceptance matrix를 만듭니다.
3. Plan: plate의 task dependency, write scope, serial/parallel 가능성을 검증합니다.
4. Red: `Task 0`을 먼저 `task-runner`에 맡겨 실패 test 또는 executable check를 만듭니다.
5. Dispatch: 준비된 task를 하나씩 `task-runner`에 배정합니다.
6. Integrate: task-runner handoff를 읽고 diff, command 결과, risk를 합성합니다.
7. Verify: focused command 후 필요한 `test`, `e2e`, 가능한 `verify`를 실행합니다.
8. Loop: 실패하면 원인에 따라 같은 task 재실행, `fix`, `plate` 보강, 또는 `recipe` 보강으로 보냅니다.
9. Review: 모든 acceptance가 covered이면 `taste/review`를 실행하거나 추천합니다.

## Task 실행 계약

- task 하나의 구현은 `task-runner`가 red -> green -> refactor로 수행합니다.
- 메인 `cook`은 task-runner에게 spec path, task number, `Covers`, write scope, dependency, allowed files, expected command를 넘깁니다.
- 독립 task만 별도 worktree/worker로 보낼 수 있습니다. write scope, migration, shared test fixture, generated file이 겹치면 serial로 실행합니다.
- task가 너무 크거나 acceptance와 맞지 않으면 구현 전에 `plate` 보강으로 넘깁니다. 제품 scope 자체가 문제면 `recipe` 보강으로 넘깁니다.

## 통합 규칙

- repo의 기존 framework, helper, naming, test style을 우선합니다.
- public API, plugin manifest, command profile, template 계약을 바꾸면 관련 문서와 검증 명령 영향도 함께 확인합니다.
- UI/browser workflow는 Given/When/Then acceptance를 실제 화면 검증과 연결합니다. `e2e`가 없으면 Playwright MCP manual check 필요 여부를 handoff에 남깁니다.
- 구현 중 발견한 domain 용어 충돌은 코드에서 조용히 결정하지 말고 handoff에 기록한 뒤 `recipe` 또는 `librarian` 정리로 넘깁니다.

## Subagent 사용

- `task-runner`: cook의 기본 실행 agent입니다. task 하나를 TDD로 구현하고 handoff를 반환합니다.
- `tester`: acceptance matrix, Task 0 검증, UI/e2e 판단이 필요할 때 사용합니다.
- `implementor`: `fix`나 `tidy` 성격의 보조 구현이 필요할 때만 사용합니다.
- 병렬 작업은 사용자가 opt-in했고 task별 write scope가 격리되어 있을 때만 사용합니다. 최대 3개 worker까지 허용합니다.
- worker에게는 다른 작업자가 있을 수 있으며, 서로의 변경을 되돌리지 말라고 명시합니다.

## Git

task 단위 atomic commit을 선호하고 `Refs: .agent/spec/active/NNNN-<slug>.md`를 남깁니다. 자동 push는 하지 않습니다.

## Handoff 형식

```markdown
# Cook Summary: NNNN <slug>
Status: done / blocked

## Recipe
- Spec:
- Tasks completed:
- Acceptance matrix:

## Task handoffs
- Task <N>:

## Verification
- Focused:
- Test:
- E2E:
- Verify:

## Risks
- Coverage gap:
- Follow-up:
- Escalation:
```

## 완료 기준

- 모든 task의 `Check`가 통과했거나 blocked 이유가 명확합니다.
- acceptance matrix가 covered/blocked로 분류되어 있습니다.
- task-runner handoff와 cook summary에 command 결과가 있습니다.
- spec task checkbox, status, 남은 risk가 최신입니다.
- 관련 없는 사용자 변경을 건드리지 않았습니다.
- 다음 단계가 `taste`, `fix`, `plate` 보강, `recipe` 보강, 또는 추가 `cook` 중 하나로 분명합니다.

## Hard rules

- Draft spec은 구현하지 않습니다.
- `plate` 계획이 없는 spec은 구현하지 않습니다.
- 제품 scope를 구현 중 임의로 바꾸지 않습니다.
- failing command를 숨기거나 manual check를 자동 검증처럼 보고하지 않습니다.
- release, deploy, push는 `cook`에서 하지 않습니다.
