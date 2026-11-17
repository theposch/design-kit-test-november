// pnpm design:vqa <canvas folder> — render every artboard of a Claude Design canvas on this computer, photograph it
// and check it for the visual errors that are easy to miss: pictures that don't load, components that don't exist,
// text that runs off the frame, doesn't fit its box or sits on top of other text.
//
// The canvas folder is the one Claude publishes from: it holds project/canvas.json and the project/*.dc.html
// artboards, plus assets.json, a map of each uploaded picture's /_blob/ url to its file on this computer. The design
// system's files come from .claude-design/project/ (run `pnpm design:build` first).
//
// Writes <folder>/vqa/<artboard>.png and prints what it found. Exits 1 if anything needs fixing.
//
// pnpm design:vqa --png <file.svg> — turns an SVG with pictures inside into a PNG beside it. The canvas strips
// embedded pictures from an uploaded SVG, so those go up as PNGs.

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../..');
const designSystem = path.join(repoRoot, '.claude-design/project');

if (process.argv[2] === '--png') {
  const svg =
    process.argv[3] &&
    path.resolve(process.env.INIT_CWD ?? process.cwd(), process.argv[3]);
  if (!svg || !existsSync(svg)) {
    console.error('Usage: pnpm design:vqa --png <file.svg>');
    process.exit(2);
  }
  const text = readFileSync(svg, 'utf8');
  const tag = /<svg\b[^>]*>/i.exec(text)?.[0] ?? '';
  const attr = (n) =>
    Number.parseFloat(new RegExp(`\\b${n}="([\\d.]+)`).exec(tag)?.[1]);
  const viewBox =
    /viewBox="[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)"/.exec(tag);
  const w = Math.ceil(attr('width') || Number(viewBox?.[1]) || 512);
  const h = Math.ceil(attr('height') || Number(viewBox?.[2]) || 512);
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: w, height: h },
    deviceScaleFactor: 2,
  });
  await page.goto(`file://${svg}`);
  await page.waitForLoadState('load');
  const out = svg.replace(/\.svg$/i, '.png');
  await page.screenshot({ path: out, omitBackground: true });
  await browser.close();
  console.log(
    `Wrote ${path.relative(process.cwd(), out)} (${w}×${h} at 2×). Upload that instead.`,
  );
  process.exit(0);
}

const folder =
  process.argv[2] &&
  path.resolve(process.env.INIT_CWD ?? process.cwd(), process.argv[2]);
if (!folder || !existsSync(path.join(folder, 'project/canvas.json'))) {
  console.error(
    'Usage: pnpm design:vqa <canvas folder>   (the folder that holds project/canvas.json)',
  );
  process.exit(2);
}
if (!existsSync(path.join(designSystem, 'components/bundle.js'))) {
  console.error('No design system build found. Run `pnpm design:build` first.');
  process.exit(2);
}

const canvas = JSON.parse(
  readFileSync(path.join(folder, 'project/canvas.json'), 'utf8'),
);
const assetsFile = path.join(folder, 'assets.json');
const assets = existsSync(assetsFile)
  ? JSON.parse(readFileSync(assetsFile, 'utf8'))
  : {};
const outDir = path.join(folder, 'vqa');
mkdirSync(outDir, { recursive: true });

const REACT =
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js';
const REACT_DOM =
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js';
const ORIGIN = 'http://vqa.local';

const TYPES = {
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function harness(source) {
  const head = source.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const tags = [...head.matchAll(/<(link|script)\b[^>]*>(?:<\/script>)?/gi)]
    .map((m) => m[0])
    .filter((tag) => !/support\.js/.test(tag));
  const body = source.match(/<x-dc>([\s\S]*)<\/x-dc>/i)?.[1] ?? '';
  const logic =
    source.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/i)?.[1] ??
    '';
  return `<!doctype html><html><head><meta charset="utf-8">
<script src="${REACT}"></script><script src="${REACT_DOM}"></script>
${tags.join('\n')}
<style>body{margin:0}</style></head><body>
<template id="dc">${body}</template>
<script type="text/plain" id="logic">${logic.replace(/<\/script/gi, '<\\/script')}</script>
<div id="root"></div>
<script>${renderer.toString()}; renderer();</script>
</body></html>`;
}

