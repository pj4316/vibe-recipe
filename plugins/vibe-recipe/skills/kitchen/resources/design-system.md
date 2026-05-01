# 디자인 시스템 템플릿

> Kitchen 리소스입니다. frontend/UI 프로젝트에만 생성합니다.
> 실제 UI가 처음 만들어진 뒤 `/vr:plate`로 실제 사용 패턴을 반영해 이 seed를 다듬습니다.

## 제품 UI 의도

- 제품 설명: {{product_pitch}}
- 핵심 사용자: {{primary_user}}
- 핵심 workflow: {{core_workflow}}
- UI 우선순위: 명확성, 반복 사용성, 접근성, 제품 고유 affordance.

## Reference와 밀도

- Reference 방향: {{ui_reference}}
- Density: {{ui_density}}
- 모를 때 기본값: operational SaaS, comfortable density.
- 제품이 명시적으로 brand/landing 중심이 아니라면 순수 marketing layout을 피합니다.

## Mode와 접근성

- Color mode: {{ui_mode}}
- 본문 text contrast는 WCAG AA를 만족해야 합니다.
- interactive control에는 보이는 focus state가 필요합니다.
- state를 color만으로 전달하지 않습니다.
- animation은 reduced-motion preference를 존중합니다.

## Token

ad hoc value보다 token을 먼저 사용합니다.

### 색상

- `--color-bg`
- `--color-fg`
- `--color-muted`
- `--color-border`
- `--color-accent`
- `--color-danger`
- `--color-success`
- `--color-warning`

### Typography

- `text-xs`
- `text-sm`
- `text-base`
- `text-lg`
- `text-xl`

### Spacing

- `4`
- `8`
- `12`
- `16`
- `24`
- `32`
- `48`
- `64`

### Radius와 Elevation

- Radius: `0`, `4`, `8`, `16`, `999`
- Shadow: `none`, `sm`, `md`

## Component Primitive

빈 정의로 시작합니다. 실제 UI가 생긴 뒤 채웁니다.

- Button:
- Input:
- Select:
- Checkbox/Switch:
- Dialog:
- Table/List:
- Navigation:
- Empty state:
- Error state:

## Composition 규칙

- marketing 설명보다 실제로 사용할 수 있는 화면을 먼저 만듭니다.
- operational screen은 밀도 있게 만들되 훑어보기 쉬워야 합니다.
- control, list, table, loading state에는 stable dimension을 사용합니다.
- button copy는 짧고 action-oriented하게 유지합니다.
- hidden hover-only behavior보다 보이는 state, label, affordance를 선호합니다.
- 중요한 제품 state는 developer tools 없이 확인 가능해야 합니다.

## Anti-pattern

- tool에는 기본적으로 decorative gradient, blob, 큰 hero treatment를 추가하지 않습니다.
- page layout에서 card 안에 card를 중첩하지 않습니다.
- 기록 없이 one-off color, spacing, radius, typography를 만들지 않습니다.
- 명확한 확인 없이 destructive action을 숨기지 않습니다.
- text가 control 밖으로 넘치거나 인접 content와 겹치게 두지 않습니다.

## Plate 후속 지침

UI 화면이 하나 또는 두 개 생긴 뒤 `/vr:plate`를 실행합니다.

`plate`는 다음을 수행해야 합니다.

1. 실제 color, spacing, typography, radius, primitive를 inventory로 정리합니다.
2. 구현과 이 seed를 비교합니다.
3. 반복되는 값을 token으로 통합합니다.
4. 수락된 primitive와 anti-pattern을 기록합니다.
5. code migration이 필요하면 `tidy`를 제안합니다.

## Best-practice 근거

- design token, primitive, composition rule, anti-pattern을 분리합니다.
- seed는 의도적으로 작게 유지하고, 실제 제품 UI를 기준으로 다듬습니다.
