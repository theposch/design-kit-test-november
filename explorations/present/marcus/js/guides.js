// Animation guides
//
// One switch, top left (or N): pulsing hotspots on the parts of the current
// screen that move, each with its note beside the phone, joined to it by a
// dashed leader. Hovering a hotspot highlights its note. Notes are numbered
// top to bottom by where their hotspot sits.
// Hotspots sit on the top-right corner of the element they describe and
// follow it every frame. Notes are laid out in the page (not the scaled
// phone), so they stay readable, on whichever side of the phone has room.

(() => {
  const $ = s => document.querySelector(s);
  const body = document.body, device = $('#device');
  const has = c => body.classList.contains(c);

  // which screen is up
  const onHome = () => !has('brief-open');
  const onLoader = () => has('brief-open') && !has('brief-done');
  const onArticle = () => has('brief-done') && !has('ov-open') && !has('fs-open') && !$('.page.cur.done-page');
  const onFull = () => has('fs-open');
  const onDone = () => has('brief-done') && !has('ov-open') && !!$('.page.cur.done-page');
  const onMenu = () => has('ov-open');

  // the menu card nearest the middle of the screen
  const centredCard = () => {
    const sr = $('#screen').getBoundingClientRect(), mid = sr.left + sr.width / 2;
    let best = null, bd = Infinity;
    document.querySelectorAll('#overview .ov-card').forEach(c => {
      const r = c.getBoundingClientRect(), dd = Math.abs(r.left + r.width / 2 - mid);
      if (dd < bd) { bd = dd; best = c; }
    });
    return best;
  };

  // ── the notes ──────────────────────────────────────────────────────
  // One line per note: [screen, element, title, copy]
  //   screen   onHome, onLoader, onArticle, onDone or onMenu (above)
  //   element  a CSS selector (or a function returning an element); the
  //            hotspot sits on its top-right corner and the note attaches to it
  // Order within a screen sets the numbering.
  const GUIDES = [
    [onHome, '#home .top', 'Header',
      'Placeholder note goes here.'],
    [onHome, '#home .wide-hero', 'Hero',
      'Placeholder note goes here.'],
    [onHome, '#home .tiles', 'Tiles',
      'Placeholder note goes here.'],
    [onHome, '#home .list .row', 'Entry point',
      'Placeholder note goes here.'],
    [onHome, '#home .list .row:nth-child(5)', 'More rows',
      'Placeholder note goes here.'],
    [onHome, '#home .view-all', 'View all',
      'Placeholder note goes here.'],
    [onHome, '#home h2.list-h', 'List',
      'Placeholder note goes here.'],
    [onHome, '#home .wide-feat', 'Featured',
      'Placeholder note goes here.'],
    [onHome, '#home .wide-news', 'Newsletter',
      'Placeholder note goes here.'],
    [onHome, '#tabbar', 'Tab bar',
      'Placeholder note goes here.'],

    [onLoader, '.ring-loader', 'Loading ring',
      'Placeholder note goes here.'],

    [onArticle, '.a-close', 'Back',
      'Placeholder note goes here.'],
    [onArticle, '.page.cur .a-hero', 'Hero image',
      'Placeholder note goes here.'],
    [onArticle, '.page.cur h1', 'Title & byline',
      'Placeholder note goes here.'],
    [onArticle, '.page.cur .standfirst', 'Standfirst',
      'Placeholder note goes here.'],
    [onArticle, '.page.cur .quote', 'Pull quote',
      'Placeholder note goes here.'],
    [onArticle, '.page.cur .a-fig', 'Image',
      'Placeholder note goes here.'],
    [onArticle, '.page.cur .tags', 'Tags',
      'Placeholder note goes here.'],
    [onArticle, '.page.cur .a-related', 'Related stories',
      'Placeholder note goes here.'],
    [onArticle, '.page.cur .page-all', 'View all',
      'Placeholder note goes here.'],

    [onFull, '.fs-anchor', 'Gallery',
      'Placeholder note goes here.'],
    [onFull, '.fs-cap', 'Caption',
      'Placeholder note goes here.'],

    [onDone, '.page.cur .done-box', 'End state',
      'Placeholder note goes here.'],

    [onMenu, '.a-close', 'Back',
      'Placeholder note goes here.'],
    [onMenu, '#overview .ov-head', 'Heading',
      'Placeholder note goes here.'],
    [onMenu, centredCard, 'List',
      'Placeholder note goes here.'],
    [onMenu, '#overview .ov-card:last-child', 'End of list',
      'Placeholder note goes here.'],
  ];

  // ── elements ──
  // hotspots ride the phone (so they scale with it); notes and their dashed
  // leaders live in the page, so they stay a readable size
  const layer = document.createElement('div');
  layer.className = 'guides';
  device.appendChild(layer);
  const NS = 'http://www.w3.org/2000/svg';
  const leaders = document.createElementNS(NS, 'svg');
  leaders.setAttribute('class', 'guide-leaders');
  body.appendChild(leaders);

  const fit = () => parseFloat(device.style.getPropertyValue('--fit')) || 1;
  const find = g => typeof g.sel === 'function' ? g.sel() : $(g.sel);

  // one note box and one leader per guide, made up front
  let hover = null, pinned = null, hideT = 0, navList = [];   // pinned: a label opened by a click, kept until × (hovering others only previews)
  const overDesign = () => document.documentElement.classList.contains('proto-desktop') && innerWidth > 500;   // navList: the labels on screen, in number order (for the card's ‹ ›)
  const spots = GUIDES.map(([when, sel, title, copy]) => {
    const el = document.createElement('button');
    el.className = 'hs';
    el.setAttribute('aria-label', title);
    layer.appendChild(el);
    const box = document.createElement('div');
    box.className = 'guide-tip';
    box.innerHTML = `<span class="gt-kicker">Motion</span><b><em></em>${title}</b><p>${copy}</p><span class="gt-nav"><button class="gt-prev" aria-label="Previous label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button><button class="gt-next" aria-label="Next label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></button><button class="gt-x" aria-label="Hide label"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></span>`;
    body.appendChild(box);
    const path = document.createElementNS(NS, 'path');
    leaders.appendChild(path);
    const g = { when, sel, title, copy, el, box, path, live: false };
    el.addEventListener('pointerenter', e => { if (e.pointerType === 'touch') return; clearTimeout(hideT); hover = g; });   // a tap is a click, not a hover
    el.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') closeSoon(); });
    el.addEventListener('click', e => { e.stopPropagation(); if (overDesign() && e.pointerType !== 'touch') return; hover = pinned === g ? null : g; pinned = hover; });   // desktop V.1: hover only
    box.addEventListener('pointerenter', e => { if (e.pointerType === 'touch') return; clearTimeout(hideT); if (!notesOn) hover = g; });
    box.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') closeSoon(); });
    // the card's own controls (on a phone): step to the previous / next label on screen, or hide it
    const step = d => { const i = navList.indexOf(g); if (navList.length) pinned = hover = navList[(i + d + navList.length) % navList.length]; };
    box.querySelector('.gt-prev').addEventListener('click', e => { e.stopPropagation(); step(-1); });
    box.querySelector('.gt-next').addEventListener('click', e => { e.stopPropagation(); step(1); });
    box.querySelector('.gt-x').addEventListener('click', e => { e.stopPropagation(); hover = pinned = null; });
    return g;
  });
  const closeSoon = () => { clearTimeout(hideT); if (pinned && hover === pinned) return; hideT = setTimeout(() => { hover = pinned && navList.includes(pinned) ? pinned : null; }, 140); };

  // ── layout ──
  // Each note sits beside the phone level with its hotspot, on the
  // hotspot's side if there is room (else the other side). Notes on the same
  // side that would overlap stack downwards, and their leaders step down to
  // meet them: out from the hotspot, down the gap, across to the note.
  const GAP = 40, W_NOTE = 280;
  function layout(show) {
    const d = device.getBoundingClientRect();
    // the desktop window fills the page: each label is a frosted box over the design, beside its dot
    if (overDesign()) {
      const sc = $('#screen').getBoundingClientRect();
      for (const g of show) {
        const h = g.el.getBoundingClientRect(), hx = h.left + h.width / 2, hy = h.top + h.height / 2;
        const bw = g.box.offsetWidth || 300, bh = g.box.offsetHeight || 120;
        let x = hx + 22 + bw <= sc.right - 16 ? hx + 22 : hx - 22 - bw;
        x = Math.min(Math.max(x, sc.left + 16), sc.right - 16 - bw);
        const y = Math.min(Math.max(hy - 22, sc.top + 16), sc.bottom - 16 - bh);
        g.box.style.left = x + 'px'; g.box.style.top = y + 'px';
      }
      return;
    }
    const roomR = innerWidth - d.right - GAP - 16, roomL = d.left - GAP - 16;
    const fitsR = roomR >= W_NOTE, fitsL = roomL >= W_NOTE;
    const sides = { l: [], r: [] };
    for (const g of show) {
      const h = g.el.getBoundingClientRect();
      g.hx = h.left + h.width / 2; g.hy = h.top + h.height / 2;
      let sd = g.hx >= d.left + d.width / 2 ? 'r' : 'l';
      if (sd === 'r' && !fitsR && fitsL) sd = 'l';
      if (sd === 'l' && !fitsL && fitsR) sd = 'r';
      g.side = sd; g.cramped = !fitsR && !fitsL;
      sides[sd].push(g);
    }
    for (const sd of ['l', 'r']) {
      let floor = 12;
      const col = sides[sd].sort((a, b) => a.hy - b.hy);
      // down: level with each hotspot, never above the one before
      col.forEach(g => { g.bh = g.box.offsetHeight || 150; g.top = Math.max(g.hy - 30, floor); floor = g.top + g.bh + 12; });
      // up: from the window's foot, so the lowest ones stack upward instead of overlapping
      let ceil = innerHeight - 12;
      for (let i = col.length - 1; i >= 0; i--) { col[i].top = Math.min(col[i].top, ceil - col[i].bh); ceil = col[i].top - 12; }
      col.forEach(g => {
        const top = Math.max(12, g.top);
        let x;
        if (g.cramped) {                                // no room either side: beside the hotspot, over the phone
          x = g.hx > innerWidth / 2 ? g.hx - 24 - W_NOTE : g.hx + 24;
          x = Math.min(Math.max(x, 12), innerWidth - W_NOTE - 12);
        } else x = sd === 'r' ? d.right + GAP : d.left - GAP - W_NOTE;
        g.box.style.left = x + 'px';
        g.box.style.top = top + 'px';
        // leader: to the note's near edge, meeting it level with its title
        const bx = sd === 'r' ? x : x + W_NOTE, by = top + 30;
        const mx = sd === 'r' ? d.right + GAP / 2 : d.left - GAP / 2;
        g.path.setAttribute('d', g.cramped ? `M${g.hx} ${g.hy}L${bx} ${by}` : `M${g.hx} ${g.hy}H${mx}V${by}H${bx}`);
      });
    }
  }

  // ── every frame while either is on ──
  let notesOn = false, raf = 0;
  // mid-swipe the page slides sideways; the notes hold still (the next
  // article has the same layout), and only the trade bar's note drops out
  const swiping = () => !!$('#article.dragging, .page.swiping, .page.inc');
  let lastShow = [];
  const SETTLE = 400;          // ms the screen must hold still before notes show
  let lastKey = '', still = 0;
  function frame() {
    if (swiping() && lastShow.length) {
      for (const g of lastShow) {
        const off = g.sel === '.page.cur .a-bet';
        g.el.classList.toggle('on', !off); g.box.classList.toggle('show', !off); g.path.classList.toggle('show', !off);
      }
      raf = requestAnimationFrame(frame);
      return;
    }
    const s = fit(), d = device.getBoundingClientRect(), active = [], now = performance.now();
    let moving = false;
    const sc = $('#screen').getBoundingClientRect(), HEADER = 126 * s;
    for (const g of spots) {
      const target = g.when() && find(g);
      const r = target && target.getBoundingClientRect();
      // its place on the whole screen (scrolled content counted in full), for numbering
      // (pinned things — outside the scrolling content — rank by where they sit: a bar pinned to the
      // foot comes after everything that scrolls, however far down that runs)
      if (r && (r.width || r.height)) {                // not laid out (display: none): no number
        const sc0 = $('#screen').getBoundingClientRect(), scroller = target.closest('.ov-track, #home .list, #home > *, .page');
        const inScroll = !!target.closest('.ov-track, .page') || (!!target.closest('#home') && !target.closest('#tabbar, .tabbar'));
        const sTop = (target.closest('.ov-track, #home, .page') || {}).scrollTop || 0;
        g.ky = inScroll ? r.top + sTop : (r.top > sc0.top + sc0.height * .7 ? 1e5 + r.top : r.top - 1e5);
      } else g.ky = null;
      // off screen (or, inside a scrolling article, up under its header): no note
      const scrolls = !!(target && target.closest('.page'));
      // and within whatever it scrolls in (the list, the landing, a page): nothing clipped at its edge
      const box = target && target.closest('.ov-track, #home, .page');
      const bx = box ? box.getBoundingClientRect() : sc;
      const inView = r && r.top >= Math.max(sc.top, bx.top) + (scrolls ? HEADER : 0) - 1 && r.top <= Math.min(sc.bottom, bx.bottom) - (box && box.matches('.ov-track') ? 90 : 24) && r.right <= sc.right + 1 && r.right >= sc.left;
      const cs = target && getComputedStyle(target);
      // faded out (the trade bar drops away mid-swipe), or mid-drag: no note
      const dragging = !!$('#article.dragging, .page.swiping');
      const shownNow = cs && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > .5 && !(g.sel === '.page.cur .a-bet' && dragging);
      // and only once it has stopped moving: its rect and opacity unchanged for SETTLE ms
      if (r) {
        const sig = `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)},${cs.opacity}`;
        if (sig !== g.sig) { g.sig = sig; g.still = now; }
      } else g.sig = null;
      const ok = r && inView && shownNow && r.width > 4 && r.height > 4;
      if (ok && now - g.still < SETTLE) moving = true;
      g.el.classList.toggle('on', !!ok);
      if (!ok) { if (hover === g) hover = null; continue; }
      active.push(g);
      // the corner facing out: top-left for things on the left of the screen (so its line runs out that way), else top-right
      const leftSide = r.left + r.width / 2 < sc.left + sc.width / 2 && r.width < sc.width * .6;
      // kept inside the screen (a full-width element's corner would sit on its very edge)
      // on a phone there are no lines out to the side, so the dot sits just inside the thing, not on its edge
      // (only for big things: on a small control — a button, an icon — the dot stays on its corner, never over it)
      const phone = innerWidth <= 500, big = r.width > 90 && r.height > 70, inset = phone && big ? 20 : 0;
      // wide sections (a header, a row of tiles, a list) get their dot inside, at staggered points across — not all down one line
      const wide = phone && r.width > sc.width * .6;
      const hx = Math.min(Math.max(wide ? r.left + r.width * [.52, .82, .18, .66, .34, .9, .26, .74][spots.indexOf(g) % 8] : (leftSide ? r.left + inset : r.right - inset), sc.left + 14 * s), sc.right - 14 * s);
      g.el.style.left = ((hx - d.left) / s) + 'px';
      // and at varied depths inside big sections, so the dots scatter across the design
      const dy = phone && big ? Math.min(r.height - 16, Math.max(inset, r.height * [.2, .55, .35, .7, .28, .6, .45, .8][spots.indexOf(g) % 8])) : inset;
      g.el.style.top = ((r.top + dy - d.top) / s) + 'px';
    }
    // numbered top to bottom by hotspot, so 1 is always the highest
    active.sort((a, b) => (Math.round(parseFloat(a.el.style.top) / 4) - Math.round(parseFloat(b.el.style.top) / 4)) || (spots.indexOf(a) - spots.indexOf(b)));
    // no more than five at once — the highest on screen; scrolling brings the next ones in
    active.splice(5).forEach(x => { x.el.classList.remove('on'); if (hover === x) hover = null; });
    // numbers belong to the screen, not the view: scrolled past or not yet reached, each keeps its own
    spots.filter(x => x.ky != null).sort((a, b) => (a.ky - b.ky) || (spots.indexOf(a) - spots.indexOf(b))).forEach((x, i) => { x.num = i + 1; });
    active.forEach(g => { g.el.dataset.n = g.num; g.box.querySelector('em').textContent = g.num; });
    // the whole screen has to be still: any element moving (or the set of
    // notes changing) hides them all until everything has settled again
    const key = active.map(g => g.title).join('|');
    if (moving || key !== lastKey) { lastKey = key; still = now; }
    const show = now - still >= SETTLE ? active : [];
    navList = show.slice().sort((a, b) => a.num - b.num);
    for (const g of spots) g.el.classList.toggle('on', show.includes(g));
    // arriving notes fade in one after another, top to bottom; leaving
    // ones go together, straight away
    for (const g of spots) {
      const on = show.includes(g), was = g.box.classList.contains('show');
      if (on && !was) {
        const delay = `${show.indexOf(g) * .1}s`;
        g.box.style.transitionDelay = g.path.style.transitionDelay = g.el.style.transitionDelay = delay;
      } else if (!on && was) g.box.style.transitionDelay = g.path.style.transitionDelay = g.el.style.transitionDelay = '';
      g.box.classList.toggle('show', on);
      g.box.classList.toggle('lit', notesOn && hover === g);
      g.el.classList.toggle('act', hover === g);   // the label being read: its dot grows on the design
      g.path.classList.toggle('show', on);
    }
    layout(show);
    lastShow = show.slice();
    raf = requestAnimationFrame(frame);
  }
  // turning off: everything fades out together, then the layer goes
  let leaveT = 0;
  const run = () => {
    cancelAnimationFrame(raf);
    clearTimeout(leaveT);
    if (notesOn) {
      body.classList.remove('guides-leaving');
      body.classList.add('guides-on', 'notes-on');
      raf = requestAnimationFrame(frame);
      return;
    }
    const wasOn = body.classList.contains('guides-on');
    spots.forEach(g => {
      g.box.style.transitionDelay = g.path.style.transitionDelay = '0s';
      g.box.classList.remove('show'); g.path.classList.remove('show');
    });
    if (!wasOn) return;
    body.classList.add('guides-leaving');
    leaveT = setTimeout(() => body.classList.remove('guides-on', 'notes-on', 'guides-leaving'), 520);
  };

  // ── switch ──
  const nSw = $('.notes-switch');
  const setNotes = v => {
    notesOn = v; nSw.setAttribute('aria-checked', v); hover = null;
    nSw.setAttribute('aria-label', v ? 'Animation notes: on' : 'Animation notes: off');
    try { localStorage.setItem('intro-notes', v ? '1' : '0'); } catch {}
    run();
  };
  nSw.addEventListener('click', () => setNotes(!notesOn));
  let saved = new URLSearchParams(location.search).get('notes') === '1';
  // every visit starts with labels off (?notes=1 turns them on)
  setNotes(saved);
})();
