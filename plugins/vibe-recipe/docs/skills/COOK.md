# Cook 동작 문서

`cook`은 승인된 numbered spec 전체를 실제 코드 변경으로 구현하는 지휘 skill입니다. 사용자는 `/vr:cook`으로 호출할 수 있습니다.

`cook`의 책임은 scope 결정이 아니라 구현 지휘입니다. 제품 의도, acceptance criteria, task breakdown은 `recipe/plan`에서 이미 승인되어 있어야 합니다. 메인 에이전트는 recipe 전체를 관리하고, task 하나의 실제 실행은 `task-runner` agent에 맡긴 뒤 결과를 받아 통합합니다.

## 목표

- `Approved` 또는 `In Progress` spec 전체를 읽고 acceptance matrix를 만듭니다.
- task dependency, write scope, serial/parallel 가능성을 판단합니다.
- `Task 0`의 실패 test 또는 executable acceptance check를 먼저 실행하게 합니다.
- 각 task를 `task-runner`에게 맡겨 red -> green -> refactor로 수행하게 합니다.
- task handoff를 통합하고 focused command, `test`, `e2e`, 가능한 `verify`를 확인합니다.
- 모든 acceptance가 covered이면 `taste/review`로 넘기고, 실패하면 `fix`, 추가 `cook`, 또는 `recipe` 보강으로 loop를 돌립니다.

## 시작 조건

| 조건 | 처리 |
| --- | --- |
| active spec 없음 | `recipe/plan`으로 라우팅 |
| `Status: Draft` | 구현하지 않고 approval 필요로 보고 |
| task가 지정되지 않음 | recipe 전체 구현 모드 |
| task가 지정됨 | 해당 task만 실행하되 전체 acceptance 영향은 기록 |
| `Task 0` 없음 | 구현 전에 test/check 보강 필요 |
| human gate 위험 있음 | auth/payment/data-loss/external API/release/deploy/push 승인 확인 |
| working tree dirty | 관련 변경과 관련 없는 사용자 변경을 구분하고 보호 |

## 실행 흐름

1. `AGENTS.md`, active spec, `.agent/spec/design.md`, `.agent/commands.json`, 관련 ADR과 handoff를 읽습니다.
2. `git status --short`로 현재 변경을 확인합니다.
3. 모든 task의 `Check`를 acceptance criteria와 검증 계획에 매핑합니다.
4. task dependency와 write scope를 기준으로 실행 계획을 만듭니다.
5. `Task 0`을 `task-runner`에게 맡깁니다.
6. 준비된 task를 순서대로, 안전하면 병렬로 `task-runner`에게 맡깁니다.
7. task handoff를 읽고 변경, command 결과, risk를 통합합니다.
8. focused command, 필요한 `test`, `e2e`, 가능한 `verify`를 실행합니다.
9. spec progress와 cook summary를 갱신합니다.
10. 모든 task가 끝났으면 `taste/review`를 실행하거나 추천합니다.

## Acceptance matrix

`cook`은 recipe 전체 충족 여부를 확인하기 위해 다음 매핑을 유지합니다.

| 항목 | 내용 |
| --- | --- |
| Acceptance | spec의 Given/When/Then 또는 관찰 가능한 결과 |
| Task | 이 acceptance를 구현하거나 검증하는 task |
| Check | task에 연결된 test/manual check |
| Status | pending, covered, blocked |
| Evidence | command, handoff, manual check 결과 |

## Task-runner handoff

handoff는 다음 작업자가 같은 맥락에서 이어받을 수 있을 만큼 구체적이어야 하지만, 긴 변경 설명이나 코드 diff를 복사하지 않습니다.

필수 항목:

- spec 경로와 task 번호
- covered acceptance criteria
- 변경 파일
- 실행한 command와 결과
- 실패하거나 생략한 검증의 이유
- coverage gap, risk, follow-up
- `recipe` 또는 `fix`로 escalation해야 하는 조건

권장 경로:

```text
.agent/spec/handoffs/NNNN-task<N>.md
```

`cook`은 task handoff를 모아 `.agent/spec/handoffs/NNNN-cook-summary.md` 또는 최종 응답에 recipe 단위 summary를 남깁니다.

## Subagent 연계

`cook`은 필요할 때만 subagent를 씁니다.

| Subagent | 사용 시점 |
| --- | --- |
| `task-runner` | cook의 기본 실행 agent. task 하나를 TDD로 구현하고 handoff 반환 |
| `implementor` | `fix`나 `tidy` 성격의 보조 구현이 필요할 때 |
| `tester` | Task 0 작성, acceptance별 verification mapping, UI/e2e 판단이 필요할 때 |

병렬 구현은 사용자가 opt-in했고 write scope가 격리되어 있을 때만 허용합니다. worker에게는 다른 작업자가 있을 수 있고, 서로의 변경을 되돌리지 말라고 명시해야 합니다.

## 완료 조건

- 모든 task의 check가 통과했거나 blocked 이유가 명확합니다.
- acceptance matrix가 covered/blocked로 정리되어 있습니다.
- spec task checkbox와 status가 최신입니다.
- task handoff와 cook summary에 변경 파일, command 결과, 남은 risk가 있습니다.
- 관련 없는 사용자 변경을 되돌리지 않았습니다.
- 다음 단계가 명확합니다.

## 검증 포인트

`cook` 스킬을 변경할 때는 다음을 확인합니다.

```bash
test -f plugins/vibe-recipe/skills/cook/SKILL.md
test -f plugins/vibe-recipe/docs/skills/COOK.md
grep -q 'Task 0' plugins/vibe-recipe/skills/cook/SKILL.md
grep -q 'Cook Summary' plugins/vibe-recipe/skills/cook/SKILL.md
test -f plugins/vibe-recipe/agents/task-runner.md
node plugins/vibe-recipe/scripts/build-universal-agents-md.mjs /tmp/vibe-recipe-AGENTS.md
grep -q 'task-runner' /tmp/vibe-recipe-AGENTS.md
```

스크립트나 JSON을 함께 수정했다면 해당 파일에는 별도 문법 검증을 실행합니다.
