// Add-ons: optional pieces of the starter that a project adds when it needs
// them and can take out cleanly (docs/adr/0009, docs/plans/add-ons-and-prototype-viewer.md).
//
// Each add-on is a folder in the catalog (`add-ons/<name>/`) holding an
// `addon.json` in the shadcn registry-item shape plus the files it copies in.
// Our extras live in `meta`:
//   meta.version       the add-on's version
//   meta.owner         who to ask about it
//   meta.packageJson   [{ file, scripts?, dependencies?, devDependencies? }]
//                      keys merged into package.json files, removed again on
//                      remove when untouched
//   meta.blocks        [{ file, after?, comment, content }] text inserted
//                      between `addon:<name>` markers, after the line `after`
//                      (or at the end of the file); remove deletes the markers
//                      and everything between them
// `registryDependencies` lists other add-ons this one needs.
//
// What a project has installed is recorded in `addons.lock.json`, with a
// hash of every file copied in and the package.json values it set, so remove
// and update only touch what nobody changed. The lock's `source` says where
// the starter lives, for update (and for projects without an add-ons folder).

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

export const LOCK_FILE = 'addons.lock.json';
export const CATALOG_DIR = 'add-ons';
// a changed file's new version is put beside it under this ending
export const UPDATE_SUFFIX = '.addon-update';
const NAME_RULE = /^[a-z0-9][a-z0-9-]*$/;
const DEP_KINDS = ['scripts', 'dependencies', 'devDependencies'];

export class AddonError extends Error {}

const hash = (buf) => createHash('sha256').update(buf).digest('hex');

// A file marked `"project": true` in addon.json is a starting point the
// project fills in (figma.json, a tracker): once it's in, it's the project's.
// Adding leaves an existing one alone, updating never overwrites it, and the
// check doesn't expect it to match the catalog.
const projectOwned = (file) => file.project === true;
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const writeJson = (file, data) =>
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);

// ── catalog ──────────────────────────────────────────────────────────

export function readCatalog(catalogDir) {
  if (!existsSync(catalogDir)) {
    throw new AddonError(`No add-on catalog at ${catalogDir}.`);
  }
  const addons = {};
  for (const name of readdirSync(catalogDir).sort()) {
    const manifest = path.join(catalogDir, name, 'addon.json');
    if (!existsSync(manifest)) continue;
    addons[name] = { ...readJson(manifest), dir: path.join(catalogDir, name) };
  }
  return addons;
}

// Problems with the catalog itself, as a list of sentences (empty when fine).
export function validateCatalog(catalog) {
  const problems = [];
  for (const [name, addon] of Object.entries(catalog)) {
    const where = `add-ons/${name}`;
    if (addon.name !== name)
      problems.push(`${where}: "name" must be "${name}".`);
    if (!NAME_RULE.test(name))
      problems.push(
        `${where}: names are lowercase letters, numbers and hyphens.`,
      );
    for (const field of ['title', 'description']) {
      if (!addon[field]) problems.push(`${where}: "${field}" is missing.`);
    }
    for (const field of ['version', 'owner']) {
      if (!addon.meta?.[field])
        problems.push(`${where}: "meta.${field}" is missing.`);
    }
    for (const dep of addon.registryDependencies ?? []) {
      if (!catalog[dep])
        problems.push(`${where}: needs "${dep}", which isn't in the catalog.`);
    }
    for (const file of addon.files ?? []) {
      if (!existsSync(path.join(addon.dir, file.path))) {
        problems.push(`${where}: ${file.path} is listed but missing.`);
      }
      if (
        path.isAbsolute(file.target) ||
        file.target.split(/[\\/]/).includes('..')
      ) {
        problems.push(`${where}: ${file.target} must stay inside the project.`);
      }
    }
  }
  return problems;
}

// Add-ons in the order to install them: what each needs comes first.
export function installOrder(catalog, names) {
  const order = [];
  const visit = (name, trail) => {
    if (!catalog[name])
      throw new AddonError(
        `There's no add-on called "${name}". Run: pnpm addon list`,
      );
    if (trail.includes(name))
      throw new AddonError(
        `Add-ons need each other in a loop: ${[...trail, name].join(' → ')}`,
      );
    if (order.includes(name)) return;
    for (const dep of catalog[name].registryDependencies ?? [])
      visit(dep, [...trail, name]);
    order.push(name);
  };
  names.forEach((name) => visit(name, []));
  return order;
}

