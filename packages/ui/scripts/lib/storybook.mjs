/*
 * Opening a story the same way every time, for every tool that photographs or
 * measures one (visual checkpoints, the Figma checks). Two tools that open a
 * story differently disagree about what it looks like.
 */
import { spawnSync } from 'node:child_process';
import {
  createReadStream,
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

export const PACKAGE = path.resolve(import.meta.dirname, '..', '..');

/* Storybook's theme switcher names (.storybook/preview.tsx). */
export const MODES = ['Light', 'Dark'];

export function modeName(mode) {
  const match = MODES.find((m) => m.toLowerCase() === mode.toLowerCase());
  if (!match) throw new Error(`Mode must be one of: ${MODES.join(', ')}.`);
  return match;
}

export function buildStorybook(outDir) {
  console.log('Building Storybook…');
  const result = spawnSync(
    'pnpm',
    ['exec', 'storybook', 'build', '--test', '--quiet', '-o', outDir],
    { cwd: PACKAGE, stdio: ['ignore', 'ignore', 'inherit'] },
  );
  if (result.status !== 0) throw new Error('Storybook build failed.');
  /* Says whose build this is, for isOurs(). */
  writeFileSync(
    path.join(outDir, 'owner.json'),
    JSON.stringify({ package: PACKAGE }),
  );
}

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};

export function serve(directory) {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const file = path.join(directory, decodeURIComponent(url.pathname));
    if (!file.startsWith(directory) || !existsSync(file)) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
    });
    createReadStream(file).pipe(response);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ url: `http://127.0.0.1:${port}`, close: () => server.close() });
    });
  });
}

/* Has every story asked for (one id or a list). */
async function hasStory(url, ids) {
  try {
    const response = await fetch(`${url}/index.json`);
    if (!response.ok) return false;
    const { entries } = await response.json();
    return [ids].flat().every((id) => Boolean(entries?.[id]));
  } catch {
    return false;
  }
}

/*
 * Ours, not a copy of this starter on the same port: copies share every story
 * id, so the stories prove nothing. A dev server only serves files from its own
 * project, so it can hand back this package's package.json only if it's ours.
 * A build made here says whose it is in owner.json.
 */
async function isOurs(url) {
  try {
    const owner = await fetch(`${url}/owner.json`);
    if (owner.ok) return (await owner.json()).package === PACKAGE;
  } catch {
    /* not one of our builds */
  }
  try {
    const response = await fetch(`${url}/@fs${PACKAGE}/package.json`);
    if (!response.ok) return false;
    const theirs = await response.json();
    const mine = JSON.parse(
      readFileSync(path.join(PACKAGE, 'package.json'), 'utf8'),
    );
    return theirs.name === mine.name;
  } catch {
    return false;
  }
}

/*
 * A Storybook to look at: the one already running at `url` when it is this
 * project's and has the stories (fast, and shows unsaved work), otherwise a
 * fresh static build.
 */
export async function storybook({ url, buildDir, story }) {
  if (url && (await hasStory(url, story))) {
    if (await isOurs(url)) return { url, close: () => {} };
    console.log(
      `The Storybook at ${url} belongs to another copy of this project; building this one instead.`,
    );
  }
  buildStorybook(buildDir);
  const site = await serve(buildDir);
  if (!(await hasStory(site.url, story))) {
    site.close();
    throw new Error(
      `There is no story with the id "${[story].flat().join('", "')}".`,
    );
  }
  return site;
}

export async function storyIndex(baseUrl) {
  const index = await (await fetch(`${baseUrl}/index.json`)).json();
  return Object.values(index.entries)
    .filter((entry) => entry.type === 'story')
    .map(({ id, title, name }) => ({ id, title, name }));
}

/*
 * Opens a story in a mode and waits until it is still: the story and its play
 * function have finished, fonts have loaded, focus has landed and every
 * scroller is back at its top. The page's context should have
 * `reducedMotion: 'reduce'`, which drops the motion tokens to 0ms.
 */
export async function openStory(page, baseUrl, id, mode) {
  await page.goto(
    `${baseUrl}/iframe.html?id=${id}&viewMode=story&globals=theme:${modeName(mode)}`,
  );
  await page.waitForFunction(
    () =>
      ['finished', 'errored', 'aborted'].includes(
        window.__STORYBOOK_PREVIEW__?.currentRender?.phase,
      ),
    null,
    { timeout: 20_000 },
  );
  await page.addStyleTag({
    content: '* { caret-color: transparent !important; }',
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const frame = () =>
      new Promise((resolve) => requestAnimationFrame(resolve));
    await frame();
    await frame();
    for (const element of document.querySelectorAll('*')) {
      if (element.scrollTop || element.scrollLeft) element.scrollTo(0, 0);
    }
    window.scrollTo(0, 0);
    await frame();
  });
}
