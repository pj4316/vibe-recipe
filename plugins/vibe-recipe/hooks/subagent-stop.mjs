#!/usr/bin/env node
import { appendFileSync, existsSync } from "node:fs";

const memory = ".agent/memory/MEMORY.md";
const agent = process.env.VIBE_RECIPE_AGENT_NAME || "subagent";
const summary = process.env.VIBE_RECIPE_AGENT_SUMMARY || "completed";
const today = new Date().toISOString().slice(0, 10);

if (existsSync(memory)) {
  appendFileSync(memory, `- ${today}: ${agent}: ${summary}\n`, "utf8");
}
