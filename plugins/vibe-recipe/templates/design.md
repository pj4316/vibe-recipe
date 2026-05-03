# Technical Design

Status: Fallback Skeleton

> `kitchen/init`은 이 skeleton을 그대로 복사하지 않고, 제품 답변과 repo 감지 결과로 프로젝트별 design.md를 생성합니다.

## Product Context

- Product pitch: generated from kitchen product brief.
- Primary user: generated from kitchen product brief.
- MVP capabilities: generated from kitchen MVP answers.
- Anti-scope: generated from kitchen MVP answers.

## Stack And Runtime Detection

- Stack: inferred from repository files.
- Package manager: inferred from lockfiles.
- Runtime: inferred from project files.
- Frontend/backend hints: inferred from folder structure and dependencies.

## Architecture Inference

- Choose the simplest architecture matching the repository structure.
- Do not invent services, databases, queues, or external APIs unless detected or confirmed by product answers.

## Data And Integrations

- Data store: none assumed unless detected or confirmed.
- External APIs: none assumed unless detected or confirmed.
- Auth/payment: human approval required before adding or changing.

## Command Profile

Commands live in `.agent/commands.json`.

```json
{
  "setup": null,
  "build": null,
  "test": null,
  "e2e": null,
  "lint": null,
  "verify": null,
  "dev": null
}
```

## Verification Strategy

- `.agent/commands.json` `verify` is the release gate.
- If `verify` is `null`, release is blocked until a project verify command is configured.
- Focused commands may be used during implementation, but release requires the project verify command.

## Recommended Defaults Applied

- `kitchen`이 제품 질문에서 “잘 모르겠어요” 답변을 받은 경우, 적용한 기본값과 이유를 여기에 기록합니다.
