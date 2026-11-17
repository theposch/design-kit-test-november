// Popovers: the menus hung under the buttons that open them (prototypes,
// screens, settings, share, and the small choice menus in menu.js). They all
// open, close, take Esc, close on a click outside and hold focus the same way.
//
// One shows at a time, except that a menu opened from inside a popover sits
// on top of it: `showing` is that stack, the outermost first.

import { clear, h, keepKeys } from './dom.js';
import { engine } from './engine.js';
import { subscribe } from './store.js';

const showing = [];

function place(pop, anchor, { align, side }) {
  const a = anchor.getBoundingClientRect();
  const width = pop.offsetWidth;
  let left = align === 'end' ? a.right - width : align === 'center' ? a.left + a.width / 2 - width / 2 : a.left;
  left = Math.max(8, Math.min(left, innerWidth - width - 8));
  pop.style.left = `${left}px`;
  if (side === 'top') {
    pop.style.maxHeight = `${a.top - 24}px`;
    pop.style.top = `${a.top - 8 - pop.offsetHeight}px`;
  } else {
    pop.style.top = `${a.bottom + 8}px`;
    pop.style.maxHeight = `${innerHeight - a.bottom - 24}px`;
  }
}

/** Closes the popover at `depth` and every one opened from inside it. */
function closeFrom(depth) {
  if (showing.length <= depth) return;
  while (showing.length > depth) {
    const entry = showing.pop();
    entry.stop();
    entry.pop.remove();
    entry.anchor.setAttribute('aria-expanded', 'false');
  }
  // (the one now on top held still while a menu was open over it: it catches up)
  showing[showing.length - 1]?.render();
}

export const closePopover = () => closeFrom(0);

// a press outside closes what it is outside of; a press on an opener is left to that opener
addEventListener('pointerdown', e => {
  if (!showing.length || showing.some(entry => entry.anchor.contains(e.target))) return;
  const inside = showing.findLastIndex(entry => entry.pop.contains(e.target));
  closeFrom(inside + 1);
}, true);
addEventListener('resize', () => { for (const entry of showing) entry.place(); });

/**
 * Wires `anchor` to open a popover. `build(close, kept)` returns its content
 * and is called again on every change while it is open, so content never goes
 * stale. `kept` lasts as long as the popover is open: a part puts there what
 * must survive a rebuild, such as its search box.
 */
export function attachPopover(anchor, { label, align = 'start', side = 'bottom', width, build }) {
  const where = { align, side };
  anchor.setAttribute('aria-haspopup', 'dialog');
  anchor.setAttribute('aria-expanded', 'false');
  const depthOf = () => showing.findIndex(entry => entry.anchor === anchor);

  const open = () => {
    // inside another popover: on top of it; anywhere else: in place of whatever is showing
    const depth = showing.findLastIndex(entry => entry.pop.contains(anchor)) + 1;
    closeFrom(depth);
    const pop = keepKeys(h('div', { class: 'sh-pop', role: 'dialog', 'aria-label': label }));
    if (width) pop.style.width = `${width}px`;
    const kept = {};   // what a part keeps between builds while this is open (a search box and its text)
    const close = () => closeFrom(depthOf());
    const entry = {
      pop,
      anchor,
      place: () => place(pop, anchor, where),
      render() {
        // (with a menu open over it, its content stays as it is: the menu's opener is part of it)
        if (showing[showing.length - 1] !== entry) return;
        const focused = pop.contains(document.activeElement) ? document.activeElement : null;
        clear(pop).append(build(close, kept));
        if (focused?.isConnected) focused.focus();
        entry.place();
      },
    };
    document.body.append(pop);
    showing.push(entry);
    entry.render();
    const unsubscribe = subscribe(entry.render);
    const stopEscape = engine.onEscape(100 + depth, () => {
      close();
      anchor.focus();
      return true;
    });
    entry.stop = () => {
      unsubscribe();
      stopEscape();
    };
    anchor.setAttribute('aria-expanded', 'true');
    (pop.querySelector('[autofocus]') ?? pop.querySelector('input, button'))?.focus();
  };

  anchor.addEventListener('click', () => (depthOf() >= 0 ? closeFrom(depthOf()) : open()));
  return { open, close: () => closeFrom(Math.max(0, depthOf())), isOpen: () => depthOf() >= 0 };
}
