#!/usr/bin/env node
/*
 * Puts a story beside its Figma picture: figma | code | differences.
 *
 *   pnpm figma:compare <story-id> [--mode light|dark] [--baseline <png or base64 file>]
 *                     [--selector "#storybook-root > *"] [--viewport 1024x768] [--url <storybook>]
 *                     [--pad]
 *
 * The Figma picture lives in figma/baselines/<story-id>.<mode>.png (committed:
 * it is the reference). `--baseline` copies a new one in first, from a PNG or
 * from the base64 text the extractor's export returns.
 *
 * Different sizes fail before any pixels are compared: a 32px control against a
 * 36px design is the mistake this exists to catch, and scaling would hide it.
 * When the difference is explained (a button that fills its row, a glow that
 * draws past its box), `--pad` centres both on one canvas instead. The page
 * size comes from the map whose story this is (`viewport`), else 1024×768.
 * Everything else is a picture for a person or Claude to read, not a pass or
 * fail: a share of differing pixels can't tell wrong padding from a stand-in font.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { modeName, openStory, PACKAGE, storybook } from '../lib/storybook.mjs';
import { hotRegions, normColor, readConfig, toRgb } from './lib.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const storyId = args.find(
  (a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'),
);

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}
if (!storyId)
  fail(
    'Usage: pnpm figma:compare <story-id> [--mode light|dark] [--baseline <png or base64 file>]',
  );

const mode = modeName(flag('mode', 'light'));
/* The map that opens this story knows the page size the design was drawn at. */
function mapViewport() {
  const dir = path.join(PACKAGE, 'figma', 'specs');
  if (!existsSync(dir)) return null;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.map.json'))) {
    try {
      const map = JSON.parse(readFileSync(path.join(dir, file), 'utf8'));
      const stories = [map.story, ...Object.values(map.variants ?? {})];
      if (stories.includes(storyId) && map.viewport) return map.viewport;
    } catch {
      /* not a map */
    }
  }
  return null;
}
const fromMap = mapViewport();
const [vw, vh] = flag('viewport')
  ? flag('viewport').split('x').map(Number)
  : [fromMap?.width ?? 1024, fromMap?.height ?? 768];
const pad = args.includes('--pad');
const selector = flag('selector', '#storybook-root > *');
const baselineDir = path.join(PACKAGE, 'figma', 'baselines');
const outputDir = path.join(PACKAGE, '.figma', 'compare');
const baseline = path.join(baselineDir, `${storyId}.${mode.toLowerCase()}.png`);

const incoming = flag('baseline');
if (incoming) {
  /* pnpm --filter runs this inside packages/ui; a path typed at the repo root resolves from there. */
  const raw = readFileSync(
    path.resolve(process.env.INIT_CWD ?? process.cwd(), incoming),
  );
  const isPng = raw.subarray(0, 4).toString('hex') === '89504e47';
  const bytes = isPng
    ? raw
    : Buffer.from(
        raw
          .toString('utf8')
          .replace(/^data:image\/png;base64,/, '')
          .trim(),
        'base64',
      );
  mkdirSync(baselineDir, { recursive: true });
  writeFileSync(baseline, bytes);
  console.log(
    `Saved the Figma picture as ${path.relative(process.cwd(), baseline)}.`,
  );
}
if (!existsSync(baseline))
  fail(
    `No Figma picture at ${path.relative(process.cwd(), baseline)}.\n` +
      'Export the node at scale 1 (see the figma-check skill), then pass it with --baseline.',
  );

/* Centres a picture on a canvas of the page colour. */
function padTo(png, width, height, ground) {
  const out = new PNG({ width, height });
  for (let i = 0; i < out.data.length; i += 4)
    out.data.set([...ground, 255], i);
  PNG.bitblt(
    png,
    out,
    0,
    0,
    png.width,
    png.height,
    Math.floor((width - png.width) / 2),
    Math.floor((height - png.height) / 2),
  );
  return out;
}

function contactSheet(panels, gutter = 16, ground = [128, 128, 128]) {
  const width =
    panels.reduce((sum, p) => sum + p.width, 0) + gutter * (panels.length + 1);
  const height = Math.max(...panels.map((p) => p.height)) + gutter * 2;
  const sheet = new PNG({ width, height });
  for (let i = 0; i < sheet.data.length; i += 4) {
    sheet.data.set([...ground, 255], i);
  }
  let x = gutter;
  for (const panel of panels) {
    PNG.bitblt(panel, sheet, 0, 0, panel.width, panel.height, x, gutter);
    x += panel.width + gutter;
  }
  return sheet;
}