/* Runs in the page: turns the artboard markup into React elements, mounting x-import from window globals. */
function renderer() {
  const { React, ReactDOM } = window;
  class DCLogic {
    constructor(props) {
      this.props = props || {};
      this.state = {};
    }
    setState(next) {
      Object.assign(
        this.state,
        typeof next === 'function' ? next(this.state) : next,
      );
    }
    forceUpdate() {}
  }
  const Component = new Function(
    'DCLogic',
    document.getElementById('logic').textContent + '\nreturn Component;',
  )(DCLogic);
  const vals = new Component({}).renderVals() || {};
  /* A loop's item (`<sc-for as="s">` → `s.label`) is looked up before the values. */
  const lookup = (p, scope = {}) => {
    const [first, ...rest] = p.trim().split('.');
    const start = first in scope ? scope[first] : vals[first];
    return rest.reduce((o, k) => (o == null ? o : o[k]), start);
  };
  const HOLE = /^\{\{\s*([^}]+?)\s*\}\}$/;
  const interp = (s, scope) =>
    s.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, p) => {
      const v = lookup(p, scope);
      return v == null ? '' : String(v);
    });
  const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const styleObject = (s) =>
    Object.fromEntries(
      s
        .split(';')
        .map((d) => d.trim())
        .filter(Boolean)
        .map((d) => {
          const i = d.indexOf(':');
          const k = d.slice(0, i).trim();
          return [k.startsWith('--') ? k : camel(k), d.slice(i + 1).trim()];
        }),
    );
  const missing = [];
  const unsupported = new Set();

  const kids = (node, scope) =>
    [...node.childNodes]
      .map((child, i) => convert(child, i, scope))
      .filter((c) => c !== null);

  function convert(node, key, scope = {}) {
    if (node.nodeType === 3) {
      const text = node.textContent.replace(/\s+/g, ' ');
      return text.trim() ? interp(text, scope) : null;
    }
    if (node.nodeType !== 1) return null;
    const tag = node.tagName.toLowerCase();
    if (tag === 'helmet') return null;
    if (tag === 'sc-for') {
      const hole = (node.getAttribute('list') ?? '').match(HOLE);
      const list = hole ? lookup(hole[1], scope) : null;
      const as = node.getAttribute('as') ?? 'item';
      return React.createElement(
        React.Fragment,
        { key },
        ...(Array.isArray(list) ? list : []).map((item, i) =>
          React.createElement(
            React.Fragment,
            { key: i },
            ...kids(node, { ...scope, [as]: item }),
          ),
        ),
      );
    }
    if (tag.startsWith('sc-') || tag === 'dc-import') unsupported.add(tag);
    let type = tag;
    const props = { key };
    if (tag === 'x-import') {
      const name = node.getAttribute('component-from-global-scope');
      type = name.split('.').reduce((o, k) => (o == null ? o : o[k]), window);
      if (!type) {
        missing.push(name);
        type = 'div';
        props['data-vqa-missing'] = name;
      }
    }
    for (const attr of node.attributes) {
      if (attr.name === 'component-from-global-scope') continue;
      const hole = attr.value.match(HOLE);
      const value = hole ? lookup(hole[1], scope) : interp(attr.value, scope);
      let name = attr.name;
      if (name === 'class' || name === 'class-name') name = 'className';
      else if (name === 'for') name = 'htmlFor';
      else if (name === 'style') {
        props.style = styleObject(value);
        continue;
      } else if (!name.startsWith('aria-') && !name.startsWith('data-'))
        name = camel(name);
      props[name] = value;
    }
    return React.createElement(type, props, ...kids(node, scope));
  }

  const content = document.getElementById('dc').content;
  const elements = kids(content, {});
  ReactDOM.createRoot(document.getElementById('root')).render(
    React.createElement(React.Fragment, null, ...elements),
  );
  window.__vqa = { missing, unsupported: [...unsupported] };
}