// ── lock file ────────────────────────────────────────────────────────

// Remembers where the starter lives, for the next update.
export function setSource(root, source) {
  const lock = readLock(root);
  lock.source = source;
  writeLock(root, lock);
}

export function readLock(root) {
  const file = path.join(root, LOCK_FILE);
  return existsSync(file) ? readJson(file) : { addons: {} };
}

function writeLock(root, lock) {
  const sorted = Object.fromEntries(
    Object.entries(lock.addons).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeJson(path.join(root, LOCK_FILE), {
    ...(lock.source && { source: lock.source }),
    addons: sorted,
  });
}

// The package.json values an add-on sets, as the lock records them:
// { "<file>": { "<kind>": { key: value } } }
function packageRecord(addon) {
  const record = {};
  for (const pkg of addon.meta?.packageJson ?? []) {
    for (const kind of DEP_KINDS) {
      if (!pkg[kind] || !Object.keys(pkg[kind]).length) continue;
      record[pkg.file] ??= {};
      record[pkg.file][kind] = { ...record[pkg.file][kind], ...pkg[kind] };
    }
  }
  return record;
}

function lockEntry(addon, files) {
  const packageJson = packageRecord(addon);
  return {
    version: addon.meta?.version ?? '0.0.0',
    files,
    ...(Object.keys(packageJson).length && { packageJson }),
  };
}

// ── blocks ───────────────────────────────────────────────────────────

function markers(name, comment, indent = '') {
  const wrap =
    comment === 'html' ? (t) => `<!-- ${t} -->` : (t) => `${comment} ${t}`;
  return [
    `${indent}${wrap(`addon:${name}`)}`,
    `${indent}${wrap(`/addon:${name}`)}`,
  ];
}

// Markdown sections get blank lines inside their markers so the formatter
// leaves them alone. A section added at the end of a file gets a blank line
// before it, which remove takes away again.
function blockText(name, block) {
  const indent = block.content.match(/^[ \t]*/)[0];
  const [open, close] = markers(name, block.comment, indent);
  const content = block.content.replace(/\n$/, '');
  return block.comment === 'html'
    ? `${open}\n\n${content}\n\n${close}\n`
    : `${open}\n${content}\n${close}\n`;
}

function hasBlock(text, name, block) {
  return text.includes(markers(name, block.comment)[0].trim());
}

function insertBlock(text, name, block) {
  const body = blockText(name, block);
  if (!block.after) {
    const base = text.replace(/\n*$/, '\n');
    return base.trim() ? `${base}\n${body}` : body;
  }
  const at = text.indexOf(block.after);
  if (at === -1)
    throw new AddonError(
      `${block.file}: can't find the line to add after:\n  ${block.after}`,
    );
  const lineEnd = text.indexOf('\n', at + block.after.length);
  const cut = lineEnd === -1 ? text.length : lineEnd + 1;
  return `${text.slice(0, cut)}${body}${text.slice(cut)}`;
}

function removeBlock(text, name, block) {
  const [open, close] = markers(name, block.comment).map((m) => m.trim());
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.trim() === open);
  const end = lines.findIndex((l, i) => i > start && l.trim() === close);
  if (start === -1 || end === -1) return text;
  const from =
    !block.after && start > 0 && lines[start - 1] === '' ? start - 1 : start;
  lines.splice(from, end - from + 1);
  return lines.join('\n');
}

// ── add ──────────────────────────────────────────────────────────────

// Everything that would stop an add-on going in cleanly, checked before
// anything is written.
function addConflicts(root, addon) {
  const problems = [];
  for (const file of addon.files ?? []) {
    const target = path.join(root, file.target);
    if (!existsSync(target) || projectOwned(file)) continue;
    const wanted = readFileSync(path.join(addon.dir, file.path));
    if (hash(readFileSync(target)) !== hash(wanted)) {
      problems.push(`${file.target} already exists and is different.`);
    }
  }
  for (const pkg of addon.meta?.packageJson ?? []) {
    const file = path.join(root, pkg.file);
    if (!existsSync(file)) {
      problems.push(`${pkg.file} doesn't exist.`);
      continue;
    }
    const current = readJson(file);
    for (const kind of DEP_KINDS) {
      for (const [key, value] of Object.entries(pkg[kind] ?? {})) {
        const have = current[kind]?.[key];
        if (have !== undefined && have !== value) {
          problems.push(
            `${pkg.file}: ${kind}.${key} is already "${have}" (the add-on wants "${value}").`,
          );
        }
      }
    }
  }
  for (const block of addon.meta?.blocks ?? []) {
    const file = path.join(root, block.file);
    const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
    if (
      block.after &&
      !hasBlock(text, addon.name, block) &&
      !text.includes(block.after)
    ) {
      problems.push(
        `${block.file}: can't find the line to add after: ${block.after}`,
      );
    }
  }
  return problems;
}

