---
name: plate
description: /vr:plate 또는 /vr:design-tune 호출 시 사용합니다. 첫 화면들이 만들어진 뒤 UI token과 design-system drift를 다듬습니다.
---

# plate (design-tune) - 플레이팅 다듬기

실제 UI 화면이 한두 개 만들어진 뒤 사용합니다.

`plate`는 UI implementation과 `.agent/wiki/design-system.md` 사이의 drift를 정리하는 design-system skill입니다. 목적은 실제 화면에서 반복되는 token, primitive, composition pattern을 관찰하고 design-system policy를 보강하는 것입니다.

## 시작 조건

- 사용자가 `/vr:plate`, `/vr:design-tune`, UI polish, design-system drift, token 정리를 요청했습니다.
- 실제 UI 화면이나 component가 최소 1-2개 존재합니다.
- `.agent/wiki/design-system.md`와 관련 frontend code, component library, styling config를 읽었습니다.
- `git status --short`로 작업 트리를 확인했고, 관련 없는 사용자 변경을 되돌리지 않습니다.
- 새 기능, UX flow 변경, component behavior 변경이 필요하면 `recipe` 또는 `cook`으로 라우팅합니다.

## 점검 범위

| 범위 | 확인 내용 |
| --- | --- |
| Color | semantic token, contrast, state color, one-off hex |
| Spacing | scale, layout gap, padding, section rhythm |
| Typography | font family, size scale, line height, heading/body hierarchy |
| Radius/shadow/border | primitive consistency, card/input/button treatment |
| Components | repeated composition, primitive reuse, variant explosion |
| Responsive | breakpoint behavior, overflow, touch target, text wrapping |
| Accessibility | contrast, focus state, semantic affordance, motion sensitivity |

`plate`는 디자인 취향을 임의로 바꾸지 않습니다. 실제 구현에서 반복되는 pattern과 drift만 다룹니다.

## 흐름

1. `.agent/wiki/design-system.md`와 frontend convention을 읽습니다.
2. 색, spacing, font size, radius, primitive, 반복 composition pattern을 inventory합니다.
3. 실제 구현을 seed token과 비교합니다.
4. token 통합, 추가, anti-pattern entry를 추천합니다.
5. 제안된 변경을 먼저 보여준 뒤 `design-system.md`를 갱신합니다.
6. code migration이 필요하면 `tidy`를 제안합니다.

## Inventory 형식

```markdown
## UI Inventory
- Screens/components checked:
- Styling system:
- Repeated tokens:
- One-off values:
- Drift from design-system:
- Accessibility concerns:
```

## 변경 정책

- `design-system.md`의 token/pattern policy rewrite는 `plate`가 담당합니다.
- code migration은 기본적으로 `tidy` 책임입니다. `plate`는 migration plan과 affected files만 제안합니다.
- 단순 문서 보강은 사용자가 요청했거나 drift 근거가 명확할 때만 수행합니다.
- product behavior, route, data flow, state machine, API contract는 변경하지 않습니다.
- visual change가 사용자 경험을 바꾸는 수준이면 `recipe`로 spec을 먼저 만듭니다.

## Preview gate

`design-system.md`를 갱신하기 전에 아래 preview를 먼저 보여줍니다.

```markdown
# Plate Preview
Status: ready / blocked

## Proposed design-system updates
- Token:
- Pattern:
- Anti-pattern:

## Migration recommendation
- Needs code migration: yes / no
- Recommended skill: tidy / recipe / none
- Affected files:

## Risks
- Accessibility:
- Responsive:
- Product behavior:
```

명시 승인 없이 대규모 section regenerate, token rename, component variant 통합을 수행하지 않습니다.

## Handoff 형식

권장 경로는 `.agent/spec/handoffs/NNNN-plate.md` 또는 UI spec이 없을 때 최종 응답입니다.

```markdown
# Plate Summary
Status: updated / proposed / blocked

## Inventory
- Screens/components:
- Drift:

## Design-system changes
- Updated sections:
- Token decisions:
- Anti-patterns:

## Migration
- Recommended next skill:
- Affected files:
- Verification:
```

## Escalation

| 상황 | 다음 skill |
| --- | --- |
| UI behavior나 product flow 변경이 필요함 | `recipe` |
| token/pattern 결정 후 코드 이관이 필요함 | `tidy` |
| 구현 중 UI regression이나 failing check 발생 | `fix` |
| 변경 검수가 필요함 | `taste` |
| frontend convention 자체가 불명확함 | `forage` 또는 `recipe` |

## 규칙

- `design-system.md` section regenerate는 `plate`만 수행합니다.
- 다른 skill은 observation을 append할 수 있지만 token policy를 rewrite하면 안 됩니다.
- accessibility contrast와 responsive behavior를 유지합니다.
- 새 landing page, visual redesign, component behavior 추가를 design tune으로 포장하지 않습니다.

## 완료 조건

- 실제 UI 화면/component를 기준으로 inventory를 작성했습니다.
- drift와 반복 pattern이 evidence와 함께 정리되었습니다.
- design-system 갱신안과 code migration 필요 여부가 분리되었습니다.
- accessibility contrast와 responsive behavior risk를 확인했습니다.
- 다음 단계가 `tidy`, `recipe`, `taste`, `fix` 중 하나로 분명합니다.
