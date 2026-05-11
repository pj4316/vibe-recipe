import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TEMPLATES = path.join(ROOT, 'templates');

test('spec folder scaffold templates exist', () => {
  const base = path.join(TEMPLATES, '.agent', 'spec', 'active', 'EXAMPLE');
  assert.ok(existsSync(path.join(base, 'spec.md')), 'spec.md template missing');
  assert.ok(existsSync(path.join(base, 'tasks.md')), 'tasks.md template missing');
  assert.ok(existsSync(path.join(base, 'memory.md')), 'memory.md template missing');
});

test('commands.json parallelism example exists and is valid', () => {
  const example = path.join(TEMPLATES, 'commands.parallelism.example.json');
  assert.ok(existsSync(example), 'parallelism example missing');
  const body = JSON.parse(readFileSync(example, 'utf8'));
  assert.ok(body.parallelism, 'parallelism key required');
  assert.equal(typeof body.parallelism.worker_pool, 'number');
  assert.ok(['auto', 'ask', 'off'].includes(body.parallelism.spec_fan_out));
});

test('tasks.md template documents task metadata fields', () => {
  const body = readFileSync(
    path.join(TEMPLATES, '.agent', 'spec', 'active', 'EXAMPLE', 'tasks.md'),
    'utf8',
  );
  for (const field of ['Phase', 'Story', 'Covers', 'Write scope', 'Dependency', 'Wave', 'Parallel', 'Check']) {
    assert.match(body, new RegExp(field), `tasks.md template missing ${field}`);
  }
});

test('memory.md template has Shared section header', () => {
  const body = readFileSync(
    path.join(TEMPLATES, '.agent', 'spec', 'active', 'EXAMPLE', 'memory.md'),
    'utf8',
  );
  assert.match(body, /## Shared/);
});