// Package lists stay alphabetical, the way pnpm writes them; scripts keep
// the order they were added in.
function withKey(object, key, value, kind) {
  const entries = [...Object.entries(object), [key, value]];
  if (kind !== 'scripts')
    entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return Object.fromEntries(entries);
}

function addOne(root, addon, lock) {
  const problems = addConflicts(root, addon);
  if (problems.length) {
    throw new AddonError(
      `Can't add "${addon.name}":\n  - ${problems.join('\n  - ')}`,
    );
  }
  const files = {};
  for (const file of addon.files ?? []) {
    const target = path.join(root, file.target);
    if (projectOwned(file) && existsSync(target)) {
      files[file.target] = hash(readFileSync(path.join(addon.dir, file.path)));
      continue;
    }
    mkdirSync(path.dirname(target), { recursive: true });
    cpSync(path.join(addon.dir, file.path), target);
    files[file.target] = hash(readFileSync(target));
  }
  let packagesChanged = false;
  for (const pkg of addon.meta?.packageJson ?? []) {
    const file = path.join(root, pkg.file);
    const current = readJson(file);
    for (const kind of DEP_KINDS) {
      for (const [key, value] of Object.entries(pkg[kind] ?? {})) {
        if (current[kind]?.[key] === value) continue;
        current[kind] = withKey(current[kind] ?? {}, key, value, kind);
        if (kind !== 'scripts') packagesChanged = true;
      }
    }
    writeJson(file, current);
  }
  for (const block of addon.meta?.blocks ?? []) {
    const file = path.join(root, block.file);
    const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
    if (hasBlock(text, addon.name, block)) continue;
    writeFileSync(file, insertBlock(text, addon.name, block));
  }
  lock.addons[addon.name] = lockEntry(addon, files);
  return { packagesChanged };
}

// When an installed add-on's files all match the catalog but the lock still
// records older copies (the catalog changed), record the current ones.
function refreshLock(root, addon, lock) {
  const files = {};
  for (const file of addon.files ?? []) {
    const target = path.join(root, file.target);
    const source = path.join(addon.dir, file.path);
    if (projectOwned(file) && existsSync(target)) {
      files[file.target] = hash(readFileSync(source));
      continue;
    }
    if (
      !existsSync(target) ||
      hash(readFileSync(target)) !== hash(readFileSync(source))
    )
      return false;
    files[file.target] = hash(readFileSync(target));
  }
  const entry = lockEntry(addon, files);
  if (JSON.stringify(entry) === JSON.stringify(lock.addons[addon.name]))
    return false;
  lock.addons[addon.name] = entry;
  return true;
}

export function addAddons(root, catalog, names) {
  const lock = readLock(root);
  const added = [];
  let packagesChanged = false;
  for (const name of installOrder(catalog, names)) {
    if (lock.addons[name]) {
      if (refreshLock(root, catalog[name], lock)) writeLock(root, lock);
      continue;
    }
    packagesChanged =
      addOne(root, catalog[name], lock).packagesChanged || packagesChanged;
    writeLock(root, lock);
    added.push(name);
  }
  return { added, packagesChanged };
}

// ── update ───────────────────────────────────────────────────────────

function replaceBlock(text, name, block) {
  const [open, close] = markers(name, block.comment).map((m) => m.trim());
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.trim() === open);
  const end = lines.findIndex((l, i) => i > start && l.trim() === close);
  if (start === -1 || end === -1) return insertBlock(text, name, block);
  const body = blockText(name, block).replace(/\n$/, '').split('\n');
  lines.splice(start, end - start + 1, ...body);
  return lines.join('\n');
}

