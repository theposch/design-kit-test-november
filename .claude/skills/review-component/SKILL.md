---
name: review-component
description:
  Evidence-first, read-only review of a library component (atom, molecule or organism) against this repo's contract — tiers, Base UI
  wrapping, tokens, modes, strings, a11y and stories — ending in a graded report and the top three fixes. Use when asked to review,
  audit or "check" a component, before calling your own component done, or before a batch is committed.
---

# Review a component

A review is only as good as its evidence. Read first, change nothing, cite everything. Fix only after the report, and only if asked.

## Rules of evidence

- **Every finding cites evidence:** `path:line`, a story name, or real command output. No evidence, no finding.
- **Three verdicts only:** `good`, `needs work`, `not inspected`. Missing evidence is `not inspected`, never `good`.
  Tag each finding `major` or `minor`, so one small gap doesn't read like a broken area.
- **Not every item applies.** A toast has no trigger and no disabled state. Mark such an item `n/a` with a
  one-line reason; it doesn't count against the area.
- **Run the checks; don't predict them.** Quote the real summary line of each command you ran. `tsc` and `eslint` print
  nothing on success, so quote the exit status (`exit 0, no output`) or the error count instead.
- **Stay in scope.** Review the component and its story. Note anything outside them under "Out of scope", and don't grade it.

## Steps

Run everything from the repo root.

1. **Context.** Read the component, its story, and its row in `packages/ui/src/index.ts`. Read the matching Base UI doc in
   `packages/ui/node_modules/@base-ui/react/docs/react/components/<kebab-name>.md` (for example `alert-dialog.md`). Name
   the tier, and say which existing component it should resemble most: a single control like `Button.tsx`, a
   trigger-and-popup compound like `Dialog.tsx`, or the closest real sibling if neither fits.
2. **Machine checks.** Run `pnpm --filter @repo/ui typecheck`, `pnpm --filter @repo/ui lint`, and
   `pnpm --filter @repo/ui exec vitest run --reporter=verbose <Name>.stories`. The verbose reporter is what shows each
   story passing in both the `storybook-light` and `storybook-dark` projects. Quote each result.
3. **Grade each area** with the checklist below.
4. **Report** in the format at the end.

## Checklist

**Structure and tier**
- The file sits in the right tier: an atom composes no library component; a molecule imports no organism.
- Every Base UI part is wrapped and exported as a named function, pass-through parts included. The component file
  exports no namespace object (the barrel's `export * as X` is intended).
- `className` is string-only (`Stringly<P>`), destructured, and passed last into `cn()`.
- There is no `size` prop unless it is a control (`docs/adr/0005`). A control's ladder matches Button's heights.

**Styling and modes**
- Token classes only. Type comes only from `type-body-*` / `type-heading-*`.
- State is styled through data attributes (`data-open:`, `data-disabled:`, `data-starting-style:`…), never through JS.
- Focus comes from `#lib/focusRing` on every part that can take focus, including parts Base UI makes focusable
  (check its `tabIndex`). Transitions use the motion tokens.
- There is no mode branching. If one mode looks wrong, the finding belongs to `palette.css`, not the component.

**Strings and semantics**
- No user-facing or `aria-*` text in the component, and no English defaults. That includes defaults the wrapped Base UI
  part ships (search its source for `aria-label`): a leaked default is a finding even though our file has no string.
- Native semantics: no `div` with `onClick`, and a link is a `LinkButton`, not a Button.
- Icon-only triggers get an accessible name from the consumer.

**Stories (the only tests)**
- There is a story per meaningful variant and state: default, disabled, invalid/error, open for portals, and long or empty
  content where it applies.
- Each interaction has a play function that asserts what a user perceives (role, name, value, focus) rather than class names.
- Portaling components set `parameters.a11y.context: 'body'` and have an `Open` story.
- Keyboard: open, move and close by keys, and focus returns to the trigger on close.
- Passes in both the light and the dark project.

**Outside the component file**
- If the Base UI component needs a non-component API (a manager or hook such as `createToastManager`), check it is
  exposed from `src/hooks/` or `src/lib/`. A missing one goes under "Out of scope" as a gap, since consumers can't
  import Base UI.

**Comments**
- Each comment states a constraint or reason. None narrate the code, keep a port diary, or repeat types in JSDoc.

## Report format

```
## Review: <Component> (<tier>)

Checks run:
- typecheck: <real result line, or exit status>
- lint: <real result line, or exit status>
- stories: <real result line>

| Area | Verdict | Evidence (tag each gap major / minor) |
| --- | --- | --- |
| Structure and tier | good / needs work / not inspected | path:line … |
| Styling and modes | … | … |
| Strings and semantics | … | … |
| Stories | … | … |
| Comments | … | … |

Top 3 fixes (most user-visible first):
1. <fix> — <path:line> — <why it matters>
2. …
3. …

Not inspected: <list, with the reason>
Out of scope: <anything noticed outside the component>
```
