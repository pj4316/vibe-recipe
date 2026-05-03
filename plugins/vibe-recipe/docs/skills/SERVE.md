# Serve 동작 문서

`serve`는 `wrap`이 준비한 release를 검증하고 local annotated tag를 만드는 top-level release gate skill입니다. remote push, deploy, publish는 별도 human approval 전에서 멈춥니다.

## 목표

- `wrap` summary와 latest `taste` `APPROVE` verdict를 확인합니다.
- manifest version, `CHANGELOG.md` target heading, tag name이 같은 version인지 검증합니다.
- `.agent/commands.json`의 `verify`를 release gate로 실행합니다.
- clean HEAD에 local annotated tag `vX.Y.Z`를 만듭니다.
- repo 파일은 수정하지 않고 release gate summary만 최종 응답에 남깁니다.
- push/deploy/publish 전에 필요한 승인과 command를 명확히 남깁니다.

## Pre-flight gate

- 최신 `wrap` summary가 있고 target version이 manifest와 `CHANGELOG.md`에 일치합니다.
- 최신 `taste` verdict가 `APPROVE`입니다.
- 예상치 못한 open active spec이 없습니다.
- project `verify` command가 green입니다. `verify`가 `null`이면 release는 blocked입니다.
- BLOCK 또는 REQUEST_CHANGES taste report가 pending 상태가 아닙니다.
- critical audit finding이 없습니다.
- working tree가 clean입니다.
- tag `vX.Y.Z`가 이미 있으면 같은 commit을 가리키는지 확인합니다. 다른 commit이면 blocked입니다.

## Flow

1. Preflight: wrap summary, taste verdict, manifest, changelog, clean tree, existing tag를 확인합니다.
2. Gate: `.agent/commands.json`의 `verify`를 실행하고 실패하면 `BLOCK`으로 멈춥니다.
3. Version check: manifest version, changelog heading, tag name이 모두 `X.Y.Z`로 일치하는지 확인합니다.
4. Tag: local annotated tag `vX.Y.Z`를 생성합니다.
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

- `serve` 호출 자체는 release gate와 local tag 생성을 승인한 것으로 봅니다.
- `git push`, `git push --tags`, package publish, app deploy, cloud deploy, external release API 호출은 별도 승인 없이는 실행하지 않습니다.
- `.hooks/release.sh`가 remote side effect를 만들 수 있으면 hook 실행도 별도 승인 대상입니다.
- approval 문구에는 대상 remote, tag, branch, deploy environment를 구체적으로 포함해야 합니다.

## Release gate summary 필수 항목

- wrap summary path와 taste report path
- target version, manifest, changelog heading
- `verify`, clean tree, existing tag 결과
- 생성하거나 확인한 tag와 commit
- push/deploy/publish 승인 필요 항목
- blocked reason 또는 approval 후 실행할 command
- tag 생성 이후 작업 트리가 여전히 clean인지 여부

## 검증 포인트

`serve` 스킬을 변경할 때는 다음을 확인합니다.

```bash
test -f plugins/vibe-recipe/skills/serve/SKILL.md
test -f plugins/vibe-recipe/docs/skills/SERVE.md
grep -q 'vX.Y.Z' plugins/vibe-recipe/skills/serve/SKILL.md
grep -q 'Human gate' plugins/vibe-recipe/skills/serve/SKILL.md
plugins/vibe-recipe/scripts/build-universal-agents-md.sh /tmp/vibe-recipe-AGENTS.md
grep -q 'serve (release)' /tmp/vibe-recipe-AGENTS.md
```
