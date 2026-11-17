import { appendFileSync, existsSync } from 'node:fs';
import path from 'node:path';

import {
  fail,
  previewSiteName,
  prNumberArg,
  repoRoot,
  run,
  sitesProject,
  siteUrl,
  STORYBOOK_SITE,
} from './sites/lib.mjs';

const args = process.argv.slice(2);
const pr = prNumberArg(args);
if (args.length !== (pr ? 2 : 0)) {
  fail('usage: node scripts/deploy-storybook.mjs [--pr <number>]');
}

// Sites unwired is a valid state for both paths: a fresh template clone has
// no project, and Dependabot/fork PRs never receive the token. Neither may
// fail the run.
const project = sitesProject();
if (!project) {
  console.log('sites.json has no "project" set — skipping deploy.');
  process.exit(0);
}
if (!process.env.SITES_TOKEN) {
  if (pr) {
    console.log('SITES_TOKEN is not available — skipping preview deploy.');
    process.exit(0);
  }
  fail(
    'SITES_TOKEN is not set. Mint a project token and add it as the\n' +
      'SITES_PROJECT_TOKEN repo secret — see "Wire Metalab Sites" in README.md.',
  );
}

const distDir = path.join(repoRoot, 'packages/ui/storybook-static');
if (!existsSync(distDir)) {
  fail(
    'No build output at packages/ui/storybook-static.\n' +
      'Run `pnpm --filter @repo/ui build` first.',
  );
}

const site = pr ? previewSiteName(pr) : STORYBOOK_SITE;
const deploy = run('sites', ['deploy', distDir, site, '--project', project]);
if (deploy.missing) fail('The sites CLI is not on PATH in this environment.');
if (deploy.status !== 0) fail('Deploy failed — see output above.');

const url = siteUrl(project, site);
console.log(`Deployed ${url}`);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `deployed=true\nurl=${url}\n`);
}
