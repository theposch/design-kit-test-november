// Pieces more than one part of the shell is made of: a search box, a list
// you can move through with the arrow keys, a count, a section heading.

import { h, icon } from './dom.js';
import { notify } from './store.js';

/** A search box that survives its popover being rebuilt (`kept` is the popover's own). */
export function searchBox(kept, placeholder) {
  kept.search ??= h('input', {
    class: 'sh-search',
    type: 'search',
    placeholder,
    'aria-label': placeholder,
    autofocus: true,
    autocomplete: 'off',
    spellcheck: 'false',
    onInput: notify,
  });
  return h('label', { class: 'sh-search-wrap' }, icon('search', 14), kept.search);
}

export const queryOf = kept => kept.search?.value ?? '';

/** Up and Down move between the rows of a list; from the search box, Down enters it and Enter takes the first. */
export function arrowKeys(list) {
  list.addEventListener('keydown', e => {
    const rows = [...list.querySelectorAll('[data-row]:not([disabled])')];
    if (!rows.length) return;
    const at = rows.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); rows[Math.min(rows.length - 1, at + 1)].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); (at <= 0 ? list.querySelector('.sh-search') ?? rows[0] : rows[at - 1]).focus(); }
    else if (e.key === 'Enter' && document.activeElement?.classList.contains('sh-search')) { e.preventDefault(); rows[0].click(); }
  });
  return list;
}

export const sectionLabel = (text, aside) =>
  h('div', { class: 'sh-section' }, h('span', { text }), aside ? h('span', { text: aside }) : null);

export const emptyNote = text => h('p', { class: 'sh-empty', text });

/** A small count beside a label; nothing when there is nothing to count. */
export const count = (n, tone = '') => (n ? h('span', { class: `sh-count ${tone}`.trim(), text: String(n) }) : null);

/** How many comments a screen has, as an icon and a number. */
export const commentCount = n => (n ? h('span', { class: 'sh-meta-count' }, icon('message', 12), String(n)) : null);

/** "1 screen", "3 screens". */
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
