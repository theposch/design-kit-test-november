#!/usr/bin/env node
/*
 * Whole screens from Figma.
 *
 *   pnpm figma:health <slug>...           how tidy the file is, in one line per snapshot
 *   pnpm figma:survey <slug>... [--save]  the grid the screens follow; --save writes the
 *                                         confirmed result to figma.json as `grid`
 *   pnpm figma:screen <slug> [--mode light|dark] [--url <storybook>]
 *                                         a built screen against its frame: pieces,
 *                                         regions, text, and every phone width with no spill
 *
 * Snapshots are figma/specs/<slug>.json, one screen frame each (or several, for
 * the health check and survey). The screen check reads <slug>.map.json:
 *
 *   {
 *     "screen": { "story": "templates-home--phone" }        a story, or
 *     "screen": { "url": "http://localhost:5173/#home",      a running page
 *                 "source": "apps/frontend/src/Home.tsx" },  (source: checked for copied sizes)
 *     "drawnIn": "dark",                                     the frame's mode, when its background doesn't say
 *     "regions": { "Header": "header", "Feed/Cards": "[data-region=cards]",
 *                  "Tab bar": { "selector": "nav", "pinned": true } },
 *     "pieces": { "Button": { "use": "Button", "selector": "button" },
 *                 "Chip": { "new": "filter chip; port it first" },
 *                 "Status bar": { "skip": "the phone draws it" } }
 *   }
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { REPO } from '../lib/project.mjs';
import { openStory, PACKAGE, storybook } from '../lib/storybook.mjs';
import { readConfig } from './lib.mjs';
import {
  checkPieces,
  checkRegions,
  checkTexts,
  drawnMode,
  fixedSizes,
  gridEntry,
  health,
  layerSizes,
  piecesOf,
  survey,
  surveyLines,
  textsOf,
  widthsFor,
} from './screens-lib.mjs';

const [command, ...rest] = process.argv.slice(2);
const flag = (name) => {
  const i = rest.indexOf(`--${name}`);
  return i === -1 ? undefined : rest[i + 1];
};
const slugs = rest.filter(
  (a, i) =>
    !a.startsWith('--') &&
    !['--mode', '--url', '--specs'].includes(rest[i - 1]),
);
const specsDir = path.resolve(
  flag('specs') ?? path.join(PACKAGE, 'figma', 'specs'),
);

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function readSpec(slug) {
  const file = path.join(specsDir, `${slug}.json`);
  if (!existsSync(file))
    fail(
      `No snapshot at ${path.relative(process.cwd(), file)}. Run the extractor on the frame and save it with pnpm figma:snapshot ${slug} <file>.`,
    );
  return JSON.parse(readFileSync(file, 'utf8'));
}

/* Every name the library exports, to recognise detached copies and check the map. */
function libraryExports() {
  const barrel = readFileSync(path.join(PACKAGE, 'src', 'index.ts'), 'utf8');
  return new Set([
    ...[...barrel.matchAll(/export \* as (\w+)/g)].map((m) => m[1]),
    ...[...barrel.matchAll(/export \{([^}]*)\}/g)].flatMap((m) =>
      m[1]
        .split(',')
        .map((p) =>
          p
            .trim()
            .replace(/^type\s+/, '')
            .split(/\s+as\s+/)
            .pop(),
        )
        .filter(Boolean),
    ),
  ]);
}

const screensIn = (slug, spec) =>
  (spec.nodes ?? []).map((n, i) => ({
    name: n.name ?? `${slug} ${i + 1}`,
    tree: n.tree ?? n,
  }));

