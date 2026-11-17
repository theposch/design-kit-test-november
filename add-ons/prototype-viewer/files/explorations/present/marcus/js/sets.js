// Design sets — one per round of work shared with the client (e.g. weekly).
//
// Each set is a name, a date, a line on what changed, and optionally a
// stylesheet of its own (sets/<id>.css) layered over the base design, so a
// new round only has to hold what's different. Every visit opens on the first.
// kind: 'desktop' shows the flow as desktop screens;
// kind: 'components' is a board of the design's components (js/components.js).
//
// To share a new round: add an entry here (and its sets/<id>.css).
const SETS = [
  { id: 'v2', name: 'Mobile V.1', date: '7 Oct 2026', note: 'The full flow on the phone, screen by screen: intro, landing, page, gallery and list, with labels for each step.', css: 'sets/v2.css' },
  { id: 'v1', name: 'Desktop V.1', date: '30 Sep 2026', note: 'The same flow as desktop screens, in a browser window that resizes with the page, with layouts that adapt to fit.', css: 'sets/v1.css', kind: 'desktop' },
  { id: 'components', name: 'Components', date: '1 Oct 2026', note: 'Every component on one board, grouped by type: controls, content, navigation and feedback.', kind: 'components' },
];

// every visit starts from the default settings (page color, device, screen size, skip intro…):
// a refresh clears what was chosen last time. (Embedded copies keep them: they follow the page.)
if (!/[?&]embed\b/.test(location.search)) {
  try { ['proto-bg', 'proto-device-2', 'proto-screen', 'intro-skip', 'proto-theme-scope', 'intro-version'].forEach(k => localStorage.removeItem(k)); } catch {}
}

// pick the set before anything paints, so it never flashes the wrong one
(() => {
  // every visit opens on the first set (Mobile); only an embedded copy (a thumbnail, the phone's
  // desktop window) is told which set to show, with ?set=
  const q = /[?&]embed\b/.test(location.search) ? new URLSearchParams(location.search).get('set') : null;
  const id = SETS.some(s => s.id === q) ? q : SETS[0].id;
  window.PROTO_SET = id;
  document.documentElement.dataset.set = id;
  const kind = SETS.find(s => s.id === id).kind;
  if (kind === 'modes') document.documentElement.classList.add('proto-modes');
  if (kind === 'desktop') document.documentElement.classList.add('proto-desktop');
  if (kind === 'components') document.documentElement.classList.add('proto-components');
  const set = SETS.find(s => s.id === id);
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.id = 'set-css';
  if (set.css) link.href = set.css + '?v=8';
  document.head.appendChild(link);
})();
