// Pure logic for the shell: no page, no storage, no template. Everything here
// takes plain data and returns plain data, so it is tested on its own
// (model.test.mjs) and reused by every part of the shell.

export const FLOW_SCREEN = '@flow';   // comments left on the flow canvas, not on a screen

// ── screens ──────────────────────────────────────────────────────────

/** Screens in their own order, gathered under the group each names (prototype.json: `group`). */
export function groupScreens(screens) {
  const groups = [];
  screens.forEach((screen, index) => {
    const name = screen.group ?? '';
    let group = groups.find(g => g.name === name);
    if (!group) groups.push((group = { name, screens: [] }));
    group.screens.push({ ...screen, number: index + 1 });
  });
  return groups;
}

const SECONDS = { m: 60, h: 3600, d: 86400 };
/** "20m", "5h" or "3d" before `now`, as a time. */
function timeBefore(now, ago) {
  const [, n, unit] = /^(\d+)([mhd])$/.exec(ago ?? '') ?? [null, 0, 'm'];
  return new Date(now - n * SECONDS[unit] * 1000).toISOString();
}

/**
 * A prototype's sample comments (its sample-comments.json), as the documents
 * comments are kept as: every thread, reply and reaction, each with who wrote
 * it (`by`) and when (`ago`, counted back from now so they always look recent).
 */
export function sampleDocuments(samples, { proto, now = Date.now() }) {
  const comments = [], reactions = [];
  const add = (sample, id, where) => {
    const created_at = timeBefore(now, sample.ago);
    comments.push({ id, proto, text: sample.text, author_email: sample.by, created_at, ...where });
    for (const [emoji, people] of Object.entries(sample.reactions ?? {}))
      people.forEach((author_email, n) => reactions.push({ id: `${id}-${emoji}-${n + 1}`, proto, comment: id, emoji, author_email, created_at }));
  };
  samples.forEach((sample, i) => {
    const id = `sample-${i + 1}`;
    const spot = sample.screen === FLOW_SCREEN ? { x: 0, y: 0, near: sample.near, dx: sample.dx ?? 0, dy: sample.dy ?? 0 } : { x: sample.x, y: sample.y };
    add(sample, id, { screen: sample.screen, ...spot, ...(sample.resolved ? { resolved: true } : {}) });
    (sample.replies ?? []).forEach((reply, n) => add(reply, `${id}-${n + 1}`, { screen: sample.screen, parent: id }));
  });
  return { comments, reactions };
}

/**
 * Whether the flow view draws a frame for each group. A long prototype reads
 * better in parts, a short one as a single flow; `choice` (true or false) is
 * what the person picked, and wins. One group alone is never framed.
 */
export const FRAME_FLOWS_FROM = 24;
export function framesFlow(screens, choice = null) {
  if (new Set(screens.map(s => s.group ?? '')).size < 2) return false;
  return choice ?? screens.length > FRAME_FLOWS_FROM;
}

const matches = (text, query) => String(text ?? '').toLowerCase().includes(query.trim().toLowerCase());

export function filterGroups(groups, query) {
  if (!query.trim()) return groups;
  return groups
    .map(g => ({ ...g, screens: g.screens.filter(s => matches(s.title, query) || matches(g.name, query)) }))
    .filter(g => g.screens.length);
}

/** The screen before or after `id`, wrapping round the ends. */
export function neighbour(screens, id, step) {
  const at = Math.max(0, screens.findIndex(s => s.id === id));
  return screens[(at + step + screens.length) % screens.length];
}

// ── prototypes ───────────────────────────────────────────────────────

/** Prototype names (already in display order) gathered under their rounds: [{ round, names }]. */
export function byRound(names, roundOf) {
  const rounds = [];
  for (const name of names) {
    const round = roundOf(name) ?? '';
    let entry = rounds.find(r => r.round === round);
    if (!entry) rounds.push((entry = { round, names: [] }));
    entry.names.push(name);
  }
  return rounds;
}

/** Where every prototype sits after `name` moves one place up or down, or into `round`. */
export function rearrange(rounds, name, change) {
  const flat = rounds.flatMap(r => r.names.map(n => ({ name: n, round: r.round })));
  const at = flat.findIndex(p => p.name === name);
  if (at < 0) return [];
  if (change.round !== undefined) {
    const [moved] = flat.splice(at, 1);
    moved.round = change.round;
    const last = flat.map(p => p.round).lastIndexOf(change.round);
    flat.splice(last < 0 ? flat.length : last + 1, 0, moved);
  } else {
    const to = at + change.move;
    if (to < 0 || to >= flat.length) return [];
    // at a round's edge it steps over the heading into the next round; inside a round it swaps places
    if (flat[to].round !== flat[at].round) flat[at].round = flat[to].round;
    else [flat[at], flat[to]] = [flat[to], flat[at]];
  }
  return flat.map((p, order) => ({ ...p, order }));
}

// ── comments ─────────────────────────────────────────────────────────

/** How many open threads each screen has: Map(screen id → count). */
export function countByScreen(threads) {
  const counts = new Map();
  for (const t of threads) counts.set(t.screen, (counts.get(t.screen) ?? 0) + 1);
  return counts;
}

/** Threads gathered by screen, in the screens' own order, the canvas's last: [{ screen, title, number, threads }]. */
export function threadsByScreen(threads, screens) {
  const order = [...screens.map(s => s.id), FLOW_SCREEN];
  const sections = [];
  for (const id of order) {
    const list = threads.filter(t => t.screen === id);
    if (!list.length) continue;
    const at = screens.findIndex(s => s.id === id);
    sections.push({
      screen: id,
      title: id === FLOW_SCREEN ? 'Flow' : screens[at].title,
      number: id === FLOW_SCREEN ? null : at + 1,
      threads: list,
    });
  }
  return sections;
}

/** Threads with something said by someone else since `seenAt` (an ISO time, or none yet). */
export function unreadThreads(threads, repliesTo, seenAt, myEmail) {
  const fresh = c => c.author_email !== myEmail && (!seenAt || String(c.created_at ?? '') > seenAt);
  return threads.filter(t => fresh(t) || repliesTo(t.id).some(fresh));
}

/**
 * A message's reactions, one entry per emoji in the order each was first used:
 * [{ emoji, count, mine, people: [author emails] }].
 */
export function reactionsFor(reactions, commentId, myEmail) {
  const chips = [];
  for (const r of reactions) {
    if (r.comment !== commentId) continue;
    let chip = chips.find(c => c.emoji === r.emoji);
    if (!chip) chips.push((chip = { emoji: r.emoji, count: 0, mine: false, people: [] }));
    chip.count += 1;
    chip.people.push(r.author_email);
    if (r.author_email === myEmail) chip.mine = true;
  }
  return chips;
}

// ── sharing ──────────────────────────────────────────────────────────

/** A link that opens this prototype on this screen. */
export function shareLink(href, prototype, screen) {
  const url = new URL(href);
  url.search = '';
  url.searchParams.set('set', prototype);
  url.hash = screen ? `#${screen}` : '';
  return url.toString();
}
