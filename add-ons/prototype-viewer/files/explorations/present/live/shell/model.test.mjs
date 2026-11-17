import assert from 'node:assert/strict';
import test from 'node:test';

import ELK from 'elkjs';

import { screens as large } from '../../test/large-prototype.mjs';

import { anchorTo, centreOn, edgesOf, fitTo, layoutFlow, packRows, placeOf, planFlow, roundedPath, zoomAbout } from './flow-layout.js';
import {
  byRound,
  countByScreen,
  filterGroups,
  FLOW_SCREEN,
  framesFlow,
  groupScreens,
  neighbour,
  reactionsFor,
  sampleDocuments,
  rearrange,
  shareLink,
  threadsByScreen,
  unreadThreads,
} from './model.js';

const screens = [
  { id: 'home', title: 'Home', group: 'Browse' },
  { id: 'product', title: 'Product', group: 'Browse' },
  { id: 'cart', title: 'Cart', group: 'Buy' },
  { id: 'pay', title: 'Payment', group: 'Buy' },
];

test('screens keep their order and number under their groups', () => {
  const groups = groupScreens(screens);
  assert.deepEqual(groups.map(g => g.name), ['Browse', 'Buy']);
  assert.deepEqual(groups[1].screens.map(s => [s.number, s.title]), [[3, 'Cart'], [4, 'Payment']]);
});

test('screens with no group sit in one unnamed group', () => {
  assert.deepEqual(groupScreens([{ id: 'a', title: 'A' }]).map(g => g.name), ['']);
});

test('search matches a screen or its group, and drops empty groups', () => {
  const groups = groupScreens(screens);
  assert.deepEqual(filterGroups(groups, 'pay').flatMap(g => g.screens.map(s => s.id)), ['pay']);
  assert.deepEqual(filterGroups(groups, 'browse').flatMap(g => g.screens.map(s => s.id)), ['home', 'product']);
  assert.equal(filterGroups(groups, '  ').length, 2);
});

test('next and previous wrap round the ends', () => {
  assert.equal(neighbour(screens, 'pay', 1).id, 'home');
  assert.equal(neighbour(screens, 'home', -1).id, 'pay');
  assert.equal(neighbour(screens, 'product', 1).id, 'cart');
});

test('prototypes gather under their rounds in the order given', () => {
  const rounds = byRound(['a', 'b', 'c'], n => ({ a: 'Round 2', b: 'Round 2', c: '' })[n]);
  assert.deepEqual(rounds, [{ round: 'Round 2', names: ['a', 'b'] }, { round: '', names: ['c'] }]);
});

test('moving a prototype down swaps it with the next and renumbers', () => {
  const rounds = [{ round: 'R1', names: ['a', 'b'] }, { round: 'R2', names: ['c'] }];
  assert.deepEqual(rearrange(rounds, 'a', { move: 1 }).map(p => [p.name, p.round, p.order]),
    [['b', 'R1', 0], ['a', 'R1', 1], ['c', 'R2', 2]]);
});

test('moving past a round heading joins the next round, first in it', () => {
  const rounds = [{ round: 'R1', names: ['a', 'b'] }, { round: 'R2', names: ['c'] }];
  assert.deepEqual(rearrange(rounds, 'b', { move: 1 }).map(p => [p.name, p.round]),
    [['a', 'R1'], ['b', 'R2'], ['c', 'R2']]);
  assert.deepEqual(rearrange(rounds, 'c', { move: -1 }).map(p => [p.name, p.round]),
    [['a', 'R1'], ['b', 'R1'], ['c', 'R1']]);
});

test('moving off either end changes nothing', () => {
  const rounds = [{ round: 'R1', names: ['a'] }];
  assert.deepEqual(rearrange(rounds, 'a', { move: -1 }), []);
});

