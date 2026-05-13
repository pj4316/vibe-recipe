import { isAbsolute, relative, resolve } from "node:path";

const IGNORED_SCOPE_VALUES = /^(tbd|tbd by plate|none|n\/a|missing|-|)$/i;

function splitTopLevelList(value) {
  const parts = [];
  let current = "";
  let braceDepth = 0;
  let inBacktick = false;

  for (const char of String(value || "")) {
    if (char === "`") {
      inBacktick = !inBacktick;
      current += char;
      continue;
    }
    if (!inBacktick && char === "{") braceDepth += 1;
    if (!inBacktick && char === "}" && braceDepth > 0) braceDepth -= 1;
    if (!inBacktick && (char === "," || char === ";" || char === "\n") && braceDepth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  parts.push(current);
  return parts;
}

function stripScopeCommentary(part) {
  let stripped = String(part || "").trim();
  while (/\s+\([^()]*\)\s*$/.test(stripped)) {
    stripped = stripped.replace(/\s+\([^()]*\)\s*$/, "").trimEnd();
  }
  return stripped;
}

function expandBracePathspec(pathspec) {
  const match = String(pathspec || "").match(/\{([^{}]+)\}/);
  if (!match) return [pathspec];

  const [pattern, rawOptions] = match;
  const options = splitTopLevelList(rawOptions);
  return options.flatMap((option) => expandBracePathspec(pathspec.replace(pattern, option.trim())));
}

export function pathspecsFromWriteScope(writeScope) {
  return splitTopLevelList(writeScope)
    .map((part) => part.trim())
    .map((part) => part.replace(/^[-*]\s+/, ""))
    .map((part) => part.replace(/[`'"]/g, ""))
    .map(stripScopeCommentary)
    .map((part) => part.replace(/[.。]+$/, ""))
    .map((part) => part.trim())
    .flatMap((part) => expandBracePathspec(part))
    .filter((part) => !IGNORED_SCOPE_VALUES.test(part));
}

export function normalizeRepoPathspec(repo, pathspec) {
  const raw = String(pathspec || "").trim();
  if (!raw) return "";
  if (raw.startsWith(":")) {
    throw new Error(`pathspec magic is not allowed in write scope: ${raw}`);
  }

  const absolute = isAbsolute(raw) ? raw : resolve(repo, raw);
  const normalized = relative(repo, absolute).replaceAll("\\", "/") || ".";
  if (normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`write scope escapes repository: ${raw}`);
  }
  if (normalized === ".git" || normalized.startsWith(".git/")) {
    throw new Error(`write scope cannot target .git: ${raw}`);
  }
  return normalized;
}

export function uniquePathspecs(repo, pathspecs) {
  return [...new Set(pathspecs.map((pathspec) => normalizeRepoPathspec(repo, pathspec)).filter(Boolean))];
}

export function allowedTaskCommitPathspecs(repo, writeScope, coordinationPaths = []) {
  return uniquePathspecs(repo, [
    ...pathspecsFromWriteScope(writeScope),
    ...coordinationPaths,
  ]);
}

export function pathspecCoversRepoPath(pathspec, repoPath) {
  const scope = String(pathspec || "").replaceAll("\\", "/").replace(/\/+$/, "");
  const path = String(repoPath || "").replaceAll("\\", "/").replace(/\/+$/, "");
  if (!scope || scope === ".") return true;
  return path === scope || path.startsWith(`${scope}/`);
}

export function outOfScopeRepoPaths(paths, allowedPathspecs) {
  return paths.filter((path) => !allowedPathspecs.some((pathspec) => pathspecCoversRepoPath(pathspec, path)));
}
