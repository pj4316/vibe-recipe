import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIGRATE = path.resolve(HERE, '..', 'state-migrate.mjs');

function makeLegacyFixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'vibe-recipe-legacy-'));
  const active = path.join(root, 'spec', 'active');
  const handoffs = path.join(root, 'spec', 'handoffs');
  mkdirSync(active, { recursive: true });
  mkdirSync(handoffs, { recursive: true });

  writeFileSync(path.join(active, '0001-foo.md'), [
    '# 0001 Foo Feature',
    '',
    'Status: Approved',
    '',
    '## 요약',
    'A sample legacy spec.',
    '',
    '## 사용자 시나리오',
    '### US-001',
    '- Goal: do foo',
    '- AC-001: foo works.',
    '',
    '## 구현 계획',
    '- Approach: write foo module.',
    '',
    '## 작업 목록',
    '- [x] Task 0: write failing test',
    '  - Phase: Foundation',
    '  - Wave: W00',
    '  - Parallel: No',
    '- [x] Task 1: implement foo',
    '  - Phase: US-001',
    '  - Wave: W01',
    '  - Parallel: Yes',
    '- [ ] Task 2: polish docs',
    '  - Phase: Polish',
    '  - Wave: W02',
    '  - Parallel: Yes',
    '',
    '## 실행 순서',
    '- Phase order: Foundation -> US-001 -> Polish',
    '- W00: Task 0',
    '- W01: Task 1',
    '- W02: Task 2',
    '',
    '## 검증 계획',
    '- test: npm test',
    '',
    '## Plate 상태',
    '- Status: Planned',
    '',
  ].join('\n'));

  writeFileSync(path.join(handoffs, '0001-recipe.md'), '# Recipe Handoff 0001\nSpec drafted.\n');
  writeFileSync(path.join(handoffs, '0001-plate.md'), '# Plate Handoff 0001\nPlan accepted.\n');
  writeFileSync(path.join(handoffs, '0001-cook.md'), '# Cook Handoff 0001\nTasks 0,1 done.\n');
  writeFileSync(path.join(handoffs, '0001-task1.md'), '# Task 1 handoff\nImplemented foo.\n');
  writeFileSync(path.join(handoffs, '0001-taste.md'), [
    '# Taste Report: 0001 foo',
    'Verdict: APPROVE',
    'Release readiness: Ready for Wrap',
    '',
    '## Summary',
    'Foo is ready.',
    '',
    '## Findings',
    '- SUGGESTION: none',
    '',
  ].join('\n'));

  writeFileSync(path.join(root, 'spec', 'INDEX.md'), '# Spec INDEX\n- 0001 Foo\n');
  writeFileSync(path.join(handoffs, 'INDEX.md'), '# Handoffs INDEX\n- 0001 recipe/plate/cook\n');
  return root;
}

function makeMixedFixture() {
  const root = makeLegacyFixture();
  const done = path.join(root, 'spec', 'done', '0002-bar');
  mkdirSync(done, { recursive: true });
  writeFileSync(path.join(done, 'spec.md'), '# 0002 Bar\n\nStatus: Done\n');
  writeFileSync(path.join(root, 'spec', 'handoffs', '0002-taste.md'), '# Taste Report: 0002 bar\n');
  writeFileSync(path.join(root, 'spec', 'INDEX.md'), '# Spec INDEX\n- 0001 Foo\n- 0002 Bar\n');
  return root;
}

async function importMigrate() {
  if (!existsSync(MIGRATE)) {
    throw new Error(`state-migrate.mjs not found at ${MIGRATE}`);
  }
  return await import(pathToFileURL(MIGRATE).href);
}

test('state-migrate exposes migrate function', async () => {
  const mod = await importMigrate();
  assert.equal(typeof mod.migrate, 'function', 'migrate export expected');
});

test('state-migrate produces spec folder with spec.md/tasks.md/memory.md', async (t) => {
  const root = makeLegacyFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const { migrate } = await importMigrate();
  const result = await migrate({ root: path.join(root, 'spec'), apply: true });

  assert.equal(result.status, 'ok', 'expected ok status');
  const folder = path.join(root, 'spec', 'active', '0001-foo');
  assert.ok(existsSync(folder), 'spec folder missing');
  assert.ok(existsSync(path.join(folder, 'spec.md')), 'spec.md missing');
  assert.ok(existsSync(path.join(folder, 'tasks.md')), 'tasks.md missing');
  assert.ok(existsSync(path.join(folder, 'memory.md')), 'memory.md missing');
});

