// Starter updates: brings a project's core (everything that isn't an add-on)
// up to the starter's latest (docs/adr/0010). Add-ons have their own command,
// `pnpm addon update`.
//
// `starter.lock.json` records the starter commit the project last matched:
//   { source: { repo, ref }, commit }
// Each file that changed in the starter since that commit is replaced when
// nobody touched it here, merged line by line when both sides changed it, and
// otherwise kept, with the starter's version beside it as `<file>.starter-update`.
//
// `starter.json` in the starter lists the paths a project owns (`projectOwned`,
// globs with `*` and `**`); those are never updated.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

import { CATALOG_DIR, readLock as readAddonLock } from '../addon/lib.mjs';

export const LOCK_FILE = 'starter.lock.json';
export const CONFIG_FILE = 'starter.json';
export const UPDATE_SUFFIX = '.starter-update';

export class StarterError extends Error {}

const FILE_MODES = new Set(['100644', '100755']);
const EXECUTABLE = '100755';

// ── git ──────────────────────────────────────────────────────────────

function git(cwd, args, { buffer = false, allowFail = false } = {}) {
  const run = spawnSync('git', ['-C', cwd, ...args], {
    encoding: buffer ? 'buffer' : 'utf8',
    maxBuffer: 512 * 1024 * 1024,
  });
  if (run.status === 0) return run.stdout;
  if (allowFail) return null;
  throw new StarterError(
    `git ${args.join(' ')} didn't work:\n  ${String(run.stderr || run.error?.message || '').trim()}`,
  );
}

// The id git gives a file's contents, so local files compare against the
// starter's without downloading its copies.
const blobId = (buf) =>
  createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

const blob = (repo, oid) =>
  git(repo, ['cat-file', 'blob', oid], { buffer: true });

// Every file in a commit: path → { mode, oid }.
function tree(repo, commit) {
  const files = new Map();
  const out = git(repo, ['ls-tree', '-r', '-z', commit]);
  for (const entry of out.split('\0')) {
    if (!entry) continue;
    const tab = entry.indexOf('\t');
    const [mode, , oid] = entry.slice(0, tab).split(' ');
    files.set(entry.slice(tab + 1), { mode, oid });
  }
  return files;
}

// ── where the starter is ─────────────────────────────────────────────

export function readLock(root) {
  const file = path.join(root, LOCK_FILE);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
}

export function writeLock(root, { source, commit }) {
  writeFileSync(
    path.join(root, LOCK_FILE),
    `${JSON.stringify({ ...(source && { source }), commit }, null, 2)}\n`,
  );
}

// Where the starter lives when nobody says: this project's own record, or
// the one the add-ons keep.
export function knownSource(root) {
  return readLock(root).source ?? readAddonLock(root).source;
}

// The starter's history, ready to read: a local copy as it is, or a download
// without file contents (git fetches the few that are needed).
export function openStarter(source, ref, tmpDir) {
  if (existsSync(source)) {
    if (git(source, ['rev-parse', '--git-dir'], { allowFail: true }) === null)
      throw new StarterError(`${source} isn't a git copy of the starter.`);
    return {
      repo: source,
      latest: git(source, ['rev-parse', `${ref ?? 'HEAD'}^{commit}`]).trim(),
    };
  }
  const repo = path.join(tmpDir, 'starter');
  const run = spawnSync(
    'git',
    [
      'clone',
      '--quiet',
      '--filter=blob:none',
      '--no-checkout',
      ...(ref ? ['--branch', ref] : []),
      source,
      repo,
    ],
    { encoding: 'utf8' },
  );
  if (run.status !== 0)
    throw new StarterError(
      `Couldn't download the starter from ${source}:\n  ${(run.stderr || run.error?.message || '').trim()}`,
    );
  return { repo, latest: git(repo, ['rev-parse', 'HEAD^{commit}']).trim() };
}

export function resolveCommit(starter, name) {
  const commit = git(starter.repo, ['rev-parse', `${name}^{commit}`], {
    allowFail: true,
  });
  if (commit === null)
    throw new StarterError(`The starter has no commit called "${name}".`);
  return commit.trim();
}

// One line about a commit, for a person: short id, day, subject.
export function describeCommit(starter, commit) {
  const [id, day, ...subject] = git(starter.repo, [
    'show',
    '-s',
    '--format=%h%x09%cs%x09%s',
    commit,
  ])
    .trim()
    .split('\t');
  return { id, day, subject: subject.join('\t') };
}

