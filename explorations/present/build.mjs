// Builds the prototype viewer into dist/: Marcus Brown's template (marcus/,
// kept as he wrote it) with his sample app taken out and a live prototype
// put in its place (live/). The prototypes are every sibling exploration
// with a prototype.json, listed into js/catalog.js at build time.

import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const marcus = path.join(here, 'marcus');
const live = path.join(here, 'live');
const dist = path.join(here, 'dist');
const require = createRequire(import.meta.url);

// Inline scripts that drive Marcus's sample app, known by their first line.
const SAMPLE_APP_SCRIPTS = [
  'the loader step',
  'a-read progress',
  'gallery: drag sideways',
  'on its side: the landscape layout',
  "the list's entrance",
  'UX Design - Modes',
  'Desktop screens on a phone',
  'desktop gallery',
];
// His set picker counts on there being at least one set: left out while the project has no prototype.
const NEEDS_A_PROTOTYPE = ['design sets, bottom left'];
// Marcus's script files: kept, replaced by ours, or left out with the sample app.
const SCRIPTS = {
  'js/sets.js': 'js/sets.js',
  'js/articles.js': null,
  'js/app.js': ['js/frame.js', 'js/choices.js', 'js/live.js', 'js/comments.js', 'js/shell/index.js'],
  // (live.js loads guides.js itself, once the labels added in the viewer are in)
  'js/guides.js': null,
  'js/pointer.js': 'js/pointer.js',
  'js/rotate.js': 'js/rotate.js',
  'js/components.js': null,
};

