#!/usr/bin/env node
import { readFileSync } from "node:fs";

let stdinPayload = "";
if (!process.stdin.isTTY) {
  try {
    stdinPayload = readFileSync(0, "utf8");
  } catch {
    stdinPayload = "";
  }
}

const payload = `${process.argv.slice(2).join(" ")} ${process.env.VIBE_RECIPE_TOOL_INPUT || ""} ${stdinPayload}`;
const sanitizedPayload = payload.replaceAll(".env.example", "");

function deny(reason) {
  console.error(`vibe-recipe pre-tool-use blocked: ${reason}`);
  process.exit(1);
}

const dangerousPatterns = [
  "rm -rf /",
  "git reset --hard",
  "git push --force",
  "DROP DATABASE",
  "chmod -R 777",
];

if (dangerousPatterns.some((pattern) => payload.includes(pattern))) {
  deny("dangerous command pattern");
}

const protectedPatterns = [".agent/constitution.md", ".git/"];
if (
  protectedPatterns.some((pattern) => payload.includes(pattern)) &&
  process.env.VIBE_RECIPE_ALLOW_PROTECTED_WRITE !== "1"
) {
  deny("protected file access requires explicit override");
}

if (sanitizedPayload.includes(".env") && process.env.VIBE_RECIPE_ALLOW_PROTECTED_WRITE !== "1") {
  deny("protected file access requires explicit override");
}