export const commitsBetween = (starter, base, latest = starter.latest) =>
  Number(
    git(starter.repo, ['rev-list', '--count', `${base}..${latest}`]).trim(),
  );

// A project made from the template starts with one fresh commit, so the
// starter it was copied from is the newest starter commit before that one.
export function guessBase(root, starter) {
  const roots = git(root, ['rev-list', '--max-parents=0', 'HEAD'], {
    allowFail: true,
  });
  if (!roots?.trim())
    throw new StarterError(
      "This project has no git history to date it by, so there's no telling which starter it began from. Run again with --base <starter commit>.",
    );
  const firsts = roots.trim().split('\n');
  const shared = firsts.some(
    (commit) =>
      git(starter.repo, ['cat-file', '-e', `${commit}^{commit}`], {
        allowFail: true,
      }) !== null,
  );
  if (shared)
    throw new StarterError(
      "This project shares its history with the starter (it's the starter itself, or a clone or fork of it), so git already knows what changed: pull or merge from the starter instead. To use this command anyway, run again with --base <starter commit>.",
    );
  const born = Math.min(
    ...firsts.map((commit) =>
      Number(git(root, ['show', '-s', '--format=%ct', commit]).trim()),
    ),
  );
  const base = git(starter.repo, [
    'rev-list',
    '-1',
    `--min-age=${born}`,
    starter.latest,
  ]).trim();
  if (!base)
    throw new StarterError(
      'This project is older than the starter, so there is no starting point to guess. Run again with --base <starter commit>.',
    );
  return base;
}

// ── which files are core ─────────────────────────────────────────────

