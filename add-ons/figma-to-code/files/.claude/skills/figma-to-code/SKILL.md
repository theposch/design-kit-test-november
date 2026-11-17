---
name: figma-to-code
description:
  Build a component in packages/ui, or a whole screen (an app page, a template or a prototype screen), from its Figma
  design and prove it matches. Use whenever someone pastes a Figma link or node id to build or rebuild, asks to port or
  check a component or screen against Figma, says "parity" or "does it match the design", or asks to update something
  after the design changed, even without the word "port".
---

# Figma to code

Load `figma-check` first: it holds the tools, the map format and the prop table this runbook uses.

**A whole screen** (a frame with a page on it, not a component set) follows `screens.md` in this folder instead of the
runbook below. Its pieces still come through this runbook first.

## Before anything else

1. **Tracker.** Read the component's row in `packages/ui/FIGMA.md`. It may be done, skipped on purpose, or a duplicate. If
   `packages/ui/figma/specs/<slug>.json` exists, this is a design change: go to "When the design changes".
2. **Direction.** `figma.json` `direction` (or the row's own) must be `figma-first`. A `code-first` component isn't
   ported from Figma; say so and stop.
3. **Notebook.** Run `pnpm notebook`. If the project has one, read `decisions.md` for anything about this component and
   name the decision (D-014) when it shapes the work. Never copy notebook text into the repo.
4. **Bridge.** Check it as `figma-check` says. If it's down, you're blocked (below).

## Seven rules

Each one names what proves it. No proof, no rule followed.

| Rule                                                                                                                                                                                                              | Proof                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Look before you measure.** Compare the Figma picture and the built story by eye before checking numbers. The eye catches a wrong material in a second; a component once matched every box while drawing a black bar where the design had a soft shadow. | The side-by-side picture and one sentence on what the treatment is. |
| **The snapshot is a work list.** Every layer gets a place in the code or a written reason in the map.                                                                                                              | The map, with nothing UNACCOUNTED.                      |
| **Never report a value you didn't read.** Absent isn't default. Read with `extract.js`, never a hand-written walker.                                                                                                | The saved snapshot.                                     |
| **A warning is a decision.** Every kind of extractor warning is handled in code or written in `FIGMA.md`, once per kind.                                                                                                                  | A line per kind of warning. |
| **Done means a clean table, pasted.** No FAIL or UNACCOUNTED rows for every variant and state built, in both modes, and the table is in the report.                                                                | The pasted table and picture.                           |
| **Never fake artwork.** Export every image fill before building. A coloured box or a generated stand-in is a difference no check can see.                                                                           | One file per image, and a map row for each.             |
| **A visible effect gets built.** Glass, glow, blends, rims and highlights are the design, not extras. A skip names a real limit ("the phone's status bar draws it", "a video we don't have"), never "not built yet" or "open question". | Each skip reason names what makes it impossible.        |

## The runbook

1. **Snapshot.** Run the extractor on the component set (and the instances you're building) into
   `packages/ui/figma/specs/<slug>.json`. Check it with `pnpm figma:audit <slug> --layers`.
2. **Artwork.** List the image fills by hash inside the target and export each layer (it carries the mask and rounding).
   One hash used twice is a placeholder, not two pictures. An export bigger than its layer carries the layer's shadow or
   glow: compare the file's size with the layer's box (the extractor saves both) and size it as `figma-check`
   `reference.md` "Pictures out of Figma" says. Library components take artwork through props; sample images
   for stories sit beside the story and are imported.
3. **Look at the source.** Export the Figma picture (scale 1), save it with `pnpm figma:compare <story-id> --baseline …`
   once the story exists, and write one sentence on what the treatment is: "a 1px inner border, no shadow, a 4px lip".
4. **Read the intent.** Before mapping layers one by one, write down what the stack is trying to be:
   - **Motion clues:** video or GIF fills, prototype links, layers named on/off or `(off)`, variants where only a state
     changes, and platform patterns (a tab bar, a sheet, a toast). Propose the motion and label it a proposal.
   - **Faked effects:** several blurred, blended or masked shapes stacked in one place. Describe the look in one
     sentence ("a soft glow behind the active tab"), then rebuild that look the way code does it (a gradient layer, a
     mask, a blend). Don't copy the layers one by one; map each to the one piece of code that draws it.
   - **Borders that aren't strokes:** check effects before assuming a border. Figma's glass draws a lit rim with no
     stroke on any layer.
   - **One mode only:** if the design exists only in dark (or only in light), ask whether this piece stays dark in both
     modes (wrap it in the `dark` class, so its tokens resolve to the dark values) or gets a light version someone will
     design. Don't invent a pale version nobody drew.
   - **One screen width only:** if the design is drawn for one width, ask what happens on bigger screens. Without an
     answer, keep the drawn width as a centred column.
5. **Account.** From `--layers`, write the map: every layer to a selector or a reason. A layer the design doesn't have
   must not appear in the markup; a state Figma never drew (a hover) isn't invented. Put it in open questions instead.
6. **Build**, by the rules in `CLAUDE.md`, which win over anything in the Figma layer tree:
   - load `base-ui` for anything interactive; pick the tier; every string through props;
   - token classes only. A value with no token: snap to the nearest and record the snap in `FIGMA.md`, or add a token
     through `configuring-tailwind`. Never an arbitrary value;
   - an effect that needs several properties together (glass, a glow, a masked rim) becomes one `@utility` in
     `src/theme/effects.css`, with a one-line comment naming the Figma effect it rebuilds. The glass recipe is in
     `figma-check`'s `reference.md`;
   - axes become props by the table in `figma-check`; states become `hover:` and data attributes;
   - only controls get a `size` ladder, read off the set and recorded under "Measured size steps";
   - a story for each variant and state, with a play function for each interaction;
   - before touching shared styling (`src/theme/*`, `*Variants.ts`), follow the visual-checkpoint rule in `CLAUDE.md`.
7. **Look again.** `pnpm figma:compare <story-id>` in light and dark. Check the picture against your sentence from step 3:
   is the treatment there, or only the shape? Look hardest at the brightest areas of the difference picture: an effect
   that was skipped or faked shows up there first, even when every box measures right.
8. **Check.** `pnpm figma:audit <slug>`. Steps 6 to 8 repeat until the table is clean. Then `pnpm test`, `pnpm lint`,
   `pnpm typecheck`.
9. **Report.** Paste the table and the picture. Update the row in `FIGMA.md`: status, snaps, deviations taken for
   accessibility (the one place code may knowingly differ, always recorded), warnings resolved. If `claude-design` is
   installed, run `pnpm design:build` so the canvas gets the new component. Only now is the status `done`.

## When the design changes

Don't port again from scratch, and don't eyeball what moved.

1. Run the extractor into a temporary file (`packages/ui/.figma/<slug>.new.json`).
2. Compare it with the saved snapshot (`diff <(jq -S . old) <(jq -S . new)`, or a short `node -e`). That difference is
   the whole work list.
3. Make those changes, then run steps 7 to 9.
4. Replace the saved snapshot, so the next comparison starts from here.

## When you're blocked

If the bridge is down and can't be started, a node id finds nothing, or the story can't be rendered: mark the row
`blocked` in `FIGMA.md` with one line saying why, tell the person what you need, and stop. A port that quietly skipped a
rule looks done; one that stopped honestly doesn't.

## Definition of done

- [ ] Snapshot saved and listed with `--layers`
- [ ] One sentence on the treatment; Figma picture saved
- [ ] The intent written down: motion, faked effects, rims, modes, wider screens
- [ ] Map: every layer mapped, or a reason naming a real limit
- [ ] Every visible effect built
- [ ] Every warning handled or written down
- [ ] Every image exported and used; no stand-ins
- [ ] Picture checked in light and dark
- [ ] `pnpm figma:audit <slug>` clean for every variant and state built
- [ ] Stories, a11y, `pnpm test`, lint and types pass
- [ ] Table and picture pasted; `FIGMA.md` row updated
