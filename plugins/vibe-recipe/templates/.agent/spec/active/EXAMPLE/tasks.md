# EXAMPLE Task Plan

Plate 상태: Not planned

## 구현 계획

- Approach: repository 구조를 읽은 뒤 acceptance를 task 단위로 나눈다.

## 작업 목록

- [ ] Task 0: 실패 검증 작성
  - Phase: Foundation
  - Story: Shared
  - Covers: AC-001
  - Write scope: `tests/`
  - Dependency: None
  - Wave: W00
  - Parallel: No
  - Check: `npm test`

- [ ] Task 1: 기능 구현
  - Phase: US-001
  - Story: US-001
  - Covers: AC-001, FR-001
  - Write scope: `src/`
  - Dependency: Task 0
  - Wave: W01
  - Parallel: Yes
  - Check: `npm test`

## 검증 계획

- Focused: task별 `Check` 명령을 실행한다.
- Regression: release 전 전체 검증 명령을 실행한다.
