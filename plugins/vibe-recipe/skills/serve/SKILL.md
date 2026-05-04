---
name: serve
description: /vr:serve 또는 /vr:release 호출 시 사용합니다. release gate를 실행하고 annotated tag를 만든 뒤, human-approved push/deploy 전에서 멈춥니다.
---

# serve (release) - 내보내기

`wrap`이 release 준비를 끝낸 뒤 사용합니다. `serve`는 release gate를 실행하고 local annotated tag를 만들 수 있지만, remote push, deploy, publish는 별도 human approval 전에서 멈춥니다.

## 대화 톤

- release 단계에서는 사용자가 긴장하기 쉬우므로, 현재 준비 상태와 남은 위험을 침착하고 분명하게 설명합니다.
- 통과한 항목과 막힌 항목을 분리해서 보여주고, 막힌 경우에는 바로 다음에 무엇을 하면 되는지 안내합니다.
- 배포 관련 용어는 가능한 한 쉬운 말로 풀어 쓰고, human approval이 필요한 이유를 함께 설명합니다.
- “지금 여기까지는 안전하다”와 “여기서부터는 명시 승인이 필요하다”를 명확히 구분해 안내합니다.

## 역할 구분

- `serve`는 사용자가 직접 호출하는 top-level release gate skill입니다.
- `serve`는 version, changelog, product code를 수정하지 않습니다. 준비가 부족하면 `wrap` 또는 `fix`로 되돌립니다.
- `serve`는 repo 파일을 수정하지 않습니다. 산출물은 local annotated tag와 최종 release gate summary입니다.
- `serve` 호출 자체는 local release gate와 local tag 생성을 승인한 것으로 봅니다.
- remote push, deploy, publish, external release hook 실행은 별도 명시 승인이 필요합니다.
- `autopilot`은 절대 `serve`를 자동 실행하지 않습니다.

## Pre-flight gate

모두 통과해야 합니다.

- 최신 `wrap` summary가 있고 target version이 manifest와 `CHANGELOG.md`에 일치합니다.
- 최신 `taste` verdict가 `APPROVE`입니다.
- 예상치 못한 open active spec이 없습니다.
- project verify command가 green입니다. verify command가 없으면 release를 blocked로 처리합니다.
- BLOCK 또는 REQUEST_CHANGES taste report가 pending 상태가 아닙니다.
- critical security/review finding이 없습니다.
- `CHANGELOG.md`에 target version이 있습니다.
- working tree가 clean입니다.
- tag `vX.Y.Z`가 이미 있으면 같은 commit을 가리키는지 확인합니다. 다른 commit이면 blocked입니다.

## 입력

- `wrap` summary 또는 release prep commit.
- target version과 version manifest.
- `CHANGELOG.md` target version section.
- 최신 `taste` report.
- `.agent/commands.json`의 `verify` command.
- `.agent/constitution.md`의 human gate 정책.
- optional `.hooks/release.sh`.

## 흐름

1. Preflight: wrap summary, taste verdict, manifest, changelog, clean tree, existing tag를 확인합니다.
2. Gate: `.agent/commands.json`의 `verify`를 실행하고 실패하면 `BLOCK`으로 멈춥니다.
3. Version check: manifest version, changelog heading, tag name이 모두 `X.Y.Z`로 일치하는지 확인합니다.
4. Tag: local annotated tag `vX.Y.Z`를 생성합니다. tag message에는 changelog 요약과 wrap summary path를 포함합니다.
5. Optional hook: `.hooks/release.sh`가 있으면 별도 명시 승인을 받은 경우에만 실행합니다.
6. Summary: release gate summary를 최종 응답에 남깁니다. repo 파일에 release memory를 쓰지 않습니다.
7. Stop: push/deploy/publish 명령은 실행하지 않고 필요한 승인과 다음 command를 안내합니다.

## Tag 계약

- tag 이름은 `vX.Y.Z`입니다.
- tag는 release prep commit 또는 사용자가 지정한 clean HEAD를 가리켜야 합니다.
- 같은 tag가 같은 commit에 이미 있으면 재생성하지 않고 idempotent success로 보고합니다.
- 같은 tag가 다른 commit에 있으면 절대 덮어쓰지 않습니다.
- lightweight tag가 있으면 annotated tag로 바꾸기 전에 사람 확인을 받습니다.
- tag message에는 version, date, changelog path, wrap summary path, verify 결과를 짧게 남깁니다.

## Human gate

- `serve`는 release gate와 local tag까지만 수행합니다.
- `git push`, `git push --tags`, package publish, app deploy, cloud deploy, external release API 호출은 별도 승인 없이는 실행하지 않습니다.
- `.hooks/release.sh`가 remote side effect를 만들 수 있으면 hook 실행도 별도 승인 대상입니다.
- approval 문구에는 대상 remote, tag, branch, deploy environment를 구체적으로 포함해야 합니다.

## Release gate summary

완료 시 repo 파일을 수정하지 않고 다음 정보를 최종 응답에 남깁니다.

```markdown
# Serve Summary: X.Y.Z
Status: tagged / blocked

## Inputs
- Wrap summary:
- Taste report:
- Target version:

## Gates
- Verify:
- Clean tree:
- Existing tag:

## Tag
- Tag:
- Commit:
- Message:

## Human approval required
- Push:
- Deploy/publish:
- Hook:

## Next
- Command to run after approval:
- Blocked reason:
```

## Hard rule

- autopilot은 절대 자동으로 `serve`를 실행하지 않습니다.
- release gate 실패를 tag, push, deploy로 우회하지 않습니다.
- tag, push, deploy 이력을 force로 덮어쓰지 않습니다.
- version/changelog mismatch는 `serve`에서 고치지 않고 `wrap`으로 되돌립니다.
- tag 생성 이후에도 작업 트리를 dirty하게 만들지 않습니다.
