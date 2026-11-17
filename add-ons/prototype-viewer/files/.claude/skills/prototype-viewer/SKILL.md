---
name: prototype-viewer
description:
  Make clickable prototypes and present them to clients in the prototype viewer (sites.metalab.com/<project>/present/).
  Use when someone wants to build a prototype, show work to a client, preview prototypes locally, or choose which
  prototypes and rounds a client sees.
---

# Prototype viewer

The viewer is one site, `explorations/present/`, that shows every prototype in a phone (or desktop) frame. A top bar
holds everything: the prototype menu (rounds, show to client), the screen menu, all screens as a grid or a flow diagram,
comments, labels, light and dark, settings and share. Underneath it is Marcus Brown's prototype template, kept as they
made it, with their sample app swapped for a live prototype.

## Make a prototype

1. `pnpm new-prototype <name>` makes `explorations/<name>/`, with `@repo/ui` wired up.
2. List the screens in `prototype.json` (`title`, `description`, `device: "phone" | "desktop"`, `screens: [{id, title}]`).
   Two optional fields per screen feed the viewer's screen menu and flow view. Write both whenever you build or change
   a prototype:
   - `group`: the part of the product the screen belongs to ("Browse", "Buy"). Screens with the same group sit under one
     heading, and in the flow view of a long prototype (over 24 screens) each group gets a frame of its own, with a move
     into another group ending in a chip that jumps there. List the screens in the order of the flow, the smooth route
     first within each group: the flow view reads left to right in that order, and takes a move to an earlier screen as
     the one that loops back.
   - `next`: where the screen leads, one entry per `go(id)` in its block:
     `[{ "to": "cart", "label": "Add to bag" }, { "to": "home", "label": "Back", "back": true }]`. `label` is the button's
     words; `back: true` marks a way back, drawn dashed (a plain "Back" along a move that is already drawn gets no
     arrow of its own: the one there already joins the two screens); `problem: true` marks a move made because something went wrong
     (a declined card, a seat that was just taken), drawn in a warning colour, so the smooth route and the problem
     routes can be told apart at a glance. Without any `next` the flow view joins the screens in order.
     Each arrow starts at the part that is tapped. The viewer finds it by the label: the first button or link on that
     screen with exactly those words. When the words differ, or the part isn't a button (a card, a row), point at it with
     `"tap": "[data-note=…]"` and give that part the `data-note` attribute in `App.tsx`. A part below the first screenful
     can't be found, and its arrow starts at the screen's edge.
3. Build each screen in `src/App.tsx`, one block per screen id. The viewer opens a screen by its `#id`, so every id in
   `prototype.json` needs a block, and moving between screens goes through `go(id)` from `useScreen`.
4. Keep the padding that uses `--safe-top`, `--safe-right`, `--safe-bottom` and `--safe-left` (`SAFE_AREA` in the
   template). The viewer sets them to the room its frame takes (status bar, camera cut-out, home bar), and changes them
   when the phone is turned on its side, as a real phone does. On its side the prototype is laid out wide, so a screen
   should work at both shapes.
5. Optionally, explain the screens. Each screen in `prototype.json` can carry:
   - `note`: one line about the whole screen, shown beside the phone (hold the Labels switch to swap to these).
   - `labels`: `[{ "target": "[data-note=start]", "title": "One way in", "text": "…" }]`, numbered dots on parts of the
     screen with a note beside each. `target` finds the part; give it a `data-note="…"` attribute in `App.tsx`.
   - `hint`: the part a moving pointer taps, to show people where to go next (`"[data-note=start]"`, or
     `{ "target": "…", "gesture": "swipe" }`).
   The Labels and pointer switches (top left) only appear when a prototype has some.
6. `pnpm present` builds everything and opens the viewer at http://localhost:4400. Locally you are always staff and
   your switches are saved in this browser only.

