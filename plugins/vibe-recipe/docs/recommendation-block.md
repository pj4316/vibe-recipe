# Recommendation Block

HITL gate에서는 agent가 다음 행동을 임의로 진행하지 않고 같은 구조의 recommendation block을 제시한다. 블록은 `### 현재 상태`, `### 추천 행동`, `### 사용자 확인이 필요한 이유` 세 헤더를 유지한다.

## 적용 gate

- `taste`: verdict가 `APPROVE`, `REQUEST_CHANGES`, `BLOCK` 중 하나로 확정된 직후 다음 skill을 추천한다.
- `wrap`: release set 후보를 만들었지만 changelog/version 확정 전 분할, 보류, 진행 옵션을 제시한다.
- `serve`: push, deploy, publish 직전 human gate로 멈추고 실행 명령과 rollback 선택지를 제시한다.
- `fix`: 코드 수정, test 보강, `recipe` escalation 중 어떤 경로가 적합한지 추천한다.
- `cook`: worker blocked, wave gate 실패, write scope 충돌처럼 구현 진행을 멈춰야 할 때 다음 시도를 추천한다.

## Skip option

사용자는 반복되는 gate에서 명시적으로 skip option을 줄 수 있다. 단, `serve`의 push/deploy/publish, 데이터 손실 가능성이 있는 migration apply, 외부 비용이 발생하는 작업은 skip 대상이 아니며 매번 확인한다.
