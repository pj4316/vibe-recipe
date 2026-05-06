# Serve 동작 문서

`serve`는 `wrap`이 준비한 release set을 검증하고 local annotated tag를 만드는 top-level release gate skill입니다. remote push, deploy, publish는 별도 human approval 전에서 멈춥니다. tag 성공 뒤에는 release set에 포함된 active spec만 `librarian`으로 `done/`에 닫습니다.

## 목표

- `wrap` summary의 release set과 각 spec의 latest `taste` `APPROVE` verdict, `Release readiness: Ready for Wrap`을 확인합니다.
- version source, project changelog source target heading, tag name이 같은 version인지 검증합니다. mirror public manifests set이면 모든 manifest를 함께 확인합니다.
- `.agent/commands.json`의 `verify`를 release gate로 실행합니다.
- clean HEAD에 local annotated tag `vX.Y.Z`를 만듭니다.
- tag 성공 뒤 release set spec만 `done/`으로 이동하고 `.agent/spec/INDEX.md`를 재생성합니다. 제외된 active spec은 그대로 둡니다.
- push/deploy/publish 전에 필요한 승인과 command를 명확히 남깁니다.
- blocked면 reason만이 아니라 why/how-to-unblock까지 같이 남깁니다.

## Pre-flight gate

- 최신 `wrap` summary가 있고 target version이 version source와 project changelog source에 일치합니다. mirror public manifests set이면 모든 manifest가 target version과 일치해야 합니다.
- `wrap` summary에 release set specs와 excluded active specs가 명시되어 있습니다.
- release set에 포함된 각 spec의 최신 `taste` verdict가 `APPROVE`이고 `Release readiness: Ready for Wrap`입니다.
- release set에 포함되지 않은 active spec은 있어도 됩니다. 단, summary에 excluded active specs와 제외 이유가 있어야 합니다.
- project `verify` command가 green입니다. `verify`가 `null`이면 release는 blocked입니다.
- BLOCK 또는 REQUEST_CHANGES taste report가 pending 상태가 아닙니다.
- critical security/review finding이 없습니다.
- working tree가 clean입니다.
- tag `vX.Y.Z`가 이미 있으면 같은 commit을 가리키는지 확인합니다. 다른 commit이면 blocked입니다.

## Flow

1. Preflight: wrap summary, release set, taste verdicts, version source, project changelog source, clean tree, existing tag를 확인합니다.
2. Gate: `.agent/commands.json`의 `verify`를 실행하고 실패하면 `BLOCK`으로 멈춥니다.
3. Version check: version source, project changelog source heading, tag name이 모두 `X.Y.Z`로 일치하는지 확인합니다. mirror public manifests set이면 모든 manifest version을 검사합니다.
4. Tag: local annotated tag `vX.Y.Z`를 생성합니다.
5. Lifecycle close: tag가 성공하면 `librarian`이 release set spec만 `active/`에서 `done/`으로 이동하고 `.agent/spec/INDEX.md`를 재생성합니다.
6. Bookkeeping commit: lifecycle close 변경만 별도 `chore(spec): close vX.Y.Z release set` commit으로 남깁니다. tag는 release prep commit을 가리키며, bookkeeping commit은 tag 이후 workflow 정리입니다.
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

- `serve` 호출 자체는 release gate, local tag 생성, release set lifecycle close를 승인한 것으로 봅니다.
- `git push`, `git push --tags`, package publish, app deploy, cloud deploy, external release API 호출은 별도 승인 없이는 실행하지 않습니다.
- `.hooks/release.mjs`가 remote side effect를 만들 수 있으면 hook 실행도 별도 승인 대상입니다.
- approval 문구에는 대상 remote, tag, branch, deploy environment를 구체적으로 포함해야 합니다.

## Release gate summary 필수 항목

- wrap summary path, release set, taste report paths
- excluded active specs와 제외 이유
- target version, manifest, project changelog source heading
- `verify`, clean tree, existing tag 결과
- 생성하거나 확인한 tag와 commit
- `done/`으로 이동한 spec, `.agent/spec/INDEX.md` 재생성 결과, lifecycle bookkeeping commit
- push/deploy/publish 승인 필요 항목
- blocked reason, why this gate exists, how to unblock, 또는 approval 후 실행할 command
- lifecycle close 이후 작업 트리가 clean인지 여부

## 검증 포인트

`serve` 스킬을 변경할 때는 다음을 확인합니다.

```bash
test -f plugins/vibe-recipe/skills/serve/SKILL.md
test -f plugins/vibe-recipe/docs/skills/SERVE.md
grep -q 'vX.Y.Z' plugins/vibe-recipe/skills/serve/SKILL.md
grep -q 'release set' plugins/vibe-recipe/skills/serve/SKILL.md
grep -q 'Human gate' plugins/vibe-recipe/skills/serve/SKILL.md
node plugins/vibe-recipe/scripts/build-universal-agents-md.mjs /tmp/vibe-recipe-AGENTS.md
grep -q 'serve (release)' /tmp/vibe-recipe-AGENTS.md
```
