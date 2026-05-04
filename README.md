# Vibe Recipe Marketplace

This repository is a Codex and Claude Code marketplace catalog for `vibe-recipe`.

`vibe-recipe` is a spec-driven coding workflow plugin for agents. It packages cooking-metaphor skills, specialist subagents, deterministic hooks, project templates, and adapter scripts so users can move from project setup to spec, implementation, review, and release with a consistent recipe.

If you want to use the plugin itself, start with [plugins/vibe-recipe/README.md](plugins/vibe-recipe/README.md). The repository root is the marketplace/catalog layer, not the end-user plugin package.

## Layout

```text
.agents/plugins/marketplace.json
.claude-plugin/marketplace.json
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

## Install And Usage

There are two ways to think about this repository:

- marketplace/catalog layer: root `marketplace.json` files expose `vibe-recipe` as a local catalog entry
- plugin package layer: `plugins/vibe-recipe/` contains the actual manifests, skills, hooks, templates, scripts, and user-facing docs

For installation methods and first-run usage, read:

- [plugins/vibe-recipe/README.md](plugins/vibe-recipe/README.md)
- [plugins/vibe-recipe/docs/INSTALL.md](plugins/vibe-recipe/docs/INSTALL.md)

In short:

- Codex marketplace uses `.agents/plugins/marketplace.json`
- Claude Code uses `plugins/vibe-recipe/.claude-plugin/plugin.json`
- Cursor uses `plugins/vibe-recipe/scripts/install-cursor.sh`
- Codex/Aider/Gemini CLI fallback uses `plugins/vibe-recipe/scripts/install-codex.sh` or `install-aider.sh`

Typical first command after installation:

```text
/vr:kitchen
```

## Marketplace Entries

The Codex marketplace lives at `.agents/plugins/marketplace.json`.

The Claude Code marketplace lives at `.claude-plugin/marketplace.json`.

Both catalogs register one plugin:

- name: `vibe-recipe`
- source: `./plugins/vibe-recipe`
- category: `Productivity` for Codex, `productivity` for Claude Code

## Development

Run the relevant structural checks:

```bash
python3 -m json.tool .agents/plugins/marketplace.json >/dev/null
python3 -m json.tool .claude-plugin/marketplace.json >/dev/null
python3 -m json.tool plugins/vibe-recipe/hooks/hooks.json >/dev/null
bash -n plugins/vibe-recipe/hooks/*.sh plugins/vibe-recipe/scripts/*.sh
plugins/vibe-recipe/scripts/build-universal-agents-md.sh /tmp/vibe-recipe-AGENTS.md
```

These checks validate marketplace JSON, hook/script syntax, and the universal `AGENTS.md` builder.
