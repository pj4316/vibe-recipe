---
name: peek
description: /vr:peek 또는 /vr:status 호출 시 사용합니다. active spec, git 상태, pending review, release readiness, autopilot mode를 read-only로 요약합니다.
---

# peek (status) - 지금 상태 보기

세션 시작 시 또는 작업 방향을 바꾸기 전에 사용합니다.

`peek`는 read-only status skill입니다. 목적은 현재 repo와 workflow 상태를 빠르게 요약하고, 가장 안전한 다음 skill을 추천하는 것입니다. 문제를 고치거나 파일을 정리하거나 release gate를 실행하지 않습니다.

## 대화 톤

- 상태를 나열만 하지 말고, 사용자가 바로 이해할 수 있게 “현재 상황”, “주의할 점”, “추천 다음 단계” 순서로 안내합니다.
- 경고가 있더라도 불안하게 만들지 말고, 왜 주의가 필요한지와 어떻게 풀 수 있는지 함께 설명합니다.
- 기술 상태는 가능한 한 쉬운 표현으로 풀어 쓰고, 꼭 필요한 경우에만 git이나 workflow 용어를 덧붙입니다.
- 한 번에 너무 많은 세부사항보다 지금 의사결정에 필요한 핵심만 먼저 보여줍니다.
- setup이 덜 된 상태를 설명할 때도 내부 파일 누락 목록을 먼저 던지지 말고, “기본 작업 안내가 아직 없음”, “실행/검증 설정이 아직 없음”처럼 사용자 관점으로 번역합니다.

## 시작 조건

- 사용자가 `/vr:peek`, `/vr:status`, “현재 상태”, “다음에 뭐 하지”처럼 상태 확인을 요청했습니다.
- 작업을 시작하기 전에 active spec, dirty tree, pending review, release readiness를 빠르게 확인해야 합니다.
- autopilot run 전후로 현재 task, stop point, budget, blocker를 확인해야 합니다.

## Read-only 점검 source

- 현재 branch, ahead/behind 상태, dirty file, 최근 commit 5개.
- `.agent/spec/active/`의 active spec과 status, branch, updated date, owner.
- 최신 handoff와 최신 taste verdict.
- release 준비 상태: changelog, tag, active spec, verify command.
- memory/config에 기록된 autopilot mode, budget cap, dry-run 상태.

가능하면 아래 파일과 상태를 얕게 읽습니다.

| Source | 확인 내용 |
| --- | --- |
| `git status --short --branch` | branch, dirty tree, staged/unstaged/untracked |
| `git log --oneline -5` | 최근 작업 맥락 |
| `.agent/spec/active/` | active spec, status, next task |
| `.agent/spec/handoffs/` | 최신 cook/fix/taste report |
| `.agent/commands.json` | focused/test/e2e/verify command 존재 여부 |
| `.agent/autopilot/state.json` | opt-in run, stop point, budget |
| `CHANGELOG.md`, version manifest, tags | release 준비 신호 |

파일이 없으면 실패로 처리하지 않고 `Missing`으로 표시합니다. 없어서 workflow가 막히는 경우에는 내부 경로를 길게 나열하기보다 어떤 준비가 비어 있는지 쉬운 말로 설명한 뒤 `kitchen` 또는 `recipe`를 추천합니다.

## Status 판단

| 상태 | 의미 |
| --- | --- |
| `ready` | 다음 skill을 바로 실행할 수 있습니다. |
| `needs-plan` | active approved spec이 없어 `recipe`가 필요합니다. |
| `needs-work` | approved/in-progress spec의 task가 남아 `cook`이 필요합니다. |
| `needs-review` | 변경이 있고 최신 `taste`가 없거나 오래됐습니다. |
| `blocked` | failing review, missing verify, dirty release state, human gate 미승인이 있습니다. |
| `release-ready` | latest `taste APPROVE`, clean tree, wrap/serve 전 단계가 명확합니다. |

## Next skill 라우팅

| 조건 | 추천 skill |
| --- | --- |
| 제품 의도나 scope가 불명확함 | `recipe`에서 alignment 질문 |
| active spec이 없거나 draft 작성이 필요함 | `recipe` |
| 기술 선택이 blocking함 | `forage` |
| approved task가 남아 있음 | `cook` |
| 실패나 regression이 보임 | `fix` |
| 변경 검수가 필요함 | `taste` |
| 구조 개선만 남음 | `tidy` |
| release note/version 준비가 필요함 | `wrap` |
| release gate/tag만 남음 | `serve` |
| harness 파일이 없거나 깨짐 | `kitchen` |

## 출력

다음 형식의 짧은 report를 작성합니다.

- `Now`: 지금 진행 중인 일.
- `Next`: 가장 안전한 다음 skill.
- `Risks`: dirty tree, missing spec, failing review, blocked release gate.

권장 형식:

```markdown
# Peek Status
Status: ready / needs-plan / needs-work / needs-review / blocked / release-ready

## Now
- Branch:
- Active spec:
- Working tree:
- Latest handoff/review:

## Next
- Recommended skill:
- Reason:

## Risks
- Item:

## Missing
- Source:
```

파일을 쓰거나 branch를 만들거나 formatter를 실행하거나 상태를 바꾸지 않습니다.

## 완료 조건

- 현재 branch와 dirty state를 확인했습니다.
- active spec과 최신 handoff/review 상태가 있으면 요약했습니다.
- release readiness를 묻는 경우 latest taste/verify/changelog/tag 신호를 분리했습니다.
- 가장 안전한 다음 skill과 이유가 있습니다.
- 읽지 못한 source는 `Missing`으로 표시했습니다.
