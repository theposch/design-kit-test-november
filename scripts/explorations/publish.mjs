import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

import {
  explorationPackage,
  fail,
  repoRoot,
  run,
  sitesProject,
  spaFlags,
} from './lib.mjs';

const [name, ...rest] = process.argv.slice(2);
if (!name || name.startsWith('-') || rest.length > 0) {
  fail('usage: pnpm publish-exploration <name>');
}

const { distDir, spaFallback } = explorationPackage(name);

const project = sitesProject();
if (!project) {
  fail(
    'sites.json has no "project" set.\n' +
      'Publishing needs the one-time engagement setup — see "Setup" in\n' +
      'explorations/README.md.',
  );
}

const whoami = spawnSync('sites', ['whoami'], { encoding: 'utf8' });
if (whoami.error?.code === 'ENOENT') {
  fail(
    'The sites CLI is not installed. Install it with:\n\n' +
      '  curl https://sites.metalab.com/install.sh | sh\n\n' +
      'then re-run this command.',
  );
}
if (whoami.status !== 0) {
  fail(
    '`sites whoami` failed — your token is probably missing or invalid.\n' +
      'Grab an API token from the https://sites.metalab.com dashboard, then:\n\n' +
      '  export SITES_TOKEN=sites_...\n\n' +
      'or write it to ~/.config/sites/config (mode 0600).\n\n' +
      (whoami.stderr ?? ''),
  );
}

const email = whoami.stdout.match(/^email:\s*(\S+)/m)?.[1];
const user = String(email ?? '')
  .split('@')[0]
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
if (!user) {
  fail(`Could not find an email in \`sites whoami\` output:\n${whoami.stdout}`);
}

const build = run('pnpm', [
  'turbo',
  'run',
  'build',
  `--filter=./explorations/${name}`,
]);
if (build.status !== 0) fail('Build failed — see output above.');
if (!existsSync(distDir)) {
  fail(
    `The build produced no ${path.relative(repoRoot, distDir)}.\n` +
      'The contract is `build` → dist/ (or point a "sites": {"dist": "..."}\n' +
      "field in the exploration's package.json at the real output dir).",
  );
}

const site = `${name}-${user}`;
const deploy = run('sites', [
  'deploy',
  distDir,
  site,
  '--project',
  project,
  ...spaFlags(spaFallback),
]);
if (deploy.status !== 0) fail('Deploy failed — see output above.');

console.log(`\nDraft published: https://sites.metalab.com/${project}/${site}/`);
