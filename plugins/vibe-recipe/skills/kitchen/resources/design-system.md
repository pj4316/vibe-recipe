# 디자인 시스템 플레이북

> Kitchen 리소스입니다. frontend/UI 프로젝트에만 생성합니다.
> 실제 UI가 처음 만들어진 뒤 design-system 정책 변경은 `/vr:recipe`로 spec을 만들고, 동작 보존 token/component migration은 `/vr:tidy`로 처리합니다.
> 이 문서의 목적은 “예쁜 문서”가 아니라, agent와 사람이 같은 UI 정책을 재사용하도록 만드는 것입니다.
> 사용자가 UI 방향을 지정하지 않으면 선택된 preset과 theme의 기본 stance를 적용합니다. 사용자 입력과 repo facts가 있으면 그것이 우선합니다.

## Preset defaults applied

- Selected preset: {{preset_type}}
- Selection reason: {{preset_reason}}
- Selected theme: {{theme_name}}
- Theme reason: {{theme_reason}}
- Precedence: user explicit input -> repo facts -> preset defaults -> generic fallback
- Reference direction: {{ui_reference}}
- Density: {{ui_density}}
- Color mode: {{ui_mode}}
- Component priority: {{component_priority}}
- Composition stance: {{composition_stance}}

이 문서는 preset/theme를 참조하는 메모가 아니라, 선택된 preset/theme를 바탕으로 kitchen이 생성 시 값을 주입한 결과물입니다.

## Theme packet extracted

선택된 theme의 실제 값을 아래에 반영합니다. 설명형 요약만 남기지 말고, 가능한 한 token/value 수준으로 씁니다.

### Color palette

- brand tokens:
- brand usage notes:
- neutral/surface tokens:
- semantic tokens:
- border/focus tokens:
- data-viz/category tokens:
- dark-mode mapping:

### Typography

- ui font stack:
- mono/display font stack:
- fallback font policy:
- heading weights:
- heading scale:
- body weights:
- body/caption scale:
- number/data emphasis rule:

### Spacing and radius

- spacing base:
- common spacing tokens:
- control height tokens:
- content width/layout tokens:
- radius tokens:
- shadow/elevation tokens:
- density mode or layout note:

### Button design

- primary button:
- secondary or soft button:
- ghost or tertiary button:
- hover/pressed/focus behavior:

### Chip / badge

- shape and radius:
- background/text pair:
- padding:
- icon size:

### Icon style

- icon family tone:
- outline vs filled:
- default size:
- semantic usage rule:

### Card and field

- card:
- input/field:
- focus ring:
- validation states:

### Navigation and selection patterns

- app shell / sidebar:
- tabs / segmented control:
- selected row / selected card:
- breadcrumb / local nav:

### Table and data display

- header styling:
- row density and zebra/highlight rule:
- numeric alignment and tabular numeral rule:
- status badge / inline status pattern:

### Overlay and feedback patterns

- dialog / drawer surface:
- toast / inline alert:
- skeleton / loading placeholder:
- empty state visual tone:

## 제품 UI 의도

- 제품 설명: {{product_pitch}}
- 핵심 사용자: {{primary_user}}
- 핵심 workflow: {{core_workflow}}
- Reference 방향: {{ui_reference}}
- Density: {{ui_density}}
- Color mode: {{ui_mode}}
- UI 우선순위: 명확성, 반복 사용성, 접근성, 제품 고유 affordance.
- 모를 때 기본값: operational SaaS, comfortable density, system color mode.
- 제품이 명시적으로 brand/landing 중심이 아니라면 순수 marketing layout을 피합니다.

## Foundations

### Accessibility

- keyboard만으로 주요 workflow를 완료할 수 있어야 합니다.
- 모든 interactive control에는 보이는 focus state가 필요합니다.
- focus indicator는 hover와 별개로 유지되고 time limit 없이 남아 있어야 합니다.
- state를 color만으로 전달하지 않습니다. text, icon, pattern, outline 중 하나를 함께 둡니다.
- 본문 text contrast는 WCAG AA를 만족해야 합니다.
- motion은 reduced-motion preference를 존중합니다.
- screen reader가 아니어도 sighted keyboard user가 현재 위치를 알 수 있어야 합니다.

### Content

- label, helper text, empty state, error state copy는 짧고 task-oriented하게 씁니다.
- button copy는 동사로 시작하고, “확인”, “제출” 같은 모호한 단어만 단독으로 쓰지 않습니다.
- destructive action은 결과를 숨기지 않고, 가능한 경우 영향을 미리 설명합니다.
- system status는 developer tools 없이도 사용자 화면에서 확인 가능해야 합니다.

### Spacing and Grid

- spacing은 ad hoc 값 대신 token을 사용합니다.
- list, table, form row처럼 반복되는 UI는 vertical rhythm이 일정해야 합니다.
- operational screen은 정보 밀도를 확보하되 scan이 가능해야 합니다.
- card 안에 card를 기본 레이아웃으로 중첩하지 않습니다.

