// pnpm design:build — packs @repo/ui for Claude Design: the real components as
// one browser script, their stylesheet, the tokens, a guide and preview cards,
// in .claude-design/project/ at the repo root. Claude publishes that folder as the project's
// design system (.claude/skills/claude-design/SKILL.md).

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

import { COLOR_NOTES, SPACING, CARDS as STARTER_CARDS } from './cards.mjs';

const NAMESPACE = 'Starter';
const here = path.dirname(fileURLToPath(import.meta.url));
const ui = path.resolve(here, '../..');
const repo = path.resolve(ui, '../..');
const out = path.join(repo, '.claude-design');
const project = path.join(out, 'project');
const read = (file) => readFileSync(path.join(ui, file), 'utf8');

function write(file, text) {
  const target = path.join(project, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
}

const settingsFile = path.join(repo, 'claude-design.json');
const settings = existsSync(settingsFile)
  ? JSON.parse(readFileSync(settingsFile, 'utf8'))
  : {};
const title =
  settings.title ??
  JSON.parse(readFileSync(path.join(repo, 'package.json'), 'utf8')).name;

/*
 * Whose design system the url is. A copy of the starter inherits the
 * starter's claude-design.json, and publishing to it would overwrite the
 * starter's design system with this project's.
 */
const normalizeRemote = (url) =>
  url
    .trim()
    .replace(/^git@([^:]+):/, '$1/')
    .replace(/^[a-z+]+:\/\/(?:[^@/]+@)?/, '')
    .replace(/\.git$/, '')
    .replace(/\/+$/, '')
    .toLowerCase();
let origin = null;
try {
  origin = normalizeRemote(
    execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: repo,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString(),
  );
} catch {
  /* no origin yet */
}
/*
 * A fresh copy still has the starter as its origin until setup re-points it,
 * so the origin alone can't tell. A copy that kept the starter's settings but
 * renamed its package is not the starter.
 */
const lockFile = path.join(repo, 'addons.lock.json');
const starterRepo = existsSync(lockFile)
  ? JSON.parse(readFileSync(lockFile, 'utf8')).source?.repo
  : null;
const packageName = JSON.parse(
  readFileSync(path.join(repo, 'package.json'), 'utf8'),
).name;
const renamed =
  starterRepo &&
  settings.repo &&
  normalizeRemote(settings.repo) === normalizeRemote(starterRepo) &&
  normalizeRemote(starterRepo).split('/').pop() !== packageName;
const notOurs =
  settings.url &&
  settings.repo &&
  (normalizeRemote(settings.repo) !== origin || renamed);

/*
 * The starter's cards, plus the project's own in project-cards.mjs (same
 * shape; a card set to null drops a starter one).
 */
const projectCardsFile = path.join(here, 'project-cards.mjs');
const PROJECT_CARDS = existsSync(projectCardsFile)
  ? (await import(projectCardsFile)).CARDS
  : {};
const CARDS = Object.fromEntries(
  Object.entries({ ...STARTER_CARDS, ...PROJECT_CARDS }).filter(
    ([, card]) => card,
  ),
);

rmSync(out, { recursive: true, force: true });
mkdirSync(project, { recursive: true });

/*
 * Claude's design canvas brings its own React (18) and mounts components with
 * it, so the bundle must not carry a React of its own: every import of react,
 * react-dom and the JSX runtime is pointed at the page's copy.
 */
const shim = (name) => path.join(here, 'shims', name);
const entry = path.join(out, 'entry.tsx');
writeFileSync(
  entry,
  `import * as Library from '${path.join(ui, 'src/index.ts')}';
import '${path.join(ui, 'src/globals.css')}';
import * as Lucide from '${path.join(ui, 'node_modules/lucide-react')}';
const Icons: Record<string, unknown> = {};
for (const [name, icon] of Object.entries(Lucide)) {
  if (/^[A-Z]/.test(name) && !name.endsWith('Icon') && !name.startsWith('Lucide') && icon && typeof icon === 'object') Icons[name] = icon;
}
/* Page templates take no props, so a canvas can mount a whole screen and vary it. */
const Templates: Record<string, unknown> = {};
const modules = import.meta.glob(['/src/templates/*.tsx', '!/src/templates/*.stories.tsx'], { eager: true }) as Record<string, Record<string, unknown>>;
for (const [file, mod] of Object.entries(modules)) {
  const name = file.split('/').pop()!.replace(/\\.tsx$/, '');
  if (typeof mod[name] === 'function') Templates[name] = mod[name];
}
(window as unknown as Record<string, unknown>).${NAMESPACE} = { ...Library, Icons, Templates };
`,
);

await build({
  root: ui,
  configFile: false,
  logLevel: 'warn',
  cacheDir: path.join(out, 'cache'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^react\/jsx-(dev-)?runtime$/, replacement: shim('jsx.cjs') },
      { find: /^react-dom(\/client)?$/, replacement: shim('react-dom.cjs') },
      { find: /^react$/, replacement: shim('react.cjs') },
    ],
  },
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: path.join(out, 'build'),
    emptyOutDir: true,
    minify: true,
    cssCodeSplit: false,
    lib: {
      entry,
      formats: ['iife'],
      name: `${NAMESPACE}Bundle`,
      fileName: () => 'bundle.js',
      cssFileName: 'bundle',
    },
  },
});

