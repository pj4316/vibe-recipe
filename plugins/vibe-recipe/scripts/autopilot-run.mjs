#!/usr/bin/env node
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const usage = `Usage: autopilot-run.mjs [options]

Options:
  --repo DIR                 Target repository root. Default: .
  --tool codex|claude        Fresh agent CLI to run. Default: codex.
  --max-iterations N         Maximum fresh-agent iterations. Default: 10.
  --max-followups N          Maximum cook/fix follow-up attempts after taste. Default: 3.
  --max-same-recommendation-retries N
                             Maximum consecutive retries for the same cook/fix recommendation. Default: 2.
  --max-taste-loops N        Maximum REQUEST_CHANGES taste loops. Default: 3.
  --stop-point taste|wrap    Stop after taste report or wrap summary. Default: taste.
  --all-approved             Plan against every Approved/In Progress active spec.
  --dry-run                  Print the next prompt and update no files.
  --once                     Run at most one fresh-agent iteration.
  --status                   Show active spec and next task without running an agent.
  -h, --help                 Show this help.
`;

const options = {
  repo: ".",
  tool: "codex",
  maxIterations: 10,
  maxFollowups: 3,
  maxSameRecommendationRetries: 2,
  maxTasteLoops: 3,
  stopPoint: "taste",
  allApproved: false,
  dryRun: false,
  once: false,
  statusOnly: false,
};

function fail(message, code = 2) {
  console.error(message);
  process.exit(code);
}

function parsePositiveInt(value, name) {
  if (!/^[0-9]+$/.test(String(value)) || Number(value) < 1) {
    fail(`${name} must be a positive integer.`, 64);
  }
  return Number(value);
}

for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  const readValue = (name) => {
    const next = process.argv[i + 1];
    if (!next) {
      fail(`${name} requires a value.`, 64);
    }
    i += 1;
    return next;
  };

  if (arg === "--repo") options.repo = readValue("--repo");
  else if (arg.startsWith("--repo=")) options.repo = arg.slice("--repo=".length);
  else if (arg === "--tool") options.tool = readValue("--tool");
  else if (arg.startsWith("--tool=")) options.tool = arg.slice("--tool=".length);
  else if (arg === "--max-iterations") options.maxIterations = parsePositiveInt(readValue("--max-iterations"), "--max-iterations");
  else if (arg.startsWith("--max-iterations=")) options.maxIterations = parsePositiveInt(arg.slice("--max-iterations=".length), "--max-iterations");
  else if (arg === "--max-followups") options.maxFollowups = parsePositiveInt(readValue("--max-followups"), "--max-followups");
  else if (arg.startsWith("--max-followups=")) options.maxFollowups = parsePositiveInt(arg.slice("--max-followups=".length), "--max-followups");
  else if (arg === "--max-same-recommendation-retries") options.maxSameRecommendationRetries = parsePositiveInt(readValue("--max-same-recommendation-retries"), "--max-same-recommendation-retries");
  else if (arg.startsWith("--max-same-recommendation-retries=")) options.maxSameRecommendationRetries = parsePositiveInt(arg.slice("--max-same-recommendation-retries=".length), "--max-same-recommendation-retries");
  else if (arg === "--max-taste-loops") options.maxTasteLoops = parsePositiveInt(readValue("--max-taste-loops"), "--max-taste-loops");
  else if (arg.startsWith("--max-taste-loops=")) options.maxTasteLoops = parsePositiveInt(arg.slice("--max-taste-loops=".length), "--max-taste-loops");
  else if (arg === "--stop-point") options.stopPoint = readValue("--stop-point");
  else if (arg.startsWith("--stop-point=")) options.stopPoint = arg.slice("--stop-point=".length);
  else if (arg === "--all-approved") options.allApproved = true;
  else if (arg === "--dry-run") options.dryRun = true;
  else if (arg === "--once") options.once = true;
  else if (arg === "--status") options.statusOnly = true;
  else if (arg === "-h" || arg === "--help") {
    process.stdout.write(usage);
    process.exit(0);
  } else {
    console.error(`Unknown option: ${arg}`);
    process.stderr.write(usage);
    process.exit(64);
  }
}

if (!["codex", "claude"].includes(options.tool)) {
  fail(`Unsupported --tool ${options.tool}. Expected codex or claude.`, 64);
}
if (!["taste", "wrap"].includes(options.stopPoint)) {
  fail(`Unsupported --stop-point ${options.stopPoint}. Expected taste or wrap.`, 64);
}

const repo = resolve(options.repo);
const agentDir = join(repo, ".agent");
const autopilotDir = join(agentDir, "autopilot");
const stateFile = join(autopilotDir, "state.json");
const progressFile = join(autopilotDir, "progress.md");

function run(command, args = [], opts = {}) {
  return spawnSync(command, args, {
    cwd: opts.cwd || repo,
    encoding: "utf8",
    shell: process.platform === "win32",
    ...opts,
  });
}

function commandExists(command) {
  const checker = process.platform === "win32" ? "where" : "command";
  const args = process.platform === "win32" ? [command] : ["-v", command];
  const result = process.platform === "win32"
    ? spawnSync(checker, args, { stdio: "ignore", shell: true })
    : spawnSync("sh", ["-lc", `command -v ${JSON.stringify(command)}`], { stdio: "ignore" });
  return result.status === 0;
}

function requireTool(command) {
  if (!commandExists(command)) {
    fail(`Required command not found: ${command}`, 69);
  }
}

if (!options.dryRun && !options.statusOnly) {
  requireTool(options.tool);
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function writeText(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value, "utf8");
}

function appendProgress(title, body) {
  if (options.dryRun) return;
  if (!existsSync(progressFile)) {
    writeText(progressFile, "# Autopilot Progress\n\nAppend-only progress log for fresh autopilot iterations.\n");
  }
  appendFileSync(progressFile, `\n## ${new Date().toLocaleString()} - ${title}\n\n${body}\n`, "utf8");
}

