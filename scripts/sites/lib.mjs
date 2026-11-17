import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

// Folder names double as Metalab site names (^[a-z0-9-]+$); the leading
// character is restricted so names are safe as CLI arguments.
export const SITE_NAME_RULE = /^[a-z0-9][a-z0-9-]*$/;

// The library's Storybook deploy (scripts/deploy-storybook.mjs) owns this
// site name in the shared project namespace; no exploration may claim it.
export const STORYBOOK_SITE = 'storybook';

// CI owns every `pr-<n>-*` site (docs/adr/0008): it publishes them for open
// pull requests and deletes them on close, which is only safe because no
// human ever publishes under the prefix.
export const PR_SITE_PREFIX = /^pr-\d+-/;

export function previewSiteName(pr) {
  return `pr-${pr}-${STORYBOOK_SITE}`;
}

export function reservedSiteName(name) {
  if (name === STORYBOOK_SITE) {
    return (
      `"${STORYBOOK_SITE}" is reserved: CI deploys the library's Storybook to\n` +
      'that site name on every push to main.'
    );
  }
  if (PR_SITE_PREFIX.test(name)) {
    return (
      `"${name}" is reserved: CI publishes pull-request previews as\n` +
      '"pr-<n>-<target>" sites and deletes them when the PR closes.'
    );
  }
  return null;
}

export function siteUrl(project, site) {
  return `https://sites.metalab.com/${project}/${site}/`;
}

// A pull-request number from argv: digits only, so it is safe to splice
// into site names and API paths.
export function prNumberArg(args, flag = '--pr') {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!/^\d+$/.test(value ?? ''))
    fail(`${flag} expects a pull-request number.`);
  return value;
}

export function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    ...options,
  });
  if (result.error) {
    if (result.error.code === 'ENOENT') return { missing: true, status: 1 };
    fail(`${command} failed to start: ${result.error.message}`);
  }
  return result;
}

export function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

// The kit's own Sites project, and the kit's package name. A copy inherits
// both until setup gives the project its own name and slug.
const STARTER_PROJECT = 'design-in-code-starter';
const STARTER_PACKAGE = 'zero-design-kit';

// owner/name from an https or ssh git address, lowercased.
function repoId(url) {
  const match = /[/:]([^/:]+\/[^/]+?)(?:\.git)?\/?$/.exec(url ?? '');
  return match ? match[1].toLowerCase() : null;
}

function originRepo() {
  const result = spawnSync('git', ['remote', 'get-url', 'origin'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return result.status === 0 ? repoId(result.stdout.trim()) : null;
}

// Why this checkout must not use the starter's project, or null when it may:
// only the starter itself (its package name, its repository) publishes there.
export function borrowedStarterProject(project, origin = originRepo()) {
  if (project !== STARTER_PROJECT) return null;
  const name = readJson(path.join(repoRoot, 'package.json')).name;
  if (name !== STARTER_PACKAGE) {
    return `the package is now "${name}" but sites.json still names the starter's project.`;
  }
  const lock = path.join(repoRoot, 'addons.lock.json');
  const starter = existsSync(lock) ? repoId(readJson(lock).source?.repo) : null;
  if (starter && origin && origin !== starter) {
    return `this repository (${origin}) isn't the starter, but sites.json still names the starter's project.`;
  }
  return null;
}

export function sitesProject() {
  const config = readJson(path.join(repoRoot, 'sites.json'));
  const project = config.project ?? null;
  const borrowed = borrowedStarterProject(project);
  if (borrowed) {
    // Treated as unset, so CI skips instead of publishing into the starter.
    console.error(
      `\nNot using Sites project "${project}": ${borrowed}\n` +
        'Set your own project slug in sites.json (engagement-setup skill, Sites step).\n',
    );
    return null;
  }
  return project;
}

export function spaFlags(spaFallback) {
  if (spaFallback === true) return ['--spa-fallback'];
  if (spaFallback === false) return ['--no-spa-fallback'];
  return [];
}
