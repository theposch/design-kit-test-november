import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

import {
  explorationPackage,
  explorationsDir,
  fail,
  repoRoot,
  run,
  sitesProject,
  spaFlags,
} from './lib.mjs';

const since = process.argv[2];
if (!since) fail('usage: node scripts/explorations/ci-deploy.mjs <since-ref>');

const project = sitesProject();
if (!project) {
  // A fresh template clone has no Sites project yet; that must not fail main.
  console.log('sites.json has no "project" set — skipping deploy.');
  process.exit(0);
}
if (!process.env.SITES_TOKEN) {
  fail(
    'SITES_TOKEN is not set. Mint a project token and add it as the\n' +
      'SITES_PROJECT_TOKEN repo secret — see "Setup" in explorations/README.md.',
  );
}

const dry = spawnSync(
  'pnpm',
  [
    'turbo',
    'run',
    'build',
    `--filter={./explorations/*}[${since}]`,
    '--dry=json',
  ],
  { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);
if (dry.status !== 0) {
  fail(`turbo --dry=json failed:\n${dry.stderr ?? ''}${dry.stdout ?? ''}`);
}
const changed = [
  ...new Set(
    JSON.parse(dry.stdout)
      .tasks.filter((task) => task.task === 'build')
      .map((task) => task.directory)
      .filter((dir) => dir?.startsWith('explorations/')),
  ),
];

if (changed.length === 0) {
  console.log(`No explorations changed since ${since} — nothing to deploy.`);
  process.exit(0);
}

// Explorations that show the others (the prototype viewer lists every
// prototype) set "sites": {"rebuildOnAnyChange": true}, and are rebuilt
// and redeployed whenever any exploration changed.
for (const name of readdirSync(explorationsDir)) {
  const dir = `explorations/${name}`;
  if (changed.includes(dir) || !existsSync(path.join(repoRoot, dir, 'package.json'))) continue;
  if (!explorationPackage(name).pkg.sites?.rebuildOnAnyChange) continue;
  const build = run('pnpm', ['turbo', 'run', 'build', `--filter=@explorations/${name}`]);
  if (build.status !== 0) fail(`${name}: build failed`);
  changed.push(dir);
}

const failed = [];
for (const dir of changed) {
  const name = path.basename(dir);
  const { distDir, spaFallback } = explorationPackage(name);
  if (!existsSync(distDir)) {
    console.error(
      `${name}: no build output at ${path.relative(repoRoot, distDir)}`,
    );
    failed.push(name);
    continue;
  }
  const deploy = run('sites', [
    'deploy',
    distDir,
    name,
    '--project',
    project,
    ...spaFlags(spaFallback),
  ]);
  if (deploy.missing) fail('The sites CLI is not on PATH in this environment.');
  if (deploy.status !== 0) {
    failed.push(name);
    continue;
  }
  console.log(`Deployed https://sites.metalab.com/${project}/${name}/`);
}

if (failed.length > 0) fail(`Deploy failed for: ${failed.join(', ')}`);
