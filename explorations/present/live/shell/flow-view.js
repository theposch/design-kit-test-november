// All screens as a flow diagram on a canvas you can drag and zoom. Each
// screen is a card; each move an arrow that starts at the button that makes
// it and carries that button's name. A long prototype is drawn a frame per
// part, and a move into another part ends in a chip that jumps there.
// Comments can be left anywhere on the canvas.

import { saving } from './actions.js';
import { clear, h, icon, keepKeys } from './dom.js';
import { loadElk } from './elk.js';
import { engine } from './engine.js';
import { anchorTo, centreOn, edgesOf, fitTo, layoutFlow, placeOf, planFlow, roundedPath } from './flow-layout.js';
import { FLOW_SCREEN, framesFlow } from './model.js';
import { panZoom } from './panzoom.js';
import { CAPTION, refreshCards, screenCard } from './screen-card.js';
import { remembered, setUi, ui } from './store.js';
import { tappedBox } from './tap-targets.js';
import { screenSize, thumbHeight } from './thumb.js';

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
};

// Where each move is tapped, per prototype, kept while the page is open: the
// second time the flow is drawn, its arrows start in the right place at once.
const tapsOf = new Map();

let ruler = null;
/** How wide a label or chip is drawn (shell.css: .sh-flow-label). */
function labelWidth(text) {
  ruler ??= Object.assign(document.createElement('canvas').getContext('2d'), { font: `500 11px ${getComputedStyle(document.body).fontFamily}` });
  return Math.ceil(ruler.measureText(text).width) + 16;
}

const place = (el, box) => {
  el.style.left = `${box.x}px`;
  el.style.top = `${box.y}px`;
  return el;
};
const kindOf = line => `${line.back ? ' back' : ''}${line.problem ? ' problem' : ''}`;
const ends = line => ({ from: line.from, to: line.to });

function drawLines(diagram) {
  const layer = svg('svg', { class: 'sh-flow-lines', width: diagram.width, height: diagram.height, 'aria-hidden': 'true' });
  const defs = svg('defs');
  // (context-stroke: a head takes the colour of the line it ends)
  const head = svg('marker', { id: 'sh-flow-head', orient: 'auto', markerWidth: 8, markerHeight: 8, refX: 7, refY: 4 });
  head.append(svg('path', { d: 'M1 1 L7 4 L1 7', class: 'sh-flow-head', stroke: 'context-stroke' }));
  defs.append(head);
  layer.append(defs);
  for (const line of diagram.lines) {
    const path = svg('path', { d: roundedPath(line.points), class: `sh-flow-line${kindOf(line)}`, 'data-from': line.from, 'data-to': line.to });
    if (!line.chip) path.setAttribute('marker-end', 'url(#sh-flow-head)');
    const [x, y] = line.points[0];
    layer.append(path, svg('circle', { cx: x, cy: y, r: 3.5, class: 'sh-flow-dot', 'data-from': line.from, 'data-to': line.to }));
  }
  return layer;
}

