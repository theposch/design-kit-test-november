# Whole screens from Figma

Components are the bricks; a screen is our components, arranged. It should bring almost no new styling. Tools are in
`figma-check` (`pnpm figma:health`, `figma:survey`, `figma:screen`).

## Three rules first

1. **Figma is the intent, not the blueprint.** Read the frame for what it means (a header, a list of cards, a sticky
   button) and build it the way an engineer would. Never copy the layer tree: twelve nested frames are often one
   `Stack`, and a "Group 48" of loose rectangles is often a `Card`.
2. **Responsive by default.** Designers draw one phone (390 or 402 wide). The code works on every phone from 320 to
   430 without anyone drawing those. A width in the frame is a hint: things fill, text wraps, and nothing gets a fixed
   width or height unless it really is fixed (an icon, an avatar, a control's height).
3. **Know what the file gives you before building.** Check its health and its grid first (steps 1–2), once per
   project.

## Where it lands

Ask first, because the rules differ:

| Destination                                  | Rules                                                                                     |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| A page in the app (`apps/frontend`)          | Full: library components only, tokens only, 8px grid, the sizes in `project.json`          |
| A new template (`packages/ui/src/templates`) | Full, plus Desktop, Tablet and Phone stories, and strings through props                    |
| A prototype screen (`explorations/<name>/`)  | Light: our components where they fit, anything goes where they don't; one `#id` per screen |

A page that starts from a template: `pnpm template copy <Name>`, then change it.

## The runbook

1. **Health check (once per project).** Snapshot the screen frames (the extractor with `nodes`), then
   `pnpm figma:health <slug>...`. It prints one line: colours on tokens, text on styles, frames with auto-layout,
   instances, detached copies, default names.
   - **Tidy:** carry on.
   - **Mixed or messy**, and `figma.json` has no `care` yet: say what you found in plain words and ask once:
     _"This file isn't set up with tokens and styles. Do you want to set them up properly first (slower, and the
     result can grow into the real product), or is this a quick and dirty prototype where speed matters?"_
     - **Set it up** (`"care": "system"`): propose a token map from the colours, type and spacing the file actually
       uses, grouped (ten near-identical greys are one grey). The person confirms it; it goes in through
       `configuring-tailwind` (`pnpm palette:convert` for hex values) before any screen is built.
     - **Quick** (`"care": "quick"`): use the starter's tokens, snapping every value to the nearest without asking
       about each, and build as a prototype screen. List what was snapped in the report.
   - Save the answer in `figma.json` as `care`. Never ask again in this project.
2. **Survey the grid (once per project).** Designers rarely set up a layout grid but most follow one. Snapshot 3–5
   typical screens (or every screen in a short flow), then `pnpm figma:survey <slug>...`. It reports the side margin
   and on how many screens, the spacing that repeats, rows of equal items (cards two per row with a 12 gap), any
   layout grid the file has and whether the screens follow it, and values that fall between the page steps.
   - Show it to the person. Name each screen that breaks the pattern and ask: on purpose (a full-width photo) or a slip?
     Don't copy a slip.
   - No clear margin (no value on more than half the screens): show each screen's and ask which is meant.
   - Rows that run off the right edge scroll sideways: the margin is on their left only.
   - A value between steps (a 20 margin, a 56 gap): snap it, or make it a proper value, following `care`. Page steps
     go up to 64 (step 16). A snapped gap moves everything below it, which is why regions are checked by their gap to
     the region above, not their distance from the top.
   - Once confirmed, `pnpm figma:survey <slug>... --save` writes `grid` to `figma.json`. Every later screen is built
     and checked against it.
3. **Read the intent.** Before code, write down the screen the way an engineer plans it: the regions (top bar,
   content, bottom bar), what scrolls and what stays put, what repeats (five cards are one card and a list of data),
   which pieces are library components and which are truly new. Then what a still frame can't show: a long name, an
   empty list, one more item, the keyboard open.
4. **Find each piece in our library.** Every Figma instance gets a match: by Code Connect, else by name, else by look
   (a detached copy of a button is still a button), else ask. Anything reusable that isn't in the library goes
   through the component runbook first. A screen never hides a new component inside itself.
5. **Start from a template** when one fits, else from `Layout`.
6. **Lay it out from the intent**, with `Stack`, `Grid` and `Layout`, gaps on the 8px grid and the margin from
   `figma.json` `grid`. Use the table below to read Figma's settings. A frame that only wraps one thing disappears;
   frames that only nudge something into place disappear; loose layers placed by hand become a row or column read
   from where they sit.
7. **Sizes: the project's, no more.** Build and check each size in `project.json`. If Figma only has a phone frame
   and the project has wider sizes, ask once what wider screens should do, and default to the template's rules:
   content gets a maximum width and is centred, lists become grids, side panels appear where the template has them.
   Say plainly those sizes have no design, in the story's description too. A template always gets all three
   stories.
8. **Copy and images.** In an app page or prototype the Figma text is used as written; in a template it becomes story
   content. Get pictures out with the connected tools, as `figma-check` reference.md "Pictures out of Figma" says:
   photos at 2×, layers always as PNG, icons as SVG, and each picture's crop kept. A shadow is CSS, not part of the
   picture. Put them next to the page or prototype that uses them; pictures only stories use go in
   `packages/ui/src/fixtures/`.
