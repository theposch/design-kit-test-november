# CLAUDE.md

An engagement template for component libraries that designers author directly in code. Storybook is both the workshop and the test runner. Follow the rules below exactly — they encode decisions that are not otherwise visible in the code.

## Commands

```bash
pnpm storybook   # ui workshop at http://localhost:6006
pnpm dev         # demo app (apps/frontend)
pnpm test        # unit tests, script tests + stories (incl. play functions) headless in Chromium, once per mode
pnpm --filter @repo/ui exec vitest run src/components/atoms/Button.stories.tsx   # one file, a few seconds: use while iterating
pnpm typecheck   # tsc --noEmit, all packages
pnpm lint        # eslint, all packages
pnpm build       # storybook build + app build
pnpm template copy <Name>        # copy a page template into the app, imports and all
pnpm palette:convert '#1a1f2e'   # hex or rgb to the oklch() palette.css is written in
pnpm tokens      # write design.tokens.json (the shared DTCG format) from the theme CSS, for Figma and other tools
pnpm guide       # write the "Which component?" table below from each story's usage({ choose })
pnpm starter status   # how far this project's core is behind the starter (`update` brings it up to date)
pnpm format      # prettier --write (owns ALL formatting, .tsx included)
# addon:visual-checkpoints
pnpm look:save     # photograph every story (light + dark) as a visual checkpoint
pnpm look:compare  # photograph again and open a before/after report of what changed
pnpm look:accept   # make the latest photos the new checkpoint (--colour-only: just the colour-only changes)
# /addon:visual-checkpoints
# addon:taste-review
pnpm taste:shots <story|url>  # photograph a screen (light + dark, every project size) for a taste review
# /addon:taste-review
# addon:project-notebook
pnpm notebook      # where this project's notebook is, if this computer has one
# /addon:project-notebook
# addon:figma-check
pnpm figma:snapshot <slug> <file>  # save an extractor run as figma/specs/<slug>.json
pnpm figma:audit <slug>     # check a story against its Figma snapshot, every layer, light and dark
pnpm figma:compare <story>  # Figma picture, code and the differences side by side
pnpm figma:health <slug>   # how tidy a Figma file is (tokens, styles, auto-layout)
pnpm figma:survey <slug>…  # the grid a set of screens follows
pnpm figma:screen <slug>   # a built screen against its frame, at every phone width
# /addon:figma-check
# addon:claude-design
pnpm design:build  # pack the library for Claude Design (then Claude publishes it)
pnpm design:vqa <folder>  # render a Claude Design canvas and check it for visual errors
# /addon:claude-design
```

Scope to one package with `pnpm --filter @repo/ui <script>` / `pnpm --filter frontend <script>`.

## Add-ons

Optional pieces live in the catalog (`add-ons/`) and only come into a project when it needs them (`docs/adr/0009`).

- **Check before building.** Run `pnpm addon list`. If the task needs an add-on that isn't installed (publishing a prototype needs `explorations`, comparing screenshots needs `visual-checkpoints`), say which one and add it: `pnpm addon add <name>`. Take one out with `pnpm addon remove <name>`. `pnpm addon update` brings installed ones up to the starter's latest; merge any `<file>.addon-update` it leaves into the file beside it, then delete it.
- **Add-on text is marked.** Lines between `addon:<name>` markers, in this file and others, belong to that add-on. When you change an add-on's file, make the same change in its catalog copy (`add-ons/<name>/files/…`), or `pnpm addon check` fails.
- **New add-ons** start from a copy of an existing `add-ons/<name>/addon.json`. `pnpm addon check` must pass: it takes every add-on out and puts it back, and expects the project unchanged.

## Starter updates

A project is copied from the starter once; `pnpm starter` brings later improvements to its core (components, lint rules, scripts, this guide) into the project (`docs/adr/0010`).