/* The component list, in the library's own order: its index's exports. */
const components = [
  ...read('src/index.ts').matchAll(
    /export (?:\* as (\w+)|\{\s*([^}]+?)\s*\})/g,
  ),
].flatMap(([, namespace, named]) =>
  namespace
    ? [namespace]
    : named
        .split(',')
        .map((part) => part.trim())
        .filter((part) => /^[A-Z]/.test(part)),
);

const js = readFileSync(path.join(out, 'build/bundle.js'), 'utf8');
if (/<\/script|<!--/i.test(js)) {
  throw new Error(
    'bundle.js contains "</script" or "<!--", which would break the page that inlines it.',
  );
}
const header = { format: 4, namespace: NAMESPACE, components: [] };
header.components = components.map((name) => ({ name }));
write(
  'components/bundle.js',
  `/* @ds-bundle: ${JSON.stringify(header)} */\n${js}`,
);
copyFileSync(
  path.join(out, 'build/bundle.css'),
  path.join(project, 'components/bundle.css'),
);

/* Tokens, read from the theme files so they follow the code. */
const palette = read('src/theme/palette.css');
const varsIn = (block) =>
  Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value.trim(),
    ]),
  );
const light = varsIn(palette.match(/:root \{([\s\S]*?)\}/)[1]);
const dark = varsIn(palette.match(/\n\.dark \{([\s\S]*?)\}/)[1]);
const color = Object.keys(light).map((name) => ({
  name,
  value: { light: light[name], dark: dark[name] ?? light[name] },
  usage: COLOR_NOTES[name] ?? '',
}));

const px = (value) =>
  value.endsWith('rem') ? `${parseFloat(value) * 16}px` : value;
const type = varsIn(read('src/theme/typography.css').split('@media')[0]);
const font = varsIn(read('src/theme/font.css'));
const style = (name, weight, usage) => ({
  name,
  fontSize: px(type[`${name}-size`]),
  lineHeight: 1.5,
  fontWeight: Number(weight),
  ...(type[`${name}-tracking`] && type[`${name}-tracking`] !== '0'
    ? { letterSpacing: type[`${name}-tracking`] }
    : {}),
  usage,
});

const radii = read('src/theme/radii.css');
const base = parseFloat(radii.match(/--radius:\s*([\d.]+)rem/)[1]) * 16;
const radius = [
  ...radii.matchAll(
    /--radius-([\w]+):\s*(?:calc\(var\(--radius\) \* ([\d.]+)\)|var\(--radius\))/g,
  ),
].map(([, name, times]) => ({
  name: `radius-${name}`,
  value: `${Math.round(base * Number(times ?? 1) * 10) / 10}px`,
  usage: '',
}));
radius.push({
  name: 'radius-full',
  value: '9999px',
  usage: 'Avatars, switches, pills.',
});
for (const token of radius) {
  token.usage ||=
    {
      'radius-sm': 'Small chips, checkboxes.',
      'radius-md': 'Tabs, menu items.',
      'radius-lg': 'Buttons, inputs, selects, images.',
      'radius-xl': 'Cards.',
      'radius-2xl': 'Dialogs.',
    }[token.name] ?? '';
}

