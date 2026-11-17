#!/usr/bin/env node
/*
 * Taste review's camera: full-page pictures of a screen, for a reviewer who
 * judges it from the pictures alone.
 *
 *   pnpm taste:shots <story id | part of a story title | http(s) address> […more]
 *   pnpm taste:shots --list            every story that can be photographed
 *   pnpm taste:shots <target> --modes=light        one mode only
 *   pnpm taste:shots <target> --storybook=<url>    a Storybook that's already running
 *
 * Each target is photographed in light and dark at the project's screen sizes
 * (project.json; all three when it doesn't say) into
 * .taste/<name>/<size>-<mode>.png. Pictures are taken at one picture pixel per
 * CSS pixel, so a reviewer can measure spacing straight off them.
 *
 * A long page is also saved in parts (<size>-<mode>-part1.png, …): an image
 * reader shrinks a very tall picture until its text can't be read.
 */
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { projectScreens, SCREENS } from './lib/project.mjs';
import {
  MODES,
  openStory,
  PACKAGE,
  storybook,
  storyIndex,
} from './lib/storybook.mjs';

const OUT = path.join(PACKAGE, '.taste');
/*
 * The Storybook build holds JavaScript, which lint would read if it sat in
 * .taste/; node_modules is skipped by lint, Prettier and git alike.
 */
const BUILD = path.join(
  PACKAGE,
  'node_modules',
  '.cache',
  'taste',
  'storybook',
);
const RUNNING_STORYBOOK = 'http://localhost:6006';
const LISTED = 20;
const SCREENS_PER_PART = 2;

/* A problem the person can fix; shown as its message, without a stack. */
export class TasteError extends Error {}

export const isUrl = (target) => /^https?:\/\//i.test(target);

export const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/* Where a page of this height is cut into parts; none when it fits in one. */
export function partsOf(pageHeight, screenHeight) {
  const step = screenHeight * SCREENS_PER_PART;
  if (pageHeight <= step) return [];
  return Array.from({ length: Math.ceil(pageHeight / step) }, (_, index) => ({
    y: index * step,
    height: Math.min(step, pageHeight - index * step),
  }));
}

/* "Sign in/Card", "sign-in-card" and "signincard" all compare equal. */
const key = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '');

const screenOf = (story) =>
  SCREENS.find((screen) => screen === story.name.toLowerCase());

/*
 * The stories a target names: one story by its exact id, otherwise every
 * story under the one title it matches. A whole title or its last part wins
 * over a partial match, so "button" means Button, not IconButton.
 */
export function findStories(target, stories) {
  const byId = stories.find((story) => story.id === target);
  if (byId) return { stories: [byId], byId: true };

  const want = key(target);
  const titles = [...new Set(stories.map((story) => story.title))];
  const whole = titles.filter(
    (title) => key(title) === want || key(title.split('/').at(-1)) === want,
  );
  const matches = whole.length
    ? whole
    : titles.filter((title) => want && key(title).includes(want));

  if (matches.length === 1) {
    return {
      stories: stories.filter((story) => story.title === matches[0]),
      byId: false,
    };
  }
  if (matches.length === 0) {
    throw new TasteError(
      `No story matches "${target}". Run \`pnpm taste:shots --list\` to see every story, or give a full address starting with http to photograph the app or a prototype.`,
    );
  }
  const shown = matches
    .slice(0, LISTED)
    .map((title) => `  ${slug(title)}   (${title})`);
  const more =
    matches.length > LISTED ? `\n  …and ${matches.length - LISTED} more` : '';
  throw new TasteError(
    `"${target}" matches ${matches.length} stories. Say which one:\n${shown.join('\n')}${more}`,
  );
}

/*
 * What to photograph for one target, as groups that each get a folder.
 * A page template has a story per screen size, so each size is shot from its
 * own story; anything else is shot at every size the project has.
 */
