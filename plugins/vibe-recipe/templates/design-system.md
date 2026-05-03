# Design System

Status: UI Seed

> 이 파일은 frontend/UI 프로젝트일 때만 `kitchen/init`이 생성합니다.
> 첫 UI 화면이 만들어진 뒤 design-system 정책 변경은 `/vr:recipe`로 spec을 만들고, 동작 보존 token/component migration은 `/vr:tidy`로 처리합니다.

## Product UI Intent

- Product: generated from kitchen product brief.
- Primary user: generated from kitchen product brief.
- Core workflow: generated from MVP answers.
- UI priority: clarity, repeat use, accessible interaction.

## Reference And Density

- Reference: generated from kitchen UI answer.
- Density: generated from kitchen UI answer.
- Default when unknown: 업무용 SaaS, comfortable density.

## Mode And Accessibility

- Mode: system by default.
- Text contrast must meet WCAG AA for body text.
- Interactive controls must have visible focus states.
- Do not rely on color alone to communicate state.

## Tokens

- Color: `--color-bg`, `--color-fg`, `--color-muted`, `--color-border`, `--color-accent`, `--color-danger`, `--color-success`
- Typography: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`
- Spacing: `4`, `8`, `12`, `16`, `24`, `32`, `48`, `64`
- Radius: `0`, `4`, `8`, `16`, `999`
- Shadow: `none`, `sm`, `md`

## Component Primitives

Start empty. Add primitives only after real use appears.

- Button:
- Input:
- Select:
- Dialog:
- Table/List:
- Navigation:

## Composition Rules

- Prefer direct task surfaces over marketing-style hero sections for tools and dashboards.
- Keep repeated operational items scannable and dense enough for daily use.
- Use stable dimensions for controls that should not shift during loading or hover.
- Keep copy inside controls short and action-oriented.

## Anti-patterns

- Do not invent decorative gradients or large visual treatments unless the product is explicitly brand/marketing focused.
- Do not create nested cards for normal page layout.
- Do not add new colors, spacing, or radii without recording them here.
- Do not hide product-critical state behind hover-only UI.

## Design-System Follow-up Instructions

After the first one or two UI screens:

1. Use `/vr:recipe` when actual UI requires new token, primitive, or anti-pattern policy.
2. Compare actual colors, spacing, typography, radius, and component usage with this seed.
3. Consolidate repeated values into tokens in the spec.
4. Record newly accepted primitives and anti-patterns through the approved spec.
5. Use `/vr:tidy` when code migration is behavior-preserving.
