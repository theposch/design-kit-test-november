---
name: base-ui
description: Conventions for wrapping @base-ui/react components as library Atoms — anatomy mirroring, namespace exports, string-only className, data-attribute state styling, transitions off the motion tokens, render-prop composition — plus where Base UI's own docs live. MUST LOAD BEFORE adding or editing any component that wraps Base UI.
---

# Base UI wrappers

Base UI (`@base-ui/react`) supplies behavior and accessibility; an Atom in `packages/ui/src/components/atoms/` adds tokens and
markup. `Button.tsx` (single control) and `Dialog.tsx` (compound) are the reference implementations — read both before writing a
new wrapper, and copy their shape rather than inventing one.

## Read the real docs first

Base UI ships its documentation inside the package. For the component you are wrapping, read:

- `packages/ui/node_modules/@base-ui/react/docs/react/components/<name>.md` — anatomy, every part's props, **data attributes**, CSS
  variables, and a Tailwind example. The data-attribute tables are what you style against.
- `packages/ui/node_modules/@base-ui/react/docs/react/handbook/{styling,composition,animation}.md` when the component needs more than the
  basics.

Do not work from memory: attribute names and part lists differ between Base UI versions and from other headless libraries.

## Shape of a wrapper

1. **Import one component per file**: `import { Dialog as BaseDialog } from '@base-ui/react/dialog'`. Never the package root.
2. **Wrap every part in Base UI's anatomy** — including parts you add no styles to (`Root`, `Portal`, `Trigger`, `Close`). A
   pass-through wrapper still takes `className` through `cn()`. Consumers must never need to import `@base-ui/react`.
3. **Export every part as a named function** under Base UI's part names (`export function Root`, `export function Trigger`,
   …) and expose the file from `src/index.ts` as a module namespace: `export * as Dialog from './components/atoms/Dialog'`.
   Inside the package, import it as `import * as Dialog from '#components/atoms/Dialog'`. Nothing else is exported from the
   file — a namespace object (`export const Dialog = { Root, … }`) fails `react-refresh/only-export-components`. A
   single-element component (`Button`, `Switch`-like) exports the one function.
4. **`className` is a string.** Type props as `Omit<BasePart.Props, 'className'> & { className?: string }` (the `Stringly<P>`
   helper in `Dialog.tsx`). Base UI's callback form is excluded because `cn()` flattens through clsx, which drops functions
   silently.
5. **Variants with `cva`** where a part has real visual variants (`variant`, and a control-height `size` ladder on controls
   only — see `docs/adr/0005`). Keep the `cva` object module-private.
6. **No hardcoded strings**, including `aria-*` text. Base UI wires `aria-labelledby`/`aria-describedby` from `Title` and
   `Description`; the consumer supplies the words.

## Styling state

Base UI exposes state as boolean data attributes (`data-open`, `data-disabled`, `data-checked`, `data-highlighted`,
`data-popup-open`, …). Tailwind v4 matches them natively — `data-open:bg-muted`, `data-disabled:opacity-50` — so no custom
variants are needed. Use the attribute the docs list for that part; do not assume `data-state="open"` or `aria-*` shortcuts.

Tokens only, as everywhere in the library (`docs/adr/0003`, `0004`, `0006`). Popups sit on `bg-surface text-surface-foreground`
with `border-border`; a backdrop is `bg-background/80` (mode-blind — it darkens in dark mode and lightens in light).

## Transitions

Base UI animates with `data-starting-style` (first frame after mount) and `data-ending-style` (while unmounting), so a CSS
transition is all that is required:

```tsx
'transition-[opacity,scale] duration-(--motion-duration-normal) ease-default data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0';
```

Durations come from `theme/motion.css` via the `duration-(--motion-duration-*)` form; easings are registered as `ease-default`
/ `ease-emphasis`. No keyframe or animation library. In a play function, a popup is at opacity 0 the instant it mounts —
assert visibility inside `waitFor`.

## Composition

Use the `render` prop, never wrapper elements: `<Dialog.Trigger render={<Button variant="outline" />}>Open</Dialog.Trigger>`.
The rendered component must forward `ref` and spread its props (every library Atom does). Two rules from Base UI itself:

- A **link is not a button**. `Button`/`Trigger` enforce button semantics; do not `render={<a />}` on them. A link that looks
  like a button is `LinkButton` — a plain `<a>` via `useRender`, sharing Button's `cva` recipe from `lib/buttonVariants.ts`.
- A non-`<button>` element rendered by a button-like part needs `nativeButton={false}`.

Popups portal to `<body>`; `globals.css` sets `isolation: isolate` on `body` so they stack above any consumer `z-index`.

## Stories

- Every wrapped component has a co-located story with a play function that drives the real interaction (open, close, Escape,
  focus return). Portaled content is outside `canvas` — query it with `screen` from `storybook/test`.
- Portaling components set `parameters.a11y.context: 'body'` so the a11y run scans the popup, and add an always-open story
  (`defaultOpen`) so contrast inside the popup is checked in both modes.

## Checklist before you finish

- [ ] Every Base UI part wrapped and exported as a named function; the barrel's `export * as` mirrors the docs' anatomy
- [ ] `className` typed as string on every part
- [ ] Only data-attribute variants from the component's docs; no `dark:`, no arbitrary colors
- [ ] Transitions use motion tokens and `data-starting-style` / `data-ending-style`
- [ ] Story with play function (+ open story and `a11y.context: 'body'` if it portals)
- [ ] Exported from `src/index.ts`; `pnpm typecheck && pnpm lint && pnpm test` green
