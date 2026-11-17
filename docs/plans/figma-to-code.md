# Plan: Figma to code

Status: agreed in outline, not built · Nov 2026

Decided so far:

- Three add-ons: `figma-check` (shared), `figma-to-code`, and `code-to-figma` moved onto the shared check.
- Screens are part of the plan, in both directions.
- Screen sizes are a core project setting (`project.json`), not part of a Figma add-on.
- Names: `figma-check`, `figma-to-code`, `pnpm figma:audit`, `pnpm figma:compare`, tracker `packages/ui/FIGMA.md`.
- Test against a large, real client design file, so the big-file rules below get exercised from day one.

## Why

The starter already sends components from code into Figma (`code-to-figma`). Nothing goes the other way, and that is
where designers spend most of their day: a component or screen is drawn in Figma, and someone rebuilds it in code by
eye. Small differences (a 32px button against a 36px design, a missing border, title and date swapped) slip through,
because "I checked" can't be checked.

A tested way to do this already exists from an earlier client project: a porting skill, a Figma extractor, a parity
check and a side-by-side picture tool. This plan brings them into the starter, cleans them up, and makes them fit
with everything else the starter does.

## What a designer gets

1. Paste a Figma link to a component. Claude reads the design (sizes, colours, tokens, text styles, every layer and
   every variant), builds it from our tokens and Base UI, and writes its story.
2. Claude proves it matches: a side-by-side picture (Figma | code | differences) in light and dark, and a parity
   table where every Figma layer is either matched or skipped with a written reason.
3. When the design changes, Claude compares the new Figma snapshot with the saved one and fixes only what moved.
4. Paste a link to a whole screen. Claude builds it from our components as an app page, a template or a prototype
   screen, at the project's screen sizes, and checks it.
5. Later: a nightly "has Figma drifted?" check, and Figma comments into the notebook.

## How it's packaged

Three pieces, so each direction only brings what it needs and the two share one way of checking:

| Add-on                | Brings                                                                                                | Needs         |
| --------------------- | ----------------------------------------------------------------------------------------------------- | ------------- |
| `figma-check` (new)   | The extractor, the parity check, the side-by-side picture, Figma lore (traps, quirks), `figma.json`   | —             |
| `figma-to-code` (new) | The porting skill and the component tracker (`packages/ui/FIGMA.md`)                                  | `figma-check` |
| `code-to-figma` (1.1) | Today's skill, now checking its Figma output with the same parity check instead of a throwaway script | `figma-check` |

One way of checking means a "match" means the same thing in both directions, and a fix to the checker helps both.

### Files

```
.claude/skills/figma-to-code/SKILL.md        the runbook (from the porting skill, neutral examples)
.claude/skills/figma-check/reference.md      traps, quirks, messy-file policy (shared lore)
.claude/skills/figma-check/extract.js        pasted into the Desktop Bridge; one run, one snapshot
packages/ui/scripts/figma/audit.mjs          parity check
packages/ui/scripts/figma/compare.mjs        side-by-side picture
packages/ui/figma/specs/<slug>.json          saved Figma snapshots (slimmed), committed
packages/ui/figma/specs/<slug>.map.json      which page element each Figma layer is
packages/ui/FIGMA.md                         tracker: status, measured size steps, skipped, decisions
figma.json                                   the project's Figma facts (file, direction, token names)
```

Commands: `pnpm figma:audit <slug> [--mode dark]` and `pnpm figma:compare <story-id> [--mode dark]`.

### `figma.json`: one place for the project's Figma facts

Today `code-to-figma` keeps the Figma file link in a per-person file, so a teammate can't see it. Both directions
need the same facts, so they move to one committed file:

- **files**: the client's design file (read from) and our library file (written to by `code-to-figma`).
- **direction**: `figma-first` (Figma is the source, e.g. a client design system) or `code-first` (code is the
  source, Figma mirrors it). A component can override it in the tracker.
- **tokens**: how Figma variable names map onto our CSS tokens (`Content/Primary` → `--foreground`). This replaces
  the client names that were hard-coded in the old parity check. It's written when the palette is set from Figma
  during engagement setup, and the parity check uses it to compare colours by token.

Rule that keeps the two directions from fighting: Claude never writes into the client's design file, and never ports
from our own library file. A `code-first` component isn't ported from Figma; a `figma-first` one isn't overwritten in
the library without saying so.

