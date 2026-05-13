import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function backupStamp(date = new Date()) {
  return date.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
}

export function installFallbackInstructions({
  target,
  ensureTargetDir = false,
  successMessage,
  now = new Date(),
  logger = console.log,
} = {}) {
  if (!target) {
    throw new Error("installFallbackInstructions requires target");
  }
  if (!successMessage) {
    throw new Error("installFallbackInstructions requires successMessage");
  }

  if (ensureTargetDir) {
    mkdirSync(dirname(target), { recursive: true });
  }

  let backup = "";
  if (existsSync(target)) {
    backup = `${target}.bak.${backupStamp(now)}`;
    copyFileSync(target, backup);
  }

  const result = spawnSync(process.execPath, [join(scriptDir, "build-universal-agents-md.mjs"), target], {
    stdio: "ignore",
  });

  if (result.status !== 0) {
    return { status: result.status ?? 1, target: resolve(target), backup };
  }

  logger(`${successMessage} ${resolve(target)}`);
  return { status: 0, target: resolve(target), backup };
}

export function runInstallCli(config) {
  const result = installFallbackInstructions(config);
  if (result.status !== 0) {
    process.exit(result.status);
  }
}
