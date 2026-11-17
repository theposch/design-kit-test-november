// Intro · mobile prototype
//
// Tapping the entry point turns its gradient stroke into the loader:
//   1. the card's globe and text fade, the rest of home falls away
//   2. .morph is dropped exactly over the card (same fill, same stroke)
//      and the card is hidden, so nothing visibly swaps
//   3. .morph grows into the loader frame; its fill fades to the screen
//   4. the eyebrow cycles categories while the loader runs
//   5. after a few seconds the frame opens out to the screen edge and
//      hands over to article 1
//
// Two loader versions, switched with the toggle (or V, or ?v=globe):
//   stroke — a comet travels round the stroke
//   globe  — the same, and the CTA's own globe rides the morph into the
//            frame and spins
//
// Tap the loader or press Esc to run it back; the article's × goes home.

(() => {
  const $ = s => document.querySelector(s);
  const device = $('#device'), screen = $('#screen');
  const card = $('.brief'), morph = $('.morph'), eyebrow = $('.eyebrow');
  const mGlobe = morph.querySelector('.globe'), cGlobe = card.querySelector('.globe');
  const body = document.body;

  // centred in the screen (86, 287 on the phone's 402 × 874), so the desktop window centres it too
  const scrW = () => document.querySelector('#screen').offsetWidth || 402, scrH = () => document.querySelector('#screen').offsetHeight || 874;
  const LOADER = { get left() { return (scrW() - 230) / 2; }, get top() { return (scrH() - 300) / 2; }, width: 230, height: 300 };
  const LOADER_GLOBE = { left: 65, top: 82, width: 100, height: 100 };
  // .a-hero at scroll 0: full bleed, under the header — as wide as the screen and as tall as the device's hero
  const HERO = { left: 0, top: 0, get width() { return document.querySelector('#screen').offsetWidth; }, get height() { return parseFloat(getComputedStyle(document.body).getPropertyValue('--hh')) || 416; } };
  const LOAD_MS = 2800;           // time on the loader before the article

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
      const availW = full ? innerWidth : innerWidth - 2 * 132, availH = full ? innerHeight : innerHeight - 92 - 108 - TB;
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
          return Math.min(1, (innerHeight - 170) / h, (innerWidth - 170) / w);
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

  // ── globe asset: fall back to the drawn sphere until assets/globe.png exists ──
  document.querySelectorAll('.globe img').forEach(img => {
    const ok = () => img.parentElement.classList.add('has-img');
    if (img.complete && img.naturalWidth) ok(); else img.addEventListener('load', ok);
  });

  // ── version ──
  let version = 'stroke';                          // the intro's stroke version
  const setVersion = v => {
    version = v === 'globe' ? 'globe' : 'stroke';
    body.classList.toggle('v-globe', version === 'globe');
    $('.style-switch')?.setAttribute('aria-checked', version === 'globe');
    try { localStorage.setItem('intro-version', version); } catch {}
  };

  // ── spin ──
  // Angles are integrated rather than keyed off the clock so each spin
  // eases up to speed and back down without jumping. The comet runs round
  // the stroke in both versions; in the globe version the globe turns too.
  const spinner = () => ({ angle: 0, vel: 0, target: 0 });
  const stroke = spinner(), globe = spinner();
  const SPEED = { stroke: 170, globe: 70 };      // deg/s at full speed
  let last = 0, raf = 0;
  const step = (c, dt) => {
    c.vel += (c.target - c.vel) * Math.min(1, dt * 2.2);
    c.angle += c.vel * dt;
    if (c.target === 0 && Math.abs(c.vel) < 2) {
      const d = ((0 - c.angle) % 360 + 540) % 360 - 180;     // settle the shortest way round
      c.angle += d * Math.min(1, dt * 6);
      if (Math.abs(d) < .3) { c.angle = 0; c.vel = 0; return false; }
    }
    return true;
  };
  const apply = () => {
    screen.style.setProperty('--a', `${stroke.angle}deg`);   // every stroke on screen but the CTA's (which has its own)
    window.globe3d?.setAngle(globe.angle);
  };
  const tick = t => {
    const dt = last ? Math.min(.05, (t - last) / 1000) : 0; last = t;
    const moving = [step(stroke, dt), step(globe, dt)].some(Boolean);
    apply();
    if (moving) raf = requestAnimationFrame(tick); else { raf = 0; last = 0; }
  };
  const spin = on => {
    stroke.target = on ? SPEED.stroke : 0;
    globe.target = on && version === 'globe' ? SPEED.globe : 0;
    if (!raf) raf = requestAnimationFrame(tick);
  };

  // ── eyebrow cycle ──
  const CATS = ['Step one', 'Step two', 'Step three', 'Step four', 'Step five'];
  let ci = 0, cycle = 0;
  const swapCat = text => {
    const old = eyebrow.querySelector('.cat:not(.leave)');
    const el = document.createElement('span');
    el.className = 'cat enter'; el.textContent = text;
    eyebrow.appendChild(el);
    el.offsetWidth;
    el.classList.remove('enter');
    if (old) { old.classList.add('leave'); setTimeout(() => old.remove(), 500); }
  };
  const nextCat = () => { ci = (ci + 1) % CATS.length; swapCat(CATS[ci]); };

  // ── the travelling text ──
  // The CTA's title and line are the loader's eyebrow and line: one
  // element (.l-text) that starts on the card, rides the morph, and
  // changes its copy on the way.
  const lText = $('.l-text'), lSub = lText.querySelector('p'), bText = card.querySelector('.b-text');
  const CTA = { title: 'Entry point', sub: 'A supporting line of copy goes here.' };
  const LTEXT = { get left() { return 107 + (scrW() - 402) / 2; }, get top() { return 520 + (scrH() - 874) / 2; } };
  const loaderSub = () => 'Loading content...';
  const swapSub = text => {
    lSub.classList.add('swap');
    setTimeout(() => { lSub.textContent = text; lSub.classList.remove('swap'); }, 170);
  };
  const setCopy = (title, sub) => { ci = 0; eyebrow.innerHTML = `<span class="cat">${title}</span>`; lSub.textContent = sub; };

  // ── geometry ──
  // Rects are measured in screen points (the device may be scaled).
  const scale = () => parseFloat(device.style.getPropertyValue('--fit')) || 1;
  const rectIn = (el, ref = screen) => {
    const s = scale(), r = el.getBoundingClientRect(), o = ref.getBoundingClientRect();
    return { left: (r.left - o.left) / s, top: (r.top - o.top) / s, width: r.width / s, height: r.height / s };
  };
  const place = (el, r) => { for (const k in r) el.style[k] = r[k] + 'px'; };
  // read when the loader opens, so it follows the theme
  document.querySelector('.m-img').src = ARTICLES[0].hero;
  // desktop screens: no CTA on the landing to grow out of, so the loader opens (and closes) in place, centred
  const deskLoader = () => root.classList.contains('proto-desktop') && innerWidth > 500;
  const cardBox = () => deskLoader() ? { left: LOADER.left, top: LOADER.top, width: LOADER.width, height: LOADER.height } : rectIn(card);
  const textBox = () => deskLoader() ? { left: LTEXT.left, top: LTEXT.top } : rectIn(bText);
  const cardFill = () => deskLoader() ? 'none' : getComputedStyle(card).backgroundImage;   // (no card's fill to fade from on desktop)

  // ── timeline ──
  let busy = false, timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clear = () => { timers.forEach(clearTimeout); timers = []; clearInterval(cycle); };
  const STATES = ['brief-open', 'brief-morph', 'brief-ready', 'brief-reveal', 'brief-hero', 'article-open', 'brief-done'];

  // Already read it all: no loader. The card's box goes straight to the
  // hero slot, the photo wiping up inside it on the way, and its copy fades.
  const openLoaded = () => {
    busy = true; clear();
    const cardRect = cardBox(), textRect = textBox();
    body.classList.add('brief-open');
    later(() => {
      morph.classList.remove('anim'); lText.classList.remove('anim');
      morph.style.borderRadius = '22px';
      place(morph, cardRect);
      mGlobe.style.opacity = 0;                        // the card's globe just fades with the card
      morph.style.setProperty('--fill', cardFill());
      morph.style.setProperty('--fill-o', 1);
      place(lText, { left: textRect.left, top: textRect.top });
      setCopy(CTA.title, CTA.sub);
      stroke.angle = ctaA; apply();
      body.classList.add('brief-morph', 'brief-ready');
      morph.offsetWidth;
      morph.classList.add('anim');
      morph.style.setProperty('--fill-o', 0);
      reveal();
    }, 160);
  };

  const open = force => {
    if (busy || body.classList.contains('brief-open')) return;
    if (force !== true && (body.classList.contains('menu-seen') || body.classList.contains('skip-loader'))) return openLoaded();
    busy = true; clear(); mGlobe.style.opacity = '';
    const cardRect = cardBox(), globeRect = rectIn(cGlobe, card), textRect = textBox();
    body.classList.add('brief-open');                 // card contents + home fade
    if (version === 'globe') cGlobe.style.opacity = 1; // the globe stays: it's about to travel
    later(() => {
      morph.classList.remove('anim');
      morph.style.borderRadius = '22px';
      place(morph, cardRect);
      place(mGlobe, globeRect);
      morph.style.setProperty('--fill', cardFill());
      morph.style.setProperty('--fill-o', 1);
      lText.classList.remove('anim');
      place(lText, { left: textRect.left, top: textRect.top });
      setCopy(CTA.title, CTA.sub);
      stroke.angle = ctaA; apply();                   // the gradient carries on from the card's angle
      body.classList.add('brief-morph');              // swap card → morph (identical)
      if (version === 'globe') window.globe3d?.mount(mGlobe);   // same canvas, so the same globe
      morph.offsetWidth;
      morph.classList.add('anim');
      lText.classList.add('anim');
      place(morph, LOADER);
      place(lText, LTEXT);
      place(mGlobe, LOADER_GLOBE);
      morph.style.setProperty('--fill-o', 0);
      spin(true);
      later(() => { swapCat(CATS[0]); swapSub(loaderSub()); }, 200);   // new copy mid-flight
    }, version === 'globe' ? 120 : 200);
    later(() => {
      body.classList.add('brief-ready');
      cycle = setInterval(nextCat, 900);
      busy = false;
    }, 850);
    if (!/[?&]hold\b/.test(location.search)) later(reveal, 850 + LOAD_MS);   // ?hold keeps an overview thumbnail on the loader
  };

  // text and globe fade as the comet closes into the outline; then in one
  // move the photo wipes up inside it as the box flies to the hero slot
  const reveal = () => {
    busy = true; clearInterval(cycle);
    show(0); pages[0].scrollTop = 0; parallax(pages[0]);
    body.classList.add('brief-reveal');
    spin(false);                                      // the comet slows as it closes
    later(() => {
      body.classList.add('brief-hero', 'article-open');
      morph.style.borderRadius = '12px 12px 0 0';   // matches .a-hero
      place(morph, HERO);
    }, 240);
    later(() => {
      body.classList.add('brief-done');
      busy = false;
    }, 240 + 720);
    later(() => $('.a-close').classList.add('live'), 240 + 2400);
  };

  // the desktop window changed size (preview on / off, or the page resized): whatever was
  // placed in pixels for the old size goes straight to its place in the new one — no glide
  addEventListener('proto-fit', () => {
    if (!body.classList.contains('brief-morph')) return;
    const snap = (el, r) => { const a = el.classList.contains('anim'); el.classList.remove('anim'); place(el, r); el.offsetWidth; if (a) el.classList.add('anim'); };
    if (body.classList.contains('brief-hero')) snap(morph, HERO);
    else if (body.classList.contains('brief-ready') || busy) { snap(morph, LOADER); snap(lText, LTEXT); }
  });

  // back out of the loader, reversing the morph onto the card
  const close = () => {
    if (busy || !body.classList.contains('brief-ready') || body.classList.contains('brief-reveal')) return;
    busy = true; clear();
    body.classList.remove('brief-ready');
    spin(false);
    later(() => {
      morph.style.borderRadius = '22px';
      place(morph, cardBox());
      place(mGlobe, rectIn(cGlobe, card));
      morph.style.setProperty('--fill-o', 1);
      const t = textBox();
      place(lText, { left: t.left, top: t.top });
      swapCat(CTA.title); swapSub(CTA.sub);
    }, 240);
    later(() => {
      ctaA = stroke.angle;
      body.classList.remove('brief-morph', 'brief-open');
      cGlobe.style.opacity = '';
      window.globe3d?.mount(cGlobe);
      busy = false;
    }, 950);
  };

  // from anywhere straight home
  const reset = () => {
    clear(); busy = false; backToList = false;
    body.classList.remove('fs-open');
    spin(false);
    body.classList.remove(...STATES);
    morph.classList.remove('anim');
    cGlobe.style.opacity = '';
    window.globe3d?.mount(cGlobe);
    cancelAnimationFrame(anim); heading = null; closeOverview(); show(0); $('.a-close').classList.remove('live');
    // (menu-seen survives closing: ••• stays once you've found the menu)
    ctaA = stroke.angle;                               // the card takes the gradient back
  };
  addEventListener('globe3d-ready', () => window.globe3d.mount(body.classList.contains('brief-morph') && version === 'globe' ? mGlobe : cGlobe));

  setVersion('stroke');                             // the template uses the stroke loader only

  // ── skip loader: the CTA goes straight to the page ──
  const skipSw = $('.skip-switch');
  const setSkip = on => {
    body.classList.toggle('skip-loader', on);
    skipSw?.setAttribute('aria-checked', on);
    try { localStorage.setItem('intro-skip', on ? '1' : '0'); } catch {}
  };
  skipSw?.addEventListener('click', () => setSkip(!body.classList.contains('skip-loader')));
  let skip0 = new URLSearchParams(location.search).get('skip') === '1';
  try { skip0 = skip0 || localStorage.getItem('intro-skip') === '1'; } catch {}
  if (!document.documentElement.classList.contains('embed')) setSkip(skip0);


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

  card.addEventListener('click', open);
  // the entry point is an article row on the landing: tapping one opens the page (through the loader)
  document.querySelectorAll('#home .list .row').forEach(r => r.addEventListener('click', () => open()));
  // "View all" under the article rows goes to the List (through the step bar, so it follows)
  $('#home .view-all')?.addEventListener('click', e => { e.stopPropagation(); document.querySelector('.steps [data-step="menu"]')?.click(); });
  $('#loader').addEventListener('click', close);
  // × fades the brief out, then goes home
  let closing = 0;
  const closeBrief = () => {
    if (body.classList.contains('closing')) return;
    body.classList.add('closing');
    closing = setTimeout(() => { reset(); body.classList.remove('closing'); }, 500);
  };
  let backToList = false;                            // set when a page is opened from the list
  $('.a-close').addEventListener('click', () => {
    if (backToList && body.classList.contains('brief-done') && !body.classList.contains('ov-open')) { backToList = false; return openMenu(); }
    backToList = false; closeBrief();
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape') body.classList.contains('article-open') ? closeBrief() : close();
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); body.classList.contains('brief-open') ? reset() : open(); }
  });

  // ── home CTA: the stroke drifts slowly round the card ──
  // Its angle is handed to the loader's stroke at the swap (and back when
  // the card returns), so the gradient never jumps.
  const cStrokes = card.querySelectorAll('.stroke');
  const DRIFT = 40;                              // deg/s
  let ctaA = 0, ctaLast = 0;
  const drift = t => {
    const dt = ctaLast ? Math.min(.05, (t - ctaLast) / 1000) : 0; ctaLast = t;
    if (!body.classList.contains('brief-morph')) {
      ctaA = (ctaA + DRIFT * dt) % 360;
      cStrokes.forEach(el => el.style.setProperty('--a', `${ctaA}deg`));
    }
    requestAnimationFrame(drift);
  };
  requestAnimationFrame(drift);

  // ── articles ──
  const pagesEl = $('.pages');
  pagesEl.innerHTML = ARTICLES.map(articlePage).join('') + `
    <div class="a-scroll page done-page" data-i="${ARTICLES.length}">
      <div class="done-box"><span class="stroke"></span><span class="stroke comet"></span>
        <div class="d-text"><b>End state</b><p>Placeholder copy for the end of the flow</p></div></div>
    </div>`;
  const pages = [...pagesEl.querySelectorAll('.page')];
  const DONE = ARTICLES.length;                       // the caught-up page comes after the last article

  // the × ring: one segment per article, the current one lit
  const ring = $('.a-close .dash');
  ring.innerHTML = ARTICLES.map((_, i) => {
    const n = ARTICLES.length, gap = 14, r = 20.5, rad = d => d * Math.PI / 180;
    const a0 = rad(-90 + i * 360 / n + gap / 2), a1 = rad(-90 + (i + 1) * 360 / n - gap / 2);
    const pt = a => `${(22 + r * Math.cos(a)).toFixed(2)} ${(22 + r * Math.sin(a)).toFixed(2)}`;
    return `<path d="M${pt(a0)}A${r} ${r} 0 0 1 ${pt(a1)}"/>`;
  }).join('');
  const segs = [...ring.children];

  let cur = 0;
  const show = i => {
    pages.forEach((pg, k) => {
      pg.classList.toggle('cur', k === i);
      if (pg.classList.contains('swiping')) pg.classList.add('bet-in');   // its bar comes back up now
      pg.classList.remove('inc', 'swiping', 'under', 'over'); clearSwipe(pg);
    });
    segs.forEach((sg, k) => { sg.classList.toggle('on', k === i || i === DONE); sg.style.opacity = sg.style.transition = ''; });   // caught up: the ring is full
    const was = cur; cur = i;
    if (i === DONE && was !== DONE) caughtUp();
    if (i !== DONE) { clearTimeout(doneT); if (stroke.target && body.classList.contains('brief-done')) spin(false); }   // swiped away (or back) from caught up
  };

  // ── article hero parallax ──
  // The hero box scrolls at 70% so the copy slides up over it, and the
  // photo drifts inside the box on top of that. It grows from its bottom
  // edge just enough to cover the gap the drift opens at the top, and at
  // scroll 0 it is untouched, so the handoff from the loader stays exact.
  const parallax = (pg = pages[cur]) => {
    const hero = pg.querySelector('.a-hero');
    if (!hero) return;
    const img = hero.querySelector('img'), bet = pg.querySelector('.a-bet');
    const st = Math.max(0, pg.scrollTop), d = st * .18;
    hero.style.transform = st ? `translateY(${st * .3}px)` : '';
    img.style.setProperty('--py', `${d}px`); img.style.setProperty('--ps', 1 + d / 290 * 1.1);
    img.style.opacity = st ? Math.max(.35, 1 - st / 520) : '';
    // the trade bar joins the page once you reach the foot of it
    bet?.classList.toggle('docked', st + pg.clientHeight >= pg.scrollHeight - 2);
  };
  pages.forEach(pg => {
    let q = false;
    pg.addEventListener('scroll', () => { if (!q) { q = true; requestAnimationFrame(() => { q = false; parallax(pg); }); } }, { passive: true });
  });

  // ── swipe between articles ──
  // Dragging pushes the current article back (it slides a little the same
  // way, shrinks and dims) while the next one comes in over the top of it,
  // following the finger 1:1. Past a third of the width, or on a flick, it
  // commits; otherwise it springs back. At either end it rubber-bands.
  const SW = 402;
  const heroImg = pg => pg.querySelector('.a-hero img');
  const clearSwipe = pg => {
    pg.style.transform = pg.style.opacity = '';
    const im = heroImg(pg); if (im) { im.style.removeProperty('--sx'); im.style.removeProperty('--ss'); }
  };
  const paint = (p, dir) => {                          // p: 0 → 1 towards the page `dir` away
    const from = pages[cur], to = pages[cur + dir];
    if (!to) {                                         // an end: resist
      from.style.transform = `translateX(${-dir * rubber(p * SW)}px)`;
      return;
    }
    pages.forEach((pg, k) => { if (k !== cur && k !== cur + dir) { pg.classList.remove('inc', 'swiping', 'under', 'over'); clearSwipe(pg); } });
    from.classList.add('swiping');
    if (cur + dir === DONE) {
      // into "caught up", the layers flip: it waits underneath, and the last
      // article slides off over the top of it, revealing it as it settles.
      // Its comet is already running at full speed as it comes into view.
      if (!stroke.target && !body.classList.contains('menu-seen')) { stroke.vel = SPEED.stroke; spin(true); }
      if (!to.classList.contains('under')) { to.classList.add('inc', 'under'); from.classList.add('over'); }
      to.style.transform = `scale(${.84 + .16 * p})`;
      to.style.opacity = .4 + .6 * p;
      from.style.transform = `translateX(${-SW * p}px)`;
      from.style.opacity = '';
      const fi = heroImg(from);
      if (fi) { fi.style.setProperty('--sx', `${SW * .28 * p}px`); fi.style.setProperty('--ss', 1 + .08 * p); }
      segs.forEach(sg => { sg.style.transition = 'none'; sg.style.opacity = sg.classList.contains('on') ? 1 : .28 + .72 * p; });
      return;
    }
    // transform and opacity only, so every frame stays on the compositor:
    // the page shrinks back and fades into the dark behind it
    from.style.transform = `translateX(${-dir * p * 60}px) scale(${1 - p * .16})`;
    from.style.opacity = 1 - p * .6;
    if (!to.classList.contains('inc')) { to.scrollTop = 0; parallax(to); to.classList.add('inc', 'swiping'); }
    to.style.transform = `translateX(${dir * SW * (1 - p)}px)`;
    // photos: the incoming one lags its page and arrives zoomed, settling to
    // rest as the page lands; the outgoing one drifts and swells as it's pushed back
    const ti = heroImg(to), fi = heroImg(from);
    if (ti) { ti.style.setProperty('--sx', `${-dir * SW * .28 * (1 - p)}px`); ti.style.setProperty('--ss', 1 + .14 * (1 - p)); }
    if (fi) { fi.style.setProperty('--sx', `${-dir * 36 * p}px`); fi.style.setProperty('--ss', 1 + .06 * p); }
    // the ring follows the swipe: the lit segment crossfades to the incoming one
    const lit = i => segs.map((_, k) => k === i || i === DONE ? 1 : .28);
    const a0 = lit(cur), a1 = lit(cur + dir);
    segs.forEach((sg, k) => { sg.style.transition = 'none'; sg.style.opacity = a0[k] + (a1[k] - a0[k]) * p; });
  };
  const rubber = x => 60 * (1 - Math.exp(-x / 160));

  let anim = 0, heading = null;                      // heading: the page a running settle will land on
  const finish = () => { cancelAnimationFrame(anim); if (heading !== null) show(heading); heading = null; };
  // A spring, not a timed ease: it starts at the speed the finger let go
  // at, so there's no hitch between dragging and settling.
  const settle = (p, dir, commit, v0 = 0) => {
    cancelAnimationFrame(anim);
    const to = commit && pages[cur + dir] ? 1 : 0;
    heading = to ? cur + dir : cur;
    const K = 210, C = 2 * Math.sqrt(K) * .95;        // stiffness, damping (just under critical)
    let x = p, v = v0, last = performance.now();
    const step = t => {
      const dt = Math.min(.032, (t - last) / 1000); last = t;
      v += (-K * (x - to) - C * v) * dt;
      x += v * dt;
      if (Math.abs(x - to) < .0015 && Math.abs(v) < .02) { show(heading); heading = null; return; }
      paint(Math.min(1.02, Math.max(0, x)), dir);
      anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  };
  const go = dir => { finish(); if (pages[cur + dir]) settle(0, dir, true, 2.5); else settle(.25, dir, false); };

  const art = $('#article');
  let drag = null, moved = false;
  const SWIPE = false;                                // no sideways drag between pages in the template
  art.addEventListener('pointerdown', e => {
    if (!SWIPE) return;
    if (!body.classList.contains('brief-done') || e.target.closest('.a-top, #overview') || e.button > 0) return;
    finish();                                         // catch a page that's still settling
    drag = { x: e.clientX, y: e.clientY, axis: null, hist: [[e.clientX, e.timeStamp]] };
    moved = false;
  });
  art.addEventListener('pointermove', e => {
    if (!drag) return;
    const s = scale(), dx = (e.clientX - drag.x) / s, dy = (e.clientY - drag.y) / s;
    if (!drag.axis && Math.hypot(dx, dy) > 8) {
      drag.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
      if (drag.axis === 'x') { art.setPointerCapture(e.pointerId); art.classList.add('dragging'); }
    }
    if (drag.axis !== 'x') return;
    moved = true;
    drag.hist.push([e.clientX, e.timeStamp]); if (drag.hist.length > 6) drag.hist.shift();
    const dir = dx < 0 ? 1 : -1;
    if (drag.dir && drag.dir !== dir) show(cur);        // changed direction mid-drag
    drag.dir = dir; drag.p = Math.min(1, Math.abs(dx) / SW);
    paint(drag.p, dir);
  });
  const end = e => {
    if (!drag) return;
    const d = drag; drag = null;
    art.classList.remove('dragging');
    if (d.axis !== 'x' || !d.dir) return;
    const [x0, t0] = d.hist[0], [x1, t1] = d.hist.at(-1);
    const v = (x1 - x0) / scale() / Math.max(1, t1 - t0);   // pt/ms, + is rightwards
    const flick = Math.abs(v) > .45 && Math.sign(-v) === d.dir;
    settle(d.p, d.dir, d.p > .33 || flick, -v * d.dir * 1000 / SW);   // carry the finger's speed
  };
  art.addEventListener('pointerup', end);
  art.addEventListener('pointercancel', end);
  art.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  addEventListener('keydown', e => {
    if (!body.classList.contains('brief-done') || body.classList.contains('ov-open')) return;
    // (← → step between the screens instead: see the step arrows)
  });

  // ── all caught up → overview ──
  // The caught-up page holds the loader box with its comet for a couple of
  // seconds. Then the comet closes into the outline, the copy fades, and
  // everything moves right to left: the box slides off left as article 1's
  // card, articles 2, 3… slide in from the right as bare outlines, and then
  // they fill in one by one — photo, then text.
  const ov = $('#overview'), track = ov.querySelector('.ov-track');
  const SLOT = 261;                                  // card width + gap
  track.innerHTML = ARTICLES.map((a, k) => `
    <button class="ov-card" data-i="${k}" style="--k:${k}; --from:${k ? SLOT + 170 + k * 24 : SLOT}px">
      <span class="stroke"></span>
      <span class="ov-img"><img src="${a.hero}" alt="" draggable="false"></span><span class="ov-num">${String(k + 1).padStart(2, '0')}</span>
      <span class="ov-text">
        <span class="ov-meta"><span class="sk" style="width:110px;height:8px"></span></span>
        <span class="ov-title sk-lines"><span class="sk" style="width:92%;height:12px"></span><span class="sk" style="width:64%;height:12px"></span></span>
      </span>
    </button>`).join('');
  let doneT = 0, ovT = [];
  const caughtUp = () => {
    // the caught-up moment plays once; after that, past the last article is the menu
    if (body.classList.contains('menu-seen')) { requestAnimationFrame(() => openMenu()); return; }
    if (stroke.vel < SPEED.stroke * .5) stroke.vel = SPEED.stroke;   // never start from a standstill
    spin(true);
    clearTimeout(doneT);
    doneT = setTimeout(openOverview, 1200);         // how long 'all caught up' holds
  };
  const openOverview = () => {
    if (cur !== DONE) return;
    body.classList.add('ov-closing');
    spin(false);
    ovT.push(setTimeout(() => {
      ov.classList.remove('spread', 'filled', 'leaving');
      body.classList.add('ov-open');                  // card 1 starts exactly on the box…
      track.scrollLeft = SLOT;                        // …and the menu ends centred on article 2
      ov.offsetWidth;
      requestAnimationFrame(() => { track.scrollLeft = SLOT; ov.classList.add('spread'); });
      ovT.push(setTimeout(() => { ov.classList.add('filled'); body.classList.add('menu-seen'); }, 850));
      ovT.push(setTimeout(() => { track.scrollLeft = SLOT; ov.classList.add('snap'); sideFade(); }, 1300));
    }, 380));
  };
  function closeOverview() {
    ovT.forEach(clearTimeout); ovT = []; clearTimeout(doneT);
    body.classList.remove('ov-open', 'ov-closing', 'ov-exiting');
    ov.classList.remove('spread', 'filled', 'leaving', 'picking', 'returning', 'entering', 'no-anim', 'snap', 'moving', 'grabbing');
    track.querySelectorAll('.picked, .fresh, .fresh-in').forEach(c => c.classList.remove('picked', 'fresh', 'fresh-in'));
    flyer.classList.remove('on', 'anim', 'hero', 'card-face');
    // whatever a cancelled flight left behind on the pages
    pages.forEach(pg => pg.classList.remove('to-menu', 'pre', 'pre-hero'));
  }
  // tap a card: its photo flies up into the hero slot (the same move as
  // loader → article), the others fall away, and the article builds in
  const flyer = $('.flyer'), fImg = flyer.querySelector('img');
  const fText = flyer.querySelector('.f-text');
  // a card's true slot on screen, ignoring any scale it's animating through
  const slotOf = c => rectIn(c.querySelector('.ov-img'));   // the list row's thumbnail
  const wearCard = k => { fText.innerHTML = track.children[k].querySelector('.ov-text').innerHTML; };
  track.addEventListener('click', e => {
    if (e.target.closest('.ov-card')) backToList = true;
    const c = e.target.closest('.ov-card');
    if (!c || !ov.classList.contains('filled') || ov.classList.contains('picking')) return;
    const k = +c.dataset.i, from = slotOf(c), pg = pages[k];
    fImg.src = ARTICLES[k].hero;
    fImg.style.transform = fImg.style.opacity = fImg.style.transformOrigin = '';
    wearCard(k);
    flyer.classList.remove('anim', 'hero');
    flyer.classList.add('card-face');
    place(flyer, from); flyer.style.borderRadius = '12px';
    flyer.classList.add('on');
    show(k);
    pg.scrollTop = 0; parallax(pg);
    pg.classList.remove('bet-in');
    pg.classList.add('pre', 'pre-hero');
    c.classList.add('picked');
    ov.classList.add('picking');
    body.classList.add('ov-exiting');
    flyer.offsetWidth;
    requestAnimationFrame(() => {
      flyer.classList.add('anim', 'hero');
      flyer.classList.remove('card-face');
      place(flyer, HERO); flyer.style.borderRadius = '0';
      pg.classList.remove('pre');                     // the staggered entrance runs again
    });
    ovT.push(setTimeout(() => { pg.classList.remove('pre-hero'); closeOverview(); }, 740));
  });

  // ••• from an article: the menu comes up already laid out, centred on
  // the article you were reading
  const openMenu = direct => {
    if (body.classList.contains('ov-open') || !body.classList.contains('brief-done')) return;
    finish();
    if (cur < DONE && direct !== true) return menuFromArticle();
    ov.classList.add('no-anim', 'spread', 'filled', 'entering');
    body.classList.add('ov-open');
    track.scrollLeft = Math.min(cur, ARTICLES.length - 1) * SLOT;
    ov.offsetWidth;
    requestAnimationFrame(() => {
      ov.classList.remove('entering');
      track.scrollLeft = Math.min(cur, ARTICLES.length - 1) * SLOT;
      ov.classList.add('snap'); sideFade();
      segs.forEach(sg => { sg.style.opacity = sg.style.transition = ''; });
      setTimeout(() => ov.classList.remove('no-anim'), 50);
    });
  };
  // how far each card is from the centre, 0 → 1 at one card away
  const cards = [...track.children];
  let offQ = false;
  const dotsEl = ov.querySelector('.ov-dots');
  dotsEl.innerHTML = ARTICLES.map(() => '<i></i>').join('');
  const dots = [...dotsEl.children];
  const sideFade = () => {
    offQ = false;
    const at = Math.round(track.scrollLeft / SLOT);
    dots.forEach((d, k) => d.classList.toggle('on', k === at));
    cards.forEach((c, k) => c.style.setProperty('--off', Math.min(1, Math.abs(k * SLOT - track.scrollLeft) / SLOT).toFixed(3)));
  };
  track.addEventListener('scroll', () => { if (!offQ) { offQ = true; requestAnimationFrame(sideFade); } }, { passive: true });
  sideFade();

  // any movement of the menu — mouse drag, touch or trackpad — eases the cards back
  let mvT = 0;
  track.addEventListener('scroll', () => {
    if (!ov.classList.contains('snap')  && !ov.classList.contains('grabbing')) return;   // not the reveal's own scroll
    ov.classList.add('moving');
    clearTimeout(mvT);
    mvT = setTimeout(() => ov.classList.remove('moving'), 140);
  }, { passive: true });

  // mouse drag for the menu (touch scrolls natively): snapping is off while
  // dragging, then it glides to the nearest card, carrying the flick
  let md = null;
  track.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button > 0) return;
    md = { x: e.clientX, left: track.scrollLeft, hist: [[e.clientX, e.timeStamp]], moved: false };
  });
  addEventListener('pointermove', e => {
    if (!md) return;
    const dx = (e.clientX - md.x) / scale();
    if (!md.moved && Math.abs(dx) > 5) { md.moved = true; ov.classList.remove('snap'); ov.classList.add('grabbing'); }
    if (!md.moved) return;
    track.scrollLeft = md.left - dx;
    md.hist.push([e.clientX, e.timeStamp]); if (md.hist.length > 6) md.hist.shift();
  });
  addEventListener('pointerup', () => {
    if (!md) return;
    const d = md; md = null;
    if (!d.moved) return;
    ov.classList.remove('grabbing');
    const [x0, t0] = d.hist[0], [x1, t1] = d.hist.at(-1);
    const v = (x1 - x0) / scale() / Math.max(1, t1 - t0);          // pt/ms
    // nearest card, nudged one along by a flick — never more than one from where the drag began
    const k0 = Math.round(d.left / SLOT);
    let k = Math.round(track.scrollLeft / SLOT);
    if (k === k0 && Math.abs(v) > .3) k = k0 - Math.sign(v);
    k = Math.max(0, Math.min(ARTICLES.length - 1, Math.max(k0 - 1, Math.min(k0 + 1, k))));
    track.scrollTo({ left: k * SLOT, behavior: 'smooth' });
    setTimeout(() => { if (!md) ov.classList.add('snap'); }, 450);
    // swallow the click that ends a drag
    const swallow = ev => ev.stopPropagation();
    track.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => track.removeEventListener('click', swallow, { capture: true }), 60);
  });

  $('.a-more').addEventListener('click', openMenu);

  // ••• from an article: the hero photo scales back down into its card —
  // the menu → article flight in reverse — as the article fades beneath it
  // and the other cards come in round it
  const menuFromArticle = () => {
    closeOverview();                                  // start from a clean slate every time
    const k = cur, pg = pages[k], hero = pg.querySelector('.a-hero');
    const from = rectIn(hero), card = track.children[k];
    // the menu, laid out and centred on this article, but with every card held back
    ov.classList.add('no-anim', 'spread', 'filled', 'picking', 'returning');
    card.classList.add('picked');
    body.classList.add('ov-open');
    track.scrollLeft = k * SLOT;
    // the flyer starts as the hero, exactly where it is
    fImg.src = ARTICLES[k].hero;
    wearCard(k);
    flyer.classList.remove('anim', 'card-face');
    flyer.classList.add('on', 'hero');
    place(flyer, from); flyer.style.borderRadius = '0';
    // match the hero's scroll parallax (drift, swell, dim) on the first frame
    const st = Math.max(0, pg.scrollTop), d = st * .18;
    fImg.style.transformOrigin = '50% 100%';
    fImg.style.transform = `translate(-50%, -50%) translateY(${d}px) scale(${1 + d / 290 * 1.1})`;
    fImg.style.opacity = st ? Math.max(.35, 1 - st / 520) : 1;
    pg.classList.add('pre-hero');
    segs.forEach(sg => { sg.style.opacity = sg.style.transition = ''; });
    ov.offsetWidth;
    requestAnimationFrame(() => {
      track.scrollLeft = k * SLOT;
      const to = slotOf(card);
      ov.classList.remove('no-anim');
      flyer.classList.add('anim', 'card-face');
      flyer.classList.remove('hero');
      place(flyer, to); flyer.style.borderRadius = '12px';
      fImg.style.transform = fImg.style.opacity = '';     // eases back to the plain photo
      pg.classList.add('to-menu');
      ov.classList.remove('picking');                 // the others fade in; the bg comes back
      ov.classList.add('snap'); sideFade();
    });
    ovT.push(setTimeout(() => {
      card.classList.remove('picked');                // identical to the flyer's last frame
      flyer.classList.remove('on', 'anim', 'card-face');
      ov.classList.remove('returning');
      pg.classList.remove('to-menu', 'pre-hero');
    }, 740));
  };

  show(0);

  // ── steps: jump straight to a screen (the pagination under the phone) ──
  const whenDone = fn => { const t0 = performance.now(); const tick = () => {
    if (body.classList.contains('brief-done')) fn(); else if (performance.now() - t0 < 6000) setTimeout(tick, 60); }; tick(); };
  // ── fullscreen: tap the detail's hero and it opens out to fill the screen ──
  // The viewer grows out of the hero's own rect (and folds back into it).
  const fsView = $('.fs-view');
  const heroRect = () => { const h = $('.page.cur .a-hero'); return h ? rectIn(h) : { left: 0, top: 0, width: 402, height: 416 }; };
  const clipFrom = r => `inset(${r.top}px ${402 - r.left - r.width}px ${874 - r.top - r.height}px ${r.left}px round 12px 12px 0 0)`;
  const openFull = () => {
    if (!body.classList.contains('brief-done') || body.classList.contains('ov-open') || body.classList.contains('fs-open')) return;
    fsView.style.transition = 'none';
    fsView.style.clipPath = 'inset(100% 0 0 0)';            // a dark wipe, bottom up
    fsView.offsetWidth;
    fsView.style.transition = '';
    body.classList.add('fs-open');
    fsView.style.clipPath = 'inset(0 0 0 0)';
  };
  const closeFull = () => {
    if (!body.classList.contains('fs-open')) return;
    fsView.style.clipPath = 'inset(100% 0 0 0)';            // and back down
    body.classList.remove('fs-open');
  };
  $('#article').addEventListener('click', e => { if (e.target.closest('.page.cur .a-hero')) openFull(); });
  // "View all" at the foot of a page: to the list (its picture flies back into its row)
  $('#article').addEventListener('click', e => { if (e.target.closest('.page.cur .page-all')) { e.stopPropagation(); openMenu(); } });
  fsView.querySelector('.fs-close').addEventListener('click', e => { e.stopPropagation(); closeFull(); });

  // jumping between screens: moves that exist in the flow play in place
  // (page ↔ gallery, page → list, list → page); anything else fades the
  // screen to its background, sets the new screen up underneath, and fades
  // back once it has arrived — so nothing flashes on the way
  const veil = document.createElement('div');
  veil.className = 'veil';
  $('#screen').appendChild(veil);
  let veilT = 0, veilW = 0, veilGen = 0;
  const veiled = (fn, target) => {
    const gen = ++veilGen;
    clearTimeout(veilT); clearInterval(veilW);
    veil.classList.add('on'); body.classList.add('veiling');
    veilT = setTimeout(() => {
      if (gen !== veilGen) return;
      fn();
      // lift only once the new screen has settled: the gallery's wipe and the
      // list's picture flight finish under the veil, not in view
      const t0 = performance.now(), settle = { full: 720, menu: body.classList.contains('menu-direct') ? 260 : 860 }[target] || 220;
      let since = 0;
      veilW = setInterval(() => {
        const there = window.proto.at() === target;
        if (there && !since) since = performance.now();
        if (!there) since = 0;
        if ((there && performance.now() - since > settle) || performance.now() - t0 > 4200) {
          clearInterval(veilW);
          setTimeout(() => { if (gen === veilGen) { veil.classList.remove('on'); body.classList.remove('veiling'); } }, there ? 120 : 0);
        }
      }, 50);
    }, 220);
  };
  const dropFull = () => { body.classList.remove('fs-open'); fsView.style.transition = 'none'; fsView.style.clipPath = 'inset(100% 0 0 0)'; fsView.offsetWidth; fsView.style.transition = ''; };
  let startGen = 0;                                  // a newer jump cancels an older one's pending steps
  const start = name => {
    const gen = ++startGen, live = () => gen === startGen;
    reset();
    requestAnimationFrame(() => {
      if (!live()) return;
      if (name === 'loader') open(true);                          // always the full loader
      if (name === 'article') openLoaded();                       // straight into the detail
      if (name === 'full') { openLoaded(); whenDone(() => live() && setTimeout(() => live() && openFull(), 300)); }
      if (name === 'menu') { openLoaded(); whenDone(() => live() && openMenu(true)); }   // under the veil: straight in
    });
  };
  window.proto = {
    step: name => {
      const at = window.proto.at();
      startGen++;                                     // whatever an earlier jump still had queued is dropped
      if (name === at) return;
      const onPage = body.classList.contains('brief-done');
      // in-flow moves, played as they are
      if (at === 'article' && name === 'full') return openFull();
      if (at === 'full' && name === 'article') return closeFull();
      if (at === 'article' && name === 'menu') return openMenu();
      if (at === 'menu' && name === 'article' && onPage) {
        return veiled(() => closeOverview(), 'article');
      }
      if (at === 'full' && name === 'menu') return veiled(() => { dropFull(); openMenu(true); }, 'menu');
      if (at === 'menu' && name === 'full') return veiled(() => { closeOverview(); openFull(); }, 'full');
      // everything else: fade through
      if (name === 'menu') body.classList.add('menu-direct');
      veiled(() => { if (body.classList.contains('fs-open')) dropFull(); start(name); }, name);
      setTimeout(() => body.classList.remove('menu-direct'), 4000);
    },
    // which screen is up now, for the pagination to follow
    at: () => body.classList.contains('ov-open') ? 'menu'
      : body.classList.contains('fs-open') ? 'full'
      : body.classList.contains('brief-done') ? 'article'
      : body.classList.contains('brief-open') ? 'loader' : 'start',
  };
})();
