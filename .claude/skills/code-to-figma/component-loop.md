# The component loop

The process for translating one ledger row — a component file or a foundations phase — into the Figma library. Read
`figma-gotchas.md` before the first `figma_execute` of a session; every entry there was learned the hard way.

Writes go only to `figma.json` `files.library`, after a restore point (`SKILL.md` preflight, steps 2 and 3). An
unattended loop that finds a different file open, or can't save the restore point, stops and says so.

## Philosophy

**Code is the source of truth. Figma is a curated translation, not a render dump.** Screenshot-to-layers tools flatten the
DOM; this process does the opposite — rebuild each component natively so a designer gets real variants, real component
properties, and variable-driven modes. Fidelity comes from measuring the rendered DOM, never from eyeballing.

**Modes are variable modes, never duplicated variants.** One semantic variable set (the library's tokens: `background`,
`foreground`, `surface`, `muted`, `border`, …); each Mode from `palette.css` (light and dark, unless the engagement changed
them) is a Figma mode overriding values on those same variables. Never per-mode variables, never per-mode component
variants — a designer switches a whole frame by flipping its mode.

**One row at a time, verified before the next.** Tokens → foundations → atoms → molecules → organisms;
leaf-first within a tier. Build one, verify it, record it, then move on. Never batch-build a tier speculatively.

