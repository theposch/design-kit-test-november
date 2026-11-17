// The phone frame and theme from Marcus Brown's prototype template, kept as
// he wrote them. In his template these live inside the sample app (js/app.js);
// here they stand alone, because the sample app is replaced by a live
// prototype in an iframe (live.js).

(() => {
  const $ = s => document.querySelector(s);
  const device = $('#device'), screen = $('#screen');
  const body = document.body;

  // ── fit the device to the window ──
  // on a phone (any window 500 wide or less) the design fills the screen:
  // scaled to the width, grown or shrunk to the height, no frame. Wider,
  // it's the framed device, fitted to the window.
  const root = document.documentElement;
  const fit = () => {
    const phone = innerWidth <= 500;
    if (phone) {
      // inset as a card, leaving a slim bar above (switches) and below (steps);
      // a thumbnail in the 5 phones (embedded) still fills its frame
      const embed = root.classList.contains('embed') || body.classList.contains('m-full');   // fullscreen: the design fills the phone
      const cs = getComputedStyle(root);
      const top = embed ? 0 : parseFloat(cs.getPropertyValue('--m-top')) || 56, bot = embed ? 0 : parseFloat(cs.getPropertyValue('--m-bot')) || 64, side = embed ? 0 : 12;
      const s = (innerWidth - side * 2) / 402;
      const H = Math.round((innerHeight - top - bot) / s);
      root.style.setProperty('--h', H + 'px');
      root.style.setProperty('--m-foot', (innerHeight - top - H * s) + 'px');   // exactly where the design's foot sits, from the window's bottom
      device.style.setProperty('--fit', s);
      return;
    }
    root.style.removeProperty('--h');
    // embedded (a zoom-out thumbnail): the screen alone, at its own size
    // desktop screens (V.1): the window fills the page, inset for the controls round it, at 1:1 — the layouts respond to its size
    if (root.classList.contains('proto-desktop') && !phone) {
      const TB = 28;   // the browser window's title bar
      const embed = root.classList.contains('embed'), full = embed || body.classList.contains('ui-pinned');   // preview (space): the design fills the page
      const panelW = full ? 0 : parseFloat(getComputedStyle(root).getPropertyValue('--shell-right')) || 0;
      const availW = full ? innerWidth : innerWidth - 2 * 48 - panelW, availH = full ? innerHeight : innerHeight - 92 - 48 - TB;
      // a chosen screen size: the same design every time (laid out at 1440, never reflowed), scaled evenly;
      // only the window's shape follows the screen — 1440 × 900, 1920 × 1080, 2560 × 1440 — centred in the space
      const SIZES = { 1440: 900, 1920: 1080, 2560: 1440 }, size = full ? 0 : parseInt(root.dataset.screen) || 0, BASE = 1440, WIDE = 1280;
      let W, H, f = 1, top = 92;
      if (SIZES[size]) {
        W = BASE; H = Math.round(BASE * SIZES[size] / size);
        f = Math.min(availW / W, (availH + TB) / (H + TB));
        top = Math.round(92 + (availH + TB - (H + TB) * f) / 2);
      } else if (!embed && availW > WIDE) {
        // a big window: the design keeps its 1280 layout and scales up evenly to fill it, rather than leaving wide empty margins
        const bar = full ? 0 : TB;
        W = WIDE; f = availW / WIDE; H = Math.round((availH + bar) / f - bar);
      } else { W = Math.max(640, availW); H = Math.max(420, availH); }   // smaller: it reflows to fit
      body.style.setProperty('--w', W + 'px'); body.style.setProperty('--h', H + 'px'); body.style.setProperty('--hh', Math.round(Math.min(420, Math.max(240, H * .46))) + 'px');
      body.style.setProperty('--dtop', top + 'px');
      device.style.setProperty('--fit', f);
      const key = W + 'x' + H + '@' + f.toFixed(4);
      if (key !== fit.key) { fit.key = key; dispatchEvent(new Event('proto-fit')); }   // pieces placed in pixels re-place themselves
      return;
    }
    fit.key = '';
    body.style.removeProperty('--w'); body.style.removeProperty('--h'); body.style.removeProperty('--hh'); body.style.removeProperty('--dtop');
    if (document.documentElement.classList.contains('embed') && !phone) { device.style.setProperty('--fit', 1); return; }
    // desktop: fitted to the width only — a tall window the page scrolls down
    if (body.classList.contains('dev-desktop') && !phone) {
      const s = Math.min(1, (innerWidth - 200) / device.offsetWidth);
      device.style.setProperty('--fit', s);
      document.documentElement.style.setProperty('--doc-h', Math.ceil(device.offsetHeight * s + 170) + 'px');
      return;
    }
    const s = phone ? innerWidth / 402
      : (() => {
          // on its side (rotate.js) the phone's width and height swap; leave
          // room above and below for the controls, and either side for the arrows
          const side = Math.abs(window.protoRotation?.() || 0) > 45;
          const w = side ? device.offsetHeight : device.offsetWidth, h = side ? device.offsetWidth : device.offsetHeight;
          // (the shell's top bar takes 56 above; an open side panel takes its width on the right)
          const preview = body.classList.contains('ui-pinned');
          const top = preview ? 0 : 56, right = preview ? 0 : parseFloat(getComputedStyle(root).getPropertyValue('--shell-right')) || 0;
          return Math.min(1, (innerHeight - top - 88) / h, (innerWidth - right - 120) / w);
        })();
    device.style.setProperty('--fit', s);
  };
  addEventListener('resize', fit);
  // phones settle their viewport late (and toolbars come and go): refit whenever it changes
  addEventListener('load', fit);
  window.visualViewport?.addEventListener('resize', fit);
  new ResizeObserver(fit).observe(document.documentElement);
  fit();
  // preview on / off (desktop V.1): the window zooms between its inset box and the whole page.
  // The new layout goes in at once; it then starts scaled (evenly, never stretched) and cropped
  // to exactly where the old one sat, and eases out to its own size — one fluid scale, no reflow mid-way.
  let pvFrom = null, pvWas = body.classList.contains('ui-pinned'), pvT = 0;
  window.protoBeforePreview = () => {
    if (!root.classList.contains('proto-desktop') || innerWidth <= 500) return (pvFrom = null);
    const r = screen.getBoundingClientRect();
    pvFrom = { x: r.left, y: r.top, w: r.width, h: r.height, rad: body.classList.contains('ui-pinned') ? 0 : 12 };
  };
  const zoomFrom = from => {
    const EASE = 'cubic-bezier(.22, 1, .36, 1)', MS = 620;
    device.style.transition = 'none'; device.style.removeProperty('transform'); device.style.removeProperty('clip-path');
    const f = parseFloat(device.style.getPropertyValue('--fit')) || 1;
    const dev = device.getBoundingClientRect(), to = screen.getBoundingClientRect();
    const Wd = device.offsetWidth, Hd = device.offsetHeight;                // the window's own (unscaled) size
    const s = Math.max(from.w / to.width, from.h / to.height);             // covers the old box: an even scale
    // the screen's centre, on the page (C) and in the window's own pixels (c); the window scales about its top middle (O)
    const C = { x: to.left + to.width / 2, y: to.top + to.height / 2 }, c = { x: (C.x - dev.left) / f, y: (C.y - dev.top) / f }, O = { x: Wd / 2, y: 0 };
    const F = { x: from.x + from.w / 2, y: from.y + from.h / 2 };
    const tx = F.x - C.x - f * (s - 1) * (c.x - O.x), ty = F.y - C.y - f * (s - 1) * (c.y - O.y);
    const hw = from.w / (2 * f * s), hh = from.h / (2 * f * s);
    const endRad = body.classList.contains('ui-pinned') ? 0 : 12;
    device.style.setProperty('transform', `translateX(-50%) translate(${tx}px, ${ty}px) scale(${f * s})`, 'important');
    device.style.setProperty('clip-path', `inset(${c.y - hh}px ${Wd - c.x - hw}px ${Hd - c.y - hh}px ${c.x - hw}px round ${from.rad / (f * s)}px)`, 'important');
    device.offsetWidth;
    device.style.transition = `transform ${MS}ms ${EASE}, clip-path ${MS}ms ${EASE}`;
    device.style.setProperty('transform', `translateX(-50%) translate(0px, 0px) scale(${f})`, 'important');
    device.style.setProperty('clip-path', `inset(0px 0px 0px 0px round ${endRad}px)`, 'important');
    clearTimeout(pvT);
    pvT = setTimeout(() => { device.style.transition = ''; device.style.removeProperty('transform'); device.style.removeProperty('clip-path'); }, MS + 40);
  };
  new MutationObserver(() => {
    const pv = body.classList.contains('ui-pinned');
    if (pv === pvWas) return;
    pvWas = pv;
    if (!root.classList.contains('proto-desktop') || innerWidth <= 500) return;
    fit();
    if (pvFrom) zoomFrom(pvFrom);
    pvFrom = null;
  }).observe(body, { attributes: true, attributeFilter: ['class'] });


  // ── theme: dark (default) or light, from the toggle, ?theme=, or last time ──
  let theme = ['dark', 'light'].find(t => t === new URLSearchParams(location.search).get('theme')) || null;
  // every visit starts in light mode (?theme=dark starts dark)
  const setTheme = t => {
    theme = t === 'light' ? 'light' : 'dark';
    body.classList.toggle('light', theme === 'light');
    $('.theme-switch').setAttribute('aria-checked', theme === 'light');
    try { localStorage.setItem('intro-theme', theme); } catch {}
  };
  $('.theme-switch').addEventListener('click', () => { setTheme(theme === 'light' ? 'dark' : 'light'); window.protoToast?.(theme === 'light' ? 'Light mode' : 'Dark mode'); });   // (a label top centre, as the other switches)
  // the small phones in the 5-phones view follow the theme switch as it's flipped
  addEventListener('storage', e => { if (e.key === 'intro-theme' && e.newValue && e.newValue !== theme) setTheme(e.newValue); });
  setTheme(theme || 'light');                        // light unless ?theme=dark or dark was chosen last time
})();
