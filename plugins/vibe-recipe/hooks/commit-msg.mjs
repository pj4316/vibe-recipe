#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const msgFile = process.argv[2] || "";
if (!msgFile || !existsSync(msgFile)) {
  console.error("vibe-recipe: commit-msg hook requires a commit message file.");
  process.exit(1);
}

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
