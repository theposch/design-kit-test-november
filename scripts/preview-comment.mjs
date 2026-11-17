import { spawnSync } from 'node:child_process';

import {
  fail,
  previewSiteName,
  prNumberArg,
  sitesProject,
  siteUrl,
} from './sites/lib.mjs';

// A hidden marker at the top of the body is how later runs find the comment
// to edit; every PR carries at most one.
const MARKER = '<!-- storybook-preview -->';

const args = process.argv.slice(2);
const pr = prNumberArg(args);
const removed = args.includes('--removed');
const shaIndex = args.indexOf('--deployed');
const sha = shaIndex === -1 ? null : args[shaIndex + 1];
const usage =
  'usage: node scripts/preview-comment.mjs --pr <number> ' +
  '(--deployed <head-sha> | --removed)';
if (!pr || removed === Boolean(sha) || (sha && !/^[0-9a-f]{7,40}$/.test(sha))) {
  fail(usage);
}

const repo = process.env.GITHUB_REPOSITORY;
if (!repo) fail('GITHUB_REPOSITORY is not set.');
if (!process.env.GH_TOKEN) fail('GH_TOKEN is not set.');

function gh(ghArgs) {
  const result = spawnSync('gh', ghArgs, { encoding: 'utf8' });
  if (result.error?.code === 'ENOENT') fail('The gh CLI is not on PATH.');
  if (result.status !== 0) {
    fail(`gh ${ghArgs.slice(0, 2).join(' ')} failed:\n${result.stderr ?? ''}`);
  }
  return result.stdout;
}

const existing = gh([
  'api',
  '--paginate',
  `repos/${repo}/issues/${pr}/comments`,
  '--jq',
  `.[] | select(.body | startswith("${MARKER}")) | .id`,
])
  .trim()
  .split('\n')
  .find(Boolean);

let body;
if (removed) {
  // Never announce a removal on a PR that never had a preview.
  if (!existing) process.exit(0);
  body = 'Removed when this PR was closed.';
} else {
  const project = sitesProject();
  if (!project) fail('sites.json has no "project" set.');
  const stamp = new Date()
    .toISOString()
    .replace('T', ' ')
    .replace(/:\d\d\.\d+Z$/, ' UTC');
  body =
    `${siteUrl(project, previewSiteName(pr))}\n\n` +
    `Updated for \`${sha.slice(0, 7)}\` · ${stamp}`;
}
body = `${MARKER}\n### Storybook preview\n\n${body}\n`;

if (existing) {
  gh([
    'api',
    '--method',
    'PATCH',
    `repos/${repo}/issues/comments/${existing}`,
    '-f',
    `body=${body}`,
  ]);
} else {
  gh(['api', `repos/${repo}/issues/${pr}/comments`, '-f', `body=${body}`]);
}
console.log(existing ? 'Updated preview comment.' : 'Posted preview comment.');
