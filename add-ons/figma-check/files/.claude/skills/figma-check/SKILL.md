---
name: figma-check
description:
  The shared Figma tools both directions use. Read a Figma component or frame into a saved snapshot, check the built
  story against it layer by layer (`pnpm figma:audit`), and put the two side by side (`pnpm figma:compare`). Load it
  from `figma-to-code` or `code-to-figma`, or when someone asks whether code matches Figma, whether a design changed,
  or how a Figma property maps to a prop.
---

# Figma check

One way of checking, so "it matches Figma" means the same thing whichever way the work goes.

| Tool                                 | What it does                                                            |
| ------------------------------------ | ----------------------------------------------------------------------- |
| `extract.js` (this folder)           | Run in Figma through the Desktop Bridge. One run, one snapshot.          |
| `pnpm figma:snapshot <slug> <file>`  | Saves what the extractor returned as `figma/specs/<slug>.json`.          |
| `pnpm figma:audit <slug> --layers`   | Lists every layer in a snapshot, to write the map from.                  |
| `pnpm figma:audit <slug> --scaffold` | Writes a starting map with every layer listed, to fill in.               |
| `pnpm figma:audit <slug>`            | Checks the story against the snapshot, every layer, light and dark.     |
| `pnpm figma:compare <story-id>`      | Figma picture, code, and the differences side by side.                  |
| `pnpm figma:health <slug>...`        | How tidy a file is: tokens, styles, auto-layout, detached copies.        |
| `pnpm figma:survey <slug>...`        | The grid several screens follow; `--save` writes it to `figma.json`.     |
| `pnpm figma:screen <slug>`           | A built screen against its frame: pieces, regions, every phone width.    |
| `figma.json` (repo root)             | The project's Figma facts: files, direction, token and text-style names. |
| `setup.md` (this folder)             | Installing the figma-console MCP and its Figma plugin, when they're missing. |
| `reference.md` (this folder)         | Traps, Figma quirks, the policy for a messy file. Read when surprised.  |

## Before any Figma work

1. **The tool.** No `figma_get_status` tool means the figma-console MCP isn't installed or isn't running: follow
   `setup.md` (this folder). Claude installs it after asking; the person restarts Claude and adds the plugin in Figma.
   **The bridge.** The extractor runs inside Figma Desktop. The file must be open there with Plugins → Development →
   Figma Desktop Bridge running. Check with `figma_get_status`. If it's down, ask the person to start it; never retry in
   a loop, and never swap in another way of reading the file.
   **Check which file it's on.** Other sessions may have bridges open, and it can connect to a blank "Untitled" file.
   Compare the open file's name and key with `figma.json`, then lock onto it (`figma_navigate` with `lock: true`) before
   reading anything. Reading a copy of the design (its key differs)? Record it in `figma.json` as
   `"readFrom": { "key": "…", "name": "… (Copy)" }` next to `files.design`.
2. **`figma.json`.** Read it. `files.design` is the file we read from, `files.library` the one `code-to-figma` writes
   to, `direction` says which side is the source. If the person gives a link to a file that isn't in it, ask whether to
   add it.
3. **Big files.** Never read a whole page or file: each call is cut off after a few seconds. Work from the link's
   `node-id` (`123-456` in the link is node `123:456`), find others with `figma_search_components`, and read variables
   and styles once.
4. **Variables may live in a library.** A file's own variable list can be empty while its layers use a library's. The
   snapshot records every variable bound to a layer (`variables` in the snapshot, with `remote: true` for library
   ones): read those, and say when they come from another file.

## Taking a snapshot

Paste `extract.js` into `figma_execute`, after a line naming the target:

```js
const SPEC = {
  slug: 'button', // kebab-case, matches the tracker row and the file name
  nodes: ['123:456'], // the instances or frames being built (optional)
  set: '123:400', // the component set, whenever there is one
};
```

Name the set whenever there is one: a variant shows one state, the set shows them all. Save the result with
`pnpm figma:snapshot <slug> <file>`, where the file is what the tool returned or saved (it finds the snapshot inside any
wrapping). Then run `pnpm figma:audit <slug> --layers` to confirm it covers every node you named. Never edit a snapshot
by hand; take it again.

The snapshot is a file to query, not to read: look things up with `jq` or `node -e`, by path. It records what a reader
would miss: glass settings, blend modes with their CSS names, video fills, cap-height trim (`text.trim`), the size a
layer really draws at including shadows (`drawn`), and which variables come from a library (`variables`).

Its warnings come grouped by kind with a count (`text-style ×103`). Each kind gets one decision in `FIGMA.md`, not one
line per layer.

## The map

`packages/ui/figma/specs/<slug>.map.json` says which story to open and where each Figma layer went:

```json
{
  "story": "components-atoms-button--sizes",
  "tree": "sets.0",
  "drawnIn": "light",
  "nodes": {
    "root": "button",
    "root/Label": { "selector": "button", "skip": { "box.h": "the text sits in the button itself" } },
    "root/Focus ring": { "skip": "drawn by focusRing, not a layer" }
  }
}
```

- Every layer from `--layers` gets a selector or a written reason. A layer with neither fails as UNACCOUNTED: missing
  pieces are the mistake no measurement catches.
- A reason can excuse one property, keyed `group.prop` (`box.h`, `paint.fill`, `type.style`). The reason is the point:
  it turns a silent difference into a recorded one.
- **A skip covers everything inside it.** Skip an icon and its vector paths go with it. `{ "checkedIn": "tab-bar" }`
  does the same for a piece ported and checked by its own map. A skip's reason must name a real limit ("the phone's
  status bar draws it"); "not built yet", "todo" or "open question" fail.
- `drawnIn` is the mode the Figma frame shows. A colour with no token is only checked in that mode.
- `"spec": "<other-slug>"` borrows another snapshot; `"viewport": { "width": 402, "height": 874 }` sets the page size
  for both the audit and the compare.
- `"tree"` can start inside a snapshot: `"nodes.0/Nav / Bottom/Nav / Row"` (the path `--layers` prints, without `root/`).
- `"variants": { "Notified": "components-atoms-bell--pressed" }` checks a variant of the set against its own story. The
  variant is rebuilt from the base and its recorded differences.
- A layer mapped to the same element as its parent (a label drawn by its button) has no box or position of its own;
  only its paint and type are checked.

## The parity check

```bash
pnpm figma:audit <slug>            # both modes; --mode light for one
```

It uses the Storybook already running when it has the story, and builds one otherwise. It opens the story at rest (no
focus, no hover), in each mode, and checks:

| Group    | Figma                                       | Page                                     |
| -------- | ------------------------------------------- | ---------------------------------------- |
| box      | width, height, position in its parent (±1px) | the element's box                       |
| spacing  | padding, gap                                | padding, row or column gap               |
| paint    | fill (by token, and the token's Figma value), opacity, borders per side, each corner | background or text colour, opacity, borders, radii |
| effects  | shadows, text shadows, blur, glass          | box-shadow, text-shadow, filter, backdrop-filter |
| type     | size, text style, line height, letter spacing, case, trim | font size, `type-*` class, line height, letter spacing, text-transform, text-box |
| order    | child order in an auto-layout frame         | position on screen                       |
| presence | every layer                                 | a selector or a reason                   |

Weight is checked through the named text style, mapped to our composite in `figma.json` `textStyles`, because Figma
reports the weight of whatever font it fell back to. Colours bound to a variable are checked against our token, found
through `figma.json` `tokens`, or the whole name slugged (`Background/Primary` → `--background-primary`). Never part of
a name: `text/primary` isn't `--primary`. A variable with neither fails as unmapped. The page's token is also checked
against the variable's value in Figma, so a wrong palette can't pass by agreeing with itself.

A leaf layer's opacity and its colour are checked as one look: white at 80% opacity and 80%-white text match.

The audit sees which Figma fonts the page really has. Sizes set by a missing one (hug widths, text heights, positions
after it) are skipped, naming the font, until it's installed; `"realFonts": true` in the map forces them on.

It only uses a running Storybook that belongs to this project (a copy of the starter on the same port has the same
stories), otherwise it builds its own.

A row you didn't print is a row you didn't check. Paste the table.

## Screens

A screen snapshot is the extractor run on the frame (`nodes: ['<frame id>']`). It also records which library
component each instance comes from (`component`), how layers placed by hand are pinned (`constraints`), layout grids
(`grids`) and how text boxes resize (`textResize`).

`pnpm figma:health` leaves out layers inside instances: they belong to their component. Detached copies are frames or
groups named like a library component, or like a component used elsewhere in the file.

`pnpm figma:survey` reads the side margin from content that sits the same distance from both edges, spacing from
auto-layout gaps and from the gaps between loose layers, and rows of two or more equal items. It needs 3–5 screens to
be trusted. It is a finding to confirm with the person, never a rule to apply unasked.

The screen map, `figma/specs/<slug>.map.json`:

```json
{
  "screen": { "story": "templates-home--phone" },
  "drawnIn": "dark",
  "regions": {
    "Header": "header",
    "Feed/Cards": { "selector": "[data-region=cards]" },
    "Bottom bar": { "selector": "nav", "fixedHeight": true, "pinned": true }
  },
  "pieces": {
    "Button": { "use": "Button", "selector": "button" },
    "Filter chip": { "new": "used on three screens; port it first" },
    "Status bar": { "skip": "the phone draws it" }
  }
}
```

- `screen` is a story id, or `{ "url": "http://localhost:5173/#home", "source": "apps/frontend/src/Home.tsx" }` for a
  running page (start it first). With `source`, the file is searched for the frame's width or height used as a fixed
  size, and for `h-screen` / `100vh`.
- `drawnIn` is the frame's mode. Left out, a dark frame background means dark; `--mode` overrides both. The Storybook
  address comes from `figma.json` `storybookUrl`.
- `regions` keys are layer paths as `--layers` prints them; values are CSS selectors on the page. Left edge and width
  must be within 8px. The top region, and any marked `pinned` (a bar fixed to the screen), are placed from the top;
  every other region by its gap to the region above, so one snapped gap doesn't fail everything below it. Height only
  counts when `fixedHeight` is set, because content decides most heights.
- `pieces` keys are Figma component names (a set's name, not a variant's). `selector` counts what's on the page: it
  must find at least as many as Figma has. Every piece needs an entry; one with no match is `UNMAPPED`. A piece our
  library doesn't have is `new` and counts as not done. A `skip` reason that only says "later" or "not built" fails.
- Text needs no map: each Figma text is found on the page by its words, and its face, size, weight and colour are
  compared, each colour of two-colour text included. Words that aren't on the page are listed, not failed.
- With `source`, Tailwind widths and heights that equal a layer's size (`w-40` for a 160 card) and aspect ratios that
  are a layer's exact size are flagged too.
- The Figma picture is `figma/baselines/<slug>.png`, exported at 1× as PNG. The report
  (`.figma/screens/<slug>/report.html`) cuts each region from it and from the page at full size, side by side, then
  shows the whole screen at every width checked.

## The side-by-side picture

Export the Figma node at scale 1 as PNG with `figma_get_component_image` (`nodeId`, `format: "png"`, `scale: 1`) and
save the link it returns: `curl -sSfo packages/ui/.figma/<story-id>.png "<link>"` (git-ignored). It goes through
Figma's web service, so it works for big frames too. Without it, `figma_execute` can return
`figma.base64Encode(await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1 } }))`; save that
text as a `.b64` file instead.

The export is what the layer draws, shadows and glows included, so it can be bigger than the layer. Then:

```bash
pnpm figma:compare <story-id> --baseline packages/ui/.figma/<story-id>.png     # saves it, then compares
pnpm figma:compare <story-id> --mode dark                                       # later runs reuse the saved picture
```

The Figma picture is saved under `packages/ui/figma/baselines/` and committed. For dark, switch the frame's variable
mode in Figma and export again. The page size comes from the map's `viewport`. Different sizes fail before any pixels
are compared; when the difference is explained (it fills its row, a glow draws past its box), add `--pad` to centre
both on one canvas. The rest is for reading: look at `packages/ui/.figma/compare/<story-id>.<mode>.compare.png`, start
with the areas it lists as most different, and say in one sentence what differs. Pixel counts can't tell wrong padding
from a stand-in font.

## Figma properties and our props

| In Figma                                       | In our code                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| A style axis (`Style = Primary / Ghost`)       | `variant`                                                             |
| A size axis (`Size = S / M / L`)               | `size`, on controls only (`docs/adr/0005`); anything else fills its space |
| A state axis (`State = Hover / Pressed`)       | No prop: `hover:` and Base UI data attributes                         |
| A true/false property (`Disabled`)             | `disabled`, `checked`, `open` and the other standard names            |
| A text property (`Label`)                      | A required string prop (`label`, `…Label`) or `children`              |
| A swappable icon (instance swap)               | An `icon` prop taking a Lucide icon                                   |
| A slot (free content)                          | `children`, or `render` when the element itself changes               |
| A slot that repeats                            | `children` holding the repeated part                                  |
| Nothing in Figma (`onClick`, `className`, ref) | Stays in code                                                         |

An axis packing two ideas (`Primary Small`) splits into `variant` and `size`. The extractor marks state axes
(`axisClassification[axis].isState`). Layout helpers (`Stack`, `Grid`, `Center`) have no Figma version.

## Writing to Figma

Whenever Claude changes a Figma file:

1. **Never the client's design file.** Only `files.library`, or a page of our own.
2. **Save a restore point first** (`figma.saveVersionHistoryAsync('<what and why>')`). If that fails, change nothing and
   report the plan only.
3. **Never publish the library.** A person reviews the changes in Figma's publish dialog, then publishes or restores.
4. **Keep designers' hand edits.** Code added something and a designer tweaked something else: do both. Code removed what
   a designer changed: code wins, and say so. Both changed the same value: skip it and ask.
5. **Read comments, never resolve them.** A question gets an answer from the code; a gap the code already fills gets
   fixed, citing the comment; a request for something the code doesn't have goes to a person.