test('state-migrate preserves intent in spec.md and tasks in tasks.md', async (t) => {
  const root = makeLegacyFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const { migrate } = await importMigrate();
  await migrate({ root: path.join(root, 'spec'), apply: true });

  const folder = path.join(root, 'spec', 'active', '0001-foo');
  const specBody = readFileSync(path.join(folder, 'spec.md'), 'utf8');
  const tasksBody = readFileSync(path.join(folder, 'tasks.md'), 'utf8');

  assert.match(specBody, /Status: Approved/);
  assert.match(specBody, /AC-001/);
  assert.doesNotMatch(specBody, /^## 작업 목록/m, 'task list must move out of spec.md');

  assert.match(tasksBody, /Task 0/);
  assert.match(tasksBody, /Task 1/);
  assert.match(tasksBody, /Task 2/);
  assert.match(tasksBody, /## 구현 계획/);
  assert.match(tasksBody, /## 실행 순서/);
  assert.match(tasksBody, /## 검증 계획/);
  assert.doesNotMatch(specBody, /^## 실행 순서/m, 'execution order must move out of spec.md');
});

test('state-migrate merges legacy handoffs into memory.md by skill', async (t) => {
  const root = makeLegacyFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const { migrate } = await importMigrate();
  await migrate({ root: path.join(root, 'spec'), apply: true });

  const memory = readFileSync(
    path.join(root, 'spec', 'active', '0001-foo', 'memory.md'),
    'utf8',
  );
  assert.match(memory, /## recipe/i, 'memory missing recipe section');
  assert.match(memory, /## plate/i, 'memory missing plate section');
  assert.match(memory, /## cook/i, 'memory missing cook section');
  assert.match(memory, /^## Taste Report$/mi, 'memory missing normalized taste section');
  assert.doesNotMatch(memory, /^## taste$/mi, 'legacy taste section title should be normalized');
  assert.match(memory, /Release readiness: Ready for Wrap/);
  assert.match(memory, /^### Summary$/mi, 'taste subheadings should be nested under Taste Report');
  assert.match(memory, /^### Findings$/mi, 'taste findings should remain readable after migration');
  assert.match(memory, /Spec drafted/);
  assert.match(memory, /Implemented foo/);
});

test('state-migrate removes legacy handoffs/ and INDEX.md after apply', async (t) => {
  const root = makeLegacyFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const { migrate } = await importMigrate();
  await migrate({ root: path.join(root, 'spec'), apply: true });

  assert.ok(!existsSync(path.join(root, 'spec', 'handoffs')), 'handoffs/ must be removed');
  assert.ok(!existsSync(path.join(root, 'spec', 'INDEX.md')), 'INDEX.md must be removed');
});

test('state-migrate preserves unrelated handoffs and INDEX.md in mixed repos', async (t) => {
  const root = makeMixedFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const { migrate } = await importMigrate();
  await migrate({ root: path.join(root, 'spec'), apply: true });

  const handoffsDir = path.join(root, 'spec', 'handoffs');
  assert.ok(existsSync(handoffsDir), 'handoffs/ must remain when non-migrated files exist');
  assert.ok(existsSync(path.join(handoffsDir, '0002-taste.md')), 'unrelated handoff must remain');
  assert.ok(!existsSync(path.join(handoffsDir, '0001-cook.md')), 'migrated handoff must be removed');
  assert.deepEqual(readdirSync(handoffsDir).sort(), ['0002-taste.md', 'INDEX.md']);
  assert.ok(existsSync(path.join(root, 'spec', 'INDEX.md')), 'INDEX.md must remain for mixed repos');
});

test('state-migrate dry-run leaves filesystem untouched', async (t) => {
  const root = makeLegacyFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const { migrate } = await importMigrate();
  const plan = await migrate({ root: path.join(root, 'spec'), apply: false });

  assert.equal(plan.status, 'preview');
  assert.ok(Array.isArray(plan.moves) && plan.moves.length > 0, 'preview must list moves');
  assert.ok(existsSync(path.join(root, 'spec', 'active', '0001-foo.md')), 'original file must remain');
  assert.ok(existsSync(path.join(root, 'spec', 'handoffs', '0001-cook.md')), 'handoff must remain');
});

test('state-migrate CLI preview executes when run directly', (t) => {
  const root = makeLegacyFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const result = spawnSync(process.execPath, [MIGRATE, path.join(root, 'spec')], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || 'CLI should exit cleanly');
  const preview = JSON.parse(result.stdout);
  assert.equal(preview.status, 'preview');
  assert.ok(preview.moves.length > 0, 'CLI preview should list planned moves');
});
