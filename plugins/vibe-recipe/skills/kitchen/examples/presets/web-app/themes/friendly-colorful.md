# friendly-colorful theme

## Color palette

- brand tokens:
  - `brand.500 = #FF6B6B`
  - `brand.600 = #F25454`
  - `accent.500 = #6C63FF`
  - `accent.600 = #554DDB`
- neutral / surface tokens:
  - `surface.canvas = #FFF9F5`
  - `surface.panel = #FFFFFF`
  - `surface.subtle = #FFF0E8`
  - `border.default = #F2D8CC`
  - `text.primary = #2B1F1A`
  - `text.secondary = #6C564A`
- semantic tokens:
  - `success = #2FA36B`
  - `warning = #D98B1F`
  - `danger = #D94C63`
  - `info = #6C63FF`
- dark-mode mapping:
  - `surface.canvas = #1C1622`
  - `surface.panel = #241D2D`
  - `surface.subtle = #30253A`
  - `text.primary = #FFF7F2`
  - `text.secondary = #E7D6CF`

## Typography

- ui font stack: `"Sora", "Pretendard", "Noto Sans KR", sans-serif`
- mono / display font stack: `"JetBrains Mono", monospace`
- heading scale: `34 / 26 / 20 / 18`
- body / caption scale: `16 / 14 / 12`

## Spacing and radius

- spacing base: `4px`
- common spacing tokens: `4, 8, 12, 16, 24, 32, 48`
- radius tokens: `12, 16, 20, 999`
- density mode or layout note: comfortable, onboarding and collaboration surfaces stay airy

## Button design

- primary: coral fill with strong contrast text
- secondary / soft: peach tint with coral text
- ghost / tertiary: transparent with lavender or coral hover tint
- hover / pressed / focus behavior: playful but short transitions, 2px focus ring using lavender accent

## Chip / badge

- shape and radius: rounded pill, `999px`
- background / text pair: tinted category backgrounds with strong readable text
- padding: `5px 10px`
- icon size: `12px`

## Icon style

- icon family tone: rounded and friendly
- outline vs filled: outline with selected semantic filled badges
- default size: `16px`
- semantic usage rule: category or collaboration state can use accent color blocks

## Card and field

- card: warm white surfaces with soft tint border and gentle shadow
- input / field: high-clarity field with warm border and accent focus
- focus ring: outer `0 0 0 2px rgba(108, 99, 255, 0.24)`