test('moving into a round puts it last in that round', () => {
  const rounds = [{ round: 'R1', names: ['a', 'b'] }, { round: 'R2', names: ['c'] }];
  assert.deepEqual(rearrange(rounds, 'a', { round: 'R2' }).map(p => [p.name, p.round]),
    [['b', 'R1'], ['c', 'R2'], ['a', 'R2']]);
  assert.deepEqual(rearrange(rounds, 'a', { round: 'New' }).map(p => [p.name, p.round]),
    [['b', 'R1'], ['c', 'R2'], ['a', 'New']]);
});

test('threads are counted and gathered by screen, the canvas last', () => {
  const threads = [
    { id: 1, screen: 'cart' }, { id: 2, screen: FLOW_SCREEN }, { id: 3, screen: 'home' }, { id: 4, screen: 'cart' },
  ];
  assert.equal(countByScreen(threads).get('cart'), 2);
  const sections = threadsByScreen(threads, screens);
  assert.deepEqual(sections.map(s => [s.title, s.number, s.threads.length]), [['Home', 1, 1], ['Cart', 3, 2], ['Flow', null, 1]]);
});

test('a thread is unread when someone else spoke since the last look', () => {
  const threads = [
    { id: 't1', author_email: 'me@x.com', created_at: '2026-01-01' },
    { id: 't2', author_email: 'dana@y.com', created_at: '2026-01-05' },
    { id: 't3', author_email: 'dana@y.com', created_at: '2026-01-01' },
  ];
  const replies = { t1: [{ author_email: 'dana@y.com', created_at: '2026-01-06' }] };
  const unread = unreadThreads(threads, id => replies[id] ?? [], '2026-01-03', 'me@x.com');
  assert.deepEqual(unread.map(t => t.id), ['t1', 't2']);
  assert.equal(unreadThreads(threads, () => [], '', 'me@x.com').length, 2);
});

test('a message shows one chip per emoji, in first-used order, marked when one is mine', () => {
  const reactions = [
    { id: 'r1', comment: 'c1', emoji: '🎉', author_email: 'dana@y.com' },
    { id: 'r2', comment: 'c2', emoji: '👍', author_email: 'me@x.com' },
    { id: 'r3', comment: 'c1', emoji: '👍', author_email: 'dana@y.com' },
    { id: 'r4', comment: 'c1', emoji: '🎉', author_email: 'me@x.com' },
  ];
  assert.deepEqual(reactionsFor(reactions, 'c1', 'me@x.com'), [
    { emoji: '🎉', count: 2, mine: true, people: ['dana@y.com', 'me@x.com'] },
    { emoji: '👍', count: 1, mine: false, people: ['dana@y.com'] },
  ]);
  assert.deepEqual(reactionsFor(reactions, 'c2', 'me@x.com').map(c => [c.emoji, c.count, c.mine]), [['👍', 1, true]]);
});

test('a message nobody reacted to has no chips', () => {
  assert.deepEqual(reactionsFor([{ comment: 'c1', emoji: '👍', author_email: 'me@x.com' }], 'c9', 'me@x.com'), []);
  assert.deepEqual(reactionsFor([], 'c1', 'me@x.com'), []);
});

test('a share link opens the prototype on its screen and drops other settings', () => {
  assert.equal(shareLink('https://sites.example.com/acme/present/?comments=1&set=old#x', 'checkout', 'cart'),
    'https://sites.example.com/acme/present/?set=checkout#cart');
});

// ── sample comments ──

