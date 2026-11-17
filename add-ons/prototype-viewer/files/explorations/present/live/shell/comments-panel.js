// The comments panel: every thread on the prototype, under the screen it was
// left on. Opening a thread goes to its screen (or the flow canvas) and shows
// its replies here, with a box to answer and a tick to resolve it.

import { saving } from './actions.js';
import { clear, h, icon, keepKeys, segmented } from './dom.js';
import { engine } from './engine.js';
import { FLOW_SCREEN, reactionsFor, threadsByScreen, unreadThreads } from './model.js';
import { emptyNote, sectionLabel } from './parts.js';
import { attachPopover } from './popover.js';
import { commentOnFlow } from './screens-view.js';
import { remembered, setUi, subscribe, ui } from './store.js';

export const PANEL_WIDTH = 360;

let panel, body;
let filter = 'open';
let wasOpen = false;
let shown = null;   // the thread last brought into view: one opened from its pin may sit far down the list
let freshAtOpen = new Set();   // threads that were unread when the panel opened: marked "New" until it closes
const reply = h('textarea', { rows: '1', placeholder: 'Reply', 'aria-label': 'Reply' });

const seenKey = () => `seen:${engine.prototypes().proto.name}`;

/** Threads someone else has added to since this person last opened the panel. */
export function unreadCount() {
  const c = engine.comments();
  if (!c) return 0;
  return unreadThreads(c.threads(), c.repliesTo, remembered.get(seenKey()), c.me().email).length;
}

function openThread(thread) {
  if (thread.screen === FLOW_SCREEN) return setUi({ thread: thread.id, screens: 'flow' });
  engine.step(thread.screen);
  engine.comments().setOn(true);
  setUi({ thread: thread.id, screens: null });
}

// The panel is rebuilt on every change, but an open picker hangs off its add
// button: each message keeps the same one, so the picker stays anchored.
const addButtons = new Map();

function addReactionButton(c, comment) {
  let button = addButtons.get(comment.id);
  if (button) return button;
  button = h('button', { class: 'sh-react add', type: 'button', 'aria-label': 'Add a reaction', title: 'Add a reaction' }, icon('smilePlus', 14));
  attachPopover(button, {
    label: 'Reactions',
    build: close => {
      // (its message left the panel: a resolved thread, a filter, a delete elsewhere)
      if (!button.isConnected) queueMicrotask(close);
      const mine = new Set(reactionsFor(c.reactions(), comment.id, c.me().email).filter(r => r.mine).map(r => r.emoji));
      return h('div', { class: 'sh-pop-body sh-emoji-pick' },
        c.emoji.map(emoji => h('button', {
          class: 'sh-emoji',
          type: 'button',
          'aria-label': `React with ${emoji}`,
          'aria-pressed': String(mine.has(emoji)),
          onClick: () => {
            close();
            saving(() => c.react(comment.id, emoji));
          },
        }, emoji)));
    },
  });
  addButtons.set(comment.id, button);
  return button;
}

function reactionRow(c, comment) {
  const me = c.me().email;
  const chips = reactionsFor(c.reactions(), comment.id, me);
  const names = people => people.map(email => (email === me ? 'You' : c.nameOf(email))).join(', ');
  return h('div', { class: `sh-reacts${chips.length ? '' : ' empty'}` },
    chips.map(chip => h('button', {
      class: 'sh-react',
      type: 'button',
      'aria-pressed': String(chip.mine),
      'aria-label': `${chip.emoji} ${chip.count}, reacted by ${names(chip.people)}. ${chip.mine ? 'Remove your reaction' : 'Add your reaction'}`,
      title: names(chip.people),
      onClick: () => saving(() => c.react(comment.id, chip.emoji)),
    }, h('span', { text: chip.emoji }), h('b', { text: String(chip.count) }))),
    addReactionButton(c, comment));
}

function message(c, comment, ...after) {
  return h('div', { class: 'sh-msg' },
    h('i', { class: 'sh-avatar', text: c.initials(comment.author_email) }),
    h('div', {},
      h('div', { class: 'sh-msg-meta' }, h('b', { text: c.nameOf(comment.author_email) }), h('time', { text: c.ago(comment.created_at) })),
      h('p', { text: comment.text }),
      after));
}