const tokens = {
  name: title,
  version: 1,
  meta: {
    source: 'code',
    package: 'packages/ui',
    paths: { tokens: ['src/theme/*.css'] },
    synced: new Date().toISOString().slice(0, 10),
  },
  color: {
    themes: [
      { id: 'light', name: 'Light' },
      { id: 'dark', name: 'Dark' },
    ],
    tokens: color,
  },
  type: {
    fonts: [],
    families: {
      sans: font['body-font'].replace(
        /'Geist Variable'/,
        "'Geist Variable', 'Geist'",
      ),
    },
    groups: [
      {
        name: 'Headings',
        family: 'sans',
        styles: [
          style(
            'heading-1',
            type['heading-weight'],
            'Page title, one per page; smaller on phones.',
          ),
          style(
            'heading-2',
            type['heading-weight'],
            'Section title on long pages; smaller on phones.',
          ),
          style('heading-3', type['heading-weight'], 'Group title.'),
          style('heading-4', type['heading-weight'], 'Card title.'),
        ],
      },
      {
        name: 'Body',
        family: 'sans',
        styles: [
          style('body-lg', type['body-weight'], 'Lead paragraphs.'),
          style(
            'body-base',
            type['body-weight'],
            'Default text; large controls.',
          ),
          style(
            'body-sm',
            type['body-weight'],
            'Labels, descriptions, default controls.',
          ),
          style('body-xs', type['body-weight'], 'Fine print, small buttons.'),
          {
            ...style(
              'body-base',
              type['body-strong-weight'],
              'Emphasis inside a body style, for figures and names.',
            ),
            name: 'body-strong',
          },
        ],
      },
    ],
  },
  spacing: {
    note: 'Page layout uses an 8px grid: these steps only. 4px half-steps are for inside components.',
    tokens: SPACING,
  },
  radius: { tokens: radius },
};
write('tokens.json', `${JSON.stringify(tokens, null, 2)}\n`);

/* The stylesheet a system kept in sync from code ships with its tokens. */
const decl = (list, value) =>
  list.map((token) => `  --${token.name}: ${value(token)};`).join('\n');
const styles = tokens.type.groups.flatMap((group) => group.styles);
write(
  'tokens.css',
  `/* ${title} — generated from tokens.json */
:root, [data-theme="light"] {
${decl(color, (token) => token.value.light)}
}
[data-theme="dark"] {
${decl(color, (token) => token.value.dark)}
}
:root {
${decl(SPACING, (token) => token.value)}
${decl(radius, (token) => token.value)}
  --font-sans: ${tokens.type.families.sans};
}
${styles
  .map(
    (s) =>
      `.${s.name} { font-family: var(--font-sans); font-size: ${s.fontSize}; line-height: ${s.lineHeight}; font-weight: ${s.fontWeight};${s.letterSpacing ? ` letter-spacing: ${s.letterSpacing};` : ''} }`,
  )
  .join('\n')}
`,
);

/* The guide, the cover, and a card and guideline per chosen component. */
write('README.md', readFileSync(path.join(here, 'guide.md'), 'utf8'));
write(
  'components/Cover/preview.html',
  readFileSync(path.join(here, 'cover.html'), 'utf8').replaceAll(
    '{{title}}',
    title,
  ),
);
for (const [name, card] of Object.entries(CARDS)) {
  write(
    `components/${name}/preview.html`,
    `<!-- @dsCard group="${card.group}" height=${card.height} -->
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${name}</title></head>
<body style="margin:0">
<div id="root" style="padding:16px;display:flex;flex-direction:column;gap:12px"></div>
<script>
var S = window.${NAMESPACE}, h = React.createElement, Stack = S.Stack;
ReactDOM.createRoot(document.getElementById('root')).render(h(React.Fragment, null, ${card.render}));
</script>
</body>
</html>
`,
  );
  write(
    `components/${name}/README.md`,
    `# ${name}\n\n${card.summary}\n\n${card.props}\n\nFull guidance (when to use, alternatives, do and don't): the ${name} Docs page in Storybook.\n`,
  );
}