test('sample comments become threads, replies and reactions, dated back from now', () => {
  const now = Date.parse('2026-01-10T12:00:00Z');
  const { comments, reactions } = sampleDocuments([
    {
      screen: 'cart', x: 0.5, y: 400, by: 'priya.raman@client.example', ago: '2d', text: 'Keep the total in view?', resolved: true,
      reactions: { '👍': ['dana.lee@metalab.com', 'sam.ito@metalab.com'] },
      replies: [{ by: 'dana.lee@metalab.com', ago: '5h', text: 'Yes, next round.' }],
    },
    { screen: FLOW_SCREEN, near: 'cart', dx: 170, dy: 40, by: 'sam.ito@metalab.com', ago: '20m', text: 'Two ways in here.' },
  ], { proto: 'shop', now });
  assert.deepEqual(comments, [
    { id: 'sample-1', proto: 'shop', text: 'Keep the total in view?', author_email: 'priya.raman@client.example', created_at: '2026-01-08T12:00:00.000Z', screen: 'cart', x: 0.5, y: 400, resolved: true },
    { id: 'sample-1-1', proto: 'shop', text: 'Yes, next round.', author_email: 'dana.lee@metalab.com', created_at: '2026-01-10T07:00:00.000Z', screen: 'cart', parent: 'sample-1' },
    // (on the flow canvas a comment is kept beside a screen)
    { id: 'sample-2', proto: 'shop', text: 'Two ways in here.', author_email: 'sam.ito@metalab.com', created_at: '2026-01-10T11:40:00.000Z', screen: FLOW_SCREEN, x: 0, y: 0, near: 'cart', dx: 170, dy: 40 },
  ]);
  assert.deepEqual(reactions.map(r => [r.id, r.comment, r.emoji, r.author_email]), [
    ['sample-1-👍-1', 'sample-1', '👍', 'dana.lee@metalab.com'],
    ['sample-1-👍-2', 'sample-1', '👍', 'sam.ito@metalab.com'],
  ]);
});

// ── the flow diagram ──

const flow = [
  { id: 'product', title: 'Product', group: 'Shop', next: [{ to: 'cart', label: 'Add to bag' }, { to: 'wishlist', label: 'Save' }] },
  { id: 'wishlist', title: 'Wishlist', group: 'Shop', next: [{ to: 'product', label: 'Back', back: true }] },
  { id: 'cart', title: 'Cart', group: 'Pay', next: [{ to: 'address', label: 'Check out' }, { to: 'signin', label: 'Check out', problem: true }, { to: 'product', label: 'Keep shopping' }] },
  { id: 'signin', title: 'Sign in', group: 'Pay', next: ['address'] },
  { id: 'address', title: 'Address', group: 'Pay', next: [{ to: 'cart', label: 'Edit bag', back: true }] },
  { id: 'help', title: 'Help', group: 'Pay' },
];
const lineOf = (plan, from, to) => plan.lines.find(l => l.from === from && l.to === to);
const edgeOf = (plan, line) => plan.sections.flatMap(s => s.graph.edges).find(e => e.id === `m${line.index}`);
const portOf = (plan, id) => plan.sections.flatMap(s => s.graph.children).flatMap(c => c.ports ?? []).find(p => p.id === id);

test('moves come from each screen, ignoring ones that lead nowhere', () => {
  const { edges, listed } = edgesOf([...flow, { id: 'x', title: 'X', next: [{ to: 'gone' }, { to: 'x' }] }]);
  assert.equal(listed, true);
  assert.equal(edges.length, 8);
  assert.deepEqual(edges.find(e => e.from === 'signin'), { from: 'signin', to: 'address', label: '', back: false });
});

test('a prototype with no moves listed is joined in order', () => {
  const { edges, listed } = edgesOf(screens);
  assert.equal(listed, false);
  assert.deepEqual(edges.map(e => `${e.from}>${e.to}`), ['home>product', 'product>cart', 'cart>pay']);
});

test('a move made because something went wrong keeps that mark on its line', () => {
  assert.equal(lineOf(planFlow(flow), 'cart', 'signin').problem, true);
  assert.equal(lineOf(planFlow(flow), 'cart', 'address').problem, undefined);
});

test('a plain way back along a move that has its arrow gets none of its own', () => {
  const plan = planFlow(flow);
  assert.equal(lineOf(plan, 'wishlist', 'product'), undefined);
  assert.ok(lineOf(plan, 'product', 'wishlist'));
  assert.equal(lineOf(plan, 'address', 'cart'), undefined);
  assert.ok(lineOf(plan, 'cart', 'address'));
  // (Keep shopping is no way back: it keeps its arrow)
  assert.ok(lineOf(plan, 'cart', 'product'));
  // a way back to a screen that does not lead here keeps its arrow too, drawn dashed
  const detour = [{ id: 'a', title: 'A', next: ['b'] }, { id: 'b', title: 'B', next: ['c'] }, { id: 'c', title: 'C', next: [{ to: 'a', label: 'Start again', back: true }] }];
  assert.equal(lineOf(planFlow(detour), 'c', 'a').back, true);
});