function runHealth() {
  if (!slugs.length) fail('Usage: pnpm figma:health <slug>...');
  const names = [...libraryExports()];
  let worst = 'tidy';
  for (const slug of slugs) {
    const result = health(readSpec(slug), { libraryNames: names });
    console.log(`\n${slug}: ${result.verdict}. ${result.line}.`);
    if (
      result.verdict === 'messy' ||
      (result.verdict === 'mixed' && worst === 'tidy')
    )
      worst = result.verdict;
  }
  const care = readConfig(REPO).care;
  if (worst !== 'tidy' && !care)
    console.log(
      `\nAsk once, and save the answer in figma.json as "care": "system" or "quick":\n  This file isn't set up with tokens and styles. Set them up properly first (slower, and the result can grow into the real product), or is this a quick and dirty prototype where speed matters?\n`,
    );
  else if (care) console.log(`\nfigma.json says "care": "${care}".\n`);
}

function runSurvey() {
  if (!slugs.length) fail('Usage: pnpm figma:survey <slug>... [--save]');
  const screens = slugs.flatMap((slug) => screensIn(slug, readSpec(slug)));
  if (screens.length < 3)
    console.log(
      `Only ${screens.length} screen(s): a pattern needs 3–5 to be trusted. Add more if the flow has them.`,
    );
  const result = survey(screens);
  console.log(`\nSurveyed ${result.screens} screen(s):`);
  for (const line of surveyLines(result)) console.log(line);
  if (rest.includes('--save')) {
    const file = path.join(REPO, 'figma.json');
    const config = existsSync(file)
      ? JSON.parse(readFileSync(file, 'utf8'))
      : {};
    config.grid = gridEntry(result);
    writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
    console.log(`\nSaved to figma.json: ${JSON.stringify(config.grid)}\n`);
  } else {
    console.log(
      '\nShow this to the person. Once they confirm or correct it, save it with --save (or edit figma.json `grid` by hand).\n',
    );
  }
}

async function measure(page, map, texts) {
  return page.evaluate(
    ({ regions, pieces, texts }) => {
      const box = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height };
      };
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };
      const boxes = {};
      for (const selector of regions) {
        const el = document.querySelector(selector);
        if (el) boxes[selector] = box(el);
      }
      const counts = {};
      for (const selector of pieces)
        counts[selector] = [...document.querySelectorAll(selector)].filter(
          visible,
        ).length;
      /* The smallest element holding each text's words: its own face, size and colour. */
      const norm = (t) => (t ?? '').replace(/\s+/g, ' ').trim();
      const all = [...document.querySelectorAll('body *')].filter(
        (el) => visible(el) && !['SCRIPT', 'STYLE'].includes(el.tagName),
      );
      const styles = {};
      for (const want of texts) {
        let best = null;
        for (const el of all) {
          const t = norm(el.textContent);
          if (!t.includes(want)) continue;
          if (!best || t.length < best.length) best = { el, length: t.length };
        }
        if (!best) continue;
        const cs = getComputedStyle(best.el);
        styles[want] = {
          family: cs.fontFamily,
          size: Number.parseFloat(cs.fontSize),
          weight: cs.fontWeight,
          color: cs.color,
        };
      }
      return { boxes, counts, styles };
    },
    {
      regions: Object.values(map.regions ?? {}).map((e) =>
        typeof e === 'string' ? e : e.selector,
      ),
      pieces: Object.values(map.pieces ?? {})
        .map((e) => e.selector)
        .filter(Boolean),
      texts: texts.flatMap((t) => t.parts.map((p) => p.chars)),
    },
  );
}

/* Anything wider than the screen that nothing clips: it spills sideways. */
function spill(page) {
  return page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const scrolls = document.documentElement.scrollWidth > W + 1;
    const clippedBy = (el) => {
      for (
        let p = el.parentElement;
        p && p !== document.body;
        p = p.parentElement
      )
        if (getComputedStyle(p).overflowX !== 'visible') return true;
      return false;
    };
    const describe = (el) => {
      const cls =
        typeof el.className === 'string' ? el.className.split(' ')[0] : '';
      const words = (el.textContent ?? '').trim().slice(0, 30);
      return `<${el.tagName.toLowerCase()}${cls ? ` class="${cls}…"` : ''}>${words ? ` "${words}"` : ''}`;
    };
    const offenders = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if ((r.right > W + 1 || r.left < -1) && !clippedBy(el))
        offenders.push(
          `${describe(el)} reaches ${Math.round(r.right)} of ${W}`,
        );
    }
    return { scrolls, offenders: offenders.slice(0, 5) };
  });
}