/* Figma exports a layer with no background as transparent, while the browser
 * paints over the page. Flatten the export over the same page colour first, or
 * every translucent pixel reads as a difference. */
function flattenOver(png, [r, g, b]) {
  for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i + 3] / 255;
    png.data[i] = Math.round(png.data[i] * a + r * (1 - a));
    png.data[i + 1] = Math.round(png.data[i + 1] * a + g * (1 - a));
    png.data[i + 2] = Math.round(png.data[i + 2] * a + b * (1 - a));
    png.data[i + 3] = 255;
  }
}

const config = readConfig(path.resolve(PACKAGE, '..', '..'));
const site = await storybook({
  url: flag('url', config.storybookUrl),
  buildDir: path.join(PACKAGE, '.figma', 'storybook'),
  story: storyId,
});
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: vw, height: vh },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await openStory(page, site.url, storyId, mode);
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.activeElement?.blur?.());
  const target = page.locator(selector).first();
  if ((await target.count()) === 0)
    fail(`Nothing matches "${selector}" in ${storyId}.`);

  mkdirSync(outputDir, { recursive: true });
  const stem = path.join(outputDir, `${storyId}.${mode.toLowerCase()}`);
  await target.screenshot({ path: `${stem}.code.png` });
  const body = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  const ground = (normColor(toRgb(body) ?? body) ?? '255,255,255,1')
    .split(',')
    .slice(0, 3)
    .map(Number);
  const ground3 =
    ground.length === 3 && ground.every((n) => !Number.isNaN(n))
      ? ground
      : [255, 255, 255];

  let figma = PNG.sync.read(readFileSync(baseline));
  let code = PNG.sync.read(readFileSync(`${stem}.code.png`));
  flattenOver(figma, ground3);
  const sizes = `figma ${figma.width}×${figma.height}, code ${code.width}×${code.height}`;

  if (pad && (figma.width !== code.width || figma.height !== code.height)) {
    const w = Math.max(figma.width, code.width);
    const h = Math.max(figma.height, code.height);
    figma = padTo(figma, w, h, ground3);
    code = padTo(code, w, h, ground3);
    console.log(`Padded both to ${w}×${h} (${sizes}), centred.`);
  }

  if (figma.width !== code.width || figma.height !== code.height) {
    writeFileSync(
      `${stem}.compare.png`,
      PNG.sync.write(contactSheet([figma, code])),
    );
    fail(
      `Different sizes for ${storyId} (${mode}):\n` +
        `  figma  ${figma.width}×${figma.height}\n` +
        `  code   ${code.width}×${code.height}\n\n` +
        'Fix the size first. If the Figma picture was exported at 2×, export it again at 1×.\n' +
        'If the difference is explained (it fills its row, a glow draws past its box), add --pad.\n' +
        `Side by side, without a difference map: ${path.relative(process.cwd(), `${stem}.compare.png`)}`,
    );
  }

  const diff = new PNG({ width: figma.width, height: figma.height });
  const differing = pixelmatch(
    figma.data,
    code.data,
    diff.data,
    figma.width,
    figma.height,
    {
      threshold: 0.1,
      diffColor: [255, 0, 128],
    },
  );
  writeFileSync(
    `${stem}.compare.png`,
    PNG.sync.write(contactSheet([figma, code, diff])),
  );
  const share = (differing / (figma.width * figma.height)) * 100;
  console.log(
    `\n${storyId} (${mode}): compared at ${figma.width}×${figma.height}, page ${vw}×${vh}`,
  );
  console.log(
    `  ${share.toFixed(2)}% of pixels differ (for reading, not a pass or fail)`,
  );
  /* Where to look first: a skipped or faked effect shows up as a dense patch. */
  const hot = hotRegions(diff, [255, 0, 128]);
  if (hot.length) {
    console.log('  look here first (most different areas):');
    for (const r of hot)
      console.log(`    ${r.x},${r.y} ${r.w}×${r.h}: ${r.share}% differ`);
  }
  console.log(
    `  picture: ${path.relative(process.cwd(), `${stem}.compare.png`)}   figma | code | differences\n`,
  );
} finally {
  await browser.close();
  site.close();
}