## Fixes on the way in

The parity check:

1. **Check layer order.** It promises to and doesn't; wrong order (title above date) currently passes.
2. **Check text weight by the named text style,** not the number Figma reports (unreliable when the font is missing).
3. **Check what the extractor already reads but the check ignores:** line height, letter spacing, opacity, shadows,
   gradients, borders on every side, each corner's rounding.
4. **Fix the "black token not found" bug** (a token that is truly black falls through to the raw colour).
5. **Use the starter's way of opening a story:** the `theme` global (Light / Dark), wait for the play function and
   fonts, turn off motion — the same as visual checkpoints, through one small shared helper, so both tools see the
   same page. Works against the running Storybook, or builds one when none is running.
6. **Token names come from `figma.json`,** not code.

The snapshots:

7. **Slim them.** Today one button is 550 KB because every variant stores its whole layer tree. Store the base
   variant in full and the others as their differences only (the extractor already computes them). Target: under
   50 KB for a large component set.

The side-by-side picture:

8. **Take the Figma image through the Desktop Bridge** (real fonts), straight into the project, instead of a
   download link that drops fonts.
9. **Share the picture-making parts with visual checkpoints** (contact sheet, transparency flattening, settling).

The skill:

10. **Neutral examples.** Every lesson stays; client names, products and fonts go. A test fails if a client name
    appears anywhere in the catalog.
11. **The tracker starts as a short template:** status table, measured size steps, deliberately skipped, open
    questions. Long write-ups go in the component's story docs or the project notebook.

## How Figma properties map to our props

Both directions need the same translation, so it lives once in `figma-check/reference.md` and follows the prop names
in `CLAUDE.md`:

| In Figma                                       | In our code                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| A style axis (`Style = Primary / Ghost`)       | `variant`                                                             |
| A size axis (`Size = S / M / L`)               | `size`, on controls only; anywhere else the component fills its space |
| A state axis (`State = Hover / Pressed`)       | No prop: CSS `hover:` and Base UI data attributes                     |
| A true/false property (`Disabled`)             | `disabled`, `checked`, `open` and the other standard names            |
| A text property (`Label`)                      | A required string prop (`label`, `…Label`) or `children`              |
| A swappable icon (instance swap)               | An `icon` prop that takes a Lucide icon                               |
| A slot (free content)                          | `children`, or `render` when the element itself changes               |
| A slot that repeats (rows, items)              | `children` holding the repeated part                                  |
| Nothing in Figma (`onClick`, `className`, ref) | Stays in code only                                                    |

A Figma axis that packs two ideas into one (`Primary Small`) is split into `variant` and `size`. Layout helpers
(`Stack`, `Grid`, `Center`) have no Figma version and are skipped in both directions. `code-to-figma` uses Figma's
real slot feature, never a frame named "Slot".

## Safety rules for writing to Figma

These apply whenever Claude changes a Figma file (`code-to-figma` now, the drift check later):

1. **Save a restore point first.** Before any change, save a named version in the file's version history. If that
   fails, change nothing and report the plan only.
2. **Never publish the library.** Claude makes the changes; a person reviews them in Figma's publish dialog and
   publishes, or restores the saved version.
3. **Keep designers' hand edits.** Code adds something and a designer tweaked something else: do both. Code removed
   what a designer changed: code wins, and the clash is reported. Both changed the same value: skip it and ask.
4. **Read Figma comments, never resolve them.** A question gets an answer from the code. A missing piece the code
   already has gets fixed and cites the comment. A request for something the code doesn't have goes to a person.
5. **Without a Figma connection,** still make and report the plan, and don't mark the work as done, so the next
   run picks it up.
6. **The first run only records where things stand,** so it doesn't treat the whole library as new.

## Whole screens

Components are the bricks; most of a designer's Figma work is screens. A screen is ported differently from a
component, because it should bring almost no new styling: it is our components, arranged.

### Figma screen → code

Three rules come before any step, because they are where AI ports of screens usually go wrong:

1. **Figma is the intent, not the blueprint.** A designer draws what the screen should look like, not how it is
   built. Claude reads the frame for what it means (a header, a list of cards, a sticky button), then builds it the
   way an engineer would. It never copies the layer tree: twelve nested frames in Figma are often one `Stack` in
   code, and a "Group 48" of loose rectangles is often a `Card`.
