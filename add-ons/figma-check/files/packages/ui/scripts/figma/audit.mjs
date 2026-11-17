#!/usr/bin/env node
/*
 * The parity check: walks a saved Figma snapshot against the rendered story
 * and reports every layer, in light and dark. Exits 1 on any mismatch or any
 * layer the map doesn't account for.
 *
 *   pnpm figma:audit <slug> [--mode light|dark] [--url <storybook>] [--specs <dir>]
 *   pnpm figma:audit <slug> --layers     every layer path, to write the map from
 *   pnpm figma:audit <slug> --scaffold   a starting map, every layer listed
 *
 * Reads figma/specs/<slug>.json (from the extractor) and <slug>.map.json, which
 * names the story and gives every layer a CSS selector or a written reason to
 * skip it. "I checked" can't be checked; this table can.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  modeName,
  MODES,
  openStory,
  PACKAGE,
  storybook,
} from '../lib/storybook.mjs';
import {
  colorsToRgb,
  compareNode,
  cssVarsFor,
  familiesIn,
  flatten,
  orderRows,
  pickTree,
  positionRows,
  readConfig,
  resolveEntries,
  scaffoldMap,
  scopeWarnings,
  summarize,
  tokensIn,
  toRgb,
} from './lib.mjs';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const slug = args.find(
  (a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'),
);

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}
if (!slug)
  fail(
    'Usage: pnpm figma:audit <slug> [--mode light|dark] [--url <storybook url>] [--specs <dir>] [--config <figma.json>]\n       pnpm figma:audit <slug> --layers   (list every layer, to write the map)',
  );

const repoRoot = path.resolve(PACKAGE, '..', '..');
const config = readConfig(
  flag('config') ? path.dirname(path.resolve(flag('config'))) : repoRoot,
);
const specsDir = path.resolve(
  flag('specs') ?? path.join(PACKAGE, 'figma', 'specs'),
);

/* `--layers`: every layer path, to write the map from. Needs only the snapshot. */
if (args.includes('--layers')) {
  const file = path.join(specsDir, `${slug}.json`);
  if (!existsSync(file))
    fail(`No snapshot at ${path.relative(process.cwd(), file)}.`);
  const snapshot = JSON.parse(readFileSync(file, 'utf8'));
  const trees = [
    ...(snapshot.nodes ?? []).map((n, i) => [`nodes.${i}`, n.tree]),
    ...(snapshot.sets ?? []).map((s, i) => [`sets.${i}`, s.baseVariant?.tree]),
  ];
  for (const [ref, root] of trees) {
    console.log(`\n${ref}  (use "tree": "${ref}" in the map)`);
    for (const { path: p, node } of flatten(root)) {
      const text = node.text ? `  "${node.text.chars}"` : '';
      console.log(
        `  ${p}  ${node.type} ${node.w ?? '?'}×${node.h ?? '?'}${text}`,
      );
    }
  }
  console.log(
    `\nsaved ${snapshot._meta?.extractedAt ?? 'at an unknown time'} · ${snapshot.warnings?.length ?? 0} kind(s) of warning`,
  );
  console.log(
    'A layer inside one of these is "nodes.0/<path without root/>" as a map tree.',
  );
  process.exit(0);
}

/* `--scaffold`: a starting map with every layer listed, to fill in. */
if (args.includes('--scaffold')) {
  const file = path.join(specsDir, `${slug}.json`);
  if (!existsSync(file))
    fail(`No snapshot at ${path.relative(process.cwd(), file)}.`);
  const snapshot = JSON.parse(readFileSync(file, 'utf8'));
  const ref = flag('tree') ?? (snapshot.sets?.length ? 'sets.0' : 'nodes.0');
  const root = pickTree(snapshot, ref);
  if (!root) fail(`The snapshot has no tree at "${ref}".`);
  const draft = scaffoldMap(flatten(root), { story: flag('story'), tree: ref });
  const out = path.join(specsDir, `${slug}.map.json`);
  if (existsSync(out)) {
    console.log(JSON.stringify(draft, null, 2));
    console.log(
      `\n${path.relative(process.cwd(), out)} already exists; printed instead.`,
    );
  } else {
    writeFileSync(out, `${JSON.stringify(draft, null, 2)}\n`);
    console.log(
      `Wrote ${path.relative(process.cwd(), out)}: ${Object.keys(draft.nodes).length} layers to give a selector or a reason.`,
    );
  }
  process.exit(0);
}

const mapPath = path.join(specsDir, `${slug}.map.json`);
if (!existsSync(mapPath))
  fail(
    `No map at ${path.relative(process.cwd(), mapPath)}. Make one:\n` +
      JSON.stringify(
        {
          story: 'components-atoms-button--primary',
          tree: 'set',
          nodes: {
            root: 'button',
            'root/Label': { skip: 'the text sits in the button itself' },
          },
        },
        null,
        2,
      ),
  );
