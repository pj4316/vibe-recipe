#!/usr/bin/env node
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(scriptDir, "..");
const repoRoot = resolve(pluginRoot, "..", "..");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
    ...options,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit ${result.status}`);
  }
}

function filesIn(dir, predicate) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return filesIn(fullPath, predicate);
    return predicate(fullPath) ? [fullPath] : [];
  });
}

const jsonFiles = [
  join(repoRoot, ".agents", "plugins", "marketplace.json"),
  join(repoRoot, ".claude-plugin", "marketplace.json"),
  join(pluginRoot, ".codex-plugin", "plugin.json"),
  join(pluginRoot, ".claude-plugin", "plugin.json"),
  join(pluginRoot, "hooks", "hooks.json"),
  join(pluginRoot, "templates", "commands.parallelism.example.json"),
];

for (const file of jsonFiles) {
  JSON.parse(readFileSync(file, "utf8"));
}

const testDirFragment = `${sep}scripts${sep}__tests__${sep}`;
const mjsFiles = [
  ...filesIn(join(pluginRoot, "scripts"), (file) => extname(file) === ".mjs" && !file.includes(testDirFragment)),
  ...filesIn(join(pluginRoot, "hooks"), (file) => extname(file) === ".mjs"),
];

for (const file of mjsFiles) {
  run("node", ["--check", file]);
}

const tests = filesIn(join(pluginRoot, "scripts", "__tests__"), (file) => extname(file) === ".mjs");
if (tests.length) {
  run("node", ["--test", ...tests]);
}

const tmp = mkdtempSync(join(tmpdir(), "vibe-recipe-verify-"));
try {
  run("node", [join(pluginRoot, "scripts", "build-universal-agents-md.mjs"), join(tmp, "AGENTS.md")]);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

process.stdout.write("verify-cross-platform: ok\n");