- `pnpm starter status` shows how many starter commits the project is behind and which files would change. It changes nothing.
- `pnpm starter update` replaces files nobody changed here, merges files changed on both sides, and keeps a file it can't merge, with the starter's version beside it as `<file>.starter-update`. Merge each of those by hand, then delete it.
- Add-ons update separately: run `pnpm addon update` afterwards, then `pnpm install` if packages changed, `pnpm guide` and `pnpm tokens` to rewrite what is generated, then the usual checks.
- Paths the project owns (`starter.json` → `projectOwned`) are never touched. The first run guesses which starter commit the project began from; if the guess looks wrong, pass `--base <commit>`.

## Imports

Inside `packages/ui`, always use the package's `#` subpath imports — never a bundler alias like `@/` and never deep relative paths across directories:

```tsx
import { Button } from '#components/atoms/Button';
import * as Dialog from '#components/atoms/Dialog';
import { cn } from '#lib/utils';
```

Sample pictures and data that only stories use live in `src/fixtures/` and are imported as `#fixtures/<file>`; components never import them.

The library is consumed source-only, so a bundler alias would resolve against the consumer's bundler and break. Two deliberate exceptions: `src/index.ts` (the barrel) uses relative paths, and a consuming app mirrors the `#` aliases in its own tsconfig `paths` — both because TypeScript won't extension-probe the wildcard `imports` targets when a consumer's `tsc` compiles the library source.

## Component tiers (`packages/ui/src/components/`)

- **`atoms/`** — the smallest hand-authored components: native markup, or a single Base UI component wrapped and styled (`Button`, `Dialog`). Must not compose other components from this library. May hold internal UI state; barred from non-UI side effects, app-state access, and business logic.
- **`molecules/`** — reusable compositions of atoms and/or molecules. Same constraints as atoms otherwise.
- **`organisms/`** — complex, distinct interface areas built from the tiers below. May hold app-specific logic and state.

Files are flat, one component per file, with the story co-located: `Button.tsx` + `Button.stories.tsx`. A compound component is still one file and one story — `Dialog.tsx` exports each part as a named function, and the barrel exposes the file as the `Dialog` namespace (`export * as Dialog`). Hooks are not a tier; they live in `src/hooks/` (imported as `#hooks/*`), one per file.

File naming is lint-enforced repo-wide: `.tsx` files are PascalCase (`Button.tsx`, `App.tsx`), `.ts` files camelCase (`useThing.ts`, `utils.ts`); middle extensions (`.stories`, `.test`, `.config`) are ignored, and tool-mandated names (`main.tsx`, Storybook's `preview.tsx`) are exempt.

Hand-authored components take no `size` prop, with one exception: interactive controls (Button, inputs, selects, …) may carry a control-height ladder whose values are per component (`sm`/`md`/`lg` on Button; `xs`/`xl` only where a component earns them). Everything else renders the content it is given and fills its container; layout belongs to the consumer (`docs/adr/0005`).

## Which component?

Reach for an existing component before writing markup. Each story's Docs page carries the full guidance (purpose, when to use, alternatives, do/don't). The table below is written by `pnpm guide` from each story's `usage({ choose })`: change a row there, never here, and give every new component a row (a unit test fails until the table matches).

<!-- which-component -->

