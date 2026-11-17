#!/usr/bin/env node
/*
 * Visual checkpoints: an on-demand before/after camera for the whole library.
 *
 *   pnpm look:save     photograph every story in light and dark as the checkpoint
 *   pnpm look:compare  photograph again and report what changed since the checkpoint
 *   pnpm look:accept   make the latest photos the new checkpoint
 *   pnpm look:accept --colour-only   accept only the photos where nothing but colour changed
 *
 * Deliberately not part of `pnpm test`: designers restyle components all
 * project long, so an always-on gate would mostly raise intended changes.
 * Photos stay in the git-ignored .look/ folder, taken and compared on the same
 * machine, so font rendering differences between computers never show up.
 * Reduced motion is on while shooting: the motion tokens drop to 0ms, so no
 * photo catches a transition halfway.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { projectScreens } from './lib/project.mjs';
import {
  buildStorybook,
  MODES,
  openStory,
  PACKAGE,
  serve,
  storyIndex,
} from './lib/storybook.mjs';
import { changeKind, KIND_LABELS } from './look-kind.mjs';

const LOOK = path.join(PACKAGE, '.look');
const DIRS = {
  build: path.join(LOOK, 'storybook'),
  checkpoint: path.join(LOOK, 'checkpoint'),
  latest: path.join(LOOK, 'latest'),
  diff: path.join(LOOK, 'diff'),
};
const REPORT = path.join(LOOK, 'report.html');
const VIEWPORT = { width: 1024, height: 768 };
/*
 * Page templates are photographed at the size their story names, and only at
 * the sizes the project has (project.json; all three when it doesn't say).
 */
const PROJECT = projectScreens();
const TEMPLATE_VIEWPORTS = Object.fromEntries(
  Object.entries(PROJECT.sizes).map(([screen, size]) => [
    screen.charAt(0).toUpperCase() + screen.slice(1),
    size,
  ]),
);
const isTemplate = ({ title }) => title.startsWith('Templates/');
const viewportFor = (story) =>
  (isTemplate(story) && TEMPLATE_VIEWPORTS[story.name]) || VIEWPORT;
const outsideProject = (story) =>
  isTemplate(story) &&
  TEMPLATE_VIEWPORTS[story.name] &&
  !PROJECT.screens.includes(story.name.toLowerCase());
const PARALLEL_PAGES = 6;

const [command, ...flags] = process.argv.slice(2);
const only = flags.find((flag) => flag.startsWith('--only='))?.slice(7);

