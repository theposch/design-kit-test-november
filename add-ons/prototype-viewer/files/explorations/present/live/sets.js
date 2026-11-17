// Marcus Brown's set picker, with the sets read from the prototype list
// (js/catalog.js) instead of written by hand. Every prototype is one set.
// ?set=<name> opens that prototype; with none, the first one.
const SETS = window.PRESENT.prototypes.map(p => ({
  id: p.name,
  name: p.title,
  date: p.date || '',
  note: p.description || '',
  kind: p.device === 'desktop' ? 'desktop' : undefined,
}));

// every visit starts from the default settings (page color, device, screen size, skip intro…):
// a refresh clears what was chosen last time. (Embedded copies keep them: they follow the page.)
if (!/[?&]embed\b/.test(location.search)) {
  try { ['proto-bg', 'proto-device-2', 'proto-screen', 'intro-skip', 'proto-theme-scope', 'intro-version'].forEach(k => localStorage.removeItem(k)); } catch {}
}

// pick the set before anything paints, so it never flashes the wrong one
(() => {
  if (!SETS.length) return;
  const q = new URLSearchParams(location.search).get('set');
  const id = SETS.some(s => s.id === q) ? q : SETS[0].id;
  window.PROTO_SET = id;
  document.documentElement.dataset.set = id;
  if (SETS.find(s => s.id === id).kind === 'desktop') document.documentElement.classList.add('proto-desktop');
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.id = 'set-css';
  document.head.appendChild(link);
})();
