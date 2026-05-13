import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const COMMIT_MSG_HOOK = path.resolve(HERE, "../../hooks/commit-msg.mjs");

function runCommitMsgHook(message) {
  const root = mkdtempSync(path.join(tmpdir(), "vibe-recipe-commit-msg-"));
  const msgFile = path.join(root, "COMMIT_EDITMSG");
  writeFileSync(msgFile, message, "utf8");
  const result = spawnSync(process.execPath, [COMMIT_MSG_HOOK, msgFile], {
    encoding: "utf8",
  });
  rmSync(root, { recursive: true, force: true });
  return result;
}

test("commit-msg hook accepts folder spec Refs footer", () => {
  const result = runCommitMsgHook([
    "feat(recipe): add folder spec support",
    "",
    "Refs: .agent/spec/active/0001-folder-spec/spec.md",
    "",
  ].join("\n"));

  assert.equal(result.status, 0, result.stderr);
});

test("commit-msg hook still accepts legacy flat spec Refs footer", () => {
  const result = runCommitMsgHook([
    "fix(cook): keep legacy handoff flow",
    "",
    "Refs: .agent/spec/active/0002-legacy-spec.md",
    "",
  ].join("\n"));

  assert.equal(result.status, 0, result.stderr);
});

test("commit-msg hook rejects commits without a spec Refs footer", () => {
  const result = runCommitMsgHook("feat(recipe): missing refs\n");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /spec Refs footer/);
});
