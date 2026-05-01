# {{spec_number}} {{spec_title}}

Status: Draft

## 요약

{{one_or_two_sentence_summary}}

## 사용자 요구

- Actor: {{primary_actor}}
- Trigger: {{entry_point_or_trigger}}
- Desired outcome: {{desired_outcome}}

## Harness 확인

- Kitchen status: {{kitchen_complete_or_heal_required}}
- Command source: `.agent/commands.json`
- Spec source: `.agent/spec/prd.md`, `.agent/spec/design.md`

## 목표

- {{goal_1}}
- {{goal_2}}

## 제외 범위

- {{non_goal_1}}
- {{non_goal_2}}

## 사용자 흐름

1. {{step_1}}
2. {{step_2}}
3. {{step_3}}

## 수락 기준

- Given {{context}}, when {{action}}, then {{observable_result}}.
- Given {{context}}, when {{failure_or_empty_case}}, then {{observable_result}}.

## 예외와 상태

- Loading: {{loading_state_or_none}}
- Empty: {{empty_state_or_none}}
- Error: {{error_state_or_none}}
- Permission: {{permission_rule_or_none}}
- Data safety: {{data_safety_rule_or_none}}

## Human Gate

- Required: {{human_gate_required_yes_or_no}}
- Reason: {{auth_payment_data_loss_external_api_release_or_none}}
- Approval point: {{when_to_stop_for_human_approval}}

## 데이터와 인터페이스 변경

- Data created: {{created_data_or_none}}
- Data updated: {{updated_data_or_none}}
- Data deleted: {{deleted_data_or_none}}
- External API: {{external_api_or_none}}

## 작업 목록

- [ ] Task 0: 실패 test 또는 executable acceptance check 작성
  - Check: {{failing_test_or_executable_acceptance_check}}
- [ ] Task 1: {{small_implementation_slice}}
  - Check: {{test_or_manual_check}}
- [ ] Task 2: {{small_implementation_slice}}
  - Check: {{test_or_manual_check}}
- [ ] Task 3: {{small_implementation_slice}}
  - Check: {{test_or_manual_check}}

## 검증 계획

- TDD first check: {{failing_test_or_executable_acceptance_check}}
- Red -> Green -> Refactor note: {{tdd_sequence_note}}
- Unit/domain: {{unit_test_plan_or_none}}
- Integration: {{integration_test_plan_or_none}}
- E2E/browser: {{e2e_or_playwright_mcp_plan_or_none}}
- Command profile:
  - test: {{test_command_value_and_status}}
  - e2e: {{e2e_command_value_and_status}}
  - verify: {{verify_command_value_and_status_or_blocked_reason}}

## 위험과 가정

- {{risk_or_assumption}}

## 출시와 되돌리기

- {{rollout_or_migration_note}}

## 열린 질문

- {{open_question_or_none}}
