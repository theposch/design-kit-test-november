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
import { pathToFileURL } from 'node:url';

import {
  LOCK_FILE,
  StarterError,
  UPDATE_SUFFIX,
  applyPlan,
  baseFit,
  commitsBetween,
  globToRegExp,
  guessBase,
  knownSource,
  openStarter,
  packagesChanged,
  planUpdate,
  readLock,
  writeLock,
} from './lib.mjs';

const CLI = path.join(import.meta.dirname, 'cli.mjs');

let tmp, starterDir, root, v1, v2;

const json = (data) => `${JSON.stringify(data, null, 2)}\n`;
const lines = (...items) => `${items.join('\n')}\n`;
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const here = (file) => existsSync(path.join(root, file));

function put(dir, files) {
  for (const [file, text] of Object.entries(files)) {
    const full = path.join(dir, file);
    if (text === null) {
      rmSync(full);
      continue;
    }
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, text);
  }
}

function git(dir, args, day) {
  const date = day && `${day}T12:00:00Z`;
  const run = spawnSync(
    'git',
    [
      '-C',
      dir,
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.com',
      '-c',
      'commit.gpgsign=false',
      ...args,
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        ...(date && { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date }),
      },
    },
  );
  assert.equal(run.status, 0, run.stderr);
  return run.stdout.trim();
}

function commit(dir, files, day) {
  put(dir, files);
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', `change on ${day}`], day);
  return git(dir, ['rev-parse', 'HEAD']);
}

const FIRST = {
  'CLAUDE.md': lines('# Guide', '', 'one', 'two', 'three', 'four', 'five'),
  'package.json': json({ name: 'p', scripts: { build: 'x' } }),
  'src/button.txt': 'button v1\n',
  'src/dialog.txt': lines('a', 'b', 'c'),
  'src/old.txt': 'old\n',
  'src/retired.txt': 'retired\n',
  'src/gone-here.txt': 'v1\n',
  'logo.bin': Buffer.from([0, 1, 2, 3]),
  'README.md': 'the starter\n',
  'apps/demo/main.txt': 'demo v1\n',
  'tools/go.mjs': 'go v1\n',
  'starter.json': json({ projectOwned: ['README.md', 'apps/**'] }),
  'add-ons/base/addon.json': json({
    name: 'base',
    files: [{ path: 'files/tools/go.mjs', target: 'tools/go.mjs' }],
  }),
  'add-ons/base/files/tools/go.mjs': 'go v1\n',
};

const SECOND = {
  'CLAUDE.md': lines('# Guide', '', 'one', 'two', 'three', 'four', 'FIVE'),
  'package.json': json({ name: 'p', scripts: { build: 'x', lint: 'y' } }),
  'src/button.txt': 'button v2\n',
  'src/dialog.txt': lines('a', 'B from the starter', 'c'),
  'src/old.txt': null,
  'src/retired.txt': null,
  'src/gone-here.txt': 'v2\n',
  'src/new.txt': 'new\n',
  'src/clash.txt': 'the starter’s clash\n',
  'logo.bin': Buffer.from([0, 9, 9, 9]),
  'README.md': 'the starter, improved\n',
  'apps/demo/main.txt': 'demo v2\n',
  'tools/go.mjs': 'go v2\n',
  'add-ons/base/files/tools/go.mjs': 'go v2\n',
};

function newProject(day = '2026-02-10') {
  git(tmp, ['clone', '-q', starterDir, root]);
  git(root, ['checkout', '-q', v1]);
  rmSync(path.join(root, '.git'), { recursive: true });
  git(root, ['init', '-q', '-b', 'main']);
  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '-m', 'Initial commit'], day);
}

const plan = (base = v1) =>
  planUpdate(root, openStarter(starterDir, undefined, tmp), base, tmp);
const kinds = (actions) =>
  Object.fromEntries(actions.map(({ file, kind }) => [file, kind]));

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), 'starter-test-'));
  starterDir = path.join(tmp, 'starter-repo');
  root = path.join(tmp, 'project');
  mkdirSync(starterDir);
  git(starterDir, ['init', '-q', '-b', 'main']);
  commit(starterDir, { 'CLAUDE.md': '# Guide\n' }, '2026-01-01');
  v1 = commit(starterDir, FIRST, '2026-02-01');
  v2 = commit(starterDir, SECOND, '2026-03-01');
  newProject();
});

afterEach(() => rmSync(tmp, { recursive: true, force: true }));

test('a file nobody changed here is replaced', () => {
  const actions = plan();
  assert.equal(kinds(actions)['src/button.txt'], 'updated');
  applyPlan(root, actions);
  assert.equal(read('src/button.txt'), 'button v2\n');
});