9. **Check it.** Write `figma/specs/<slug>.map.json` (`screen`, `regions`, `pieces`, and `drawnIn` when the frame's
   background doesn't show its mode; see `figma-check`) and export the frame at 1× as PNG to
   `figma/baselines/<slug>.png`. Then `pnpm figma:screen <slug>`:
   - **Pieces:** every Figma component on the screen is found on the page as ours. A button that became a `div`
     fails. A piece our library doesn't have yet is `new` and isn't done until it's ported; `skip` needs a real
     reason ("not built yet" isn't one).
   - **Regions:** each region's left edge and width within 8px of the frame, and its gap to the region above. Height
     may grow with content. A bar fixed to the screen is `pinned` and checked from the top.
   - **Text:** each Figma text is found on the page by its words, and its face, size, weight and colour match, each
     colour of two-colour text included.
   - **Widths:** 320, the frame's own width, and 430: nothing spills sideways at any of them.
   - **Copied sizes:** the page's source has no fixed width or height taken from the frame.
   - **Pictures:** the report cuts each region from both pictures at full size, side by side. Go through every one
     and name each difference you see. Numbers decide pass or fail; the pictures are evidence, because a picture that
     "looks right" small can still be wrong.
10. **Sort every difference before fixing it.** Each is a rule we got wrong (fix this runbook), a fact we didn't read
    from Figma (fix the extractor), a judgement call (ask, then record it in `FIGMA.md`), or a mistake in the design
    (tell the designer; don't copy it). Fix at that level and check again, until every remaining difference is
    named and accepted.
11. **Track it.** Add the screen to the Screens table in `FIGMA.md`: destination, status, and what was snapped or
    decided.

A prototype from several frames: one screen per frame, in the frames' order, the frame name as the screen title in
`prototype.json`. Figma prototype links between frames become `go(id)` calls.

## Reading Figma layout as code

A tidy frame translates almost directly. This is a reading guide, not a copy machine: step 3's plan decides the
structure.

| In Figma                                    | In code                                                                   | Watch out for                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Auto-layout vertical / horizontal           | `Stack` with `direction` column / row                                     | A row of cards on a phone often needs to become a column, or a `Grid` that reflows, on narrow screens. |
| Wrap (horizontal only)                      | `Grid` that reflows, or a wrapping `Stack`                                | `Grid` when items line up in columns; wrap for pills and tags.                                        |
| Gap                                         | `gap` on the `Stack` or `Grid`, on the 8px grid                           | "Space between" with no gap usually means "push the last item to the end".                            |
| Padding                                     | Padding on the region, on the 8px grid                                    | Big outer padding on the frame is usually the page margin, which `Layout` owns.                       |
| Align (main and cross axis)                 | `justify` and `align` on the `Stack`                                      | Centred because it happened to fit isn't centred on purpose; try a longer text.                       |
| Fill container                              | Stretches: full width, or grows into the leftover space                   | The normal case for blocks of content, and the safe default for anything that spans its parent.      |
| Hug contents                                | Keeps its natural size                                                    | Buttons, badges, tags and small controls keep hugging, even when they happen to span the frame.      |
| Fixed width or height                       | Only for what really is fixed: icons, avatars, a control's height         | A fixed 390 or 358 is the phone frame showing through: make it fill, maybe with a maximum width.      |
| Min / max width                             | A max width on the region                                                 | Rare in phone designs; wider screens usually need one anyway.                                         |
| Absolute position inside auto-layout        | An overlay: a badge on an avatar, a floating button, a background shape   | Only true overlays stay on top of the flow. Anything else placed by hand goes back into the flow.     |
| No auto-layout (frames or groups by hand)   | Read rows and columns from where things sit, then `Stack` and `Grid`      | Never copy x and y into code. Equal gaps reveal a list; a shared left edge reveals a column.          |
| Constraints (left and right, scale, centre) | Stretch with the screen, or stay centred                                  | "Left and right" is the designer saying it should fill.                                               |
| A fixed screen height (844, 874)            | No height: the page grows with its content and scrolls                    | Only full-screen layouts (a map, a camera) take the screen's height, with `h-dvh`.                    |
| Text "auto height" or a fixed text box      | Text that wraps freely, no fixed width or height                          | A box sized for one line holds a longer translation in code.                                          |

Three habits from the same idea:

- **Heights are never fixed** on regions, cards or text. The frame's height is what that sample content needed.
- **In a grid, the grid owns the width.** Each item fills its column; the grid decides how many fit.
- **Safe areas and the keyboard** (the notch, the home bar, a keyboard pushing a bottom button up) are the layout's
  job, even though Figma rarely draws them.

## Done

- `pnpm figma:screen <slug>` passes: pieces, regions, every width, no copied sizes.
- Every region in the report has been looked at, and every difference named in it is fixed or accepted in
  `FIGMA.md`.
- Every size in `project.json` is built; sizes without a design are said to have none.
- `FIGMA.md` has the screen's row. For an app page or template: `pnpm typecheck`, `pnpm lint` and `pnpm test` pass.
