# enterprise-professional theme

## Color palette

- brand tokens:
  - `brand.500 = #0F4C81`
  - `brand.600 = #0C3E69`
  - `brand.700 = #082E4E`
- neutral / surface tokens:
  - `surface.canvas = #F3F5F8`
  - `surface.panel = #FFFFFF`
  - `surface.subtle = #E7ECF2`
  - `border.default = #CBD4DF`
  - `text.primary = #142033`
  - `text.secondary = #516074`
- semantic tokens:
  - `success = #2F7D5A`
  - `warning = #A56A00`
  - `danger = #B54747`
  - `info = #0F4C81`
- dark-mode mapping:
  - `surface.canvas = #0D1522`
  - `surface.panel = #131D2C`
  - `surface.subtle = #1B2738`
  - `text.primary = #F3F6FA`
  - `text.secondary = #B2BDCB`

## Typography

- ui font stack: `"IBM Plex Sans", "Pretendard", "Noto Sans KR", sans-serif`
- mono / display font stack: `"IBM Plex Mono", "SFMono-Regular", monospace`
- heading scale: `30 / 24 / 20 / 18`
- body / caption scale: `16 / 14 / 12`

## Spacing and radius

- spacing base: `4px`
- common spacing tokens: `4, 8, 12, 16, 20, 24, 32`
- radius tokens: `6, 10, 14, 999`
- density mode or layout note: workflow- and table-heavy screens may lean dense

## Button design

- primary: deep blue fill with restrained emphasis
- secondary / soft: cool gray surface with blue text
- ghost / tertiary: transparent surface with understated hover tint
- hover / pressed / focus behavior: crisp state changes, 2px focus ring using `brand.500`

## Chip / badge

- shape and radius: rounded rectangle, `999px` only for status pills
- background / text pair: subtle slate or semantic tint with readable dark text
- padding: `4px 8px`
- icon size: `12px`

## Icon style

- icon family tone: precise and businesslike
- outline vs filled: outline-first with selective filled status icons
- default size: `16px`
- semantic usage rule: keep icon set conservative and consistent across workflow surfaces

## Card and field

- card: flat white surface with crisp border and minimal elevation
- input / field: understated control chrome, clear validation border states
- focus ring: outer `0 0 0 2px rgba(15, 76, 129, 0.22)`
