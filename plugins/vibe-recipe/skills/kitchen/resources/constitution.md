# 헌장 템플릿

> Kitchen 리소스입니다. 제품 답변과 vibe-recipe 기본값으로 생성합니다.
> 초기화 이후 이 파일은 human-only입니다.

## 제품 의도

- 제품 설명: {{product_pitch}}
- 핵심 사용자: {{primary_user}}
- MVP 성공 기준: {{success_metric}}
- 명시적 제외 범위:
  - {{anti_scope_1}}
  - {{anti_scope_2}}

## 타협하지 않는 운영 원칙

- 모든 의미 있는 변경은 번호가 붙은 spec에서 시작합니다.
- 제품 scope 변경은 구현 중이 아니라 `recipe`에서 다룹니다.
- 구현은 승인된 task를 하나씩 진행합니다.
- test, review note, handoff는 같은 spec에 연결합니다.
- native command는 `.agent/commands.json`에 기록합니다.
- 에이전트는 관련 없는 사용자 변경을 보존합니다.

## 사람 승인 Gate

다음 작업에는 사람 승인이 필요합니다.

- 초기화 이후 이 constitution 수정.
- release, deploy, push, publishing 작업.
- payment, auth, permission, account lifecycle 변경.
- 파괴적 데이터 변경 또는 data-loss 위험.
- MVP, anti-scope, success metric을 바꾸는 제품 scope 변경.
- BLOCKER, critical security/review finding, failed release gate 우회.

## 안전 규칙

- 실제 secret이나 local environment 값을 commit하지 않습니다.
- `.env*`, credential, production data, private key는 보호 대상으로 취급합니다.
- reversible migration과 backup-aware operation을 선호합니다.
- 확인되지 않은 external integration, database, queue, auth provider를 임의로 만들지 않습니다.
- 제품 의도와 안전 규칙이 충돌하면 멈추고 사람에게 확인합니다.

## Review 기본값

- `taste`에는 regression check, change coverage, code review, security audit, red-team review가 포함됩니다.
- BLOCKER가 있으면 merge/release할 수 없습니다.
- CONCERN은 명시적 follow-up 또는 사람 수락이 있을 때만 merge할 수 있습니다.
- SUGGESTION은 선택 사항이며 release를 막지 않습니다.

## 문서 규칙

- `AGENTS.md`는 에이전트 운영 계약입니다.
- `.agent/spec/design.md`는 기술 설계의 source of truth입니다.
- `.agent/spec/prd.md`는 제품 scope를 소유합니다.
- `.agent/wiki/domain.md`는 도메인 용어와 비즈니스 규칙을 소유합니다.
- `.agent/wiki/design-system.md`는 UI 프로젝트에만 존재하며 정책 변경은 `recipe`, 동작 보존 migration은 `tidy`가 다룹니다.
- 생성된 index는 librarian이 관리합니다.

## 적용된 추천 기본값

사용자가 “잘 모르겠어요”를 선택해 적용한 기본값은 kitchen이 기록해야 합니다.

| 결정 | 기본값 | 이유 |
| --- | --- | --- |
| {{decision}} | {{default}} | {{reason}} |

## 개정 절차

1. constitution 변경 이유를 설명하는 proposed ADR을 작성합니다.
2. 사람이 이 파일을 직접 검토하고 수정합니다.
3. constitution 변경이 수락된 뒤에만 AGENTS.md를 갱신합니다.

## Best-practice 근거

- 안정적인 원칙과 구현 세부사항을 분리합니다.
- 되돌리기 어렵거나 외부 영향이 있는 작업은 human-gated로 둡니다.
- 에이전트가 정책을 추론하지 않도록 안전 규칙을 명시합니다.
