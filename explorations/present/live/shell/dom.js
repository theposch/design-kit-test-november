// Small helpers for building the shell's elements. Every part of the shell
// makes its markup through h(), so listeners, labels and icons are set one way.

import { ICONS } from './icons.js';

/**
 * h('button', { class: 'sh-btn', 'aria-label': 'Share', onClick: fn }, icon('share'), 'Share')
 * Keys starting "on" are listeners; class, text, hidden, disabled, value and
 * dataset are set as properties; everything else is an attribute.
 * Children that are null, false or undefined are skipped.
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key === 'hidden' || key === 'disabled' || key === 'value' || key === 'checked') el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  el.append(...children.flat(Infinity).filter(c => c !== null && c !== undefined && c !== false));
  return el;
}

export function icon(name, size = 16) {
  const holder = document.createElement('span');
  holder.innerHTML = `<svg class="sh-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ''}</svg>`;
  return holder.firstChild;
}

/** A switch: on or off, announced as one, toggled by click or keyboard. */
export function toggle({ label, checked, onChange, disabled }) {
  const el = h('button', {
    class: 'sh-switch',
    role: 'switch',
    type: 'button',
    'aria-checked': String(Boolean(checked)),
    'aria-label': label,
    disabled,
    onClick: () => onChange(el.getAttribute('aria-checked') !== 'true'),
  }, h('i'));
  return el;
}

/** One of a few choices, as a row of buttons with the chosen one pressed. */
export function segmented({ label, options, value, onChange }) {
  return h('div', { class: 'sh-seg', role: 'group', 'aria-label': label },
    options.map(o => h('button', {
      type: 'button',
      class: 'sh-seg-item',
      'aria-pressed': String(o.value === value),
      onClick: () => onChange(o.value),
    }, o.icon ? icon(o.icon, 14) : null, o.label)));
}

/** Keys typed inside el stay there: the template listens for arrows, C, [ and ] on the whole page. */
export function keepKeys(el) {
  el.addEventListener('keydown', e => { if (e.key !== 'Escape') e.stopPropagation(); });
  el.addEventListener('pointerdown', e => e.stopPropagation());
  return el;
}

export const clear = el => { el.replaceChildren(); return el; };
