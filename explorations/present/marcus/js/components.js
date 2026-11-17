// Components: a board of the design's components in place of the device, grouped by type
// (controls, content, navigation, feedback). One component at a time sits in the middle,
// its name and description off to its left; scroll to move through them, or jump to a
// group from the step bar. Each loads in as it comes into view (and again when tapped).
// The step bar's zoom button shows them all at once in a grid.
//
// To add a component: add a line to its group in GROUPS below — [name, markup, description].

(() => {
  const root = document.documentElement;
  if (root.classList.contains('embed')) return;
  const on = () => root.classList.contains('proto-components');
  const board = document.createElement('div');
  board.className = 'board';
  board.setAttribute('aria-hidden', 'true');
  document.body.appendChild(board);

  // ── wireframe pieces: skeleton lines, circles, blocks and a picture placeholder ──
  const L = (w, h = 10, cls = '') => `<i class="w-l ${cls}" style="width:${w};height:${h}px"></i>`;
  const O = (d, cls = '') => `<i class="w-o ${cls}" style="width:${d}px;height:${d}px"></i>`;
  const PIC = `<svg width="44" height="34" viewBox="0 0 60 46" fill="none" stroke="rgba(160,166,178,.6)" stroke-width="3" stroke-linejoin="round"><rect x="0" y="0" width="60" height="46" rx="6"/><circle cx="18" cy="16" r="5"/><path d="M4 42l16-16 12 10 8-6 16 12"/></svg>`;
  const CHEV = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>`;
  const BACK = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></svg>`;
  const TICK = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;

  // ── the components (blank: shapes only, to be filled in) ──
  const button = `<div class="w-stack">
      <span class="w-btn w-fill">${L('96px', 10, 'w-inv')}</span>
      <span class="w-btn w-line">${L('84px')}</span>
      <div class="w-row w-c"><span class="w-ibtn">${O(14)}</span><span class="w-ibtn">${O(14)}</span><span class="w-ibtn w-fill">${O(14, 'w-inv')}</span></div>
    </div>`;
  const field = `<div class="w-stack">
      <div class="w-field">${L('64px', 9)}<span class="w-input">${L('52%')}</span>${L('72%', 8, 'w-soft')}</div>
      <div class="w-field">${L('80px', 9)}<span class="w-input w-on">${L('38%')}<i class="w-caret"></i></span>${L('44%', 8, 'w-soft')}</div>
    </div>`;
  const toggles = `<div class="w-stack w-tight">
      ${[1, 0].map(on => `<div class="w-row"><span class="w-grow">${L('58%')}${L('40%', 8, 'w-soft')}</span><span class="w-switch${on ? ' w-on' : ''}"><i></i></span></div>`).join('<i class="w-div"></i>')}
      <i class="w-div"></i>
      ${[1, 1, 0].map(on => `<div class="w-row"><span class="w-check${on ? ' w-on' : ''}">${on ? TICK : ''}</span><span class="w-grow">${L(on ? '52%' : '64%')}</span></div>`).join('')}
    </div>`;
  const card = `<div class="w-card">
      <span class="w-pic">${PIC}</span>
      <div class="w-pad">${L('28%', 8)}${L('92%', 14)}${L('68%', 14)}
        <div class="w-row w-mt">${O(26)}<span class="w-grow">${L('46%', 9)}${L('30%', 8, 'w-soft')}</span></div></div>
    </div>`;
  const rows = `<div class="w-stack w-tight">
      ${[0, 1, 2].map(() => `<div class="w-row"><span class="w-thumb"></span><span class="w-grow">${L('70%')}${L('46%', 8, 'w-soft')}</span><span class="w-chev">${CHEV}</span></div>`).join('<i class="w-div"></i>')}
    </div>`;
  const stat = `<div class="w-stack">
      <div class="w-row w-top"><span class="w-grow">${L('40%', 9)}${L('62%', 26)}</span><span class="w-chip">${L('34px', 8)}</span></div>
      <div class="w-bars">${[38, 52, 44, 66, 58, 80, 92].map((h, k) => `<i style="height:${h}%;--i:${k}"${k === 6 ? ' class="w-hi"' : ''}></i>`).join('')}</div>
      <div class="w-row w-sp">${L('22px', 7, 'w-soft')}${L('22px', 7, 'w-soft')}${L('22px', 7, 'w-soft')}${L('22px', 7, 'w-soft')}</div>
    </div>`;
  const header = `<div class="w-stack">
      <div class="w-row w-sp"><span class="w-ibtn">${BACK}</span><span class="w-mid">${L('96px', 10)}${L('60px', 7, 'w-soft')}</span><span class="w-ibtn">${O(14)}</span></div>
      <div class="w-big">${L('58%', 22)}${L('36%', 9, 'w-soft')}</div>
    </div>`;
  const tabbar = `<div class="w-tabs">${[1, 0, 0, 0].map(on => `<span class="w-tab${on ? ' w-on' : ''}">${O(20)}${L('30px', 6)}</span>`).join('')}</div>`;
  const toast = `<div class="w-stack">
      <div class="w-toast">${O(28, 'w-inv')}<span class="w-grow">${L('62%', 10, 'w-inv')}${L('42%', 8, 'w-inv w-soft')}</span>${L('36px', 9, 'w-inv')}</div>
      <div class="w-toast w-light">${O(28)}<span class="w-grow">${L('58%', 10)}${L('38%', 8, 'w-soft')}</span></div>
    </div>`;
  const empty = `<div class="w-empty">
      <span class="w-halo">${PIC}</span>
      ${L('56%', 14)}${L('78%', 9, 'w-soft')}${L('62%', 9, 'w-soft')}
      <span class="w-btn w-fill w-sm">${L('72px', 9, 'w-inv')}</span>
    </div>`;

  const SEARCH = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>`;
  const segmented = `<div class="w-stack">
      <div class="w-seg"><span class="w-on">${L('46px', 9)}</span><span>${L('40px', 9, 'w-soft')}</span><span>${L('44px', 9, 'w-soft')}</span></div>
      <div class="w-grow w-mt">${L('86%')}${L('64%', 8, 'w-soft')}${L('72%', 8, 'w-soft')}</div>
    </div>`;
  const search = `<div class="w-stack">
      <div class="w-search"><span class="w-chev">${SEARCH}</span>${L('44%')}</div>
      ${L('30%', 8)}
      ${[0, 1, 2].map(() => `<div class="w-row">${O(28, 'w-soft')}<span class="w-grow">${L('58%', 9)}</span><span class="w-chev">${CHEV}</span></div>`).join('')}
    </div>`;
  const slider = `<div class="w-stack">
      <div class="w-row w-sp">${L('34%', 9)}<span class="w-chip">${L('26px', 8)}</span></div>
      <div class="w-track"><i class="w-fill-bar" style="left:0;width:62%"></i><i class="w-knob" style="left:62%"></i></div>
      <div class="w-row w-sp w-mt">${L('28%', 9)}<span class="w-chip">${L('44px', 8)}</span></div>
      <div class="w-track"><i class="w-fill-bar" style="left:24%;width:46%"></i><i class="w-knob" style="left:24%"></i><i class="w-knob" style="left:70%"></i></div>
    </div>`;
  const carousel = `<div class="w-stack">
      <div class="w-strip">${[0, 1].map(() => `<div class="w-slide"><span class="w-pic">${PIC}</span><div class="w-pad">${L('34%', 8)}${L('86%', 12)}</div></div>`).join('')}</div>
      <div class="w-dots"><i class="w-on"></i><i></i><i></i><i></i></div>
    </div>`;
  const profile = `<div class="w-empty w-profile">
      ${O(76)}${L('46%', 14)}${L('30%', 9, 'w-soft')}
      <div class="w-stats">${[0, 1, 2].map(() => `<span>${L('28px', 14)}${L('44px', 8, 'w-soft')}</span>`).join('')}</div>
      <span class="w-btn w-fill w-sm">${L('60px', 9, 'w-inv')}</span>
    </div>`;
  const tags = `<div class="w-stack">
      ${L('32%', 9)}
      <div class="w-chips">${[62, 48, 76, 54, 40, 68, 58, 44].map((w, k) => `<span class="w-tag${k === 2 ? ' w-on' : ''}">${L(w + 'px', 8, k === 2 ? 'w-inv' : '')}</span>`).join('')}</div>
    </div>`;
  const sheet = `<div class="w-sheet">
      <i class="w-grab"></i>
      ${L('42%', 12)}
      ${[0, 1, 2].map(() => `<div class="w-row">${O(34, 'w-soft')}<span class="w-grow">${L('54%', 9)}${L('36%', 8, 'w-soft')}</span></div>`).join('')}
      <span class="w-btn w-line">${L('64px')}</span>
    </div>`;
  const steps = `<div class="w-stack">
      <div class="w-steps">${[2, 1, 0].map(st => `<span class="w-step w-s${st}">${st === 2 ? TICK : st === 1 ? '<i></i>' : ''}</span>`).join('<i class="w-link"></i>')}</div>
      <div class="w-row w-sp">${L('52px', 8)}${L('52px', 8)}${L('52px', 8, 'w-soft')}</div>
      <div class="w-grow w-mt">${L('70%', 14)}${L('90%', 8, 'w-soft')}${L('62%', 8, 'w-soft')}</div>
    </div>`;
  const loading = `<div class="w-stack">
      <div class="w-row w-sp">${L('38%', 9)}${L('30px', 9)}</div>
      <div class="w-track"><i class="w-fill-bar" style="left:0;width:64%"></i></div>
      <i class="w-div"></i>
      <div class="w-row"><i class="w-spin"></i><span class="w-grow">${L('48%', 9)}${L('30%', 8, 'w-soft')}</span></div>
    </div>`;
  const dialog = `<div class="w-dialog">
      ${L('56%', 14)}${L('88%', 9, 'w-soft')}${L('66%', 9, 'w-soft')}
      <div class="w-row w-mt"><span class="w-btn w-line w-half">${L('48px', 9)}</span><span class="w-btn w-fill w-half">${L('48px', 9, 'w-inv')}</span></div>
    </div>`;

  const GROUPS = [
    ['c-controls', 'Controls', [
      ['Button', button, 'Primary, secondary and icon buttons. Description of the press state, and where each one is used.'],
      ['Text field', field, 'A labeled input with helper text, at rest and in focus. Description of validation and errors.'],
      ['Toggles & checkboxes', toggles, 'On and off settings, and choices that can be combined. Description of the tap and the change.'],
      ['Segmented control', segmented, 'Switches between a few views of the same content. Description of how the selection slides across.'],
      ['Search bar', search, 'A field for search, with recent searches beneath. Description of suggestions and an empty result.'],
      ['Slider', slider, 'A value, or a range, picked along a track. Description of the steps and what updates as it moves.'],
    ]],
    ['c-content', 'Content', [
      ['Content card', card, 'An image, a kicker, a title and a byline. Description of what a tap opens and the press state.'],
      ['Carousel', carousel, 'Cards in a row that swipe sideways, the next one peeking in. Description of the snap and the dots.'],
      ['List row', rows, 'A thumbnail with two lines and a chevron. Description of the row height and where each leads.'],
      ['Profile header', profile, 'A picture, a name and a line, with counts and a follow button. Description of what each count opens.'],
      ['Tags', tags, 'Topics as chips that wrap to fit, the chosen one filled. Description of choosing more than one.'],
      ['Stat card', stat, 'A headline number and its label, with a small chart of the trend. Description of how it updates.'],
    ]],
    ['c-nav', 'Navigation', [
      ['Header', header, 'Back, a centered title and an action, with a large title beneath. Description of how it condenses on scroll.'],
      ['Tab bar', tabbar, 'Four destinations, the current one lit. Description of the selected state and whether it hides on scroll.'],
      ['Bottom sheet', sheet, 'A sheet that rises from the foot with a set of actions. Description of dragging it and how it closes.'],
      ['Progress steps', steps, 'Where you are in a flow of steps: done, current and still to come. Description of going back a step.'],
    ]],
    ['c-feedback', 'Feedback', [
      ['Toast', toast, 'A short confirmation, with an action or on its own. Description of how long it holds and how it leaves.'],
      ['Loading', loading, 'A progress bar and a spinner while content loads. Description of which is used when, and for how long.'],
      ['Dialog', dialog, 'A question that needs an answer, with two choices. Description of what each does and the backdrop.'],
      ['Empty state', empty, 'What shows when there is nothing yet: a picture, a line of copy and a way forward.'],
    ]],
  ];
  board.innerHTML = `<div class="bd-in">${GROUPS.map(([id, , items]) => `
    <section class="bd-group" id="${id}"><div class="bd-grid">${items.map(([label, html, desc]) => `<figure class="cf"><figcaption><b>${label}</b><span>${desc}</span></figcaption><div class="cf-body">${html}</div></figure>`).join('')}</div></section>`).join('')}</div>`;

  // every component loads in as it comes into view, and again the next time
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && e.intersectionRatio > .35) e.target.classList.add('seen');
    else if (!e.isIntersecting) e.target.classList.remove('seen');
  }), { root: board, threshold: [0, .35] });
  const cfs = [...board.querySelectorAll('.cf')];
  cfs.forEach((f, k) => { f.style.setProperty('--k', k); io.observe(f); });
  // tap the one in the middle to play its load-in again
  board.addEventListener('click', e => {
    const f = e.target.closest('.cf'); if (!f || board.classList.contains('ov') || f !== focus) return;
    f.classList.remove('seen'); f.offsetWidth; f.classList.add('seen');
  });

  // one component at a time, in the middle: the one nearest the centre is in focus, the rest fall back
  let focus = null;
  const prog = document.createElement('div');
  prog.className = 'bd-prog'; prog.innerHTML = '<i class="bp-track"><i class="bp-fill"></i><i class="bp-knob"></i></i><span class="bp-n"></span>';
  document.body.appendChild(prog);
  const progN = prog.querySelector('.bp-n');
  const pickFocus = () => {
    const mid = board.getBoundingClientRect().top + board.clientHeight / 2;
    let best = null, bd = Infinity;
    cfs.forEach(f => { const r = f.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = f; } });
    if (best !== focus) {
      focus?.classList.remove('focus'); best?.classList.add('focus'); focus = best;
      // arriving in the middle: its animation plays from the start, so it's seen in full
      // (on a phone it's a list instead: each plays as it scrolls in)
      if (best && !board.classList.contains('ov') && on() && innerWidth > 500) { best.classList.remove('seen'); best.offsetWidth; best.classList.add('seen'); }
    }
    // the progress bar: how far through the components the one in the middle is
    const k = cfs.indexOf(focus), n = cfs.length;
    prog.style.setProperty('--p', n > 1 ? k / (n - 1) : 0);
    prog.classList.toggle('off', board.classList.contains('ov'));
    progN.textContent = `${String(k + 1).padStart(2, '0')} / ${n}`;
  };
  let pf = 0;
  board.addEventListener('scroll', () => { cancelAnimationFrame(pf); pf = requestAnimationFrame(pickFocus); }, { passive: true });
  setInterval(pickFocus, 300); pickFocus();
  const centre = (f, smooth = true) => f?.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' });
  // tapping a component off to the side brings it to the middle (in the overview: back to it)
  board.addEventListener('click', e => {
    const f = e.target.closest('.cf'); if (!f) return;
    if (board.classList.contains('ov')) { e.stopPropagation(); setOv(false, f); return; }
    if (f !== focus) centre(f);
  }, true);

  // the overview: every component zoomed out in a grid, from the step bar's zoom button (as
  // "All screens" on the other versions); tap one to go back to it, centred
  const zoomBtn = document.querySelector('.steps [data-zoom]');
  let ovT = 0;
  const setOv = (v, to) => {
    if (v === board.classList.contains('ov')) return;
    clearTimeout(ovT); board.classList.add('ov-swap');
    ovT = setTimeout(() => {
      cfs.forEach(f => f.classList.remove('seen'));
      board.classList.toggle('ov', v); zoomBtn?.classList.toggle('on', v);
      if (v) board.scrollTop = 0; else centre(to || focus || cfs[0], false);
      cfs.forEach(f => { io.unobserve(f); io.observe(f); });   // (re-observed, so the ones on screen load in again too)
      requestAnimationFrame(() => { board.classList.remove('ov-swap'); pickFocus(); });
    }, 220);
  };
  // the overview's scale: five columns across the window (cards and spaces scale together), within limits
  const ovSize = () => board.style.setProperty('--ovz', Math.max(.36, Math.min(.72, (innerWidth - 160) / (5 * 362 + 4 * 56))).toFixed(3));
  ovSize(); addEventListener('resize', ovSize);
  zoomBtn?.addEventListener('click', e => {
    if (!on()) return;
    e.preventDefault(); e.stopImmediatePropagation();
    setOv(!board.classList.contains('ov'));
  }, true);
  // keys: ↑ ↓ move one component at a time; Esc leaves the overview
  addEventListener('keydown', e => {
    if (!on() || e.metaKey || e.ctrlKey || e.altKey || document.body.classList.contains('help-on')) return;
    if (e.key === 'Escape' && board.classList.contains('ov')) { e.preventDefault(); setOv(false); return; }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !board.classList.contains('ov')) {
      e.preventDefault();
      centre(cfs[Math.max(0, Math.min(cfs.length - 1, cfs.indexOf(focus) + (e.key === 'ArrowDown' ? 1 : -1)))]);
    }
  });

  // the step bar: the groups in place of the screens; it jumps to each one's first component and follows the one in focus
  const btns = [...document.querySelectorAll('.steps [data-step]')];
  const flow = window.proto;
  window.proto = {
    step: name => {
      if (!on()) return flow.step(name);
      if (!name.startsWith('c-')) return;
      const f = board.querySelector('#' + name + ' .cf');
      board.classList.contains('ov') ? setOv(false, f) : centre(f);
    },
    at: () => on() ? (focus || cfs[0]).closest('.bd-group').id : flow.at(),
  };
  window.protoBoard = { top: () => { board.classList.remove('ov'); zoomBtn?.classList.remove('on'); board.scrollTop = 0; pickFocus(); } };
  let before = null;
  const apply = () => {
    if (on()) {
      before = before || btns.map(x => [x.dataset.step, x.textContent]);
      btns.forEach((x, i) => { x.hidden = !GROUPS[i]; if (GROUPS[i]) { x.dataset.step = GROUPS[i][0]; x.textContent = GROUPS[i][1]; } });
      board.setAttribute('aria-hidden', 'false');
      flow.step('start');
      window.protoBoard.top();
    } else {
      if (before) btns.forEach((x, i) => { [x.dataset.step, x.textContent] = before[i]; });
      btns.forEach(x => { x.hidden = false; });
      before = null;
      board.classList.remove('ov'); zoomBtn?.classList.remove('on');
      board.setAttribute('aria-hidden', 'true');
    }
    dispatchEvent(new Event('resize'));
  };
  addEventListener('proto-set', () => requestAnimationFrame(apply));
  if (on()) apply();
})();
