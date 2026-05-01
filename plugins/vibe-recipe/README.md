# vibe-recipe

> Vibe coding, with a recipe to follow.

`vibe-recipe` is a stack-agnostic, spec-driven development plugin for coding agents. It gives non-developers a guided cooking metaphor while preserving developer aliases for standard workflows.

## Start

```text
/vr:kitchen
```

Developer alias:

```text
/vr:init
```

## Skill Lineup

| Cooking | Developer alias | Purpose |
| --- | --- | --- |
| `kitchen` | `init` | Bootstrap a project with `.agent/`, `AGENTS.md`, hooks, templates, and first health-check spec. |
| `peek` | `status` | Read-only snapshot of specs, git context, reviews, and autopilot mode. |
| `forage` | `research` | Compare options and draft ADRs before planning. |
| `recipe` | `plan` | Turn a request into a numbered feature spec. |
| `cook` | `dev` | Implement one approved task at a time. |
| `fix` | `debug` | Diagnose failures and repair code or escalate spec issues. |
| `tidy` | `refactor` | Improve structure while preserving behavior. |
| `taste` | `review` | Run regression, coverage, review, security, and red-team checks. |
| `inspect` | `audit` | Periodic hygiene audit for dependencies, dead code, and stale specs. |
| `plate` | `design-tune` | Refine UI tokens and design-system drift after first screens. |
| `wrap` | `bump` | Decide SemVer and generate changelog/version changes. |
| `serve` | `release` | Run release gates, tag, and stop before human-approved push. |
| `autopilot` | `autopilot` | Opt-in automated forage -> recipe -> cook -> taste loop. |

## Docs

See `docs/INSTALL.md`, `docs/COOKBOOK.md`, and `docs/CUSTOMIZATION.md`.
