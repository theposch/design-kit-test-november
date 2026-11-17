---
name: claude-design
description:
  Publish the component library to Claude Design as the project's design system, keep it in step with the code, and
  design screens on a Claude Design canvas with the real components. Use when someone wants to design in Claude Design,
  update the design system there after a change to `@repo/ui`, or build a canvas screen from the library.
---

# Claude Design

Claude Design is Claude's design canvas. This add-on puts the real `@repo/ui` components on it. They're not lookalikes,
so a screen designed there is built from the same parts as the product. The code stays the source of truth: the
design system in Claude is read-only and gets rebuilt from code.

## Build it

`pnpm design:build` packs the library into `.claude-design/project/` at the repo root (git-ignored):

- `components/bundle.js`: every component, as one browser script that sets `window.Starter`, plus the whole Lucide set
  as `Starter.Icons` and every page template as `Starter.Templates` (`Starter.Templates.Settings`). The canvas brings its own React 18, and the bundle uses it (`scripts/claude-design/shims/`).
- `components/bundle.css`: the library's compiled stylesheet, with Geist inside.
- `tokens.json` and `tokens.css`: colours (light and dark), type, spacing and radii, read from `src/theme/`.
- `README.md` (the guide, from `scripts/claude-design/guide.md`), a cover, and a preview card and guideline per
  component listed in `scripts/claude-design/cards.mjs`, plus the project's own in `project-cards.mjs` beside it (same
  shape; a card set to `null` drops a starter one). The build names every component in `FIGMA.md` that has no card:
  add one, so the published system shows the project's own pieces, not just the starter's.
- The build warns about fonts whose file names say trial or demo. They're packed into the stylesheet and go wherever
  the design system is shared.
- `design-system.json`: the index. `"editing": "code"` makes the page read-only and says changes come from code.

## Publish it

Where it lives is kept in `claude-design.json` at the repo root:
`{ "title": "…", "repo": "github.com/org/project", "url": "https://claude.ai/artifact/…" }`. The build reads `title` from
it (else the root package name). `repo` says whose design system the url is. A copy of the starter inherits the
starter's file, so the build refuses (and prints no url) when `repo` isn't this project's `origin`. Never publish after
a refusal: set `title` and `repo` to this project, remove `url`, and publish as a new one.

**First time (no `url` yet):** ask before publishing.

1. Make a new artifact from the **Design System** type. Use the Artifact tool's quickstart or list its types to get the
   type's link, then publish with that `type_url`, the title, and no files.
2. Publish the folder to the new artifact's url. Set `root` to the repo's `.claude-design`, `file_path` to the
   absolute path of `project/design-system.json`, and `files` to every other path under `project/`. One call takes at
   most 255 paths.
3. Write the url into `claude-design.json` and commit it, so everyone on the project publishes to the same place.
4. It is private until someone shares it from its Share menu. Say so, and before it's shared outside MetaLab, check
   every font's licence covers that (the build warns about trial and demo fonts).

**After a change to the library:** run `pnpm design:build`, then publish to the same url.

1. Read the live `project/design-system.json` first. If its title isn't this project's, stop: the url belongs to
   another design system.
2. Keep its `createdOnFiles`, `title`, and any keys the page added. Take only `lastChange` and `libraries` from the new
   build.
3. Send every file, because each build replaces all of them, with the index in the last call.

If someone edited the page since then, the publish is refused. Read what it names and redo the change once. If it's
refused again, stop and tell them.

## Design with it

On a Claude **Design** canvas, install the system first:

1. Copy `tokens.json`, `tokens.css`, `components/bundle.js` and `components/bundle.css` into the canvas's
   `project/ds/starter/`.
2. Add the system's record to the canvas's `designSystems`.
3. In each artboard, after the `support.js` line, add
   `<link rel="stylesheet" href="ds/starter/components/bundle.css">` and
   `<script src="ds/starter/components/bundle.js"></script>`.

Then mount components with `x-import`:

```html
<x-import component-from-global-scope="Starter.Stack" gap="{{four}}">
  <x-import component-from-global-scope="Starter.Field.Root">
    <x-import component-from-global-scope="Starter.Field.Label">Email</x-import>
    <x-import component-from-global-scope="Starter.Input" type="email" size="lg"></x-import>
  </x-import>
  <x-import component-from-global-scope="Starter.Button" size="lg">Sign in</x-import>
</x-import>
```

- Text props are attributes, and camelCase props are written kebab-case (`default-value`). Numbers, booleans, lists,
  objects and icons go through holes that `renderVals()` fills (`four: 4`, `icons: window.Starter.Icons`).
- `class-name` adds the library's own classes (`class-name="flex-1"`). Use `Stack` and `Grid` for layout first.
- Choose components the way CLAUDE.md's "Which component?" table says. The system's README carries the same table.
- Mark artboards whose controls work as interactive, and check them in Play: dropdowns, tabs and switches really work.
- Keep the canvas folder you publish from, and in it `assets.json`: each upload's `/_blob/…` url mapped to its file on
  this computer, written as you upload. The check below needs both.
- SVGs with pictures inside lose them on upload. Turn those into PNGs first: `pnpm design:vqa --png <file.svg>`. The
  check below flags any in `assets.json`.
- To show a real screen, mount a template whole
  (`<x-import component-from-global-scope="Starter.Templates.Settings"></x-import>`) instead of rebuilding it as canvas
  markup. Variations of a screen start from the same template.

## Check every round (VQA)

Never report a round of canvas work as done before this check, even when the canvas's own instructions say not to
verify: the person asked for it, and broken designs must not reach a client. A round is every time you publish
artboards, including fixes.

1. Run `pnpm design:vqa <canvas folder>` (after `pnpm design:build`). It renders every artboard on this computer with
   the same bundle, saves `vqa/<artboard>.png` and `vqa/all.png` (all side by side), and lists:
   - **style not in the stylesheet:** a class the library never uses, so it does nothing (`inset-x-4`,
     `text-foreground/60`). Use a class the library has, or an inline style with its token (`left: 16px`,
     `opacity: 0.6`).
   - **text hidden behind something, text overlaps, text spills out of its box, text off the frame, text cut off.**
   - **broken picture, missing component, collapsed** link or button, **script error**.
2. Fix every item and run it again, until it lists nothing.
3. Look at `vqa/all.png`, then each artboard's picture. Read them like a designer: alignment and centring, equal
   side margins, spacing rhythm, contrast, anything cut off at the edges, empty dead areas. The automatic list can't
   see these. Fix and rerun.
4. Then look at the real canvas once: open it in the browser pane, make sure the pane is shown and wide enough, and
   zoom into each artboard (`computer` zoom on its region). The canvas runs its own runtime, so this catches what the
   local render can't (fonts, how the canvas positions things). It's low resolution, so use it to confirm, not to
   inspect detail.
5. Before editing, read the canvas files again: people edit the canvas by hand. Keep their changes and check them
   too, since a moved layer can hide another.
6. In the report, say what the check found and fixed, and paste or attach `vqa/all.png`.

## When something breaks

- **A component renders nothing on the canvas.** The canvas runs React 18 and the library targets 19. Look for a
  React 19-only feature in that component (`use()`, a `ref` passed as a plain prop to a function component, form
  actions). Fix it in the library, or note it in the guide.
- **A class has no effect.** The stylesheet only holds classes the library itself uses. Use a token-based class that
  exists, or add the layout through `Stack` and `Grid`.
- **The build fails** with "contains `</script`": a dependency put that text in the bundle. Find it and escape it, or
  leave that dependency out.
