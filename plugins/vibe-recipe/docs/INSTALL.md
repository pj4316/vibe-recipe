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

For a target project initialized by `kitchen`, project-scoped Claude Code plugin setup belongs in:

```text
.claude/settings.json
```

`kitchen` should add:

```json
{
  "extraKnownMarketplaces": {
    "vibe-recipe-marketplace": {
      "source": {
        "source": "github",
        "repo": "pj4316/vibe-recipe"
      }
    }
  },
  "enabledPlugins": {
    "vibe-recipe@vibe-recipe-marketplace": true
  }
}
```

If the file already exists, merge these two entries and preserve unrelated settings.

## Codex Project Bootstrap

Codex plugin marketplace and enablement state is currently user-scoped. A target project should not create a fake `.codex/config.toml` plugin block. Instead, `kitchen` writes:

```text
.agent/setup/vibe-recipe-codex.mjs
```

Run it from the target project on Windows, macOS, or Linux:

```bash
node .agent/setup/vibe-recipe-codex.mjs
```

The script runs `codex plugin marketplace add https://github.com/pj4316/vibe-recipe.git`, backs up `~/.codex/config.toml`, and enables:

```toml
[plugins."vibe-recipe@vibe-recipe-marketplace"]
enabled = true
```

## Cursor

From a target project:

```bash
node /path/to/vibe-recipe/plugins/vibe-recipe/scripts/install-cursor.mjs
```

This writes `.cursor/rules/vibe-recipe.mdc` and backs up an existing file first.

## Codex, Aider, Gemini CLI Fallback

From a target project:

```bash
node /path/to/vibe-recipe/plugins/vibe-recipe/scripts/install-codex.mjs
```

or:

```bash
node /path/to/vibe-recipe/plugins/vibe-recipe/scripts/install-aider.mjs
```

Both generate a single `AGENTS.md` by concatenating the core contract, skills, and subagents.

Gemini CLI can use the same generated `AGENTS.md`; pass an explicit target path if your Gemini setup expects a different instruction filename.
