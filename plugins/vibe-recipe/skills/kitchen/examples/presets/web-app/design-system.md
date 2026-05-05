# web-app design-system preset

- reference direction: operational SaaS, internal tool, admin-like workflow product
- density: comfortable by default, dense where scan-heavy tables justify it
- color mode: system
- default recommendation:
  - internal tool, admin, data-heavy workflow면 `enterprise-professional`
  - B2B product SaaS면 `modern-minimal`
  - consumer-friendly collaborative product면 `friendly-colorful`
- component priority:
  - app shell
  - form
  - table / list
  - detail panel
  - empty / loading / error
- composition stance:
  - workflow orientation over marketing
  - stable layout dimensions
  - semantic tokens first
  - visible focus and non-color-only status
- anti-defaults:
  - decorative hero sections
  - brand-heavy gradients by default
  - nested cards as page structure
- available theme packets:
  - `modern-minimal`
  - `friendly-colorful`
  - `enterprise-professional`

## theme routing

- admin, dashboard, workflow tool, backoffice 성격이 강하면 `enterprise-professional`
- 일반적인 B2B SaaS와 polished product UI는 `modern-minimal`
- 감정적 친밀감, playful onboarding, multi-color categorization이 중요하면 `friendly-colorful`
- 사용자가 theme를 명시하면 그 theme packet 값을 그대로 우선 적용합니다.

## injection contract

- kitchen은 선택된 theme packet의 실제 값을 `.agent/wiki/design-system.md`에 반영해야 합니다.
- 최소 주입 대상:
  - color palette
  - typography
  - spacing and radius
  - button design
  - chip / badge
  - icon style
  - card and field
- 상세 주입 대상:
  - border / focus / selection token
  - fallback font policy, heading/body weight, numeral emphasis rule
  - control height / icon size / shadow-elevation token
  - navigation / tabs / selected state styling
  - table/list density, header, row selection, numeric alignment 규칙
  - dialog/drawer/toast/skeleton/empty state tone
- 값이 미지정이면 설명성 문장만 남기지 말고 선택된 theme packet의 구체 값을 우선 복사합니다.