### Color

- color는 brand 표현보다 상태 구분과 가독성을 먼저 만족해야 합니다.
- surface, text, border, accent, success, warning, danger는 semantic token으로 사용합니다.
- chart나 multi-series 구분이 필요하면 색 외에 label/pattern/marker를 함께 둡니다.

### Typography

- typographic hierarchy는 body, section heading, page heading, data emphasis 수준으로 유지합니다.
- 숫자, 상태, 짧은 label은 scan을 돕는 쪽으로 weight와 spacing을 정합니다.
- 과도한 font size variety를 만들지 않습니다.

### Motion

- motion은 방향성과 상태 전환을 설명할 때만 씁니다.
- decorative animation, large parallax, autoplay-like motion은 기본값으로 두지 않습니다.
- loading state는 motion 없이도 의미가 전달돼야 합니다.

### Iconography

- icon은 label을 대체하지 않고 보강합니다.
- 제품 고유 iconography를 만들기 전에는 action semantics가 분명한 표준 icon을 우선합니다.
- 같은 action에 다른 icon을 섞어 쓰지 않습니다.

### Empty, Loading, Error States

- empty state는 “왜 비었는지 + 다음 action”을 함께 보여줍니다.
- loading state는 skeleton 또는 stable placeholder로 layout jump를 줄입니다.
- error state는 문제 설명, retry path, support/contact path 중 필요한 것을 제공합니다.

## Token Hierarchy

ad hoc value보다 token을 먼저 사용합니다. token은 아래 3층으로 관리합니다.

### 1. Primitive token

- raw value를 담습니다.
- 내부 참조용입니다. component가 직접 primitive를 읽지 않습니다.
- 예시 category:
  - color scale
  - font family / weight / line-height
  - spacing scale
  - radius scale
  - shadow/elevation scale
  - motion duration / easing

### 2. Semantic alias token

- primitive에 의미를 부여합니다.
- 제품 코드와 Figma/문서에서는 semantic token을 기본으로 사용합니다.
- 예시:
  - `color.background.canvas`
  - `color.background.surface`
  - `color.text.primary`
  - `color.text.muted`
  - `color.border.default`
  - `color.border.focus`
  - `color.status.success`
  - `space.stack.section`
  - `space.inline.control-gap`
  - `radius.control`
  - `elevation.overlay`
  - `motion.enter.fast`

### 3. Component and state token

- component 또는 state에 특화된 의미를 둡니다.
- semantic token을 재-export하거나 묶어서 사용합니다.
- 예시:
  - `button.primary.background.default`
  - `button.primary.background.hover`
  - `input.border.invalid`
  - `table.row.background.selected`
  - `dialog.surface.default`

## Primitive Inventory

실제 값이 확정되기 전에는 아래 inventory부터 채웁니다.

### Color primitives

- base neutral:
- base brand:
- base success:
- base warning:
- base danger:
- data-viz scale:

### Typography primitives

- font family:
- fallback stacks:
- weight scale:
- type scale:
- line-height scale:
- letter-spacing scale:
- numeral/data-display rule:

### Spacing / Size primitives

- spacing scale:
- control height scale:
- content width hints:
- icon size scale:

### Radius / Elevation / Motion primitives

- radius scale:
- shadow scale:
- motion duration scale:
- easing scale:

## Semantic Token Inventory

아래 token은 실제 구현과 문서에서 기본적으로 쓰입니다.

| Category | Required semantic token |
| --- | --- |
| Surface | `color.background.canvas`, `color.background.surface`, `color.background.subtle` |
| Text | `color.text.primary`, `color.text.secondary`, `color.text.inverse`, `color.text.danger` |
| Border | `color.border.default`, `color.border.muted`, `color.border.focus`, `color.border.danger` |
| Action | `color.action.primary`, `color.action.primary.hover`, `color.action.primary.pressed` |
| Status | `color.status.success`, `color.status.warning`, `color.status.danger`, `color.status.info` |
| Layout | `space.stack.xs/sm/md/lg`, `space.inline.xs/sm/md/lg`, `radius.control`, `radius.surface` |
| Elevation | `elevation.raised`, `elevation.overlay` |
| Motion | `motion.enter.fast`, `motion.exit.fast`, `motion.emphasis.default` |
| Data display | `font.data.numeric`, `space.table.row`, `color.data.series.*`, `color.selection.row` |

## Primitive and Component Inventory

빈 정의로 시작하지 않고, 최소 inventory를 먼저 확보합니다.

| Primitive / Pattern | Purpose | Current project note |
| --- | --- | --- |
| Button | primary / secondary / subtle / destructive action | |
| Input | text entry, validation, helper/error text | |
| Select / Combobox | constrained choice | |
| Checkbox / Switch | boolean state | |
| Dialog / Drawer | blocking or side-panel workflow | |
| Table / List | scan-heavy repeated data | |
| Navigation | app shell, local nav, breadcrumbs, tabs | |
| Empty state | no data, no search result, no permission | |
| Loading state | skeleton, spinner, optimistic placeholder | |
| Error state | recoverable vs blocking failure | |
| Detail panel | record summary + actions + metadata | |