test('a file changed in different places on both sides is merged', () => {
  put(root, {
    'CLAUDE.md': lines(
      '# Our guide',
      '',
      'one',
      'two',
      'three',
      'four',
      'five',
    ),
  });
  const actions = plan();
  assert.equal(kinds(actions)['CLAUDE.md'], 'merged');
  applyPlan(root, actions);
  assert.equal(
    read('CLAUDE.md'),
    lines('# Our guide', '', 'one', 'two', 'three', 'four', 'FIVE'),
  );
  assert.equal(here(`CLAUDE.md${UPDATE_SUFFIX}`), false);
});

test("a file changed in the same place is left alone, with the starter's beside it", () => {
  const ours = lines('a', 'B from the project', 'c');
  put(root, { 'src/dialog.txt': ours });
  const actions = plan();
  assert.equal(kinds(actions)['src/dialog.txt'], 'attention');
  applyPlan(root, actions);
  assert.equal(read('src/dialog.txt'), ours);
  assert.equal(
    read(`src/dialog.txt${UPDATE_SUFFIX}`),
    lines('a', 'B from the starter', 'c'),
  );
});

test("a merge that breaks a .json file doesn't count as a merge", () => {
  put(root, { 'package.json': FIRST['package.json'].replace('"p"', '"ours"') });
  assert.equal(kinds(plan())['package.json'], 'merged');
  put(root, {
    'package.json': FIRST['package.json'].replace('"p",', '"ours"'),
  });
  assert.equal(kinds(plan())['package.json'], 'attention');
});

test('a file that is not text never merges', () => {
  put(root, { 'logo.bin': Buffer.from([0, 5, 5, 5]) });
  const actions = plan();
  assert.equal(kinds(actions)['logo.bin'], 'attention');
  applyPlan(root, actions);
  assert.deepEqual(
    [...readFileSync(path.join(root, `logo.bin${UPDATE_SUFFIX}`))],
    [0, 9, 9, 9],
  );
  assert.deepEqual(
    [...readFileSync(path.join(root, 'logo.bin'))],
    [0, 5, 5, 5],
  );
});

test('a file deleted here stays deleted', () => {
  put(root, { 'src/gone-here.txt': null });
  const actions = plan();
  assert.equal(kinds(actions)['src/gone-here.txt'], 'kept');
  applyPlan(root, actions);
  assert.equal(here('src/gone-here.txt'), false);
});

test('a file the starter dropped is removed only when unchanged here', () => {
  put(root, { 'src/retired.txt': 'still used here\n' });
  const actions = plan();
  assert.equal(kinds(actions)['src/old.txt'], 'removed');
  assert.equal(kinds(actions)['src/retired.txt'], 'kept');
  applyPlan(root, actions);
  assert.equal(here('src/old.txt'), false);
  assert.equal(read('src/retired.txt'), 'still used here\n');
});

test('new starter files are added, unless a different one is in the way', () => {
  put(root, { 'src/clash.txt': 'the project’s clash\n' });
  const actions = plan();
  assert.equal(kinds(actions)['src/new.txt'], 'added');
  assert.equal(kinds(actions)['src/clash.txt'], 'attention');
  applyPlan(root, actions);
  assert.equal(read('src/new.txt'), 'new\n');
  assert.equal(read('src/clash.txt'), 'the project’s clash\n');
  assert.equal(read(`src/clash.txt${UPDATE_SUFFIX}`), 'the starter’s clash\n');
});

test("add-on files and the project's own files are skipped", () => {
  const actions = plan();
  const touched = Object.keys(kinds(actions));
  for (const file of [
    'tools/go.mjs',
    'add-ons/base/files/tools/go.mjs',
    'README.md',
    'apps/demo/main.txt',
  ])
    assert.equal(touched.includes(file), false, file);
  applyPlan(root, actions);
  assert.equal(read('tools/go.mjs'), 'go v1\n');
  assert.equal(read('README.md'), 'the starter\n');
  assert.equal(read('apps/demo/main.txt'), 'demo v1\n');
});

test('globs match whole paths, with * inside a folder and ** across them', () => {
  assert.equal(globToRegExp('apps/**').test('apps/a/b.txt'), true);
  assert.equal(globToRegExp('apps/**').test('apps.txt'), false);
  assert.equal(globToRegExp('docs/*.md').test('docs/a.md'), true);
  assert.equal(globToRegExp('docs/*.md').test('docs/a/b.md'), false);
  assert.equal(globToRegExp('**/FIGMA.md').test('FIGMA.md'), true);
  assert.equal(globToRegExp('**/FIGMA.md').test('packages/ui/FIGMA.md'), true);
  assert.equal(globToRegExp('figma.json').test('figmaXjson'), false);
});