function threadCard(c, thread) {
  const replies = c.repliesTo(thread.id);
  const expanded = ui.thread === thread.id;
  const send = async () => {
    const text = reply.value.trim();
    if (!text) return reply.focus();
    const made = await saving(() => c.create({ screen: thread.screen, parent: thread.id, text }));
    if (made) reply.value = '';
  };
  // (one reply box, owned by whichever thread is open)
  if (expanded) reply.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  // (the head button stretches over the whole top, so the reactions, which are
  // buttons themselves, can sit beside it and still read as part of it)
  return h('article', { class: `sh-thread${expanded ? ' open' : ''}` },
    h('div', { class: 'sh-thread-top' },
      h('button', {
        class: 'sh-thread-head',
        type: 'button',
        'aria-expanded': String(expanded),
        onClick: () => (expanded ? setUi({ thread: null }) : openThread(thread)),
      }, message(c, thread)),
      reactionRow(c, thread),
      h('span', { class: 'sh-thread-meta' },
        freshAtOpen.has(thread.id) ? h('span', { class: 'sh-count new', text: 'New' }) : null,
        !expanded && replies.length ? h('small', { text: `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}` }) : null)),
    expanded ? h('div', { class: 'sh-thread-body' },
      replies.map(r => message(c, r, reactionRow(c, r))),
      thread.resolved ? null : h('div', { class: 'sh-pop-row' }, reply, h('button', { class: 'sh-btn primary', type: 'button', onClick: send }, 'Reply')),
      h('div', { class: 'sh-pop-row end' },
        thread.resolved
          ? h('button', { class: 'sh-btn quiet', type: 'button', onClick: () => saving(() => c.resolve(thread.id, false), 'Reopened') }, 'Reopen')
          : h('button', { class: 'sh-btn quiet', type: 'button', onClick: () => saving(() => c.resolve(thread.id), 'Resolved') }, icon('check', 14), 'Resolve'))) : null);
}

function addComment() {
  if (ui.screens === 'flow') return commentOnFlow();
  if (ui.screens) setUi({ screens: null });
  engine.comments().setOn(true);
}

function render() {
  const open = ui.panel === 'comments';
  panel.hidden = !open;
  document.body.classList.toggle('sh-panel-open', open);
  if (open !== wasOpen) {
    wasOpen = open;
    // (on a phone the panel covers the screen, so the stage keeps its place)
    engine.reserve(open && innerWidth > 500 ? PANEL_WIDTH : 0);
    const c = engine.comments();
    if (open && c) {
      freshAtOpen = new Set(unreadThreads(c.threads(), c.repliesTo, remembered.get(seenKey()), c.me().email).map(t => t.id));
      remembered.set(seenKey(), new Date().toISOString());
      c.setOn(true);
    }
    if (!open) {
      freshAtOpen = new Set();
      c?.setOn(false);
    }
  }
  if (!open) {
    shown = null;
    return;
  }
  const c = engine.comments();
  const { screens } = engine.prototypes();
  const lists = { open: c.threads(), resolved: c.resolved() };
  const sections = threadsByScreen(lists[filter], screens);
  const typing = document.activeElement === reply;
  const ids = new Set(c.all().map(m => m.id));
  for (const id of addButtons.keys()) if (!ids.has(id)) addButtons.delete(id);
  clear(body).append(
    segmented({
      label: 'Which comments',
      value: filter,
      options: [{ value: 'open', label: `Open ${lists.open.length}` }, { value: 'resolved', label: `Resolved ${lists.resolved.length}` }],
      onChange: value => { filter = value; setUi({ thread: null }); },
    }),
    h('div', { class: 'sh-threads' },
      sections.length ? null : emptyNote(filter === 'open' ? 'No comments yet. Add one with the button below, or press C and click the screen.' : 'Nothing resolved yet.'),
      sections.map(s => [
        sectionLabel(s.number ? `${s.number} · ${s.title}` : s.title),
        s.threads.map(t => threadCard(c, t)),
      ])));
  if (typing) reply.focus();
  if (ui.thread !== shown) {
    shown = ui.thread;
    body.querySelector('.sh-thread.open')?.scrollIntoView({ block: 'nearest' });
  }
}

export function mountCommentsPanel() {
  body = h('div', { class: 'sh-panel-body' });
  panel = keepKeys(h('aside', { class: 'sh-panel', hidden: true, 'aria-label': 'Comments' },
    h('header', {},
      h('b', { text: 'Comments' }),
      h('button', { class: 'sh-icon-btn', type: 'button', 'aria-label': 'Close comments', onClick: () => setUi({ panel: null, thread: null }) }, icon('close', 16))),
    body,
    h('footer', {},
      h('button', { class: 'sh-btn primary wide', type: 'button', onClick: addComment }, icon('plus', 14), 'Add comment'),
      h('small', {}, 'Or press ', h('kbd', { text: 'C' }), ', then click the screen'))));
  document.body.append(panel);
  subscribe(render);
}
