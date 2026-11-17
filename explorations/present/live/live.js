// Puts a live prototype in Marcus's phone frame. The step bar, the zoomed-out
// view, the phone dots and the arrows all drive screens through window.proto
// ({ step(id), at() }), so this file is the only link between his viewer and
// our prototypes: each screen is a #hash in the prototype's own page.
//
// It also decides who sees what (choices.js): staff see every prototype, with
// a switch on each for whether the client sees it; clients see only the ones
// switched on. Nothing loads into the phone until that is known, so a client
// never glimpses a hidden prototype.

(() => {
  const root = document.documentElement;
  const embed = root.classList.contains('embed');
  const all = window.PRESENT.prototypes;
  const byName = Object.fromEntries(all.map(p => [p.name, p]));
  const proto = byName[window.PROTO_SET] || all[0];
  const AS_CLIENT = 'present-as-client';

  const frame = document.querySelector('#screen .live-frame');
  const screens = proto?.screens.length ? proto.screens : [{ id: '', title: proto?.title ?? '' }];
  const known = id => screens.some(s => s.id === id);

  // ── the step bar holds this prototype's screens (before anything reads it) ──
  const nav = document.querySelector('.steps');
  const sep = nav.querySelector('.steps-sep');
  nav.querySelectorAll('button[data-step]').forEach(b => b.remove());
  for (const s of screens) {
    const b = document.createElement('button');
    b.dataset.step = s.id;
    b.textContent = s.title;
    nav.insertBefore(b, sep);
  }

  // ── screens are #hashes in the prototype ──
  let current = known(location.hash.slice(1)) ? location.hash.slice(1) : screens[0].id;
  let loaded = false;
  const read = () => {
    try {
      const id = frame.contentWindow.location.hash.slice(1);
      if (loaded) current = known(id) ? id : screens[0].id;
    } catch {}
    return current;
  };
  window.proto = {
    step: id => {
      current = id;
      if (!loaded) return;
      try { frame.contentWindow.location.hash = id; } catch { frame.src = `../${proto.name}/#${id}`; }
    },
    at: read,
  };
  // for comments.js: the prototype, its frame, and the screen it's on
  window.presentLive = { proto, frame, screen: read, loaded: () => loaded };
  const open = () => {
    if (loaded || !proto) return;
    loaded = true;
    document.title = `${proto.title} · ${document.title}`;
    frame.title = proto.title;
    frame.src = `../${proto.name}/#${current}`;
  };

  // ── labels, screen notes and the pointer come from prototype.json. Marcus's
  //    scripts measure parts of his own page, so each part of the prototype
  //    gets an invisible stand-in laid over the phone exactly where it is ──
  const standIns = document.createElement('div');
  standIns.className = 'live-stand-ins';
  document.querySelector('#screen').append(standIns);
  const made = new Map();
  const standIn = selector => {
    let el = made.get(selector);
    if (!el) {
      el = document.createElement('i');
      standIns.append(el);
      made.set(selector, el);
    }
    let r = null;
    try {
      if (loaded && !document.body.classList.contains('rotated')) {
        const win = frame.contentWindow;
        const found = win.document.querySelector(selector)?.getBoundingClientRect();
        // only what can be seen: not scrolled away, not hidden
        if (found && found.width > 0 && found.height > 0 && found.bottom > 0 && found.top < win.innerHeight) r = found;
      }
    } catch {}
    const box = r ?? { left: 0, top: 0, width: 0, height: 0 };
    el.style.cssText = `left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${box.height}px`;
    return r ? el : null;
  };
  const on = id => () => loaded && read() === id;
  const esc = text => String(text ?? '').replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
  const notes = proto?.screens ?? [];
  // [screen, element, title, copy] (Marcus's labels)
  window.presentLabels = notes.flatMap(s =>
    (s.labels ?? []).map(l => [on(s.id), () => standIn(l.target), esc(l.title), esc(l.text)]));
  // [screen, element, gesture, where on it] (Marcus's pointer)
  window.presentHints = notes.filter(s => s.hint).map(s => {
    const h = typeof s.hint === 'string' ? { target: s.hint } : s.hint;
    return [on(s.id), () => standIn(h.target), h.gesture ?? 'tap', h.at ?? [0.5, 0.5]];
  });
  // one note for the whole screen (Marcus's screen notes)
  window.presentNotes = Object.fromEntries(notes.filter(s => s.note).map(s => [s.id, s.note]));
  root.classList.toggle('present-hints', window.presentHints.length > 0);

  // ── labels added in the viewer (staff): kept like comments, each at a spot
  //    on a screen, until Claude ties it to its part in prototype.json ──
  const labelStore = (() => {
    const KEY = 'present-labels';
    const online = () => Boolean(window.sites?.db);
    const flat = item => ({ ...(item.data ?? item), id: item.id ?? item._id });
    const local = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
    const put = items => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} };
    return {
      async list() {
        if (!proto) return [];
        if (!online()) return local().filter(l => l.proto === proto.name);
        const items = await window.sites.db.collection('labels').where('proto', 'eq', proto.name).limit(200).list();
        // (clients may be allowed to save, so only labels saved by MetaLab people count)
        return items.map(flat).filter(l => /@metalab\.com$/i.test(l.author_email ?? ''));
      },
      async create(data) {
        const doc = { ...data, proto: proto.name };
        if (!online()) return put([...local(), { ...doc, id: Math.random().toString(36).slice(2) }]);
        return window.sites.db.collection('labels').create(doc);
      },
      async remove(id) {
        if (!online()) return put(local().filter(l => l.id !== id));
        return window.sites.db.collection('labels').delete(id);
      },
    };
  })();
  let viewerLabels = [];
  const spotStandIn = l => {
    const key = `spot:${l.id}`;
    let el = made.get(key);
    if (!el) {
      el = document.createElement('i');
      standIns.append(el);
      made.set(key, el);
    }
    let seen = false;
    try {
      if (loaded && !document.body.classList.contains('rotated')) {
        const win = frame.contentWindow;
        const left = l.x * frame.clientWidth, top = l.y - (win.scrollY || 0);
        seen = top >= 0 && top <= win.innerHeight;
        el.style.cssText = `left:${left - 10}px;top:${top - 10}px;width:20px;height:20px`;
      }
    } catch {}
    return seen ? el : null;
  };
  // Marcus's labels script reads its list once, so it loads after the viewer's own labels are in
  const hasLabels = () => root.classList.toggle('present-labels', window.presentLabels.length + Object.keys(window.presentNotes).length > 0);
  hasLabels();
  const loadGuides = () => {
    if (loadGuides.done) return;
    loadGuides.done = true;
    const script = document.createElement('script');
    script.src = 'js/guides.js';
    script.addEventListener('load', () => {
      window.presentGuidesLoaded = true;
      dispatchEvent(new Event('present-guides'));
    });
    document.body.append(script);
  };
  Promise.race([labelStore.list(), new Promise(done => setTimeout(() => done([]), 2500))])
    .catch(() => [])
    .then(list => {
      viewerLabels = list;
      for (const l of list) window.presentLabels.push([on(l.screen), () => spotStandIn(l), esc(l.title), esc(l.text)]);
      hasLabels();
    })
    .then(() => (document.readyState === 'loading' ? addEventListener('DOMContentLoaded', loadGuides) : loadGuides()));

  // ── the theme switch reaches into the prototype (same site, so it can) ──
  const theme = () => {
    try {
      frame.contentDocument.documentElement.classList.toggle('dark', !document.body.classList.contains('light'));
    } catch {}
  };
  frame.addEventListener('load', theme);

  // ── the mouse over the prototype still counts as moving (it wakes the hidden
  //    controls); taps and keys stay with the prototype ──
  frame.addEventListener('load', () => {
    try {
      frame.contentWindow.addEventListener('pointermove', () => frame.dispatchEvent(new PointerEvent('pointermove', { bubbles: true })), { passive: true });
    } catch {}
  });

  // ── the room the phone takes (status bar, cut-out, home bar), as a real phone
  //    gives an app: --safe-top/right/bottom/left on the prototype's root ──
  const SAFE = { upright: [54, 0, 34, 0], sideways: [0, 62, 21, 62], none: [0, 0, 0, 0] };
  const giveRoom = (doc, [t, r, b, l]) => {
    let style = doc.getElementById('viewer-frame');
    if (!style) {
      style = doc.createElement('style');
      style.id = 'viewer-frame';
      doc.head.append(style);
    }
    style.textContent = `:root { --safe-top: ${t}px; --safe-right: ${r}px; --safe-bottom: ${b}px; --safe-left: ${l}px; scrollbar-width: none; }`;
  };
  const isDesktop = () => root.classList.contains('proto-desktop');
  const safeArea = () => {
    try {
      const bare = isDesktop() || document.body.classList.contains('dev-none');
      giveRoom(frame.contentDocument, SAFE[bare ? 'none' : document.body.classList.contains('rotated') ? 'sideways' : 'upright']);
    } catch {}
  };
  frame.addEventListener('load', safeArea);
  new MutationObserver(safeArea).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(theme).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // ── turned on its side (or back): the prototype changes shape out of sight ──
  let sideways = document.body.classList.contains('rotated');
  new MutationObserver(() => {
    const now = document.body.classList.contains('rotated');
    if (now === sideways) return;
    sideways = now;
    frame.animate([{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1 }], { duration: 700, easing: 'ease' });
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // ── another prototype picked: the design has faded out by now, so load it ──
  const go = name => {
    const url = new URL(location.href);
    url.searchParams.set('set', name);
    url.hash = '';
    location.assign(url);
  };
  if (!embed) addEventListener('proto-set', e => go(e.detail.id));

  // ── nothing to show ──
  const empty = (title, line) => {
    frame.remove();
    const el = document.createElement('div');
    el.className = 'live-empty';
    el.innerHTML = `<b></b><small></small>`;
    el.querySelector('b').textContent = title;
    el.querySelector('small').textContent = line;
    document.querySelector('#screen').prepend(el);
  };
  if (!proto) {
    empty('No prototypes yet', 'Make one with: pnpm new-prototype <name>');
    return;
  }

  // ── who is looking, and what they may see ──
  const store = window.presentChoices;
  let choices = {};
  let staff = false;
  let asClient = false;
  try { asClient = sessionStorage.getItem(AS_CLIENT) === '1'; } catch {}

  const shown = name => Boolean(choices[name]?.show);
  const rank = name => {
    const c = choices[name];
    return { round: c?.round ?? '', order: c?.order ?? all.findIndex(p => p.name === name) };
  };
  const clientView = () => !staff || asClient;

  // the order sets come in: by round (first-seen order), then by their own order
  const arrange = () => {
    const names = all.map(p => p.name).sort((a, b) => rank(a).order - rank(b).order);
    const rounds = [...new Set(names.map(n => rank(n).round))];
    return names.sort((a, b) => rounds.indexOf(rank(a).round) - rounds.indexOf(rank(b).round));
  };

  // SETS is Marcus's list; its arrows step through it, so it holds exactly what can be seen
  const fillSets = () => {
    const full = window.PRESENT.prototypes;
    const make = name => {
      const p = byName[name];
      return { id: p.name, name: p.title, date: p.date || '', note: p.description || '', kind: p.device === 'desktop' ? 'desktop' : undefined };
    };
    const visible = arrange().filter(n => !clientView() || shown(n));
    SETS.splice(0, SETS.length, ...visible.map(make));
    return visible.length && full.length;
  };

  // ── the Prototypes panel: rounds as headings, a show-to-client switch per row (staff) ──
  const EYE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const EYE_OFF = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.2 3.1M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M3 3l18 18"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

  // rounds added in the panel: empty until a prototype is moved under one
  let newRounds = [];
  const GRIP = '<svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor"><circle cx="3" cy="3" r="1.3"/><circle cx="7" cy="3" r="1.3"/><circle cx="3" cy="7" r="1.3"/><circle cx="7" cy="7" r="1.3"/><circle cx="3" cy="11" r="1.3"/><circle cx="7" cy="11" r="1.3"/></svg>';

  const roundHead = (name, editable) => {
    const head = document.createElement('div');
    head.className = 'set-round';
    head.dataset.round = name;
    const label = document.createElement('span');
    label.textContent = name || 'No round';
    head.append(label);
    if (editable && name) {
      label.contentEditable = 'plaintext-only';
      label.spellcheck = false;
      label.title = 'Rename this round';
      label.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); label.blur(); }
        if (e.key === 'Escape') { label.textContent = name; label.blur(); }
      });
      label.addEventListener('blur', () => renameRound(name, label.textContent.trim()));
    }
    return head;
  };

  const renameRound = async (from, to) => {
    if (!to || to === from) return panel();
    newRounds = newRounds.map(r => (r === from ? to : r));
    try {
      for (const name of all.map(p => p.name).filter(n => rank(n).round === from))
        await store.save(choices, name, { round: to });
      window.protoToast?.('Round renamed');
    } catch {
      window.protoToast?.('Could not save. Try again');
    }
    fillSets();
    panel();
  };

  // the panel's rows, top to bottom, are the order: each takes the round above it
  const saveOrder = async focus => {
    const list = document.querySelector('.sets-list');
    let round = '';
    let order = 0;
    const changes = [];
    for (const el of list.children) {
      if (el.classList.contains('set-round')) round = el.dataset.round;
      if (!el.classList.contains('set-wrap')) continue;
      const name = el.dataset.name;
      const was = rank(name);
      if (was.round !== round || choices[name]?.order !== order) changes.push([name, { round, order }]);
      order++;
    }
    try {
      for (const [name, patch] of changes) await store.save(choices, name, patch);
      if (changes.length) window.protoToast?.('Order saved');
    } catch {
      window.protoToast?.('Could not save. Try again');
    }
    const used = new Set(all.map(p => rank(p.name).round));
    newRounds = newRounds.filter(r => !used.has(r));
    fillSets();
    panel();
    if (focus) document.querySelector(`.set-grip[data-name="${focus}"]`)?.focus();
  };

  const addRound = list => {
    const n = new Set([...all.map(p => rank(p.name).round), ...newRounds].filter(Boolean)).size + 1;
    const day = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const head = roundHead('', false);
    const label = head.firstChild;
    label.textContent = `Round ${n} · ${day}`;
    label.contentEditable = 'plaintext-only';
    list.querySelector('.set-add').before(head);
    label.focus();
    getSelection().selectAllChildren(label);
    label.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); label.blur(); }
      if (e.key === 'Escape') { label.textContent = ''; label.blur(); }
    });
    label.addEventListener('blur', () => {
      const name = label.textContent.trim();
      if (name && !newRounds.includes(name)) {
        newRounds.push(name);
        window.protoToast?.('Drag prototypes under it');
      }
      panel();
    });
  };

  // drag a row by its grip, or move it with the arrow keys
  let dragged = null;
  const dropAt = (list, y) => {
    const rows = [...list.children].filter(el => el !== dragged && !el.classList.contains('set-add'));
    const after = rows.find(el => y < el.getBoundingClientRect().top + el.offsetHeight / 2);
    list.insertBefore(dragged, after ?? list.querySelector('.set-add'));
  };
  const reorderable = list => {
    if (list.dataset.reorder) return;
    list.dataset.reorder = '1';
    list.addEventListener('dragover', e => {
      if (!dragged) return;
      e.preventDefault();
      dropAt(list, e.clientY);
    });
    list.addEventListener('drop', e => e.preventDefault());
  };
  const grip = (wrap, name) => {
    const g = document.createElement('button');
    g.className = 'set-grip';
    g.dataset.name = name;
    g.draggable = true;
    g.setAttribute('aria-label', `Move ${byName[name].title} (arrow keys)`);
    g.title = 'Drag to reorder';
    g.innerHTML = GRIP;
    g.addEventListener('dragstart', e => {
      dragged = wrap;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', name);
      e.dataTransfer.setDragImage(wrap, 16, wrap.offsetHeight / 2);
      requestAnimationFrame(() => wrap.classList.add('dragging'));
    });
    g.addEventListener('dragend', () => {
      wrap.classList.remove('dragging');
      dragged = null;
      saveOrder();
    });
    g.addEventListener('keydown', e => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      const list = wrap.parentElement;
      if (e.key === 'ArrowUp') {
        const before = wrap.previousElementSibling;
        if (!before) return;
        list.insertBefore(wrap, before);
      } else {
        const next = wrap.nextElementSibling;
        if (!next || next.classList.contains('set-add')) return;
        next.after(wrap);
      }
      saveOrder(name);
    });
    return g;
  };

  const panel = () => {
    const list = document.querySelector('.sets-list');
    if (!list) return;
    const items = Object.fromEntries([...list.querySelectorAll('.set-item')].map(el => [el.dataset.id, el]));
    const staffView = !clientView();
    list.replaceChildren();
    list.classList.toggle('set-editing', staffView);
    const names = arrange();
    // staff see every round, so rows can be moved into them; "No round" once any exist
    const named = staffView && (newRounds.length || names.some(n => rank(n).round));
    let round = null;
    for (const name of names) {
      const item = items[name];
      if (!item) continue;
      const visible = staffView || shown(name);
      const r = rank(name).round;
      if (visible && r !== round && (r || named)) list.append(roundHead(r, staffView));
      if (visible) round = r;
      const wrap = document.createElement('div');
      wrap.className = 'set-wrap';
      wrap.dataset.name = name;
      wrap.hidden = !visible;
      if (staffView) wrap.append(grip(wrap, name));
      wrap.append(item);
      const b = item.querySelector('b');
      b.querySelector('em')?.remove();
      if (staffView && !shown(name)) b.insertAdjacentHTML('beforeend', '<em>Hidden</em>');
      if (staffView) {
        const eye = document.createElement('button');
        eye.className = 'set-eye';
        eye.setAttribute('aria-pressed', shown(name));
        eye.setAttribute('aria-label', `Show ${byName[name].title} to the client`);
        eye.title = shown(name) ? 'The client sees this' : 'Hidden from the client';
        eye.innerHTML = shown(name) ? EYE : EYE_OFF;
        eye.addEventListener('click', async () => {
          eye.disabled = true;
          try {
            await store.save(choices, name, { show: !shown(name) });
            const said = shown(name) ? 'Shown to the client' : 'Hidden from the client';
            // (on Sites, the prototype's own access follows once Claude syncs it)
            window.protoToast?.(store.online() ? `${said}. Ask Claude to sync client access` : said);
          } catch {
            window.protoToast?.('Could not save. Try again');
          }
          panel();
        });
        wrap.append(eye);
      }
      list.append(wrap);
    }
    if (staffView) {
      for (const r of newRounds) list.append(roundHead(r, true));
      const add = document.createElement('button');
      add.className = 'set-add';
      add.innerHTML = '<span>+</span> New round';
      add.addEventListener('click', () => addRound(list));
      list.append(add);
      reorderable(list);
    }
    dispatchEvent(new Event('resize'));
  };

  const setAsClient = v => {
    asClient = v;
    try { sessionStorage.setItem(AS_CLIENT, asClient ? '1' : '0'); } catch {}
    window.protoToast?.(asClient ? 'Client view' : 'Staff view');
    if (!loaded || (clientView() && !shown(proto.name))) {
      const first = clientView() ? arrange().find(shown) : null;
      return first ? go(first) : location.reload();
    }
    fillSets();
    panel();
    changed();
  };

  // ── for the shell (shell.js): what it shows, and how it changes things ──
  const changed = () => dispatchEvent(new Event('present-change'));
  window.presentShell = {
    all, proto, screens, ready: false,
    staff: () => staff,
    asClient: () => asClient,
    clientView: () => clientView(),
    shown: name => shown(name),
    rank: name => rank(name),
    visible: () => arrange().filter(n => !clientView() || shown(n)),
    online: () => store.online(),
    go,
    // a small picture of a screen (the grid, the flow) gets the room an upright phone takes
    room: doc => giveRoom(doc, SAFE[isDesktop() ? 'none' : 'upright']),
    setAsClient,
    async setShown(name, show) {
      await store.save(choices, name, { show });
      fillSets();
      panel();
      changed();
    },
    // rounds and order: [{ name, round, order }], saved where they changed
    async arrange(places) {
      for (const { name, round, order } of places) {
        const was = rank(name);
        if (was.round !== round || choices[name]?.order !== order) await store.save(choices, name, { round, order });
      }
      fillSets();
      panel();
      changed();
    },
    labels: {
      viewer: () => viewerLabels,
      add: data => labelStore.create(data),
      remove: id => labelStore.remove(id),
    },
  };

  // ── Settings: staff can see the viewer as the client does ──
  const clientSwitch = () => {
    const body = document.querySelector('.settings:not(.sets) .sm-body');
    const head = body?.querySelector('.settings-head');
    if (!head) return;
    const row = document.createElement('div');
    row.className = 'set-row client-row';
    row.innerHTML = `<div><span>Client View</span><small>See only what the client sees</small></div><button class="skip-switch client-switch" role="switch" aria-label="Client view"><i></i>${EYE_OFF}${EYE}</button>`;
    const sw = row.querySelector('button');
    sw.setAttribute('aria-checked', asClient);
    sw.addEventListener('click', () => {
      asClient = !asClient;
      try { sessionStorage.setItem(AS_CLIENT, asClient ? '1' : '0'); } catch {}
      sw.setAttribute('aria-checked', asClient);
      window.protoToast?.(asClient ? 'Client view' : 'Staff view');
      if (!loaded || (clientView() && !shown(proto.name))) {
        const first = clientView() ? arrange().find(shown) : null;
        return first ? go(first) : location.reload();
      }
      fillSets();
      panel();
    });
    head.after(row);
  };

  // Marcus's panels build their rows once the page has run its scripts
  const whenLoaded = fn => (document.readyState === 'complete' ? fn() : addEventListener('load', fn));

  const decide = () => {
    root.classList.toggle('present-staff', staff);
    // (staff keep their way back out of Client View, even when it shows nothing)
    if (staff && !embed) whenLoaded(clientSwitch);
    if (clientView() && !shown(proto.name)) {
      const first = arrange().find(shown);
      if (first && !embed) return go(first);
      // (the shell still starts, bare: staff in Client View need their way back out)
      window.presentShell.empty = true;
      window.presentShell.ready = true;
      changed();
      return empty('Nothing to show yet', 'The team hasn’t shared a prototype here yet.');
    }
    open();
    if (embed) return;
    fillSets();
    whenLoaded(panel);
    window.presentShell.ready = true;
    changed();
  };

  Promise.race([
    Promise.all([store.person(), store.load()]),
    new Promise((_, no) => setTimeout(() => no(new Error('timed out')), 6000)),
  ])
    .then(([who, saved]) => {
      staff = who.staff;
      choices = saved;
    })
    .catch(() => {})                                 // unknown: treated as a client, so nothing hidden leaks
    .then(decide);
})();
