# vibe-recipe

> Vibe coding, with a recipe to follow.

`vibe-recipe` is a stack-agnostic, spec-driven development plugin for coding agents. It gives non-developers a guided cooking metaphor while preserving developer aliases for standard workflows.

## What It Includes

- 11 top-level skills from project setup to release
- specialist subagents for planning, implementation, review, testing, and security
- deterministic hooks and guardrails for risky actions
- scaffold templates for `.agent/`, `AGENTS.md`, runbooks, and health-check specs
- install adapters for Cursor, Codex, Aider, and Gemini CLI fallback flows

## Install

Choose the path that matches your environment.

### Claude Code

Claude-native metadata lives at:

```text
plugins/vibe-recipe/.claude-plugin/plugin.json
```

The slash namespace is `vr`, so commands use the `/vr:*` form.

### Codex Marketplace

This repository can be used as a local marketplace catalog. The catalog entry is:

```text
.agents/plugins/marketplace.json
```

That entry points to the actual plugin package at:

```text
./plugins/vibe-recipe
```

### Cursor

From the target project:

```bash
bash /path/to/vibe-recipe/plugins/vibe-recipe/scripts/install-cursor.sh
```

This writes `.cursor/rules/vibe-recipe.mdc` and creates a backup first if a file already exists.

### Codex, Aider, Gemini CLI Fallback

If your tool does not load the plugin natively, generate a single `AGENTS.md` from the packaged skills and subagents.

From the target project:

```bash
bash /path/to/vibe-recipe/plugins/vibe-recipe/scripts/install-codex.sh
```

or:

```bash
bash /path/to/vibe-recipe/plugins/vibe-recipe/scripts/install-aider.sh
```

Gemini CLI can use the same generated `AGENTS.md`. If your setup expects a different instruction filename, pass an explicit target path.

## Quick Start

After installation, initialize the project harness with:

```text
/vr:kitchen
```

Developer alias:

```text
/vr:init
```

`kitchen` inspects the repo, asks product-facing setup questions, and prepares the project harness such as `AGENTS.md`, `.agent/`, command profiles, runbooks, and the first health-check spec.

## Typical Usage

### Plan a new feature

```text
/vr:recipe
```

Developer alias:

```text
/vr:plan
```

Use this when you want a numbered spec before implementation.

### Implement an approved spec

```text
/vr:cook
```

Developer alias:

```text
/vr:dev
```

Use this after `recipe` is approved.

### Review the result

```text
/vr:taste
```

Developer alias:

```text
/vr:review
```

Use this before merge or after a fix/refactor loop.

## Common Workflows

### Safe first rehearsal

```text
/vr:recipe
/vr:cook
/vr:taste
/vr:wrap
```

Stop before `/vr:serve` unless you are intentionally running release gates.

### Normal feature loop

```text
/vr:forage
/vr:recipe
/vr:cook
/vr:taste
```

Skip `forage` if the approach is already obvious.

### Debug loop

```text
/vr:fix
/vr:taste
```

`fix` can escalate back to `recipe` if the real problem is a spec issue rather than a code issue.

### Release prep and release gate

```text
/vr:wrap
/vr:serve
```

`wrap` prepares version and changelog changes. `serve` runs release checks and stops before human-approved push or deploy.

### Autopilot loop

After you have an approved active spec:

```bash
plugins/vibe-recipe/scripts/autopilot-run.sh --repo . --tool codex --max-iterations 10
```

To preview what it would do without changing files:

```bash
plugins/vibe-recipe/scripts/autopilot-run.sh --repo . --dry-run --once
```

`autopilot` handles one unchecked task at a time, stops at `taste` by default, and never runs `serve`, push, deploy, or publish automatically.

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
| `wrap` | `bump` | Decide SemVer and generate changelog/version changes. |
| `serve` | `release` | Run release gates, tag, and stop before human-approved push. |
| `autopilot` | `autopilot` | Opt-in automated forage -> recipe -> cook -> taste loop. |

## Docs

- `docs/INSTALL.md`: install paths by environment
- `docs/COOKBOOK.md`: example operating flows
- `docs/CUSTOMIZATION.md`: templates, hooks, command contract, and customization rules
