# Vibe Recipe Marketplace

This repository is a Codex marketplace catalog for `vibe-recipe`.

`vibe-recipe` is a spec-driven coding workflow plugin for agents. It packages cooking-metaphor skills, specialist subagents, deterministic hooks, project templates, and adapter scripts so users can move from project setup to spec, implementation, review, and release with a consistent recipe.

## Layout

```text
.agents/plugins/marketplace.json
plugins/vibe-recipe/
  .codex-plugin/plugin.json
  .claude-plugin/plugin.json
  skills/
  agents/
  hooks/
  templates/
  scripts/
  docs/
```

The repository root is the marketplace. The actual plugin package lives at `plugins/vibe-recipe`.

## Marketplace Entry

The marketplace registers one plugin:

- name: `vibe-recipe`
- source: `./plugins/vibe-recipe`
- installation: `AVAILABLE`
- authentication: `ON_INSTALL`
- category: `Productivity`

## Development

Run the full structural verification:

```bash
make -f Makefile verify
```

The check validates JSON manifests, shell scripts, required plugin paths, and the universal `AGENTS.md` builder.