const map = JSON.parse(readFileSync(mapPath, 'utf8'));
const specPath = path.join(specsDir, `${map.spec ?? slug}.json`);
if (!existsSync(specPath))
  fail(
    `No snapshot at ${path.relative(process.cwd(), specPath)}. Run the extractor first.`,
  );
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const tree = pickTree(spec, map.tree);
if (!tree) fail(`The snapshot has no tree at "${map.tree}".`);
const modes = flag('mode') ? [modeName(flag('mode'))] : MODES;

/* The base variant, then each variant the map points at a story. */
const runs = [{ name: null, story: map.story, tree }];
for (const [name, story] of Object.entries(map.variants ?? {})) {
  const variantTree = pickTree(spec, map.tree, name);
  if (!variantTree)
    fail(`The snapshot's set has no variant "${name}" (map.variants).`);
  runs.push({ name, story, tree: variantTree });
}

const site = await storybook({
  url: flag('url') ?? config.storybookUrl,
  buildDir: path.join(PACKAGE, '.figma', 'storybook'),
  story: runs.map((r) => r.story),
});
const browser = await chromium.launch();
let bad = 0;

try {
  const context = await browser.newContext({
    viewport: map.viewport ?? { width: 1024, height: 768 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();

  for (const run of runs)
    for (const mode of modes) {
      const flat = flatten(run.tree);
      await openStory(page, site.url, run.story, mode);
      /* Figma draws the resting state, so drop any focus a play function left,
       * and read every colour as sRGB (the page may hand back oklch). */
      await page.mouse.move(0, 0);
      await page.evaluate(() => document.activeElement?.blur?.());

      /* Which Figma fonts this page really has: a family it lacks draws in the
       * fallback, so its width matches the fallback's in two different ones. */
      const fontsMissing = await page.evaluate(
        (families) => {
          const ctx = document.createElement('canvas').getContext('2d');
          const width = (font) => {
            ctx.font = `40px ${font}`;
            return ctx.measureText('mmmmmmmmmmlli1WQ@').width;
          };
          return families.filter(
            (f) =>
              width(`"${f}", monospace`) === width('monospace') &&
              width(`"${f}", serif`) === width('serif'),
          );
        },
        [...familiesIn(run.tree)],
      );

      /* Resolved in the page, so a token and a computed colour go through the
       * same engine. A variable that isn't defined is "not found", whatever
       * colour it would have produced. */
      const tokenValues = await page.evaluate(
        (pairs) => {
          const root = getComputedStyle(document.documentElement);
          const probe = document.createElement('span');
          document.body.append(probe);
          const out = {};
          for (const [token, vars] of pairs) {
            const name = vars.find(
              (v) => root.getPropertyValue(v).trim() !== '',
            );
            if (!name) continue;
            probe.style.color = `var(${name})`;
            out[token] = getComputedStyle(probe).color;
          }
          probe.remove();
          return out;
        },
        tokensIn(flat).map((t) => [t, cssVarsFor(t, config.tokens)]),
      );

      for (const token of Object.keys(tokenValues))
        tokenValues[token] = toRgb(tokenValues[token]) ?? tokenValues[token];

      const rows = [];
      const boxes = {};
      const selectors = {};
      const entries = resolveEntries(flat, map.nodes, (other) =>
        existsSync(
          path.join(
            specsDir,
            other.endsWith('.json') ? other : `${other}.map.json`,
          ),
        ),
      );
      let covered = 0;
      for (const { path: nodePath, node, parent } of flat) {
        const entry = entries.get(nodePath);
        if (entry.status === 'covered') {
          covered += 1;
          continue;
        }
        if (entry.status !== 'check') {
          rows.push({
            path: nodePath,
            group: 'presence',
            prop: 'layer',
            expected: `${node.type} ${node.w}×${node.h}`,
            actual: entry.reason,
            status: entry.status,
          });
          continue;
        }
        const { selector } = entry;
        selectors[nodePath] = selector;
        const got = await page.evaluate((sel) => {
          const scope = document.querySelector('#storybook-root') ?? document;
          const el = scope.querySelector(sel) ?? document.querySelector(sel);
          if (!el) return null;
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          const sides = ['Top', 'Right', 'Bottom', 'Left'];
          const corners = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'];
          const round = (v) => Math.round(Number.parseFloat(v) * 100) / 100;
          return {
            tag: el.tagName.toLowerCase(),
            x: round(r.x),
            y: round(r.y),
            w: Math.round(r.width),
            h: Math.round(r.height),
            padding: sides.map((s) =>
              Math.round(Number.parseFloat(cs[`padding${s}`])),
            ),
            rowGap: cs.rowGap,
            columnGap: cs.columnGap,
            opacity: Number.parseFloat(cs.opacity),
            backgroundColor: cs.backgroundColor,
            backgroundImage: cs.backgroundImage,
            borderWidths: sides.map((s) => round(cs[`border${s}Width`])),
            borderColors: sides.map((s) => cs[`border${s}Color`]),
            radii: corners.map((c) => round(cs[`border${c}Radius`])),
            boxShadow: cs.boxShadow,
            textShadow: cs.textShadow,
            textBoxTrim: cs.textBoxTrim ?? cs.getPropertyValue('text-box-trim'),
            fontFamily: cs.fontFamily,
            filter: cs.filter,
            backdropFilter: cs.backdropFilter,
            color: cs.color,
            fontSize: round(cs.fontSize),
            fontWeight: Number.parseInt(cs.fontWeight, 10),
            lineHeight: cs.lineHeight,
            letterSpacing: cs.letterSpacing,
            textTransform: cs.textTransform,
            typeClasses: [...el.classList].filter((c) => c.startsWith('type-')),
          };
        }, selector);
        if (!got) {
          rows.push({
            path: nodePath,
            group: 'presence',
            prop: 'layer',
            expected: selector,
            actual: 'nothing matches',
            status: 'FAIL',
          });
          continue;
        }
        got.backgroundColor = toRgb(got.backgroundColor) ?? got.backgroundColor;
        got.color = toRgb(got.color) ?? got.color;
        got.borderColors = got.borderColors.map((c) => toRgb(c) ?? c);
        got.boxShadow = colorsToRgb(got.boxShadow);
        got.textShadow = colorsToRgb(got.textShadow);
        boxes[nodePath] = got;
        rows.push(
          ...compareNode(
            nodePath,
            node,
            got,
            {
              tokenValues,
              textStyles: config.textStyles,
              mode: mode.toLowerCase(),
              drawnIn: map.drawnIn ?? 'light',
              realFonts: map.realFonts === true,
              fontsMissing,
              figmaTokens: spec.tokens,
              sharesParent: Boolean(parent) && selectors[parent] === selector,
            },
            entry.excused,
          ),
        );
      }
      rows.push(...orderRows(flat, boxes));
      rows.push(
        ...positionRows(flat, boxes, selectors, {
          realFonts: map.realFonts === true,
          fontsMissing,
        }),
      );
      rows.sort(
        (a, b) =>
          flat.findIndex((f) => f.path === a.path) -
          flat.findIndex((f) => f.path === b.path),
      );

      report(rows, mode, run, covered, fontsMissing);
      bad += summarize(rows).bad;
    }
} finally {
  await browser.close();
  site.close();
}

function report(rows, mode, run, covered, fontsMissing) {
  const cut = (s, n) =>
    String(s ?? '')
      .padEnd(n)
      .slice(0, n);
  console.log(
    `\n${slug}${run.name ? ` · ${run.name}` : ''} → ${run.story}  (${mode})`,
  );
  if (fontsMissing.length)
    console.log(
      `fonts: ${fontsMissing.join(', ')} not on this page; sizes set by them are skipped until it is`,
    );
  console.log(
    `snapshot: ${spec._meta?.fileName ?? 'unknown file'}, saved ${spec._meta?.extractedAt ?? 'at an unknown time'}\n`,
  );
  let last = null;
  for (const r of rows) {
    if (r.path !== last) {
      console.log(`  ${r.path}`);
      last = r.path;
    }
    const mark = r.status === 'ok' ? '·' : r.status === 'SKIP' ? '–' : '✗';
    console.log(
      `    ${mark} ${cut(r.group, 9)} ${cut(r.prop, 15)} ${cut(r.expected, 36)} ${cut(r.actual, 60)} ${r.status === 'ok' ? '' : r.status}`,
    );
  }
  const c = summarize(rows);
  console.log(
    `\n  ${c.ok} match · ${c.FAIL} differ · ${c.UNACCOUNTED} unaccounted · ${c.SKIP} skipped${covered ? ` (+${covered} inside skipped layers)` : ''}`,
  );
}

const warnings = scopeWarnings(spec.warnings, flatten(tree));
if (warnings.length) {
  console.log(
    `\n  Extractor warnings in this tree, one decision per kind in FIGMA.md:`,
  );
  for (const w of warnings)
    console.log(`    ! ${w.kind} ×${w.count}: ${w.message}`);
}

if (bad > 0) {
  console.error(`\n✗ ${bad} row(s) to resolve. The port isn't done.\n`);
  process.exit(1);
}
console.log('\n✓ Every layer is accounted for and matches.\n');