// Brings one installed add-on up to the catalog's version. What nobody changed
// is replaced; what someone changed is kept, with the new version beside it.
function updateOne(root, addon, lock) {
  const entry = lock.addons[addon.name];
  const changes = [];
  const attention = [];
  let packagesChanged = false;

  const files = {};
  for (const file of addon.files ?? []) {
    const target = path.join(root, file.target);
    const source = path.join(addon.dir, file.path);
    const wanted = hash(readFileSync(source));
    files[file.target] = wanted;
    const recorded = entry.files[file.target];
    if (!existsSync(target)) {
      // deleted here on purpose (a sample, say): it stays deleted
      if (recorded) continue;
      mkdirSync(path.dirname(target), { recursive: true });
      cpSync(source, target);
      changes.push(`added ${file.target}`);
      continue;
    }
    if (projectOwned(file)) continue;
    const have = hash(readFileSync(target));
    if (have === wanted) continue;
    if (have === recorded) {
      cpSync(source, target);
      changes.push(`updated ${file.target}`);
      continue;
    }
    cpSync(source, target + UPDATE_SUFFIX);
    attention.push(
      `${file.target} was changed here, so it was kept. The new version is beside it: ${file.target}${UPDATE_SUFFIX}`,
    );
  }
  for (const [target, recorded] of Object.entries(entry.files)) {
    if (target in files) continue;
    const file = path.join(root, target);
    if (!existsSync(file)) continue;
    if (hash(readFileSync(file)) === recorded) {
      rmSync(file);
      pruneEmptyDirs(root, file);
      changes.push(`removed ${target} (no longer part of it)`);
    } else {
      attention.push(
        `${target} is no longer part of "${addon.name}", but was changed here, so it was kept.`,
      );
    }
  }

  const before = entry.packageJson ?? {};
  const after = packageRecord(addon);
  for (const file of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const pkgFile = path.join(root, file);
    if (!existsSync(pkgFile)) continue;
    const current = readJson(pkgFile);
    let touched = false;
    for (const kind of DEP_KINDS) {
      const was = before[file]?.[kind] ?? {};
      const now = after[file]?.[kind] ?? {};
      for (const [key, value] of Object.entries(now)) {
        const have = current[kind]?.[key];
        if (have === value) continue;
        if (have === undefined || have === was[key]) {
          current[kind] =
            have === undefined
              ? withKey(current[kind] ?? {}, key, value, kind)
              : { ...current[kind], [key]: value };
          changes.push(`${file}: ${kind}.${key} is now "${value}"`);
          if (kind !== 'scripts') packagesChanged = true;
          touched = true;
        } else {
          attention.push(
            `${file}: ${kind}.${key} is "${have}" here, so it was kept. The add-on now uses "${value}".`,
          );
        }
      }
      for (const [key, value] of Object.entries(was)) {
        if (key in now || current[kind]?.[key] !== value) continue;
        delete current[kind][key];
        changes.push(`${file}: removed ${kind}.${key}`);
        if (kind !== 'scripts') packagesChanged = true;
        touched = true;
      }
    }
    if (touched) writeJson(pkgFile, current);
  }

  for (const block of addon.meta?.blocks ?? []) {
    const file = path.join(root, block.file);
    const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
    const next = replaceBlock(text, addon.name, block);
    if (next === text) continue;
    writeFileSync(file, next);
    changes.push(`updated its section in ${block.file}`);
  }

  lock.addons[addon.name] = lockEntry(addon, files);
  return { from: entry.version, changes, attention, packagesChanged };
}

// Brings installed add-ons (all of them, or the ones named) up to the
// catalog, adding anything the new versions need that isn't installed yet.
export function updateAddons(root, catalog, names = []) {
  const lock = readLock(root);
  const wanted = names.length ? names : Object.keys(lock.addons);
  for (const name of wanted) {
    if (!lock.addons[name])
      throw new AddonError(
        `"${name}" isn't installed. Run: pnpm addon add ${name}`,
      );
  }
  const missing = wanted.filter((name) => !catalog[name]);
  if (missing.length)
    throw new AddonError(
      `Not in the catalog any more: ${missing.join(', ')}. Remove ${missing.length > 1 ? 'them' : 'it'} with: pnpm addon remove ${missing.join(' ')}`,
    );
  const result = { updated: [], added: [], packagesChanged: false };
  for (const name of installOrder(catalog, wanted)) {
    const addon = catalog[name];
    if (!lock.addons[name]) {
      result.packagesChanged =
        addOne(root, addon, lock).packagesChanged || result.packagesChanged;
      result.added.push(name);
    } else if (wanted.includes(name)) {
      const report = updateOne(root, addon, lock);
      result.packagesChanged ||= report.packagesChanged;
      result.updated.push({
        name,
        to: addon.meta?.version ?? '0.0.0',
        ...report,
      });
    }
    writeLock(root, lock);
  }
  return result;
}

