# Vibe Recipe Marketplace

이 저장소는 `vibe-recipe`를 위한 Codex 및 Claude Code 마켓플레이스 카탈로그입니다.

`vibe-recipe`는 에이전트를 위한 spec-driven 코딩 워크플로우 플러그인입니다. 요리 메타포 기반 skill, 전문 subagent, deterministic hook, 프로젝트 템플릿, adapter script를 함께 제공해 프로젝트 초기화부터 spec 작성, 구현, 리뷰, 릴리스까지 일관된 흐름으로 진행할 수 있게 합니다.

현재 플러그인 패키지는 spec을 `.agent/spec/active/NNNN-<slug>/{spec.md,tasks.md,memory.md}` 폴더로 관리합니다. `recipe`는 제품 의도를 `spec.md`에, `plate`는 구현 계획을 `tasks.md`에, `cook` 이후 handoff는 `memory.md`에 모읍니다.

플러그인 자체를 사용하려면 [plugins/vibe-recipe/README.md](plugins/vibe-recipe/README.md)부터 읽는 것이 맞습니다. 저장소 루트는 최종 사용자용 플러그인 패키지가 아니라 마켓플레이스/카탈로그 레이어입니다.

## 구조

```text
.agents/plugins/marketplace.json
.claude-plugin/marketplace.json
plugins/vibe-recipe/
  .codex-plugin/plugin.json
  .claude-plugin/plugin.json
  skills/
  agents/
  hooks/
  templates/
  scripts/
  docs/
```

저장소 루트는 마켓플레이스이고, 실제 플러그인 패키지는 `plugins/vibe-recipe` 아래에 있습니다.

## 설치와 사용

이 저장소는 두 레이어로 나눠 이해하면 됩니다.

- marketplace/catalog layer: 루트의 `marketplace.json` 파일이 `vibe-recipe`를 로컬 카탈로그 항목으로 노출합니다.
- plugin package layer: `plugins/vibe-recipe/` 안에 실제 manifest, skill, hook, template, script, 사용자 문서가 들어 있습니다.

설치 방법과 첫 실행 흐름은 아래 문서를 참고하면 됩니다.

- [plugins/vibe-recipe/README.md](plugins/vibe-recipe/README.md)
- [plugins/vibe-recipe/docs/INSTALL.md](plugins/vibe-recipe/docs/INSTALL.md)

짧게 요약하면 다음과 같습니다.

- Codex marketplace는 `.agents/plugins/marketplace.json`을 사용합니다.
- Claude Code는 `plugins/vibe-recipe/.claude-plugin/plugin.json`을 사용합니다.
- Cursor는 `plugins/vibe-recipe/scripts/install-cursor.mjs`를 사용합니다.
- Codex/Aider/Gemini CLI fallback은 `plugins/vibe-recipe/scripts/install-codex.mjs` 또는 `install-aider.mjs`를 사용합니다.
- `kitchen`이 초기화한 대상 프로젝트는 Claude Code용 `.claude/settings.json`과 Codex용 `.agent/setup/vibe-recipe-codex.mjs`를 통해 팀원이 같은 `vibe-recipe` 플러그인을 준비할 수 있게 합니다.

설치 후 가장 먼저 실행할 대표 명령은 아래와 같습니다.

```text
/vr:kitchen
```

## Marketplace 항목

Codex marketplace 정의는 `.agents/plugins/marketplace.json`에 있습니다.

Claude Code marketplace 정의는 `.claude-plugin/marketplace.json`에 있습니다.

두 카탈로그 모두 하나의 플러그인을 등록합니다.

- name: `vibe-recipe`
- source: `./plugins/vibe-recipe`
- category: `Productivity` for Codex, `productivity` for Claude Code

## 개발

관련 구조 검증은 아래 명령으로 실행합니다.

```bash
python3 -m json.tool .agents/plugins/marketplace.json >/dev/null
python3 -m json.tool .claude-plugin/marketplace.json >/dev/null
python3 -m json.tool plugins/vibe-recipe/hooks/hooks.json >/dev/null
node --check plugins/vibe-recipe/hooks/*.mjs plugins/vibe-recipe/scripts/*.mjs
node plugins/vibe-recipe/scripts/build-universal-agents-md.mjs /tmp/vibe-recipe-AGENTS.md
node plugins/vibe-recipe/scripts/verify-cross-platform.mjs
```

이 검증은 marketplace JSON 문법, hook/script shell 문법, universal `AGENTS.md` builder 동작을 확인합니다.
