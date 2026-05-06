# Plate 동작 문서

`plate`는 `recipe`가 만든 제품 spec을 구현 가능한 계획으로 바꾸는 planning skill입니다. 사용자는 `/vr:plate`로 호출할 수 있습니다.

`plate`는 코드를 구현하지 않습니다. 제품 의도는 `recipe`가 정하고, `plate`는 그 의도를 바탕으로 구현 접근, 파일 경계, task breakdown, 검증 계획을 작성합니다.

## 목표

- active spec의 `US-###`, `AC-###`, `FR-###`, `SC-###`를 읽고 구현 coverage를 만듭니다.
- repo의 실제 구조와 기존 패턴을 기준으로 implementation approach를 정합니다.
- `cook`이 실행할 수 있는 task list를 작성합니다.
- 각 task에 covered requirement, write scope, dependency, parallel 가능 여부, check를 연결합니다.
- `.agent/commands.json`의 `test`, `e2e`, `verify` 상태를 검증 계획에 반영합니다.

## 시작 조건

| 조건 | 처리 |
| --- | --- |
| active spec 없음 | `recipe`로 라우팅 |
| `US/FR/SC`가 부족함 | `recipe` 보강으로 라우팅 |
| blocking open question 있음 | `recipe`에서 먼저 해결 |
| 기술 선택이 불명확함 | `forage`로 라우팅 |
| `Status: Draft` | planning은 가능하지만 `cook` 실행은 금지 |

## 산출물

`plate`는 기본적으로 같은 active spec에 아래 섹션을 추가하거나 갱신합니다.

- `구현 계획`
- `작업 목록`
- `검증 계획`
- `Plate 상태`

각 task는 다음 필드를 가져야 합니다.

- `Covers`: 연결된 `AC/FR/SC`
- `Write scope`: 파일 또는 모듈 경계
- `Dependency`: 선행 task
- `Parallel`: 병렬 가능 여부와 이유
- `Check`: command 또는 manual check

## 완료 조건

- 모든 핵심 acceptance와 functional requirement가 task에 매핑되어 있습니다.
- `Task 0`이 실패 test 또는 executable acceptance check입니다.
- task가 `cook/dev`에서 하나씩 처리 가능한 크기입니다.
- 같은 파일을 건드리는 task는 병렬로 표시되지 않았습니다.
- `Plate 상태`가 `Planned`이거나 blocker와 next skill이 명확합니다.

## 검증 포인트

`plate` 스킬을 변경할 때는 다음을 확인합니다.

```bash
test -f plugins/vibe-recipe/skills/plate/SKILL.md
test -f plugins/vibe-recipe/docs/skills/PLATE.md
grep -q 'Task 0' plugins/vibe-recipe/skills/plate/SKILL.md
grep -q 'Plate 상태' plugins/vibe-recipe/skills/plate/SKILL.md
node plugins/vibe-recipe/scripts/build-universal-agents-md.mjs /tmp/vibe-recipe-AGENTS.md
grep -q 'plate' /tmp/vibe-recipe-AGENTS.md
```
