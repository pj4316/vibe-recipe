---
name: serve
description: /vr:serve 호출 시 사용합니다. release gate를 실행하고 annotated tag를 만든 뒤 release set spec을 done으로 닫고, human-approved push/deploy 전에서 멈춥니다.
---

# serve (release) - 내보내기

`wrap`이 release set 준비를 끝낸 뒤 사용합니다. `serve`는 release gate를 실행하고 local annotated tag를 만들 수 있지만, remote push, deploy, publish는 별도 human approval 전에서 멈춥니다. tag 성공 뒤에는 release set에 포함된 active spec만 `librarian`으로 `done/`에 닫습니다.

## 대화 톤

- release 단계에서는 사용자가 긴장하기 쉬우므로, 현재 준비 상태와 남은 위험을 침착하고 분명하게 설명합니다.
- 통과한 항목과 막힌 항목을 분리해서 보여주고, 막힌 경우에는 바로 다음에 무엇을 하면 되는지 안내합니다.
- 배포 관련 용어는 가능한 한 쉬운 말로 풀어 쓰고, human approval이 필요한 이유를 함께 설명합니다.
- “지금 여기까지는 안전하다”와 “여기서부터는 명시 승인이 필요하다”를 명확히 구분해 안내합니다.

## 역할 구분

- `serve`는 사용자가 직접 호출하는 top-level release gate skill입니다.
- `serve`는 version, changelog, product code를 수정하지 않습니다. 준비가 부족하면 `wrap` 또는 `fix`로 되돌립니다.
- `serve`는 tag 전에는 repo 파일을 수정하지 않습니다. tag 성공 뒤에는 release set lifecycle close만 허용하며, 이 작업은 `librarian`에게 위임합니다.
- `serve` 호출 자체는 local release gate, local tag 생성, release set lifecycle close를 승인한 것으로 봅니다.
- remote push, deploy, publish, external release hook 실행은 별도 명시 승인이 필요합니다.
- `autopilot`은 절대 `serve`를 자동 실행하지 않습니다.

## Pre-flight gate

모두 통과해야 합니다.

- 최신 `wrap` summary가 있고 target version이 version source와 project changelog source에 일치합니다. mirror public manifests set이면 모든 manifest가 target version과 일치해야 합니다.
- `wrap` summary에 release set specs와 excluded active specs가 명시되어 있습니다.
- release set에 포함된 각 spec의 최신 `taste` verdict가 `APPROVE`이고 `Release readiness: Ready for Wrap`입니다.
- release set에 포함되지 않은 active spec은 있어도 됩니다. 단, summary에 excluded active specs와 제외 이유가 있어야 합니다.
- project verify command가 green입니다. verify command가 없으면 release를 blocked로 처리합니다.
- BLOCK 또는 REQUEST_CHANGES taste report가 pending 상태가 아닙니다.
- critical security/review finding이 없습니다.
- project changelog source에 target version이 있습니다.
- working tree가 clean입니다.
- tag `vX.Y.Z`가 이미 있으면 같은 commit을 가리키는지 확인합니다. 다른 commit이면 blocked입니다.

## 입력

- `wrap` summary 또는 release prep commit.
- target version과 version source. public manifest가 없으면 `.agent/release-manifest.json` bootstrap source를 읽을 수 있습니다. repo가 mirror public manifests를 함께 유지하면 그 set 전체를 확인합니다.
- project changelog source target version section. project-specific release notes file이 없으면 bootstrap `CHANGELOG.md`.
- release set의 최신 `taste` report들.
- excluded active specs 목록.
- `.agent/commands.json`의 `verify` command.
- `.agent/constitution.md`의 human gate 정책.
- optional `.hooks/release.mjs`.

## 흐름

