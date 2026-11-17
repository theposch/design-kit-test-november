// A choice from a short list, as a button showing what is chosen and a menu
// of the options: the shell's own dropdown, in place of the browser's, so it
// looks and behaves like every other menu here.

import { h, icon } from './dom.js';
import { arrowKeys } from './parts.js';
import { attachPopover } from './popover.js';

/**
 * menuButton({ label: 'Part of the prototype', value, options: [{ value, label }], onChange })
 * `label` names the choice for screen readers and the menu; `tone` is the button's style.
 */
export function menuButton({ label, value, options, onChange, tone = 'outline', align = 'start' }) {
  const chosen = options.find(o => o.value === value) ?? options[0];
  const button = h('button', { class: `sh-btn ${tone} sh-menu-btn`, type: 'button', 'aria-label': `${label}: ${chosen.label}` },
    h('span', { text: chosen.label }), icon('chevronDown', 14));
  attachPopover(button, {
    label,
    align,
    build: close => arrowKeys(h('div', { class: 'sh-pop-body sh-menu', role: 'menu' },
      options.map(option => h('button', {
        class: `sh-row${option.value === value ? ' current' : ''}`,
        type: 'button',
        role: 'menuitemradio',
        'aria-checked': String(option.value === value),
        'data-row': true,
        autofocus: option.value === value,
        onClick: () => {
          close();
          if (option.value !== value) onChange(option.value);
        },
      }, h('span', { class: 'sh-row-main' }, h('b', { text: option.label })), option.value === value ? icon('check', 14) : null)))),
  });
  return button;
}
