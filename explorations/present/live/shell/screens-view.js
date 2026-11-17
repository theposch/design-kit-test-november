// All screens at once, two ways: a grid under each group's name, or a flow
// diagram (flow-view.js). It covers the stage below the top bar; picking a
// screen opens it and closes the view.

import { clear, h, icon, segmented } from './dom.js';
import { engine } from './engine.js';
import { buildFlow } from './flow-view.js';
import { menuButton } from './menu.js';
import { framesFlow, groupScreens } from './model.js';
import { plural } from './parts.js';
import { refreshCards, screenCard } from './screen-card.js';
import { setUi, subscribe, ui } from './store.js';
import { rethemeThumbs } from './thumb.js';

let overlay, toolbar, content;
let built = '';       // what the content was last built for
let flow = null;      // the flow canvas while it is the one showing

const pick = id => {
  engine.step(id);
  setUi({ screens: null });
};

function buildGrid() {
  const { proto, screens } = engine.prototypes();
  const width = proto.device === 'desktop' ? 260 : 132;
  return h('div', { class: 'sh-grid' },
    groupScreens(screens).map(group => h('section', {},
      group.name ? h('h2', {}, group.name, h('small', { text: plural(group.screens.length, 'screen') })) : null,
      h('div', { class: 'sh-grid-row' }, group.screens.map(s => screenCard(proto, s, s.number, width, pick))))));
}

function buildToolbar() {
  const { screens } = engine.prototypes();
  const groups = groupScreens(screens).map(g => g.name).filter(Boolean);
  // (one menu for what the flow shows: all of it as one flow or a frame per part, or one part alone)
  const ALL = { one: 'One flow', parts: 'By part' };
  const groupMenu = menuButton({
    label: 'What the flow shows',
    value: ui.flowGroup ? `part:${ui.flowGroup}` : framesFlow(screens, ui.flowFrames) ? 'parts' : 'one',
    options: [...Object.entries(ALL).map(([value, label]) => ({ value, label })), ...groups.map(g => ({ value: `part:${g}`, label: g }))],
    onChange: value => setUi(value in ALL ? { flowGroup: '', flowFrames: value === 'parts' } : { flowGroup: value.slice(5) }),
  });
  return [
    segmented({
      label: 'How to show the screens',
      value: ui.screens,
      options: [{ value: 'grid', label: 'Grid', icon: 'grid' }, { value: 'flow', label: 'Flow', icon: 'flow' }],
      onChange: mode => setUi({ screens: mode }),
    }),
    ui.screens === 'flow' && groups.length > 1 ? groupMenu : null,
    h('span', { class: 'sh-grow' }),
    h('button', { class: 'sh-btn quiet', type: 'button', onClick: () => setUi({ screens: null }) }, icon('close', 14), 'Close'),
  ];
}

function render() {
  const mode = ui.screens;
  overlay.hidden = !mode;
  document.body.classList.toggle('sh-screens-open', Boolean(mode));
  if (!mode) {
    // (closed: the thumbnails go, so a long prototype doesn't keep dozens of pages alive)
    if (built) { built = ''; flow = null; clear(content); }
    return;
  }
  const key = `${mode}|${ui.flowGroup}|${ui.flowFrames}`;
  if (key !== built) {
    built = key;
    flow = mode === 'flow' ? buildFlow(pick) : null;
    clear(content).append(flow ? flow.el : buildGrid());
    clear(toolbar).append(...buildToolbar().filter(Boolean));
  }
  if (flow) flow.refresh(); else refreshCards(content);
  rethemeThumbs();
}

/** For the comments panel: its "Add comment" works on the canvas too. */
export const commentOnFlow = () => flow?.startCommenting();

export function mountScreensView() {
  toolbar = h('div', { class: 'sh-screens-bar' });
  content = h('div', { class: 'sh-screens-body' });
  overlay = h('section', { class: 'sh-screens', hidden: true, 'aria-label': 'All screens' }, toolbar, content);
  document.body.append(overlay);
  subscribe(render);
  const typing = () => /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName ?? '');
  const toggle = () => setUi({ screens: ui.screens ? null : 'grid' });
  // Esc, once nothing on top wants it: out of a text box first, then this view opens or closes
  // (as Esc did the template's own all-screens view)
  engine.onEscape(20, () => {
    if (!typing()) return false;
    document.activeElement.blur();
    return true;
  });
  engine.onEscape(10, () => { toggle(); return true; });
  addEventListener('keydown', e => {
    if ((e.key === 'g' || e.key === 'G') && !typing() && !e.metaKey && !e.ctrlKey && !e.altKey) toggle();
  });
}
