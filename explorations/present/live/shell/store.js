// What the shell itself remembers (which panel is open, which view of the
// screens), and one way to hear about any change: subscribe(). Parts render
// from the engine and this state; none of them talks to another directly.

const listeners = new Set();
let queued = false;

export const ui = {
  panel: null,        // 'comments' | null: the side panel
  screens: null,      // 'grid' | 'flow' | null: the all-screens view
  flowGroup: '',      // the group the flow view is narrowed to ('' = every screen)
  flowFrames: null,   // true: a frame per group; false: one flow; null: whichever suits the prototype's size
  placing: null,      // 'label' | null: waiting for a click on the screen
  thread: null,       // the comment thread open in the panel
};

export function subscribe(render) {
  listeners.add(render);
  return () => listeners.delete(render);
}

/** Tells every part to render again, once per frame however many things changed. */
export function notify() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    for (const render of listeners) render();
  });
}

export function setUi(patch) {
  Object.assign(ui, patch);
  notify();
}

/** A value kept in this browser between visits (a last-seen time, a zoom level). */
export const remembered = {
  get(key) {
    try { return localStorage.getItem(`present-${key}`); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(`present-${key}`, value); } catch {}
  },
};
