# Wrap 동작 문서

`wrap`은 `taste`가 `APPROVE`한 변경을 release branch로 포장하는 release-prep skill입니다. version manifest와 project changelog source를 갱신하고 `chore(release): X.Y.Z` commit을 만들지만, tag, push, deploy는 하지 않습니다. commit message에는 관련 spec을 가리키는 `Refs:` footer를 포함합니다.

## 목표

- 최신 `taste` verdict가 `APPROVE`인지 확인합니다.
- 마지막 release tag 또는 현재 manifest version을 기준으로 release 대상 commit range를 고정합니다.
- Conventional Commits와 breaking marker를 읽어 SemVer bump를 제안합니다.
- version manifest와 changelog만 갱신합니다.
- project `verify`가 green일 때만 release prep commit을 만듭니다.
- 다음 단계는 `serve`로 넘깁니다.

## 시작 조건

- 현재 release 대상 spec의 `.agent/spec/handoffs/NNNN-taste.md`가 있고 verdict가 `APPROVE`입니다.
- BLOCK 또는 REQUEST_CHANGES taste report가 pending이면 시작하지 않습니다.
- `git status --short`를 확인해 unrelated dirty change를 release commit에서 제외합니다.
- 마지막 release tag 또는 현재 manifest version을 기준 version으로 확인합니다.
- version source와 changelog source가 명확합니다. public release manifest가 아직 없으면 `.agent/release-manifest.json`을 초기 source로 사용할 수 있습니다.
- `.agent/commands.json`의 `verify`가 설정되어 있습니다. `verify`가 `null`이면 release 준비는 blocked입니다.

## SemVer 판정

| Signal | Bump |
| --- | --- |
| `BREAKING CHANGE` footer 또는 `!` marker | major |
| `feat` | minor |
| `fix` | patch |
| `docs`, `test`, `refactor`, `chore` only | 기본적으로 release 필요 여부 확인 |

여러 manifest version이 있으면 public release artifact에 해당하는 manifest만 갱신합니다. 다만 repo가 mirror public manifests를 의도적으로 함께 유지하면 그 manifest set을 같은 version으로 함께 갱신합니다. source가 불명확하면 쓰기 전에 멈춥니다.

## Changelog 포맷

- 기존 project changelog source가 있으면 제목, 날짜 형식, 섹션 이름, bullet 스타일을 유지합니다.
- project changelog source가 없으면 `CHANGELOG.md`를 만들고 `# Changelog` 제목 아래 `## X.Y.Z - YYYY-MM-DD` 섹션을 추가합니다.
- 섹션은 관련 commit이 있을 때만 `Added`, `Changed`, `Fixed`, `Breaking` 순서로 둡니다.
- `feat`는 `Added`, `fix`는 `Fixed`, `BREAKING CHANGE` 또는 `!` marker는 `Breaking`에 넣습니다.
- `refactor`, `perf`, `docs`, `test`, `chore`는 사용자 영향이 있거나 release note로 남길 가치가 있을 때만 `Changed`에 넣습니다.
- bullet은 commit subject를 그대로 복사하기보다 사용자나 운영자가 이해할 수 있는 release note 문장으로 짧게 씁니다.
- 내부 agent handoff, 긴 diff, test log, raw commit body는 changelog에 넣지 않습니다.
- 동일한 변경을 여러 bullet로 반복하지 않고, 관련 commit은 하나의 bullet로 합칩니다.

## Flow

1. Preflight: taste verdict, git status, command profile, version/changelog source를 확인합니다.
2. Range: 마지막 release tag와 HEAD 사이의 release 대상 commit을 고정합니다.
3. Classify: Conventional Commits와 breaking marker를 분류합니다.
4. Changelog plan: 기존 project changelog source 포맷을 감지하거나 새 `CHANGELOG.md` 생성 포맷을 정합니다.
5. Preview: target version, 포함 commit, changelog section, 갱신 파일, 제외 dirty file을 보여주고 override 기회를 줍니다.
6. Update: version source와 project changelog source만 갱신합니다. mirror public manifests set이면 같은 version으로 함께 갱신합니다.
7. Verify: `.agent/commands.json`의 `verify`를 실행합니다.
8. Commit: `chore(release): X.Y.Z` 제목과 `Refs: .agent/spec/...` footer를 함께 써서 commit을 만들고 `serve`를 추천합니다.

## 쓰기 범위

- 허용: release version source. mirror public manifests set이면 같은 version으로 함께 갱신 가능, project changelog source, release prep commit.
- 금지: product code, spec scope, generated agent instructions, tag, deploy script 실행, remote push.
- unrelated dirty file이 있으면 release commit에 포함하지 않습니다. 분리할 수 없으면 blocked로 멈춥니다.
- release prep commit은 Conventional Commits 형식과 `Refs: .agent/spec/...` footer를 모두 만족해야 합니다.

## Handoff 필수 항목

- taste report path
- commit range와 previous version
- bump 종류와 target version
- 갱신한 manifest와 changelog format
- `verify` 결과와 syntax check 결과
- blocked reason, why this gate exists, how to unblock, 또는 recommended next skill: `serve`

## 검증 포인트

`wrap` 스킬을 변경할 때는 다음을 확인합니다.

```bash
test -f plugins/vibe-recipe/skills/wrap/SKILL.md
test -f plugins/vibe-recipe/docs/skills/WRAP.md
grep -q 'chore(release): X.Y.Z' plugins/vibe-recipe/skills/wrap/SKILL.md
grep -q '.agent/spec/handoffs/NNNN-taste.md' plugins/vibe-recipe/skills/wrap/SKILL.md
grep -q 'Changelog 포맷' plugins/vibe-recipe/skills/wrap/SKILL.md
plugins/vibe-recipe/scripts/build-universal-agents-md.sh /tmp/vibe-recipe-AGENTS.md
grep -q 'wrap (bump)' /tmp/vibe-recipe-AGENTS.md
```
