// The one place the shell touches what it sits on: Marcus's template (its
// hidden switches, its page classes) and the live scripts' own interfaces
// (window.presentShell from live.js, window.presentComments from comments.js).
// Every other shell file goes through `engine`, so when the template or those
// scripts change, this is the only file to follow them.

const $ = selector => document.querySelector(selector);
const press = selector => $(selector)?.click();
const isOn = selector => $(selector)?.getAttribute('aria-checked') === 'true';
const body = document.body;
const root = document.documentElement;

export const engine = {
  // ── prototypes, who is looking, what the client sees (live.js) ──
  prototypes: () => window.presentShell,
  ready: () => Boolean(window.presentShell?.ready),
  live: () => window.presentLive,

  // ── screens ──
  screen: () => window.proto?.at?.() ?? '',
  step: id => window.proto?.step(id),
  /** Gives a prototype's page, opened outside the phone, the room the phone would take. */
  room: doc => window.presentShell?.room(doc),

  // ── comments (comments.js) ──
  comments: () => window.presentComments,

  // ── the template's switches ──
  theme: {
    isLight: () => body.classList.contains('light'),
    toggle: () => press('.theme-switch'),
  },
  labels: {
    exist: () => root.classList.contains('present-labels'),
    /** The template's labels script loads late (live.js): its switch works from then on. */
    ready: () => Boolean(window.presentGuidesLoaded),
    isOn: () => isOn('.notes-switch'),
    toggle: () => press('.notes-switch'),
  },
  pointer: {
    exists: () => root.classList.contains('present-hints'),
    isOn: () => isOn('.pointer-switch'),
    toggle: () => press('.pointer-switch'),
  },
  device: {
    isDesktop: () => root.classList.contains('proto-desktop'),
    get: () => (body.classList.contains('dev-android') ? 'android' : body.classList.contains('dev-none') ? 'none' : 'iphone'),
    set: value => window.protoSetDev?.(value),
  },
  background: {
    options: () => [...document.querySelectorAll('.bg-swatches [data-bg]')]
      .map(b => ({ value: b.dataset.bg, label: b.getAttribute('aria-label'), current: b.getAttribute('aria-checked') === 'true' })),
    set: value => press(`.bg-swatches [data-bg="${value}"]`),
  },
  preview: {
    isOn: () => body.classList.contains('ui-pinned'),
    toggle: () => window.protoToggleUI?.(),
  },

  /**
   * Esc closes one thing at a time (live/escape.js). `take` returns true when it
   * dealt with the key; higher priorities are asked first. Returns a remover.
   */
  onEscape: (priority, take) => window.presentEscape?.add(priority, take) ?? (() => {}),

  // ── the page ──
  pageIsLight: () => body.classList.contains('page-light'),
  toast: text => window.protoToast?.(text),
  /** The space the shell takes from the stage: the phone is fitted to what is left. */
  reserve(right) {
    root.style.setProperty('--shell-right', `${right}px`);
    dispatchEvent(new Event('resize'));
  },
  /** The phone's screen, and the prototype's page inside it. */
  stage() {
    const live = window.presentLive;
    return { screen: $('#screen'), frame: live?.frame };
  },

  /** Calls `changed` whenever anything the shell shows may have changed. */
  watch(changed) {
    for (const name of ['present-change', 'present-comments', 'present-guides']) addEventListener(name, changed);
    // The page's classes change for many reasons of the template's own (its pointer, its
    // fades). Only the ones the shell shows count as a change: a menu must not be redrawn
    // under someone's click because something unrelated moved.
    const SHOWN = ['light', 'page-light', 'ui-pinned', 'dev-android', 'dev-none', 'notes-on', 'comment-mode', 'rotated'];
    const look = () => SHOWN.map(name => body.classList.contains(name)).join() + root.className;
    let seen = look();
    const classesChanged = () => {
      // The template fades its controls and hides the cursor once the pointer
      // rests. The shell's bar stays put, so outside presenting that never holds.
      if (body.classList.contains('ui-idle') && !body.classList.contains('ui-pinned')) body.classList.remove('ui-idle');
      const now = look();
      if (now === seen) return;
      seen = now;
      changed();
    };
    new MutationObserver(classesChanged).observe(body, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(classesChanged).observe(root, { attributes: true, attributeFilter: ['class'] });
    for (const el of document.querySelectorAll('.notes-switch, .pointer-switch, .bg-swatches [data-bg]'))
      new MutationObserver(changed).observe(el, { attributes: true, attributeFilter: ['aria-checked'] });
    // (the prototype moves between screens by itself too: a tap inside it)
    let screen = engine.screen();
    setInterval(() => {
      const now = engine.screen();
      if (now !== screen) { screen = now; changed(); }
    }, 150);
  },
};