test('the first run guesses its starting point from the first commit date', () => {
  const starter = openStarter(starterDir, undefined, tmp);
  assert.equal(guessBase(root, starter), v1);
  assert.equal(commitsBetween(starter, v1), 1);
  const fit = baseFit(root, starter, v1);
  assert.equal(fit.same, fit.total);
  assert.equal(fit.total, 9);

  rmSync(root, { recursive: true });
  newProject('2026-03-05');
  assert.equal(guessBase(root, starter), v2);
});

test('the guess says so when there is nothing to guess from', () => {
  const starter = openStarter(starterDir, undefined, tmp);
  rmSync(root, { recursive: true });
  newProject('2025-12-01');
  assert.throws(() => guessBase(root, starter), /older than the starter/);
  rmSync(path.join(root, '.git'), { recursive: true });
  git(root, ['init', '-q', '-b', 'main']);
  assert.throws(() => guessBase(root, starter), StarterError);
  assert.throws(() => guessBase(starterDir, starter), /shares its history/);
});

test('the starter can be a git address, downloaded without its files', () => {
  const starter = openStarter(pathToFileURL(starterDir).href, 'main', tmp);
  assert.equal(starter.latest, v2);
  const actions = planUpdate(root, starter, v1, tmp);
  assert.equal(kinds(actions)['src/button.txt'], 'updated');
  assert.throws(
    () => openStarter(path.join(tmp, 'nowhere.git'), undefined, tmp),
    StarterError,
  );
});

test('the lock remembers the commit, and where the starter is', () => {
  assert.equal(knownSource(root), undefined);
  put(root, {
    'addons.lock.json': json({
      source: { repo: 'r', ref: 'main' },
      addons: {},
    }),
  });
  assert.deepEqual(knownSource(root), { repo: 'r', ref: 'main' });
  writeLock(root, { source: { repo: 'mine' }, commit: v2 });
  assert.deepEqual(readLock(root), { source: { repo: 'mine' }, commit: v2 });
  assert.deepEqual(knownSource(root), { repo: 'mine' });
});

test('a changed package.json asks for an install', () => {
  assert.equal(packagesChanged(plan()), true);
  assert.equal(
    packagesChanged([{ file: 'package.json', kind: 'attention' }]),
    false,
  );
});

// The command works on the folder two levels above itself, so a run needs
// its own copy inside the project.
function installCli() {
  for (const file of ['scripts/starter/cli.mjs', 'scripts/starter/lib.mjs'])
    put(root, {
      [file]: readFileSync(path.join(import.meta.dirname, path.basename(file))),
    });
  put(root, {
    'scripts/addon/lib.mjs': readFileSync(
      path.join(import.meta.dirname, '../addon/lib.mjs'),
    ),
  });
  return path.join(root, 'scripts/starter/cli.mjs');
}

test('--dry-run and status change nothing; update writes the lock', () => {
  const command = installCli();
  const run = (...args) => {
    const done = spawnSync(
      process.execPath,
      [command, ...args, '--from', starterDir],
      { encoding: 'utf8' },
    );
    return { status: done.status, out: done.stdout + done.stderr };
  };
  const before = git(root, ['status', '--porcelain']);

  const status = run('status');
  assert.equal(status.status, 0, status.out);
  assert.match(status.out, /starting point is a guess/);
  assert.match(status.out, /1 starter commit behind/);
  assert.match(status.out, /Would update[^]*src\/button\.txt/);
  const dry = run('update', '--dry-run');
  assert.equal(dry.status, 0, dry.out);
  assert.equal(git(root, ['status', '--porcelain']), before);
  assert.equal(here(LOCK_FILE), false);
  assert.equal(read('src/button.txt'), 'button v1\n');

  const update = run('update');
  assert.equal(update.status, 0, update.out);
  assert.match(update.out, /Updated \(\d+\)[^]*src\/button\.txt/);
  assert.match(update.out, /Run: pnpm install/);
  assert.match(update.out, /pnpm addon update/);
  assert.equal(read('src/button.txt'), 'button v2\n');
  assert.deepEqual(readLock(root), { commit: v2 });

  const again = run('status');
  assert.match(again.out, /Up to date with the starter/);
  assert.doesNotMatch(again.out, /guess/);
});

test('an unknown command prints help and fails', () => {
  const run = spawnSync(process.execPath, [CLI, 'nonsense'], {
    encoding: 'utf8',
  });
  assert.equal(run.status, 1);
  assert.match(run.stdout, /pnpm starter <command>/);
});
