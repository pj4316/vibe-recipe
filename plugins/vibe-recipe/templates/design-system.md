# Design System

Status: UI Playbook Seed

> This file is generated for frontend/UI projects.
> It should be strong enough to guide early implementation, but real product usage should refine it via `/vr:recipe` and behavior-preserving migration via `/vr:tidy`.
> When the user does not specify UI direction, kitchen should start from the selected preset/theme stance and inject the concrete values directly into this generated result.

## Preset Defaults Applied

- Selected preset:
- Selection reason:
- Selected theme:
- Theme reason:
- Precedence: user input -> repo facts -> preset defaults -> generic fallback
- Reference direction:
- Density:
- Mode:
- Component priority:
- Composition stance:

This document should keep the selected preset/theme metadata and injected values, not plugin-internal source paths.

## Theme Packet Extracted

Reflect concrete values from the selected theme instead of leaving this as mood-only guidance.

### Color palette

- Brand tokens:
- Neutral / surface tokens:
- Semantic tokens:
- Dark-mode mapping:

### Typography

- UI font stack:
- Mono / display font stack:
- Heading scale:
- Body / caption scale:

### Spacing and radius

- Spacing base:
- Common spacing tokens:
- Radius tokens:
- Density mode or layout note:

### Button design

- Primary:
- Secondary / soft:
- Ghost / tertiary:
- Hover / pressed / focus behavior:

### Chip / badge

- Shape and radius:
- Background / text pair:
- Padding:
- Icon size:

### Icon style

- Icon family tone:
- Outline vs filled:
- Default size:
- Semantic usage rule:

### Card and field

- Card:
- Input / field:
- Focus ring:

## Product UI Intent

- Product: generated from kitchen product brief.
- Primary user: generated from kitchen product brief.
- Core workflow: generated from MVP answers.
- Reference: generated from kitchen UI answer.
- Density: generated from kitchen UI answer.
- Mode: system by default.
- UI priority: clarity, repeat use, accessible interaction.

## Foundations

### Accessibility

- Visible keyboard focus is required.
- Color is not the only signal for state.
- Reduced motion preferences are respected.
- Contrast must meet WCAG AA for body text.

### Content

- Labels and actions should be concise and task-oriented.
- Error copy should explain the problem and the next action.

### Spacing and grid

- Use tokenized spacing and consistent rhythm for repeated UI.
- Prefer information-dense but scannable operational layouts.

### Color, typography, motion, iconography

- Use semantic color roles.
- Keep typography hierarchy small and intentional.
- Use motion for orientation, not decoration.
- Icons support labels rather than replace them.

### Empty / loading / error states

- Empty states explain why and what to do next.
- Loading states preserve layout stability.
- Error states provide retry or fallback paths.

## Token Hierarchy

### Primitive tokens

- Internal raw values only.
- Examples: color scales, type scale, spacing scale, radius scale, motion scale.

### Semantic alias tokens

- The default layer for code and design usage.
- Examples: `color.text.primary`, `color.background.surface`, `space.stack.md`, `radius.control`.

### Component and state tokens

- Component-specific mapping of semantic tokens.
- Examples: `button.primary.background.default`, `input.border.invalid`.

## Inventory

### Primitive inventory

- Color primitives:
- Typography primitives:
- Spacing primitives:
- Radius / elevation / motion primitives:

### Semantic inventory

- Surface:
- Text:
- Border:
- Action:
- Status:
- Layout:
- Motion:

### Component inventory

- Button:
- Input:
- Select / Combobox:
- Checkbox / Switch:
- Dialog / Drawer:
- Table / List:
- Navigation:
- Detail panel:
- Empty / Loading / Error:

## State and Accessibility Rules

- Focus styles must remain visible for keyboard users.
- Validation, selection, success, warning, and danger states must use more than color alone.
- Hover-only affordances must not hide core actions.
- Motion should degrade cleanly under reduced motion preferences.

## Layout and Composition Patterns

- App shell:
- Form:
- Table / list:
- Detail panel:
- Empty / loading / error:
- Destructive action:

## Content and Microcopy Rules

- Action labels use clear verbs.
- Status text describes current state.
- Error text explains the problem and recovery.

## Anti-patterns

- Decorative hero treatments by default.
- Nested cards for normal app layout.
- One-off raw values without token record.
- Hidden destructive actions.
- Invisible or removed focus indicators.

## Governance and Follow-up

1. Treat tokens as the single source of truth.
2. Inventory real usage after one or two screens exist.
3. Use `/vr:recipe` for new token or pattern policy.
4. Use `/vr:tidy` for behavior-preserving token or component migration.