test('each part of the prototype is a section, and a move into another part ends in a chip', () => {
  const plan = planFlow(flow);
  assert.deepEqual(plan.sections.map(s => s.name), ['Shop', 'Pay']);
  const out = lineOf(plan, 'product', 'cart');
  assert.deepEqual(out.chip, { id: `chip${out.index}`, text: '→ Cart', to: 'cart', part: 'Pay' });
  const shop = plan.sections[0].graph;
  assert.deepEqual(shop.children.map(c => c.id), ['product', 'wishlist', out.chip.id]);
  assert.deepEqual(edgeOf(plan, out).targets, [out.chip.id]);
});

test('a chip for a move to an earlier part sits before the screens, its arrow given to ELK the other way round', () => {
  const plan = planFlow(flow);
  const home = lineOf(plan, 'cart', 'product');
  assert.equal(home.chip.text, '← Product');
  assert.equal(home.reversed, true);
  assert.equal(plan.sections[1].graph.children[0].id, home.chip.id);
  assert.deepEqual(edgeOf(plan, home).sources, [home.chip.id]);
});

test('drawn as one flow, nothing is framed and every arrow runs in full', () => {
  const plan = planFlow(flow, { framed: false });
  assert.deepEqual(plan.sections.map(s => s.name), ['']);
  assert.equal(plan.lines.some(l => l.chip), false);
  assert.equal(plan.sections[0].graph.children.length, flow.length);
});

test('narrowed to one part, its moves into other parts still end in chips', () => {
  const plan = planFlow(flow, { framed: false, only: 'Shop' });
  assert.deepEqual(plan.sections.map(s => s.name), ['Shop']);
  assert.equal(lineOf(plan, 'product', 'cart').chip.text, '→ Cart');
  assert.equal(plan.lines.every(l => l.section === 'Shop'), true);
});

test('an arrow leaves at the height of the tapped part and arrives level', () => {
  const index = edgesOf(flow).edges.findIndex(e => e.from === 'cart' && e.to === 'address');
  const plan = planFlow(flow, { width: 100, height: 230, thumb: 200, taps: new Map([[index, { x: 10, y: 160, w: 80, h: 20 }]]) });
  const line = lineOf(plan, 'cart', 'address');
  const edge = edgeOf(plan, line);
  const leave = portOf(plan, edge.sources[0]), arrive = portOf(plan, edge.targets[0]);
  assert.deepEqual([leave.x, leave.y + 0.5, leave.layoutOptions['elk.port.side']], [100, 170, 'EAST']);
  assert.deepEqual([arrive.x, arrive.y + 0.5, arrive.layoutOptions['elk.port.side']], [-1, 170, 'WEST']);
  // (the arrow starts at the part itself: its right-hand edge, at its middle)
  assert.deepEqual(line.tapAt, [90, 170]);
});

test('moves made from the same part share the spot they leave from', () => {
  const moves = edgesOf(flow).edges;
  const same = { x: 10, y: 160, w: 80, h: 20 };
  const taps = new Map(moves.flatMap((e, i) => (e.from === 'cart' && e.label === 'Check out' ? [[i, same]] : [])));
  const plan = planFlow(flow, { taps });
  assert.equal(edgeOf(plan, lineOf(plan, 'cart', 'address')).sources[0], edgeOf(plan, lineOf(plan, 'cart', 'signin')).sources[0]);
});

test('a move to an earlier screen leaves on the left and arrives on the right', () => {
  const loop = [{ id: 'a', title: 'A', next: [{ to: 'b', label: 'Go' }] }, { id: 'b', title: 'B', next: [{ to: 'a', label: 'Start over' }] }];
  const plan = planFlow(loop);
  const edge = edgeOf(plan, lineOf(plan, 'b', 'a'));
  assert.equal(portOf(plan, edge.sources[0]).layoutOptions['elk.port.side'], 'WEST');
  assert.equal(portOf(plan, edge.targets[0]).layoutOptions['elk.port.side'], 'EAST');
});

