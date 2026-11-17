// One screen as a card: its live thumbnail, its number and name, and how many
// comments it has. The grid and the flow canvas are both made of these.

import { h, icon } from './dom.js';
import { engine } from './engine.js';
import { countByScreen } from './model.js';
import { screenThumb, thumbHeight } from './thumb.js';

export const CAPTION = 30;   // the room the name takes under the thumbnail

export const cardHeight = (proto, width) => thumbHeight(proto, width) + CAPTION;

export function screenCard(proto, screen, number, width, onPick) {
  return h('button', {
    class: 'sh-card',
    type: 'button',
    dataset: { screen: screen.id },
    'aria-label': `Open ${screen.title}`,
    onClick: () => onPick(screen.id),
  },
    screenThumb(proto, screen, width),
    h('span', { class: 'sh-card-count', hidden: true }),
    h('span', { class: 'sh-card-name' }, h('i', { text: String(number) }), h('b', { text: screen.title })));
}

/** Marks the current screen and brings each card's comment count up to date. */
export function refreshCards(container) {
  const current = engine.screen();
  const counts = countByScreen(engine.comments()?.threads() ?? []);
  for (const card of container.querySelectorAll('.sh-card')) {
    const n = counts.get(card.dataset.screen) ?? 0;
    card.classList.toggle('current', card.dataset.screen === current);
    const badge = card.querySelector('.sh-card-count');
    badge.hidden = !n;
    badge.replaceChildren(icon('message', 11), String(n));
  }
}
