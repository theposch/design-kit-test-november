#!/usr/bin/env node
/*
 * pnpm template copy <Name> [--to <folder>] [--force]
 *
 * Copies a page template from packages/ui/src/templates into the app, ready to
 * change: library imports become `@repo/ui`, the template parts and pictures it
 * uses come along, and packages it imports are added to the app.
 * The default folder is apps/frontend/src/pages.
 */
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

const repo = path.resolve(import.meta.dirname, '..', '..');
const ui = path.join(repo, 'packages', 'ui');
const templates = path.join(ui, 'src', 'templates');
const app = path.join(repo, 'apps', 'frontend');

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
};
const [command, name] = argv.filter(
  (a, i) => !a.startsWith('--') && argv[i - 1] !== '--to',
);

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

const available = () =>
  readdirSync(templates)
    .filter((f) => f.endsWith('.tsx') && !f.includes('.stories.'))
    .map((f) => f.replace(/\.tsx$/, ''));

if (command !== 'copy' || !name)
  fail(
    `Usage: pnpm template copy <Name> [--to <folder>] [--force]\nTemplates here: ${available().join(', ')}`,
  );
if (!existsSync(path.join(templates, `${name}.tsx`)))
  fail(
    `There's no template called ${name}. Templates here: ${available().join(', ')}\nIf it's in a group that isn't installed, add the group first (pnpm addon list).`,
  );

const dest = path.resolve(repo, flag('--to') ?? 'apps/frontend/src/pages');

/* Every name the library's barrel exports, so a missing export is caught now, not by the app's build. */
const barrel = readFileSync(path.join(ui, 'src', 'index.ts'), 'utf8');
const exported = new Set([
  ...[...barrel.matchAll(/export \* as (\w+)/g)].map((m) => m[1]),
  ...[...barrel.matchAll(/export \{([^}]*)\}/g)].flatMap((m) =>
    m[1]
      .split(',')
      .map((part) =>
        part
          .trim()
          .replace(/^type\s+/, '')
          .split(/\s+as\s+/)
          .pop(),
      )
      .filter(Boolean),
  ),
]);

const IMPORT = /import\s+(type\s+)?([\s\S]*?)\s+from\s+'([^']+)';?\n?/g;
const ASSET = /\.(png|jpe?g|gif|webp|avif|svg|mp4|webm|woff2?)$/;
const LIBRARY = /^#(components|hooks|lib)\//;

const uiPackage = JSON.parse(
  readFileSync(path.join(ui, 'package.json'), 'utf8'),
);
const uiVersions = { ...uiPackage.devDependencies, ...uiPackage.dependencies };

const copied = new Map();
const packages = new Set();
const missing = new Set();

/* Names an import clause brings in, as written: `Button`, `type Command`, `* as Card` → `Card`. */
function namesIn(clause) {
  const star = /^\*\s+as\s+(\w+)$/.exec(clause.trim());
  if (star) return [star[1]];
  const braces = /\{([\s\S]*)\}/.exec(clause);
  if (!braces) return null;
  return braces[1]
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
}

function copyFile(source, target) {
  if (copied.has(source)) return;
  copied.set(source, target);
  let text = readFileSync(source, 'utf8');
  const fromLibrary = [];
  const fromLibraryTypes = [];

  text = text.replace(IMPORT, (whole, typeOnly, clause, from) => {
    if (LIBRARY.test(from)) {
      const names = namesIn(clause);
      if (!names) {
        missing.add(`${clause.trim()} from ${from}`);
        return whole;
      }
      for (const n of names) {
        const bare = n.replace(/^type\s+/, '');
        if (!exported.has(bare)) missing.add(`${bare} (${from})`);
        (typeOnly || n.startsWith('type ')
          ? fromLibraryTypes
          : fromLibrary
        ).push(bare);
      }
      return '';
    }
    if (from.startsWith('.')) {
      const resolved = path.resolve(path.dirname(source), from);
      const file = [resolved, `${resolved}.tsx`, `${resolved}.ts`].find(
        (f) => existsSync(f) && !f.endsWith('/'),
      );
      if (!file) fail(`Can't find ${from}, imported by ${source}.`);
      const out = path.join(
        path.dirname(target),
        path.relative(path.dirname(source), file),
      );
      if (ASSET.test(file)) {
        mkdirSync(path.dirname(out), { recursive: true });
        copyFileSync(file, out);
        copied.set(file, out);
      } else {
        copyFile(file, out);
      }
      return whole;
    }
    const pkg = from.startsWith('@')
      ? from.split('/').slice(0, 2).join('/')
      : from.split('/')[0];
    if (!from.startsWith('node:')) packages.add(pkg);
    return whole;
  });

  const lines = [];
  const unique = (list) => [...new Set(list)].sort();
  if (fromLibrary.length)
    lines.push(`import { ${unique(fromLibrary).join(', ')} } from '@repo/ui';`);
  const typesOnly = unique(fromLibraryTypes).filter(
    (n) => !fromLibrary.includes(n),
  );
  if (typesOnly.length)
    lines.push(`import type { ${typesOnly.join(', ')} } from '@repo/ui';`);
  if (lines.length) {
    /* After the remaining imports, so the file still reads top to bottom. */
    const last = [...text.matchAll(IMPORT)].pop();
    const at = last ? last.index + last[0].length : 0;
    text = `${text.slice(0, at)}${lines.join('\n')}\n${text.slice(at)}`;
  }
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text.replace(/^\n+/, ''));
}

const target = path.join(dest, `${name}.tsx`);
if (existsSync(target) && !argv.includes('--force'))
  fail(
    `${path.relative(repo, target)} already exists. Add --force to replace it.`,
  );

copyFile(path.join(templates, `${name}.tsx`), target);

/* Packages the template imports that the app doesn't have yet. */
const appPackageFile = path.join(app, 'package.json');
const appPackage = JSON.parse(readFileSync(appPackageFile, 'utf8'));
const has = { ...appPackage.dependencies, ...appPackage.devDependencies };
const added = [];
for (const pkg of packages) {
  if (has[pkg] || pkg === '@repo/ui') continue;
  if (!uiVersions[pkg]) {
    console.warn(
      `  ! ${pkg} isn't a library package; add it to the app by hand.`,
    );
    continue;
  }
  appPackage.dependencies[pkg] = uiVersions[pkg];
  added.push(pkg);
}
if (added.length) {
  appPackage.dependencies = Object.fromEntries(
    Object.entries(appPackage.dependencies).sort(([a], [b]) =>
      a.localeCompare(b),
    ),
  );
  writeFileSync(appPackageFile, `${JSON.stringify(appPackage, null, 2)}\n`);
  spawnSync('pnpm', ['install', '--silent'], { cwd: repo, stdio: 'inherit' });
}

spawnSync(
  'pnpm',
  ['exec', 'prettier', '--write', '--log-level=warn', ...copied.values()],
  { cwd: repo, stdio: 'inherit' },
);

console.log(`\nCopied ${name} into the app:`);
for (const out of copied.values()) console.log(`  ${path.relative(repo, out)}`);
if (added.length) console.log(`Added to the app: ${added.join(', ')}`);
if (missing.size)
  console.log(
    `\nThe library doesn't export these, so the copy won't build until it does (add them to packages/ui/src/index.ts):\n${[...missing].map((m) => `  ! ${m}`).join('\n')}`,
  );
console.log(
  `\nNext: render <${name} /> from the app, change its content, and check it at every size in project.json.\n`,
);
