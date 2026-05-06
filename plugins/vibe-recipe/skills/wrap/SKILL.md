---
name: wrap
description: /vr:wrap 호출 시 사용합니다. Ready for Wrap active spec들을 release set으로 묶고 SemVer를 결정해 version manifest와 changelog를 갱신하되 deploy는 하지 않습니다.
---

# wrap (bump) - 포장하기

release branch를 준비하되 실제 release는 하지 않을 때 사용합니다. `wrap`은 `taste`가 `Ready for Wrap`으로 표시한 active spec들을 release set으로 묶고, version manifest와 project changelog source를 갱신하고 release prep commit을 만들지만, tag, push, deploy는 `serve`로 넘깁니다.

## 대화 톤

- release 준비 작업은 사용자가 바로 이해할 수 있게 “이번 버전이 왜 바뀌는지”와 “어떤 spec들이 묶여 나가는지”를 쉽게 설명합니다.
- 버전 결정 근거와 changelog 요약은 기술적인 분류만 나열하지 말고 사용자 영향 중심으로 풀어줍니다.
- release를 막는 조건이 있으면 단순히 blocked라고 끝내지 말고, 무엇을 먼저 해결해야 하는지 순서대로 안내합니다.
- commit, version, changelog 같은 산출물은 각각 어떤 역할인지 짧게 덧붙여 설명합니다.

## 역할 구분

- `wrap`은 사용자가 호출할 수 있는 release-prep skill입니다.
- 입력 gate는 release set에 포함될 각 active spec의 최신 `taste` verdict와 release 대상 commit range입니다.
- 출력은 release set summary, version/changelog 변경, `chore(release): X.Y.Z` commit입니다. commit message에는 release set에 포함된 모든 spec 경로를 가리키는 `Refs:` footer를 포함합니다.
- release gate 실행, annotated tag 생성, push/deploy 승인은 `serve` 책임입니다.
- `wrap`은 spec을 `done/`으로 이동하지 않습니다. lifecycle close는 `serve`가 tag 성공 뒤 `librarian`에게 맡깁니다.

## 시작 조건

- release set에 포함할 active spec이 1개 이상 있고, 각 spec의 `.agent/spec/handoffs/NNNN-taste.md`가 `Verdict: APPROVE`와 `Release readiness: Ready for Wrap`을 포함합니다.
- 사용자가 release 대상 spec을 지정하지 않으면 모든 `Ready for Wrap` active spec을 기본 release set으로 제안합니다.
- `Draft`, `Approved`, `In Progress`, `Blocked`, `REQUEST_CHANGES`, `BLOCK`, `Not Ready`, taste report 누락 spec은 release set에서 제외하고 summary에 이유를 남깁니다.
- `git status --short`를 확인했고 unrelated dirty change를 release commit에 섞지 않습니다.
- 마지막 release tag 또는 현재 manifest version을 기준 version으로 확인했습니다.
- version source와 changelog source를 찾았습니다. public release manifest가 없으면 kitchen이 만든 `.agent/release-manifest.json`을 초기 source로 사용할 수 있습니다.
- `.agent/commands.json`의 `verify`가 설정되어 있어야 합니다. `verify`가 `null`이면 release 준비를 blocked로 둡니다.

## 입력

- release set: 포함할 active spec 경로와 각 최신 `taste` report.
- excluded active specs: release set에 들어가지 않는 active spec과 제외 이유.
- 마지막 release tag, 현재 HEAD, release 대상 commit range.
- Conventional Commit history와 `BREAKING CHANGE` footer.
- version manifest: 예를 들어 `package.json`, `pyproject.toml`, `Cargo.toml`, plugin manifest, app manifest. repo가 mirror public manifests를 의도적으로 함께 유지하면 그 set 전체를 version source로 다룹니다. 아직 없으면 `.agent/release-manifest.json`.
- project changelog source: 프로젝트가 이미 쓰는 release notes file을 우선하고, 없으면 bootstrap `CHANGELOG.md` 또는 새로 생성할 `CHANGELOG.md`.
- `.agent/commands.json`의 `verify` command.

## SemVer 판정

- `BREAKING CHANGE` footer 또는 `!` marker가 있으면 major입니다.
- `feat` commit이 있으면 minor입니다.
- `fix` commit만 있으면 patch입니다.
- `docs`, `test`, `refactor`, `chore`만 있으면 기본적으로 patch를 만들지 않고 release 필요 여부를 확인합니다.
- 여러 manifest version이 있으면 public release artifact에 해당하는 manifest만 갱신합니다. 다만 repo가 mirror public manifests를 의도적으로 함께 유지하면 그 manifest set을 같은 version으로 함께 갱신합니다. 어떤 manifest 또는 manifest set이 source인지 불명확하면 쓰기 전에 멈춥니다.
- prerelease, backport, hotfix line은 명시 요청이 있을 때만 처리합니다.

## Changelog 포맷

