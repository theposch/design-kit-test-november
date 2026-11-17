# Figma reference: traps, quirks and policy

Lore, not procedure. The runbooks are in `figma-to-code/SKILL.md` and `code-to-figma/SKILL.md`; read this when the
source file surprises you.

## Traps that have each shipped a bug

- **No fill is a value.** `fills: []` means transparent; that is the design. Two icon buttons were built with invented
  grey chips because "no fill" read as "no information". The parity check now fails a painted background where Figma
  has none.
- **Absence is a design decision.** A card with no artwork got an avatar; a carousel with no arrows got arrows. Neither
  shows in a measurement, only in the map, where every layer must be accounted for and nothing extra built.
- **Order is part of the design.** In an auto-layout frame the children's order is the reading order. A card shipped with
  its title and date swapped on every instance. The check compares order on screen.
- **A library variant is a claim, not a fact.** Reusing a component is right, but its painted result still has to match
  the token the frame binds. An `outline` button painted the page colour where the design had a border and no fill.
- **Siblings that look alike usually aren't.** Two cards with the same name differed in padding and content. Snapshot
  each one you build.
- **Measure this frame.** A side column's width carried over from an earlier frame cost the main column 88px, and looked
  like a missing token rather than the porting mistake it was.
- **The first text layer isn't the label.** A button put a prefix before its label, so "the first text node" read the
  wrong one, and the whole button got the prefix's weight.

## Reported weight isn't the design's weight

When the licensed font isn't installed where the Figma file is open, Figma reports the weight of the font it fell back
to. Every regular style can come back as 400 and every bold one as 700. So the named text style decides; the number
doesn't. Map each style to our composite in `figma.json` `textStyles`. Size, line height and letter spacing aren't
affected.

## What the extractor can't give you

- **Blend modes mostly have a CSS version.** `mix-blend-mode` covers multiply, screen, overlay, darken, lighten,
  colour dodge and burn, hard and soft light, difference, exclusion, hue, saturation, color and luminosity. Figma's
  Linear dodge is `plus-lighter`. Only Linear burn has no CSS version: approximate it and record the decision in
  `FIGMA.md`. A blend only works against what's painted behind it inside the same stacking group, so check what sits
  underneath before deciding it "doesn't work".
- **Figma's glass can be rebuilt.** It's four things together, kept in one `@utility` in `src/theme/effects.css`:
  1. a see-through fill and `backdrop-filter: blur()` at the effect's frost radius;
  2. a 1px rim lit from the effect's light angle: a `conic-gradient` or `linear-gradient` ring on a pseudo-element,
     cut to the edge with `mask` (`mask-composite: exclude`) so only the border shows;
  3. a soft inner light: an `inset` box-shadow, white at low alpha, sized by the effect's depth;
  4. any light behind the glass (a glow, a dot) painted in the shape the lens gives it, usually a wider, softer oval.
  The snapshot records the glass settings (radius, light angle, intensity, depth, refraction); map them to that one
  utility. The rim is the effect's, not a stroke: no layer has one.
- **Exports include what spills out.** A layer with a shadow or glow exports bigger than its box (a 28×40 icon came
  out 39×50). Size the image by the file and pull it back with a negative margin. For the side-by-side, export the
  drawn area (`absoluteRenderBounds`) and pass `--pad` to `figma:compare`.
- **Video and GIF fills** are motion the designer couldn't draw. The snapshot marks them; ask for the file, or propose
  the motion.
- **Gradients are portable.** The design-system exports drop their stops, but the plugin API has both stops and
  transform, and the extractor saves them. To convert: invert the transform's linear part for the direction, scale by
  the layer's width and height, and `atan2(x, -y)` is the CSS angle. Register the result as a token
  (`--background-image-*`) rather than writing it inline.
- **Image fills are recoverable.** `figma.getImageByHash(hash).getBytesAsync()` gives the original file. Export the
  layer when you want the artwork with its mask and rounding, the fill when you want the raw image.

## Quirks: not design data

- **`#9747FF` strokes** are Figma's placeholder purple on component set frames. Ignore them.
- **Effect styles can lose their alpha** in some exports. Shadow variables keep the real value; build shadow tokens
  from those.
- **Fixed black and white** variables can be pinned across modes on purpose. Check before "fixing" them in dark.
- **Typography with platform modes** (Web, iOS, Android) differs in letter spacing between them. Port the mode for the
  platform the project builds.
- **`figma.mixed` is a symbol.** Putting it in a template string throws and kills the whole run. The extractor guards
  every read that can return it; do the same in any snippet you write.
- **The server-side image export drops some fonts.** Export through the plugin (`exportAsync`), which uses the fonts
  installed on the computer.