2. **Responsive by default.** Designers usually draw one phone size (390 or 375 wide). The code has to work on
   every phone, from 320 to about 480 wide, without anyone drawing those. A width in the frame is a hint, not a
   rule: things fill their space, text wraps, and nothing gets a fixed width or height unless it really is fixed
   (an icon, an avatar, a control's height).
3. **Know what the file gives us before building.** Some files have tokens, styles and tidy auto-layout; some are a
   pile of loose layers with typed-in colours. Claude checks first and, for a messy file, asks the person how much
   care the port deserves (see step 1).

Where it lands is the first question Claude asks, because the rules differ:

| Destination                                  | Rules that apply                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| A page in the app (`apps/frontend`)          | Full: library components only, tokens only, 8px grid, the project's screen sizes           |
| A new template (`packages/ui/src/templates`) | Full, plus a Desktop, Tablet and Phone story, and strings through props                    |
| A prototype screen (`explorations/<name>/`)  | Light: our components where they fit, anything goes where they don't; one `#id` per screen |

The runbook (`figma-to-code/screens.md`):

1. **Check the file's health.** One quick read of the frame counts how much of it is tidy: colours and type tied to
   variables or styles, instances of library components (not detached copies), frames with auto-layout, and
   layers with real names. The result is one line, for example "colours 12% on tokens, no text styles, 3 of 40
   frames use auto-layout, 9 detached buttons".
   - **Tidy file:** carry on.
   - **Messy file, or no tokens at all:** Claude says so in plain words and asks one question: _"This file has no
     tokens or styles set up. Do you want to set them up properly first (slower, and the result can grow into the
     real product), or is this a quick and dirty prototype where speed matters?"_
     - **Set it up:** Claude proposes a token map from the colours, type and spacing the file actually uses
       (grouped, so ten near-identical greys become one), the person confirms it, and it goes in through
       `configuring-tailwind` and `figma.json` before any screen is built.
     - **Quick and dirty:** Claude uses the starter's existing tokens, snapping every value to the nearest one
       without asking about each, and builds as a prototype screen. It notes in the report what it snapped, so the
       choice can be revisited.
   - The answer is saved in `figma.json` (`"care": "system"` or `"quick"`), so it is asked once per project, not
     once per screen.
   - **Survey the screens for the grid the designer used.** Designers rarely set up a layout grid in Figma, but
     most follow one by habit. So, also once per project, Claude measures 3–5 typical screens (or every screen in
     a short flow) and counts what repeats:
     - **Page edges:** the side margins, the gap between things placed side by side, and how many columns things
       line up in. On a phone this is mostly one column, so the side margins matter most.
     - **Spacing steps:** the gaps that keep coming back (say 8, 12, 16 and 24).

     It reports what it found with how often, for example _"side margin 20 on 11 of 12 screens; gaps 8, 12, 16,
     24; cards two per row with a 12 gap"_, and the person confirms or corrects it. Screens that break the
     pattern are named, and Claude asks whether each is on purpose (a full-width photo) or a slip, instead of
     copying it. Values that fall between our 8px steps (a 20 margin) are snapped or become a proper value,
     following the tokens-or-speed answer above. If the file does have layout grids, Claude still checks the
     screens actually follow them. The confirmed result is saved in `figma.json` (`grid`: margins, gutter,
     columns, spacing steps), and every later screen is built and checked against it.
2. **Read the intent.** Claude names the screen's parts the way an engineer would plan them, before writing any
   code: the regions (top bar, content, bottom bar), what scrolls and what stays put, what repeats (a list of five
   cards is one card and a list of data, not five copies), what is a library component, and what is truly new. It
   also notes what a still frame can't show: what happens with a long name, an empty list, or one more item.
3. **Find each piece in our library.** Every Figma instance gets a match: by the link Code Connect records, else by
   name, else by look (a detached copy of a button is still a button), else by asking. The result is a short list:
   matched, needs porting first, or one-off markup.
4. **Missing components come first.** Anything reusable that isn't in the library goes through the component runbook
   before the screen is built. A screen never hides a new component inside itself.
5. **Start from a template** when one fits (`CLAUDE.md` already says so), else from `Layout`.
6. **Lay it out from the intent, using the translation table below.** With `Stack`, `Grid` and `Layout`, gaps
   snapped to the 8px grid. The structure comes from step 2's plan, not from Figma's nesting: a frame that only
   wraps one thing disappears, frames that exist only to nudge something into place disappear, and loose layers
   placed by hand become a row or column read from where they sit.
7. **The project's sizes, no more.** Each size in `project.json` (see below) is built and checked. If Figma has a
   frame for it, that frame is the reference; if not, Claude builds it from the template's rules and says it has
   no design.
8. **Copy and images.** In an app page or prototype the Figma text is used as written. In a template it becomes story
   content. Images come out of Figma at their real size and go next to the page or prototype that uses them.
9. **Check it.** Three checks, lightest first:
   - **Pieces:** the list from step 3 against what rendered. A Figma button that became a `div` fails.
   - **Regions:** each region's position and size against the frame, within the 8px grid. Not every layer; a
     screen's inner details are the components' job, and those were checked when they were ported.
   - **Picture and a score:** the side-by-side picture at each size, plus an AI review that scores layout,
     hierarchy, spacing, components and colour against the Figma frame, and names the biggest differences. Pixel
     differences alone mean little on a screen full of real text.

   The phone check runs at three widths, not one: 320 (small phones), the frame's own width, and 430 (large
   phones). Nothing may spill sideways, overlap or get cut off at any of them. Numbers decide pass or fail; the
   pictures are the evidence, because a picture that "looks right" at thumbnail size can still be wrong.

