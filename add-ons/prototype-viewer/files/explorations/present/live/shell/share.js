// The share menu: whether the client sees this prototype, and a link to it
// that opens on the screen being looked at. Who may open the link is set on
// Metalab Sites: the viewer's page can't read or change that.

import { setShown } from './actions.js';
import { h, icon, toggle } from './dom.js';
import { engine } from './engine.js';
import { shareLink } from './model.js';

const SITES = 'https://sites.metalab.com';

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    engine.toast('Link copied');
  } catch {
    engine.toast('Could not copy. Select the link and copy it');
  }
}

export function buildShare() {
  const api = engine.prototypes();
  const staff = api.staff() && !api.clientView();
  const { proto, screens } = api;
  const screen = screens.find(s => s.id === engine.screen()) ?? screens[0];
  const link = shareLink(location.href, proto.name, screen.id);
  const field = h('input', { class: 'sh-input', type: 'text', readonly: true, value: link, 'aria-label': 'Link to this prototype', onFocus: e => e.target.select() });

  return h('div', { class: 'sh-pop-body' },
    h('b', { class: 'sh-pop-title', text: `Share ${proto.title}` }),
    staff ? h('div', { class: 'sh-setting boxed' },
      h('div', {}, h('b', { text: 'Shown to client' }), h('small', { text: 'People on the guest list can open it. Turn off to hide it again.' })),
      toggle({
        label: 'Shown to client',
        checked: api.shown(proto.name),
        onChange: on => setShown(proto.name, on),
      })) : null,
    h('div', { class: 'sh-field' },
      h('b', { text: 'Link to this prototype' }),
      h('div', { class: 'sh-pop-row' }, field, h('button', { class: 'sh-btn', type: 'button', onClick: () => copy(link) }, icon('copy', 14), 'Copy link')),
      h('small', { text: `Opens on the screen you're viewing: ${screens.indexOf(screen) + 1} · ${screen.title}.` })),
    h('div', { class: 'sh-pop-foot' },
      h('span', { class: 'sh-note', text: 'Only people on the guest list can open the link.' }),
      staff ? h('a', { class: 'sh-btn quiet', href: SITES, target: '_blank', rel: 'noreferrer' }, 'Manage access', icon('external', 14)) : null));
}