| The person needs to…                                    | Use                                   | Not                                             |
| ------------------------------------------------------- | ------------------------------------- | ----------------------------------------------- |
| reveal optional detail in place                         | `Accordion`                           | `Tabs`                                          |
| confirm something irreversible                          | `AlertDialog`                         | `Dialog`, `window.confirm`                      |
| keep a picture or video in a fixed shape                | `AspectRatio`                         | a fixed height, a padding trick                 |
| a text box that suggests matches as you type            | `Autocomplete`                        | `Combobox` (that one picks a value)             |
| show a person or account as a round picture or initials | `Avatar`                              | a rounded `<img>`, `Thumbnail`                  |
| show a short status (Paid, Overdue)                     | `Badge` / `StatusDot`                 | coloured text alone                             |
| explain a problem with the whole form                   | `Banner`                              | a toast, a `Badge`                              |
| show where a page sits in a hierarchy                   | `Breadcrumb`                          | text with slashes                               |
| run an action here                                      | `Button`                              | `LinkButton`, a clickable `div`                 |
| group content on a raised surface                       | `Card`                                | a bordered `div` (card soup)                    |
| put one thing in the middle of an area                  | `Center`                              | a `div` with hand-written flex                  |
| pick several options                                    | `Checkbox`                            | `Switch`, `ToggleGroup`                         |
| tick several options from a short list                  | `CheckboxGroup`                       | loose `Checkbox`es with no group                |
| pick an option that needs a description                 | `ChoiceCard` around a `Radio`         | a `Card` with `onClick`                         |
| tuck one section away under its title                   | `Collapsible`                         | `Accordion` for a single section                |
| search a long list, pick one or several                 | `Combobox`                            | a `Select` with 50 options                      |
| do a short task over the page                           | `Dialog`                              | a new page for a two-field form                 |
| slide a panel in from the side, like a menu on a phone  | `Drawer`                              | a `Dialog` styled to the edge                   |
| fill a space that has no content yet                    | `EmptyState`                          | a blank area, a lone sentence                   |
| label, describe or flag a form control                  | `Field`                               | a bare `<label>`, a placeholder                 |
| name a group of fields (an address)                     | `Fieldset`                            | a heading over loose fields                     |
| drop or browse for files                                | `FileDrop`                            | a bare file input                               |
| lay out a grid that reflows                             | `Grid`                                | breakpoint-by-breakpoint columns                |
| set a heading or a paragraph                            | `Heading` / `Text`                    | a bare `<h2>` with `type-*` classes             |
| show an icon                                            | `Icon` with a Lucide icon             | an inline `<svg>`, an icon font                 |
| type one line of text (a name, an email)                | `Input`                               | `Textarea`, a bare `<input>`                    |
| show a keyboard key or shortcut                         | `Kbd`                                 | `code` or a `Badge`                             |
| frame a whole page                                      | `Layout` (or start from a template)   | a hand-built header/aside/main                  |
| go to another page, styled as a button                  | `LinkButton`                          | `Button` with `onClick` navigation              |
| open an item from a card in a grid                      | `LinkCard`                            | a `Card` wrapped in `<a>`                       |
| show rows of items or label/value facts                 | `List` / `DetailsList`                | a `div` stack, a table for one item             |
| pick an action from a list                              | `Menu`                                | `Select`                                        |
| an app menu bar (File, Edit, View)                      | `Menubar` with `Menu`                 | a row of buttons                                |
| site links with drop-down panels in a top bar           | `NavigationMenu`                      | a `Menu` per link                               |
| type or step a number (seats, quantity)                 | `NumberField`                         | `Input type="number"`                           |
| see controls tied to one button                         | `Popover`                             | `Dialog`, `Tooltip`                             |
| see how far along a task is                             | `Progress`                            | `Spinner` when the length is known              |
| pick one value from a list                              | `Select` (many) / `RadioGroup` (≤ ~6) | `Menu`                                          |
| divide groups of content with a thin line               | `Separator`                           | an `<hr>`; a line where a gap would do          |
| move between the main areas of an app                   | `SideNav`                             | a list of `TextLink`s                           |
| show that something is loading                          | `Skeleton` (shape known) / `Spinner`  | a blank area, a toast                           |
| set a rough number by dragging (volume)                 | `Slider`                              | `NumberField` when the exact number matters     |
| lay things out in a row or column                       | `Stack`                               | a `div` with hand-written flex                  |
| see the steps of a task and where they are              | `Stepper`                             | `Tabs`, a row of numbers                        |
| flip a setting that applies now                         | `Switch`                              | `Checkbox`                                      |
| switch between peer views                               | `Tabs`                                | `Accordion`, `ToggleGroup`                      |
| pick topics or filters as pills                         | `Tag` in a `ToggleGroup`              | `Badge` with `onClick`                          |
| link within running text                                | `TextLink`                            | `LinkButton`                                    |
| type several lines (a comment, a message)               | `Textarea`                            | `Input`                                         |
| show an item as a small square picture                  | `Thumbnail`                           | `Avatar` (that one is for people)               |
| show a date or time                                     | `Timestamp`                           | a date formatted by hand                        |
| build a notification with a custom layout               | `Toast` parts                         | the first choice; try `Toaster`                 |
| press an on/off tool (Bold)                             | `Toggle` / `ToggleGroup`              | `Switch`                                        |
| read a short label on hover or focus                    | `Tooltip`                             | `title=""`, `Popover`                           |
| search and run commands from anywhere (⌘K)              | `CommandPalette`                      | a `Dialog` with a list                          |
| run an action with only an icon                         | `IconButton`                          | `Button` with no label                          |
| hear that something happened                            | `Toaster` + `useToastManager`         | `AlertDialog`; never for form errors            |
| sign in with an email and password                      | `SignInForm`                          | fields and a button wired up again on each page |

