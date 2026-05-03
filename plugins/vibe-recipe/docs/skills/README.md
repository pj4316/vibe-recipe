# 스킬 문서

스킬별 동작 문서를 모아둡니다. 각 문서는 실제 `skills/<name>/SKILL.md`의 운영 계약을 사람이 읽기 쉬운 형태로 설명합니다.

## Skill 역할 구분

| 역할 | 의미 | 대표 스킬 |
| --- | --- | --- |
| Top-level orchestrator skill | 사용자가 직접 호출하고 workflow를 지휘합니다. 필요한 subagent를 조율하고 다음 loop를 추천합니다. | `cook`, `taste`, `autopilot`, `serve` |
| Planning skill | 구현 전 제품 의도, scope, acceptance, task를 확정합니다. | `grill`, `kitchen`, `recipe`, `forage` |
| Execution/support skill | 특정 변경, 진단, 정리, release 준비를 수행합니다. | `fix`, `tidy`, `plate`, `wrap`, `peek`, `inspect` |

Subagent는 `plugins/vibe-recipe/agents/`에 있으며 top-level skill이 필요한 단위 작업을 위임할 때만 사용합니다. 예를 들어 `taste`는 skill이고, `reviewer`, `security-auditor`, `red-team`은 subagent입니다.

| 문서 | 대상 스킬 | 내용 |
| --- | --- | --- |
| `AUTOPILOT.md` | `autopilot` | opt-in bounded run, budget, checkpoint, stop gates |
| `COOK.md` | `cook` | recipe 전체 구현 지휘, task-runner orchestration, acceptance matrix |
| `FIX.md` | `fix` | 실패 재현, root cause 분류, regression coverage, escalation |
| `FORAGE.md` | `forage` | 기술 선택 조사, option 비교, proposed ADR |
| `GRILL.md` | `grill` | 의도 정렬 인터뷰, Alignment Brief, kitchen/recipe 연계 |
| `INSPECT.md` | `inspect` | read-only audit, release readiness, risk finding |
| `KITCHEN.md` | `kitchen` | 초기 project harness 구성, 생성 파일, mode, 완료 기준 |
| `PEEK.md` | `peek` | read-only status, active spec, next skill routing |
| `RECIPE.md` | `recipe` | Alignment Brief 기반 spec 작성, domain 용어집, ADR 후보 |
| `TASTE.md` | `taste` | review orchestration, verdict, loop recommendation |
| `WRAP.md` | `wrap` | SemVer 판정, version/changelog 준비, release prep commit |
| `SERVE.md` | `serve` | release gate, local annotated tag, push/deploy human gate |

새 스킬을 검증해 커밋할 때는 해당 스킬의 동작 문서를 이 디렉터리에 추가합니다.
