// Comments on a prototype, as in Figma: press the bubble (or C), click a spot on
// the screen, write. Each comment is a thread, with replies, emoji reactions and
// a tick to resolve it. Everyone who can open the viewer can take part.
//
// On Sites they live in the viewer's own database (collections "comments" and
// "reactions") and arrive live for everyone looking. Locally (pnpm present)
// they live in this browser. A comment: { proto, screen, x, y, text, parent?,
// resolved? }; x is a share of the screen's width and y is pixels down the
// page, so a pin stays on its spot as the prototype scrolls. A reaction:
// { proto, comment, emoji }. Sites stamps each with author_email.

(() => {
  const live = window.presentLive;
  if (!live?.proto || document.documentElement.classList.contains('embed')) return;
  const { frame, proto } = live;
  const body = document.body;
  const screenEl = document.querySelector('#screen');
  const EMOJI = ['👍', '❤️', '😂', '🎉', '👀', '🤔', '✅', '🔥'];

  // ── where they are kept ──
  const store = (() => {
    const online = () => Boolean(window.sites?.db);
    const KEY = { comments: 'present-comments', reactions: 'present-reactions' };
    const mine = 'you@this-browser';
    const localAll = col => {
      try { return JSON.parse(localStorage.getItem(KEY[col])) || []; } catch { return []; }
    };
    const localPut = (col, items) => {
      try { localStorage.setItem(KEY[col], JSON.stringify(items)); } catch {}
    };
    const flat = item => ({ ...(item.data ?? item), id: item.id ?? item._id });
    return {
      online,
      async me() {
        if (!online()) return { email: mine };
        const user = await window.sites.user();
        return { email: user?.email ?? '' };
      },
      async list(col) {
        if (!online()) return localAll(col).filter(i => i.proto === proto.name);
        const items = await window.sites.db.collection(col)
          .where('proto', 'eq', proto.name).orderBy('created_at', 'asc').limit(200).list();
        return items.map(flat);
      },
      async create(col, data) {
        const doc = { ...data, proto: proto.name };
        if (!online()) {
          const item = { ...doc, id: Math.random().toString(36).slice(2), created_at: new Date().toISOString(), author_email: mine };
          localPut(col, [...localAll(col), item]);
          return item;
        }
        return flat(await window.sites.db.collection(col).create(doc));
      },
      async update(col, id, patch) {
        if (!online()) return localPut(col, localAll(col).map(i => (i.id === id ? { ...i, ...patch } : i)));
        return window.sites.db.collection(col).update(id, patch);
      },
      async remove(col, id) {
        if (!online()) return localPut(col, localAll(col).filter(i => i.id !== id));
        return window.sites.db.collection(col).delete(id);
      },
      // on someone's own computer a prototype's sample comments can be put in, and all of its comments cleared
      // (shell/samples.js)
      local: () => !online(),
      addAll(docs) {
        for (const col of Object.keys(KEY)) localPut(col, [...localAll(col), ...(docs[col] ?? [])]);
      },
      clear() {
        for (const col of Object.keys(KEY)) localPut(col, localAll(col).filter(i => i.proto !== proto.name));
      },
      // someone (here or elsewhere) changed something: fetch again
      watch(changed) {
        if (!online()) {
          addEventListener('storage', e => { if (Object.values(KEY).includes(e.key)) changed(); });
          return;
        }
        for (const col of Object.keys(KEY))
          window.sites.db.collection(col).subscribe({ onCreate: changed, onUpdate: changed, onDelete: changed });
      },
    };
  })();

  let me = { email: '' };
  let comments = [];
  let reactions = [];
  let on = false;
  let open = null;       // the thread on show: a comment id, or { x, y, screen } for a new one
  let picking = null;    // the message whose emoji row is open

  const toast = text => window.protoToast?.(text);
  const failed = () => toast('Could not save. Try again');

  // ── who wrote it: from the email Sites stamps, which can't be faked ──
  const nameOf = email => {
    if (!email || email === 'you@this-browser') return 'You';
    return email.split('@')[0].split(/[._-]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  };
  const initials = email => nameOf(email).split(' ').map(w => w[0]).slice(0, 2).join('');
  const ago = iso => {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (!(s >= 0)) return '';
    if (s < 60) return 'now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const threads = () => comments.filter(c => !c.parent && !c.resolved);
  const repliesTo = id => comments.filter(c => c.parent === id)
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  const byId = id => comments.find(c => c.id === id);

  // ── the switch, beside the labels and the pointer ──
  const BUBBLE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M4 12a8 8 0 1 1 4.3 7.1L4 20l.9-4.1A8 8 0 0 1 4 12z"/></svg>';
  const sw = document.createElement('button');
  sw.className = 'comments-switch';
  sw.setAttribute('role', 'switch');
  sw.setAttribute('aria-checked', 'false');
  sw.setAttribute('aria-label', 'Comments');
  sw.title = 'Comments (C)';
  sw.innerHTML = `${BUBBLE}<span class="cm-count" hidden></span>`;
  document.querySelector('.top-left')?.append(sw);
  const count = sw.querySelector('.cm-count');

  // ── over the phone's screen: a sheet that takes the click, and the pins ──
  const layer = document.createElement('div');
  layer.className = 'cm-layer';
  layer.innerHTML = '<button class="cm-catch" aria-label="Add a comment here (click a spot on the screen)"></button>';
  screenEl.append(layer);
  const catcher = layer.querySelector('.cm-catch');

  // ── the card with the thread, or a new comment ──
  const pop = document.createElement('div');
  pop.className = 'cm-pop';
  pop.setAttribute('role', 'dialog');
  pop.hidden = true;
  pop.innerHTML = `<div class="cm-head"><b>Comment</b><button class="cm-resolve" aria-label="Resolve" title="Resolve"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button><button class="cm-close" aria-label="Close" title="Close"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
<div class="cm-msgs"></div>
<form class="cm-form"><textarea rows="1" aria-label="Comment"></textarea><button type="submit" aria-label="Send" title="Send (Enter)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button></form>`;
  body.append(pop);
  const msgs = pop.querySelector('.cm-msgs');
  const form = pop.querySelector('.cm-form');
  const field = form.querySelector('textarea');
  const sendBtn = form.querySelector('button');
  // Marcus's page listens for keys ([ ] step prototypes) and presses (drags the
  // phone): none of that while someone is writing here
  for (const el of [pop, layer]) {
    el.addEventListener('keydown', e => { if (e.key !== 'Escape') e.stopPropagation(); });
    el.addEventListener('pointerdown', e => e.stopPropagation());
  }

  // ── geometry: the prototype's own pixels, inside the phone's screen ──
  const view = () => {
    try {
      const win = frame.contentWindow;
      return { w: frame.clientWidth, h: frame.clientHeight, top: win.scrollY || 0 };
    } catch {
      return { w: frame.clientWidth, h: frame.clientHeight, top: 0 };
    }
  };
  const scale = () => screenEl.getBoundingClientRect().width / (screenEl.offsetWidth || 1);
  const pointAt = (x, y) => {
    const v = view();
    return { left: x * v.w, top: y - v.top, seen: y - v.top >= 0 && y - v.top <= v.h };
  };

  // ── pins ──
  const pins = new Map();
  const pinFor = (key, email, label) => {
    let pin = pins.get(key);
    if (!pin) {
      pin = document.createElement('button');
      pin.className = 'cm-pin';
      pin.addEventListener('click', e => {
        e.stopPropagation();
        if (typeof key === 'string' && key !== 'draft') show(open === key ? null : key);
      });
      layer.append(pin);
      pins.set(key, pin);
    }
    pin.textContent = initials(email);
    pin.setAttribute('aria-label', label);
    return pin;
  };

  function place() {
    const screen = live.screen();
    const keep = new Set();
    const spots = threads().filter(t => t.screen === screen).map(t => [t.id, t, `Comment by ${nameOf(t.author_email)}: ${t.text}`]);
    if (open && typeof open === 'object' && open.screen === screen) spots.push(['draft', { ...open, author_email: me.email }, 'New comment']);
    for (const [key, spot, label] of spots) {
      const pin = pinFor(key, spot.author_email, label);
      const p = pointAt(spot.x, spot.y);
      pin.style.left = `${p.left}px`;
      pin.style.top = `${p.top}px`;
      pin.hidden = !p.seen;
      pin.classList.toggle('active', open === key || key === 'draft');
      keep.add(key);
    }
    for (const [key, pin] of pins) if (!keep.has(key)) { pin.remove(); pins.delete(key); }
    // the card follows its pin (or closes when its screen is left)
    if (!pop.hidden) {
      const pin = pins.get(typeof open === 'object' ? 'draft' : open);
      if (!pin || pin.hidden) return show(null);
      const r = pin.getBoundingClientRect();
      if (innerWidth <= 500) { pop.style.left = pop.style.top = ''; return; }
      const w = pop.offsetWidth, h = pop.offsetHeight;
      // (the shell's side panel takes the right of the window, and its bar the top: the card keeps clear of both)
      const taken = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--shell-right')) || 0;
      let x = r.right + 12;
      if (x + w > innerWidth - taken - 12) x = r.left - 12 - w;
      const y = Math.min(Math.max(r.top - 8, 68), innerHeight - 12 - h);
      pop.style.left = `${Math.max(12, x)}px`;
      pop.style.top = `${y}px`;
    }
  }

  let raf = 0;
  const loop = () => { place(); raf = requestAnimationFrame(loop); };

  // ── the card's contents ──
  const myReaction = (id, emoji) => reactions.find(r => r.comment === id && r.emoji === emoji && r.author_email === me.email);

  const reactRow = c => {
    const mineOf = e => myReaction(c.id, e);
    const counts = new Map();
    for (const r of reactions.filter(r => r.comment === c.id)) counts.set(r.emoji, (counts.get(r.emoji) ?? []).concat(r));
    const row = document.createElement('div');
    row.className = 'cm-reacts';
    for (const [emoji, list] of counts) {
      const chip = document.createElement('button');
      chip.className = 'cm-chip';
      chip.setAttribute('aria-pressed', Boolean(mineOf(emoji)));
      chip.title = list.map(r => nameOf(r.author_email)).join(', ');
      chip.textContent = `${emoji} ${list.length}`;
      chip.addEventListener('click', () => react(c.id, emoji).catch(failed));
      row.append(chip);
    }
    const add = document.createElement('button');
    add.className = 'cm-chip cm-add';
    add.setAttribute('aria-label', 'Add a reaction');
    add.title = 'Add a reaction';
    add.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5s1.2 1.8 3.5 1.8 3.5-1.8 3.5-1.8"/><path d="M9 9.5h.01M15 9.5h.01"/></svg>';
    add.addEventListener('click', () => { picking = picking === c.id ? null : c.id; paint(); });
    row.append(add);
    if (picking === c.id) {
      const pick = document.createElement('div');
      pick.className = 'cm-picker';
      for (const emoji of EMOJI) {
        const b = document.createElement('button');
        b.textContent = emoji;
        b.setAttribute('aria-label', `React with ${emoji}`);
        b.addEventListener('click', () => { picking = null; react(c.id, emoji).catch(failed); });
        pick.append(b);
      }
      row.append(pick);
    }
    return row;
  };

  const message = c => {
    const el = document.createElement('div');
    el.className = 'cm-msg';
    el.innerHTML = '<i class="cm-av"></i><div class="cm-body"><div class="cm-meta"><b></b><time></time></div><p></p></div>';
    el.querySelector('.cm-av').textContent = initials(c.author_email);
    el.querySelector('b').textContent = nameOf(c.author_email);
    el.querySelector('time').textContent = ago(c.created_at);
    el.querySelector('time').dateTime = c.created_at ?? '';
    el.querySelector('p').textContent = c.text;
    // your own words can go (a thread only while nobody else has replied)
    const others = !c.parent && repliesTo(c.id).some(r => r.author_email !== me.email);
    if (c.author_email === me.email && !others) {
      const del = document.createElement('button');
      del.className = 'cm-del';
      del.textContent = 'Delete';
      del.addEventListener('click', () => removeMessage(c));
      el.querySelector('.cm-meta').append(del);
    }
    el.querySelector('.cm-body').append(reactRow(c));
    return el;
  };

  function paint() {
    if (pop.hidden) return;
    const thread = typeof open === 'string' ? byId(open) : null;
    pop.classList.toggle('cm-new', !thread);
    pop.querySelector('.cm-resolve').hidden = !thread;
    field.placeholder = thread ? 'Reply' : 'Add a comment';
    msgs.replaceChildren(...(thread ? [thread, ...repliesTo(thread.id)].map(message) : []));
    sendBtn.disabled = !field.value.trim();
  }

  function show(target) {
    picking = null;
    const wasNew = open && typeof open === 'object';
    open = target;
    pop.hidden = !target;
    if (!target) { field.value = ''; return; }
    if (wasNew || typeof target === 'object') field.value = '';
    paint();
    place();
    field.focus();
  }

  // ── doing things ──
  async function refresh() {
    try {
      [comments, reactions] = await Promise.all([store.list('comments'), store.list('reactions')]);
    } catch { return; }
    if (typeof open === 'string' && !threads().some(t => t.id === open)) show(null);
    const n = threads().length;
    count.hidden = !n;
    count.textContent = n;
    sw.setAttribute('aria-label', n ? `Comments (${n} open)` : 'Comments');
    paint();
    if (on) place();
    dispatchEvent(new Event('present-comments'));
  }

  async function send() {
    const text = field.value.trim();
    if (!text || !open) return;
    sendBtn.disabled = true;
    try {
      if (typeof open === 'object') {
        const made = await store.create('comments', { screen: open.screen, x: open.x, y: open.y, text });
        field.value = '';
        await refresh();
        show(made.id);
      } else {
        await store.create('comments', { screen: byId(open).screen, parent: open, text });
        field.value = '';
        await refresh();
      }
    } catch {
      failed();
    }
    paint();
  }

  // Toggles this person's `emoji` on comment `id`. Rejects when it could not be
  // saved, so each caller reports that its own way.
  async function react(id, emoji) {
    const mine = myReaction(id, emoji);
    try {
      if (mine) await store.remove('reactions', mine.id);
      else await store.create('reactions', { comment: id, emoji });
    } finally {
      await refresh();
    }
  }

  async function removeMessage(c) {
    try {
      await store.remove('comments', c.id);
      if (!c.parent) show(null);
    } catch {
      failed();
    }
    refresh();
  }

  async function resolve() {
    if (typeof open !== 'string') return;
    try {
      await store.update('comments', open, { resolved: true });
      toast('Resolved');
      show(null);
    } catch {
      failed();
    }
    refresh();
  }

  // ── comment mode: the prototype rests and a click drops a pin ──
  const setOn = v => {
    on = v;
    sw.setAttribute('aria-checked', v);
    body.classList.toggle('comment-mode', v);
    cancelAnimationFrame(raf);
    if (v) { loop(); toast(threads().length ? 'Comments: click a pin, or a spot to add one' : 'Click a spot to comment'); }
    else show(null);
    dispatchEvent(new Event('present-comments'));
  };
  sw.addEventListener('click', () => setOn(!on));

  catcher.addEventListener('click', e => {
    if (open) return show(null);
    const r = screenEl.getBoundingClientRect();
    const s = scale(), v = view();
    // a click with the keyboard has no spot: the middle of the screen
    const px = e.detail ? (e.clientX - r.left) / s : v.w / 2;
    const py = e.detail ? (e.clientY - r.top) / s : v.h / 2;
    show({ screen: live.screen(), x: px / (v.w || 1), y: py + v.top });
  });

  pop.querySelector('.cm-close').addEventListener('click', () => show(null));
  pop.querySelector('.cm-resolve').addEventListener('click', resolve);
  form.addEventListener('submit', e => { e.preventDefault(); send(); });
  field.addEventListener('input', () => {
    sendBtn.disabled = !field.value.trim();
    field.style.height = 'auto';
    field.style.height = `${Math.min(field.scrollHeight, 120)}px`;
  });
  field.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });

  addEventListener('keydown', e => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName ?? '') || document.activeElement?.isContentEditable;
    if ((e.key === 'c' || e.key === 'C') && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) setOn(!on);
  }, true);

  // ── for the shell (shell.js): the list of threads, and the canvas's own comments ──
  window.presentComments = {
    all: () => comments,
    threads,
    resolved: () => comments.filter(c => !c.parent && c.resolved),
    repliesTo,
    nameOf,
    initials,
    ago,
    me: () => me,
    isOn: () => on,
    setOn,
    show: id => show(id),
    openId: () => (typeof open === 'string' ? open : null),
    reactions: () => reactions,
    emoji: EMOJI,
    react,
    async create(data) {
      const made = await store.create('comments', data);
      await refresh();
      return made;
    },
    async resolve(id, resolved = true) {
      await store.update('comments', id, { resolved });
      if (resolved && open === id) show(null);
      await refresh();
    },
    async remove(id) {
      await store.remove('comments', id);
      await refresh();
    },
    local: () => store.local(),
    async addAll(docs) {
      store.addAll(docs);
      await refresh();
    },
    async clear() {
      store.clear();
      show(null);
      await refresh();
    },
  };

  // Esc: the open card first, then comment mode itself
  window.presentEscape?.add(60, () => {
    if (!on) return false;
    if (open) show(null); else setOn(false);
    return true;
  });

  // ── start ──
  store.me().then(m => { me = m; }, () => {}).then(refresh).finally(() => store.watch(refresh));
  if (new URLSearchParams(location.search).get('comments') === '1') setOn(true);
})();