## State and Accessibility Rules

### Focus and keyboard

- `:focus-visible` 기준의 분명한 focus ring을 둡니다.
- keyboard path에서 hover-only affordance가 없어도 action 가능해야 합니다.
- modal, drawer, menu, combobox는 focus 이동 규칙을 명시합니다.

### Color and status

- required, invalid, success, warning, selected 상태는 color 외 visual cue를 함께 둡니다.
- 상태 badge와 inline validation은 icon 또는 text label을 함께 둡니다.
- status 색은 배경/텍스트/보더 조합까지 적고, table/list/card 위에서 어떻게 보이는지 함께 설명합니다.

### Motion

- `prefers-reduced-motion: reduce`일 때 interaction motion을 제거하거나 본질적인 수준으로 줄입니다.
- enter/exit motion은 정보 구조를 설명할 때만 사용합니다.

### Readability and hit target

- body text는 안정적으로 읽히는 line-height를 유지합니다.
- control 간 간격과 hit target은 pointer와 keyboard 모두 고려합니다.

## Layout and Composition Patterns

### App shell

- global nav, page title, primary action, status/filters의 기본 위치를 일관되게 둡니다.
- app shell은 brand hero보다 workflow orientation을 우선합니다.
- nav 배경, divider, active item, hover item, collapsed state 토큰을 문서에 남깁니다.

### Form

- label, helper, validation, action 영역의 순서를 일관되게 유지합니다.
- 긴 form은 section grouping과 sticky summary/action 필요 여부를 명시합니다.
- label/body/helper/error의 typography와 spacing 관계를 기록합니다.

### Table and list

- dense data는 column meaning, sort/filter state, row action affordance가 명확해야 합니다.
- loading, empty, selected, bulk action 상태를 별도로 설계합니다.
- header/background/border/selected row/status badge 스타일을 token 또는 값 수준으로 남깁니다.

### Detail panel

- summary, key metadata, secondary actions, audit/system status를 분리합니다.
- destructive action은 summary action과 붙이지 않습니다.

### Empty / Loading / Error

- empty state는 action prompt 포함
- loading state는 stable dimension 유지
- error state는 retry 또는 fallback path 포함

### Destructive action

- undo 가능한지, confirm이 필요한지, 영향 범위가 무엇인지 먼저 드러냅니다.
- primary action과 destructive action을 시각적으로 같은 weight로 두지 않습니다.

## Content and Microcopy Rules

- action label은 “무엇을 할지”를 말합니다.
- status text는 “지금 상태”를 말합니다.
- helper text는 “어떻게 성공하는지”를 말합니다.
- error text는 “무엇이 문제인지 + 어떻게 고치는지”를 말합니다.
- 같은 개념을 화면마다 다른 단어로 부르지 않습니다. 도메인 용어는 `.agent/wiki/domain.md`를 따릅니다.

## Anti-patterns

- tool에는 기본적으로 decorative gradient, blob, 큰 hero treatment를 추가하지 않습니다.
- page layout에서 card 안에 card를 중첩하지 않습니다.
- 기록 없이 one-off color, spacing, radius, typography를 만들지 않습니다.
- semantic token 없이 primitive 값을 component에 직접 박아 넣지 않습니다.
- 명확한 확인 없이 destructive action을 숨기지 않습니다.
- text가 control 밖으로 넘치거나 인접 content와 겹치게 두지 않습니다.
- focus ring을 outline 제거로 숨기지 않습니다.
- success/error/warning을 색만으로 구분하지 않습니다.

## Governance and Follow-up

- design token은 single source of truth입니다.
- 실제 UI가 한두 화면 생기면 반복되는 값과 component/state variation을 inventory로 정리합니다.
- 새로운 token, primitive, pattern, anti-pattern 정책이 필요하면 `/vr:recipe`로 spec을 만듭니다.
- 수락된 정책은 승인된 spec을 통해 이 문서와 구현에 반영합니다.
- code migration이 동작 보존이면 `/vr:tidy`로 처리합니다.
- multi-brand 또는 theme 확장이 필요하면 primitive/semantic 분리를 먼저 점검합니다.

## Best-practice 근거

- foundation, token hierarchy, primitive inventory, component inventory, accessibility rule, composition pattern, governance를 분리합니다.
- token은 single source of truth로 두고 semantic layer를 중심으로 사용합니다.
- 이 문서는 UI를 바로 결정할 수 있을 만큼 구체적이지만, 실제 제품 화면이 생기면 spec을 통해 진화하도록 설계합니다.
- theme packet이 color, typography, spacing, state, component detail을 제공하면 이 문서는 해당 값을 category 수준이 아니라 token/value 수준으로 남겨야 합니다.
