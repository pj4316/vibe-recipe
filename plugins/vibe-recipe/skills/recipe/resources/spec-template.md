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

## 사용자 시나리오

### US-001 {{primary_user_story_title}}

- Priority: P1
- Actor: {{primary_actor}}
- Goal: {{user_value_or_goal}}
- Independent test: {{observable_user_test_without_implementation_detail}}

Acceptance:

- AC-001: Given {{context}}, when {{action}}, then {{observable_result}}.
- AC-002: Given {{context}}, when {{failure_or_empty_case}}, then {{observable_result}}.

### US-002 {{secondary_user_story_title_or_none}}

- Priority: P2
- Actor: {{secondary_actor_or_same_actor}}
- Goal: {{secondary_user_value_or_goal}}
- Independent test: {{observable_user_test_or_none}}

Acceptance:

- AC-003: Given {{context}}, when {{action}}, then {{observable_result}}.

## 기능 요구사항

- FR-001: {{testable_functional_requirement}}
- FR-002: {{testable_functional_requirement}}
- FR-003: {{testable_functional_requirement}}

## 성공 기준

- SC-001: {{measurable_technology_agnostic_outcome}}
- SC-002: {{measurable_technology_agnostic_outcome}}

## 제외 범위

- {{non_goal_1}}
- {{non_goal_2}}

## 예외와 상태

- Loading: {{loading_state_or_none}}
- Empty: {{empty_state_or_none}}
- Error: {{error_state_or_none}}
- Permission: {{permission_rule_or_none}}
- Data safety: {{data_safety_rule_or_none}}

## Red-team 시나리오

- Misuse/abuse: {{misuse_abuse_scenario_or_none}}
- Duplicate/replay: {{duplicate_replay_scenario_or_none}}
- Partial failure: {{partial_failure_scenario_or_none}}
- Permission bypass: {{permission_bypass_scenario_or_none}}
- Data loss/rollback: {{data_loss_rollback_scenario_or_none}}
- Boundary cases: {{boundary_cases_or_none}}
- Classification: {{spec_change_code_fix_follow_up_or_not_applicable}}

## Human Gate

- Required: {{human_gate_required_yes_or_no}}
- Reason: {{auth_payment_data_loss_external_api_release_or_none}}
- Approval point: {{when_to_stop_for_human_approval}}

## 데이터와 인터페이스 변경

- Data created: {{created_data_or_none}}
- Data updated: {{updated_data_or_none}}
- Data deleted: {{deleted_data_or_none}}
- External API: {{external_api_or_none}}

## Domain 업데이트

- Source: `.agent/wiki/domain.md`
- New terms: {{new_terms_or_none}}
- Updated terms: {{updated_terms_or_none}}
- Roles/states: {{roles_states_or_none}}
- Dangerous assumption: {{dangerous_assumption_or_none}}
- Conflict resolved: {{domain_conflict_or_none}}

## 결정 기록

- ADR required: {{adr_required_yes_or_no}}
- Proposed ADR: {{proposed_adr_path_or_none}}
- Reason: {{hard_to_reverse_surprising_tradeoff_or_none}}

## 위험과 가정

- {{risk_or_assumption}}

## 출시와 되돌리기

- {{rollout_or_migration_note}}

## 열린 질문

- {{open_question_or_none}}