/* Runs in the page once it has settled: the automatic checks. */
function inspect() {
  const issues = [];
  const board = document.getElementById('root').firstElementChild;
  if (!board)
    return [{ kind: 'empty', detail: 'the artboard rendered nothing' }];
  const frame = board.getBoundingClientRect();
  const label = (el) => {
    const text = (
      el.innerText ||
      el.getAttribute('alt') ||
      el.getAttribute('aria-label') ||
      ''
    ).trim();
    return `<${el.tagName.toLowerCase()}> "${text.replace(/\s+/g, ' ').slice(0, 40)}"`;
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    return (
      s.visibility !== 'hidden' &&
      s.display !== 'none' &&
      Number(s.opacity) > 0.05
    );
  };

  for (const name of window.__vqa.missing)
    issues.push({ kind: 'missing component', detail: name });
  for (const tag of window.__vqa.unsupported)
    issues.push({
      kind: 'not checked',
      detail: `<${tag}> isn't rendered by this check; look at it on the canvas`,
    });

  for (const img of board.querySelectorAll('img')) {
    if (!img.complete || img.naturalWidth === 0)
      issues.push({ kind: 'broken picture', detail: label(img) });
  }

  const leaves = [...board.querySelectorAll('*')].filter(
    (el) =>
      visible(el) &&
      [...el.childNodes].some(
        (n) => n.nodeType === 3 && n.textContent.trim(),
      ) &&
      el.getBoundingClientRect().width > 0,
  );
  const textBox = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const t = range.getBoundingClientRect();
    const e = el.getBoundingClientRect();
    const top = Math.max(t.top, e.top);
    const bottom = Math.min(t.bottom, e.bottom);
    return {
      left: t.left,
      right: t.right,
      top,
      bottom,
      width: t.width,
      height: Math.max(0, bottom - top),
    };
  };
  const floating = (el) => Boolean(el.closest('nav, [role="navigation"]'));

  const known = new Set();
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    const walk = (list) => {
      for (const rule of list) {
        if (rule.selectorText)
          for (const m of rule.selectorText.matchAll(/\.((?:\\.|[\w-])+)/g))
            known.add(m[1].replace(/\\(.)/g, '$1'));
        if (rule.cssRules) walk(rule.cssRules);
      }
    };
    walk(rules);
  }
  const unknown = new Set();
  for (const el of [board, ...board.querySelectorAll('[class]')])
    for (const name of el.classList)
      if (!known.has(name) && !name.startsWith('lucide')) unknown.add(name);
  if (unknown.size)
    issues.push({
      kind: 'style not in the stylesheet (does nothing)',
      detail: `${[...unknown].join(', ')}: use a class the library has, or inline style with its tokens`,
    });

  const scrolls = (el) => {
    for (let a = el.parentElement; a && a !== board; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (/auto|scroll/.test(s.overflowX + s.overflowY)) return true;
    }
    return false;
  };
  const drawnBox = (el) => {
    for (let a = el.parentElement; a && a !== board; a = a.parentElement) {
      const s = getComputedStyle(a);
      const filled =
        !/rgba\(0, 0, 0, 0\)|transparent/.test(s.backgroundColor) ||
        s.backgroundImage !== 'none';
      if (filled || parseFloat(s.borderTopWidth) > 0 || s.boxShadow !== 'none')
        return a;
    }
    return null;
  };

  for (const el of leaves) {
    const r = textBox(el);
    const off =
      r.left < frame.left - 1 ||
      r.right > frame.right + 1 ||
      r.top < frame.top - 1 ||
      r.bottom > frame.bottom + 1;
    if (off && !scrolls(el))
      issues.push({ kind: 'text off the frame', detail: label(el) });
    if (!off && r.width > 0) {
      const top = document.elementFromPoint(
        r.left + r.width / 2,
        r.top + r.height / 2,
      );
      if (
        top &&
        !el.contains(top) &&
        !top.contains(el) &&
        !(floating(top) && !floating(el))
      )
        issues.push({
          kind: 'text hidden behind something',
          detail: `${label(el)} is under ${label(top).slice(0, 40)}`,
        });
    }
    const box = drawnBox(el);
    if (box) {
      const b = box.getBoundingClientRect();
      if (
        r.left < b.left - 1 ||
        r.right > b.right + 1 ||
        r.top < b.top - 1 ||
        r.bottom > b.bottom + 1
      )
        issues.push({
          kind: 'text spills out of its box',
          detail: `${label(el)} sticks out of ${label(box).slice(0, 30)}`,
        });
    }
    if (
      el.scrollWidth > el.clientWidth + 1 &&
      getComputedStyle(el).overflowX !== 'visible'
    )
      issues.push({ kind: 'text cut off', detail: label(el) });
  }

  for (let i = 0; i < leaves.length; i++) {
    for (let j = i + 1; j < leaves.length; j++) {
      const a = leaves[i];
      const b = leaves[j];
      if (a.contains(b) || b.contains(a)) continue;
      const ra = textBox(a);
      const rb = textBox(b);
      const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (w > 2 && h > 2)
        issues.push({
          kind: 'text overlaps',
          detail: `${label(a)} and ${label(b)}`,
        });
    }
  }

  const empties = [...board.querySelectorAll('nav, a, button')].filter(
    (el) => visible(el) && el.getBoundingClientRect().width < 2,
  );
  for (const el of empties)
    issues.push({ kind: 'collapsed', detail: `${label(el)} has no width` });
  return issues;
}