<!-- /which-component -->

Lint bans the raw element in apps, molecules and organisms (atoms exist to wrap them): `<button>` → `Button`, `<input>` → `Input` / `Checkbox` / `Radio` / `Switch` / `Slider`, `<textarea>` → `Textarea`, `<select>` → `Select`, `<hr>` → `Separator`, `<progress>` → `Progress`, `<dialog>` → `Dialog`, `<details>` → `Accordion`. A plain `<a>` stays fine for inline text links.

Named anti-patterns, so a review can point at them:

- **Card soup** — wrapping every group in a bordered box. Group with spacing; borders mark real containers.
- **Div button** — a `div` or `span` with `onClick`. It has no keyboard or screen-reader support.
- **Placeholder label** — placeholder text instead of `Field.Label`. It disappears on typing.
- **Dialog stack** — opening a dialog from a dialog. Make the second step part of the first, or a page.
- **Toast for errors** — a toast for something the person must fix. Errors live next to their cause.
- **Prop sprawl** — a new prop for what `className`, `children` or `render` already does. See the admission gate below.

## Adding a prop: the admission gate

A new prop must pass all four, or it doesn't go in:

1. **It can't be done by composition.** `className` (layout and spacing), `children` (content) and `render` (swapping the element) cover most requests.
2. **It is a design decision, not a one-off.** At least two real uses need it, or the design system defines it.
3. **It uses the standard name** from the table below. Base UI's own name wins where one exists.
4. **It ships with its story.** A control in `argTypes` for a variant (the drift test checks the options match), and a play function if it changes behaviour.

| For                        | Name                                       | Not                                      |
| -------------------------- | ------------------------------------------ | ---------------------------------------- |
| visual style               | `variant`                                  | `type`, `kind`, `appearance`, `color`    |
| control height             | `size` (controls only, `docs/adr/0005`)    | `small`, `isLarge`                       |
| open state                 | `open` / `defaultOpen` / `onOpenChange`    | `isOpen`, `visible`, `show`              |
| value                      | `value` / `defaultValue` / `onValueChange` | `onChange` for a non-native value, `val` |
| on/off state               | `pressed` / `checked` + `on…Change`        | `active`, `selected`, `isOn`             |
| disabled                   | `disabled`                                 | `isDisabled`, `inactive`                 |
| a string the library needs | `…Label` (`closeLabel`, `label`), required | an English default, `text`, `title`      |
| content                    | `children`                                 | `content`, `body`, `text`                |
| element swap               | `render`                                   | `as`, `component`, `asChild`             |

Two booleans that fight (`primary` and `ghost`) are one `variant`. A prop no story exercises is a prop nobody tests.

