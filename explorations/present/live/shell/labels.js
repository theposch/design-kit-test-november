// Adding a label in the viewer (MetaLab people only): a floating button, a
// click on the screen, a title and a note. The label is kept at that spot
// until Claude ties it to its part of the screen in prototype.json.
//
// The template's labels script reads its list once, as the page loads, so a
// new or removed label shows after a reload: the page comes back with labels on.

import { saving } from './actions.js';
import { h, icon, keepKeys } from './dom.js';
import { engine } from './engine.js';
import { attachPopover } from './popover.js';
import { emptyNote, sectionLabel } from './parts.js';
import { setUi, subscribe, ui } from './store.js';

const LABELS_ON = 'present-labels-on';
let fab, catcher, form;

function reloadWithLabels() {
  try { sessionStorage.setItem(LABELS_ON, '1'); } catch {}
  location.reload();
}

/** After a reload that followed a change: labels come back on. */
export function restoreLabels() {
  let wanted = false;
  try { wanted = sessionStorage.getItem(LABELS_ON) === '1'; sessionStorage.removeItem(LABELS_ON); } catch {}
  if (wanted && !engine.labels.isOn()) engine.labels.toggle();
}

let stopFormEscape = () => {};
const closeForm = () => { stopFormEscape(); form?.remove(); form = null; };

function openForm(spot, at) {
  closeForm();
  const title = h('input', { class: 'sh-input', type: 'text', placeholder: 'Title', 'aria-label': 'Label title', maxlength: '60' });
  const text = h('textarea', { class: 'sh-input', rows: '3', placeholder: 'What should people notice here?', 'aria-label': 'Label note' });
  const save = async () => {
    if (!title.value.trim()) return title.focus();
    if (await saving(() => engine.prototypes().labels.add({ ...spot, title: title.value.trim(), text: text.value.trim() }))) reloadWithLabels();
  };
  form = keepKeys(h('div', { class: 'sh-pop sh-label-form', role: 'dialog', 'aria-label': 'New label' },
    h('div', { class: 'sh-pop-body' },
      h('b', { class: 'sh-pop-title', text: 'New label' }),
      title,
      text,
      h('div', { class: 'sh-pop-row end' },
        h('button', { class: 'sh-btn quiet', type: 'button', onClick: closeForm }, 'Cancel'),
        h('button', { class: 'sh-btn primary', type: 'button', onClick: save }, 'Add label')))));
  stopFormEscape = engine.onEscape(90, () => { closeForm(); return true; });
  document.body.append(form);
  form.style.left = `${Math.min(at.x + 16, innerWidth - form.offsetWidth - 12)}px`;
  form.style.top = `${Math.min(Math.max(at.y - 24, 68), innerHeight - form.offsetHeight - 12)}px`;
  title.focus();
}

function place(e) {
  const { screen, frame } = engine.stage();
  const r = screen.getBoundingClientRect();
  const scale = r.width / (screen.offsetWidth || 1);
  let scrolled = 0;
  try { scrolled = frame.contentWindow.scrollY || 0; } catch {}
  // a click with the keyboard has no spot: the middle of the screen
  const px = e.detail ? (e.clientX - r.left) / scale : frame.clientWidth / 2;
  const py = e.detail ? (e.clientY - r.top) / scale : frame.clientHeight / 2;
  setUi({ placing: null });
  openForm({ screen: engine.screen(), x: px / (frame.clientWidth || 1), y: py + scrolled },
    { x: e.detail ? e.clientX : r.left + r.width / 2, y: e.detail ? e.clientY : r.top + r.height / 2 });
}

function buildMenu(close) {
  const api = engine.prototypes();
  const here = api.labels.viewer().filter(l => l.screen === engine.screen());
  return h('div', { class: 'sh-pop-body' },
    h('button', { class: 'sh-btn primary wide', type: 'button', autofocus: true, onClick: () => { close(); setUi({ placing: 'label' }); engine.toast('Click the spot the label is about'); } },
      icon('plus', 14), 'Place a new label'),
    sectionLabel('Added in the viewer, on this screen'),
    here.length ? null : emptyNote('None yet.'),
    here.map(l => h('div', { class: 'sh-row-wrap' },
      h('span', { class: 'sh-row-main static' }, h('b', { text: l.title }), l.text ? h('small', { text: l.text }) : null),
      h('button', {
        class: 'sh-icon-btn',
        type: 'button',
        'aria-label': `Delete the label ${l.title}`,
        onClick: async () => { if (await saving(() => api.labels.remove(l.id))) reloadWithLabels(); },
      }, icon('trash', 14)))),
    h('p', { class: 'sh-note', text: 'These sit at a spot on the screen. Before a round goes to the client, ask Claude to tie them to their part of the screen.' }));
}

function render() {
  const api = engine.prototypes();
  const canAdd = api.staff() && !api.clientView() && !api.empty;
  fab.hidden = !(canAdd && engine.labels.isOn() && !ui.screens);
  const placing = ui.placing === 'label' && !fab.hidden;
  if (placing && !catcher.isConnected) engine.stage().screen.append(catcher);
  if (!placing && catcher.isConnected) catcher.remove();
  document.body.classList.toggle('sh-placing', placing);
}

export function mountLabels() {
  fab = h('button', { class: 'sh-fab', type: 'button', hidden: true }, icon('plus', 16), 'Add label');
  catcher = h('button', { class: 'sh-place-catch', type: 'button', 'aria-label': 'Click the spot the label is about', onClick: place });
  document.body.append(fab);
  attachPopover(fab, { label: 'Labels added in the viewer', align: 'end', side: 'top', width: 320, build: buildMenu });
  engine.onEscape(80, () => {
    if (!ui.placing) return false;
    setUi({ placing: null });
    return true;
  });
  subscribe(render);
}
