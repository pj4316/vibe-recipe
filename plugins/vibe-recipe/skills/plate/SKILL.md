---
name: plate
description: /vr:plate 호출 시 사용합니다. 번호가 붙은 recipe 제품 spec을 읽고 cook 전에 필요한 구현 계획, user story별 phase/wave task breakdown, 검증 매핑을 작성합니다.
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
- 각 task의 phase, story, wave, dependency, parallel 가능 여부, check command 또는 manual check.
- user story별 독립 구현/검증이 가능한 phase와 execution wave.
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
4. Plan sections: spec 파일에 `## 구현 계획`, `## 작업 목록`, `## 실행 순서`, `## 검증 계획`을 추가하거나 갱신합니다.
5. Coverage: 각 task가 어떤 `US/AC/FR/SC`를 충족하는지 명시합니다.
6. Waves: phase 순서와 wave별 병렬 후보를 정하고, dependency/write scope 충돌을 검사합니다.
7. Status: `Plate 상태`를 `Planned`로 바꾸고, `cook` 전 남은 blocker를 남깁니다.
8. Report: spec 경로, task 수, phase/wave 수, blocked 항목, 다음 추천 skill을 알려줍니다.

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
  - Phase: Foundation
  - Story: US-001
  - Covers: AC-001, FR-001, SC-001
  - Write scope: ...
  - Dependency: None
  - Wave: W00
  - Parallel: No
  - Check: ...
- [ ] Task 1: ...
  - Phase: US-001
  - Story: US-001
  - Covers: ...
  - Write scope: ...
  - Dependency: Task 0
  - Wave: W01
  - Parallel: Yes/No
  - Check: ...

## 실행 순서

- Phase order: Setup -> Foundation -> US-001 -> US-002 -> Polish
- W00: Task 0
- W01: Task 1, Task 2
- Parallel policy: 같은 wave 안에서도 `Parallel: Yes`, dependency 없음, write scope disjoint인 task만 Conductor 병렬 후보.

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
- 모든 task는 `Phase`, `Story`, `Covers`, `Write scope`, `Dependency`, `Wave`, `Parallel`, `Check`를 포함합니다.
- phase는 `Setup`, `Foundation`, `US-###`, `Polish` 중 하나를 사용합니다. `Foundation`은 모든 user story를 막는 선행 작업에만 씁니다.
- `Story`는 관련 `US-###`를 씁니다. setup/foundation/polish 공통 작업이 특정 story에 속하지 않으면 `Shared`를 씁니다.
- `Wave`는 `W00`, `W01`처럼 실행 가능한 묶음입니다. 앞 wave가 끝나기 전에는 뒤 wave를 시작하지 않습니다.
- `Parallel: Yes`는 같은 wave 안에서 dependency가 없고 write scope가 겹치지 않는 task에만 붙입니다.
- task는 `cook/dev`가 하나씩 처리할 수 있는 크기여야 합니다.
- 같은 파일을 쓰거나 같은 migration/generated file에 닿는 task는 parallel로 표시하지 않습니다.
- user story phase는 독립적으로 구현하고 검증할 수 있어야 합니다. cross-story dependency가 있으면 `Dependency`와 `실행 순서`에 명시합니다.
- 문서-only spec이면 task도 문서 변경과 검증에 한정합니다.
- recipe 작성 행위 자체인 “spec 파일 생성”, “index 등록”을 구현 task로 쓰지 않습니다. 단, 실제 제품 변경 범위가 spec/index 문서 갱신인 경우에만 허용합니다.

## 완료 조건

- 모든 `US/AC/FR/SC`가 task 또는 명시적 non-goal/follow-up에 매핑되어 있습니다.
- 각 user story가 독립 검증 가능한 phase로 묶여 있고, phase order와 wave order가 있습니다.
- task dependency와 parallel 가능 여부가 모순되지 않습니다.
- 같은 wave의 `Parallel: Yes` task는 write scope가 겹치지 않습니다.
- command profile이 검증 계획에 반영되어 있습니다.
- human gate가 필요한 작업은 `cook` 전에 멈출 지점이 명시되어 있습니다.
- `Plate 상태`가 `Planned`이거나, blocker와 추천 next skill이 명확합니다.
