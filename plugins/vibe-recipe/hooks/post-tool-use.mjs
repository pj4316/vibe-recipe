#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const inside = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
  stdio: "ignore",
  shell: process.platform === "win32",
});

if (inside.status === 0) {
  const result = spawnSync("git", ["diff", "--check"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  process.exit(result.status ?? 1);
}
