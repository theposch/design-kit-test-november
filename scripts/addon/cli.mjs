// pnpm addon — list, add, update, remove and check the starter's add-ons.
// How it works: scripts/addon/lib.mjs. Why: docs/adr/0009.

import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AddonError,
  CATALOG_DIR,
  addAddons,
  driftProblems,
  duplicateKeys,
  fetchCatalog,
  readCatalog,
  readLock,
  removeAddons,
  roundTripProblems,
  setSource,
  updateAddons,
  validateCatalog,
} from './lib.mjs';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const [command, ...rest] = process.argv.slice(2);
const VALUED = new Set(['--from', '--ref']);
const flags = new Set();
const options = {};
const names = [];
for (let i = 0; i < rest.length; i++) {
  const arg = rest[i];
  if (VALUED.has(arg)) options[arg.slice(2)] = rest[++i];
  else if (arg.startsWith('--')) flags.add(arg);
  else names.push(arg);
}

const HELP = `pnpm addon <command>

  list                 what's in the catalog, and what this project has
  add <name...>        add add-ons (and anything they need)
  update [name...]     bring installed add-ons (or the ones named) up to the
                       starter's latest; files you changed are kept, with the
                       new version beside them (<file>.addon-update)
  remove <name...>     take add-ons out again
  check                catalog is valid, installed copies match it,
                       and every add-on comes out and goes back in cleanly

The catalog is this project's add-ons/ folder. Without one, and always for
update, it comes from the starter repo (addons.lock.json → source).

Options: --json (list), --force (remove files even if you changed them),
         --no-install (skip pnpm install after packages change),
         --from <git url or folder> (where the starter is),
         --ref <branch or tag> (which version of it; default: its main branch)`;

function install(changed) {
  if (!changed) return;
  if (flags.has('--no-install')) {
    console.log('\nPackages changed. Run: pnpm install');
    return;
  }
  console.log('\nPackages changed, running pnpm install…');
  spawnSync('pnpm', ['install'], { cwd: root, stdio: 'inherit' });
}

// Temporary downloads, cleared on the way out.
const temp = [];
const tempDir = () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'addon-'));
  temp.push(dir);
  return dir;
};

// The folder to read the catalog from.
function catalogFolder(lock) {
  const local = path.join(root, CATALOG_DIR);
  if (command !== 'update' && !options.from && existsSync(local)) return local;
  const source = options.from ?? lock.source?.repo;
  if (!source)
    throw new AddonError(
      'Where is the starter? Run again with --from <git url or folder>.',
    );
  const ref = options.ref ?? (options.from ? undefined : lock.source?.ref);
  if (!existsSync(source)) console.log(`Reading the add-ons from ${source}…`);
  return fetchCatalog(source, ref, tempDir());
}

function main() {
  const lock = readLock(root);
  const catalogDir = catalogFolder(lock);
  const catalog = readCatalog(catalogDir);

  switch (command) {
    case 'list': {
      const rows = Object.values(catalog).map((a) => ({
        name: a.name,
        title: a.title,
        description: a.description,
        version: a.meta?.version,
        needs: a.registryDependencies ?? [],
        installed: Boolean(lock.addons[a.name]),
      }));
      if (flags.has('--json'))
        return console.log(JSON.stringify(rows, null, 2));
      for (const row of rows) {
        const mark = row.installed ? '✓ installed' : '  available';
        const needs = row.needs.length
          ? ` (needs ${row.needs.join(', ')})`
          : '';
        console.log(
          `${mark}  ${row.name}${needs}\n             ${row.description}`,
        );
      }
      return;
    }
    case 'add': {
      if (!names.length)
        throw new AddonError('Which add-on? Run: pnpm addon list');
      const { added, packagesChanged } = addAddons(root, catalog, names);
      console.log(
        added.length
          ? `Added: ${added.join(', ')}`
          : 'Already installed, nothing to do.',
      );
      install(packagesChanged);
      return;
    }
    case 'update': {
      const { updated, added, packagesChanged } = updateAddons(
        root,
        catalog,
        names,
      );
      for (const u of updated) {
        const version = u.from === u.to ? u.to : `${u.from} → ${u.to}`;
        if (!u.changes.length && !u.attention.length) {
          console.log(`${u.name} ${version}: up to date`);
          continue;
        }
        console.log(`${u.name} ${version}`);
        u.changes.forEach((c) => console.log(`  ${c}`));
        u.attention.forEach((a) => console.log(`  ! ${a}`));
      }
      if (added.length)
        console.log(
          `Added, as the new versions need them: ${added.join(', ')}`,
        );
      // keep this project's own catalog copy in step, if it has one
      const local = path.join(root, CATALOG_DIR);
      if (
        existsSync(local) &&
        path.resolve(catalogDir) !== path.resolve(local)
      ) {
        for (const name of [...updated.map((u) => u.name), ...added]) {
          rmSync(path.join(local, name), { recursive: true, force: true });
          cpSync(catalog[name].dir, path.join(local, name), {
            recursive: true,
          });
        }
      }
      const review = updated.flatMap((u) => u.attention).length;
      if (review)
        console.log(
          `\n${review} thing${review > 1 ? 's' : ''} to look at (marked !). Merge each .addon-update file into the one beside it, then delete it.`,
        );
      // a project that didn't know where the starter lives does now
      if (!lock.source && options.from && !existsSync(options.from))
        setSource(root, {
          repo: options.from,
          ...(options.ref && { ref: options.ref }),
        });
      install(packagesChanged);
      return;
    }
    case 'remove': {
      if (!names.length)
        throw new AddonError('Which add-on? Run: pnpm addon list');
      const { removed, kept, packagesChanged } = removeAddons(
        root,
        catalog,
        names,
        {
          force: flags.has('--force'),
        },
      );
      console.log(`Removed: ${removed.join(', ')}`);
      if (kept.length) {
        console.log(
          `\nKept because they were changed (use --force to delete):\n  ${kept.join('\n  ')}`,
        );
      }
      install(packagesChanged);
      return;
    }
    case 'check': {
      const problems = [
        ...validateCatalog(catalog),
        ...driftProblems(root, catalog),
        ...execFileSync('git', ['ls-files', 'package.json', '*/package.json'], {
          cwd: root,
          encoding: 'utf8',
        })
          .split('\n')
          .filter(Boolean)
          .flatMap((file) =>
            duplicateKeys(readFileSync(path.join(root, file), 'utf8')).map(
              (key) =>
                `${file} has "${key}" twice; JSON keeps only the last one`,
            ),
          ),
      ];
      if (!problems.length) {
        const tmp = mkdtempSync(path.join(tmpdir(), 'addon-check-'));
        try {
          problems.push(...roundTripProblems(root, catalog, tmp));
        } finally {
          rmSync(tmp, { recursive: true, force: true });
        }
      }
      if (problems.length) {
        throw new AddonError(
          `Add-on check failed:\n  - ${problems.join('\n  - ')}`,
        );
      }
      console.log(
        `Add-ons OK: ${Object.keys(catalog).length} in the catalog, ${Object.keys(lock.addons).length} installed, all come out and go back in cleanly.`,
      );
      return;
    }
    default:
      console.log(HELP);
      if (command && command !== 'help') process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  if (!(error instanceof AddonError)) throw error;
  console.error(`\n${error.message}\n`);
  process.exitCode = 1;
} finally {
  temp.forEach((dir) => rmSync(dir, { recursive: true, force: true }));
}
