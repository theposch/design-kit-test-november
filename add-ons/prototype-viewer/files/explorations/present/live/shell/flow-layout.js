// The flow diagram: which screen leads to which (prototype.json: each screen's
// `next`), and where everything sits. Two steps:
//
//   planFlow()    what is drawn: a frame for each part of the prototype
//                 (`group`), an arrow for each move, a chip for a move into
//                 another part, and nothing for a plain way back along a
//                 move that already has its arrow. Pure.
//   layoutFlow()  where it sits: ELK (elk.js) places each frame's screens and
//                 routes its arrows, and the frames are set out in rows.
//
// Plain data in, plain numbers out (model.test.mjs).

/**
 * The moves between screens: [{ from, to, label, back, tap?, problem? }]. `tap` is a selector for the part
 * that is tapped; `problem` marks a move made because something went wrong (an error, a refusal).
 * A prototype that lists none gets its screens joined in order, so the view is never empty.
 */
export function edgesOf(screens) {
  const ids = new Set(screens.map(s => s.id));
  const listed = screens.flatMap(s =>
    (s.next ?? [])
      .map(n => (typeof n === 'string' ? { to: n } : n))
      .filter(n => ids.has(n.to) && n.to !== s.id)
      .map(n => ({ from: s.id, to: n.to, label: n.label ?? '', back: Boolean(n.back), ...(n.tap ? { tap: n.tap } : {}), ...(n.problem ? { problem: true } : {}) })));
  if (listed.length) return { edges: listed, listed: true };
  const inOrder = screens.slice(1).map((s, i) => ({ from: screens[i].id, to: s.id, label: '', back: false }));
  return { edges: inOrder, listed: false };
}

const LABEL_HEIGHT = 18;
const CHIP_HEIGHT = 22;
// (asked of each label itself: set on the whole graph, ELK puts labels beside their lines)
const ON_THE_LINE = { 'elk.edgeLabels.inline': 'true' };
const clamp = (n, low, high) => Math.min(high, Math.max(low, n));

/** How wide a few words are, near enough, where nothing can measure them. */
export const guessWidth = text => Math.round(String(text).length * 6.2) + 16;

/** A way back along a move that is drawn the other way: that arrow already joins the two screens, so it gets none of its own. */
const returnsAlong = (move, moves) => move.back && moves.some(m => !m.back && m.from === move.to && m.to === move.from);

/**
 * What the diagram shows, before anything has a place.
 *
 *   sections  one per part of the prototype, each with the graph ELK is given
 *   lines     one per arrow drawn: the move, the chip it ends in when it
 *             leaves its part (`chip`), and where on its screen it starts
 *             (`tapAt`)
 *
 * An arrow leaves its screen at the height of the part that is tapped
 * (`taps`: the move's index → that part's box within its screen) and arrives
 * at the same height, so two screens it joins can sit level. Screens are
 * listed in the order of the flow: a move onward leaves on the right, a move
 * to an earlier screen on the left.
 *
 * `framed: false` draws the whole prototype as one flow, every arrow in full
 * and no frames. `only` narrows it to one part; its moves into other parts
 * still end in chips.
 */