// ── where the catalog comes from ─────────────────────────────────────

// The add-ons folder in a local copy of the starter, or in a fresh partial
// download of it (only add-ons/, latest commit) into tmpDir.
export function fetchCatalog(source, ref, tmpDir) {
  if (existsSync(source)) {
    const inside = path.join(source, CATALOG_DIR);
    return existsSync(inside) ? inside : source;
  }
  const into = path.join(tmpDir, 'starter');
  const git = (...args) => {
    const run = spawnSync('git', args, { encoding: 'utf8' });
    if (run.status !== 0)
      throw new AddonError(
        `Couldn't download the add-ons from ${source}:\n  ${(run.stderr || run.error?.message || '').trim()}`,
      );
  };
  git(
    'clone',
    '--quiet',
    '--depth=1',
    '--filter=blob:none',
    '--sparse',
    ...(ref ? ['--branch', ref] : []),
    source,
    into,
  );
  git('-C', into, 'sparse-checkout', 'set', '--no-cone', `/${CATALOG_DIR}/`);
  const catalog = path.join(into, CATALOG_DIR);
  if (!existsSync(catalog))
    throw new AddonError(
      `The starter at ${source}${ref ? ` (${ref})` : ''} has no add-ons folder.`,
    );
  return catalog;
}

// ── remove ───────────────────────────────────────────────────────────

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

// Two add-ons can share a package (both screenshot tools use pngjs). Taking
// one out keeps what an add-on that stays still lists.
function stillNeeded(catalog, lock, leaving, file, kind, key) {
  return Object.keys(lock.addons)
    .filter((other) => !leaving.includes(other))
    .some((other) =>
      (catalog[other]?.meta?.packageJson ?? []).some(
        (pkg) => pkg.file === file && pkg[kind]?.[key] !== undefined,
      ),
    );
}

export function removeAddons(root, catalog, names, { force = false } = {}) {
  const lock = readLock(root);
  const removed = [];
  const kept = [];
  let packagesChanged = false;
  for (const name of names) {
    if (!lock.addons[name]) throw new AddonError(`"${name}" isn't installed.`);
    const needers = Object.keys(lock.addons).filter(
      (other) =>
        !names.includes(other) &&
        (catalog[other]?.registryDependencies ?? []).includes(name),
    );
    if (needers.length)
      throw new AddonError(
        `Can't remove "${name}": ${needers.join(', ')} needs it.`,
      );
  }
  // Remove what depends on others first.
  const ordered = installOrder(catalog, names)
    .filter((n) => names.includes(n))
    .reverse();
  for (const name of ordered) {
    const addon = catalog[name];
    for (const [target, recorded] of Object.entries(lock.addons[name].files)) {
      const file = path.join(root, target);
      if (!existsSync(file)) continue;
      if (!force && hash(readFileSync(file)) !== recorded) {
        kept.push(target);
        continue;
      }
      rmSync(file);
      pruneEmptyDirs(root, file);
    }
    for (const pkg of addon?.meta?.packageJson ?? []) {
      const file = path.join(root, pkg.file);
      if (!existsSync(file)) continue;
      const current = readJson(file);
      for (const kind of DEP_KINDS) {
        for (const [key, value] of Object.entries(pkg[kind] ?? {})) {
          if (current[kind]?.[key] !== value) continue;
          if (stillNeeded(catalog, lock, names, pkg.file, kind, key)) continue;
          delete current[kind][key];
          if (kind !== 'scripts') packagesChanged = true;
        }
      }
      writeJson(file, current);
    }
    for (const block of addon?.meta?.blocks ?? []) {
      const file = path.join(root, block.file);
      if (!existsSync(file)) continue;
      writeFileSync(file, removeBlock(readFileSync(file, 'utf8'), name, block));
    }
    delete lock.addons[name];
    writeLock(root, lock);
    removed.push(name);
  }
  return { removed, kept, packagesChanged };
}

// ── check ────────────────────────────────────────────────────────────