export function readPrototypes(explorations) {
  return readdirSync(explorations, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(explorations, d.name, 'prototype.json'))
    .filter((file) => existsSync(file))
    .map((file) => {
      const data = JSON.parse(readFileSync(file, 'utf8'));
      // (comments to start with on someone's own computer: live/shell/samples.js)
      const samples = path.join(path.dirname(file), 'sample-comments.json');
      return {
        ...(existsSync(samples) ? { samples: JSON.parse(readFileSync(samples, 'utf8')).comments ?? [] } : {}),
        name: path.basename(path.dirname(file)),
        title: data.title,
        description: data.description ?? '',
        date: data.date ?? '',
        device: data.device ?? 'phone',
        screens: data.screens ?? [],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

// The project's name for the panel button: sites.json's "title", or its slug in words.
function projectTitle() {
  const file = path.join(here, '../../sites.json');
  const sites = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  if (sites.title) return sites.title;
  const slug = sites.project ?? '';
  return slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) || 'Prototypes';
}

const escape = (text) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function page(prototypes) {
  let html = readFileSync(path.join(marcus, 'index.html'), 'utf8');
  const project = escape(projectTitle());
  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${project} · Prototypes</title>`)
    .replace('<span class="pj-k">Project Name</span>', `<span class="pj-k">${project}</span>`);

  // the sample app's screen markup gives way to the live prototype
  const open = html.indexOf('<div id="screen">');
  const bar = html.indexOf('<div class="home-bar"', open);
  if (open < 0 || bar < 0) throw new Error('marcus/index.html: no #screen found');
  // (the phone's status bar stays: it belongs to the frame, not the app)
  const status = html.slice(open, bar).match(/<header class="status"[\s\S]*?<\/header>/)?.[0];
  if (!status) throw new Error('marcus/index.html: no status bar found');
  html = `${html.slice(0, open)}<div id="screen">\n    <iframe class="live-frame" title="Prototype"></iframe>\n    ${status}\n    ${html.slice(bar)}`;

  html = html.replace(/<script src="(js\/[\w.]+)\?v=\d+"><\/script>\n?/g, (tag, src) => {
    if (!(src in SCRIPTS)) throw new Error(`marcus/index.html: unknown script ${src}`);
    const to = SCRIPTS[src];
    if (!to) return '';
    // (the shell is ES modules: one file per part, no bundler)
    return [to].flat().map((s) => `<script${s.startsWith('js/shell/') ? ' type="module"' : ''} src="${s}"></script>\n`).join('');
  });
  html = html.replace(
    '<script src="js/sets.js"></script>',
    // the Sites page kit (who is looking, saved choices); absent off Sites
    `<script>if (location.hostname.endsWith('metalab.com')) document.write('<script src="/sdk/v1/sites.js"><\\/script>');</script>\n<script src="js/catalog.js"></script>\n<script src="js/sets.js"></script>`,
  );
  html = html.replace(
    /(<link rel="stylesheet" href="css\/app\.css[^"]*">)/,
    '$1\n<link rel="stylesheet" href="css/live.css">\n<link rel="stylesheet" href="css/comments.css">\n<link rel="stylesheet" href="css/shell.css">',
  );

  html = html.replace(/<script>([\s\S]*?)<\/script>\n?/g, (tag, body) => {
    const first = body.match(/\/\/\s*(.+)/)?.[1] ?? '';
    const leftOut = prototypes.length ? SAMPLE_APP_SCRIPTS : [...SAMPLE_APP_SCRIPTS, ...NEEDS_A_PROTOTYPE];
    return leftOut.some((s) => first.startsWith(s)) ? '' : tag;
  });

  // (first in the page: it must hear Esc before Marcus's scripts do)
  html = html.replace('<body>', '<body>\n<script src="js/escape.js"></script>');
  if (!prototypes.length) {
    html = html.replace('<body>', '<body class="no-prototypes">');
  }
  return notesScript(html);
}

// Marcus's labels, pointer and screen notes, fed from prototype.json (live.js)
// instead of his sample app's lists.
function swap(file, pattern, replacement) {
  const text = readFileSync(path.join(marcus, file), 'utf8');
  if (!pattern.test(text)) throw new Error(`marcus/${file}: ${pattern} not found`);
  return text.replace(pattern, replacement);
}
const notesScript = (html) => {
  const at = /const NOTES = \{[\s\S]*?\n    \};/;
  if (!at.test(html)) throw new Error('marcus/index.html: screen notes list not found');
  return html.replace(at, 'const NOTES = window.presentNotes || {};');
};

function rotate() {
  const file = readFileSync(path.join(marcus, 'js/rotate.js'), 'utf8');
  const order = "const ORDER = ['loader', 'start', 'article', 'full', 'menu'];";
  if (!file.includes(order)) throw new Error('marcus/js/rotate.js: step order not found');
  return file.replace(
    order,
    "const ORDER = [...document.querySelectorAll('.steps [data-step]')].map(b => b.dataset.step);",
  );
}

export function build() {
  const prototypes = readPrototypes(path.dirname(here));
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(path.join(dist, 'js'), { recursive: true });
  cpSync(path.join(marcus, 'css'), path.join(dist, 'css'), { recursive: true });
  cpSync(path.join(live, 'live.css'), path.join(dist, 'css/live.css'));
  cpSync(path.join(live, 'comments.css'), path.join(dist, 'css/comments.css'));
  cpSync(path.join(live, 'shell.css'), path.join(dist, 'css/shell.css'));
  for (const f of ['escape.js', 'frame.js', 'choices.js', 'live.js', 'sets.js', 'comments.js'])
    cpSync(path.join(live, f), path.join(dist, 'js', f));
  cpSync(path.join(live, 'shell'), path.join(dist, 'js/shell'), {
    recursive: true,
    filter: (file) => !file.endsWith('.test.mjs'),
  });
  // (ELK lays out the flow view; the shell fetches it by itself once the page is up: shell/elk.js)
  mkdirSync(path.join(dist, 'js/vendor'), { recursive: true });
  cpSync(require.resolve('elkjs/lib/elk.bundled.js'), path.join(dist, 'js/vendor/elk.js'));
  writeFileSync(path.join(dist, 'js/rotate.js'), rotate());
  writeFileSync(
    path.join(dist, 'js/guides.js'),
    swap('js/guides.js', /const GUIDES = \[[\s\S]*?\n  \];/, 'const GUIDES = window.presentLabels || [];'),
  );
  writeFileSync(
    path.join(dist, 'js/pointer.js'),
    swap('js/pointer.js', /const HINTS = \[[\s\S]*?\n  \];/, 'const HINTS = window.presentHints || [];'),
  );
  writeFileSync(
    path.join(dist, 'js/catalog.js'),
    `window.PRESENT = ${JSON.stringify({ prototypes }, null, 2)};\n`,
  );
  writeFileSync(path.join(dist, 'index.html'), page(prototypes));
  return prototypes;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const list = build();
  console.log(`Viewer built with ${list.length} prototype(s): ${list.map((p) => p.name).join(', ') || 'none yet'}`);
}
