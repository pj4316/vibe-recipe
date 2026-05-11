import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MOVED_SECTION_HEADERS = new Set([
  '## 구현 계획',
  '## 작업 목록',
  '## 실행 순서',
  '## 검증 계획',
  '## Plate 상태',
]);

function readUtf8(file) {
  return readFileSync(file, 'utf8');
}

function writeUtf8(file, body) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, body.endsWith('\n') ? body : `${body}\n`);
}

function listLegacySpecs(activeDir) {
  if (!existsSync(activeDir)) {
    return [];
  }

  return readdirSync(activeDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^\d{4}-.+\.md$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

function splitSpecBody(body) {
  const specLines = [];
  const taskLines = ['# Task Plan', ''];
  let currentTarget = specLines;
  let movedAny = false;

  for (const line of body.split(/\r?\n/)) {
    if (line.startsWith('## ') && MOVED_SECTION_HEADERS.has(line.trim())) {
      currentTarget = taskLines;
      movedAny = true;
    } else if (line.startsWith('## ') && movedAny) {
      currentTarget = specLines;
    }

    currentTarget.push(line);
  }

  return {
    spec: trimBlankLines(specLines).join('\n'),
    tasks: trimBlankLines(taskLines).join('\n'),
  };
}

function trimBlankLines(lines) {
  const result = [...lines];
  while (result.length > 0 && result[0].trim() === '') {
    result.shift();
  }
  while (result.length > 0 && result[result.length - 1].trim() === '') {
    result.pop();
  }
  return result;
}

function handoffSectionName(fileName, specNumber) {
  const base = path.basename(fileName, '.md');
  const prefix = `${specNumber}-`;
  return base.startsWith(prefix) ? base.slice(prefix.length) : base;
}

function memorySectionTitle(section) {
  if (/^taste$/i.test(section)) {
    return 'Taste Report';
  }
  return section;
}

function normalizeTasteMemoryBody(body) {
  const lines = body.split(/\r?\n/);
  if (/^#\s+Taste Report\b/i.test(lines[0] || '')) {
    lines.shift();
  }

  return trimBlankLines(
    lines.map((line) => (line.startsWith('## ') ? line.replace(/^## /, '### ') : line)),
  ).join('\n');
}

function memorySectionBody(section, body) {
  const trimmed = body.trim();
  if (/^taste$/i.test(section)) {
    return normalizeTasteMemoryBody(trimmed);
  }
  return trimmed;
}

function buildMemory(specNumber, handoffsDir) {
  const lines = ['# Memory', '', '## Shared', ''];

  if (!existsSync(handoffsDir)) {
    return `${lines.join('\n')}\n`;
  }

  const files = readdirSync(handoffsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name !== 'INDEX.md')
    .filter((entry) => entry.name.startsWith(`${specNumber}-`) && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort();

  for (const file of files) {
    const section = handoffSectionName(file, specNumber);
    const sectionTitle = memorySectionTitle(section);
    const sectionBody = memorySectionBody(section, readUtf8(path.join(handoffsDir, file)));
    lines.push(`## ${sectionTitle}`, '', sectionBody, '');
  }

  return `${trimBlankLines(lines).join('\n')}\n`;
}

function migratedSpecNumbers(specs) {
  return specs.map((file) => path.basename(file, '.md').split('-')[0]);
}

function listLegacySpecFiles(root) {
  const buckets = ['active', 'done', 'archived', 'abandoned'];
  return buckets.flatMap((bucket) => {
    const dir = path.join(root, bucket);
    if (!existsSync(dir)) {
      return [];
    }
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^\d{4}-.+\.md$/.test(entry.name))
      .map((entry) => path.join(dir, entry.name));
  });
}

function listRemainingHandoffs(handoffsDir, migratedNumbers) {
  if (!existsSync(handoffsDir)) {
    return [];
  }

  return readdirSync(handoffsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name !== 'INDEX.md' && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .filter((name) => !migratedNumbers.some((specNumber) => name.startsWith(`${specNumber}-`)));
}

function canDeleteLegacyIndexes(root, handoffsDir, specs) {
  const migratedNumbers = migratedSpecNumbers(specs);
  const remainingSpecs = listLegacySpecFiles(root)
    .filter((file) => !path.dirname(file).endsWith(`${path.sep}active`))
    .length;
  const remainingActiveSpecs = listLegacySpecs(path.join(root, 'active'))
    .filter((file) => !specs.includes(file))
    .length;
  const remainingHandoffs = listRemainingHandoffs(handoffsDir, migratedNumbers).length;
  return remainingSpecs === 0 && remainingActiveSpecs === 0 && remainingHandoffs === 0;
}

function buildPlan(root, specs) {
  const activeDir = path.join(root, 'active');
  const handoffsDir = path.join(root, 'handoffs');
  const moves = [];
  const deleteLegacyIndexes = canDeleteLegacyIndexes(root, handoffsDir, specs);

  for (const file of specs) {
    const slug = path.basename(file, '.md');
    const folder = path.join(activeDir, slug);
    moves.push({ from: path.join(activeDir, file), to: path.join(folder, 'spec.md') });
    moves.push({ from: '(extracted task sections)', to: path.join(folder, 'tasks.md') });
    moves.push({ from: path.join(handoffsDir, `${slug.split('-')[0]}-*.md`), to: path.join(folder, 'memory.md') });
  }

  if (deleteLegacyIndexes && existsSync(path.join(root, 'INDEX.md'))) {
    moves.push({ from: path.join(root, 'INDEX.md'), to: '(delete)' });
  }
  if (deleteLegacyIndexes && existsSync(handoffsDir)) {
    moves.push({ from: handoffsDir, to: '(delete after merge)' });
  }

  return moves;
}

export async function migrate({ root, apply = false } = {}) {
  if (!root) {
    throw new Error('migrate requires root');
  }

  const activeDir = path.join(root, 'active');
  const handoffsDir = path.join(root, 'handoffs');
  const specs = listLegacySpecs(activeDir);
  const deleteLegacyIndexes = canDeleteLegacyIndexes(root, handoffsDir, specs);
  const moves = buildPlan(root, specs);

  if (!apply) {
    return { status: 'preview', root, specs, moves };
  }

  for (const file of specs) {
    const slug = path.basename(file, '.md');
    const specNumber = slug.split('-')[0];
    const source = path.join(activeDir, file);
    const folder = path.join(activeDir, slug);
    const { spec, tasks } = splitSpecBody(readUtf8(source));

    mkdirSync(folder, { recursive: true });
    writeUtf8(path.join(folder, 'spec.md'), spec);
    writeUtf8(path.join(folder, 'tasks.md'), tasks);
    writeUtf8(path.join(folder, 'memory.md'), buildMemory(specNumber, handoffsDir));
    rmSync(source, { force: true });
    if (existsSync(handoffsDir)) {
      for (const handoff of readdirSync(handoffsDir, { withFileTypes: true })) {
        if (handoff.isFile() && handoff.name.startsWith(`${specNumber}-`) && handoff.name.endsWith('.md')) {
          rmSync(path.join(handoffsDir, handoff.name), { force: true });
        }
      }
    }
  }

  if (deleteLegacyIndexes) {
    rmSync(path.join(root, 'INDEX.md'), { force: true });
    rmSync(handoffsDir, { recursive: true, force: true });
  }

  return { status: 'ok', root, specs, moves };
}

const isMain = process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isMain) {
  const root = process.argv[2] || path.join(process.cwd(), '.agent', 'spec');
  const apply = process.argv.includes('--apply');
  const result = await migrate({ root, apply });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
