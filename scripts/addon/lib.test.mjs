import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';

import {
  AddonError,
  UPDATE_SUFFIX,
  addAddons,
  driftProblems,
  duplicateKeys,
  fetchCatalog,
  readCatalog,
  readLock,
  removeAddons,
  roundTripProblems,
  updateAddons,
  validateCatalog,
} from './lib.mjs';

let tmp, root, catalogDir;

const write = (file, text) => {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, text);
};
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const json = (data) => `${JSON.stringify(data, null, 2)}\n`;

function addon(name, manifest, files = {}) {
  const dir = path.join(catalogDir, name);
  write(
    path.join(dir, 'addon.json'),
    json({
      name,
      type: 'registry:item',
      title: name,
      description: `The ${name} add-on.`,
      files: Object.keys(files).map((target) => ({
        path: `files/${target}`,
        type: 'registry:file',
        target,
      })),
      ...manifest,
      meta: { version: '1.0.0', owner: 'test', ...manifest.meta },
    }),
  );
  for (const [target, text] of Object.entries(files))
    write(path.join(dir, 'files', target), text);
}

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), 'addon-test-'));
  root = path.join(tmp, 'project');
  catalogDir = path.join(root, 'add-ons');
  write(
    path.join(root, 'package.json'),
    json({
      name: 'p',
      scripts: { build: 'x' },
      devDependencies: { a: '1', z: '1' },
    }),
  );
  write(path.join(root, 'CLAUDE.md'), '# Guide\n\n## Commands\n\nend\n');
  write(path.join(root, '.gitignore'), 'node_modules/\n');
  addon(
    'base',
    {
      meta: {
        packageJson: [
          {
            file: 'package.json',
            scripts: { 'base:go': 'node go.mjs' },
            devDependencies: { m: '2' },
          },
        ],
        blocks: [
          {
            file: 'CLAUDE.md',
            after: '## Commands',
            comment: 'html',
            content: '- base: does things',
          },
          { file: '.gitignore', comment: '#', content: '.base/' },
        ],
      },
    },
    { 'tools/go.mjs': 'go\n' },
  );
  addon(
    'top',
    { registryDependencies: ['base'] },
    { 'top/readme.md': 'top\n' },
  );
});

afterEach(() => rmSync(tmp, { recursive: true, force: true }));

test('the catalog is valid', () => {
  assert.deepEqual(validateCatalog(readCatalog(catalogDir)), []);
});

test('add brings in files, package keys, guide lines and what it needs', () => {
  const { added, packagesChanged } = addAddons(root, readCatalog(catalogDir), [
    'top',
  ]);
  assert.deepEqual(added, ['base', 'top']);
  assert.equal(packagesChanged, true);
  assert.equal(read('tools/go.mjs'), 'go\n');
  const pkg = JSON.parse(read('package.json'));
  assert.deepEqual(Object.keys(pkg.scripts), ['build', 'base:go']);
  assert.deepEqual(Object.keys(pkg.devDependencies), ['a', 'm', 'z']);
  assert.match(
    read('CLAUDE.md'),
    /## Commands\n<!-- addon:base -->\n\n- base: does things\n\n<!-- \/addon:base -->\n/,
  );
  assert.deepEqual(Object.keys(readLock(root).addons), ['base', 'top']);
});

test('remove puts the project back exactly as it was', () => {
  const before = {
    pkg: read('package.json'),
    guide: read('CLAUDE.md'),
    ignore: read('.gitignore'),
  };
  const catalog = readCatalog(catalogDir);
  addAddons(root, catalog, ['top']);
  removeAddons(root, catalog, ['top', 'base']);
  assert.equal(read('package.json'), before.pkg);
  assert.equal(read('CLAUDE.md'), before.guide);
  assert.equal(read('.gitignore'), before.ignore);
  assert.equal(existsSync(path.join(root, 'tools')), false);
  assert.deepEqual(readLock(root).addons, {});
});

test("remove won't take out something another add-on needs", () => {
  const catalog = readCatalog(catalogDir);
  addAddons(root, catalog, ['top']);
  assert.throws(() => removeAddons(root, catalog, ['base']), /top needs it/);
});

test('remove keeps a package another installed add-on still lists', () => {
  addon('twin', {
    meta: {
      packageJson: [{ file: 'package.json', devDependencies: { m: '2' } }],
    },
  });
  const catalog = readCatalog(catalogDir);
  addAddons(root, catalog, ['base', 'twin']);
  removeAddons(root, catalog, ['twin']);
  assert.equal(JSON.parse(read('package.json')).devDependencies.m, '2');
  removeAddons(root, catalog, ['base']);
  assert.equal(JSON.parse(read('package.json')).devDependencies.m, undefined);
});

test('remove keeps a file someone changed, unless forced', () => {
  const catalog = readCatalog(catalogDir);
  addAddons(root, catalog, ['base']);
  write(path.join(root, 'tools/go.mjs'), 'my change\n');
  const { kept } = removeAddons(root, catalog, ['base']);
  assert.deepEqual(kept, ['tools/go.mjs']);
  assert.equal(read('tools/go.mjs'), 'my change\n');
});

