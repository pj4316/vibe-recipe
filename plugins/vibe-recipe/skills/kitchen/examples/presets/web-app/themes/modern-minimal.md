# modern-minimal theme

## Color palette

- brand tokens:
  - `brand.500 = #1F6FEB`
  - `brand.600 = #1959BE`
  - `brand.700 = #14458F`
- neutral / surface tokens:
  - `surface.canvas = #F7F9FC`
  - `surface.panel = #FFFFFF`
  - `surface.subtle = #EEF2F7`
  - `border.default = #D7DEE8`
  - `text.primary = #17202B`
  - `text.secondary = #4B5B6B`
- semantic tokens:
  - `success = #1E9E64`
  - `warning = #C98512`
  - `danger = #D64545`
  - `info = #1F6FEB`
- dark-mode mapping:
  - `surface.canvas = #0F1722`
  - `surface.panel = #162130`
  - `surface.subtle = #1D2A3A`
  - `text.primary = #F5F7FB`
  - `text.secondary = #B6C2D1`

## Typography

- ui font stack: `Inter, "Pretendard", "Noto Sans KR", sans-serif`
- mono / display font stack: `"JetBrains Mono", "SFMono-Regular", monospace`
- heading scale: `32 / 24 / 20 / 18`
- body / caption scale: `16 / 14 / 12`

## Spacing and radius

- spacing base: `4px`
- common spacing tokens: `4, 8, 12, 16, 24, 32, 40`
- radius tokens: `8, 12, 16, 999`
- density mode or layout note: comfortable default, dense tables allowed

## Button design

- primary: solid brand fill with white text
- secondary / soft: subtle tinted surface with brand text
- ghost / tertiary: transparent background with clear hover tint
- hover / pressed / focus behavior: darker brand step on press, 2px focus ring using `brand.500`

## Chip / badge

- shape and radius: pill, `999px`
- background / text pair: subtle neutral or semantic tint + dark text
- padding: `4px 10px`
- icon size: `12px`

## Icon style

- icon family tone: crisp and utilitarian
- outline vs filled: outline-first
- default size: `16px`
- semantic usage rule: destructive/warning/status icons may use semantic fills

## Card and field

- card: white card, soft border, low shadow
- input / field: neutral border, white field, subtle focus tint
- focus ring: outer `0 0 0 2px rgba(31, 111, 235, 0.28)`