function table(title, rows, columns) {
  if (!rows.length) return;
  console.log(`\n${title}`);
  for (const r of rows)
    console.log(
      `  ${r.status.padEnd(9)}${columns(r)}${r.note ? `  — ${r.note}` : ''}`,
    );
}

async function runCheck() {
  const [slug] = slugs;
  if (!slug)
    fail(
      'Usage: pnpm figma:screen <slug> [--mode light|dark] [--url <storybook>]',
    );
  const spec = readSpec(slug);
  const mapFile = path.join(specsDir, `${slug}.map.json`);
  if (!existsSync(mapFile))
    fail(
      `No map at ${path.relative(process.cwd(), mapFile)}. Write one: the screen to open, its regions and its pieces (see the top of scripts/figma/screens.mjs).`,
    );
  const map = JSON.parse(readFileSync(mapFile, 'utf8'));
  const target = map.screen ?? {};
  if (!target.story && !target.url)
    fail(
      'The map needs "screen": { "story": "<story id>" } or { "url": "<page>" }.',
    );
  const [{ tree }] = screensIn(slug, spec);
  const frame = { w: tree.w, h: tree.h };
  const mode = flag('mode') ?? drawnMode(tree, map);
  const texts = textsOf(tree);

  const site = target.story
    ? await storybook({
        url: flag('url') ?? readConfig(REPO).storybookUrl,
        buildDir: path.join(PACKAGE, '.figma', 'storybook'),
        story: target.story,
      })
    : null;
  const outDir = path.join(PACKAGE, '.figma', 'screens', slug);
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const failures = [];
  const shots = [];
  let regionRows = [];
  try {
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      deviceScaleFactor: 1,
      colorScheme: mode === 'dark' ? 'dark' : 'light',
    });
    const page = await context.newPage();
    const open = async (width) => {
      await page.setViewportSize({ width, height: Math.round(frame.h) });
      if (site) await openStory(page, site.url, target.story, mode);
      else {
        await page.goto(target.url);
        await page.waitForLoadState('networkidle');
      }
    };

    for (const width of widthsFor(frame.w)) {
      await open(width);
      const file = path.join(outDir, `code-${width}.png`);
      await page.screenshot({ path: file, fullPage: true });
      shots.push({ width, file: path.basename(file) });
      const { scrolls, offenders } = await spill(page);
      if (scrolls || offenders.length) {
        failures.push(`spill at ${width}`);
        console.log(`\nAt ${width} wide, something spills sideways:`);
        for (const o of offenders) console.log(`  ${o}`);
        if (!offenders.length) console.log('  the page scrolls sideways');
      } else console.log(`At ${width} wide: nothing spills sideways.`);

      if (width === Math.round(frame.w)) {
        const { boxes, counts, styles } = await measure(page, map, texts);
        const pieces = checkPieces(
          piecesOf(tree),
          map.pieces,
          counts,
          libraryExports(),
        );
        table(
          'Pieces (Figma components → ours)',
          pieces,
          (r) =>
            `${r.name} ×${r.figma}${r.use ? ` → ${r.use}` : ''}${r.code !== undefined && r.code !== null ? ` (${r.code} on the page)` : ''}`,
        );
        const regions = checkRegions(tree, map.regions, boxes);
        regionRows = regions;
        table(
          `Regions at ${width} wide (within 8px)`,
          regions,
          (r) => `${r.layer} → ${r.selector}`,
        );
        const textRows = checkTexts(texts, styles);
        table(
          'Text (face, size, weight, colour)',
          textRows,
          (r) => `"${r.text}"`,
        );
        for (const r of [...pieces, ...regions, ...textRows])
          if (['FAIL', 'UNMAPPED', 'NEW'].includes(r.status))
            failures.push(r.layer ?? r.name);
      }
    }
  } finally {
    await browser.close();
    site?.close();
  }

  if (target.source) {
    const file = path.resolve(REPO, target.source);
    const hits = existsSync(file)
      ? fixedSizes(readFileSync(file, 'utf8'), frame, layerSizes(tree))
      : [];
    if (hits.length) {
      console.log(`\nSizes copied from the frame in ${target.source}:`);
      for (const h of hits)
        console.log(`  line ${h.line}: ${h.note}\n    ${h.text}`);
      failures.push('copied sizes');
    }
  }

  const baseline = path.join(PACKAGE, 'figma', 'baselines', `${slug}.png`);
  const figmaPicture = existsSync(baseline)
    ? path.relative(outDir, baseline)
    : null;
  const report = path.join(outDir, 'report.html');
  const atFrame = shots.find((x) => x.width === Math.round(frame.w));
  /* Each region cut from both pictures at full size: small details hide in a whole screen. */
  const crop = (src, imgWidth, box, h) =>
    `<div class="crop" style="width:${Math.round(box.w)}px;height:${h}px"><img src="${src}" width="${imgWidth}" style="margin:${-Math.round(box.y)}px 0 0 ${-Math.round(box.x)}px"></div>`;
  const regionCrops =
    figmaPicture && atFrame
      ? regionRows
          .filter((r) => r.figma && r.code)
          .map((r) => {
            const h = Math.min(900, Math.round(Math.max(r.figma.h, r.code.h)));
            return `<h2>${r.layer} <small>${r.status}${r.note ? `: ${r.note}` : ''}</small></h2><div>${crop(figmaPicture, Math.round(frame.w), r.figma, h)}${crop(atFrame.file, atFrame.width, r.code, h)}</div>`;
          })
          .join('')
      : '';
  writeFileSync(
    report,
    `<!doctype html><meta charset="utf-8"><title>${slug}</title>
<style>body{font:15px system-ui;margin:24px;background:#f6f6f6}div{display:flex;gap:24px;align-items:flex-start;overflow-x:auto}figure{margin:0}img{border:1px solid #ddd;background:#fff;display:block}figcaption{margin-bottom:6px;color:#555}.crop{overflow:hidden;flex:none;outline:1px solid #ddd}.crop img{border:0;max-width:none}h2{font-size:15px;margin:32px 0 8px}small{color:#555;font-weight:400}</style>
<h1>${slug}</h1><p>Figma frame ${Math.round(frame.w)}×${Math.round(frame.h)}, ${mode} mode. Each region: Figma on the left, code on the right, at full size. Name every difference you see; each one is fixed, or accepted in FIGMA.md.</p>
${regionCrops}
<h2>Whole screen</h2>
<div>${figmaPicture ? `<figure><figcaption>Figma</figcaption><img src="${figmaPicture}" width="${Math.round(frame.w)}"></figure>` : '<p>No Figma picture: export the frame at 1× to figma/baselines/' + slug + '.png</p>'}
${shots.map((x) => `<figure><figcaption>Code at ${x.width}</figcaption><img src="${x.file}" width="${x.width}"></figure>`).join('')}</div>`,
  );
  console.log(`\nPictures: ${path.relative(process.cwd(), report)}`);
  if (failures.length) {
    console.log(`\nNot done: ${failures.length} problem(s).\n`);
    process.exitCode = 1;
  } else
    console.log(
      '\nPieces, regions, text and widths all pass. Now go through the region pictures and name every difference.\n',
    );
}

if (command === 'health') runHealth();
else if (command === 'survey') runSurvey();
else if (command === 'check') await runCheck();
else
  fail('Usage: node scripts/figma/screens.mjs health|survey|check <slug>...');
