# Peek 동작 문서

`peek`는 세션 시작 시 또는 작업 방향을 바꾸기 전에 현재 workflow 상태를 빠르게 요약하는 read-only status skill입니다. 사용자는 `/vr:peek`으로 호출할 수 있습니다.

`peek`는 파일을 쓰거나 문제를 고치지 않습니다. 현재 상태를 읽고 가장 안전한 다음 skill을 추천합니다.

## 목표

- branch, dirty tree, 최근 commit을 확인합니다.
- active spec, next task, 최신 handoff/review 상태를 요약합니다.
- release readiness와 autopilot state를 얕게 확인합니다. release readiness는 active spec별 `Ready for Wrap` 후보와 최신 `wrap` summary를 분리합니다.
- 막힌 이유가 있으면 `Risks`에 분리합니다.
- 다음 skill을 하나 추천하고 이유를 남깁니다.

## Read-only Sources

| Source | 확인 내용 |
| --- | --- |
| `git status --short --branch` | branch, dirty tree, staged/unstaged/untracked |
| `git log --oneline -5` | 최근 작업 맥락 |
| `.agent/spec/active/` | active spec, status, next task |
| `.agent/spec/handoffs/` | 최신 cook/fix/taste report |
| `.agent/commands.json` | focused/test/e2e/verify command 존재 여부 |
| `.agent/autopilot/state.json` | opt-in run, stop point, budget |
| project changelog source, version source, tags | release 준비 신호. public manifest가 없으면 `.agent/release-manifest.json`, release notes file이 없으면 bootstrap `CHANGELOG.md`까지 확인 |

파일이 없으면 실패로 처리하지 않고 `Missing`으로 표시합니다.

## Status

| 상태 | 의미 |
| --- | --- |
| `ready` | 다음 skill을 바로 실행할 수 있음 |
| `needs-plan` | active approved spec이 없어 `recipe` 필요 |
| `needs-plate` | active spec은 있지만 구현 계획과 task breakdown이 없어 `plate` 필요 |
| `needs-work` | approved/in-progress plated spec의 task가 남아 `cook` 필요 |
| `needs-review` | 변경이 있고 최신 `taste`가 없거나 오래됨 |
| `blocked` | failing review, missing verify, dirty release state, human gate 미승인 |
| `ready-for-wrap` | `Release readiness: Ready for Wrap` active spec이 있어 `wrap` release set 생성 가능 |
| `release-ready` | 최신 `wrap` summary가 있고 clean tree에서 `serve` gate만 남음 |

## Report 형식

```markdown
# Peek Status
Status: ready / needs-plan / needs-plate / needs-work / needs-review / blocked / ready-for-wrap / release-ready

## Now
- Branch:
- Active spec:
- Ready for Wrap specs:
- Excluded active specs:
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

## Loop Recommendation

- scope가 불명확하면 `recipe`에서 alignment 질문을 먼저 진행합니다.
- active spec이 없으면 `recipe`.
- active spec에 `Plate 상태: Planned`가 없으면 `plate`.
- 기술 선택이 막고 있으면 `forage`.
- approved plated task가 남아 있으면 `cook`.
- 실패나 regression이면 `fix`.
- 변경 검수가 필요하면 `taste`.
- `Ready for Wrap` active spec이 있으면 `wrap`.
- 최신 `wrap` summary가 있고 tag/release gate만 남았으면 `serve`.
- harness 파일이 없거나 깨졌으면 `kitchen`.

## 검증 포인트

`peek` 스킬을 변경할 때는 다음을 확인합니다.

```bash
test -f plugins/vibe-recipe/skills/peek/SKILL.md
test -f plugins/vibe-recipe/docs/skills/PEEK.md
grep -q 'Peek Status' plugins/vibe-recipe/skills/peek/SKILL.md
grep -q 'needs-review' plugins/vibe-recipe/skills/peek/SKILL.md
grep -q 'ready-for-wrap' plugins/vibe-recipe/skills/peek/SKILL.md
node plugins/vibe-recipe/scripts/build-universal-agents-md.mjs /tmp/vibe-recipe-AGENTS.md
grep -q 'peek (status)' /tmp/vibe-recipe-AGENTS.md
```

스크립트나 JSON을 함께 수정했다면 해당 파일에는 별도 문법 검증을 실행합니다.
