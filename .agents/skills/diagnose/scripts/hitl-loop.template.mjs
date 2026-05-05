#!/usr/bin/env node
// Human-in-the-loop reproduction loop.
// Copy this file, edit the steps below, and run it.
// The agent runs the script; the user follows prompts in their terminal.
//
// Usage:
//   node hitl-loop.template.mjs
//
// Two helpers:
//   step("instruction")          -> show instruction, wait for Enter
//   capture("KEY", "question")   -> show question, store response
//
// At the end, captured values are printed as KEY=VALUE for the agent to parse.

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = createInterface({ input, output });
const captured = new Map();

async function step(instruction) {
  console.log(`\n>>> ${instruction}`);
  await rl.question("    [Enter when done] ");
}

async function capture(key, question) {
  console.log(`\n>>> ${question}`);
  const answer = await rl.question("    > ");
  captured.set(key, answer);
}

// --- edit below ---------------------------------------------------------

await step("Open the app at http://localhost:3000 and sign in.");

await capture("ERRORED", "Click the 'Export' button. Did it throw an error? (y/n)");

await capture("ERROR_MSG", "Paste the error message (or 'none'):");

// --- edit above ---------------------------------------------------------

rl.close();

console.log("\n--- Captured ---");
for (const [key, value] of captured.entries()) {
  console.log(`${key}=${value}`);
}
