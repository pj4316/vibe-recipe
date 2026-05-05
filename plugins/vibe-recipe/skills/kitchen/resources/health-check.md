# 0001 상태 점검

Status: Draft
Branch: feat/0001-health-check

## 목표

프로젝트 harness가 작고 안전한 변경을 대상으로 setup, verification, review, release 준비를 실행할 수 있음을 증명합니다.

## 제외 목표

- 제품 기능을 만들지 않습니다.
- deploy하지 않습니다.

## 수락 기준

- project verify command가 성공하거나, `.agent/commands.json`에 verification이 아직 설정되지 않았음이 명확히 기록되어 있습니다.
- `AGENTS.md`는 에이전트가 작업 전 `.agent` contract를 읽고 일반 개발은 `recipe` 후 `cook`을 사용하도록 안내합니다.
- harness 개선 작업은 ad hoc edit이 아니라 `kitchen`으로 다시 라우팅됩니다.
- handoff note에 rehearsal 결과를 기록합니다.
- Taste report가 harness 자체에 대한 release blocker가 없음을 확인합니다.
- project changelog source 또는 bootstrap `CHANGELOG.md`, 그리고 `.agent/release-manifest.json`이 있어 wrap 입력 source가 준비되어 있습니다.
- Claude Code project settings 또는 Codex Node bootstrap script가 `vibe-recipe` plugin 사용 경로를 준비합니다.

## 작업

1. `.agent/commands.json`의 project verify command를 실행합니다.
2. verification을 실행할 수 없으면 누락된 setup step을 기록합니다.
3. `AGENTS.md`가 일반 기능 작업을 `recipe` -> `cook`으로 안내하는지 확인합니다.
4. harness 변경이 `kitchen`으로 라우팅되는지 확인합니다.
5. project changelog source 또는 bootstrap `CHANGELOG.md`, 그리고 `.agent/release-manifest.json` 존재를 확인합니다.
6. `.claude/settings.json`의 `vibe-recipe@vibe-recipe-marketplace` 설정과 `.agent/setup/vibe-recipe-codex.mjs` 존재를 확인합니다.
7. rehearsal 결과에 대해 `taste`를 실행합니다.
