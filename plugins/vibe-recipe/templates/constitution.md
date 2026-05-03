# Constitution

Status: Fallback Skeleton

> `kitchen/init`은 이 skeleton을 그대로 복사하지 않고, 제품 답변과 vibe-recipe default operating model로 프로젝트별 constitution을 생성합니다.
> 초기화 이후 이 문서는 human-only입니다.

## Product Intent

- Product pitch: generated from kitchen product brief.
- Primary user: generated from kitchen product brief.
- Success metric: generated from kitchen MVP answers.

## Vibe Recipe Default Operating Model

- 모든 의미 있는 변경은 numbered spec에서 시작합니다.
- 구현은 승인된 spec task 단위로 진행합니다.
- native project command는 `.agent/commands.json`에 기록합니다.
- 구현, test, review, handoff는 같은 spec에 연결합니다.
- agent는 관련 없는 사용자 변경을 보호합니다.

## Safety Gates

- release, deploy, push는 사람 승인 전 자동 실행하지 않습니다.
- payment, auth, data-loss 가능성이 있는 변경은 사람 승인이 필요합니다.
- destructive operation은 명시적 opt-in 없이는 수행하지 않습니다.
- secret과 environment file은 보호합니다.

## Review Defaults

- `taste`는 regression, change coverage, code review를 포함합니다.
- `taste`는 security-auditor와 red-team review를 포함합니다.
- BLOCKER는 수정 전 merge/release할 수 없습니다.

## Human-only Areas

- 이 constitution의 원칙 변경.
- product scope의 큰 변경.
- release/deploy/push 승인.
- auth/payment/data-loss 정책 변경.

## Recommended Defaults Applied

- `kitchen`이 제품 질문에서 “잘 모르겠어요” 답변을 받은 경우, 적용한 기본값과 이유를 여기에 기록합니다.