export function planFlow(screens, { width = 120, height = 200, thumb = height, taps = new Map(), labelWidth = guessWidth, framed = true, only = null } = {}) {
  const { edges: moves, listed } = edgesOf(screens);
  const order = new Map(screens.map((s, i) => [s.id, i]));
  const titles = new Map(screens.map(s => [s.id, s.title]));
  const partOf = framed || only !== null ? screen => screen.group ?? '' : () => '';
  const parts = new Map(screens.map(s => [s.id, partOf(s)]));
  const drawnMoves = moves.map((m, index) => ({ ...m, index, earlier: order.get(m.to) < order.get(m.from) })).filter(m => !returnsAlong(m, moves));

  // every spot on a screen's sides where arrows leave or arrive; arrows that
  // leave from the same part share one, as do arrows that arrive level
  const ports = new Map(screens.map(s => [s.id, []]));
  const portAt = (id, side, y, leaves) => {
    const list = ports.get(id);
    let port = list.find(p => p.side === side && p.leaves === leaves && Math.abs(p.y - y) <= 4);
    if (port) return port;
    let at = clamp(y, 6, thumb - 6);
    while (list.some(p => p.side === side && Math.abs(p.y - at) < 8)) at += 10;
    list.push((port = { id: `${id}:${list.length}`, side, y: at, leaves }));
    return port;
  };
  const start = new Map();
  for (const screen of screens) {
    const leaving = drawnMoves.filter(m => m.from === screen.id);
    const unknown = { back: leaving.filter(m => m.back && !taps.has(m.index)), other: leaving.filter(m => !m.back && !taps.has(m.index)) };
    for (const move of leaving) {
      const tap = taps.get(move.index);
      // (no tapped part known: a way back near the top corner, the rest spread down the side)
      const guess = move.back ? thumb * (0.06 + 0.06 * unknown.back.indexOf(move)) : (thumb * (unknown.other.indexOf(move) + 1)) / (unknown.other.length + 1);
      start.set(move.index, portAt(screen.id, move.earlier ? 'WEST' : 'EAST', tap ? tap.y + tap.h / 2 : guess, true));
    }
  }

  const lines = [];
  const sections = [...new Set(screens.map(partOf))].filter(name => only === null || name === only).map((name, n) => {
    const edges = [], before = [], after = [];
    const mine = screens.filter(s => partOf(s) === name);
    for (const screen of mine) {
      let straight = true;
      for (const move of drawnMoves.filter(m => m.from === screen.id)) {
        const port = start.get(move.index);
        const tap = taps.get(move.index);
        const line = {
          ...move,
          section: name,
          chip: null,
          // (a tapped part away from its screen's edge: the arrow starts at the part itself)
          tapAt: tap ? [move.earlier ? tap.x : tap.x + tap.w, port.y] : null,
          // (ELK is given this arrow the other way round, so that everything it is given runs onward)
          reversed: false,
        };
        const id = `m${move.index}`;
        if (parts.get(move.to) === name) {
          const arrive = portAt(move.to, move.earlier ? 'EAST' : 'WEST', port.y, false);
          const edge = { id, sources: [port.id], targets: [arrive.id], labels: move.label ? [{ text: move.label, width: labelWidth(move.label), height: LABEL_HEIGHT, layoutOptions: ON_THE_LINE }] : [] };
          // (each screen's first move onward is its main one: that line is kept straight where it can be)
          if (straight && !move.earlier && !move.problem) {
            edge.layoutOptions = { 'elk.layered.priority.straightness': '10' };
            straight = false;
          }
          edges.push(edge);
        } else {
          const text = `${move.earlier ? '←' : '→'} ${titles.get(move.to)}`;
          line.chip = { id: `chip${move.index}`, text, to: move.to, part: parts.get(move.to) };
          const chip = { id: line.chip.id, width: labelWidth(text) + 6, height: CHIP_HEIGHT };
          if (move.earlier) {
            line.reversed = true;
            before.push(chip);
            edges.push({ id, sources: [chip.id], targets: [port.id] });
          } else {
            after.push(chip);
            edges.push({ id, sources: [port.id], targets: [chip.id] });
          }
        }
        lines.push(line);
      }
    }
    const children = mine.map(s => ({
      id: s.id,
      width,
      height,
      // (a port is one pixel square, and its arrow meets it in the middle)
      ports: ports.get(s.id).map(p => ({ id: p.id, width: 1, height: 1, x: p.side === 'EAST' ? width : -1, y: p.y - 0.5, layoutOptions: { 'elk.port.side': p.side } })),
      layoutOptions: { 'elk.portConstraints': 'FIXED_POS' },
    }));
    return { name, graph: { id: `part${n}`, children: [...before, ...children, ...after], edges } };
  });
  return { listed, sections, lines, size: { width, height } };
}

// The screens are listed in the order of the flow, so a move to an earlier
// screen is taken as the one that loops back (MODEL_ORDER): the diagram then
// reads left to right in that order, whatever returns there are.
const ELK_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.layered.cycleBreaking.strategy': 'MODEL_ORDER',
  'elk.layered.feedbackEdges': 'true',
  'elk.layered.spacing.nodeNodeBetweenLayers': '56',
  'elk.spacing.nodeNode': '36',
  'elk.spacing.edgeEdge': '12',
  'elk.spacing.edgeNode': '18',
  'elk.layered.spacing.edgeEdgeBetweenLayers': '12',
  'elk.layered.spacing.edgeNodeBetweenLayers': '18',
  'elk.spacing.edgeLabel': '4',
};

/**
 * Boxes set out left to right in rows, in order, like words on a page. A row
 * is as wide as suits a roughly landscape whole, and never narrower than the
 * widest box.
 */
export function packRows(boxes, { gap = 40, margin = 64 } = {}) {
  const area = boxes.reduce((sum, b) => sum + b.w * b.h, 0);
  const rowWidth = Math.max(0, ...boxes.map(b => b.w), Math.sqrt(area) * 1.5);
  let x = margin, y = margin, rowHeight = 0, width = 0, height = 0;
  const spots = boxes.map(b => {
    if (x > margin && x + b.w > margin + rowWidth) {
      x = margin;
      y += rowHeight + gap;
      rowHeight = 0;
    }
    const spot = { x, y };
    x += b.w + gap;
    rowHeight = Math.max(rowHeight, b.h);
    width = Math.max(width, spot.x + b.w);
    height = Math.max(height, spot.y + b.h);
    return spot;
  });
  return { spots, width: width + margin, height: height + margin };
}

/**
 * Everything the canvas draws, each with its place: the frames, the screens,
 * the chips, and every arrow's path and label. `elk` is ELK itself
 * (`new ELK()`): given a graph, it answers with the same graph laid out.
 */
