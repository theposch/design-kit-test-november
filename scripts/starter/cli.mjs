// pnpm starter — see how far a project's core is behind the starter, and
// bring it up to date. How it works: scripts/starter/lib.mjs. Why: docs/adr/0010.

import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  LOCK_FILE,
  StarterError,
  UPDATE_SUFFIX,
  applyPlan,
  baseFit,
  commitsBetween,
  describeCommit,
  guessBase,
  knownSource,
  openStarter,
  packagesChanged,
  planUpdate,
  readLock,
  resolveCommit,
  writeLock,
} from './lib.mjs';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const [command, ...rest] = process.argv.slice(2);
const VALUED = new Set(['--from', '--base']);
const flags = new Set();
const options = {};
for (let i = 0; i < rest.length; i++) {
  const arg = rest[i];
  if (VALUED.has(arg)) options[arg.slice(2)] = rest[++i];
  else if (arg.startsWith('--')) flags.add(arg);
}

const HELP = `pnpm starter <command>

  status    how many starter commits this project is behind, and which core
            files an update would change; changes nothing
  update    bring the core up to the starter's latest: files nobody changed
            here are replaced, files changed on both sides are merged, and a
            file that can't be merged is kept, with the starter's version
            beside it (<file>${UPDATE_SUFFIX})

The core is everything that isn't an add-on or the project's own (starter.json
→ projectOwned). Add-ons update separately: pnpm addon update.

Options: --from <git url or folder> (where the starter is),
         --base <commit> (the starter commit this project began from, when
                          the first run's guess is wrong),
         --dry-run (update: show what would happen, change nothing)`;

const GROUPS = [
  ['updated', 'Updated', 'Would update'],
  ['merged', 'Merged your changes with the starter’s', 'Would merge'],
  ['added', 'Added', 'Would add'],
  ['removed', 'Removed', 'Would remove'],
  ['attention', 'Needs a person', 'Would need a person'],
  ['kept', 'Left alone', 'Would leave alone'],
];

function report(actions, dry) {
  for (const [kind, done, would] of GROUPS) {
    const group = actions.filter((action) => action.kind === kind);
    if (!group.length) continue;
    console.log(`\n${dry ? would : done} (${group.length})`);
    for (const { file, note } of group) {
      if (kind === 'attention')
        console.log(
          `  ! ${file} ${note}. The starter's version ${dry ? 'would go' : 'is'} beside it: ${file}${UPDATE_SUFFIX}`,
        );
      else console.log(note ? `  ${file} ${note}.` : `  ${file}`);
    }
  }
}

function main(tmp) {
  if (command !== 'status' && command !== 'update') {
    console.log(HELP);
    if (command && command !== 'help') process.exitCode = 1;
    return;
  }
  const dry = command === 'status' || flags.has('--dry-run');
  const lock = readLock(root);
  const known = knownSource(root);
  const source = options.from ?? known?.repo;
  if (!source)
    throw new StarterError(
      'Where is the starter? Run again with --from <git url or folder>.',
    );
  const ref = options.from ? undefined : known?.ref;
  if (!existsSync(source)) console.log(`Reading the starter from ${source}…`);
  const starter = openStarter(source, ref, tmp);

  const guessed = !options.base && !lock.commit;
  const base = options.base
    ? resolveCommit(starter, options.base)
    : (lock.commit ?? guessBase(root, starter));
  if (guessed) {
    const { id, day, subject } = describeCommit(starter, base);
    const { same, total } = baseFit(root, starter, base);
    console.log(
      `No ${LOCK_FILE} yet, so the starting point is a guess: ${id} (${day}, "${subject}"), the newest starter commit before this project's first commit. ${same} of ${total} core files here match it exactly. If that looks wrong, run again with --base <commit>.`,
    );
  }

  const behind = commitsBetween(starter, base);
  const latest = describeCommit(starter, starter.latest);
  const actions = planUpdate(root, starter, base, tmp);
  console.log(
    behind
      ? `${behind} starter commit${behind > 1 ? 's' : ''} behind (latest: ${latest.id}, ${latest.day}).`
      : `Up to date with the starter (${latest.id}, ${latest.day}).`,
  );
  if (behind && !actions.length)
    console.log('None of them changes a core file here.');
  report(actions, dry);

  if (dry) {
    if (command === 'status' && actions.length)
      console.log('\nTo make these changes: pnpm starter update');
    return;
  }
  applyPlan(root, actions);
  // only a repo address is worth remembering; a folder is someone's computer
  const remembered =
    known ??
    (options.from && !existsSync(options.from)
      ? { repo: options.from }
      : undefined);
  writeLock(root, { source: remembered, commit: starter.latest });

  const review = actions.filter(({ kind }) => kind === 'attention').length;
  if (review)
    console.log(
      `\n${review} file${review > 1 ? 's' : ''} to look at (marked !). Merge each ${UPDATE_SUFFIX} file into the one beside it, then delete it.`,
    );
  if (packagesChanged(actions))
    console.log('\nPackages changed. Run: pnpm install');
  console.log('\nAdd-ons update separately. Next: pnpm addon update');
}

const tmp = mkdtempSync(path.join(tmpdir(), 'starter-'));
try {
  main(tmp);
} catch (error) {
  if (!(error instanceof StarterError)) throw error;
  console.error(`\n${error.message}\n`);
  process.exitCode = 1;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