## Layout and page templates

Start a page from a template in `packages/ui/src/templates/` (Storybook → **Templates**). The blank page is always there; the rest come in groups as add-ons: `templates-sign-in`, `-marketing`, `-galleries`, `-forms`, `-settings`, `-commerce`, `-details`, `-content` and `-shells` (app shells). If the page you need is in a group that isn't installed, add the group first. Each template has a Desktop, Tablet and Phone story. Copy the template into the app and change its content; don't build a page frame from scratch.

- **Three screen sizes, named.** Phone is the default (no prefix), `tablet:` starts at 48rem and `desktop:` at 64rem (`src/theme/breakpoints.css`). Tailwind's `sm:`/`md:`/`lg:` are switched off.
- **8px grid for page layout.** In templates and apps, padding, margin and gaps use steps 0, 1, 2, 4, 6, 8, 10, 12, 14 and 16 (4px half-steps are for components only). Lint enforces it; `Stack` and `Grid` only offer those gaps.
- **Layout primitives belong to the consumer** (`docs/adr/0005`): `Stack`, `Grid`, `Center`, `AspectRatio` and `Layout` arrange content; they don't decide a component's own size.
- **Icons** come from `lucide-react`, always through `Icon` (`<Icon icon={Search} label="Search" />`, or no `label` when it sits beside text). Base UI ships no icons.
- **The project's screen sizes** are in `project.json` at the root (`"screens": ["phone"]`, and `sizes` when the designer's frame isn't the default). No file, or no `screens`: all three. Storybook still shows every template at all three, because the library is shared.
- **Check a page at every size in `project.json`** before calling it done: open its Phone story, not just Desktop. A size the project doesn't have isn't built or checked. `pnpm look:compare` photographs templates at the project's sizes only.
- **Copy a template into the app with `pnpm template copy <Name>`**: it rewrites the library imports to `@repo/ui`, copies its pictures, and adds what the app needs.

## Base UI is the behavior layer

Interactive behavior and accessibility — focus management, keyboard handling, ARIA wiring, portals, dismissal — come from `@base-ui/react`; the library adds tokens and markup on top (`docs/adr/0002`). Load the `base-ui` skill before adding or editing a component that wraps Base UI. The rules it enforces:

- Import one component per file: `import { Dialog as BaseDialog } from '@base-ui/react/dialog'`.
- Wrap **every** part, pass-through parts included, exporting each as a named function so the file reads as a module namespace mirroring Base UI's anatomy (`Dialog.Root`, `Dialog.Trigger`, `Dialog.Popup`, …). Never export a namespace object — `react-refresh/only-export-components` rejects it. Consumers never import `@base-ui/react`.
- `className` on a wrapper is a string, never Base UI's state-callback form — `cn()` drops functions silently. Style state with Base UI's data attributes through Tailwind's native variants: `data-open:`, `data-disabled:`, `data-starting-style:`, `data-ending-style:`.
- Transitions are CSS transitions off the motion tokens (`transition-opacity duration-(--motion-duration-normal) ease-default` with `data-starting-style:`/`data-ending-style:` end states). No animation library.
- Compose through the `render` prop: `<Dialog.Trigger render={<Button variant="outline" />}>`. Never render a link as a Button — Base UI enforces button semantics; a link that looks like a button is `LinkButton`, a plain `<a>` sharing Button's recipe (`lib/buttonVariants.ts`) with a `render` prop for router links.
- Base UI's docs ship in the package: `packages/ui/node_modules/@base-ui/react/docs/react/components/<name>.md` (anatomy, data attributes, CSS variables). Read them; do not work from memory.

## Styling — semantic tokens only