10. **Sort every difference before fixing it.** Each one is a rule we got wrong (fix the runbook), a fact we didn't
    read from Figma (fix the extractor), a judgement call (ask, then record it in `FIGMA.md`), or a mistake in the
    design itself (tell the designer, don't copy it). Then fix at that level and check again, until every
    remaining difference is named and accepted.

A prototype made from several Figma frames gets one screen per frame, in the frames' order, with the frame name as
the screen title in `prototype.json`. Figma prototype links between frames become `go(id)` calls.

#### Translating Figma layout into code

Auto-layout and CSS layout are close cousins, so a tidy frame translates almost directly. The table is how Claude
reads each setting. It is a reading guide, not a copy machine: step 2's plan still decides the structure.

| In Figma                                    | In code                                                                   | Watch out for                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Auto-layout vertical / horizontal           | `Stack` with `direction` column / row                                     | A horizontal row of cards on a phone often needs to become a column, or a `Grid` that reflows, on narrow screens.    |
| Wrap (horizontal only)                      | `Grid` that reflows, or a wrapping `Stack`                                | Pick `Grid` when items should line up in columns, wrap when they are pills or tags.                                  |
| Gap (item spacing)                          | `gap` on the `Stack` or `Grid`, snapped to the 8px grid                   | "Space between" with no gap usually means "push the last item to the end", not equal spacing.                        |
| Padding                                     | Padding on the region, snapped to the 8px grid                            | Big outer padding on the frame is usually the page margin, which `Layout` already owns.                              |
| Align (main and cross axis)                 | `justify` and `align` on the `Stack`                                      | Centred in Figma because it happened to fit isn't the same as centred on purpose; check with a longer text.          |
| Fill container                              | The element stretches (full width, or grows to take the leftover space)   | This is the normal case for blocks of content, and the safe default for anything that spans its parent.              |
| Hug contents                                | The element keeps its natural size                                        | Buttons, badges, tags and other small controls keep hugging, even if they happen to span the frame.                  |
| Fixed width or height                       | Only for things that really are fixed: icons, avatars, a control's height | A fixed 390 or 358 is the phone frame showing through. It becomes "fill", maybe with a maximum width.                |
| Min / max width                             | A max width on the region (read lines, cards in a wide grid)              | These are rare in phone designs and often missing. Wider screens usually need one anyway.                            |
| Absolute position inside auto-layout        | An overlay: a badge on an avatar, a floating button, a background shape   | Only true overlays stay on top of the flow. Anything else that was placed by hand goes back into the flow.           |
| No auto-layout (frames or groups by hand)   | Read rows and columns from where things sit, then use `Stack` and `Grid`  | Never copy x and y positions into code. Equal gaps between items reveal a list; a shared left edge reveals a column. |
| Constraints (left and right, scale, centre) | Stretch with the screen, or stay centred                                  | A frame with "left and right" constraints is telling us it should fill.                                              |
| A fixed screen height (844, 812)            | No height at all: the page grows with its content and scrolls             | Only full-screen layouts (a map, a camera) take the screen's height, and they use the dynamic viewport units.        |
| Text "auto height" or a fixed-size text box | Text that wraps freely, with no fixed width or height                     | A text box sized to fit one line in Figma will hold a longer translation in code.                                    |

Three more habits, all from the same idea that heights and widths belong to the content:

- **Heights are never fixed** on regions, cards or text. A frame's height in Figma is what that sample content
  happened to need.
- **In a grid, the grid owns the width.** Each item fills its column; the grid decides how many columns fit.
- **Phone safe areas and the keyboard** (the notch, the home bar, a keyboard pushing a bottom button up) are
  handled by the layout, even though Figma rarely draws them.

**Wider than the frame.** If the project has tablet or desktop sizes and Figma only has a phone frame, Claude
doesn't stretch the phone layout across a laptop. It uses the template's rules: content gets a sensible maximum
width and is centred, lists become grids, and side panels appear where the template has them. It says plainly that
these sizes have no design.

### Which screen sizes a project has

Not every product has all three. Some apps are phone only; some tools are desktop only. Building and checking a
desktop layout nobody asked for is wasted work, and a missing tablet frame isn't always a gap.

So the sizes become a project setting, `screens` in a small committed `project.json` at the root
(`["phone"]`, `["phone", "tablet", "desktop"]`, …). Claude finds the answer in this order:

1. **The setting,** if it's there. Done.
2. **The project notebook,** if this computer has one: Claude looks in `brief.md` and `decisions.md` for the
   platform (an iOS app, a web dashboard) and suggests an answer, naming the decision (D-012). The person confirms
   it. Only the setting goes into the repo, never the notebook's words.
3. **Ask,** once, then save the answer.

Engagement setup asks this question up front, so most projects never hit step 2 or 3.

It is wider than Figma, so it lives in the core starter, not in a Figma add-on, and the rest of the starter reads it
too:

- **Screens from Figma** build and check only the project's sizes. A Figma frame for a size the project doesn't have
  is mentioned, not built.
- **Templates:** Storybook still shows all three stories (the library is shared), but a page copied into the app is
  checked at the project's sizes only.
- **Visual checkpoints:** `pnpm look:compare` photographs templates at the project's sizes only.
- **Prototypes:** a new prototype's `device` starts from the setting (`phone` for a phone-only project).
- **`CLAUDE.md`:** "Check a page at all three sizes" becomes "at every size in `project.json`".

With no setting and no answer yet, everything behaves as it does today (all three sizes).

### Code screen → Figma

The other way, for handing work back to designers, or putting a prototype into a Figma review. Two levels:

- **A picture of the page,** layer by layer, from the running page through the official Figma connection. Quick,
  good for review, but its layers aren't our components.
- **Rebuilt from library components,** through `code-to-figma`: each part of the screen becomes an instance of the
  matching Figma library component with the same property values, laid out with auto-layout. Slower, but a designer
  can keep working on it.

Both write to a page in our own file, never the client's, under the safety rules above.

## How it fits the rest of the starter

| Part of the starter     | How porting works with it                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token contract (ADR 3)  | Claude builds with token classes only. A Figma value with no token: snap to the nearest and record it, or add a token through `configuring-tailwind`. Never an arbitrary value.                   |
| Tiers, Base UI, strings | The runbook's BUILD step loads `base-ui`, puts the component in the right tier, takes every string through props. Figma's layer tree never decides the markup.                                    |
| Size props (ADR 5)      | Only controls get a size ladder, read off the Figma set and recorded in the tracker. Anything else fills its container.                                                                           |
| Modes (ADR 6)           | Light and dark come from the tokens; the check runs both modes.                                                                                                                                   |
| Stories as tests        | Every ported variant and state gets a story (with a play function if it's interactive); the map points at those stories. Done also means `pnpm test` and a11y pass.                               |
| Artwork                 | Library components take images through props. Sample images for stories sit beside the story and are imported, so Storybook needs no new folders.                                                 |
| Visual checkpoints      | Shares the story helper. Porting that touches shared styling still follows the visual-checkpoint rule in `CLAUDE.md`.                                                                             |
| `review-component`      | Its checklist gains one line when `figma-to-code` is installed: a ported component has a clean parity table.                                                                                      |
| Templates, explorations | See "Whole screens": templates and app pages follow the full rules, prototype screens the light ones.                                                                                             |
| Claude Design           | If installed, a ported component ends with `pnpm design:build` so the design system on Claude's canvas picks it up.                                                                               |
| Project notebook        | Before porting, check `decisions.md` for decisions about the component (e.g. "system keyboard, not custom"). Decisions made while porting go in the tracker; client decisions go in the notebook. |
| Engagement setup        | The Figma question moves up: is Figma the source or a mirror? It writes `figma.json`, sets the palette and token map from Figma, and adds `figma-to-code` and/or `code-to-figma`.                 |
| Add-on system           | `pnpm addon check` must pass the remove-and-re-add test. `CLAUDE.md` blocks and `package.json` scripts go in the order that test produces (learned the hard way on the last two add-ons).         |

## What has to be true before we call it done

1. **On its own:** `pnpm addon add figma-to-code` in a fresh copy brings `figma-check`; `pnpm addon check`, lint,
   types, prettier and `test:addons` pass; remove leaves nothing behind.
2. **The check works without Figma:** a small hand-written snapshot for the starter's `Button` runs through
   `figma:audit` in a test — one clean run, and one with a deliberate mistake per check (size, padding, colour,
   weight, order, missing layer), each caught.
3. **A real port:** one component ported from a real Figma file end to end, both modes, with the table and picture.
4. **A design change:** change one value in that Figma component, and the snapshot comparison names exactly that
   value.
5. **Both directions:** `code-to-figma` verifies a component it built with the shared check.
6. **A real screen:** one Figma screen built as a prototype screen and as an app page, with the pieces list, the
   region check and the scored picture at the project's sizes; and a phone-only project where no desktop version is built or checked.
   The phone screen passes at 320, the frame's width and 430, and its code has no fixed widths or heights copied
   from the frame.
7. **A messy file:** a screen from a file with no tokens and little auto-layout. Claude reports its health in one
   line, asks the tokens-or-speed question once, saves the answer in `figma.json`, and builds a sensible structure
   rather than the file's layer tree. The screen survey finds the file's side margin and spacing steps, names the
   screen that breaks them, and saves the confirmed grid in `figma.json`.
8. **No client names** anywhere in the catalog (tested).

## Phases

1. **`figma-check` + `figma-to-code` for components.** Commit on `stack/22`.
2. **Built, not yet tried on a real file** (`stack/26`, `stack/27`): **Screen sizes per project** (`project.json`, engagement setup, look:compare, prototypes, `CLAUDE.md`), then
   **screens from Figma:** app pages, templates and prototype screens, with the file health check, the
   tokens-or-speed question, the layout translation table and the three checks. Folded in from the first test run:
   copy for templates, a fonts folder, colour conversion for pasted values, text trim on existing components, a
   smaller picture report, wider screens with no design, and sample data for stories.
3. **`code-to-figma` 1.1** on the shared check and `figma.json`. Engagement setup asks the new Figma question.
4. **Screens back to Figma,** as a picture first, then rebuilt from library components.
5. **Later, one at a time:** a library sync that runs when we tag a release (not on every change) and follows the
   safety rules above; Code Connect through the official Figma
   connection (so Figma knows which coded component each Figma component is), nightly drift check (re-extract,
   compare snapshots, report), Figma comments into the project notebook.

## Limits

- The extractor needs Figma Desktop open with the Desktop Bridge plugin. The official Figma connection can't run it;
  it's used later for Code Connect and quick screenshots.
- Each Figma call is capped at a few seconds, so Claude always targets one node, never a whole page.
- **Big files.** Claude never reads a whole file. It works from a link to one frame or component (the `node-id` in
  the link), finds others by name search, and reads the file's library list and variables once, saving the token
  map in `figma.json`. Snapshots and pictures are per component or per screen, so file size doesn't matter after
  that.
- Text renders in a substitute font until the project's real font files are installed; the check then skips text
  width but still checks height, size and style.