Prototypes are explorations, so the library's rules don't apply inside them (`docs/adr/0007`), but reach for `@repo/ui`
components first: the prototype should look like the product.

## Show it to the client

Merging to main publishes the prototype and rebuilds the viewer (its package.json sets `"sites": {"rebuildOnAnyChange":
true}`). A new prototype starts **hidden**: clients see only what someone switches on.

- **In the viewer:** a MetaLab person opens the Prototypes panel (bottom left) and flips the eye on each row. Drag a
  row by its grip (or focus the grip and use the arrow keys) to reorder it or move it under another round; **+ New
  round** adds a heading, and clicking a round's name renames it. Settings → Client View shows the viewer as the client
  will see it.
- **Through Claude:** the switches are saved in the viewer site's database, collection `choices`, one document per
  prototype: `{ name, show, round, order }`. `name` is the folder name. `round` groups prototypes under a heading
  ("Round 2 · 14 Nov"), and `order` sorts them. Use the Sites connection (`db_list_documents`, `db_create_document`,
  `db_update_document` on the `present` site); update the existing document for a prototype rather than adding a second.

## Client access

Each site on Sites checks access on its own, so a client must be allowed on the viewer **and** on every prototype it
shows. The viewer's access is the guest list; Claude copies it onto the prototypes.

**Once per engagement (the engagement lead, in the Sites dashboard):** on the project's `present` site, under Settings,