Style exclusively with the semantic token classes (`bg-primary`, `text-muted-foreground`, `bg-surface`, `rounded-lg`, `type-body-base`, …). **Never** arbitrary values (`bg-[#1a1f2e]`, `rounded-[3px]`), raw color literals, or one-off font sizes. Type is set only via the composites — `type-body-*` for anything read, `type-label-*` for anything pressed or naming a control, `type-heading-*` for page structure — which own family/size/line height/weight/tracking as one style; standalone weight utilities (`font-medium`), bare size tokens (`text-body-sm`), and Tailwind's default scale (`text-sm`) are all off-contract (`docs/adr/0004`).

### Type rules

- **Three roles.** `type-heading-*` for page structure, `type-body-*` for anything read, `type-label-*` for anything pressed or that names a control or a group of options. `type-strong` is for figures (prices, totals), not headings.
- **Reading text is 16px** (`body-base`). `body-sm` is supporting text (descriptions under a title, hints, metadata), `body-xs` captions and legal. Typed fields are 16px on phones, because iOS Safari zooms into anything smaller.
- **A style owns all five axes**: family, size, line height, weight and tracking. A unit test checks it, and `leading-*` and `tracking-*` are lint-banned. A brand pass changes the variables in `font.css` and `typography.css` (families, the body/label/heading weights, each style's size, leading and tracking), never the call sites.
- **A new type style must pass all four:** (1) no existing style plus `tone` or `type-strong` does the job; (2) two real components or templates need it; (3) it sets all five axes from its own variables; (4) it ships with its specimen row in `Theme/Typography`, the `lib/utils.ts` mirror and `pnpm tokens`.

This is lint-enforced (`docs/adr/0003`): off-contract classes and classes unknown to the compiled theme fail `pnpm lint`. A legitimate exception needs `// eslint-disable-next-line <rule> -- <reason>` — the reason is mandatory (lint rejects bare disables).

If a design needs a value no token provides, add a token:

1. Load the `configuring-tailwind` skill before touching any theme CSS.
2. Add the token to the right partial under `packages/ui/src/theme/` — `palette.css`, `radii.css`, `font.css`, `typography.css`, `motion.css`.
3. A new typography composite must also be mirrored in `lib/utils.ts` (the unit test will fail until it is).
4. Run `pnpm tokens`. `packages/ui/design.tokens.json` is the theme in the shared token format (DTCG) that Figma and other tools read; it's generated, never edited, and a unit test fails until it matches the CSS.

Keyboard focus is drawn only by `focusRing` / `focusRingBordered` / `focusRingWithin` from `#lib/focusRing`; hand-written rings and rings on `focus:` are lint-banned. `hover:` already skips disabled controls, so don't add guards for that. Transitions use the `--motion-duration-*` tokens (a bare `transition-*` defaults to the fast one); raw `duration-200`-style values are lint-banned, because the tokens are what honour `prefers-reduced-motion`. A keyframe animation needs `motion-safe:` (`motion-safe:animate-pulse`), also lint-enforced.

## Modes — components are mode-blind

Light and dark live entirely at the token level: light values on `:root`, dark overrides under the `.dark` class (`docs/adr/0006`). Components never branch on mode — `dark:`, `[.dark_&]:`, `light-dark()` and `prefers-color-scheme` are lint-banned outside `src/theme/`, as are raw color literals (in the app too). If something looks wrong in one mode, fix the token pair in `palette.css`, not the component.

## Strings come from above

Components must not hardcode any user-facing string — visible copy, placeholders, or screen-reader/`aria-*` text. The consuming application owns i18n and passes every string in via props. Do not add English default values for string props; require them. Stories supply example strings, which is fine — they are not shipped. Lint enforces this (`ui-contract/no-hardcoded-strings`), along with the tier and import boundaries above and merging `className` through `cn()` rather than dropping or overwriting it.

## Comments

A comment exists only to state a constraint or reason the code itself cannot show. Three anti-patterns are banned (and a lint tripwire catches the mechanical tells):

- **Narration** — restating what the next line does.
- **Port diary** — notes about where code came from or what changed while porting or refactoring: "ported from X", "was previously", "now uses". The diff is the diary; the merged code should read as if it was always written this way.
- **Boilerplate JSDoc** — param/return blocks that repeat the type signature in prose.

When porting or refactoring, keep the source's load-bearing comments only where the constraint still applies, and never add commentary about the porting itself.

## Definition of done

A component is done when:

- It has a co-located `*.stories.tsx`. Stories are the only tests — a component without a story has zero test and a11y coverage. Interactive components have a play function exercising the interaction. A component that portals (dialogs, menus, tooltips) sets `parameters.a11y.context: 'body'` so the popup is scanned too.
- It is exported from `src/index.ts`.
- It passes a11y: `addon-a11y` runs at `error`, so contrast/label/role violations fail the test run.
- `pnpm typecheck && pnpm lint && pnpm exec prettier --check .` pass (pre-commit runs these).

**Before you say done, check your own diff** — lint can't see all of these:

1. Every class is a token class; no arbitrary values, `style={{…}}` colors or raw milliseconds.
2. No user-facing text, `aria-*` text or English default in the component; it all arrives through props.
3. No raw `<button>` or `<a>` where `Button`, `LinkButton` or a Base UI part fits.
4. A story covers each variant and state (disabled, invalid, open), with a play function for each interaction, and passes in light **and** dark (`pnpm --filter @repo/ui test`).
5. It is exported from `src/index.ts`, and nothing outside the task's files changed.
6. You ran the checks yourself and are reporting their real output, not an expectation.

For a deeper pass, or to review someone else's component, load the `review-component` skill.

**Editing shared styling?** Before you touch `src/theme/*`, `src/lib/*Variants.ts` / `*Classes.ts` or `globals.css`, load the `visual-checkpoint` skill: save a checkpoint first, compare after, and report every component that changed — not just the one you meant to.

## Conventions

- Prettier owns all formatting, `.tsx` included; ESLint is correctness-only.
- Conventional Commits with the subject capped at **50 characters** (commitlint-enforced); put detail in the body.
- PR titles follow the same rule: squash merge makes the title main's commit subject, and the `pr-title` check runs commitlint against it.

## Domain language

Use the canonical terms in `CONTEXT.md` (Atom, Molecule, Organism, Control, Part, Token, Mode, Story). Architectural decisions are recorded in `docs/adr/`.

<!-- addon:claude-design -->

## Claude Design

The library is published to Claude Design as the project's design system, so screens designed on Claude's canvas use the real components. Load the `claude-design` skill before publishing it or designing on a canvas.

- `pnpm design:build` packs the components, stylesheet, tokens, guide and preview cards into `.claude-design/project/`; Claude publishes that folder to the url in `claude-design.json`.
- The design system there is read-only: change the code, rebuild, republish.
- The guide it shows comes from `packages/ui/scripts/claude-design/guide.md`, its preview cards from `cards.mjs` beside it.
- After every round of canvas work, run `pnpm design:vqa` on the canvas folder, fix what it lists, and look at the pictures before reporting.

<!-- /addon:claude-design -->

<!-- addon:explorations -->

## Explorations (`explorations/`)

A convention-free lane for standalone experiments, each deployed as its own Metalab Site (`docs/adr/0007`). Everything else in this file describes the library and does **not** apply inside `explorations/`: no tiers, no token contract, no story requirement, no string rules — Prettier, ESLint, and the main CI pipeline all skip the folder. Commit messages still follow Conventional Commits.

The one contract an exploration must honor: it is a workspace package whose `build` writes static output to `dist/` (overridable via a `"sites"` package.json field: `{"dist": "out", "spaFallback": true}`), and its folder name doubles as its site name (`^[a-z0-9-]+$`).

- `pnpm new-exploration <name>` — scaffold (blank Vite+React+TS; `--with-ui` pre-wires `@repo/ui` + tokens).
- `pnpm publish-exploration <name>` — build and publish a per-person draft site.
- Merging to main deploys the canonical site via CI. Deleting an exploration requires manual `sites delete` cleanup — see `explorations/README.md`.

<!-- /addon:explorations -->

<!-- addon:figma-to-code -->

## Figma to code

Components designed in Figma are built with the `figma-to-code` skill, which loads `figma-check` for its tools. Load it whenever someone shares a Figma link to build from, or asks whether a component matches its design.

- A port is done when `pnpm figma:audit <slug>` shows no failing or unaccounted rows in light and dark, and the table and the side-by-side picture are pasted in the report.
- `CLAUDE.md` wins over the Figma layer tree: tokens only, Base UI, strings through props, `size` on controls only. A Figma value with no token is snapped and recorded, or becomes a new token.
- `packages/ui/FIGMA.md` tracks what was built, snapped, skipped and left open. `figma.json` holds the project's Figma file, direction and token names.
- A whole screen follows `.claude/skills/figma-to-code/screens.md`: check the file's health and grid once per project, build from the design's intent (never its layer tree), make it work at every phone width, and pass `pnpm figma:screen <slug>`.
- Every Figma skill works through the figma-console MCP. If its tools are missing, set it up first (`.claude/skills/figma-check/setup.md`): Claude adds it after asking; the person restarts Claude and adds its plugin in Figma. No Figma access key is needed.
- Never write into the client's Figma file.

<!-- /addon:figma-to-code -->

<!-- addon:project-notebook -->

## Project notebook

What we know about the client project (brief, people, decisions, client feedback, open questions) lives in a notebook on the computer, outside this repo, kept up to date from calls and Slack by the `project-notebook` skill. Not everyone has one.

- Before planning product or design work, run `pnpm notebook`. If it finds one, read `brief.md` and `decisions.md`, and `open-questions.md` or `feedback.md` when the work touches them.
- Refer to decisions by ID (D-014) when they shape the work, and flag work that goes against an active decision instead of quietly overriding it.
- Never copy notebook content into this repo (code, comments, docs, stories, commits): it holds internal client talk.
- When something gets decided in a session, offer to note it in the notebook.

<!-- /addon:project-notebook -->

<!-- addon:prototype-viewer -->

## Prototype viewer (`explorations/present/`)

Prototypes are explorations with a `prototype.json` (title, description, device, screens); the viewer shows them all to clients at `sites.metalab.com/<project>/present/`. Load the `prototype-viewer` skill before making a prototype or changing what a client sees.

- `pnpm new-prototype <name>` — a new prototype, one screen per `#id` in `prototype.json`.
- `pnpm present` — build every prototype and the viewer, and show them at http://localhost:4400.
- A new prototype starts hidden from the client. Staff switch it on in the viewer's Prototypes panel, or Claude does through the Sites connection (the `present` site's `choices` collection).
- `explorations/present/marcus/` is Marcus Brown's template, kept unchanged; viewer changes go in `explorations/present/live/`.

<!-- /addon:prototype-viewer -->

<!-- addon:taste-review -->

## Taste review

Before a screen, page template or prototype goes in front of a designer or a client, a second Claude that hasn't seen it being built looks at pictures of it and critiques the craft: hierarchy, spacing, alignment, type, colour. Load the `taste-review` skill.

- `pnpm taste:shots <story or address>` photographs the screen in light and dark at the project's screen sizes, into `packages/ui/.taste/`.
- The reviewer is always a fresh agent, given only the pictures, the rubric and one line on what the screen is for. Never the code or the builder's reasoning.
- Fix what it marks `must fix` and `should fix` with tokens and existing components, photograph again, and stop after two rounds. This file wins over the reviewer.
- The rubric (`.claude/skills/taste-review/rubric.md`) is a general starting list. The team's own craft rules replace or extend it.

<!-- /addon:taste-review -->