export async function layoutFlow(plan, elk, { gap = 40, margin = 64, padding = 28, heading = 52 } = {}) {
  const laid = [];
  for (const { name, graph } of plan.sections) {
    const top = name ? heading : padding;
    laid.push(await elk.layout({ ...graph, layoutOptions: { ...ELK_OPTIONS, 'elk.padding': `[top=${top},left=${padding},bottom=${padding},right=${padding}]` } }));
  }
  const { spots, width, height } = packRows(laid.map(g => ({ w: g.width, h: g.height })), { gap, margin });
  const sections = [], nodes = [], routes = new Map(), boxes = new Map();
  laid.forEach((graph, i) => {
    const origin = spots[i];
    sections.push({ name: plan.sections[i].name, x: origin.x, y: origin.y, w: graph.width, h: graph.height });
    for (const child of graph.children ?? []) {
      const box = { id: child.id, x: origin.x + child.x, y: origin.y + child.y, w: child.width, h: child.height };
      boxes.set(child.id, box);
      if (!child.id.startsWith('chip')) nodes.push({ ...box, section: plan.sections[i].name });
    }
    for (const edge of graph.edges ?? []) routes.set(edge.id, { edge, origin });
  });
  const lines = plan.lines.flatMap(line => {
    const route = routes.get(`m${line.index}`);
    const path = route?.edge.sections?.[0];
    if (!path) return [];
    const { origin } = route;
    const points = [path.startPoint, ...(path.bendPoints ?? []), path.endPoint].map(p => [origin.x + p.x, origin.y + p.y]);
    if (line.reversed) points.reverse();
    const from = boxes.get(line.from);
    if (line.tapAt && Math.abs(from.x + line.tapAt[0] - points[0][0]) > 1) points.unshift([from.x + line.tapAt[0], from.y + line.tapAt[1]]);
    const label = route.edge.labels?.[0];
    return [{
      ...line,
      points,
      labelBox: label ? { x: origin.x + label.x, y: origin.y + label.y, w: label.width, h: label.height } : null,
      chip: line.chip ? { ...line.chip, ...boxes.get(line.chip.id) } : null,
    }];
  });
  return { listed: plan.listed, width, height, sections, nodes, lines };
}

/** An SVG path through the points, its corners rounded. */
export function roundedPath(points, radius = 8) {
  const [first, ...rest] = points;
  let d = `M ${first[0]} ${first[1]}`;
  rest.forEach(([x, y], i) => {
    const next = rest[i + 1];
    if (!next) return void (d += ` L ${x} ${y}`);
    const [px, py] = points[i];
    const before = Math.hypot(x - px, y - py), after = Math.hypot(next[0] - x, next[1] - y);
    const r = Math.min(radius, before / 2, after / 2);
    if (r < 0.5) return void (d += ` L ${x} ${y}`);
    const ax = x - ((x - px) / before) * r, ay = y - ((y - py) / before) * r;
    const bx = x + ((next[0] - x) / after) * r, by = y + ((next[1] - y) / after) * r;
    d += ` L ${ax} ${ay} Q ${x} ${y} ${bx} ${by}`;
  });
  return d;
}

/**
 * A spot on the canvas, kept as an offset from the screen nearest to it, so a
 * comment left there stays beside that screen when the diagram is redrawn.
 */
export function anchorTo(nodes, point) {
  let best = null;
  for (const n of nodes) {
    const dx = point.x - clamp(point.x, n.x, n.x + n.w), dy = point.y - clamp(point.y, n.y, n.y + n.h);
    const far = Math.hypot(dx, dy);
    if (!best || far < best.far) best = { far, node: n };
  }
  return best ? { near: best.node.id, dx: point.x - best.node.x, dy: point.y - best.node.y } : {};
}

/** Where an anchored spot is now; its last known place if its screen is not drawn. */
export function placeOf(nodes, spot) {
  const node = spot.near ? nodes.find(n => n.id === spot.near) : null;
  return node ? { x: node.x + spot.dx, y: node.y + spot.dy } : { x: spot.x, y: spot.y };
}

/** The zoom and offset that show the whole diagram inside a view, never closer than 1:1. */
export function fitTo(diagram, view, padding = 24) {
  const zoom = Math.min(1, (view.width - padding * 2) / diagram.width, (view.height - padding * 2) / diagram.height);
  const scale = Math.max(0.1, zoom);
  return { scale, x: (view.width - diagram.width * scale) / 2, y: (view.height - diagram.height * scale) / 2 };
}

/** The offset that puts a box in the middle of a view at a given zoom. */
export function centreOn(box, view, scale) {
  return { scale, x: view.width / 2 - (box.x + box.w / 2) * scale, y: view.height / 2 - (box.y + box.h / 2) * scale };
}

/** Zooming about a point keeps what is under that point where it is. */
export function zoomAbout(view, point, scale, limits = [0.1, 2.5]) {
  const next = Math.min(limits[1], Math.max(limits[0], scale));
  const k = next / view.scale;
  return { scale: next, x: point.x - (point.x - view.x) * k, y: point.y - (point.y - view.y) * k };
}
