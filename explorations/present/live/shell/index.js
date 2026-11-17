// The shell: the top bar and everything it opens, laid over Marcus's template
// (which keeps the phone, the labels, the pointer and the settings behind it).
//
//   engine.js   the only file that touches the template and the live scripts
//   store.js    what the shell remembers, and subscribe() / notify()
//   model.js, flow-layout.js   pure logic, tested (model.test.mjs)
//   dom.js, parts.js, popover.js, thumb.js, screen-card.js, panzoom.js,
//   menu.js, tap-targets.js, actions.js, icons.js, elk.js   shared pieces
//   topbar.js, *-picker.js, settings.js, share.js, screens-view.js,
//   flow-view.js, comments-panel.js, labels.js, samples.js   one part of the interface each
//
// It starts once live.js knows who is looking and what they may see.

import { mountCommentsPanel } from './comments-panel.js';
import { warmElk } from './elk.js';
import { engine } from './engine.js';
import { mountLabels, restoreLabels } from './labels.js';
import { addSamplesOnce } from './samples.js';
import { mountScreensView } from './screens-view.js';
import { notify } from './store.js';
import { mountTopBar } from './topbar.js';

function start() {
  mountTopBar();
  if (!engine.prototypes().empty) {
    mountScreensView();
    mountCommentsPanel();
    mountLabels();
    addSamplesOnce();
    warmElk();
  }
  engine.watch(notify);
  engine.onEscape(50, () => {
    if (!engine.preview.isOn()) return false;
    engine.preview.toggle();
    return true;
  });
  document.body.classList.add('sh-ready');
  if (engine.labels.ready()) restoreLabels();
  else addEventListener('present-guides', restoreLabels, { once: true });
}

if (!document.documentElement.classList.contains('embed')) {
  if (engine.ready()) start();
  else {
    const wait = () => {
      if (!engine.ready()) return;
      removeEventListener('present-change', wait);
      start();
    };
    addEventListener('present-change', wait);
  }
}
