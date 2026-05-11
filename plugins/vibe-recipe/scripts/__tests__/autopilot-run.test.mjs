import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const AUTOPILOT = path.resolve(HERE, "..", "autopilot-run.mjs");

function writeSpec(root, slug, status, tasksBody) {
  const dir = path.join(root, ".agent", "spec", "active", slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "spec.md"), `# ${slug}\n\nStatus: ${status}\n`);
  writeFileSync(path.join(dir, "tasks.md"), tasksBody);
}

test("autopilot --all-approved dry-run lists runnable specs and blocked specs together", (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "vibe-recipe-autopilot-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  writeSpec(root, "0001-unplated", "Approved", [
    "# Task Plan",
    "",
    "Plate 상태: Not planned",
    "",
    "## 작업 목록",
    "- [ ] Task 0: placeholder",
    "",
  ].join("\n"));

  writeSpec(root, "0002-runnable", "In Progress", [
    "# Task Plan",
    "",
    "Plate 상태: Planned",
    "",
    "## 작업 목록",
    "- [ ] Task 0: implement",
    "  - Phase: Foundation",
    "  - Story: Shared",
    "  - Covers: AC-001",
    "  - Write scope: src/",
    "  - Dependency: None",
    "  - Wave: W00",
    "  - Parallel: No",
    "  - Check: npm test",
    "",
    "## 실행 순서",
    "- Phase order: Foundation",
    "- W00: Task 0",
    "",
  ].join("\n"));

  const result = spawnSync(process.execPath, [
    AUTOPILOT,
    "--repo",
    root,
    "--dry-run",
    "--once",
    "--all-approved",
  ], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || "all-approved preview should not fail");
  assert.match(result.stdout, /Spec: \.agent\/spec\/active\/0001-unplated\/spec\.md/);
  assert.match(result.stdout, /Spec: \.agent\/spec\/active\/0002-runnable\/spec\.md/);
  assert.match(result.stdout, /Next task: blocked/);
  assert.match(result.stdout, /Run plate before autopilot\./);
  assert.match(result.stdout, /Next task: Task 0 - implement/);
});