// Installed files that no longer match the catalog copy. In the starter the
// catalog is the source of truth, so a change has to be made in both places.
export function driftProblems(root, catalog) {
  const problems = [];
  for (const [name, entry] of Object.entries(readLock(root).addons)) {
    const addon = catalog[name];
    if (!addon) {
      problems.push(`"${name}" is installed but not in the catalog.`);
      continue;
    }
    for (const file of addon.files ?? []) {
      const target = path.join(root, file.target);
      const source = path.join(addon.dir, file.path);
      if (!existsSync(target))
        problems.push(`${file.target} (from "${name}") is missing.`);
      else if (
        !projectOwned(file) &&
        existsSync(source) &&
        hash(readFileSync(target)) !== hash(readFileSync(source))
      ) {
        problems.push(
          `${file.target} differs from add-ons/${name}/${file.path}. Make the same change in both.`,
        );
      }
    }
    for (const file of addon.files ?? []) {
      const source = path.join(addon.dir, file.path);
      if (
        existsSync(source) &&
        entry.files[file.target] !== hash(readFileSync(source))
      ) {
        problems.push(
          `addons.lock.json has an old record of ${file.target}. Run: pnpm addon add ${name}`,
        );
      }
    }
    const listed = new Set((addon.files ?? []).map((f) => f.target));
    for (const target of Object.keys(entry.files)) {
      if (!listed.has(target))
        problems.push(
          `${target} is in the lock file but no longer in "${name}".`,
        );
    }
  }
  return problems;
}

const SKIP = new Set([
  'node_modules',
  '.git',
  '.turbo',
  '.look',
  'dist',
  'storybook-static',
]);

export function snapshot(root) {
  const files = {};
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (SKIP.has(entry)) continue;
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else files[path.relative(root, full)] = hash(readFileSync(full));
    }
  };
  walk(root);
  return files;
}

export function diffSnapshots(before, after) {
  const changes = [];
  for (const file of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (!(file in after)) changes.push(`missing: ${file}`);
    else if (!(file in before)) changes.push(`extra:   ${file}`);
    else if (before[file] !== after[file]) changes.push(`changed: ${file}`);
  }
  return changes.sort();
}

// Copies the project, takes every installed add-on out, checks nothing of
// them is left, puts them back, and checks the project is exactly as it was.
export function roundTripProblems(root, catalog, tmpDir) {
  const copy = path.join(tmpDir, 'project');
  cpSync(root, copy, {
    recursive: true,
    filter: (src) => !SKIP.has(path.basename(src)),
  });
  const before = snapshot(copy);
  const installed = Object.keys(readLock(copy).addons);
  if (!installed.length) return [];
  const problems = [];
  // A project's own filled-in files are kept on purpose.
  const owned = new Set(
    installed.flatMap((name) =>
      (catalog[name]?.files ?? []).filter(projectOwned).map((f) => f.target),
    ),
  );
  const { kept } = removeAddons(copy, catalog, installed);
  kept
    .filter((file) => !owned.has(file))
    .forEach((file) =>
      problems.push(`remove left a changed file behind: ${file}`),
    );
  const bare = snapshot(copy);
  for (const name of installed) {
    for (const file of catalog[name].files ?? []) {
      if (bare[file.target] && !owned.has(file.target))
        problems.push(`remove left ${file.target} (from "${name}") behind.`);
    }
    for (const block of catalog[name].meta?.blocks ?? []) {
      const file = path.join(copy, block.file);
      if (
        existsSync(file) &&
        hasBlock(readFileSync(file, 'utf8'), name, block)
      ) {
        problems.push(`remove left the "${name}" section in ${block.file}.`);
      }
    }
  }
  addAddons(copy, catalog, installed);
  diffSnapshots(before, snapshot(copy)).forEach((change) =>
    problems.push(`after removing and re-adding everything, ${change}`),
  );
  return problems;
}

/*
 * Keys written twice in one JSON object. JSON.parse keeps the last one without
 * a word, so a script added by hand and again by an add-on hides one of them.
 */
export function duplicateKeys(text) {
  const found = [];
  const stack = [];
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '{') stack.push({ keys: new Set(), object: true });
    else if (ch === '[') stack.push({ object: false });
    else if (ch === '}' || ch === ']') stack.pop();
    else if (ch === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
      const value = text.slice(i + 1, j);
      i = j;
      let k = j + 1;
      while (/\s/.test(text[k] ?? '')) k += 1;
      const top = stack.at(-1);
      if (text[k] === ':' && top?.object) {
        if (top.keys.has(value)) found.push(value);
        top.keys.add(value);
      }
    }
  }
  return found;
}
