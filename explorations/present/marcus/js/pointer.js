// Pointer hints
//
// A switch top left (or P) turns on a mouse pointer that shows where to
// interact on the current screen, looping gently:
//   home     glides onto the entry point and taps it
//   detail      taps the hero (it opens fullscreen)
//   fullscreen  taps close
//   menu     taps the card in the middle
// It waits for the screen to settle before it starts, and fades out while
// anything is moving.

(() => {
  const $ = s => document.querySelector(s);
  const body = document.body, device = $('#device');
  const has = c => body.classList.contains(c);

  const centredCard = () => {
    const sr = $('#screen').getBoundingClientRect(), mid = sr.left + sr.width / 2;
    let best = null, bd = Infinity;
    document.querySelectorAll('#overview .ov-card').forEach(c => {
      const r = c.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid);
      if (d < bd) { bd = d; best = c; }
    });
    return best;
  };

  // [screen, element, gesture, where on it (0–1)]
  const HINTS = [
    [() => !has('brief-open'), () => $('#home .list .row'), 'tap', [.45, .55]],   // the first article row opens the page
    [() => has('fs-open'), () => $('.fs-close'), 'tap', [.5, .5]],
    [() => has('brief-done') && !has('ov-open') && !$('.page.cur.done-page'), () => $('.page.cur .a-hero'), 'tap', [.6, .55]],
    [() => has('ov-open'), () => null, 'tap', [.5, .5]],     // no hint on the list
  ];

  // the pointer rides the phone so it scales with it
  const layer = document.createElement('div');
  layer.className = 'pointer-layer';
  layer.innerHTML = `<div class="hint-cursor"><span class="hc-ripple"></span>
    <svg class="hc-arrow" width="26" height="26" viewBox="0 0 24 24"><path d="M5 3.2l13.6 7.9-5.9 1.4-2.6 5.8z" fill="#fff" stroke="#111317" stroke-width="1.4" stroke-linejoin="round"/></svg></div>`;
  device.appendChild(layer);
  const cursor = layer.querySelector('.hint-cursor');

  const fit = () => parseFloat(device.style.getPropertyValue('--fit')) || 1;
  let on = false, raf = 0, sig = '', still = 0, gesture = '';
  const SETTLE = 450;

  function frame() {
    const now = performance.now(), s = fit(), d = device.getBoundingClientRect();
    const hint = HINTS.find(h => h[0]());
    const el = hint && hint[1]();
    const r = el && el.getBoundingClientRect();
    const ok = r && r.width > 4 && r.height > 4 && getComputedStyle(el).visibility !== 'hidden';
    if (ok) {
      const key = `${hint[2]}|${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}`;
      if (key !== sig) { sig = key; still = now; }
      cursor.style.left = ((r.left - d.left) / s + (r.width / s) * hint[3][0]) + 'px';
      cursor.style.top = ((r.top - d.top) / s + (r.height / s) * hint[3][1]) + 'px';
    } else sig = '';
    const show = ok && now - still >= SETTLE;
    if (show && gesture !== hint[2]) {                 // restart the loop for a new gesture
      gesture = hint[2];
      cursor.className = 'hint-cursor';
      void cursor.offsetWidth;
      cursor.classList.add(gesture);
    }
    cursor.classList.toggle('show', !!show);
    if (!show) gesture = '';
    raf = requestAnimationFrame(frame);
  }

  const sw = $('.pointer-switch');
  const set = v => {
    on = v;
    sw.setAttribute('aria-checked', v);
    body.classList.toggle('pointer-on', v);
    try { localStorage.setItem('intro-pointer', v ? '1' : '0'); } catch {}
    cancelAnimationFrame(raf);
    if (v) raf = requestAnimationFrame(frame);
    else { cursor.classList.remove('show'); gesture = ''; }
  };
  sw.addEventListener('click', () => set(!on));
  // the small phones in the zoom-out follow the switch as it's flipped
  addEventListener('storage', e => { if (e.key === 'intro-pointer') set(e.newValue === '1'); });
  // on by default; ?pointer=0 or switching it off (remembered) turns it off
  const q = new URLSearchParams(location.search).get('pointer');
  let saved = q === null ? true : q === '1';
  // every visit starts with the cursor on (?pointer=0 turns it off)
  set(saved);
})();
