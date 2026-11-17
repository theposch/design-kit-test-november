import { spawnSync } from 'node:child_process';

import {
  fail,
  prNumberArg,
  previewSiteName,
  run,
  sitesProject,
} from './sites/lib.mjs';

const args = process.argv.slice(2);
const pr = prNumberArg(args);
if (!pr || args.length !== 2) {
  fail('usage: node scripts/delete-preview.mjs --pr <number>');
}

const project = sitesProject();
if (!project || !process.env.SITES_TOKEN) {
  console.log('Sites is not wired for this run — no preview to delete.');
  process.exit(0);
}

const site = previewSiteName(pr);

// A PR whose build never went green has no site; only delete what exists.
const list = spawnSync('sites', ['--json', 'list', '--project', project], {
  encoding: 'utf8',
});
if (list.error?.code === 'ENOENT') {
  fail('The sites CLI is not on PATH in this environment.');
}
if (list.status !== 0) fail(`sites list failed:\n${list.stderr ?? ''}`);
const exists = JSON.parse(list.stdout).sites.some(
  (entry) => entry.site_name === site,
);
if (!exists) {
  console.log(`No site named ${site} — nothing to delete.`);
  process.exit(0);
}

const remove = run('sites', ['delete', site, '--project', project, '--yes']);
if (remove.status !== 0) fail('Delete failed — see output above.');
console.log(`Deleted ${site}`);
