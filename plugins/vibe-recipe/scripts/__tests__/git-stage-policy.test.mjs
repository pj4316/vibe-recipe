import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  allowedTaskCommitPathspecs,
  normalizeRepoPathspec,
  outOfScopeRepoPaths,
  pathspecCoversRepoPath,
  pathspecsFromWriteScope,
} from "../lib/git-stage-policy.mjs";

test("write scope parser keeps concrete paths and drops placeholders", () => {
  assert.deepEqual(pathspecsFromWriteScope("`src/`; tests/, TBD by plate\n'package.json'."), [
    "src/",
    "tests/",
    "package.json",
  ]);
});

test("write scope parser ignores prose around quoted paths and expands brace shorthand", () => {
  assert.deepEqual(pathspecsFromWriteScope([
    "`plugins/vibe-recipe/scripts/__tests__/` (신규)",
    "`plugins/vibe-recipe/skills/{taste,wrap,serve,fix}/SKILL.md` (각 파일 disjoint)",
    "TBD by plate",
  ].join("\n")), [
    "plugins/vibe-recipe/scripts/__tests__/",
    "plugins/vibe-recipe/skills/taste/SKILL.md",
    "plugins/vibe-recipe/skills/wrap/SKILL.md",
    "plugins/vibe-recipe/skills/serve/SKILL.md",
    "plugins/vibe-recipe/skills/fix/SKILL.md",
  ]);
});

test("repo pathspec normalization rejects paths outside the repository", (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "vibe-recipe-stage-policy-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  assert.equal(normalizeRepoPathspec(root, "./src/index.js"), "src/index.js");
  assert.throws(() => normalizeRepoPathspec(root, "../outside.txt"), /escapes repository/);
  assert.throws(() => normalizeRepoPathspec(root, ".git/config"), /cannot target \.git/);
});

test("allowed task commit pathspecs include write scope and coordination files once", (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "vibe-recipe-stage-policy-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const taskFile = path.join(root, ".agent/spec/active/0001-demo/tasks.md");
  assert.deepEqual(allowedTaskCommitPathspecs(root, "src/, src/", [taskFile]), [
    "src",
    ".agent/spec/active/0001-demo/tasks.md",
  ]);
});

test("pathspec coverage treats directories as recursive commit boundaries", () => {
  assert.equal(pathspecCoversRepoPath("src", "src/index.js"), true);
  assert.equal(pathspecCoversRepoPath("src", "src/nested/index.js"), true);
  assert.equal(pathspecCoversRepoPath("src", "scripts/build.mjs"), false);
  assert.equal(pathspecCoversRepoPath(".agent/autopilot/state.json", ".agent/autopilot/state.json"), true);
});

test("out-of-scope detection catches staged files outside write scope", () => {
  assert.deepEqual(outOfScopeRepoPaths([
    "src/index.js",
    ".agent/spec/active/0001-demo/tasks.md",
    "README.md",
  ], [
    "src",
    ".agent/spec/active/0001-demo/tasks.md",
  ]), [
    "README.md",
  ]);
});