**Curate ruthlessly — only build what earns a place.** Before building, audit: does it have Stories? Does it have consumers?
Three categories do not belong in Figma (don't mistake them for gaps):

1. **Dev-only, no pixels of its own** — hooks, context providers, layout-mechanics wrappers. Drawing these *invents* a
   component that doesn't exist visually.
2. **Spec, not surface** — real design values applied to runtime-generated output (chart grid strokes, axis label styles).
   Record them on a spec board; don't draw fake charts.
3. **Belongs one tier up** — if a designer never places the component directly because the product only ever uses a
   composition of it, build the composition instead.

Zero-consumer components get excluded with a written rationale in the ledger, revisitable later.

## Ground truth — every session

1. `git fetch`; check how far the code has moved since each target row's synced SHA
   (`git log <sha>..HEAD -- packages/ui/src/components/ packages/ui/src/theme/`). Notes and memory go stale; the live Figma
   file and the checkout are the only truth. Re-inventory the Figma file by walking `figma.root.children` before trusting
   any prior state.
2. Pull `http://localhost:6006/index.json` — the Story census: titles, story ids, autodocs pages.
3. Confirm the Desktop Bridge is connected (`figma_get_status` with probe) and pointed at the right file **before any
   destructive operation**.

## Tokens & foundations (the phase rows)

- Variables come from `packages/ui/design.tokens.json`, which `pnpm tokens` generates from `packages/ui/src/theme/`
  (never edit it; a unit test fails when it's behind the CSS). Load it with `figma_import_tokens`: first with
  `dryRun: true`, show the plan, then apply with the default `strategy: "merge"`. Never `replace`, which deletes
  variables a designer added. Each top-level group is a collection: **Color** (Light, Dark), **Typography** (Phone,
  Tablet and desktop: the two biggest headings step down on phones), **Motion** (Default, Reduced motion), **Radius**,
  **Spacing**, **Breakpoint**. Re-run the same import after a token changes; it only sends what changed.
- Text styles have no tool: build them with `figma_execute`, one per `type-body-*` / `type-heading-*` composite, named
  identically, with family, size and weight bound to Typography variables so a mode flip re-types everything. Tracking
  is in `em` in code and Figma variables can't hold `em`: set it on the style as a percentage (`-0.02em` is `-2%`), not
  bound.
- Derived alpha values (Tailwind's `/80`, `/30` modifiers) can't ride opacity-on-bound-variable — create explicit `alpha/*`
  variables. Tailwind's `/80` **multiplies the token's existing alpha**; measure the computed value, don't assume.
- Icons: one master component per glyph, fills bound to `foreground`, laid out as one flat alphabetical grid — no
  sub-taxonomy on a showcase page.
- Chrome that can't ride variable modes (textures, grain, glows) ships as **paired paint + effect styles** applied as
  instance overrides on mode-pinned preview cells — mirroring code that gates such chrome behind a selector rather than a
  prop.

## Per component

### 1. Read the code, not the docs

Open `Component.tsx` + `Component.stories.tsx`. The Stories define what exists; the props (and any cva variants) define the API. A capability
with no Story and no consumer is documented in the component description, not drawn.

### 2. Measure the rendered truth

Write a throwaway Playwright script (scratchpad; `playwright` is a direct dependency of `@repo/ui`, so run it with
`pnpm --filter @repo/ui exec node <script>`). For each story, load the **bare story, not docs**:
`http://localhost:6006/iframe.html?id=<story-id>&viewMode=story`, then walk the rendered tree and read
`getComputedStyle` on each node, and save a reference screenshot. This
catches what eyes can't: fixed heights that should hug, wrong gap tokens, an alpha baked into a color, `hover`-only styles.
Record exact px values before authoring anything.

### 3. Translate the API

| Code | Figma |
| --- | --- |
| Union prop (`variant`, `size`) | Variant axis (cva `defaultVariants` = default variant) |
| Boolean that shows/hides | Boolean prop bound to layer visibility |
| Boolean that heavily restyles | Variant axis |
| String prop | Text prop, defaulted from the story fixture |
| ReactNode / icon slot | Instance-swap prop |
| Discriminated union pair | Linked boolean + text |
| Behavioral/data prop | Component description only |

- **Mirror the code API verbatim** — prop names, union values, defaults, camelCase kept.
- Prop-driven states only. No hover/focus/pressed variants (document any exception and flag it for veto).
- Sub-part exports (`CardHeader`, `DialogContent`) are their own Figma components; compositions nest real instances — use
  "expose nested instance properties", since parent props can't bind inside nested instances.
- Don't invent states with no fixed rendering (e.g. a `responsive` orientation) — describe them instead.

### 4. Build the page

One page per row (`↪ Name`), two boards stacked at x=0, 80px apart. This layout is the default — an engagement that records
a different one in its ledger's facts wins:

- **Preview board** (named after the component): board `#0B0B0B`, pad 32, gap 20 → title (18 Medium) → ≤640px plain-language
  description (11 Regular, muted) → inset `#161616` panel, pad 20 → a `.head` row naming the mode columns → one `.row-*` per
  configuration: a 150px `.meta` (name + one-line sub), then one cell per Mode, each cell pinned with
  `setExplicitVariableModeForCollection` for Color/Radius/Typography. Rows = configurations, columns = Modes.
- **Variants/Parts board**: the master component set(s) inside a panel.
- **Canvas copy rule**: visible text must read like real product content, never meta text ("open slot in code"). Pull copy
  from the story fixtures — Stories already hold example strings because components require every string via props.

### 5. Verify with a screenshot, then measure again

Screenshot the page after every build step (an undo in Figma Desktop can silently revert an entire scripted build —
re-verify page children after every execute). Diff the built node tree against the step-2 measurements. Fix, re-screenshot.

### 6. Write the description (guidance-first)

Plain-language purpose → when to use / what not to do → any un-modelled capabilities → a trailing technical block:
`BUILD NOTES — <the tailwind/measured spec> Source: <path/to/component.tsx>`. The first line is what Figma surfaces in the
assets panel — a designer must be able to read it.

### 7. Record the outcome

Update the row in `.claude/code-to-figma.local.md`: synced SHA, date, notes, and new gaps/exclusions.

- **Interactive walkthrough**: show the result and ask for sign-off. Yes → `signed off`. No → notes on what's wrong,
  status `todo`.
- **Unattended loop iteration**: status `built, pending review` — never sign off your own work — then end the iteration.
  One row per iteration, always.

## Working style

- Drive everything through scripted `figma_execute` calls; keep each script one verifiable step.
- Before creating a page, check it doesn't exist. Delete partial artifacts before retrying a failed script.
- "Clean up" an existing page = restyle it to the layout above, not tidy the layer tree.
- The library stays unpublished until the owner says otherwise.