test('each screen has one main move, and its line is the one kept straight', () => {
  const plan = planFlow(flow, { framed: false });
  const straight = plan.lines.filter(l => edgeOf(plan, l).layoutOptions?.['elk.layered.priority.straightness']).map(l => `${l.from}>${l.to}`);
  assert.deepEqual(straight, ['product>cart', 'cart>address', 'signin>address']);
});

test('a short prototype is drawn as one flow, a long one a frame per part, and a choice wins', () => {
  const long = Array.from({ length: 30 }, (_, i) => ({ id: `s${i}`, group: i < 15 ? 'A' : 'B' }));
  assert.equal(framesFlow(flow), false);
  assert.equal(framesFlow(long), true);
  assert.equal(framesFlow(flow, true), true);
  assert.equal(framesFlow(long, false), false);
  // (one part alone has nothing to frame)
  assert.equal(framesFlow(long.map(s => ({ ...s, group: 'A' })), true), false);
});

test('frames are set out in rows, in order, and wrap like words on a page', () => {
  const { spots, width, height } = packRows([{ w: 250, h: 100 }, { w: 250, h: 200 }, { w: 250, h: 100 }, { w: 250, h: 100 }], { gap: 20, margin: 10 });
  // (their area suits a row about 530 wide: two to a row, each row as tall as its tallest)
  assert.deepEqual(spots, [{ x: 10, y: 10 }, { x: 280, y: 10 }, { x: 10, y: 230 }, { x: 280, y: 230 }]);
  assert.deepEqual([width, height], [540, 340]);
});

test('with ELK itself: every screen and arrow gets a place, and joined screens sit level', async () => {
  const chain = [{ id: 'a', title: 'A', next: [{ to: 'b', label: 'Next' }] }, { id: 'b', title: 'B', next: [{ to: 'c', label: 'Next' }] }, { id: 'c', title: 'C' }];
  const d = await layoutFlow(planFlow(chain), new ELK());
  assert.deepEqual(d.nodes.map(n => n.id), ['a', 'b', 'c']);
  assert.equal(new Set(d.nodes.map(n => n.y)).size, 1);
  assert.ok(d.nodes[0].x < d.nodes[1].x && d.nodes[1].x < d.nodes[2].x);
  const line = d.lines[0];
  assert.equal(line.points.length, 2);
  assert.equal(line.points[0][1], line.points[1][1]);
  // (its label sits on the line)
  assert.ok(Math.abs(line.labelBox.y + line.labelBox.h / 2 - line.points[0][1]) <= 1);
});

test('with ELK itself: on a prototype the size of a real project, no arrow runs through a screen', async () => {
  const d = await layoutFlow(planFlow(large, { width: 132, height: 317, thumb: 287 }), new ELK());
  assert.equal(d.nodes.length, large.length);
  assert.equal(d.sections.length, 8);
  assert.equal(d.lines.length, planFlow(large).lines.length);
  const through = d.lines.filter(line => line.points.slice(1).some((b, i) => {
    const a = line.points[i];
    const [x0, x1, y0, y1] = [Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1])];
    return d.nodes.some(n => x0 < n.x + n.w - 2 && x1 > n.x + 2 && y0 < n.y + n.h - 2 && y1 > n.y + 2);
  }));
  assert.deepEqual(through.map(l => `${l.from}>${l.to}`), []);
  // no two frames overlap
  const overlap = d.sections.some((a, i) => d.sections.some((b, j) => j > i && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h));
  assert.equal(overlap, false);
});

