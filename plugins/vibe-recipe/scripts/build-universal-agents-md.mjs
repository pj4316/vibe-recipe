#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const pluginDir = resolve(scriptDir, "..");
const out = process.argv[2] || "AGENTS.md";

function walkFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }
  const entries = [];
  for (const entry of readdirSync(dir).sort()) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      entries.push(...walkFiles(path));
    } else if (stat.isFile()) {
      entries.push(path);
    }
  }
  return entries;
}

function read(path) {
  return readFileSync(path, "utf8");
}

function appendKitchenExamples(parts) {
  const examplesDir = join(pluginDir, "skills/kitchen/examples");
  if (!existsSync(examplesDir)) {
    return;
  }

  parts.push("\n## Kitchen Preset References\n\n");
  parts.push(`These preset/theme references are embedded here so fallback installations remain self-contained.
Use them as the authoring source when slash commands are unavailable. Generated target-project
documents should keep the selected preset/theme name and injected values, not these plugin paths.
`);

  for (const example of walkFiles(examplesDir)) {
    const presetType = basename(dirname(example));
    const packetName = basename(example, ".md");
    if (packetName === presetType) {
      parts.push(`\n<!-- kitchen-preset: ${packetName} -->\n\n`);
    } else {
      parts.push(`\n<!-- kitchen-preset: ${presetType} / ${packetName} -->\n\n`);
    }
    parts.push(read(example), "\n");
  }
}

const parts = [];
parts.push("# vibe-recipe Universal Agent Instructions\n\n");
parts.push('Use these instructions when slash commands are unavailable. Natural language examples: "use kitchen", "use recipe", "taste the changes".\n\n');
parts.push("## Core Contract\n\n");
parts.push(`You are working with the vibe-recipe workflow.

- Start meaningful product or behavior changes with \`recipe\` so requirements, acceptance criteria, task breakdown, verification, and human gates are explicit.
- Use \`kitchen\` to initialize, adopt, heal, or adjust the project harness. Do not use feature work to patch harness files ad hoc.
- When \`kitchen\` prepares a target project, include plugin bootstrap: Claude Code project settings should enable \`vibe-recipe@vibe-recipe-marketplace\`, and Codex users should run \`node .agent/setup/vibe-recipe-codex.mjs\`.
- Codex does not currently support repository-scoped plugin enablement like Claude Code project settings. Do not create fake \`.codex/config.toml\` plugin blocks; use \`codex plugin marketplace add https://github.com/pj4316/vibe-recipe.git\` and user config bootstrap instead.
- Use \`peek\` for read-only status before changing direction.
- Use \`forage\` before \`recipe\` when library, vendor, API, architecture, or approach choices are unclear.
- Use \`cook\` only for approved or in-progress specs. It orchestrates task work and preserves recipe scope.
- Use \`fix\` for failing tests, regressions, production symptoms, or review/release blockers.
- Use \`tidy\` only for behavior-preserving refactors and prove equivalence with tests, snapshots, commands, or manual checks.
- Use \`taste\` after \`cook\`, \`fix\`, or \`tidy\` to review acceptance coverage, regression evidence, security, red-team risk, and next loop.
- Use \`wrap\` to prepare version and changelog after \`taste APPROVE\`.
- Use \`serve\` to run release gates and create a local annotated tag. Never push, deploy, publish, or approve human-gated actions automatically.
- Use \`autopilot\` only after explicit opt-in. It never approves specs, \`serve\`, push, deploy, publish, payment, auth, or data-loss decisions.

Respect existing project instructions, user changes, and dirty working trees. Read repo facts before asking questions that can be answered locally. If harness files are missing, recommend \`kitchen\` instead of inventing local conventions.
`);

parts.push("\n\n## Skills\n\n");
for (const skill of readdirSync(join(pluginDir, "skills")).sort()) {
  const skillPath = join(pluginDir, "skills", skill, "SKILL.md");
  if (!existsSync(skillPath)) {
    continue;
  }
  parts.push(`\n<!-- ${skill} -->\n\n`);
  parts.push(read(skillPath), "\n");
  if (skill === "kitchen") {
    appendKitchenExamples(parts);
  }
}

parts.push("\n## Subagents\n\n");
for (const agent of readdirSync(join(pluginDir, "agents")).sort()) {
  if (!agent.endsWith(".md")) {
    continue;
  }
  parts.push(`\n<!-- ${agent} -->\n\n`);
  parts.push(read(join(pluginDir, "agents", agent)), "\n");
}

writeFileSync(out, parts.join(""), "utf8");
console.log(`Wrote ${out}`);