const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: repo }).toString().trim();
  } catch {
    return '';
  }
};
const by =
  git('config', 'user.name') || git('log', '-1', '--format=%an') || 'Claude';
const now = new Date().toISOString();
write(
  'design-system.json',
  `${JSON.stringify({
    v: 3,
    layout: 'files',
    editing: 'code',
    createdOnFiles: { v: 1, at: now },
    title,
    namespace: NAMESPACE,
    libraries: [
      { name: 'react', version: '18.3.1' },
      { name: 'react-dom', version: '18.3.1' },
    ],
    sections: {},
    groups: [],
    assetGroups: {},
    blobs: {},
    docs: { readme: 'project/README.md', sections: [] },
    lastChange: {
      by,
      at: now,
      via: 'Claude Code · pnpm design:build',
      note: `${components.length} components, ${color.length} colours, ${Object.keys(CARDS).length} cards`,
    },
  })}\n`,
);

rmSync(entry);
rmSync(path.join(out, 'build'), { recursive: true });
const kb = (file) =>
  Math.round(readFileSync(path.join(project, file)).length / 1024);
console.log(`Built ${title} for Claude Design in .claude-design/project/
  ${components.length} components (${kb('components/bundle.js')} KB), ${color.length} colours, ${styles.length} text styles, ${Object.keys(CARDS).length} preview cards
${notOurs ? '' : settings.url ? `Ask Claude to publish it to ${settings.url}.` : 'Ask Claude to publish it as a new design system (the claude-design skill).'}`);

/* Components built from Figma that the published system shows no card for. */
try {
  const tracker = readFileSync(path.join(ui, 'FIGMA.md'), 'utf8');
  const section = tracker.split(/^## Components/m)[1]?.split(/^## /m)[0] ?? '';
  const tracked = [...section.matchAll(/^\|\s*`?([A-Z]\w+)`?\s*\|/gm)]
    .map(([, name]) => name)
    .filter((name) => name !== 'Component' && components.includes(name));
  const uncarded = tracked.filter((name) => !CARDS[name]);
  if (uncarded.length)
    console.log(
      `\nNo preview card for ${uncarded.join(', ')}. Add one each to scripts/claude-design/project-cards.mjs, so the design system shows the project's own pieces.`,
    );
} catch {
  /* no tracker */
}

/*
 * Fonts packed into the stylesheet go wherever the design system is shared.
 * A trial or demo font usually may not.
 */
const fontFiles = [];
const findFonts = (dir) => {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findFonts(full);
    else if (/\.(woff2?|otf|ttf)$/i.test(entry.name)) fontFiles.push(full);
  }
};
findFonts(path.join(ui, 'src'));
const css = readFileSync(path.join(ui, 'src/theme/font.css'), 'utf8');
const unlicensed = [
  ...fontFiles.map((f) => path.relative(repo, f)),
  ...[...css.matchAll(/url\(['"]?([^'")]+)/g)].map(([, u]) => u),
].filter((name) => /trial|demo|eval|personal[-_ ]?use/i.test(name));
if (unlicensed.length)
  console.log(
    `\nThese fonts look like trial or demo files, and they're packed into the design system:\n  ${unlicensed.join('\n  ')}\nCheck the licence covers sharing before the design system is shared outside MetaLab.`,
  );

if (notOurs) {
  console.error(
    `\nclaude-design.json points at the design system of ${settings.repo}, but this project is ${origin ?? 'not on a repository yet'}.\n` +
      'Publishing would overwrite that one. Run engagement setup, or set "title" and "repo" to this project and remove "url", then publish as a new design system.',
  );
  process.exit(1);
}
