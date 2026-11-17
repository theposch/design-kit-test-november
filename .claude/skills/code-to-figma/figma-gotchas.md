# Figma plugin API gotchas

Traps that produce silently-wrong libraries. Read before the first `figma_execute` of a session; re-check here before
"fixing" anything that looks wrong.

## Layout & sizing

- `resize()` resets `primaryAxisSizingMode` to FIXED — re-assert sizing modes after every resize.
- Watch for "hug contents" where the code fills its container (and vice versa): compare against the measured DOM, not what
  looks balanced.

## Text & type

- `loadFontAsync` before ANY text creation or edit; a text style's font must be loaded before `setTextStyleIdAsync`.
- Text styles override manually-bound `fontSize` — to make type cascade with a mode, detach the style, then bind
  family/weight/size to Typography variables.
- On a TextNode, `boundVariables.fontSize/fontFamily/fontWeight` are **arrays** — a dump that skips array entries falsely
  reports the node unbound. Read the component description before "fixing" anything.

## Pages & nodes

- `figma.getNodeById` / `figma.currentPage =` throw under dynamic-page — use the `Async` forms; `page.remove()` throws on
  the current page (switch first).
- Variant names are only unique **within** a set — NEVER match component names globally; scope every sweep to the target
  set/page. (A global `orientation=vertical` delete once destroyed two other components' variants.)
- Deleting a main component does NOT break its instances — Figma keeps the master alive, so previews still render and hide
  the loss. Recover via `instance.getMainComponentAsync().parent`; re-check pages after any hand edit.
- `node.clone()` on a variant does NOT join the set — `set.appendChild(clone)` explicitly, then verify no duplicate variant
  names (dupes silently create "conflicting properties").

## Instances

- Text edits on instances fail silently — use `setProperties`.
- You can't add children to an instance — masks/wrappers go around it in a group.
- Icon components may carry a fill on the frame — recoloring "all fills" paints a solid square; clear the instance's own
  fills and recolor vector descendants only.

## Variables & styles

- Gradient stops can't bind variables; bound `letterSpacing` is px, not %; variable names reject dots.
- Derived alphas need explicit `alpha/*` variables — opacity can't ride a bound variable.

## Images & effects

- Plugin `fetch` is blocked. Import images via base64 → `figma.base64Decode` → `figma.createImage`, **chunked into
  ~1700-char `setPluginData` pieces** (single >5KB strings arrive mangled). Downscale first. Decorative texture art can be
  rasterized (≥3× target size) instead of importing huge vectors.
- CSS masks (`mask-image`) become a group: gradient-filled rect with `isMask` as first child + the instance above it.
  **Reproduce the CSS geometry exactly** — check the real render first; an effect imperceptible in the browser must stay
  imperceptible in Figma.
