#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    shell: process.platform === "win32",
    ...options,
  });
}

const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]).stdout?.trim() || "";
if (branch === "main" || branch === "master") {
  console.error(`vibe-recipe: direct commits to ${branch} are blocked. Use a branch.`);
  process.exit(1);
}

const msgFile = process.argv[2] && existsSync(process.argv[2]) ? process.argv[2] : "";
if (msgFile) {
  const message = readFileSync(msgFile, "utf8");
  const firstLine = message.split(/\r?\n/, 1)[0] || "";
  const conventionalCommit = /^(feat|fix|refactor|docs|chore|test|build|ci|perf|style)(\([^)]+\))?!?: .+/;
  const specRefs = /^Refs: \.agent\/spec\/(active|done|archived|abandoned)\/[0-9]{4}-[-a-z0-9]+\.md$/m;

  if (!conventionalCommit.test(firstLine)) {
    console.error("vibe-recipe: commit message must follow Conventional Commits.");
    process.exit(1);
  }
  if (!specRefs.test(message)) {
    console.error("vibe-recipe: commit message must include a spec Refs footer.");
    process.exit(1);
  }
}

const gitleaks = run("gitleaks", ["--version"], { stdio: "ignore" });
if (gitleaks.status === 0) {
  const result = run("gitleaks", ["detect", "--source", ".", "--redact", "--no-banner"], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

let verifyCommand = "";
if (existsSync(".agent/commands.json")) {
  try {
    const commands = JSON.parse(readFileSync(".agent/commands.json", "utf8"));
    if (typeof commands.verify === "string" && commands.verify.trim()) {
      verifyCommand = commands.verify.trim();
    }
  } catch {
    verifyCommand = "";
  }
}

if (verifyCommand) {
  console.error(`vibe-recipe: running project verify command: ${verifyCommand}`);
  const result = spawnSync(verifyCommand, {
    stdio: "inherit",
    shell: true,
  });
  process.exit(result.status ?? 1);
}

console.error("vibe-recipe: project verify command not configured in .agent/commands.json; metadata checks only.");
