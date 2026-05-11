import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SESSION_END = path.resolve(HERE, "..", "..", "hooks", "session-end.mjs");

test("session-end does not recreate spec index for folder-based specs", (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "vibe-recipe-session-end-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  mkdirSync(path.join(root, ".agent", "spec", "active", "0001-demo"), { recursive: true });
  writeFileSync(path.join(root, ".agent", "spec", "active", "0001-demo", "spec.md"), "# demo\n\nStatus: Approved\n");

  const result = spawnSync(process.execPath, [SESSION_END], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || "session-end should exit cleanly");
  assert.equal(existsSync(path.join(root, ".agent", "spec", "INDEX.md")), false);
});

test("session-end still compacts shared memory", (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "vibe-recipe-session-end-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  mkdirSync(path.join(root, ".agent", "memory"), { recursive: true });
  const lines = Array.from({ length: 250 }, (_, index) => `line-${index + 1}`);
  writeFileSync(path.join(root, ".agent", "memory", "MEMORY.md"), `${lines.join("\n")}\n`);

  const result = spawnSync(process.execPath, [SESSION_END], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || "session-end should exit cleanly");
  const compacted = readFileSync(path.join(root, ".agent", "memory", "MEMORY.md"), "utf8").trim().split("\n");
  assert.equal(compacted.length, 199);
  assert.equal(compacted[0], "line-52");
  assert.equal(compacted.at(-1), "line-250");
});
