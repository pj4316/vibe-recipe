#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const targetDir = process.argv[2] || ".cursor/rules";
mkdirSync(targetDir, { recursive: true });

const target = join(targetDir, "vibe-recipe.mdc");
if (existsSync(target)) {
  copyFileSync(target, `${target}.bak.${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`);
}
const result = spawnSync(process.execPath, [join(scriptDir, "build-universal-agents-md.mjs"), target], {
  stdio: "ignore",
});
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
console.log(`Installed Cursor rules to ${resolve(target)}`);
