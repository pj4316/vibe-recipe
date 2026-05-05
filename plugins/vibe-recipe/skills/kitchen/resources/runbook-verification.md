# 검증 런북

`.agent/commands.json`의 `verify` command를 project-wide gate로 사용합니다.

## Plugin bootstrap 확인

1. Claude Code 참여자는 `.claude/settings.json`에 `vibe-recipe@vibe-recipe-marketplace`가 enabled인지 확인합니다.
2. Codex 참여자는 프로젝트 루트에서 `node .agent/setup/vibe-recipe-codex.mjs`를 실행합니다.
3. Codex bootstrap은 `~/.codex/config.toml`을 백업한 뒤 `codex plugin marketplace add https://github.com/pj4316/vibe-recipe.git`와 plugin enablement 패치를 수행합니다.
4. 새 Codex/Claude Code 세션을 열고 `kitchen`, `recipe`, `cook`, `taste` skill이 사용 가능한지 확인합니다.

## Merge 전

1. 변경된 surface에 대한 focused test를 실행합니다.
2. UI/browser workflow가 바뀌었다면 `.agent/commands.json`의 `e2e` command를 실행합니다.
3. `e2e` command가 없으면 Playwright MCP로 핵심 Given/When/Then scenario를 확인하고 manual evidence를 남깁니다.
4. project verify command를 실행합니다.
5. 실행한 command와 결과를 handoff에 기록합니다.

## E2E가 필요한 경우

- 사용자가 browser에서 수행하는 multi-step workflow가 바뀐 경우.
- auth, payment, destructive action, data-loss 가능성이 있는 UI가 바뀐 경우.
- routing, form validation, loading/error/empty state, accessibility tree interaction이 중요한 경우.
- bug fix가 browser-only regression을 막기 위한 경우.

## Verification 실패 시

1. 처음 실패한 command를 기록합니다.
2. 동작이 깨졌다면 `fix/debug`를 사용합니다.
3. acceptance criteria가 잘못되었다면 `recipe/plan`을 사용합니다.