export function globToRegExp(glob) {
  const body = glob
    .split(/(\*\*\/|\*\*|\*)/)
    .map((part) => {
      if (part === '**/') return '(?:.*/)?';
      if (part === '**') return '.*';
      if (part === '*') return '[^/]*';
      return part.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
  return new RegExp(`^${body}$`);
}

function addonTargets(repo, files) {
  const targets = new Set();
  const manifest = new RegExp(`^${CATALOG_DIR}/[^/]+/addon\\.json$`);
  for (const [file, { oid }] of files) {
    if (!manifest.test(file)) continue;
    const addon = JSON.parse(blob(repo, oid).toString('utf8'));
    for (const entry of addon.files ?? []) targets.add(entry.target);
  }
  return targets;
}

function coreFilter(repo, before, after) {
  // An add-on's files at either end belong to `pnpm addon update`, also when
  // the add-on has since left or joined the catalog.
  const owned = new Set([
    ...addonTargets(repo, before),
    ...addonTargets(repo, after),
  ]);
  const config = after.get(CONFIG_FILE);
  const globs = config
    ? (JSON.parse(blob(repo, config.oid).toString('utf8')).projectOwned ?? [])
    : [];
  const projectOwned = globs.map(globToRegExp);
  return (file) =>
    file !== LOCK_FILE &&
    !file.startsWith(`${CATALOG_DIR}/`) &&
    !owned.has(file) &&
    !projectOwned.some((rule) => rule.test(file));
}

function localFile(root, file) {
  const full = path.join(root, file);
  if (!existsSync(full)) return { state: 'missing' };
  if (!statSync(full).isFile()) return { state: 'blocked' };
  const content = readFileSync(full);
  return { state: 'file', content, oid: blobId(content) };
}

// How well a starting point fits: the core files there that are exactly the
// same here. A good guess matches most of them.
export function baseFit(root, starter, base) {
  const before = tree(starter.repo, base);
  const core = coreFilter(
    starter.repo,
    before,
    tree(starter.repo, starter.latest),
  );
  let same = 0;
  let total = 0;
  for (const [file, { mode, oid }] of before) {
    if (!core(file) || !FILE_MODES.has(mode)) continue;
    total += 1;
    if (localFile(root, file).oid === oid) same += 1;
  }
  return { same, total };
}

// ── the plan ─────────────────────────────────────────────────────────

// git's own test: text has no NUL byte in its first 8000.
const isBinary = (buf) => buf.subarray(0, 8000).includes(0);

// Both sides' changes combined, or null when they overlap (or can't be
// combined as text). A merged .json that no longer parses counts as overlap.
function mergeText(file, mine, base, theirs, tmpDir) {
  if ([mine, base, theirs].some(isBinary)) return null;
  const dir = mkdtempSync(path.join(tmpDir, 'merge-'));
  const names = ['mine', 'base', 'theirs'].map((name) => path.join(dir, name));
  [mine, base, theirs].forEach((buf, i) => writeFileSync(names[i], buf));
  const run = spawnSync('git', ['merge-file', '-p', ...names], {
    encoding: 'buffer',
    maxBuffer: 512 * 1024 * 1024,
  });
  if (run.status !== 0) return null;
  if (file.endsWith('.json')) {
    try {
      JSON.parse(run.stdout.toString('utf8'));
    } catch {
      return null;
    }
  }
  return run.stdout;
}

function decide(root, starter, file, was, now, tmpDir) {
  const { repo } = starter;
  if ([was, now].some((entry) => entry && !FILE_MODES.has(entry.mode)))
    return {
      kind: 'kept',
      note: 'is a link or a nested repo in the starter, which this command leaves to a person',
    };
  const local = localFile(root, file);
  if (local.state === 'blocked')
    return {
      kind: 'kept',
      note: 'is a folder here but a file in the starter, so it was left alone',
    };
  const mode = now?.mode;

  if (!was) {
    if (local.state === 'missing')
      return { kind: 'added', content: blob(repo, now.oid), mode };
    if (local.oid === now.oid) return null;
    return {
      kind: 'attention',
      content: blob(repo, now.oid),
      note: 'is new in the starter, but a different file with that name is already here',
    };
  }
  if (!now) {
    if (local.state === 'missing') return null;
    if (local.oid === was.oid) return { kind: 'removed' };
    return {
      kind: 'kept',
      note: 'was removed from the starter, but was changed here, so it was kept',
    };
  }
  if (local.state === 'missing')
    return {
      kind: 'kept',
      note: 'changed in the starter, but was deleted here, so it stays deleted',
    };
  if (local.oid === now.oid) return null;
  if (local.oid === was.oid)
    return { kind: 'updated', content: blob(repo, now.oid), mode };

  const theirs = blob(repo, now.oid);
  const merged = mergeText(
    file,
    local.content,
    blob(repo, was.oid),
    theirs,
    tmpDir,
  );
  if (merged) return { kind: 'merged', content: merged };
  return {
    kind: 'attention',
    content: theirs,
    note: isBinary(theirs)
      ? "changed in the starter and here, and isn't text, so it was kept"
      : 'changed in the same place in the starter and here, so it was kept',
  };
}

// What an update from `base` to the starter's latest would do, changing
// nothing: [{ file, kind, note?, content?, mode? }] with kind one of
// updated, merged, added, removed, attention (needs a person), kept.
export function planUpdate(root, starter, base, tmpDir) {
  const before = tree(starter.repo, base);
  const after = tree(starter.repo, starter.latest);
  const core = coreFilter(starter.repo, before, after);
  const actions = [];
  for (const file of [...new Set([...before.keys(), ...after.keys()])].sort()) {
    if (!core(file)) continue;
    const was = before.get(file);
    const now = after.get(file);
    if (was?.oid === now?.oid) continue;
    const action = decide(root, starter, file, was, now, tmpDir);
    if (action) actions.push({ file, ...action });
  }
  return actions;
}

// ── applying it ──────────────────────────────────────────────────────

function pruneEmptyDirs(root, from) {
  let dir = path.dirname(from);
  while (
    dir.startsWith(root) &&
    dir !== root &&
    existsSync(dir) &&
    readdirSync(dir).length === 0
  ) {
    rmdirSync(dir);
    dir = path.dirname(dir);
  }
}

export function applyPlan(root, actions) {
  for (const action of actions) {
    const target = path.join(root, action.file);
    switch (action.kind) {
      case 'added':
      case 'updated':
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, action.content);
        chmodSync(target, action.mode === EXECUTABLE ? 0o755 : 0o644);
        break;
      case 'merged':
        writeFileSync(target, action.content);
        break;
      case 'attention':
        writeFileSync(target + UPDATE_SUFFIX, action.content);
        break;
      case 'removed':
        rmSync(target);
        pruneEmptyDirs(root, target);
        break;
      default:
    }
  }
}

// pnpm reads package versions from both.
export const packagesChanged = (actions) =>
  actions.some(
    ({ file, kind }) =>
      ['added', 'updated', 'merged', 'removed'].includes(kind) &&
      ['package.json', 'pnpm-workspace.yaml'].includes(path.basename(file)),
  );
