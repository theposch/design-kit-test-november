---
name: visual-checkpoint
description:
  Take before/after photos of every Storybook story (light and dark) to see exactly which components a styling change
  touched. Use before and after editing shared styling — theme tokens, `src/lib/*Variants` / `*Classes`, `globals.css` —
  when a designer asks "what did this change?", or before a client review to show what changed since the last one.
---

# Visual checkpoint

A styling edit can ripple: changing one radius token or `buttonVariants` restyles every component that shares it.
Tests don't catch that, because nothing is broken — it just looks different. This skill photographs every story so
the ripple is visible.

It is a camera, not a gate. Changes are expected; the point is that every change is one somebody meant.

## Commands

```bash
pnpm look:save      # photograph every story, light + dark, as the checkpoint
pnpm look:compare   # photograph again, compare, open .look/report.html
pnpm look:accept    # the latest photos become the new checkpoint
pnpm look:accept -- --colour-only   # accept only the photos where nothing but colour changed
```

Add `-- --only=button` to limit to stories whose id contains `button`, and `-- --no-open` to skip opening the report.
Photos live in `packages/ui/.look/` and are git-ignored: they're local to this machine, so a checkpoint
from another computer won't match (fonts and anti-aliasing differ). Page templates are photographed only at the
project's screen sizes (`project.json`; all three when it doesn't say), at the designer's frame size when it sets one.

## When to use it

Checkpoint **before** you edit any of these, and compare **after**:

- `packages/ui/src/theme/*` (tokens: palette, radius, spacing, typography, motion)
- `packages/ui/src/lib/*Variants.ts` and `*Classes.ts` (styles shared by several components)
- `packages/ui/src/globals.css`

A change to one component's own file only needs it if that component is used inside others.

## Steps

1. **Save first.** If `.look/checkpoint/meta.json` exists and was taken on the current commit with no uncommitted
   changes, reuse it. Otherwise run `pnpm look:save` *before* editing. Without a before photo there is nothing to compare.
2. Make the change.
3. Run `pnpm look:compare -- --no-open`. It lists every changed photo.
4. **Sort the list** into:
   - **intended**: the components the request was about;
   - **ripple**: anything else. Name each one and say which shared file caused it.
5. Report both lists to the user, with the report path (`packages/ui/.look/report.html`). Ripple is not a failure;
   it is a question for the designer: keep it, or scope the change tighter (for example, a new variant instead of
   editing the shared one).
   A palette or type change can touch hundreds of stories, so report by kind: "12 layout, 3 size, 480 colour only",
   then name the layout and size ones. Colour-only changes after a palette change are usually intended.
6. Run `pnpm look:accept` only when the user agrees the changes are what they want (or `-- --colour-only` when they
   agree to the colour-only ones and want to look at the rest again). Never accept on your own to
   make a comparison come back clean.

## On pull requests

A pull request that touches `packages/ui` gets the same comparison from CI (`.github/workflows/visual-checkpoints.yml`):
it photographs the target branch, then the pull request, and lists what changed in the run's summary, with the report
attached as the `visual-checkpoints` file. It never blocks a merge; it shows the reviewer what moved.

## Reading the report

Changed stories are grouped by the biggest kind of change they have, layout first:

- **Layout changed:** shapes moved, appeared or disappeared. Look at every one.
- **Size changed:** the photo grew or shrank, usually text wrapping differently.
- **Colour only:** the same shapes in the same places, in new colours. Folded away; open it to skim.

The kind is judged from the edges in the picture, so a heavy colour change that makes a faint border vanish can land
in "layout". Each changed story gets one card, with a row per mode. Each row shows Before, After and the differences in red,
cropped to the area that changed; "full screen" links open the whole photo. "New" means a story was added since the
checkpoint; "removed" means it no longer exists.
