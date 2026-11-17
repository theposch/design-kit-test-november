// The screen menu: every screen of the prototype, under its group, with a
// search box. It replaces the row of screen names that ran out of room.

import { h, icon } from './dom.js';
import { engine } from './engine.js';
import { countByScreen, filterGroups, groupScreens } from './model.js';
import { arrowKeys, commentCount, emptyNote, plural, queryOf, searchBox, sectionLabel } from './parts.js';
import { setUi } from './store.js';

export function buildScreenPicker(close, kept) {
  const { screens } = engine.prototypes();
  const current = engine.screen();
  const counts = countByScreen(engine.comments()?.threads() ?? []);
  const groups = filterGroups(groupScreens(screens), queryOf(kept));
  const pick = id => { engine.step(id); close(); };

  return arrowKeys(h('div', { class: 'sh-pop-body' },
    searchBox(kept, `Search ${plural(screens.length, 'screen')}`),
    h('div', { class: 'sh-list' },
      groups.length ? null : emptyNote('No screen matches that.'),
      groups.map(group => [
        group.name ? sectionLabel(group.name) : null,
        group.screens.map(s => h('button', {
          class: `sh-row${s.id === current ? ' current' : ''}`,
          type: 'button',
          'data-row': true,
          'aria-current': s.id === current ? 'true' : null,
          onClick: () => pick(s.id),
        },
          h('span', { class: 'sh-row-num', text: String(s.number) }),
          h('span', { class: 'sh-row-main' }, h('b', { text: s.title })),
          commentCount(counts.get(s.id)))),
      ])),
    h('div', { class: 'sh-pop-foot' },
      h('button', { class: 'sh-btn quiet', type: 'button', onClick: () => { close(); setUi({ screens: 'grid' }); } }, icon('grid', 14), 'All screens'),
      h('button', { class: 'sh-btn quiet', type: 'button', onClick: () => { close(); setUi({ screens: 'flow' }); } }, icon('flow', 14), 'Flow'))));
}
