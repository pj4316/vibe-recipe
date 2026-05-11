import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const TEMPLATE = path.join(ROOT, 'templates', 'recommendation-block.md');
const DOC = path.join(ROOT, 'docs', 'recommendation-block.md');

test('recommendation block template exists', () => {
  assert.ok(existsSync(TEMPLATE), `template missing: ${TEMPLATE}`);
});

test('recommendation block template has required headers', () => {
  const body = readFileSync(TEMPLATE, 'utf8');
  assert.match(body, /### 현재 상태/);
  assert.match(body, /### 추천 행동/);
  assert.match(body, /### 사용자 확인이 필요한 이유/);
});

test('recommendation block doc enumerates 5 HITL gates', () => {
  assert.ok(existsSync(DOC), `doc missing: ${DOC}`);
  const body = readFileSync(DOC, 'utf8');
  for (const gate of ['taste', 'wrap', 'serve', 'fix', 'cook']) {
    assert.match(body, new RegExp(gate, 'i'), `doc missing gate: ${gate}`);
  }
});

test('skip option for HITL gates is documented', () => {
  const body = readFileSync(DOC, 'utf8');
  assert.match(body, /skip/i, 'skip option must be documented');
});
