# Tidy 동작 문서

`tidy`는 동작 변경 없이 구조를 개선하는 refactor skill입니다. 사용자는 `/vr:tidy`로 호출할 수 있습니다.

`tidy`는 feature 추가나 acceptance 변경을 하지 않습니다. 기존 behavior를 보존한다는 증거를 남기고, shallow module이나 흩어진 policy를 더 깊고 응집도 높은 module로 정리합니다.

## 목표

- 변경 전 behavior를 test, snapshot, fixture, command, manual check 중 하나로 포착합니다.
- shallow wrapper, pass-through layer, duplicate policy, 모호한 boundary를 식별합니다.
- 작은 public interface 뒤에 내부 복잡도와 invariant를 숨기는 deep module 방향으로 재구성합니다.
- 변경 후 focused check와 가능한 `verify`를 실행합니다.
- 동등성 근거와 architecture 개선 의도를 `Tidy Summary`로 남깁니다.

## 시작 조건

| 조건 | 처리 |
| --- | --- |
| 기존 test가 있음 | focused test를 baseline으로 사용 |
| test가 없음 | characterization test/check를 먼저 만듦 |
| behavior 변경이 필요함 | `recipe` 또는 `plate`/`cook`으로 라우팅 |
| design token 결정이 필요함 | `recipe`로 design-system policy 결정 |
| regression이 발생함 | `fix`로 라우팅 |
| architecture tradeoff가 큼 | `forage`로 ADR 후보 작성 |

## Refactor Scope

허용:

- naming 정리
- module boundary 개선
- shallow wrapper 제거
- duplicate policy consolidation
- performance-neutral simplification
- design-system migration의 코드 이관

금지:

- feature addition
- acceptance criteria 변경
- schema/data migration
- public API contract 변경
- release version/changelog/tag

## 동등성 증명

`tidy`는 “동작 변경 없음”을 검증 근거 없이 주장하지 않습니다.

- 기존 test가 있으면 가장 좁은 focused test를 먼저 실행합니다.
- test가 없으면 characterization test, snapshot, golden fixture, CLI output, API contract check, manual check 중 하나를 먼저 만듭니다.
- UI refactor는 visual behavior, responsive behavior, accessibility-critical behavior가 유지되는지 확인합니다.
- manual check는 확인자, 확인 항목, 자동화하지 못한 이유를 남깁니다.

## Subagent 연계

| Subagent | 사용 시점 |
| --- | --- |
| `implementor` | 작은 refactor slice를 맡길 때 |
| `tester` | 동등성 검증 방법과 focused command 판단 |
| `reviewer` | architecture boundary, public interface, local convention 확인 |

worker에게는 다른 작업자가 있을 수 있고, 관련 없는 변경이나 다른 worker의 변경을 되돌리지 말라고 명시합니다.

## Handoff 필수 항목

권장 경로는 `.agent/spec/handoffs/NNNN-tidy.md`입니다.

- refactor goal
- non-behavior-change boundary
- changed files
- before check
- after check
- manual check
- shallow module removed
- deep module/interface
- convention/design docs updated
- remaining risk
- next skill

## Loop Recommendation

- refactor 후 검수가 필요하면 `taste`.
- regression/failing test가 있으면 `fix`.
- behavior나 acceptance가 바뀌어야 하면 `recipe`.
- design token/pattern 결정이 필요하면 `recipe`.
- 기술/architecture tradeoff가 크면 `forage`.

## 검증 포인트

`tidy` 스킬을 변경할 때는 다음을 확인합니다.

```bash
test -f plugins/vibe-recipe/skills/tidy/SKILL.md
test -f plugins/vibe-recipe/docs/skills/TIDY.md
grep -q 'Tidy Summary' plugins/vibe-recipe/skills/tidy/SKILL.md
grep -q '동등성 증명' plugins/vibe-recipe/skills/tidy/SKILL.md
node plugins/vibe-recipe/scripts/build-universal-agents-md.mjs /tmp/vibe-recipe-AGENTS.md
grep -q 'tidy (refactor)' /tmp/vibe-recipe-AGENTS.md
```

스크립트나 JSON을 함께 수정했다면 해당 파일에는 별도 문법 검증을 실행합니다.
