#!/usr/bin/env node
import { runInstallCli } from "./lib/install-fallback-instructions.mjs";

const target = process.argv[2] || "AGENTS.md";
runInstallCli({
  target,
  successMessage: "Installed Codex fallback instructions to",
});
