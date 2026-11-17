// pnpm notebook — finds this project's notebook on this computer: what Claude
// knows about the client project (brief, people, decisions, feedback, open
// questions), kept outside the repo by the project-notebook skill. Matches this
// repo's git remote against `codeRepos` in each notebook.json. Prints nothing
// harmful when there is none: most people won't have one.
//
//   pnpm notebook               where it is, and what to read first
//   pnpm notebook --path        just the folder, for scripts
//   pnpm notebook link <name>   link the notebook called <name> (its folder or
//                               its name) to this repo's own address

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const pathOnly = process.argv.includes('--path');

/** github.com/org/repo, whatever form the remote is written in. */
export function normalizeRemote(url) {
  return url
    .trim()
    .replace(/^git@([^:]+):/, '$1/')
    .replace(/^[a-z+]+:\/\/(?:[^@/]+@)?/, '')
    .replace(/\.git$/, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}

function remoteUrl(name = 'origin') {
  try {
    return execFileSync('git', ['remote', 'get-url', name], {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function remote() {
  const url = remoteUrl();
  return url ? normalizeRemote(url) : null;
}

/*
 * The starter's own addresses: a copy's origin often still points there, and
 * linking it would open one client's notebook in every copy of the starter.
 */
function starterRemotes() {
  const out = new Set();
  try {
    const lock = JSON.parse(readFileSync('addons.lock.json', 'utf8'));
    if (lock.source?.repo) out.add(normalizeRemote(lock.source.repo));
  } catch {
    /* no add-ons record */
  }
  const starter = remoteUrl('starter');
  if (starter) out.add(normalizeRemote(starter));
  return out;
}

const isLocalPath = (url) => /^(\/|~|\.|file:)/.test(url) || !url.includes(':');

function root() {
  const settings = path.join(homedir(), '.claude', 'project-notebooks.json');
  try {
    const { root: dir } = JSON.parse(readFileSync(settings, 'utf8'));
    if (dir) return dir.replace(/^~(?=\/|$)/, homedir());
  } catch {
    /* no settings: use the default */
  }
  return path.join(homedir(), 'Project Notebooks');
}

function find(repo) {
  const dir = root();
  if (!existsSync(dir)) return null;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const folder = path.join(dir, entry.name);
    try {
      const notebook = JSON.parse(
        readFileSync(path.join(folder, 'notebook.json'), 'utf8'),
      );
      const linked = (notebook.codeRepos ?? []).map(normalizeRemote);
      if (linked.includes(repo)) return { folder, notebook };
    } catch {
      /* not a notebook */
    }
  }
  return null;
}

const count = (file, pattern) => {
  try {
    return (readFileSync(file, 'utf8').match(pattern) ?? []).length;
  } catch {
    return 0;
  }
};

if (process.argv[2] === 'link') {
  const name = process.argv[3];
  const url = remoteUrl();
  const fail = (message) => {
    console.error(`\n${message}\n`);
    process.exit(1);
  };
  if (!name) fail('Usage: pnpm notebook link <notebook folder or name>');
  if (!url)
    fail(
      "This repo has no origin yet. Add the project's own repository first: git remote add origin <address>",
    );
  if (isLocalPath(url) || starterRemotes().has(normalizeRemote(url)))
    fail(
      `origin is ${url}, the starter or a folder on this computer, not the project's repository.\n` +
        "Rename it (git remote rename origin starter), add the project's own address as origin, then link.",
    );
  const dir = root();
  const wanted = name.toLowerCase();
  const folder = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => path.join(dir, e.name))
        .find((f) => {
          try {
            const nb = JSON.parse(
              readFileSync(path.join(f, 'notebook.json'), 'utf8'),
            );
            return (
              path.basename(f).toLowerCase() === wanted ||
              String(nb.name ?? '').toLowerCase() === wanted
            );
          } catch {
            return false;
          }
        })
    : null;
  if (!folder) fail(`No notebook called "${name}" in ${dir}.`);
  const file = path.join(folder, 'notebook.json');
  const notebook = JSON.parse(readFileSync(file, 'utf8'));
  const repos = notebook.codeRepos ?? [];
  if (repos.map(normalizeRemote).includes(normalizeRemote(url))) {
    console.log(`Already linked: ${path.basename(folder)} ↔ ${url}`);
    process.exit(0);
  }
  notebook.codeRepos = [...repos, url];
  writeFileSync(file, `${JSON.stringify(notebook, null, 2)}\n`);
  console.log(
    `Linked ${path.basename(folder)} to ${url}. Run pnpm notebook to see it.`,
  );
  process.exit(0);
}

const repo = remote();
if (repo && starterRemotes().has(repo)) {
  console.log(
    "This folder's origin is the starter itself, so no project notebook is matched to it.\n" +
      "Point origin at the project's own repository, then run: pnpm notebook link <notebook name>",
  );
  process.exit(pathOnly ? 1 : 0);
}
const found = repo && find(repo);

if (pathOnly) {
  if (found) console.log(found.folder);
  process.exit(found ? 0 : 1);
}

if (!found) {
  console.log(
    repo
      ? `No project notebook on this computer is linked to ${repo}.`
      : 'This folder has no git remote, so no notebook can be matched to it.',
  );
  process.exit(0);
}

const { folder, notebook } = found;
const at = (file) => path.join(folder, file);
const open = (() => {
  try {
    const text = readFileSync(at('open-questions.md'), 'utf8');
    const section = text.split(/^## Answered/m)[0];
    return (section.match(/^- Q-\d+/gm) ?? []).length;
  } catch {
    return 0;
  }
})();
const last = Object.entries(notebook.lastCatchUp ?? {})
  .filter(([, when]) => when)
  .map(([source, when]) => `${source} ${String(when).slice(0, 10)}`)
  .join(', ');

console.log(`Project notebook: ${notebook.name ?? path.basename(folder)}${notebook.status ? ` (${notebook.status})` : ''}
  ${folder}
  Read first: brief.md, then decisions.md (${count(at('decisions.md'), /^## D-\d+/gm)} decisions)
  Also: open-questions.md (${open} open), feedback.md (${count(at('feedback.md'), /^- F-\d+/gm)}), people.md
  Last caught up: ${last || 'never'}
It holds internal client talk: use it, never copy it into this repo.`);
