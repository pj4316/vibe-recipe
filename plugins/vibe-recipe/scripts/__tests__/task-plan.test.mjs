import { test } from "node:test";
import assert from "node:assert/strict";
import { taskPlanFromBody } from "../lib/task-plan.mjs";

function task(number, title, metadata = {}, checked = " ") {
  const lines = [`- [${checked}] Task ${number}: ${title}`];
  for (const [key, value] of Object.entries({
    Phase: "Foundation",
    Story: "Shared",
    Covers: "AC-001",
    "Write scope": "src/",
    Dependency: "None",
    Wave: "W00",
    Parallel: "No",
    Check: "npm test",
    ...metadata,
  })) {
    lines.push(`  - ${key}: ${value}`);
  }
  return lines.join("\n");
}

function body(tasks, executionOrder = ["- Phase order: Foundation", "- W00: Task 0"]) {
  return [
    "# Task Plan",
    "",
    "## 작업 목록",
    ...tasks,
    "",
    "## 실행 순서",
    ...executionOrder,
    "",
  ].join("\n");
}

test("task plan selects the first pending task in wave order", () => {
  const plan = taskPlanFromBody(body([
    task("0", "foundation", {}, "x"),
    task("1", "feature", { Wave: "W01" }),
  ], [
    "- Phase order: Foundation -> Feature",
    "- W00: Task 0",
    "- W01: Task 1",
  ]));

  assert.equal(plan.total, 2);
  assert.equal(plan.done, 1);
  assert.equal(plan.blocked, "");
  assert.equal(plan.next.number, "1");
  assert.equal(plan.next.title, "feature");
});

test("task plan blocks when execution order is missing", () => {
  const plan = taskPlanFromBody([
    "# Task Plan",
    "",
    "## 작업 목록",
    task("0", "foundation"),
    "",
  ].join("\n"));

  assert.equal(plan.next, null);
  assert.match(plan.blocked, /missing a valid ## 실행 순서/);
});

test("task plan blocks when plate metadata is incomplete", () => {
  const incomplete = [
    "- [ ] Task 0: foundation",
    "  - Phase: Foundation",
    "  - Story: Shared",
  ].join("\n");
  const plan = taskPlanFromBody(body([incomplete]));

  assert.equal(plan.next, null);
  assert.match(plan.blocked, /Task 0 is missing plate metadata/);
  assert.match(plan.blocked, /write scope/);
});

test("task plan blocks a wave when dependencies are not done", () => {
  const plan = taskPlanFromBody(body([
    task("0", "foundation", { Dependency: "Task 1" }),
    task("1", "dependency", { Wave: "W01" }),
  ], [
    "- Phase order: Foundation -> Feature",
    "- W00: Task 0",
    "- W01: Task 1",
  ]));

  assert.equal(plan.next, null);
  assert.match(plan.blocked, /no runnable task in W00/);
  assert.match(plan.blocked, /Task 0 waits for Task 1/);
});

test("task plan reports missing wave entries", () => {
  const plan = taskPlanFromBody(body([
    task("0", "foundation", { Wave: "W02" }),
  ]));

  assert.equal(plan.next, null);
  assert.match(plan.blocked, /missing wave entries for W02/);
});