function writeState(specPath, iteration, lastTask, lastStatus) {
  if (options.dryRun) return;
  writeText(
    stateFile,
    `${JSON.stringify({
      activeSpec: specPath,
      iteration,
      stopPoint: options.stopPoint,
      tool: options.tool,
      lastTask,
      lastStatus,
      updatedAt: new Date().toISOString(),
    }, null, 2)}\n`,
  );
}

function listSpecFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      if (entry.isFile() && /^[0-9]{4}-.*\.md$/.test(entry.name)) {
        return [join(dir, entry.name)];
      }
      if (entry.isDirectory() && /^[0-9]{4}-/.test(entry.name) && existsSync(join(dir, entry.name, "spec.md"))) {
        return [join(dir, entry.name, "spec.md")];
      }
      return [];
    })
    .sort();
}

function activeSpec() {
  return listSpecFiles(join(agentDir, "spec/active"))[0] || "";
}

function activeSpecs() {
  return listSpecFiles(join(agentDir, "spec/active"));
}

function isFolderSpec(specPath) {
  return basename(specPath) === "spec.md";
}

function taskSourcePath(specPath) {
  const siblingTasks = join(dirname(specPath), "tasks.md");
  return isFolderSpec(specPath) && existsSync(siblingTasks) ? siblingTasks : specPath;
}

function memoryPath(specPath) {
  return isFolderSpec(specPath)
    ? join(dirname(specPath), "memory.md")
    : join(agentDir, "spec", "handoffs", `${specNumberFromPath(specPath)}-memory.md`);
}

function specStatus(path) {
  const match = readText(path).match(/^Status:\s*(.+)$/m);
  return match?.[1]?.trim() || "";
}

function specNumberFromPath(path) {
  return isFolderSpec(path) ? basename(dirname(path)).slice(0, 4) : basename(path).slice(0, 4);
}

function specSlugFromPath(specPath) {
  const base = isFolderSpec(specPath) ? basename(dirname(specPath)) : basename(specPath, ".md");
  return base.slice(5);
}

function ensureMemoryFile(specPath) {
  const path = memoryPath(specPath);
  if (!existsSync(path)) {
    writeText(path, "# Memory\n\n## Shared\n");
  }
  return path;
}

function appendMemorySection(specPath, title, body) {
  const path = ensureMemoryFile(specPath);
  const existing = readText(path).trimEnd();
  writeText(path, `${existing}\n\n## ${title}\n${body.trim()}\n`);
}

