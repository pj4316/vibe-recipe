# 서브에이전트 기능 요약

`agents/` 문서는 vibe-recipe 스킬이 특정 검토나 실행을 독립적으로 맡길 때 사용하는 전문 서브에이전트입니다. 각 agent는 frontmatter의 `description`에 사용 시점을 적고, 본문에는 읽어야 할 기준, 권한, 금지 사항, 출력 형식을 둡니다.

## Agent 목록

| Agent | 주 사용 흐름 | 기능 |
| --- | --- | --- |
| `planner` | `recipe` | 사용자 요구사항을 numbered spec으로 만들기 전에 질문, scope, acceptance criteria, task 분해를 검토합니다. |
| `task-runner` | `cook` | `cook`이 배정한 task 하나를 red -> green -> refactor로 구현하고 task handoff를 반환합니다. |
| `implementor` | `fix`, `tidy`, `cook` 보조 | 승인된 spec의 task 하나를 가장 작은 완결 behavior slice로 구현하고 handoff를 남깁니다. |
| `tester` | `cook`, `taste` | acceptance criteria를 test/manual check로 증명하고 `test`, `e2e`, `verify`, Playwright MCP 필요 여부를 판단합니다. |
| `reviewer` | `taste` | 구현 diff가 승인된 spec, acceptance criteria, 로컬 관례, 유지보수 기준에 맞는지 검토합니다. |
| `security-auditor` | `taste`, `fix` | auth, secret, injection, unsafe IO, dependency, data-loss 같은 보안 위험을 점검합니다. |
| `red-team` | `taste` | business logic, edge case, implicit assumption, abuse scenario를 공격적으로 검토합니다. |
| `librarian` | session end, 정리 단계 | spec index, handoff index, memory, red-team finding, summary를 정리합니다. |

## 권한 기준

| Agent | 권한 경계 |
| --- | --- |
| `planner` | read-only. spec 초안 개선안과 blocking question만 부모 `recipe` 흐름에 반환합니다. |
| `task-runner` | code/test write 가능. 부모 `cook`이 배정한 task와 write scope만 다룹니다. |
| `implementor` | code/test write 가능. assigned task와 write scope를 벗어나지 않습니다. |
| `tester` | `cook`에서 명시 배정된 test 파일만 수정 가능. `taste`에서는 read-only review mode입니다. |
| `reviewer` | read-only. 결과를 부모 `taste` 흐름에 반환합니다. |
| `security-auditor` | read-only. destructive action과 credential 출력 금지. |
| `red-team` | read-only. destructive action과 외부 공격 트래픽 금지. |
| `librarian` | `.agent/spec/INDEX.md`, `.agent/spec/handoffs/INDEX.md`, `.agent/memory/`, 생성된 summary 파일만 정리합니다. |

## 공통 계약

- 작업 시작 전 `AGENTS.md`, `.agent/constitution.md`, active spec, `.agent/spec/design.md`, `.agent/commands.json`을 필요한 범위에서 읽습니다.
- `recipe`가 승인한 spec 없이 `cook` 계열 작업을 시작하지 않습니다.
- 구현 흐름은 `Task 0`의 실패 test 또는 executable acceptance check를 우선합니다.
- UI/browser 변경은 `e2e` command 또는 Playwright MCP 검증 계획과 연결합니다.
- release, deploy, push, auth/payment/data-loss 작업은 human gate를 요구합니다.
- 완료 시 부모 skill이 합성할 수 있도록 finding, 변경 파일, command 결과, handoff 경로, 남은 risk를 반환합니다.