- invite the client's emails (Guest email invite) or pick their company, keeping All Okta users on so staff still get in;
- set **Database writes** to **Anyone who can view this site**, so clients can comment. (The viewer only trusts
  show/hide choices saved by MetaLab people, so this doesn't let a client change what is shown.)

**Sync client access (Claude, through the Sites connection):** do this whenever someone switches a prototype on or off,
or the client's guest list changes. Ask before the first sync in a session: it changes who can open client work.

1. `get_site_permissions` on `present` (with `project=<slug>` from `sites.json`): note `is_guest`, `guest_emails`,
   `is_company`, `company_ids`.
2. `db_list_documents` on `present`, collection `choices`: the prototypes with `show: true`, counting only documents
   whose `author_email` ends in `@metalab.com`.
3. For each shown prototype, `update_site_permissions` with those four values (leave `is_okta_all` on).
4. For every other prototype (each exploration with a `prototype.json`), `update_site_permissions` with
   `is_guest: false` and `is_company: false`, so a hidden prototype is staff-only even from an old link.
5. Say what changed, by prototype: who can now open it.

## Comments

Anyone who can open the viewer can comment on a prototype, as in Figma: the bubble button (top left) or the C key
turns comment mode on, a click on the screen drops a pin, and each pin is a thread with replies, emoji reactions and a
tick to resolve it. `?comments=1` opens the viewer with comment mode on. Pins belong to one screen of one prototype and
stay on their spot as it scrolls. Locally they are kept in the browser only.

On Sites they are kept in the viewer's database, and arrive live for everyone looking. Clients can only comment once
**Database writes** is set to **Anyone who can view this site** (see Client access).

- collection `comments`: `{ proto, screen, x, y, text, parent?, resolved? }`. `proto` is the prototype's folder name,
  `screen` its screen id, `x` a share of the screen's width and `y` pixels down the page. A reply has `parent` (the
  thread's id) and no spot.
- collection `reactions`: `{ proto, comment, emoji }`.
- Sites stamps each with `author_email` and `created_at`, so who said what can be trusted.

**Read the feedback (Claude):** `db_list_documents` on `present`, collection `comments` (and `reactions` for the
emoji). Group by prototype and screen, put replies under their thread, leave out resolved threads unless asked, and
say who wrote each (MetaLab or client, from the email). To close a thread once its change is made, ask first, then
`db_update_document` with `{ resolved: true }`.

## Labels added in the viewer

With Labels on, a MetaLab person can press **Add label** (bottom right), click a spot on the screen and write a title and
a note. Such a label sits at that spot, not on a part of the screen, so it can drift when the layout changes.

**Tie them in (Claude), before a round goes to the client:**

1. Read them: on Sites, `db_list_documents` on `present`, collection `labels`
   (`{ proto, screen, x, y, title, text }`, `x` a share of the screen's width, `y` pixels down the page; count only
   documents whose `author_email` ends in `@metalab.com`). Locally they are in the browser (`localStorage`,
   `present-labels`): ask the person to read them out, or add them straight to `prototype.json`.
2. For each, find the part of the screen at that spot in the prototype's `App.tsx`, give it a `data-note="…"`
   attribute, and add `{ "target": "[data-note=…]", "title", "text" }` to that screen's `labels` in `prototype.json`.
3. Delete the tied-in documents (`db_delete_document`), so the label isn't shown twice. Say which labels were tied in.

## Sample comments

A prototype can come with comments to start with: `sample-comments.json` beside its `prototype.json`. They show only on
someone's own computer (`pnpm present`), where comments are kept in the browser; never on Sites, where comments are real
people's. They are put in the first time the prototype is opened in a browser, and Settings → Sample comments → Reset
clears that prototype's comments back to them (handy before a demo).

```json
{ "comments": [
  { "screen": "cart", "x": 0.62, "y": 418, "by": "priya.raman@client.example", "ago": "2d",
    "text": "Can the total stay in view?", "resolved": false,
    "reactions": { "👍": ["dana.whitlock@metalab.com"] },
    "replies": [{ "by": "dana.whitlock@metalab.com", "ago": "1d", "text": "Yes, next round." }] },
  { "screen": "@flow", "near": "cart", "dx": 170, "dy": 40, "by": "…", "ago": "5h", "text": "…" }
] }
```

`x` is a share of the screen's width and `y` pixels down the page, as for any comment; one on the flow canvas names the
screen it sits beside (`near`) and how far from that screen's corner. `by` is an email (the name shown comes from it) and
`ago` is "20m", "5h" or "3d", counted back from now. Use made-up people only.

## Comments on the flow view

A comment left on the flow canvas is kept like any other, with `screen: "@flow"`, the screen it was left beside
(`near`, with `dx` and `dy` from that screen's corner) and `x`, `y` in the canvas's own pixels as a fallback. It stays
beside that screen however the diagram is drawn. In the comments panel they sit under "Flow".

## Changing the viewer

Three layers, each with one job:

- `explorations/present/marcus/` is Marcus's template, unchanged: leave it alone, so a newer version can drop in. It
  draws the phone, the labels, the pointer and the settings behind the shell.
- `explorations/present/live/*.js` and `build.mjs` take the sample app out and wire in the live prototype through
  `window.proto` (`step(id)`, `at()`). They also hold what is saved: choices (`choices.js`), comments (`comments.js`),
  labels (`live.js`). `escape.js` runs first on the page and hands Esc to whatever is on top.
- `explorations/present/live/shell/` is the top bar and everything it opens, as small ES modules with no build step
  (`index.js` lists them). **`engine.js` is the only file that touches the template or the live scripts**; every other
  shell file goes through it. `model.js` and `flow-layout.js` are pure logic with tests
  (`pnpm --filter @explorations/present test`); add a test when you add logic there. The flow view is laid out by ELK
  (`elkjs`, the viewer's one package): `flow-layout.js` decides what is drawn and hands each part to ELK to place and
  route, and `elk.js` fetches ELK in the background once the viewer is up. Try a change to the flow view on a long
  prototype as well as a short one: `test/large-prototype.mjs` is a made-up grocery app of 63 screens, as data, that the
  tests lay out. A new menu is a `build…` function
  given to `attachPopover` (`popover.js`); a new control in the bar goes in `topbar.js`. Styles are in `live/shell.css`,
  coloured only from the `--sh-*` tokens at its top.

After a change, run the tests, then `pnpm present` and try it in light and dark.