function extractLatestSection(body, headingPattern) {
  const lines = body.split(/\r?\n/);
  const sections = [];
  let current = null;

  for (const line of lines) {
    const heading = line.match(/^##\s+(.*)$/);
    if (heading) {
      if (current) sections.push(current);
      current = { title: heading[1].trim(), lines: [line] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) sections.push(current);

  const match = [...sections].reverse().find((section) => headingPattern.test(section.title));
  return match ? match.lines.join("\n").trim() : "";
}

function tasteReportText(reportPath) {
  if (!reportPath || !existsSync(reportPath)) return "";
  const body = readText(reportPath);
  if (basename(reportPath) !== "memory.md") return body;
  return extractLatestSection(body, /^Taste Report\b/i);
}

function extractStructuredSection(text, name) {
  const lines = text.split(/\r?\n/);
  const matcher = new RegExp(`^#{2,3}\\s+${name}\\b`, "i");
  const section = [];
  let inSection = false;

  for (const line of lines) {
    if (matcher.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection && /^#{2,3}\s+/.test(line)) break;
    if (inSection) section.push(line);
  }

  return section.join("\n").trim();
}

function taskLines(specPath) {
  return readText(taskSourcePath(specPath)).split(/\r?\n/).map((line, index) => ({ line, index }));
}

function parseTaskBlocks(specPath) {
  const lines = readText(taskSourcePath(specPath)).split(/\r?\n/);
  const tasks = [];
  let current = null;
  const taskHeader = /^- \[([ xX])\] Task ([0-9]+):\s*(.*)$/;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const header = line.match(taskHeader);
    if (header) {
      if (current) tasks.push(current);
      current = {
        line,
        index,
        done: header[1].toLowerCase() === "x",
        number: header[2],
        title: header[3],
        metadata: {},
      };
      continue;
    }
    if (!current) continue;
    const meta = line.match(/^\s+-\s+([^:]+):\s*(.*)$/);
    if (meta) {
      current.metadata[meta[1].trim().toLowerCase()] = meta[2].trim();
    }
  }
  if (current) tasks.push(current);
  return tasks;
}

function parseExecutionOrder(specPath) {
  const lines = readText(taskSourcePath(specPath)).split(/\r?\n/);
  let inSection = false;
  let hasSection = false;
  let hasPhaseOrder = false;
  const waves = [];

  for (const line of lines) {
    if (/^## 실행 순서/.test(line)) {
      inSection = true;
      hasSection = true;
      continue;
    }
    if (inSection && /^## /.test(line)) break;
    if (!inSection) continue;

    if (/^- Phase order:\s*/.test(line)) {
      hasPhaseOrder = true;
      continue;
    }

    const wave = line.match(/^- (W[0-9]+):\s*(.*)$/i);
    if (wave) {
      const normalized = normalizeWave(wave[1]);
      if (!waves.includes(normalized)) waves.push(normalized);
    }
  }

  return { hasSection, hasPhaseOrder, waves };
}

function taskCount(specPath) {
  return parseTaskBlocks(specPath).length;
}

function doneTaskCount(specPath) {
  return parseTaskBlocks(specPath).filter((task) => task.done).length;
}

function nextTaskPlan(specPath) {
  const tasks = parseTaskBlocks(specPath);
  if (!tasks.length) return { next: null, blocked: "" };
  const executionOrder = parseExecutionOrder(specPath);
  if (!executionOrder.hasSection || !executionOrder.hasPhaseOrder || !executionOrder.waves.length) {
    return {
      next: null,
      blocked: "BLOCKED: spec is missing a valid ## 실행 순서 section with Phase order and wave entries. Run plate before autopilot.",
    };
  }

  const required = ["phase", "story", "covers", "write scope", "dependency", "wave", "parallel", "check"];
  for (const task of tasks) {
    const missing = required.filter((key) => !task.metadata[key]);
    if (missing.length) {
      return {
        next: null,
        blocked: `BLOCKED: Task ${task.number} is missing plate metadata: ${missing.join(", ")}. Run plate before autopilot.`,
      };
    }
  }

  const missingWaves = tasks
    .map((task) => normalizeWave(task.metadata.wave))
    .filter((wave, index, all) => wave && all.indexOf(wave) === index && !executionOrder.waves.includes(wave));
  if (missingWaves.length) {
    return {
      next: null,
      blocked: `BLOCKED: execution order is missing wave entries for ${missingWaves.join(", ")}. Run plate before autopilot.`,
    };
  }

  const done = new Set(tasks.filter((task) => task.done).map((task) => task.number));

  for (const wave of executionOrder.waves) {
    const waveTasks = tasks.filter((task) => normalizeWave(task.metadata.wave) === wave);
    const pending = waveTasks.filter((task) => !task.done);
    if (!pending.length) continue;

    for (const task of pending) {
      const deps = dependencyTaskNumbers(task.metadata.dependency);
      const missingDeps = deps.filter((dep) => !done.has(dep));
      if (!missingDeps.length) return { next: task, blocked: "" };
    }

    const blocked = pending
      .map((task) => `Task ${task.number} waits for ${dependencyTaskNumbers(task.metadata.dependency).filter((dep) => !done.has(dep)).map((dep) => `Task ${dep}`).join(", ")}`)
      .join("; ");
    return {
      next: null,
      blocked: `BLOCKED: no runnable task in ${wave}. ${blocked}`,
    };
  }

  return { next: null, blocked: "" };
}

function nextTaskLine(specPath) {
  const plan = nextTaskPlan(specPath);
  if (plan.blocked) {
    fail(plan.blocked);
  }
  return plan.next;
}

function normalizeWave(value) {
  return String(value || "").trim().toUpperCase();
}

function dependencyTaskNumbers(value) {
  if (!value || /^none$/i.test(value)) return [];
  return [...value.matchAll(/Task\s+([0-9]+)/gi)].map((match) => match[1]);
}

function relativePath(path) {
  return relative(repo, path).replaceAll("\\", "/") || ".";
}

function ensureCleanTree() {
  const inside = run("git", ["rev-parse", "--is-inside-work-tree"], { stdio: "ignore" });
  if (inside.status !== 0) {
    fail(`BLOCKED: ${repo} is not a git repository.`);
  }
  const dirty = run("git", ["status", "--short"]).stdout.trim();
  if (dirty) {
    console.error("BLOCKED: working tree is not clean. Autopilot will not mix unrelated changes.");
    console.error(dirty);
    process.exit(2);
  }
}

function markTaskDone(specPath, taskNumber) {
  const source = taskSourcePath(specPath);
  const lines = readText(source).split(/\r?\n/);
  let changed = false;
  const updated = lines.map((line) => {
    if (!changed && new RegExp(`^- \\[ \\] Task ${taskNumber}:`).test(line)) {
      changed = true;
      return line.replace(/^- \[ \]/, "- [x]");
    }
    return line;
  });
  writeText(source, updated.join("\n"));
}

function taskHandoffPath(specPath, taskNumber) {
  return join(agentDir, "spec/handoffs", `${specNumberFromPath(specPath)}-task${taskNumber}.md`);
}

function tasteReportPath(specPath) {
  return join(agentDir, "spec/handoffs", `${specNumberFromPath(specPath)}-taste.md`);
}

function latestTasteReport(specPath) {
  if (isFolderSpec(specPath)) {
    const memory = memoryPath(specPath);
    if (tasteReportText(memory)) return memory;
  }
  const report = tasteReportPath(specPath);
  return existsSync(report) ? report : "";
}

function approvedActiveSpecs() {
  return activeSpecs().filter((specPath) => /^(Approved|In Progress)\b/.test(specStatus(specPath)));
}

function printAllApprovedPlan(specs) {
  console.log("Autopilot all-approved plan");
  console.log(`- Repo: ${repo}`);
  console.log(`- Specs: ${specs.length}`);
  for (const specPath of specs) {
    const plan = nextTaskPlan(specPath);
    const next = plan.next;
    const total = taskCount(specPath);
    const done = doneTaskCount(specPath);
    console.log(`\nSpec: ${relativePath(specPath)}`);
    console.log(`- Status: ${specStatus(specPath)}`);
    console.log(`- Tasks: ${done}/${total} done`);
    console.log(`- Task source: ${relativePath(taskSourcePath(specPath))}`);
    console.log(`- Memory: ${relativePath(memoryPath(specPath))}`);
    if (plan.blocked) {
      console.log("- Next task: blocked");
      console.log(`- Blocker: ${plan.blocked.replace(/^BLOCKED:\s*/, "")}`);
    } else if (next) {
      console.log(`- Next task: Task ${next.number} - ${next.title}`);
      console.log(`- Next wave: ${next.metadata.wave}`);
      console.log(`- Write scope: ${next.metadata["write scope"] || "missing"}`);
    } else {
      console.log("- Next task: none; taste is next");
    }
  }
}

function autopilotVerdictFromOutput(output) {
  if (output.includes("<autopilot>APPROVE</autopilot>")) return "APPROVE";
  if (output.includes("<autopilot>REQUEST_CHANGES</autopilot>")) return "REQUEST_CHANGES";
  if (output.includes("<autopilot>BLOCKED</autopilot>")) return "BLOCK";
  return "";
}

function outputExcerpt(output) {
  return output
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.includes("<autopilot>"))
    .slice(0, 12)
    .join("\n");
}

function outputBullets(output) {
  const excerpt = outputExcerpt(output);
  if (!excerpt) return "- fresh-agent output was empty; runner only observed the completion tag.";
  return excerpt.split(/\r?\n/).map((line) => `- ${line}`).join("\n");
}

function recommendedFollowupFromOutput(output) {
  return output.match(/\b(cook|fix)\b/i)?.[1]?.toLowerCase() || "";
}

function tasteBlockerCount(report) {
  const findings = extractStructuredSection(tasteReportText(report), "Findings");
  return findings ? findings.split(/\r?\n/).filter((line) => line.includes("BLOCKER")).length : 0;
}

function tasteFingerprint(report) {
  const text = tasteReportText(report);
  if (!text) return "";
  const selected = [
    extractStructuredSection(text, "Findings"),
    extractStructuredSection(text, "Coverage Gap"),
    extractStructuredSection(text, "Loop Recommendation"),
  ].filter(Boolean);
  return createHash("sha256")
    .update(selected.join("\n").toLowerCase().replace(/\s+/g, " "))
    .digest("hex")
    .slice(0, 16);
}

function tasteReleaseReadiness(report) {
  return tasteReportText(report).match(/^Release readiness:\s*(.+)$/m)?.[1]?.trim() || "";
}

function writeSelfHealedTaskHandoff(specPath, path, specRel, taskNumber, taskTitle, taskMeta, output) {
  const summary = isFolderSpec(specPath)
    ? "Fresh agent returned `<autopilot>DONE</autopilot>`, and the runner recorded a coordination summary in memory.md so later iterations keep the latest context."
    : "Fresh agent returned `<autopilot>DONE</autopilot>`, but the expected task handoff file was missing. The runner synthesized this handoff to keep coordination state aligned.";
  const body = `Status: done
Source spec: ${specRel}
Generated by: autopilot runner self-heal
Task: ${taskTitle}
Phase: ${taskMeta.phase || ""}
Story: ${taskMeta.story || ""}
Wave: ${taskMeta.wave || ""}
Covers: ${taskMeta.covers || ""}

### Summary
${summary}

### Evidence
${outputBullets(output)}

### Next
Use the existing spec and diff as the source of truth if a richer handoff is needed later.
`;
  if (isFolderSpec(specPath)) {
    appendMemorySection(specPath, `Task ${taskNumber} (autopilot runner)`, body);
    return;
  }
  writeText(path, `# Task Handoff: Task ${taskNumber}
${body}`);
}

function writeSelfHealedFollowupHandoff(specPath, path, specRel, recommendedSkill, output) {
  const summary = isFolderSpec(specPath)
    ? "Fresh agent returned `<autopilot>DONE</autopilot>`, and the runner recorded the follow-up summary in memory.md so the next taste iteration sees the latest context."
    : "Fresh agent returned `<autopilot>DONE</autopilot>`, but the expected follow-up handoff file was missing. The runner synthesized this handoff so the loop can continue without user cleanup.";
  const body = `Status: done
Source spec: ${specRel}
Generated by: autopilot runner self-heal
Loop skill: ${recommendedSkill}

### Summary
${summary}

### Evidence
${outputBullets(output)}

### Next
Re-run \`taste\` against the current diff and this spec.
`;
  if (isFolderSpec(specPath)) {
    appendMemorySection(specPath, `${recommendedSkill.toUpperCase()} Follow-up`, body);
    return;
  }
  writeText(path, `# ${recommendedSkill.toUpperCase()} Follow-up Handoff
${body}`);
}

function writeSelfHealedTasteReport(path, specPath, specRel, verdict, recommendedSkill, output) {
  const specNumber = specNumberFromPath(specPath);
  const specSlug = specSlugFromPath(specPath);
  const nextSkill = verdict === "APPROVE" ? "wrap" : verdict === "REQUEST_CHANGES" ? (recommendedSkill || "cook") : "recipe";
  const releaseReadiness = verdict === "APPROVE" ? "Ready for Wrap" : "Not Ready";
  const detailHeading = isFolderSpec(specPath) ? "###" : "##";
  const body = `Verdict: ${verdict}
Release readiness: ${releaseReadiness}
Reason: runner self-healed a missing taste report from the fresh-agent verdict.
Source spec: ${specRel}
Diff scope: current working tree for the active spec
Handoff source: autopilot runner self-heal
Evidence refs:
- Fresh-agent output captured by the runner for this iteration.

${detailHeading} Summary
Fresh agent returned \`${verdict}\`, but the expected taste report file was missing. The runner synthesized this report so downstream coordination can proceed without manual cleanup.

${detailHeading} Verification
- Regression: see evidence excerpt below.
- Acceptance coverage: not normalized by the runner.
- Project verify: not normalized by the runner.
- Manual checks: not recorded by the runner.

${detailHeading} Findings
- CONCERN: the original taste iteration omitted its structured report, so this synthesized report preserves only the runner-visible evidence.

${detailHeading} Coverage Gap
The original iteration did not leave the expected structured taste artifact.

${detailHeading} Loop Recommendation
Recommended skill: ${nextSkill}
Reason: proceed according to the verdict while keeping the synthesized report as the coordination source.

${detailHeading} Evidence Excerpt
${outputBullets(output)}
`;
  if (isFolderSpec(specPath)) {
    appendMemorySection(specPath, "Taste Report", body);
    return;
  }
  writeText(path, `# Taste Report: ${specNumber} ${specSlug}
${body}`);
}

function followupHandoffPath(specPath, skill) {
  return join(agentDir, "spec/handoffs", `${specNumberFromPath(specPath)}-${skill}-followup.md`);
}

function tasteLoopRecommendation(report) {
  return extractStructuredSection(tasteReportText(report), "Loop Recommendation").match(/\b(cook|fix)\b/i)?.[1]?.toLowerCase() || "";
}

function buildTaskPrompt(specRel, taskNumber, taskTitle, taskMeta) {
  const specNumber = specRel.split("/").find((part) => /^[0-9]{4}-/.test(part))?.slice(0, 4) || basename(specRel).slice(0, 4);
  const folderSpec = specRel.endsWith("/spec.md");
  const specDirRel = dirname(specRel);
  const tasksRel = folderSpec ? `${specDirRel}/tasks.md` : specRel;
  const memoryRel = folderSpec ? `${specDirRel}/memory.md` : "";
  const readContextLine = folderSpec
    ? `- ${memoryRel} if present`
    : `- legacy handoffs under .agent/spec/handoffs/${specNumber}-*.md if present`;
  const writeGuard = folderSpec
    ? `- Do not edit ${tasksRel} or ${memoryRel}; return changed files, commands, findings, and risks so the runner/cook can update coordination state.`
    : `- Do not edit ${tasksRel}; use existing legacy handoffs only as read-only context.`;
  return `You are a fresh vibe-recipe autopilot iteration. Work in exactly one bounded slice.

Read:
- AGENTS.md
- ${specRel}
- ${tasksRel}
${readContextLine}
- .agent/commands.json
- .agent/autopilot/progress.md if present

Task:
- Use the cook/dev contract.
- Implement only Task ${taskNumber}: ${taskTitle}
- Phase: ${taskMeta.phase}
- Story: ${taskMeta.story}
- Wave: ${taskMeta.wave}
- Covers: ${taskMeta.covers}
- Write scope: ${taskMeta["write scope"]}
- Dependency: ${taskMeta.dependency}
- Check: ${taskMeta.check}
- Preserve unrelated user changes and do not expand scope.
- Do not mark the task checkbox yourself; the runner will mark it after completion.
${writeGuard}
- Run the focused check for this task, then the relevant test command, and verify when practical.

Forbidden:
- Do not run serve.
- Do not push, deploy, publish, or call external release APIs.
- Do not approve specs or human-gated work.
- Stop if auth/payment/data-loss/external side effects require human approval.

Final response contract:
- If the task is complete and checks pass, include exactly: <autopilot>DONE</autopilot>
- If blocked or approval is needed, include exactly: <autopilot>BLOCKED</autopilot>
- Include concise evidence paths and command results. Do not paste long logs.
`;
}

function buildTastePrompt(specPath, specRel, specNumber) {
  const folderSpec = isFolderSpec(specPath);
  const memoryRel = relativePath(memoryPath(specPath));
  const readContext = folderSpec
    ? `Read AGENTS.md, the active spec folder, ${memoryRel} if present, git diff, and .agent/commands.json.`
    : "Read AGENTS.md, the active spec, cook/task handoffs, git diff, and .agent/commands.json.";
  const writeTarget = folderSpec
    ? `Append the taste report to ${memoryRel} under a new \`## Taste Report\` section. Inside that section, use \`### Summary\`, \`### Verification\`, \`### Findings\`, \`### Coverage Gap\`, and \`### Loop Recommendation\` headings.`
    : `Write the taste report to .agent/spec/handoffs/${specNumber}-taste.md.`;
  return `You are a fresh vibe-recipe autopilot review iteration.

Use the taste/review contract for ${specRel}.
${readContext}
${writeTarget}
Ensure the report includes the required Release readiness line.
Do not modify product code or spec scope.

Final response contract:
- If verdict is APPROVE, include exactly: <autopilot>APPROVE</autopilot>
- If verdict is REQUEST_CHANGES, include exactly: <autopilot>REQUEST_CHANGES</autopilot>
- If verdict is BLOCK, include exactly: <autopilot>BLOCKED</autopilot>
`;
}

function buildWrapPrompt(specRel, tasteReportRel) {
  return `You are a fresh vibe-recipe release-prep iteration.

Use the wrap/bump contract.
Read AGENTS.md, ${specRel}, ${tasteReportRel}, release commit range, and .agent/commands.json.
Use ${tasteReportRel} as the current spec's readiness evidence, and only prepare release files when the relevant taste reports say Release readiness: Ready for Wrap.
Build the release set from all active specs that are Ready for Wrap unless the user explicitly narrowed it.
Resolve exact release files before editing:
- Version source: use one public manifest path if the repo already has one; if the repo intentionally keeps mirrored public manifests in sync, treat that mirrored set as the version source; otherwise use '.agent/release-manifest.json'.
- Changelog source: use the repo's existing release notes file if one already exists; otherwise use 'CHANGELOG.md' at the repo root.
- Choose one canonical changelog source. For versioning, either choose one canonical source or one mirrored manifest set, cite the exact path or paths in the wrap summary, and do not update unrelated competing files.
Prepare version/changelog only if taste verdict is APPROVE, release readiness is Ready for Wrap, and verify is configured.
Do not tag, push, deploy, publish, or run serve.

Final response contract:
- If wrap summary is complete, include exactly: <autopilot>WRAPPED</autopilot>
- If blocked or approval is needed, include exactly: <autopilot>BLOCKED</autopilot>
`;
}

function buildFollowupPrompt(specPath, specRel, tasteReportRel, recommendedSkill, followupHandoffRel) {
  const folderSpec = isFolderSpec(specPath);
  const tasksRel = relativePath(taskSourcePath(specPath));
  const memoryRel = relativePath(memoryPath(specPath));
  const readContext = folderSpec
    ? `Read AGENTS.md, ${specRel}, ${tasksRel}, ${memoryRel} if present, the latest taste report section inside ${tasteReportRel}, git diff, and .agent/commands.json.`
    : `Read AGENTS.md, ${specRel}, ${tasteReportRel}, relevant task handoffs, and .agent/commands.json.`;
  const writeInstruction = folderSpec
    ? `Do not edit ${tasksRel} or ${memoryRel}; return changed files, commands, findings, and risks so the runner can append coordination state.`
    : `Write or update the follow-up handoff at ${followupHandoffRel}.`;
  return `You are a fresh vibe-recipe autopilot follow-up iteration.

Use the ${recommendedSkill} contract for ${specRel}.
${readContext}
Address the current REQUEST_CHANGES findings without expanding scope.
${writeInstruction}
Run the focused check for this follow-up, then the relevant test command, and verify when practical.

Forbidden:
- Do not run serve.
- Do not push, deploy, publish, or call external release APIs.
- Do not approve specs or human-gated work.
- Stop if auth/payment/data-loss/external side effects require human approval.

Final response contract:
- If the follow-up is complete and checks pass, include exactly: <autopilot>DONE</autopilot>
- If blocked or approval is needed, include exactly: <autopilot>BLOCKED</autopilot>
- Include concise evidence paths and command results. Do not paste long logs.
`;
}

function runFreshAgent(prompt) {
  if (options.dryRun) {
    console.log(prompt);
    return "";
  }
  const tmp = mkdtempSync(join(tmpdir(), "vibe-recipe-autopilot-"));
  const promptFile = join(tmp, "prompt.txt");
  writeFileSync(promptFile, prompt, "utf8");
  const command = options.tool === "codex" ? "codex" : "claude";
  const args = options.tool === "codex"
    ? ["exec", "--cd", repo, "--sandbox", "workspace-write", "-"]
    : ["--print"];
  const input = readFileSync(promptFile);
  const result = spawnSync(command, args, {
    cwd: repo,
    input,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  rmSync(tmp, { recursive: true, force: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  return result.stdout || "";
}

function printStatus(specPath, status, nextLine, total, done) {
  console.log("Autopilot status");
  console.log(`- Repo: ${repo}`);
  console.log(`- Active spec: ${relativePath(specPath)}`);
  console.log(`- Spec status: ${status}`);
  console.log(`- Tasks: ${done}/${total} done`);
  if (nextLine) {
    console.log(`- Next task: Task ${nextLine.number} - ${nextLine.title}`);
    console.log(`- Next wave: ${nextLine.metadata.wave}`);
  } else {
    console.log("- Next task: none");
  }
}

let agentRuns = 0;
function nextAgentIteration(maxIterations, specRel) {
  if (agentRuns >= maxIterations) {
    appendProgress("Max iterations reached", `- Max iterations: ${maxIterations}\n- Reason: fresh-agent budget exhausted before the next phase.`);
    writeState(specRel, agentRuns, "", "max_iterations");
    fail(`BLOCKED: reached max iterations (${maxIterations}).`, 1);
  }
  agentRuns += 1;
  return agentRuns;
}

if (options.allApproved) {
  const specs = approvedActiveSpecs();
  if (!specs.length) {
    fail("BLOCKED: no Approved or In Progress active specs found under .agent/spec/active/.");
  }
  printAllApprovedPlan(specs);
  if (options.dryRun || options.statusOnly) {
    process.exit(0);
  }
  fail("BLOCKED: --all-approved execution requires cook spec fan-out orchestration; rerun with --dry-run for the plan or invoke cook with human approval.", 2);
}

const spec = activeSpec();
if (!spec) {
  fail("BLOCKED: no active spec found under .agent/spec/active/.");
}

const status = specStatus(spec);
if (!/^(Approved|In Progress)\b/.test(status)) {
  fail(`PAUSED: active spec is ${status}. Autopilot requires Approved or In Progress.`);
}

let nextLine = nextTaskLine(spec);
const total = taskCount(spec);
const done = doneTaskCount(spec);
const specRel = relativePath(spec);

if (options.statusOnly) {
  printStatus(spec, status, nextLine, total, done);
  process.exit(0);
}

if (!options.dryRun) {
  ensureCleanTree();
  mkdirSync(autopilotDir, { recursive: true });
}

writeState(specRel, 0, "", "started");
appendProgress("Run started", `- Spec: ${specRel}\n- Tool: ${options.tool}\n- Stop point: ${options.stopPoint}\n- Max iterations: ${options.maxIterations}\n- Max follow-ups: ${options.maxFollowups}\n- Max same recommendation retries: ${options.maxSameRecommendationRetries}\n- Max taste loops: ${options.maxTasteLoops}`);

let followupCount = 0;
let tasteLoopCount = 0;
let lastRecommendation = "";
let sameRecommendationCount = 0;
let lastTasteFingerprint = "";
let lastTasteBlockers = -1;

for (let loop = 1; loop <= options.maxIterations; loop += 1) {
  nextLine = nextTaskLine(spec);
  if (nextLine) {
    const runIteration = nextAgentIteration(options.maxIterations, specRel);
    const taskNumber = nextLine.number;
    const taskTitle = nextLine.title;
    const taskMeta = nextLine.metadata;
    const handoff = taskHandoffPath(spec, taskNumber);
    const prompt = buildTaskPrompt(specRel, taskNumber, taskTitle, taskMeta);

    writeState(specRel, runIteration, `Task ${taskNumber}`, "running");
    appendProgress(`Iteration ${runIteration} started`, `- Task: Task ${taskNumber} - ${taskTitle}\n- Phase: ${taskMeta.phase}\n- Story: ${taskMeta.story}\n- Wave: ${taskMeta.wave}`);
    const output = runFreshAgent(prompt);
    if (options.dryRun) process.exit(0);

    if (output.includes("<autopilot>DONE</autopilot>")) {
      if (isFolderSpec(spec)) {
        writeSelfHealedTaskHandoff(spec, handoff, specRel, taskNumber, taskTitle, taskMeta, output);
        appendProgress(`Task ${taskNumber} memory updated`, `- Task: ${taskTitle}\n- Runner appended coordination state to: ${relativePath(memoryPath(spec))}`);
      } else if (!existsSync(handoff)) {
        writeSelfHealedTaskHandoff(spec, handoff, specRel, taskNumber, taskTitle, taskMeta, output);
        appendProgress(`Task ${taskNumber} self-healed`, `- Task: ${taskTitle}\n- Runner synthesized the missing task handoff: ${relativePath(handoff)}`);
      }
      markTaskDone(spec, taskNumber);
      appendProgress(`Task ${taskNumber} done`, `- Task: ${taskTitle}\n- Output: <autopilot>DONE</autopilot>`);
      writeState(specRel, runIteration, `Task ${taskNumber}`, "done");
      run("git", ["add", "-A"], { stdio: "inherit" });
      run("git", ["commit", "-m", `chore(autopilot): complete Task ${taskNumber}`, "-m", `Refs: ${specRel}`], { stdio: "inherit" });
      if (options.once) {
        console.log("PAUSED: completed one iteration.");
        process.exit(0);
      }
      continue;
    }

    appendProgress(`Task ${taskNumber} blocked`, `- Task: ${taskTitle}\n- Output did not report DONE.`);
    writeState(specRel, runIteration, `Task ${taskNumber}`, "blocked");
    fail(`BLOCKED: fresh agent did not complete Task ${taskNumber}.`);
  }

  const runIteration = nextAgentIteration(options.maxIterations, specRel);
  const specNumber = specNumberFromPath(spec);
  writeState(specRel, runIteration, "taste", "running");
  appendProgress(`Iteration ${runIteration} started`, `- Phase: taste\n- Spec: ${specRel}`);
  const output = runFreshAgent(buildTastePrompt(spec, specRel, specNumber));
  if (options.dryRun) process.exit(0);

  let tasteReport = latestTasteReport(spec);
  const tasteVerdict = autopilotVerdictFromOutput(output);
  if (!tasteReport && tasteVerdict) {
      const recommendedSkill = recommendedFollowupFromOutput(output);
      writeSelfHealedTasteReport(tasteReportPath(spec), spec, specRel, tasteVerdict, recommendedSkill, output);
      tasteReport = latestTasteReport(spec);
      appendProgress("Taste self-healed", `- Verdict: ${tasteVerdict}\n- Runner synthesized the missing taste report: ${relativePath(tasteReport)}`);
  }

  const reportText = tasteReport ? tasteReportText(tasteReport) : "";
  if (tasteVerdict === "APPROVE" || reportText.includes("Verdict: APPROVE")) {
    const releaseReadiness = tasteReport ? tasteReleaseReadiness(tasteReport) : "";
    if (!tasteReport) {
      appendProgress("Taste blocked", "- Verdict was APPROVE but no spec-specific taste report could be synthesized.");
      writeState(specRel, runIteration, "taste", "blocked");
      fail("BLOCKED: taste approved but no spec-specific taste report was available.");
    }
    appendProgress("Taste approved", `- Taste report: ${tasteReport ? relativePath(tasteReport) : "from fresh-agent output"}\n- Release readiness: ${releaseReadiness || "missing"}`);
    writeState(specRel, runIteration, "taste", "approved");
    if (options.stopPoint === "taste") {
      console.log("<promise>COMPLETE</promise>");
      process.exit(0);
    }
    if (releaseReadiness !== "Ready for Wrap") {
      appendProgress("Wrap blocked", `- Reason: taste approved without Ready for Wrap readiness\n- Release readiness: ${releaseReadiness || "missing"}`);
      writeState(specRel, runIteration, "taste", "blocked");
      fail("BLOCKED: taste approved but release readiness is not Ready for Wrap.");
    }

    const wrapIteration = nextAgentIteration(options.maxIterations, specRel);
    writeState(specRel, wrapIteration, "wrap", "running");
    appendProgress(`Iteration ${wrapIteration} started`, "- Phase: wrap\n- Stop point: wrap");
    const wrapOutput = runFreshAgent(buildWrapPrompt(specRel, relativePath(tasteReport)));
    if (wrapOutput.includes("<autopilot>WRAPPED</autopilot>")) {
      appendProgress("Wrap complete", "- Output: <autopilot>WRAPPED</autopilot>");
      writeState(specRel, wrapIteration, "wrap", "wrapped");
      console.log("<promise>COMPLETE</promise>");
      process.exit(0);
    }
    appendProgress("Wrap blocked", "- Output did not report WRAPPED.");
    writeState(specRel, wrapIteration, "wrap", "blocked");
    fail("BLOCKED: wrap did not complete.");
  }

  if (tasteVerdict === "REQUEST_CHANGES") {
    writeState(specRel, runIteration, "taste", "request_changes");
    if (options.once) {
      console.log("PAUSED: taste requested changes.");
      process.exit(2);
    }
    if (followupCount >= options.maxFollowups) {
      appendProgress("Taste blocked", `- Reason: follow-up budget exhausted\n- Follow-ups used: ${followupCount}/${options.maxFollowups}`);
      fail("BLOCKED: taste requested changes after follow-up budget was exhausted.");
    }
    if (!tasteReport) {
      fail("BLOCKED: taste requested changes but no spec-specific taste report was written.");
    }

    let recommendedSkill = tasteLoopRecommendation(tasteReport) || recommendedFollowupFromOutput(output) || "cook";
    const currentTasteBlockers = tasteBlockerCount(tasteReport);
    const currentTasteFingerprint = tasteFingerprint(tasteReport);
    tasteLoopCount += 1;
    sameRecommendationCount = recommendedSkill === lastRecommendation ? sameRecommendationCount + 1 : 1;

    let progressReason = "first request-changes loop";
    if (lastTasteFingerprint) {
      if (currentTasteFingerprint === lastTasteFingerprint && recommendedSkill === lastRecommendation && currentTasteBlockers >= lastTasteBlockers) {
        progressReason = "no structural change: same findings, same recommendation, blockers did not decrease";
      } else if (currentTasteBlockers < lastTasteBlockers) {
        progressReason = `progress: blocker count decreased from ${lastTasteBlockers} to ${currentTasteBlockers}`;
      } else if (currentTasteFingerprint !== lastTasteFingerprint) {
        progressReason = "progress: taste findings changed";
      } else if (recommendedSkill !== lastRecommendation) {
        progressReason = `progress: loop recommendation changed from ${lastRecommendation} to ${recommendedSkill}`;
      } else {
        progressReason = "progress: bounded retry remains available";
      }
    }

    appendProgress("Taste requested changes", `- Recommended skill: ${recommendedSkill}\n- Follow-ups used: ${followupCount}/${options.maxFollowups}\n- Taste loops: ${tasteLoopCount}/${options.maxTasteLoops}\n- Same recommendation retries: ${sameRecommendationCount}/${options.maxSameRecommendationRetries}\n- Blockers: ${currentTasteBlockers}\n- Progress signal: ${progressReason}`);

    if (tasteLoopCount > options.maxTasteLoops) {
      appendProgress("Taste blocked", `- Reason: taste loop budget exhausted\n- Taste loops used: ${tasteLoopCount}/${options.maxTasteLoops}`);
      fail(`BLOCKED: taste requested changes exceeded max taste loops (${options.maxTasteLoops}).`);
    }
    if (sameRecommendationCount > options.maxSameRecommendationRetries) {
      appendProgress("Taste blocked", `- Reason: same follow-up recommendation repeated too many times\n- Recommended skill: ${recommendedSkill}\n- Same recommendation retries: ${sameRecommendationCount}/${options.maxSameRecommendationRetries}`);
      fail(`BLOCKED: follow-up recommendation ${recommendedSkill} repeated more than ${options.maxSameRecommendationRetries} times.`);
    }
    if (lastTasteFingerprint && currentTasteFingerprint === lastTasteFingerprint && recommendedSkill === lastRecommendation && currentTasteBlockers >= lastTasteBlockers) {
      appendProgress("Taste blocked", `- Reason: repeated REQUEST_CHANGES fingerprint without improvement\n- Recommended skill: ${recommendedSkill}\n- Blockers: ${currentTasteBlockers}`);
      fail("BLOCKED: taste repeated the same REQUEST_CHANGES findings without measurable improvement.");
    }

    lastTasteFingerprint = currentTasteFingerprint;
    lastTasteBlockers = currentTasteBlockers;
    lastRecommendation = recommendedSkill;

    const followupIteration = nextAgentIteration(options.maxIterations, specRel);
    const followupHandoff = followupHandoffPath(spec, recommendedSkill);
    const followupHandoffRel = relativePath(followupHandoff);
    writeState(specRel, followupIteration, `${recommendedSkill}-followup`, "running");
    appendProgress(`Iteration ${followupIteration} started`, `- Phase: ${recommendedSkill}-followup\n- Taste report: ${relativePath(tasteReport)}`);
    followupCount += 1;
    const followupOutput = runFreshAgent(buildFollowupPrompt(spec, specRel, relativePath(tasteReport), recommendedSkill, followupHandoffRel));

    if (followupOutput.includes("<autopilot>DONE</autopilot>")) {
      if (isFolderSpec(spec)) {
        writeSelfHealedFollowupHandoff(spec, followupHandoff, specRel, recommendedSkill, followupOutput);
        appendProgress("Follow-up memory updated", `- Recommended skill: ${recommendedSkill}\n- Runner appended coordination state to: ${relativePath(memoryPath(spec))}`);
      } else if (!existsSync(followupHandoff)) {
        writeSelfHealedFollowupHandoff(spec, followupHandoff, specRel, recommendedSkill, followupOutput);
        appendProgress("Follow-up self-healed", `- Recommended skill: ${recommendedSkill}\n- Runner synthesized the missing follow-up handoff: ${relativePath(followupHandoff)}`);
      }
      appendProgress("Follow-up done", `- Recommended skill: ${recommendedSkill}\n- Output: <autopilot>DONE</autopilot>`);
      writeState(specRel, followupIteration, `${recommendedSkill}-followup`, "done");
      run("git", ["add", "-A"], { stdio: "inherit" });
      run("git", ["commit", "-m", "chore(autopilot): address taste follow-up", "-m", `Refs: ${specRel}`], { stdio: "inherit" });
      continue;
    }

    appendProgress("Follow-up blocked", `- Recommended skill: ${recommendedSkill}\n- Output did not report DONE.`);
    writeState(specRel, followupIteration, `${recommendedSkill}-followup`, "blocked");
    fail(`BLOCKED: ${recommendedSkill} follow-up did not complete.`);
  }

  appendProgress("Taste blocked", "- Output did not report APPROVE.");
  writeState(specRel, runIteration, "taste", "blocked");
  fail("BLOCKED: taste did not approve.");
}

writeState(specRel, agentRuns, "", "max_iterations");
appendProgress("Max iterations reached", `- Max iterations: ${options.maxIterations}\n- Used fresh-agent runs: ${agentRuns}`);
fail(`BLOCKED: reached max iterations (${options.maxIterations}).`, 1);