test('an arrow with a tapped part starts at that part, and one given to ELK backwards is turned round', async () => {
  const two = [{ id: 'a', title: 'A', group: 'One', next: [{ to: 'b', label: 'Go' }] }, { id: 'b', title: 'B', group: 'Two', next: [{ to: 'a', label: 'Home' }] }];
  const plan = planFlow(two, { width: 100, height: 230, thumb: 200, taps: new Map([[0, { x: 20, y: 90, w: 40, h: 20 }]]) });
  // (ELK's answer, written out by hand: each screen at 28,52 in its frame, the chip beside it)
  const laid = {
    layout: async graph => ({
      ...graph,
      width: 300,
      height: 310,
      children: graph.children.map(c => ({ ...c, x: c.id.startsWith('chip') ? (graph.id === 'part0' ? 200 : 10) : 28 + (graph.id === 'part1' ? 80 : 0), y: c.id.startsWith('chip') ? 141 : 52 })),
      edges: graph.edges.map(e => ({ ...e, sections: [{ startPoint: graph.id === 'part0' ? { x: 129, y: 152 } : { x: 60, y: 152 }, endPoint: graph.id === 'part0' ? { x: 200, y: 152 } : { x: 107, y: 152 } }] })),
    }),
  };
  const d = await layoutFlow(plan, laid, { gap: 40, margin: 0 });
  const [go, home] = d.lines;
  // the tapped part's right edge is 60 across its screen: the arrow starts there, 69 short of the screen's edge
  assert.deepEqual(go.points, [[88, 152], [129, 152], [200, 152]]);
  assert.deepEqual([go.chip.x, go.chip.y, go.chip.text], [200, 141, '→ B']);
  // the second frame sits to the right of the first, and its arrow runs from the screen to the chip
  assert.deepEqual(d.sections.map(s => s.x), [0, 340]);
  assert.deepEqual(home.points, [[447, 152], [400, 152]]);
});

test('a path runs through its points with rounded corners', () => {
  assert.equal(roundedPath([[0, 0], [10, 0]]), 'M 0 0 L 10 0');
  assert.equal(roundedPath([[0, 0], [20, 0], [20, 20]], 5), 'M 0 0 L 15 0 Q 20 0 20 5 L 20 20');
  // (a corner too close to its neighbours is rounded only as far as there is room)
  assert.equal(roundedPath([[0, 0], [4, 0], [4, 20]], 5), 'M 0 0 L 2 0 Q 4 0 4 2 L 4 20');
});

test('a comment on the canvas stays beside the screen nearest to it', () => {
  const nodes = [{ id: 'a', x: 0, y: 0, w: 100, h: 200 }, { id: 'b', x: 300, y: 0, w: 100, h: 200 }];
  const spot = anchorTo(nodes, { x: 280, y: 50 });
  assert.deepEqual(spot, { near: 'b', dx: -20, dy: 50 });
  const moved = [{ id: 'b', x: 1000, y: 400, w: 100, h: 200 }];
  assert.deepEqual(placeOf(moved, { x: 280, y: 50, ...spot }), { x: 980, y: 450 });
  // (its screen not drawn, or a comment from before screens were remembered: where it was left)
  assert.deepEqual(placeOf([], { x: 280, y: 50, ...spot }), { x: 280, y: 50 });
  assert.deepEqual(placeOf(moved, { x: 280, y: 50 }), { x: 280, y: 50 });
});

test('a screen can be brought to the middle of the view', () => {
  assert.deepEqual(centreOn({ x: 100, y: 100, w: 100, h: 200 }, { width: 1000, height: 800 }, 0.5), { scale: 0.5, x: 425, y: 300 });
});

test('fit shows the whole diagram, centred, and never zooms past full size', () => {
  assert.deepEqual(fitTo({ width: 2000, height: 500 }, { width: 1048, height: 800 }), { scale: 0.5, x: 24, y: 275 });
  assert.equal(fitTo({ width: 100, height: 100 }, { width: 1000, height: 1000 }).scale, 1);
});

test('zooming keeps the point under the pointer still, within limits', () => {
  const next = zoomAbout({ scale: 1, x: 0, y: 0 }, { x: 100, y: 50 }, 2);
  assert.deepEqual(next, { scale: 2, x: -100, y: -50 });
  assert.equal(zoomAbout({ scale: 1, x: 0, y: 0 }, { x: 0, y: 0 }, 99).scale, 2.5);
});
