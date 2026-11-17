// The top bar: which prototype, which screen, and what has been said, always
// in view. Each button either flips something through the engine or opens one
// of the menus (popover.js); the bar itself only shows the current state.

import { unreadCount } from './comments-panel.js';
import { h, icon } from './dom.js';
import { engine } from './engine.js';
import { neighbour } from './model.js';
import { attachPopover } from './popover.js';
import { buildPrototypePicker } from './prototype-picker.js';
import { buildScreenPicker } from './screen-picker.js';
import { buildSettings } from './settings.js';
import { buildShare } from './share.js';
import { setUi, subscribe, ui } from './store.js';

const button = (props, ...children) => h('button', { class: 'sh-btn', type: 'button', ...props }, ...children);
const iconButton = (label, name, onClick) => button({ class: 'sh-btn icon', 'aria-label': label, title: label, onClick }, icon(name));

export function mountTopBar() {
  const api = engine.prototypes();
  const { proto, screens } = api;

  // ── left: the prototype, and whether the client sees it ──
  const protoName = h('b', { text: proto.title });
  const round = h('span', { class: 'sh-chip' });
  const protoBtn = button({ class: 'sh-btn', 'aria-label': 'Prototypes' }, icon('layers'), protoName, round, icon('chevronDown', 14));
  const status = h('span', { class: 'sh-status' });
  attachPopover(protoBtn, { label: 'Prototypes', width: 380, build: buildPrototypePicker });

  // ── centre: the screen ──
  const step = by => engine.step(neighbour(screens, engine.screen(), by).id);
  const position = h('span', { class: 'sh-dim' });
  const screenName = h('b');
  const screenBtn = button({ class: 'sh-btn outline', 'aria-label': 'Screens' }, position, screenName, icon('chevronDown', 14));
  attachPopover(screenBtn, { label: 'Screens', align: 'center', width: 340, build: buildScreenPicker });
  const allBtn = iconButton('All screens', 'grid', () => setUi({ screens: ui.screens ? null : 'grid' }));
  const centre = h('div', { class: 'sh-bar-centre' },
    iconButton('Previous screen', 'chevronLeft', () => step(-1)),
    screenBtn,
    iconButton('Next screen', 'chevronRight', () => step(1)),
    h('i', { class: 'sh-sep' }),
    allBtn);

  // ── right: what has been said, how it looks, who sees it ──
  const commentCountEl = h('span', { class: 'sh-count' });
  const commentsBtn = button({ onClick: () => setUi({ panel: ui.panel === 'comments' ? null : 'comments', thread: null }) },
    icon('message'), h('span', { class: 'sh-label', text: 'Comments' }), commentCountEl);
  // (labels sit beside the phone, so the all-screens view steps aside for them)
  const toggleLabels = () => { setUi({ screens: null }); engine.labels.toggle(); };
  const labelsBtn = button({ onClick: toggleLabels }, icon('tag'), h('span', { class: 'sh-label', text: 'Labels' }));
  addEventListener('keydown', e => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName ?? '') || document.activeElement?.isContentEditable;
    if ((e.key === 'l' || e.key === 'L') && !typing && !e.metaKey && !e.ctrlKey && !e.altKey && !labelsBtn.hidden) toggleLabels();
  });
  const themeBtn = button({ class: 'sh-btn icon sh-theme', onClick: engine.theme.toggle });
  const settingsBtn = iconButton('Settings', 'settings');
  attachPopover(settingsBtn, { label: 'Settings', align: 'end', width: 340, build: buildSettings });
  const shareBtn = button({ class: 'sh-btn outline' }, icon('share'), h('span', { class: 'sh-label', text: 'Share' }));
  attachPopover(shareBtn, { label: 'Share', align: 'end', width: 400, build: buildShare });

  const bar = h('header', { class: 'sh-bar' },
    h('div', { class: 'sh-bar-side' }, protoBtn, status),
    centre,
    h('div', { class: 'sh-bar-side end' }, commentsBtn, labelsBtn, h('i', { class: 'sh-sep' }), themeBtn, settingsBtn, shareBtn));
  document.body.append(bar);

  const update = () => {
    const staff = api.staff() && !api.clientView();
    const empty = Boolean(api.empty);
    const current = engine.screen();
    const at = Math.max(0, screens.findIndex(s => s.id === current));

    round.textContent = api.rank(proto.name).round;
    round.hidden = !round.textContent;
    status.hidden = !staff || empty;
    const shown = api.shown(proto.name);
    status.textContent = shown ? 'Shown to client' : 'Hidden from client';
    status.classList.toggle('on', shown);

    centre.hidden = empty;
    position.textContent = `${at + 1} of ${screens.length}`;
    screenName.textContent = screens[at]?.title ?? '';
    allBtn.setAttribute('aria-pressed', String(Boolean(ui.screens)));

    const threads = engine.comments()?.threads().length ?? 0;
    const unread = unreadCount();
    commentsBtn.hidden = empty || !engine.comments();
    commentsBtn.setAttribute('aria-pressed', String(ui.panel === 'comments'));
    commentCountEl.hidden = !threads;
    commentCountEl.textContent = unread ? `${unread} new` : String(threads);
    commentCountEl.classList.toggle('new', unread > 0);

    // (labels: shown when the prototype has some, or to someone who can add the first)
    labelsBtn.hidden = empty || !(engine.labels.exist() || staff);
    labelsBtn.setAttribute('aria-pressed', String(engine.labels.isOn()));

    const light = engine.theme.isLight();
    themeBtn.replaceChildren(icon(light ? 'sun' : 'moon'));
    themeBtn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
    themeBtn.title = themeBtn.getAttribute('aria-label');
    shareBtn.hidden = empty;
  };
  subscribe(update);
  update();
}
