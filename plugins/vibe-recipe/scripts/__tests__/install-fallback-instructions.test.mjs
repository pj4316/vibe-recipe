import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  backupStamp,
  installFallbackInstructions,
} from "../lib/install-fallback-instructions.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INSTALL_CURSOR = path.resolve(HERE, "..", "install-cursor.mjs");

test("backupStamp uses compact UTC timestamp", () => {
  assert.equal(backupStamp(new Date("2026-05-13T04:05:06.789Z")), "20260513040506");
});

test("installFallbackInstructions backs up existing target before rendering", (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "vibe-recipe-install-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const target = path.join(root, "AGENTS.md");
  writeFileSync(target, "existing instructions\n");

  const result = installFallbackInstructions({
    target,
    successMessage: "Installed test instructions to",
    now: new Date("2026-05-13T04:05:06.789Z"),
    logger: () => {},
  });

  assert.equal(result.status, 0);
  assert.equal(result.backup, `${target}.bak.20260513040506`);
  assert.equal(readFileSync(result.backup, "utf8"), "existing instructions\n");
  assert.match(readFileSync(target, "utf8"), /# vibe-recipe Universal Agent Instructions/);
});

test("install-cursor creates the rules directory and target file", (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "vibe-recipe-cursor-install-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const targetDir = path.join(root, ".cursor", "rules");
  const result = spawnSync(process.execPath, [INSTALL_CURSOR, targetDir], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || "install-cursor should exit cleanly");
  assert.ok(existsSync(path.join(targetDir, "vibe-recipe.mdc")), "Cursor rules file missing");
  assert.match(result.stdout, /Installed Cursor rules to/);
});
