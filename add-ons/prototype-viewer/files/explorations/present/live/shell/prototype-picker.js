// The prototype menu: every prototype the person may see, under its round.
// MetaLab people also get a show-to-client switch on each, and an Arrange
// mode to reorder them and move them between rounds.

import { saving, setShown } from './actions.js';
import { h, icon, toggle } from './dom.js';
import { engine } from './engine.js';
import { menuButton } from './menu.js';
import { byRound, rearrange } from './model.js';
import { arrowKeys, emptyNote, plural, queryOf, searchBox, sectionLabel } from './parts.js';
import { notify } from './store.js';

function roundPicker(api, rounds, proto, extraRounds) {
  const names = [...new Set([...rounds.map(r => r.round), ...extraRounds])];
  return menuButton({
    label: `Round for ${proto.title}`,
    value: api.rank(proto.name).round,
    options: names.map(r => ({ value: r, label: r || 'No round' })),
    onChange: round => saving(() => api.arrange(rearrange(rounds, proto.name, { round })), 'Moved'),
    tone: 'quiet',
    align: 'end',
  });
}

function row(api, proto, { staff, arranging, rounds, extraRounds, close }) {
  const shown = api.shown(proto.name);
  const current = proto.name === api.proto.name;
  const move = step => saving(() => api.arrange(rearrange(rounds, proto.name, { move: step })));
  return h('div', { class: `sh-row-wrap${current ? ' current' : ''}` },
    h('button', {
      class: 'sh-row',
      type: 'button',
      'data-row': true,
      'aria-current': current ? 'true' : null,
      onClick: () => (current ? close() : api.go(proto.name)),
    },
      h('span', { class: 'sh-row-main' },
        h('b', { text: proto.title }),
        h('small', { text: [plural(proto.screens.length, 'screen'), staff && !shown ? 'hidden from the client' : ''].filter(Boolean).join(' · ') })),
      current ? icon('check', 14) : null),
    staff && arranging ? h('span', { class: 'sh-row-tools' },
      roundPicker(api, rounds, proto, extraRounds),
      h('button', { class: 'sh-icon-btn', type: 'button', 'aria-label': `Move ${proto.title} up`, onClick: () => move(-1) }, icon('arrowUp', 14)),
      h('button', { class: 'sh-icon-btn', type: 'button', 'aria-label': `Move ${proto.title} down`, onClick: () => move(1) }, icon('arrowDown', 14))) : null,
    staff && !arranging ? toggle({
      label: `Show ${proto.title} to the client`,
      checked: shown,
      onChange: on => setShown(proto.name, on),
    }) : null);
}

export function buildPrototypePicker(close, kept) {
  const api = engine.prototypes();
  const staff = api.staff() && !api.clientView();
  kept.newRounds ??= [];
  const query = queryOf(kept).trim().toLowerCase();
  const protos = Object.fromEntries(api.all.map(p => [p.name, p]));
  const names = api.visible().filter(n => protos[n].title.toLowerCase().includes(query));
  const rounds = byRound(api.visible(), n => api.rank(n).round);
  const visible = byRound(names, n => api.rank(n).round);
  const named = rounds.some(r => r.round) || kept.newRounds.length > 0;

  const list = h('div', { class: 'sh-list' },
    visible.length ? null : emptyNote(query ? 'No prototype matches that.' : 'Nothing to show yet.'),
    visible.map((r, i) => [
      named || (staff && i === 0)
        ? sectionLabel(r.round || (named ? 'No round' : 'Prototypes'), staff && !kept.arranging && i === 0 ? 'Shown to client' : null)
        : null,
      r.names.map(n => row(api, protos[n], { staff, arranging: kept.arranging, rounds, extraRounds: kept.newRounds, close })),
    ]),
    staff && kept.arranging ? kept.newRounds.filter(r => !rounds.some(x => x.round === r)).map(r => [sectionLabel(r), emptyNote('Empty. Move a prototype here with its round menu.')]) : null);

  const newRound = () => {
    const field = kept.roundField;
    const name = field.value.trim();
    if (!name) return field.focus();
    if (!kept.newRounds.includes(name)) kept.newRounds.push(name);
    field.value = '';
    notify();
  };
  if (staff) {
    const day = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    kept.roundField ??= h('input', {
      class: 'sh-input',
      type: 'text',
      placeholder: `Round ${new Set(rounds.map(r => r.round).filter(Boolean)).size + 1} · ${day}`,
      'aria-label': 'New round name',
      onKeydown: e => { if (e.key === 'Enter') newRound(); },
    });
  }

  return arrowKeys(h('div', { class: 'sh-pop-body' },
    searchBox(kept, 'Search prototypes'),
    list,
    staff && kept.arranging ? h('div', { class: 'sh-pop-row' }, kept.roundField, h('button', { class: 'sh-btn', type: 'button', onClick: newRound }, icon('plus', 14), 'Add round')) : null,
    staff ? h('div', { class: 'sh-pop-foot' },
      h('button', { class: 'sh-btn quiet', type: 'button', 'aria-pressed': String(Boolean(kept.arranging)), onClick: () => { kept.arranging = !kept.arranging; notify(); } },
        kept.arranging ? 'Done' : 'Arrange'),
      h('button', { class: 'sh-btn quiet', type: 'button', onClick: () => { close(); api.setAsClient(true); } }, icon('eye', 14), 'Preview as client')) : null,
    api.staff() && api.clientView() ? h('div', { class: 'sh-pop-foot' },
      h('span', { class: 'sh-note', text: 'You are seeing what the client sees.' }),
      h('button', { class: 'sh-btn quiet', type: 'button', onClick: () => { close(); api.setAsClient(false); } }, 'Back to staff view')) : null));
}
