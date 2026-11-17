// Rotate + step arrows
//
// Rotate: a handle on the phone's top-right corner. Drag it round and, past
// a small turn, it snaps to landscape (or back upright); a plain click flips it.
// The phone rescales to fit either way. Notes and the pointer hint hide
// while it's on its side.
//
// Arrows: small ‹ › either side of the phone step through the screens in
// order (start, loader, article, menu), the same as the step bar.

(() => {
  const $ = s => document.querySelector(s);
  const body = document.body, device = $('#device');
  const ORDER = ['loader', 'start', 'article', 'full', 'menu'];

  // ── rotation ──
  let rot = 0;                                        // degrees, 0 or ±90 at rest
  const setRot = (deg, snap) => {
    rot = deg;
    device.classList.toggle('rot-snap', !!snap);
    device.style.setProperty('--rot', `${deg}deg`);
    body.classList.toggle('rotated', Math.abs(deg) > 45);
    dispatchEvent(new Event('resize'));               // the phone refits for its new shape
    place();
  };
  window.protoRotation = () => rot;
  window.protoSetRotation = deg => setRot(deg, false);   // (the 5-phones view puts the phone upright)

  ['tr'].forEach(c => {
    const g = document.createElement('span');
    g.className = `rot-grip ${c}`;
    g.title = 'Drag to rotate';
    g.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg>';
    device.appendChild(g);
    g.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation();
      try { g.setPointerCapture(e.pointerId); } catch {}
      const r = device.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const a0 = Math.atan2(e.clientY - cy, e.clientX - cx), start = rot, x0 = e.clientX, y0 = e.clientY;
      let moved = false;
      body.classList.add('rotating');
      const move = ev => {
        if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 4) moved = true;
        const a = Math.atan2(ev.clientY - cy, ev.clientX - cx);
        let d = start + (a - a0) * 180 / Math.PI;
        d = Math.max(-100, Math.min(100, d));
        device.classList.remove('rot-snap');
        device.style.setProperty('--rot', `${d}deg`);
        rot = d;
      };
      const up = () => {
        g.removeEventListener('pointermove', move);
        body.classList.remove('rotating');
        // a click flips it; a drag snaps once it has turned 20° either way
        const upright = Math.abs(start) < 45;
        const target = !moved ? (upright ? 90 : 0)
          : upright ? (rot - start > 20 ? 90 : rot - start < -20 ? -90 : 0)
          : (Math.abs(rot - start) > 20 ? 0 : start);
        setRot(target, true);
      };
      g.addEventListener('pointermove', move);
      g.addEventListener('pointerup', up, { once: true });
      g.addEventListener('pointercancel', up, { once: true });
    });
  });

  // ── step arrows ──
  const arrows = ['prev', 'next'].map(dir => {
    const b = document.createElement('button');
    b.className = `step-arrow sa-${dir}`;
    b.setAttribute('aria-label', dir === 'prev' ? 'Previous screen' : 'Next screen');
    b.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}"/></svg>`;
    b.addEventListener('click', () => {
      // with Skip loader on, the loader isn't one of the screens
      const order = [...document.querySelectorAll('.steps [data-step]')].map(x => x.dataset.step).filter(k => !(k === 'loader' && body.classList.contains('skip-loader')));   // the bar's own order: screens, or modes
      // step from the screen the bar shows (set the moment a step is chosen), not the one still animating in
      const shown = document.querySelector('.steps [data-step][aria-current="true"]')?.dataset.step || window.proto.at();
      const at = Math.max(0, order.indexOf(shown));
      const to = order[(at + (dir === 'prev' ? -1 : 1) + order.length) % order.length];
      document.querySelector(`.steps [data-step="${to}"]`)?.click();   // same path as the step bar (its pill follows)
      // a little nudge of the whole phone the way it's going, as a drag would give, then it springs back
      if (!body.classList.contains('zoom-open')) {
        const d = dir === 'prev' ? 1 : -1;
        device.style.transition = 'translate .16s cubic-bezier(.3, 0, .2, 1)'; device.style.translate = `${d * 16}px 0`;
        clearTimeout(b._n); b._n = setTimeout(() => { device.style.transition = 'translate .55s cubic-bezier(.22, 1, .36, 1)'; device.style.translate = ''; setTimeout(() => { if (!device.style.translate) device.style.transition = ''; }, 560); }, 160);
      }
    });
    body.appendChild(b);
    return b;
  });
  // at the window's edges, level
  // with the phone's middle; kept in place every frame (the phone rescales,
  // rotates and changes frame)
  let last = '';
  function place() {
    const phone = innerWidth <= 500;
    const r = device.getBoundingClientRect(), y = Math.round(phone ? (document.querySelector('.steps-chip')?.getBoundingClientRect().top + 15 || r.bottom + 24) - 15 : (body.classList.contains('dev-desktop') ? innerHeight / 2 : r.top + r.height / 2) - 15);
    // out at the window's edges, clear of the notes beside the phone (on a phone: under it, at the corners)
    let lx = phone ? 12 : 24, rx = innerWidth - (phone ? 12 : 24) - 30;
    // on a phone: either side of the pagination dots, under the design
    // on a phone: either side of the step label, under the design
    // (fixed either side of the centre, so they stay put whatever the label's length)
    if (phone) { lx = Math.round(innerWidth / 2 - 96 - 30); rx = Math.round(innerWidth / 2 + 96); }
    const key = lx + ',' + rx + ',' + y;
    if (key !== last) {
      last = key;
      arrows[0].style.left = lx + 'px'; arrows[1].style.left = rx + 'px';
      arrows.forEach(a => { a.style.top = y + 'px'; });
    }
  }
  const loop = () => { place(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
})();
