# vibe-recipe Context

vibe-recipe 플러그인 패키지의 도메인 언어입니다. 스킬, 스크립트, 훅, fallback instructions가 같은 workflow 개념을 같은 이름으로 다루도록 기록합니다.

## Language

**Spec**:
사용자 의도, acceptance, 상태를 담는 feature 작업 단위입니다.
_Avoid_: ticket, issue, task

**Task Plan**:
`plate`가 만든 실행 가능한 task 목록, metadata, wave 순서를 담는 구현 계획입니다.
_Avoid_: checklist, todo list

**Wave**:
Task Plan 안에서 dependency가 허용하는 병렬/순차 실행 묶음입니다.
_Avoid_: batch, stage

**Handoff**:
한 스킬 또는 task iteration이 다음 loop에 넘기는 구조화된 작업 기록입니다.
_Avoid_: notes, summary

**Memory**:
folder-based Spec 안에서 handoff와 review 결과를 누적하는 coordination 기록입니다.
_Avoid_: log, journal

## Relationships

- 하나의 **Spec**은 정확히 하나의 **Task Plan**을 가질 수 있습니다.
- 하나의 **Task Plan**은 하나 이상의 **Wave**를 순서대로 정의합니다.
- 하나의 **Wave**는 하나 이상의 task를 포함할 수 있습니다.
- legacy Spec은 여러 **Handoff**를 `.agent/spec/handoffs/` 아래에 둘 수 있습니다.
- folder-based Spec은 여러 **Handoff**에 해당하는 내용을 하나의 **Memory**에 누적합니다.

## Example Dialogue

> **Dev:** "`autopilot`이 다음 task를 어떻게 고르나요?"
> **Domain expert:** "**Task Plan**의 **Wave** 순서를 읽고, dependency가 충족된 첫 pending task를 고릅니다."

## Flagged Ambiguities

- "task list"는 단순 체크리스트처럼 들리므로, 실행 metadata와 wave ordering을 포함한 개념은 **Task Plan**이라고 부릅니다.