test('add refuses to overwrite a different file, and changes nothing', () => {
  write(path.join(root, 'tools/go.mjs'), 'mine\n');
  const before = read('package.json');
  assert.throws(
    () => addAddons(root, readCatalog(catalogDir), ['base']),
    AddonError,
  );
  assert.equal(read('tools/go.mjs'), 'mine\n');
  assert.equal(read('package.json'), before);
});

test('add adopts files and keys that already match', () => {
  write(path.join(root, 'tools/go.mjs'), 'go\n');
  const { added } = addAddons(root, readCatalog(catalogDir), ['base']);
  assert.deepEqual(added, ['base']);
});

test('check finds an installed copy that drifted from the catalog', () => {
  const catalog = readCatalog(catalogDir);
  addAddons(root, catalog, ['base']);
  write(path.join(root, 'tools/go.mjs'), 'edited\n');
  assert.match(
    driftProblems(root, catalog).join('\n'),
    /tools\/go.mjs differs/,
  );
});

test('the round trip passes for a clean install', () => {
  const catalog = readCatalog(catalogDir);
  addAddons(root, catalog, ['top']);
  const work = mkdtempSync(path.join(tmpdir(), 'addon-rt-'));
  try {
    assert.deepEqual(roundTripProblems(root, catalog, work), []);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test('an unknown add-on gets a helpful message', () => {
  assert.throws(
    () => addAddons(root, readCatalog(catalogDir), ['nope']),
    /pnpm addon list/,
  );
});

test('add refreshes the lock after the catalog copy changes', () => {
  const catalog = readCatalog(catalogDir);
  addAddons(root, catalog, ['base']);
  write(path.join(catalogDir, 'base/files/tools/go.mjs'), 'go v2\n');
  write(path.join(root, 'tools/go.mjs'), 'go v2\n');
  assert.match(
    driftProblems(root, catalog).join('\n'),
    /old record of tools\/go.mjs/,
  );
  addAddons(root, catalog, ['base']);
  assert.deepEqual(driftProblems(root, catalog), []);
});

// ── update ──

// A later catalog, as the starter would have it after people improve things.
function newer(build) {
  const v1 = catalogDir;
  catalogDir = path.join(tmp, 'v2');
  try {
    build();
  } finally {
    catalogDir = v1;
  }
  return readCatalog(path.join(tmp, 'v2'));
}
const baseV2 = (files, packageJson) =>
  addon(
    'base',
    {
      meta: {
        version: '2.0.0',
        packageJson: packageJson ?? [
          {
            file: 'package.json',
            scripts: { 'base:go': 'node go.mjs' },
            devDependencies: { m: '2' },
          },
        ],
        blocks: [
          {
            file: 'CLAUDE.md',
            after: '## Commands',
            comment: 'html',
            content: '- base: does more things',
          },
          { file: '.gitignore', comment: '#', content: '.base/' },
        ],
      },
    },
    files,
  );

test('update replaces what nobody changed and keeps what someone did', () => {
  addAddons(root, readCatalog(catalogDir), ['top']);
  write(path.join(root, 'top/readme.md'), 'mine\n');
  const v2 = newer(() => {
    baseV2({ 'tools/go.mjs': 'go v2\n' });
    addon(
      'top',
      { registryDependencies: ['base'], meta: { version: '1.1.0' } },
      { 'top/readme.md': 'top v2\n' },
    );
  });
  const { updated } = updateAddons(root, v2);
  assert.equal(read('tools/go.mjs'), 'go v2\n');
  assert.equal(read('top/readme.md'), 'mine\n');
  assert.equal(read(`top/readme.md${UPDATE_SUFFIX}`), 'top v2\n');
  assert.deepEqual(
    updated.map((u) => [u.name, u.from, u.to, u.attention.length]),
    [
      ['base', '1.0.0', '2.0.0', 0],
      ['top', '1.0.0', '1.1.0', 1],
    ],
  );
  assert.equal(readLock(root).addons.base.version, '2.0.0');
  // and once it's merged, the file counts as untouched again
  write(path.join(root, 'top/readme.md'), 'top v2\n');
  assert.deepEqual(removeAddons(root, v2, ['top']).kept, []);
});

test('update drops files the add-on no longer has, and leaves deleted ones deleted', () => {
  addAddons(root, readCatalog(catalogDir), ['top']);
  rmSync(path.join(root, 'top/readme.md'));
  const v2 = newer(() => {
    baseV2({ 'tools/next.mjs': 'next\n' });
    addon(
      'top',
      { registryDependencies: ['base'], meta: { version: '1.1.0' } },
      { 'top/readme.md': 'top v2\n' },
    );
  });
  updateAddons(root, v2);
  assert.equal(existsSync(path.join(root, 'tools/go.mjs')), false);
  assert.equal(read('tools/next.mjs'), 'next\n');
  assert.equal(existsSync(path.join(root, 'top/readme.md')), false);
});

test('update moves package values nobody changed, and keeps changed ones', () => {
  addAddons(root, readCatalog(catalogDir), ['base']);
  const pkg = JSON.parse(read('package.json'));
  pkg.scripts['base:go'] = 'node mine.mjs';
  write(path.join(root, 'package.json'), json(pkg));
  const v2 = newer(() =>
    baseV2({ 'tools/go.mjs': 'go\n' }, [
      {
        file: 'package.json',
        scripts: { 'base:go': 'node go2.mjs', 'base:new': 'node new.mjs' },
        devDependencies: { n: '1' },
      },
    ]),
  );
  const { updated, packagesChanged } = updateAddons(root, v2);
  const after = JSON.parse(read('package.json'));
  assert.equal(after.scripts['base:go'], 'node mine.mjs');
  assert.equal(after.scripts['base:new'], 'node new.mjs');
  assert.deepEqual(after.devDependencies, { a: '1', n: '1', z: '1' });
  assert.equal(packagesChanged, true);
  assert.match(
    updated[0].attention.join('\n'),
    /scripts.base:go is "node mine.mjs" here/,
  );
});

test("update rewrites the add-on's own section in place", () => {
  addAddons(root, readCatalog(catalogDir), ['base']);
  updateAddons(
    root,
    newer(() => baseV2({ 'tools/go.mjs': 'go\n' })),
  );
  const guide = read('CLAUDE.md');
  assert.match(
    guide,
    /## Commands\n<!-- addon:base -->\n\n- base: does more things\n\n<!-- \/addon:base -->\n/,
  );
  assert.equal(guide.match(/<!-- addon:base -->/g).length, 1);
});

test('update adds what a new version needs', () => {
  addAddons(root, readCatalog(catalogDir), ['top']);
  const v2 = newer(() => {
    baseV2({ 'tools/go.mjs': 'go\n' });
    addon('extra', {}, { 'extra.md': 'extra\n' });
    addon(
      'top',
      { registryDependencies: ['base', 'extra'], meta: { version: '2.0.0' } },
      { 'top/readme.md': 'top\n' },
    );
  });
  const { added, updated } = updateAddons(root, v2, ['top']);
  assert.deepEqual(added, ['extra']);
  assert.deepEqual(
    updated.map((u) => u.name),
    ['top'],
  );
  assert.equal(read('extra.md'), 'extra\n');
});

test('update says what to do about an add-on that left the catalog', () => {
  addAddons(root, readCatalog(catalogDir), ['top']);
  const v2 = newer(() => baseV2({ 'tools/go.mjs': 'go\n' }));
  assert.throws(() => updateAddons(root, v2), /pnpm addon remove top/);
});

test('the catalog can come from a copy of the starter, in a folder or in git', () => {
  assert.equal(fetchCatalog(root, undefined, tmp), catalogDir);
  const git = (...args) =>
    assert.equal(
      spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
        cwd: root,
      }).status,
      0,
    );
  git('init', '--quiet', '--initial-branch=main');
  git('add', '-A');
  git('commit', '--quiet', '-m', 'starter');
  const work = mkdtempSync(path.join(tmpdir(), 'addon-git-'));
  try {
    const dir = fetchCatalog(`file://${root}`, 'main', work);
    assert.deepEqual(Object.keys(readCatalog(dir)), ['base', 'top']);
    assert.equal(existsSync(path.join(work, 'starter/package.json')), false);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test("a project's own file is left alone once it's filled in", () => {
  const dir = path.join(catalogDir, 'base');
  const manifest = JSON.parse(
    readFileSync(path.join(dir, 'addon.json'), 'utf8'),
  );
  manifest.files.push({
    path: 'files/settings.json',
    type: 'registry:file',
    target: 'settings.json',
    project: true,
  });
  write(path.join(dir, 'addon.json'), json(manifest));
  write(path.join(dir, 'files/settings.json'), '{}\n');
  const catalog = readCatalog(catalogDir);
  addAddons(root, catalog, ['base']);
  write(path.join(root, 'settings.json'), '{ "file": "ours" }\n');
  assert.deepEqual(driftProblems(root, catalog), []);
  const work = mkdtempSync(path.join(tmpdir(), 'addon-rt-'));
  try {
    assert.deepEqual(roundTripProblems(root, catalog, work), []);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  write(path.join(dir, 'files/settings.json'), '{ "newer": true }\n');
  updateAddons(root, readCatalog(catalogDir), ['base']);
  assert.equal(read('settings.json'), '{ "file": "ours" }\n');
  assert.ok(!existsSync(path.join(root, `settings.json${UPDATE_SUFFIX}`)));
});

test('finds keys written twice in one object', () => {
  assert.deepEqual(
    duplicateKeys(
      '{ "scripts": { "a": "x", "b": "y \\"a\\":", "a": "z" }, "list": ["a", "a"], "other": { "a": 1 } }',
    ),
    ['a'],
  );
});
