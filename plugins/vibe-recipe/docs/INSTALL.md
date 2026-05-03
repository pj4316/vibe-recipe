# Install

## Codex Marketplace

This repository is a local marketplace. The catalog entry lives at:

```text
.agents/plugins/marketplace.json
```

It points to:

```text
./plugins/vibe-recipe
```

## Claude Code

The Claude-native manifest is:

```text
plugins/vibe-recipe/.claude-plugin/plugin.json
```

The slash namespace is `vr`.

## Cursor

From a target project:

```bash
bash /path/to/vibe-recipe/plugins/vibe-recipe/scripts/install-cursor.sh
```

This writes `.cursor/rules/vibe-recipe.mdc` and backs up an existing file first.

## Codex, Aider, Gemini CLI Fallback

From a target project:

```bash
bash /path/to/vibe-recipe/plugins/vibe-recipe/scripts/install-codex.sh
```

or:

```bash
bash /path/to/vibe-recipe/plugins/vibe-recipe/scripts/install-aider.sh
```

Both generate a single `AGENTS.md` by concatenating the core contract, skills, and subagents.

Gemini CLI can use the same generated `AGENTS.md`; pass an explicit target path if your Gemini setup expects a different instruction filename.
