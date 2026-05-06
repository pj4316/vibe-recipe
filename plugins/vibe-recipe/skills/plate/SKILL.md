---
name: plate
description: /vr:plate 호출 시 사용합니다. 번호가 붙은 recipe 제품 spec을 읽고 cook 전에 필요한 구현 계획, task breakdown, 검증 매핑을 작성합니다.
---

# plate (implementation plan) - 플레이팅

`plate`는 `recipe`가 만든 제품 spec을 구현 가능한 계획으로 바꾸는 스킬입니다. 코드를 구현하지 않습니다. 제품 의도는 바꾸지 않고, `cook`이 task-runner에게 넘길 수 있는 implementation plan과 task list를 작성합니다.

## 역할 경계

`plate`가 작성하는 내용:

- 구현 접근과 선택 이유.
- 파일/모듈/write scope 경계.
- 데이터 흐름, interface 영향, migration/rollback 영향.
- acceptance와 `US/FR/SC`를 task에 연결한 coverage mapping.
- `Task 0`부터 시작하는 executable task list.
- 각 task의 dependency, parallel 가능 여부, check command 또는 manual check.
- `.agent/commands.json`의 `test`, `e2e`, `verify` 상태를 반영한 검증 계획.

`plate`가 하지 않는 내용:

- 제품 scope, user story, acceptance criteria를 임의로 변경하지 않습니다.
- 새 요구사항을 추측해서 추가하지 않습니다.
- 코드를 수정하거나 task를 실행하지 않습니다.
- spec을 `Approved`로 바꾸지 않습니다.

제품 의도가 불명확하거나 `US/FR/SC`가 부족하면 `recipe` 보강으로 되돌립니다. 기술 선택 조사가 필요하면 `forage`로 보냅니다.

## 시작 조건

- `.agent/spec/active/NNNN-*.md` spec이 있습니다.
- spec에는 `US-###`, `AC-###`, `FR-###`, `SC-###` 중 구현에 필요한 추적 ID가 있습니다.
- blocking open question이 없습니다.
- `AGENTS.md`, `.agent/constitution.md`, `.agent/spec/design.md`, `.agent/commands.json`, 관련 ADR을 읽었습니다.
- `git status --short`로 관련 없는 사용자 변경을 확인했습니다.

`Status: Draft` spec도 planning은 가능하지만, `cook`은 `Approved` 또는 `In Progress` 전까지 실행하지 않습니다.

## 흐름

1. Preflight: active spec, command profile, domain/design docs, 관련 ADR을 읽습니다.
2. Readiness: blocking open question, missing `US/FR/SC`, unresolved ADR 필요 여부를 확인합니다.
3. Technical outline: repo 구조와 기존 패턴에 맞는 구현 접근을 정합니다.
4. Plan sections: spec 파일에 `## 구현 계획`, `## 작업 목록`, `## 검증 계획`을 추가하거나 갱신합니다.
5. Coverage: 각 task가 어떤 `US/AC/FR/SC`를 충족하는지 명시합니다.
6. Status: `Plate 상태`를 `Planned`로 바꾸고, `cook` 전 남은 blocker를 남깁니다.
7. Report: spec 경로, task 수, blocked 항목, 다음 추천 skill을 알려줍니다.

## Spec에 추가할 섹션

```markdown
## 구현 계획

- Approach: ...
- Files/modules: ...
- Data flow: ...
- Interfaces: ...
- Dependencies: ...
- Sequencing: ...

## 작업 목록

- [ ] Task 0: ...
  - Covers: AC-001, FR-001, SC-001
  - Write scope: ...
  - Dependency: None
  - Parallel: No
  - Check: ...
- [ ] Task 1: ...
  - Covers: ...
  - Write scope: ...
  - Dependency: Task 0
  - Parallel: No
  - Check: ...

## 검증 계획

- TDD first check: ...
- Unit/domain: ...
- Integration: ...
- E2E/browser: ...
- Command profile:
  - test: ...
  - e2e: ...
  - verify: ...
```

## Task 작성 규칙

- `Task 0`은 실패 test 또는 executable acceptance check 작성입니다.
- 모든 task는 `Covers`, `Write scope`, `Dependency`, `Parallel`, `Check`를 포함합니다.
- task는 `cook/dev`가 하나씩 처리할 수 있는 크기여야 합니다.
- 같은 파일을 쓰거나 같은 migration/generated file에 닿는 task는 parallel로 표시하지 않습니다.
- 문서-only spec이면 task도 문서 변경과 검증에 한정합니다.
- recipe 작성 행위 자체인 “spec 파일 생성”, “index 등록”을 구현 task로 쓰지 않습니다. 단, 실제 제품 변경 범위가 spec/index 문서 갱신인 경우에만 허용합니다.

## 완료 조건

- 모든 `US/AC/FR/SC`가 task 또는 명시적 non-goal/follow-up에 매핑되어 있습니다.
- task dependency와 parallel 가능 여부가 모순되지 않습니다.
- command profile이 검증 계획에 반영되어 있습니다.
- human gate가 필요한 작업은 `cook` 전에 멈출 지점이 명시되어 있습니다.
- `Plate 상태`가 `Planned`이거나, blocker와 추천 next skill이 명확합니다.