- 기존 project changelog source가 있으면 제목, 날짜 형식, 섹션 이름, bullet 스타일을 유지합니다.
- project changelog source가 아직 없으면 `CHANGELOG.md`를 만들고 `# Changelog` 제목 아래 `## X.Y.Z - YYYY-MM-DD` 섹션을 추가합니다.
- 섹션은 관련 commit이 있을 때만 `Added`, `Changed`, `Fixed`, `Breaking` 순서로 둡니다.
- `feat`는 `Added`, `fix`는 `Fixed`, `BREAKING CHANGE` 또는 `!` marker는 `Breaking`에 넣습니다.
- `refactor`, `perf`, `docs`, `test`, `chore`는 사용자 영향이 있거나 release note로 남길 가치가 있을 때만 `Changed`에 넣습니다.
- bullet은 commit subject를 그대로 복사하기보다 사용자나 운영자가 이해할 수 있는 release note 문장으로 짧게 씁니다.
- 내부 agent handoff, 긴 diff, test log, raw commit body는 changelog에 넣지 않습니다.
- 동일한 변경을 여러 bullet로 반복하지 않고, 관련 commit은 하나의 bullet로 합칩니다.

## 흐름

1. Preflight: latest taste verdict, release readiness, git status, command profile, version/changelog source를 확인합니다.
2. Release set: 사용자가 지정한 spec 또는 모든 `Ready for Wrap` active spec을 포함하고, 나머지 active spec은 excluded list에 둡니다.
3. Range: 마지막 release tag와 그 이후 commit을 읽고 release 대상 range를 고정합니다.
4. Classify: release set 전체의 spec, taste evidence, Conventional Commits, breaking marker를 합쳐 SemVer bump를 제안합니다.
5. Changelog plan: 기존 project changelog source 포맷을 감지하거나 새 `CHANGELOG.md` 생성 포맷을 정합니다.
6. Preview: target version, release set, excluded active specs, 포함 commit, changelog section, 갱신 파일, 제외할 dirty file을 보여주고 override 기회를 줍니다.
7. Update: version source와 project changelog source만 갱신합니다. mirror public manifests set이면 같은 version으로 함께 갱신합니다.
8. Verify: `.agent/commands.json`의 `verify`를 실행합니다.
9. Commit: `chore(release): X.Y.Z` 제목과 release set의 모든 `Refs: .agent/spec/active/NNNN-*.md` footer를 함께 써서 commit을 만들고 `serve`로 넘길 release prep summary를 남깁니다.

## 쓰기 범위

- 허용: release version source. mirror public manifests set이면 같은 version으로 함께 갱신 가능, project changelog source, release prep commit, release prep summary.
- 금지: product code, spec scope, generated agent instructions, tag, deploy script 실행, remote push.
- unrelated dirty file이 있으면 release commit에 포함하지 않습니다. 분리할 수 없으면 blocked로 멈춥니다.

## Verification

- `verify`가 없거나 실패하면 commit을 만들지 않고 `BLOCK`으로 보고합니다.
- project changelog source와 version source가 서로 다르면 commit하지 않습니다. mirror public manifests set이면 모든 manifest version이 target과 일치해야 합니다.
- project changelog source에 target version heading이 없으면 commit하지 않습니다.
- project changelog source에 raw diff, raw test log, internal handoff 내용이 들어가면 commit하지 않습니다.
- version file이 JSON이면 JSON 문법 검증을 실행합니다.
- shell hook이나 release script는 `wrap`에서 실행하지 않습니다.
- commit message는 Conventional Commits 형식과 release set의 각 spec을 가리키는 `Refs: .agent/spec/...` footer를 모두 만족해야 합니다.

## Handoff

완료 시 다음 정보를 남깁니다.

```markdown
# Wrap Summary: X.Y.Z
Status: done / blocked

## Inputs
- Release set:
- Taste reports:
- Excluded active specs:
- Commit range:
- Previous version:

## Version
- Bump:
- Target version:
- Reason:

## Files
- Version manifests:
- Changelog source:
- Changelog format:

## Verification
- Verify:
- Syntax checks:

## Serve handoff
- Release set specs:
- Excluded active specs:
- Lifecycle close owner: serve -> librarian after local tag success

## Next
- Recommended skill: serve
- Blocked reason:
- Why this gate exists:
- How to unblock:
```

## 경계

- tag를 만들지 않습니다.
- deploy하지 않습니다.
- 사람 지시 없이 push하지 않습니다.
- release gate와 annotated tag는 `serve` 책임입니다.
- latest `taste` verdict가 `APPROVE`이고 `Release readiness: Ready for Wrap`인 spec만 release set에 넣습니다.
- 여러 active spec은 허용합니다. release set에 포함되지 않은 active spec은 `wrap`과 `serve`를 막지 않지만, summary에 제외 이유를 명시해야 합니다.
- `verify` 실패를 changelog만 고쳐서 우회하지 않습니다.
- blocked 예시는 “no Ready for Wrap spec”, “missing `taste APPROVE`”, “`verify` is null”, “no version source”, “dirty tree”를 분리해서 설명하고, 각각 어떤 파일이나 command를 먼저 준비해야 하는지 안내합니다.