export function buildFlow(onPick) {
  const api = engine.prototypes();
  const { proto } = api;
  const only = ui.flowGroup || null;
  const framed = framesFlow(api.screens, ui.flowFrames);
  const width = proto.device === 'desktop' ? 220 : 132;
  const thumb = thumbHeight(proto, width);
  const scale = width / screenSize(proto).w;
  const moves = edgesOf(api.screens).edges;
  if (!tapsOf.has(proto.name)) tapsOf.set(proto.name, new Map());
  const taps = tapsOf.get(proto.name);
  let diagram = null;

  const frames = h('div', { class: 'sh-flow-frames' });
  const cardLayer = h('div', {});
  const drawn = h('div', {});   // arrows, labels and chips: made again each time the diagram is laid out
  const content = h('div', { class: 'sh-flow-content' }, frames, cardLayer, drawn);
  const pins = h('div', { class: 'sh-flow-pins' });
  const status = h('div', { class: 'sh-flow-status', 'data-no-pan': true });
  const notes = h('div', { class: 'sh-flow-notes', 'data-no-pan': true });
  const zoomLabel = h('button', { class: 'sh-zoom-value', type: 'button', title: 'Back to 100%' });
  const viewport = h('div', { class: 'sh-flow', tabindex: '0', 'aria-label': 'Flow of screens. Drag to move, pinch or hold Ctrl and scroll to zoom.' }, content, pins);
  const cards = new Map();

  let commenting = false;
  let draft = null;   // { x, y, card } while a new comment is being written

  const placePins = () => {
    const view = canvas.get();
    for (const el of pins.children) {
      el.style.left = `${Number(el.dataset.x) * view.scale + view.x}px`;
      el.style.top = `${Number(el.dataset.y) * view.scale + view.y}px`;
    }
  };
  const viewKey = `flow-view:${proto.name}`;
  const canvas = panZoom(viewport, content, {
    onChange(view) {
      zoomLabel.textContent = `${Math.round(view.scale * 100)}%`;
      placePins();
      if (diagram && !only) remembered.set(viewKey, JSON.stringify({ ...view, framed }));
    },
  });
  const viewSize = () => {
    const r = viewport.getBoundingClientRect();
    return { width: r.width, height: r.height };
  };
  const fit = () => { if (diagram) canvas.set(fitTo(diagram, viewSize(), 48)); };

  // ── drawing ──

  const drawPins = () => {
    for (const pin of [...pins.querySelectorAll('.sh-flow-pin')]) pin.remove();
    if (!diagram) return;
    const comments = engine.comments();
    for (const t of (comments?.threads() ?? []).filter(t => t.screen === FLOW_SCREEN)) {
      const at = placeOf(diagram.nodes, t);
      pins.append(h('button', {
        class: `sh-flow-pin${ui.thread === t.id ? ' active' : ''}`,
        type: 'button',
        'data-no-pan': true,
        dataset: { x: at.x, y: at.y },
        'aria-label': `Comment by ${comments.nameOf(t.author_email)}: ${t.text}`,
        text: comments.initials(t.author_email),
        onClick: () => setUi({ panel: 'comments', thread: t.id }),
      }));
    }
    placePins();
  };

  /** Brings a screen to the middle of the view; one outside what is drawn opens its own part. */
  const reveal = id => {
    const node = diagram?.nodes.find(n => n.id === id);
    if (!node) return setUi({ flowGroup: api.screens.find(s => s.id === id)?.group ?? '' });
    viewport.classList.add('gliding');
    canvas.set(centreOn(node, viewSize(), Math.max(canvas.get().scale, 0.6)));
    const card = cards.get(id);
    card.classList.add('arrived');
    setTimeout(() => viewport.classList.remove('gliding'), 450);
    setTimeout(() => card.classList.remove('arrived'), 1600);
  };

  const key = (kind, text) => h('span', { class: 'sh-flow-key' }, h('i', { class: kind }), text);

  function draw(first) {
    content.style.width = `${diagram.width}px`;
    content.style.height = `${diagram.height}px`;
    clear(frames).append(...diagram.sections.filter(s => s.name).map(s => {
      const frame = place(h('section', { class: 'sh-flow-frame' }, h('h3', { text: s.name })), s);
      frame.style.width = `${s.w}px`;
      frame.style.height = `${s.h}px`;
      return frame;
    }));
    for (const node of diagram.nodes) {
      if (!cards.has(node.id)) {
        const number = api.screens.findIndex(s => s.id === node.id) + 1;
        cards.set(node.id, screenCard(proto, api.screens[number - 1], number, width, onPick));
        cardLayer.append(cards.get(node.id));
      }
      place(cards.get(node.id), node);
    }
    clear(drawn).append(
      drawLines(diagram),
      ...diagram.lines.filter(l => l.labelBox).map(l => place(
        h('span', { class: `sh-flow-label${kindOf(l)}`, text: l.label, dataset: ends(l) }),
        { x: l.labelBox.x + l.labelBox.w / 2, y: l.labelBox.y + l.labelBox.h / 2 })),
      ...diagram.lines.filter(l => l.chip).map(l => place(
        h('button', {
          class: `sh-flow-chip${l.problem ? ' problem' : ''}`,
          type: 'button',
          'data-no-pan': true,
          dataset: ends(l),
          title: [l.label, l.chip.part].filter(Boolean).join(' · '),
          text: l.chip.text,
          onClick: () => reveal(l.chip.to),
        }),
        l.chip)));
    clear(notes).append(...[
      diagram.lines.some(l => l.problem) ? key('problem', 'Something goes wrong') : null,
      diagram.lines.some(l => l.back) ? key('back', 'A way back') : null,
      diagram.lines.some(l => l.chip) ? key('chip', 'Goes to another part') : null,
      !diagram.listed && api.staff() ? h('span', { text: 'Screens are joined in order. Ask Claude to add the moves between them.' }) : null,
    ].filter(Boolean));
    refreshCards(content);
    drawPins();
    relight();
    if (!first) return;
    // the canvas opens where it was left; the first time, with everything in view
    let saved = null;
    try { saved = JSON.parse(remembered.get(viewKey)); } catch {}
    if (saved && !only && saved.framed === framed && Number.isFinite(saved.scale)) canvas.set(saved);
    else fit();
  }

  // ── laying out ──

  const say = (text, action) => {
    status.hidden = !text;
    clear(status).append(...[text ? h('span', { text }) : null, action].filter(Boolean));
  };
  let run = 0;
  async function relayout() {
    const mine = ++run;
    if (!diagram) say('Drawing the flow…');
    try {
      const elk = await loadElk();
      const plan = planFlow(api.screens, { width, height: thumb + CAPTION, thumb, taps, labelWidth, framed, only });
      const next = await layoutFlow(plan, elk);
      if (mine !== run) return;
      const first = !diagram;
      diagram = next;
      say('');
      draw(first);
    } catch (error) {
      if (mine !== run) return;
      console.error(error);
      if (!diagram) say('The flow could not be drawn.', h('button', { class: 'sh-btn outline', type: 'button', onClick: relayout }, 'Try again'));
    }
  }

  // Each thumbnail, once loaded, shows where its moves are made: the arrows then start there.
  // (A prototype draws its screen a moment after its page loads, so it is looked for a few times.)
  let soon = 0;
  const findTapped = () => {
    let changed = false;
    moves.forEach((move, index) => {
      const frame = cards.get(move.from)?.querySelector('.sh-thumb-frame.ready');
      if (!frame) return;
      const box = tappedBox(frame, move, scale);
      if (JSON.stringify(box) === JSON.stringify(taps.get(index) ?? null)) return;
      changed = true;
      if (box) taps.set(index, box); else taps.delete(index);
    });
    if (!changed) return;
    clearTimeout(soon);
    soon = setTimeout(relayout, 150);
  };
  content.addEventListener('sh-thumb-ready', () => { for (const wait of [0, 200, 800, 2000]) setTimeout(findTapped, wait); });

  // ── a screen under the pointer (or the keyboard) shows only its own moves ──

  let lit = null;
  const relight = () => {
    content.classList.toggle('focusing', Boolean(lit));
    for (const el of drawn.querySelectorAll('[data-from]')) el.classList.toggle('lit', Boolean(lit) && (el.dataset.from === lit || el.dataset.to === lit));
  };
  const light = id => {
    if (id === lit) return;
    lit = id;
    relight();
  };
  const screenAt = e => e.target.closest?.('.sh-card')?.dataset.screen ?? null;
  content.addEventListener('pointerover', e => light(screenAt(e)));
  content.addEventListener('pointerleave', () => light(null));
  content.addEventListener('focusin', e => light(screenAt(e)));
  content.addEventListener('focusout', () => light(null));

  // ── comments ──

  const closeDraft = () => { draft?.stopEscape(); draft?.card.remove(); draft = null; };
  const startDraft = at => {
    closeDraft();
    const field = h('textarea', { rows: '2', placeholder: 'Add a comment', 'aria-label': 'Comment' });
    const post = async () => {
      const text = field.value.trim();
      if (!text) return field.focus();
      const made = await saving(() => engine.comments().create({ screen: FLOW_SCREEN, x: at.x, y: at.y, ...anchorTo(diagram.nodes, at), text }));
      if (made) closeDraft();
    };
    field.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); post(); }
    });
    const card = keepKeys(h('div', { class: 'sh-flow-draft', 'data-no-pan': true, dataset: { x: at.x, y: at.y } },
      field,
      h('div', { class: 'sh-pop-row end' },
        h('button', { class: 'sh-btn quiet', type: 'button', onClick: closeDraft }, 'Cancel'),
        h('button', { class: 'sh-btn primary', type: 'button', onClick: post }, 'Post'))));
    draft = { ...at, card, stopEscape: engine.onEscape(90, () => { closeDraft(); return true; }) };
    pins.append(card);
    placePins();
    field.focus();
  };

  const setCommenting = on => {
    commenting = on;
    viewport.classList.toggle('commenting', on);
    commentTool.setAttribute('aria-pressed', String(on));
    if (!on) closeDraft();
  };
  viewport.addEventListener('click', e => {
    if (!commenting || !diagram || e.target.closest('[data-no-pan], .sh-card')) return;
    startDraft(canvas.toContent(e));
  });

  const commentTool = h('button', { class: 'sh-tool', type: 'button', 'aria-pressed': 'false', title: 'Comment on the canvas', onClick: () => setCommenting(!commenting) }, icon('message', 14), 'Comment');
  const tools = h('div', { class: 'sh-flow-tools', 'data-no-pan': true },
    h('button', { class: 'sh-tool icon', type: 'button', 'aria-label': 'Zoom out', onClick: () => canvas.zoomBy(1 / 1.25) }, icon('minus', 14)),
    zoomLabel,
    h('button', { class: 'sh-tool icon', type: 'button', 'aria-label': 'Zoom in', onClick: () => canvas.zoomBy(1.25) }, icon('plus', 14)),
    h('button', { class: 'sh-tool icon', type: 'button', 'aria-label': 'Fit everything', title: 'Fit everything', onClick: fit }, icon('fit', 14)),
    h('i', { class: 'sh-tool-sep' }),
    commentTool);
  zoomLabel.addEventListener('click', () => canvas.zoomBy(1 / canvas.get().scale));

  relayout();

  return {
    el: h('div', { class: 'sh-flow-wrap' }, viewport, status, tools, notes),
    startCommenting: () => setCommenting(true),
    refresh() {
      refreshCards(content);
      drawPins();
    },
  };
}
