# Plate 동작 문서

`plate`는 실제 UI 구현과 `.agent/wiki/design-system.md` 사이의 drift를 정리하는 design-system skill입니다. 사용자는 `/vr:plate` 또는 개발자 alias `/vr:design-tune`으로 호출할 수 있습니다.

`plate`는 새 기능이나 UX flow를 만들지 않습니다. 실제 화면에서 반복되는 token, primitive, composition pattern을 관찰하고 design-system policy를 보강합니다.

## 목표

- UI 화면/component 1-2개 이상을 inventory합니다.
- color, spacing, typography, radius, shadow, component composition drift를 찾습니다.
- 반복 pattern, one-off value, anti-pattern을 분리합니다.
- `.agent/wiki/design-system.md` 갱신안을 preview합니다.
- code migration이 필요하면 `tidy`로 넘깁니다.

## 점검 범위

| 범위 | 확인 내용 |
| --- | --- |
| Color | semantic token, contrast, state color, one-off hex |
| Spacing | scale, layout gap, padding, section rhythm |
| Typography | font family, size scale, line height, hierarchy |
| Radius/shadow/border | primitive consistency, card/input/button treatment |
| Components | repeated composition, primitive reuse, variant explosion |
| Responsive | breakpoint behavior, overflow, touch target, text wrapping |
| Accessibility | contrast, focus state, semantic affordance, motion sensitivity |

## 변경 정책

- `design-system.md`의 token/pattern policy rewrite는 `plate`가 담당합니다.
- code migration은 기본적으로 `tidy` 책임입니다.
- 단순 문서 보강은 drift 근거가 명확할 때만 수행합니다.
- product behavior, route, data flow, state machine, API contract는 변경하지 않습니다.
- visual change가 사용자 경험을 바꾸는 수준이면 `recipe`로 spec을 먼저 만듭니다.

## Preview Gate

`design-system.md`를 갱신하기 전에 아래 내용을 먼저 제시합니다.

- proposed token updates
- proposed component pattern updates
- anti-pattern entries
- migration 필요 여부
- affected files
- accessibility/responsive risk

명시 승인 없이 대규모 section regenerate, token rename, component variant 통합을 수행하지 않습니다.

## Handoff 필수 항목

권장 경로는 `.agent/spec/handoffs/NNNN-plate.md`입니다. UI spec이 없으면 최종 응답에 같은 내용을 남깁니다.

- screens/components checked
- styling system
- repeated tokens
- one-off values
- drift from design-system
- accessibility concerns
- updated design-system sections
- migration recommendation
- verification

## Loop Recommendation

- token/pattern 결정 후 코드 이관이 필요하면 `tidy`.
- UI behavior나 product flow 변경이 필요하면 `recipe`.
- 구현 중 UI regression이 발견되면 `fix`.
- 변경 검수가 필요하면 `taste`.
- frontend convention 자체가 불명확하면 `forage` 또는 `recipe`.

## 검증 포인트

`plate` 스킬을 변경할 때는 다음을 확인합니다.

```bash
test -f plugins/vibe-recipe/skills/plate/SKILL.md
test -f plugins/vibe-recipe/docs/skills/PLATE.md
grep -q 'Plate Preview' plugins/vibe-recipe/skills/plate/SKILL.md
grep -q 'UI Inventory' plugins/vibe-recipe/skills/plate/SKILL.md
plugins/vibe-recipe/scripts/build-universal-agents-md.sh /tmp/vibe-recipe-AGENTS.md
grep -q 'plate (design-tune)' /tmp/vibe-recipe-AGENTS.md
```

스크립트나 JSON을 함께 수정했다면 해당 파일에는 별도 문법 검증을 실행합니다.