1. Preflight: wrap summary, release set, taste verdicts, version source, project changelog source, clean tree, existing tag를 확인합니다.
2. Gate: `.agent/commands.json`의 `verify`를 실행하고 실패하면 `BLOCK`으로 멈춥니다.
3. Version check: version source, project changelog source heading, tag name이 모두 `X.Y.Z`로 일치하는지 확인합니다. mirror public manifests set이면 모든 manifest version을 검사합니다.
4. Tag: local annotated tag `vX.Y.Z`를 생성합니다. tag message에는 changelog 요약과 wrap summary path를 포함합니다.
5. Lifecycle close: tag가 성공하면 `librarian`에게 release set에 포함된 active spec folder만 `done/`으로 이동하게 합니다. 제외된 active spec은 그대로 둡니다. `.agent/spec/INDEX.md`는 재생성하지 않습니다.
6. Bookkeeping commit: lifecycle close 변경만 별도 `chore(spec): close vX.Y.Z release set` commit으로 남깁니다. release tag는 release prep commit을 가리키며, bookkeeping commit은 tag 이후의 workflow 정리입니다.
7. Optional hook: `.hooks/release.mjs`가 있으면 별도 명시 승인을 받은 경우에만 실행합니다.
8. Summary: release gate summary를 최종 응답에 남깁니다.
9. Stop: push/deploy/publish 명령은 실행하지 않고 필요한 승인과 다음 command를 안내합니다.

## Tag 계약

- tag 이름은 `vX.Y.Z`입니다.
- tag는 release prep commit 또는 사용자가 지정한 clean HEAD를 가리켜야 합니다.
- tag는 lifecycle close bookkeeping commit이 아니라 release prep commit을 가리킵니다.
- 같은 tag가 같은 commit에 이미 있으면 재생성하지 않고 idempotent success로 보고합니다.
- 같은 tag가 다른 commit에 있으면 절대 덮어쓰지 않습니다.
- lightweight tag가 있으면 annotated tag로 바꾸기 전에 사람 확인을 받습니다.
- tag message에는 version, date, changelog path, wrap summary path, verify 결과를 짧게 남깁니다.

## Human gate

- `serve`는 release gate, local tag, release set lifecycle close까지만 수행합니다.
- `git push`, `git push --tags`, package publish, app deploy, cloud deploy, external release API 호출은 별도 승인 없이는 실행하지 않습니다.
- `.hooks/release.mjs`가 remote side effect를 만들 수 있으면 hook 실행도 별도 승인 대상입니다.
- approval 문구에는 대상 remote, tag, branch, deploy environment를 구체적으로 포함해야 합니다.

## Release gate summary

완료 시 다음 정보를 최종 응답에 남깁니다.

```markdown
# Serve Summary: X.Y.Z
Status: tagged / blocked

## Inputs
- Wrap summary:
- Release set:
- Taste reports:
- Excluded active specs:
- Target version:

## Gates
- Verify:
- Clean tree:
- Existing tag:

## Tag
- Tag:
- Commit:
- Message:

## Lifecycle close
- Moved specs:
- Done paths:
- Index:
- Bookkeeping commit:

## Human approval required
- Push:
- Deploy/publish:
- Hook:

## Next
- Command to run after approval:
- Blocked reason:
- Why this gate exists:
- How to unblock:
```

## Recommendation block

release gate 결과, local tag 직전, push/deploy/publish 직전에는 최종 응답에 `templates/recommendation-block.md`와 같은 헤더를 포함합니다.

- `serve` gate 통과: 1순위는 local annotated tag 생성, 차선은 tag 전 보류입니다.
- push/deploy/publish 직전: 1순위는 사용자가 승인한 정확한 command 실행, 차선은 명령을 실행하지 않고 수동 배포 지침만 남기는 것입니다.
- blocked: 1순위는 `wrap`, `fix`, `taste` 중 blocker를 직접 해소하는 skill, 차선은 release 중단입니다.

필수 헤더:

```markdown
### 현재 상태
### 추천 행동
### 사용자 확인이 필요한 이유
```

## Hard rule

- autopilot은 절대 자동으로 `serve`를 실행하지 않습니다.
- release gate 실패를 tag, push, deploy로 우회하지 않습니다.
- tag, push, deploy 이력을 force로 덮어쓰지 않습니다.
- version/changelog mismatch는 `serve`에서 고치지 않고 `wrap`으로 되돌립니다.
- tag 생성 이후에는 release set lifecycle close 외의 파일을 dirty하게 만들지 않습니다. lifecycle close를 수행했다면 별도 bookkeeping commit까지 만들어 working tree를 다시 clean으로 둡니다.
