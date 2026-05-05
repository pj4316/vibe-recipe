#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

function listSpecs(dir) {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir)
    .filter((entry) => /^[0-9]{4}-.*\.md$/.test(entry))
    .sort()
    .map((entry) => join(dir, entry));
}

if (existsSync(".agent/spec")) {
  const activeFiles = listSpecs(".agent/spec/active");
  const doneFiles = listSpecs(".agent/spec/done");
  const abandonedCount = listSpecs(".agent/spec/abandoned").length;
  const archivedCount = listSpecs(".agent/spec/archived").length;
  const totalCount = activeFiles.length + doneFiles.length + abandonedCount + archivedCount;
  const today = new Date().toISOString().slice(0, 10);
  const lines = [];

  lines.push("# Spec Index", "");
  lines.push(`_Last regenerated: ${today} by session-end. Do not edit by hand._`, "");
  lines.push(`## Active (${activeFiles.length})`, "");
  lines.push("| # | Title | Status | Branch | Updated |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const spec of activeFiles) {
    const base = basename(spec, ".md");
    const [num, ...titleParts] = base.split("-");
    lines.push(`| ${num} | ${titleParts.join("-")} | unknown | unknown | unknown |`);
  }
  lines.push("", `## Done (last 10 of ${doneFiles.length})`, "");
  lines.push("| # | Title | Released | PR |");
  lines.push("| --- | --- | --- | --- |");
  for (const spec of doneFiles.slice(-10)) {
    const base = basename(spec, ".md");
    const [num, ...titleParts] = base.split("-");
    lines.push(`| ${num} | ${titleParts.join("-")} | unknown | unknown |`);
  }
  lines.push("", "## Stats", "");
  lines.push(`- Total: ${totalCount} | Active: ${activeFiles.length} / Done: ${doneFiles.length} / Abandoned: ${abandonedCount} / Archived: ${archivedCount}`);

  mkdirSync(".agent/spec", { recursive: true });
  writeFileSync(".agent/spec/INDEX.md", `${lines.join("\n")}\n`, "utf8");
}

if (existsSync(".agent/memory/MEMORY.md")) {
  const lines = readFileSync(".agent/memory/MEMORY.md", "utf8").split(/\r?\n/);
  writeFileSync(".agent/memory/MEMORY.md", `${lines.slice(-200).join("\n")}\n`, "utf8");
}
