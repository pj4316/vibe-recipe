const REQUIRED_TASK_METADATA = [
  "phase",
  "story",
  "covers",
  "write scope",
  "dependency",
  "wave",
  "parallel",
  "check",
];

export function parseTaskBlocks(taskBody) {
  const lines = taskBody.split(/\r?\n/);
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

export function parseExecutionOrder(taskBody) {
  const lines = taskBody.split(/\r?\n/);
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

export function taskPlanFromBody(taskBody) {
  const tasks = parseTaskBlocks(taskBody);
  const done = tasks.filter((task) => task.done).length;
  if (!tasks.length) {
    return { tasks, done, total: 0, next: null, blocked: "" };
  }

  const executionOrder = parseExecutionOrder(taskBody);
  if (!executionOrder.hasSection || !executionOrder.hasPhaseOrder || !executionOrder.waves.length) {
    return {
      tasks,
      done,
      total: tasks.length,
      next: null,
      blocked: "BLOCKED: spec is missing a valid ## 실행 순서 section with Phase order and wave entries. Run plate before autopilot.",
    };
  }

  for (const task of tasks) {
    const missing = REQUIRED_TASK_METADATA.filter((key) => !task.metadata[key]);
    if (missing.length) {
      return {
        tasks,
        done,
        total: tasks.length,
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
      tasks,
      done,
      total: tasks.length,
      next: null,
      blocked: `BLOCKED: execution order is missing wave entries for ${missingWaves.join(", ")}. Run plate before autopilot.`,
    };
  }

  const doneTasks = new Set(tasks.filter((task) => task.done).map((task) => task.number));

  for (const wave of executionOrder.waves) {
    const waveTasks = tasks.filter((task) => normalizeWave(task.metadata.wave) === wave);
    const pending = waveTasks.filter((task) => !task.done);
    if (!pending.length) continue;

    for (const task of pending) {
      const deps = dependencyTaskNumbers(task.metadata.dependency);
      const missingDeps = deps.filter((dep) => !doneTasks.has(dep));
      if (!missingDeps.length) {
        return { tasks, done, total: tasks.length, next: task, blocked: "" };
      }
    }

    const blocked = pending
      .map((task) => `Task ${task.number} waits for ${dependencyTaskNumbers(task.metadata.dependency).filter((dep) => !doneTasks.has(dep)).map((dep) => `Task ${dep}`).join(", ")}`)
      .join("; ");
    return {
      tasks,
      done,
      total: tasks.length,
      next: null,
      blocked: `BLOCKED: no runnable task in ${wave}. ${blocked}`,
    };
  }

  return { tasks, done, total: tasks.length, next: null, blocked: "" };
}

export function normalizeWave(value) {
  return String(value || "").trim().toUpperCase();
}

export function dependencyTaskNumbers(value) {
  if (!value || /^none$/i.test(value)) return [];
  return [...value.matchAll(/Task\s+([0-9]+)/gi)].map((match) => match[1]);
}