export function planTarget(target, stories, project) {
  const sizesFor = (screens) =>
    screens.map((screen) => ({ screen, size: project.sizes[screen] }));

  if (isUrl(target)) {
    const { host, pathname, search, hash } = new URL(target);
    return [
      {
        label: target,
        slug: slug(`${host}${pathname}${search}${hash}`),
        shots: sizesFor(project.screens).map((shot) => ({
          ...shot,
          url: target,
        })),
      },
    ];
  }

  const found = findStories(target, stories);
  const sized = found.stories.filter(screenOf);

  if (found.byId && sized.length) {
    const [story] = found.stories;
    return [
      {
        label: `${story.title} › ${story.name}`,
        slug: story.id,
        shots: sizesFor([screenOf(story)]).map((shot) => ({
          ...shot,
          id: story.id,
        })),
      },
    ];
  }

  if (sized.length) {
    const { title } = sized[0];
    const shots = sizesFor(project.screens).flatMap((shot) => {
      const story = sized.find((s) => screenOf(s) === shot.screen);
      return story ? [{ ...shot, id: story.id }] : [];
    });
    if (!shots.length) {
      throw new TasteError(
        `${title} has no story at this project's screen sizes (${project.screens.join(', ')}); it has ${sized.map((s) => s.name).join(', ')}. Name the story by its id to photograph it anyway.`,
      );
    }
    return [{ label: title, slug: slug(title), shots }];
  }

  return found.stories.map((story) => ({
    label: `${story.title} › ${story.name}`,
    slug: story.id,
    shots: sizesFor(project.screens).map((shot) => ({ ...shot, id: story.id })),
  }));
}

export function parseArgs(argv) {
  const flags = argv.filter((arg) => arg.startsWith('--') && arg !== '--');
  const targets = argv.filter((arg) => !arg.startsWith('--'));
  const value = (name) =>
    flags.find((flag) => flag.startsWith(`--${name}=`))?.slice(name.length + 3);
  const known = ['--list', '--modes=', '--storybook='];
  const unknown = flags.filter(
    (flag) =>
      !known.some((k) => (k.endsWith('=') ? flag.startsWith(k) : flag === k)),
  );
  if (unknown.length) {
    throw new TasteError(
      `Unknown option ${unknown.join(', ')}. Options: --list, --modes=light|dark, --storybook=<url>.`,
    );
  }
  const asked = value('modes')
    ?.split(',')
    .map((mode) => mode.trim().toLowerCase())
    .filter(Boolean);
  const modes = asked
    ? MODES.filter((mode) => asked.includes(mode.toLowerCase()))
    : MODES;
  if (asked && modes.length !== asked.length) {
    throw new TasteError(
      `--modes takes ${MODES.map((mode) => mode.toLowerCase()).join(' or ')}, or both with a comma between.`,
    );
  }
  return {
    targets,
    modes,
    list: flags.includes('--list'),
    storybookUrl: value('storybook') ?? RUNNING_STORYBOOK,
  };
}

async function openSite(url) {
  try {
    /* An empty story list asks only for a Storybook that is this project's. */
    return await storybook({ url, buildDir: BUILD, story: [] });
  } catch (error) {
    throw new TasteError(
      "Storybook didn't build, so there are no stories to photograph. Run `pnpm --filter @repo/ui build` to see what's wrong, fix it, and try again.",
      { cause: error },
    );
  }
}

async function launch() {
  try {
    return await chromium.launch();
  } catch (error) {
    if (!/Executable doesn't exist/.test(error.message)) throw error;
    throw new TasteError(
      "The browser that takes the pictures isn't installed. Run `pnpm --filter @repo/ui exec playwright install chromium`, then try again.",
      { cause: error },
    );
  }
}

/*
 * A page that isn't a story has no theme switcher, so dark is asked for both
 * ways a page can listen: the browser's dark preference (set on the context)
 * and the `.dark` class the library's tokens switch on.
 */
async function openUrl(page, url, mode) {
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
  } catch (error) {
    throw new TasteError(
      `Can't open ${url}. Is it running? Start it first (\`pnpm present\` for prototypes), and check the address.`,
      { cause: error },
    );
  }
  await page
    .waitForLoadState('networkidle', { timeout: 5_000 })
    .catch(() => {});
  await page.addStyleTag({
    content: '* { caret-color: transparent !important; }',
  });
  await page.evaluate(async (dark) => {
    if (dark) document.documentElement.classList.add('dark');
    await document.fonts.ready;
    const frame = () =>
      new Promise((resolve) => requestAnimationFrame(resolve));
    await frame();
    await frame();
  }, mode === 'Dark');
}

