#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";

if (existsSync(".agent/memory/MEMORY.md")) {
  const lines = readFileSync(".agent/memory/MEMORY.md", "utf8").split(/\r?\n/);
  writeFileSync(".agent/memory/MEMORY.md", `${lines.slice(-200).join("\n")}\n`, "utf8");
}
