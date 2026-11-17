// Drag to move, scroll to pan, pinch or ctrl/cmd + scroll to zoom: the
// gestures of a design canvas, for any element. It knows nothing about what
// is drawn; it keeps a view ({ scale, x, y }) and applies it to `content`.

import { zoomAbout } from './flow-layout.js';

export function panZoom(viewport, content, { onChange } = {}) {
  let view = { scale: 1, x: 0, y: 0 };
  let moved = false;

  const apply = () => {
    content.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
    onChange?.(view);
  };
  const set = next => { view = next; apply(); };
  const pointIn = e => {
    const r = viewport.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    // (a pinch on a trackpad arrives as a wheel with ctrl held)
    if (e.ctrlKey || e.metaKey) set(zoomAbout(view, pointIn(e), view.scale * Math.exp(-e.deltaY * 0.01)));
    else set({ ...view, x: view.x - e.deltaX, y: view.y - e.deltaY });
  }, { passive: false });

  let drag = null;
  viewport.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('[data-no-pan]')) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, from: view };
    moved = false;
  });
  viewport.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!moved && Math.hypot(dx, dy) < 4) return;   // a click, until it travels
    if (!moved) viewport.setPointerCapture(drag.id);
    moved = true;
    viewport.classList.add('panning');
    set({ ...drag.from, x: drag.from.x + dx, y: drag.from.y + dy });
  });
  const end = () => {
    drag = null;
    viewport.classList.remove('panning');
  };
  viewport.addEventListener('pointerup', end);
  viewport.addEventListener('pointercancel', end);
  // a drag must not also count as a click on whatever it ended over
  viewport.addEventListener('click', e => {
    if (!moved) return;
    moved = false;
    e.stopPropagation();
    e.preventDefault();
  }, true);

  return {
    get: () => view,
    set,
    /** Zooms in or out about the middle of the viewport. */
    zoomBy(factor) {
      const r = viewport.getBoundingClientRect();
      set(zoomAbout(view, { x: r.width / 2, y: r.height / 2 }, view.scale * factor));
    },
    /** A spot in the viewport, in the content's own pixels. */
    toContent(e) {
      const p = pointIn(e);
      return { x: (p.x - view.x) / view.scale, y: (p.y - view.y) / view.scale };
    },
  };
}