const shown = (file) =>
  path.relative(process.env.INIT_CWD ?? process.cwd(), file);

async function main(argv) {
  const { targets, modes, list, storybookUrl } = parseArgs(argv);
  if (!list && !targets.length) {
    throw new TasteError(
      'Say what to photograph: `pnpm taste:shots <story id | part of a story title | http(s) address>`. `pnpm taste:shots --list` shows every story.',
    );
  }

  const project = projectScreens();
  for (const problem of project.problems)
    console.error(`project.json: ${problem}`);

  const needsStories = list || targets.some((target) => !isUrl(target));
  const site = needsStories ? await openSite(storybookUrl) : null;
  try {
    const stories = site ? await storyIndex(site.url) : [];
    if (list) {
      const byTitle = Map.groupBy(stories, (story) => story.title);
      for (const [title, group] of [...byTitle].sort(([a], [b]) =>
        a.localeCompare(b),
      )) {
        console.log(
          `${slug(title)}   (${title}: ${group.map((s) => s.name).join(', ')})`,
        );
      }
      return;
    }

    /* Every target is resolved before the first picture, so a typo costs nothing. */
    const groups = targets.flatMap((target) =>
      planTarget(target, stories, project),
    );

    const browser = await launch();
    try {
      const shared = { deviceScaleFactor: 1, reducedMotion: 'reduce' };
      const contexts = Object.fromEntries(
        await Promise.all(
          modes.map(async (mode) => [
            mode,
            {
              story: await browser.newContext(shared),
              url: await browser.newContext({
                ...shared,
                colorScheme: mode.toLowerCase(),
              }),
            },
          ]),
        ),
      );

      let count = 0;
      for (const group of groups) {
        const dir = path.join(OUT, group.slug);
        await rm(dir, { recursive: true, force: true });
        await mkdir(dir, { recursive: true });
        console.log(group.label);

        for (const shot of group.shots) {
          for (const mode of modes) {
            const page =
              await contexts[mode][shot.url ? 'url' : 'story'].newPage();
            await page.setViewportSize(shot.size);
            let note = '';
            if (shot.url) {
              await openUrl(page, shot.url, mode);
            } else {
              await openStory(page, site.url, shot.id, mode);
              const phase = await page.evaluate(
                () => window.__STORYBOOK_PREVIEW__?.currentRender?.phase,
              );
              if (phase !== 'finished') {
                note =
                  "   ← the story didn't finish cleanly, so this may show an error";
              }
            }
            const file = path.join(
              dir,
              `${shot.screen}-${mode.toLowerCase()}.png`,
            );
            await page.screenshot({ path: file, fullPage: true });
            count += 1;
            console.log(`  ${shown(file)}${note}`);

            const pageHeight = await page.evaluate(
              () => document.documentElement.scrollHeight,
            );
            const parts = partsOf(pageHeight, shot.size.height);
            for (const [index, part] of parts.entries()) {
              const partFile = file.replace(/\.png$/, `-part${index + 1}.png`);
              await page.screenshot({
                path: partFile,
                fullPage: true,
                clip: { x: 0, width: shot.size.width, ...part },
              });
              console.log(
                `    ${shown(partFile)}   (part ${index + 1} of ${parts.length})`,
              );
            }
            await page.close();
          }
        }
      }
      const sizes = SCREENS.filter((screen) =>
        groups.some((group) => group.shots.some((s) => s.screen === screen)),
      );
      console.log(
        `Photographed ${count} picture${count === 1 ? '' : 's'} (${sizes.join(', ')} × ${modes.map((mode) => mode.toLowerCase()).join(' and ')}).`,
      );
    } finally {
      await browser.close();
    }
  } finally {
    site?.close();
  }
}

if (import.meta.main) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    if (!(error instanceof TasteError)) throw error;
    console.error(error.message);
    process.exitCode = 1;
  }
}