function git(...args) {
  try {
    return execFileSync('git', args, { cwd: PACKAGE, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

async function stories(baseUrl) {
  return (await storyIndex(baseUrl)).filter(
    (entry) => (!only || entry.id.includes(only)) && !outsideProject(entry),
  );
}

const shotName = (id, mode) => `${id}--${mode.toLowerCase()}.png`;

async function shoot(target) {
  buildStorybook(DIRS.build);
  const server = await serve(DIRS.build);
  const browser = await chromium.launch();
  try {
    const list = await stories(server.url);
    await rm(target, { recursive: true, force: true });
    await mkdir(target, { recursive: true });

    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const jobs = list.flatMap((story) =>
      MODES.map((mode) => ({ story, mode })),
    );
    let done = 0;

    async function worker() {
      const page = await context.newPage();
      for (let job = jobs.shift(); job; job = jobs.shift()) {
        const { story, mode } = job;
        await page.setViewportSize(viewportFor(story));
        await openStory(page, server.url, story.id, mode);
        await page.screenshot({
          path: path.join(target, shotName(story.id, mode)),
          fullPage: true,
        });
        done += 1;
        if (process.stdout.isTTY) {
          process.stdout.write(`\rPhotographed ${done} of ${total}`);
        }
      }
      await page.close();
    }

    const total = jobs.length;
    await Promise.all(Array.from({ length: PARALLEL_PAGES }, worker));
    if (process.stdout.isTTY) process.stdout.write('\n');
    console.log(
      `Photographed ${total} (${list.length} stories × light and dark).`,
    );
    await writeFile(
      path.join(target, 'meta.json'),
      JSON.stringify(
        {
          takenAt: new Date().toISOString(),
          branch: git('branch', '--show-current'),
          commit: git('rev-parse', '--short', 'HEAD'),
          dirty: git('status', '--porcelain') !== '',
          only: only ?? null,
          project: { screens: PROJECT.screens, sizes: PROJECT.sizes },
          stories: list,
        },
        null,
        2,
      ),
    );
    return list;
  } finally {
    await browser.close();
    server.close();
  }
}

async function readPng(file) {
  return PNG.sync.read(await readFile(file));
}

/* Pads an image to the given size with transparent pixels, so a story that grew still diffs. */
function padTo(png, width, height) {
  if (png.width === width && png.height === height) return png.data;
  const padded = new PNG({ width, height });
  PNG.bitblt(png, padded, 0, 0, png.width, png.height, 0, 0);
  return padded.data;
}

async function compareShots() {
  const before = JSON.parse(
    await readFile(path.join(DIRS.checkpoint, 'meta.json'), 'utf8'),
  );
  const after = JSON.parse(
    await readFile(path.join(DIRS.latest, 'meta.json'), 'utf8'),
  );
  const titles = new Map(
    [...before.stories, ...after.stories].map((story) => [story.id, story]),
  );
  const pngs = (files) =>
    new Set(files.filter((file) => file.endsWith('.png')));
  /* A run limited with --only compares against the same slice of the checkpoint. */
  const inScope = (file) => !after.only || file.includes(after.only);
  const old = new Set(
    [...pngs(await readdir(DIRS.checkpoint))].filter(inScope),
  );
  const now = pngs(await readdir(DIRS.latest));

  await rm(DIRS.diff, { recursive: true, force: true });
  await mkdir(DIRS.diff, { recursive: true });

  const results = [];
  for (const file of [...new Set([...old, ...now])].sort()) {
    const [, id, mode] = /^(.*)--(light|dark)\.png$/.exec(file);
    const entry = { file, id, mode, story: titles.get(id) };
    if (!now.has(file)) {
      /* A template at a size the project dropped wasn't photographed; it still exists. */
      results.push({
        ...entry,
        status:
          entry.story && outsideProject(entry.story)
            ? 'unphotographed'
            : 'removed',
      });
      continue;
    }
    if (!old.has(file)) {
      results.push({ ...entry, status: 'added' });
      continue;
    }
    const a = await readPng(path.join(DIRS.checkpoint, file));
    const b = await readPng(path.join(DIRS.latest, file));
    const width = Math.max(a.width, b.width);
    const height = Math.max(a.height, b.height);
    const diff = new PNG({ width, height });
    const pixels = pixelmatch(
      padTo(a, width, height),
      padTo(b, width, height),
      diff.data,
      width,
      height,
      { threshold: 0.01 },
    );
    const resized = a.width !== b.width || a.height !== b.height;
    if (pixels === 0 && !resized) {
      results.push({ ...entry, status: 'same' });
      continue;
    }
    await writeFile(path.join(DIRS.diff, file), PNG.sync.write(diff));

    /* Crop all three to the changed area, so a two-pixel corner change is visible at a glance. */
    const box = changedArea(diff, width, height);
    const crop = (source, suffix) => {
      const out = new PNG({ width: box.width, height: box.height });
      const padded = new PNG({ width, height });
      padded.data = Buffer.from(padTo(source, width, height));
      PNG.bitblt(padded, out, box.x, box.y, box.width, box.height, 0, 0);
      return writeFile(
        path.join(DIRS.diff, file.replace(/\.png$/, `--${suffix}.png`)),
        PNG.sync.write(out),
      );
    };
    await Promise.all([
      crop(a, 'before'),
      crop(b, 'after'),
      crop(diff, 'diff'),
    ]);
    results.push({
      ...entry,
      status: 'changed',
      pixels,
      resized,
      kind: changeKind(a, b),
    });
  }
  await writeFile(
    path.join(DIRS.diff, 'results.json'),
    JSON.stringify(results, null, 2),
  );
  return { before, after, results };
}

/* The bounding box of pixelmatch's pure-red difference pixels, with some margin for context. */
function changedArea(diff, width, height) {
  let [left, top, right, bottom] = [width, height, -1, -1];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (
        diff.data[i] === 255 &&
        diff.data[i + 1] === 0 &&
        diff.data[i + 2] === 0
      ) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < 0) return { x: 0, y: 0, width, height };
  const margin = 48;
  const x = Math.max(0, left - margin);
  const y = Math.max(0, top - margin);
  return {
    x,
    y,
    width: Math.min(width, right + margin + 1) - x,
    height: Math.min(height, bottom + margin + 1) - y,
  };
}

const escape = (text) =>
  String(text).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  );

function describe(meta) {
  return `${escape(meta.branch)} @ ${escape(meta.commit)}${meta.dirty ? ' + uncommitted changes' : ''}, ${new Date(meta.takenAt).toLocaleString()}`;
}

/* Said first, because it explains a page of added and missing photos. */
function sizesChanged(before, after) {
  const was = before.project?.screens;
  const is = after.project?.screens;
  if (!was || !is || was.join() === is.join()) return null;
  return `The project's screen sizes changed since the checkpoint (${was.join(', ')} → ${is.join(', ')}), so templates were photographed at different sizes. Save a new checkpoint once this is reviewed.`;
}

async function writeReport({ before, after, results }) {
  const changed = results.filter((r) => r.status !== 'same');
  const sizesNote = sizesChanged(before, after);
  const pretty = (title) =>
    title
      .split('/')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' / ');
  const figure = (caption, src, full) =>
    `<figure><figcaption>${caption} <a href="${full}">full screen</a></figcaption><a href="${full}"><img src="${src}" alt="" loading="lazy" /></a></figure>`;

  function row(r) {
    const crop = (suffix) =>
      `diff/${r.file.replace(/\.png$/, `--${suffix}.png`)}`;
    if (r.status === 'changed') {
      return `<div class="variant"><h3>${r.mode} mode <span>${KIND_LABELS[r.kind]}: ${r.pixels.toLocaleString()} pixels differ</span></h3>
        <div class="row">${figure('Before', crop('before'), `checkpoint/${r.file}`)}${figure('After', crop('after'), `latest/${r.file}`)}${figure('Differences in red', crop('diff'), `diff/${r.file}`)}</div></div>`;
    }
    if (r.status === 'added') {
      return `<div class="variant"><h3>${r.mode} mode <span>new story, nothing to compare with</span></h3><div class="row">${figure('After', `latest/${r.file}`, `latest/${r.file}`)}</div></div>`;
    }
    if (r.status === 'unphotographed')
      return `<div class="variant"><h3>${r.mode} mode <span>not photographed: this size isn't in project.json</span></h3><div class="row">${figure('Before', `checkpoint/${r.file}`, `checkpoint/${r.file}`)}</div></div>`;
    return `<div class="variant"><h3>${r.mode} mode <span>story no longer exists</span></h3><div class="row">${figure('Before', `checkpoint/${r.file}`, `checkpoint/${r.file}`)}</div></div>`;
  }

  /*
   * One card per story, with its light and dark results inside, grouped by the
   * biggest kind of change it has: layout first, colour-only last, because a
   * palette change can touch hundreds of stories that need only a glance.
   */
  const RANK = [
    'removed',
    'added',
    'layout',
    'size',
    'colour',
    'unphotographed',
  ];
  const rank = (r) => RANK.indexOf(r.status === 'changed' ? r.kind : r.status);
  const byStory = Map.groupBy(changed, (r) => r.id);
  const groupOf = (rows) => RANK[Math.min(...rows.map(rank))];
  const GROUP_TITLES = {
    removed: 'Removed stories',
    added: 'New stories',
    layout: 'Layout changed: shapes moved, appeared or disappeared',
    size: 'Size changed: something grew, shrank or wrapped',
    colour:
      'Colour only: same shapes in the same places. Accept them all with pnpm look:accept --colour-only',
    unphotographed:
      "Not photographed: sizes that aren't in project.json any more",
  };
  const card = (rows) => {
    const { story, id, status } = rows[0];
    const heading = story
      ? `${escape(pretty(story.title))} › ${escape(story.name)}`
      : escape(id);
    return `<section class="${status}"><h2>${heading}</h2>${rows.map(row).join('')}</section>`;
  };
  const groups = Map.groupBy([...byStory.values()], groupOf);
  const cards = RANK.filter((group) => groups.has(group))
    .map((group) => {
      const list = groups.get(group);
      const open = group === 'colour' ? '' : ' open';
      return `<details${open}><summary>${escape(GROUP_TITLES[group])} <span>(${list.length})</span></summary>${list.map(card).join('\n')}</details>`;
    })
    .join('\n');
  const kinds = (kind) =>
    new Set(
      results
        .filter((r) => r.status === 'changed' && r.kind === kind)
        .map((r) => r.id),
    ).size;
  const stories = (status) =>
    new Set(results.filter((r) => r.status === status).map((r) => r.id)).size;

  await writeFile(
    REPORT,
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Visual changes</title>
<style>
  body { font: 15px/1.5 system-ui, sans-serif; margin: 0 auto; max-width: 1400px; padding: 24px; color: #1a1a1a; background: #fafafa; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: #555; margin: 0 0 16px; }
  .summary { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
  .summary span { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 6px 12px; }
  section { background: #fff; border: 1px solid #ddd; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  section.changed { border-left: 4px solid #d93025; }
  section.added { border-left: 4px solid #1e8e3e; }
  section.removed { border-left: 4px solid #777; }
  h2 { font-size: 17px; margin: 0 0 8px; }
  h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; color: #333; margin: 12px 0 6px; }
  h3 span { text-transform: none; letter-spacing: 0; font-weight: 400; color: #666; margin-left: 8px; }
  .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; align-items: start; }
  figcaption a { color: #666; font-size: 12px; margin-left: 6px; }
  figure { margin: 0; }
  figcaption { font-size: 13px; color: #555; margin-bottom: 4px; }
  img { width: 100%; border: 1px solid #e5e5e5; border-radius: 6px; background: repeating-conic-gradient(#eee 0 25%, #fff 0 50%) 0 0 / 16px 16px; }
  .none { font-size: 18px; padding: 32px; text-align: center; }
  details { margin-bottom: 24px; }
  summary { font-size: 19px; font-weight: 600; cursor: pointer; margin-bottom: 12px; }
  summary span { font-weight: 400; color: #666; }
</style>
</head>
<body>
<h1>Visual changes since the checkpoint</h1>
<p class="meta">Checkpoint: ${describe(before)}<br />Now: ${describe(after)}</p>
${sizesNote ? `<p class="meta"><strong>${escape(sizesNote)}</strong></p>` : ''}
<div class="summary">
  <span><strong>${stories('changed')}</strong> stories changed: ${kinds('layout')} layout, ${kinds('size')} size, ${kinds('colour')} colour only</span>
  <span><strong>${stories('added')}</strong> new</span>
  <span><strong>${stories('removed')}</strong> removed</span>
  <span><strong>${results.length}</strong> photos checked</span>
</div>
${cards || '<section class="none">Nothing changed. Every story looks exactly like the checkpoint.</section>'}
</body>
</html>
`,
  );
}

async function save() {
  if (only) {
    console.error(
      'A checkpoint covers every story, so save ignores --only. Run it without.',
    );
    process.exitCode = 1;
    return;
  }
  await shoot(DIRS.checkpoint);
  console.log(
    `Checkpoint saved in ${path.relative(process.cwd(), DIRS.checkpoint)}.`,
  );
}

async function compare() {
  if (!existsSync(path.join(DIRS.checkpoint, 'meta.json'))) {
    console.error('No checkpoint yet. Run `pnpm look:save` first.');
    process.exitCode = 1;
    return;
  }
  await shoot(DIRS.latest);
  const comparison = await compareShots();
  await writeReport(comparison);

  const changed = comparison.results.filter((r) => r.status !== 'same');
  const sizesNote = sizesChanged(comparison.before, comparison.after);
  if (sizesNote) console.log(sizesNote);
  if (changed.length === 0) {
    console.log('No visual changes since the checkpoint.');
  } else {
    console.log(`${changed.length} photo(s) differ from the checkpoint:`);
    for (const r of changed) {
      const extra =
        r.status === 'changed'
          ? ` (${KIND_LABELS[r.kind]}, ${r.pixels} px)`
          : '';
      console.log(`  ${r.status.padEnd(8)}${r.id} [${r.mode}]${extra}`);
    }
  }
  console.log(`Report: ${REPORT}`);
  if (
    !flags.includes('--no-open') &&
    process.stdout.isTTY &&
    process.platform === 'darwin'
  ) {
    spawnSync('open', [REPORT]);
  }
}

async function accept() {
  if (!existsSync(path.join(DIRS.latest, 'meta.json'))) {
    console.error('Nothing to accept. Run `pnpm look:compare` first.');
    process.exitCode = 1;
    return;
  }
  const latest = JSON.parse(
    await readFile(path.join(DIRS.latest, 'meta.json'), 'utf8'),
  );
  if (flags.includes('--colour-only')) {
    const results = JSON.parse(
      await readFile(path.join(DIRS.diff, 'results.json'), 'utf8'),
    );
    const colourOnly = results.filter((r) => r.kind === 'colour');
    for (const r of colourOnly) {
      await cp(
        path.join(DIRS.latest, r.file),
        path.join(DIRS.checkpoint, r.file),
      );
    }
    console.log(
      `Accepted ${colourOnly.length} colour-only photo(s). Run pnpm look:compare again to see what's left.`,
    );
    return;
  }
  if (!latest.only) {
    await rm(DIRS.checkpoint, { recursive: true, force: true });
    await cp(DIRS.latest, DIRS.checkpoint, { recursive: true });
    console.log('The latest photos are now the checkpoint.');
    return;
  }

  /* A limited run replaces only its own slice; the rest of the checkpoint stays. */
  const checkpoint = JSON.parse(
    await readFile(path.join(DIRS.checkpoint, 'meta.json'), 'utf8'),
  );
  const slice = (file) => file.endsWith('.png') && file.includes(latest.only);
  for (const file of (await readdir(DIRS.checkpoint)).filter(slice)) {
    await rm(path.join(DIRS.checkpoint, file));
  }
  for (const file of (await readdir(DIRS.latest)).filter(slice)) {
    await cp(path.join(DIRS.latest, file), path.join(DIRS.checkpoint, file));
  }
  checkpoint.stories = [
    ...checkpoint.stories.filter((story) => !story.id.includes(latest.only)),
    ...latest.stories,
  ];
  await writeFile(
    path.join(DIRS.checkpoint, 'meta.json'),
    JSON.stringify(checkpoint, null, 2),
  );
  console.log(
    `Accepted the latest photos of stories matching "${latest.only}".`,
  );
}

const commands = { save, compare, accept };
if (!commands[command]) {
  console.error(
    'Usage: look.mjs <save|compare|accept> [--only=<story id part>] [--no-open]',
  );
  process.exitCode = 1;
} else {
  await commands[command]();
}
