#!/usr/bin/env node
import { join } from "node:path";
import { runInstallCli } from "./lib/install-fallback-instructions.mjs";

const targetDir = process.argv[2] || ".cursor/rules";
const target = join(targetDir, "vibe-recipe.mdc");
runInstallCli({
  target,
  ensureTargetDir: true,
  successMessage: "Installed Cursor rules to",
});