## Policy for a messy file

- **Skip the cruft.** Cover art, status bars, internal tooling, documentation layouts and unnamed accidental components
  (`Frame 2147…`) aren't ported. Keep the list under "Deliberately skipped" in `FIGMA.md`.
- **Split mixed axes.** An axis with values like `Primary Small` becomes `variant` and `size`.
- **Merge duplicates.** Two sets that are the same component become one; record which won.
- **States aren't props.** Hover, pressed and disabled are CSS and Base UI data attributes.
- **Don't invent.** Where the file is ambiguous, write it down in `FIGMA.md` as an open question rather than guessing.
- **Read the size steps off the set.** Check "Measured size steps" in `FIGMA.md` first. A step invented in code shows up
  later as a fake token gap.
- **Check a component is what the design means before reusing it.** A circular avatar stood in for rounded-square
  artwork across half a library before anyone noticed.

## Other figma-console tools worth knowing

- `figma_get_annotations`: designers' notes pinned to layers (timings, interaction specs, accessibility). Often the only
  place an intent is written down.
- `figma_lint_design`: contrast and design-system checks on the Figma side. Run it before blaming code for a contrast
  failure; it tells you whether the source fails too.
- `figma_analyze_component_set`: a quick look at a set's axes before a full snapshot.
- `figma_get_design_system_summary`, then `figma_search_components`: find node ids in a big file without reading it.

## Pictures out of Figma

Use the connected tools; there is no picture script of our own. Never use `figma_take_screenshot` or
`figma_capture_screenshot` for pictures that ship: they are for checking, and the second one shrinks everything to
1568px.

| What                                                           | How                                                                                                                                                                                         |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A layer as it looks (artwork, a logo, a cropped photo)        | `figma_get_component_image` with the layer's `nodeId`, `format: "png"`, `scale: 2`. It returns a link that lasts 30 days; save it with `curl -sSfo <file> "<link>"`. It needs a Figma access key (`setup.md`); without one, `figma_execute` returning `figma.base64Encode(await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } }))`, one picture per call. |
| The original uploaded photo                                    | Figma's own MCP, `download_assets` on the layer: `rawImages` are the uploaded files in their own format. Save each link with `curl`.                                                        |
| The original, when Figma's own MCP isn't connected             | `figma_execute` returning `figma.getImageByHash(hash).getBytesAsync()` as base64, **one picture per call**. The bridge stops at 8 MB of text (about a 6 MB file) and times out after 10 seconds. |
| An icon or simple drawing                                      | SVG (`format: "svg"`).                                                                                                                                                                      |

The first two go through Figma's web service, so they skip the bridge's size limit and time-outs, and nothing passes
through the conversation. A photo used on several screens has one `imageHash`: export it once.

Which to use comes from the snapshot's `scaleMode` on the image fill:

- **Fill:** the original, with `object-cover`.
- **Fit:** the original, with `object-contain`.
- **Crop, on a layer with no effects and nothing on top:** the layer as it looks, at 2×. The crop is in the file.
- **Crop, anywhere else** (a shadow, text on top): the original, framed in code from the snapshot's `crop`,
  `[[a, 0, x], [0, d, y]]`. The box gets `relative overflow-hidden`. The picture is `absolute max-w-none`, with a
  `style` of width `100/a`%, height `100/d`%, left `-100·x/a`% and top `-100·y/d`%. Percentages keep the framing at
  any box size, and a computed number like this is what `style` is for.

Always PNG for a layer, never JPG: JPG has no transparency, so rounded corners come out white.

A layer with a shadow or glow exports bigger than the layer, with the effect baked in. Export the layer inside it that
has no effect when there is one, and draw the shadow in CSS. When the effect can't be separated, keep the element's box
at the layer's size and draw the picture at the file's size, pulled back with a negative margin (the snapshot's `drawn`
gives the offsets). Squeezing the whole file into the layer's box shrinks the artwork.

## Text trimming changes every component

Figma's "cap height to baseline" trim becomes `text-box` in CSS. Turned on in a `type-*` composite, it tightens
every component using that style, not just the one being ported: a title can end up touching its subtitle. Before
adding it to a shared composite, save a checkpoint (`pnpm look:save`), and after, run `pnpm look:compare` and report
what moved. If only one component needs it, trim there instead of in the composite.

Trimmed text loses the tails of g, y and p as soon as something cuts it off, which `truncate` and `line-clamp-*` do.
Whenever a composite gets a trim, add this to `typography.css` too, outside any layer so it always wins:

```css
:where(.truncate, [class*='line-clamp-']) {
  text-box: normal;
}
```