/* An uploaded SVG loses any picture inside it; the canvas shows it empty. */
const strippedSvgs = Object.entries(assets).filter(
  ([, local]) =>
    /\.svg$/i.test(local) &&
    existsSync(local) &&
    /<image\b/i.test(readFileSync(local, 'utf8')),
);
for (const [url, local] of strippedSvgs)
  console.log(
    `\n✗ ${url} is an SVG with pictures inside (${path.relative(process.cwd(), local)}). The canvas strips them: run pnpm design:vqa --png on it and upload the PNG.`,
  );

const browser = await chromium.launch();
let failing = strippedSvgs.length;
const shots = [];
for (const name of canvas.order ?? Object.keys(canvas.boards)) {
  const box = canvas.boards[name];
  const file = path.join(folder, 'project', name);
  if (!existsSync(file)) continue;
  const page = await browser.newPage({
    viewport: { width: box.w, height: box.h },
    deviceScaleFactor: 2,
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(`${ORIGIN}/**`, (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === `/${name}`)
      return route.fulfill({
        contentType: 'text/html',
        body: harness(readFileSync(file, 'utf8')),
      });
    if (url.pathname.startsWith('/_blob/')) {
      const local = assets[url.pathname];
      return local && existsSync(local)
        ? route.fulfill({
            path: local,
            contentType: TYPES[path.extname(local)],
          })
        : route.fulfill({ status: 404 });
    }
    const ds = url.pathname.match(/^\/ds\/[^/]+\/(.+)$/);
    const local = ds
      ? path.join(designSystem, ds[1])
      : path.join(folder, 'project', url.pathname);
    return existsSync(local)
      ? route.fulfill({ path: local, contentType: TYPES[path.extname(local)] })
      : route.fulfill({ status: 404 });
  });
  await page.goto(`${ORIGIN}/${name}`);
  await page
    .waitForFunction(() => window.__vqa, null, { timeout: 15000 })
    .catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  const issues = errors.map((e) => ({ kind: 'script error', detail: e }));
  if (await page.evaluate(() => Boolean(window.__vqa)))
    issues.push(...(await page.evaluate(inspect)));
  else issues.push({ kind: 'empty', detail: 'the artboard never rendered' });
  const shot = path.join(outDir, name.replace(/\.dc\.html$/, '.png'));
  await page.screenshot({ path: shot });
  await page.close();

  shots.push({
    title: box.title || name,
    file: shot,
    w: box.w,
    h: box.h,
    ok: issues.length === 0,
  });
  const title = box.title ? `${box.title} (${name})` : name;
  if (issues.length) failing++;
  console.log(
    `\n${issues.length ? '✗' : '✓'} ${title}  →  ${path.relative(process.cwd(), shot)}`,
  );
  for (const issue of issues) console.log(`    ${issue.kind}: ${issue.detail}`);
}
if (shots.length) {
  const scale = Math.min(1, 900 / Math.max(...shots.map((s) => s.h)));
  const tiles = shots
    .map(
      (s) =>
        `<figure style="margin:0;display:flex;flex-direction:column;gap:8px"><figcaption style="font:600 14px system-ui;color:${s.ok ? '#ddd' : '#ff8a80'}">${s.ok ? '' : '✗ '}${s.title.replace(/</g, '&lt;')}</figcaption><img style="width:${Math.round(s.w * scale)}px;height:${Math.round(s.h * scale)}px" src="data:image/png;base64,${readFileSync(s.file).toString('base64')}"></figure>`,
    )
    .join('');
  const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
  await page.setContent(
    `<body style="margin:0;padding:24px;background:#2a2a2a;display:inline-flex;gap:24px">${tiles}</body>`,
  );
  await page.waitForLoadState('load');
  await page.screenshot({ path: path.join(outDir, 'all.png'), fullPage: true });
  await page.close();
  console.log(
    `\nAll artboards side by side: ${path.relative(process.cwd(), path.join(outDir, 'all.png'))}`,
  );
}
await browser.close();
console.log(
  failing
    ? `\n${failing} artboard(s) need fixing. Look at every picture too: this check can't see everything.`
    : "\nNo automatic problems. Now look at every picture: this check can't see everything.",
);
process.exit(failing ? 1 : 0);
