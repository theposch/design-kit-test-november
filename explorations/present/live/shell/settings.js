// The settings menu: how the prototype is framed and what surrounds it.
// Each row drives one of the template's own settings through the engine.

import { saving } from './actions.js';
import { h, icon, segmented, toggle } from './dom.js';
import { engine } from './engine.js';
import { hasSamples, resetSamples } from './samples.js';

const row = (title, hint, control) =>
  h('div', { class: 'sh-setting' }, h('div', {}, h('b', { text: title }), hint ? h('small', { text: hint }) : null), control);

export function buildSettings(close) {
  const api = engine.prototypes();
  const swatches = engine.background.options();
  return h('div', { class: 'sh-pop-body' },
    row('Appearance', 'The prototype in light or dark', segmented({
      label: 'Appearance',
      value: engine.theme.isLight() ? 'light' : 'dark',
      options: [{ value: 'light', label: 'Light', icon: 'sun' }, { value: 'dark', label: 'Dark', icon: 'moon' }],
      onChange: value => { if ((value === 'light') !== engine.theme.isLight()) engine.theme.toggle(); },
    })),
    engine.device.isDesktop() ? null : row('Device', 'The frame around the screen', segmented({
      label: 'Device',
      value: engine.device.get(),
      options: [{ value: 'iphone', label: 'iPhone' }, { value: 'android', label: 'Android' }, { value: 'none', label: 'None' }],
      onChange: engine.device.set,
    })),
    swatches.length ? row('Background', 'The colour around the prototype',
      h('div', { class: 'sh-swatches', role: 'group', 'aria-label': 'Background' }, swatches.map(s => h('button', {
        type: 'button',
        class: 'sh-swatch',
        'aria-label': s.label,
        'aria-pressed': String(s.current),
        title: s.label,
        style: s.value === 'auto' ? null : `--swatch:${s.value}`,
        onClick: () => engine.background.set(s.value),
      })))) : null,
    engine.pointer.exists() ? row('Pointer', 'Shows where to tap next', toggle({
      label: 'Pointer',
      checked: engine.pointer.isOn(),
      onChange: engine.pointer.toggle,
    })) : null,
    api.staff() ? row('Client view', 'See only what the client sees', toggle({
      label: 'Client view',
      checked: api.asClient(),
      onChange: on => { close(); api.setAsClient(on); },
    })) : null,
    hasSamples() ? row('Sample comments', 'Start again from the ones this prototype came with',
      h('button', { class: 'sh-btn outline', type: 'button', onClick: () => { close(); saving(resetSamples, 'Sample comments are back'); } }, 'Reset')) : null,
    h('div', { class: 'sh-pop-foot' },
      h('button', { class: 'sh-btn quiet', type: 'button', onClick: () => { close(); engine.preview.toggle(); } }, icon('play', 14), 'Present'),
      h('span', { class: 'sh-note' }, h('kbd', { text: 'Space' }), ' hides everything but the prototype')));
}
