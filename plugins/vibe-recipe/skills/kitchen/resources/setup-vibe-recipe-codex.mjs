#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const marketplaceName = process.env.VIBE_RECIPE_MARKETPLACE_NAME || "vibe-recipe-marketplace";
const pluginRef = process.env.VIBE_RECIPE_PLUGIN_REF || "vibe-recipe@vibe-recipe-marketplace";
const marketplaceSource =
  process.env.VIBE_RECIPE_MARKETPLACE_SOURCE || "https://github.com/pj4316/vibe-recipe.git";
const codexHome = process.env.CODEX_HOME || join(homedir(), ".codex");
const configFile = join(codexHome, "config.toml");
const timestamp = new Date()
  .toISOString()
  .replace(/[-:TZ.]/g, "")
  .slice(0, 14);

mkdirSync(codexHome, { recursive: true });
if (!existsSync(configFile)) {
  writeFileSync(configFile, "", "utf8");
}

const backupFile = join(codexHome, `config.toml.bak-vibe-recipe-${timestamp}`);
copyFileSync(configFile, backupFile);

if (process.env.VIBE_RECIPE_SKIP_MARKETPLACE_ADD !== "1") {
  const result = spawnSync("codex", ["plugin", "marketplace", "add", marketplaceSource], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error || result.status !== 0) {
    console.error(`vibe-recipe: codex marketplace add failed; patching ${configFile} directly.`);
  }
}

const targetTables = new Set([
  `marketplaces.${marketplaceName}`,
  `plugins."${pluginRef}"`,
]);
const lines = readFileSync(configFile, "utf8").split(/\r?\n/);
const kept = [];
let skip = false;

for (const line of lines) {
  const stripped = line.trim();
  if (stripped.startsWith("[") && stripped.endsWith("]")) {
    const tableName = stripped.slice(1, -1).trim();
    skip = targetTables.has(tableName);
  }
  if (!skip) {
    kept.push(line);
  }
}

while (kept.length > 0 && kept[kept.length - 1] === "") {
  kept.pop();
}
if (kept.length > 0) {
  kept.push("");
}

kept.push(
  `[marketplaces.${marketplaceName}]`,
  `source_type = "git"`,
  `source = "${marketplaceSource}"`,
  "",
  `[plugins."${pluginRef}"]`,
  "enabled = true",
);

mkdirSync(dirname(configFile), { recursive: true });
writeFileSync(configFile, `${kept.join("\n")}\n`, "utf8");

console.log("vibe-recipe Codex plugin bootstrap complete.");
console.log(`Config: ${configFile}`);
console.log(`Backup: ${backupFile}`);
console.log(`Plugin: ${pluginRef}`);
