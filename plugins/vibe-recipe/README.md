# vibe-recipe

> 따라갈 수 있는 레시피가 있는 vibe coding.

`vibe-recipe`는 코딩 에이전트를 위한 stack-agnostic, spec-driven 개발 플러그인입니다. 비개발자에게는 따라가기 쉬운 요리 메타포를 제공하고, 개발자에게는 프로젝트 초기화부터 계획, 구현, 리뷰, 릴리스까지 일관된 운영 흐름을 제공합니다.

## 포함 내용

- 프로젝트 초기화부터 릴리스까지 다루는 11개의 top-level skill
- 계획, 구현, 리뷰, 테스트, 보안을 위한 전문 subagent
- 위험한 작업을 통제하는 deterministic hook과 guardrail
- `.agent/`, `AGENTS.md`, runbook, health-check spec 생성을 위한 scaffold template
- Cursor, Codex, Aider, Gemini CLI fallback 흐름을 위한 설치 adapter

## 설치

사용 환경에 맞는 경로를 선택하면 됩니다.

### Claude Code

Claude 전용 metadata는 아래 파일에 있습니다.

```text
plugins/vibe-recipe/.claude-plugin/plugin.json
```

slash namespace는 `vr`이므로 명령은 `/vr:*` 형태를 사용합니다.

### Codex Marketplace

이 저장소는 로컬 marketplace 카탈로그로도 사용할 수 있습니다. 카탈로그 항목은 아래 파일에 있습니다.

```text
.agents/plugins/marketplace.json
```

이 항목은 실제 플러그인 패키지인 아래 경로를 가리킵니다.

```text
./plugins/vibe-recipe
```

### Cursor

대상 프로젝트에서 아래 명령을 실행합니다.

```bash
bash /path/to/vibe-recipe/plugins/vibe-recipe/scripts/install-cursor.sh
```

이 스크립트는 `.cursor/rules/vibe-recipe.mdc`를 생성하며, 기존 파일이 있으면 먼저 백업합니다.

### Codex, Aider, Gemini CLI Fallback

도구가 플러그인을 네이티브로 읽지 못한다면, 패키지에 포함된 skill과 subagent를 합쳐 하나의 `AGENTS.md`를 생성해서 사용할 수 있습니다.

대상 프로젝트에서 아래 명령을 실행합니다.

```bash
bash /path/to/vibe-recipe/plugins/vibe-recipe/scripts/install-codex.sh
```

or:

```bash
bash /path/to/vibe-recipe/plugins/vibe-recipe/scripts/install-aider.sh
```

Gemini CLI도 같은 방식으로 생성된 `AGENTS.md`를 사용할 수 있습니다. 환경에서 다른 instruction 파일명을 기대한다면 target path를 명시해서 넘기면 됩니다.

## 빠른 시작

설치 후에는 아래 명령으로 프로젝트 harness를 초기화합니다.

```text
/vr:kitchen
```

`kitchen`은 저장소를 점검하고, 제품 관점의 초기 설정 질문을 진행한 뒤, `AGENTS.md`, `.agent/`, command profile, runbook, 첫 health-check spec 같은 프로젝트 harness를 준비합니다.

## 기본 사용 흐름

### 새 기능 계획하기

```text
/vr:recipe
```

구현 전에 번호가 붙은 spec을 만들고 싶을 때 사용합니다.

### 승인된 spec 구현하기

```text
/vr:cook
```

`recipe`가 승인된 뒤에 사용합니다.

### 결과 검토하기

```text
/vr:taste
```

merge 전에 쓰거나, fix/refactor 루프 이후 결과를 검토할 때 사용합니다.

## 자주 쓰는 워크플로우

### 안전한 첫 리허설

```text
/vr:recipe
/vr:cook
/vr:taste
/vr:wrap
```

의도적으로 release gate를 돌리는 상황이 아니라면 `/vr:serve` 전에 멈추는 것이 맞습니다.

### 일반적인 기능 개발 루프

```text
/vr:forage
/vr:recipe
/vr:cook
/vr:taste
```

접근 방식이 이미 분명하다면 `forage`는 생략해도 됩니다.

### 디버그 루프

```text
/vr:fix
/vr:taste
```

실제 문제가 코드가 아니라 spec 자체에 있다면 `fix`는 다시 `recipe`로 되돌릴 수 있습니다.

### 릴리스 준비와 릴리스 게이트

```text
/vr:wrap
/vr:serve
```

`wrap`은 version과 changelog 변경을 준비하고, `serve`는 release check를 실행한 뒤 human-approved push 또는 deploy 직전에 멈춥니다.

### Autopilot 루프

승인된 active spec이 준비된 뒤에는 아래처럼 실행할 수 있습니다.

```bash
plugins/vibe-recipe/scripts/autopilot-run.sh --repo . --tool codex --max-iterations 10
```

파일을 바꾸지 않고 어떤 작업이 실행될지 미리 보고 싶다면:

```bash
plugins/vibe-recipe/scripts/autopilot-run.sh --repo . --dry-run --once
```

`autopilot`은 한 번에 하나의 unchecked task만 처리하고, 기본적으로 `taste`에서 멈추며, `serve`, push, deploy, publish는 자동으로 실행하지 않습니다.

## Skill 목록

| Skill | 설명 |
| --- | --- |
| `kitchen` | `.agent/`, `AGENTS.md`, hook, template, 첫 health-check spec를 포함한 프로젝트 초기 구성을 수행합니다. |
| `peek` | spec, git 문맥, review, autopilot 상태를 읽기 전용으로 요약합니다. |
| `forage` | 계획 전에 선택지를 비교하고 ADR 초안을 만듭니다. |
| `recipe` | 요청을 번호가 붙은 feature spec으로 바꿉니다. |
| `cook` | 승인된 task를 하나씩 구현합니다. |
| `fix` | 실패를 진단하고 코드를 수정하거나 spec 이슈로 escalation합니다. |
| `tidy` | 동작을 유지한 채 구조를 개선합니다. |
| `taste` | regression, coverage, review, security, red-team 점검을 실행합니다. |
| `wrap` | SemVer를 결정하고 changelog/version 변경을 준비합니다. |
| `serve` | release gate를 실행하고 human-approved push 직전에 멈춥니다. |
| `autopilot` | opt-in된 forage -> recipe -> cook -> taste 자동 루프를 실행합니다. |

## 문서

- `docs/INSTALL.md`: 환경별 설치 경로
- `docs/COOKBOOK.md`: 예시 운영 흐름
- `docs/CUSTOMIZATION.md`: template, hook, command contract, customization 규칙
