# Prototype viewer

Shows this project's prototypes to clients at `sites.metalab.com/<project>/present/`.

The design is Marcus Brown's prototype template, kept exactly as they made it in `marcus/`. The build (`build.mjs`) takes
their sample app out of it and puts a live prototype in its place, using the files in `live/`:

- `frame.js`: the phone frame's fitting and the theme, lifted out of their sample app unchanged.
- `live.js`: puts the prototype in the phone and drives its screens through `window.proto`. It also feeds their labels,
  screen notes and pointer from `prototype.json`, through invisible stand-ins laid over the prototype's parts (their
  scripts measure those as they measured their own sample app), and runs the Prototypes panel's switches, order and
  rounds. It keeps the labels added in the viewer too, and tells the shell who is looking and what they may see
  (`window.presentShell`).
- `choices.js`: which prototypes the client sees, saved in this site's database on Sites.
- `comments.js` and `comments.css`: pinned comments with replies, emoji reactions and resolve, kept in this site's
  database on Sites (in the browser locally).
- `sets.js`: their set picker, fed by the list of prototypes instead of a hand-written one.
- `live.css`: the few styles the above need.
- `escape.js`: the page's first script. It hears Esc before the template does and hands it to whatever is on top.
- `shell/` and `shell.css`: the top bar and everything it opens (the prototype and screen menus, all screens as a grid
  or a flow canvas, the comments panel, adding labels, settings, share). Small ES modules with no build step;
  `shell/index.js` lists them. `shell/engine.js` is the only one that touches the template or the files above.
  `shell/tap-targets.js` finds the button each flow arrow starts from.
  `shell/model.js` and `shell/flow-layout.js` are pure logic, tested with `pnpm --filter @explorations/present test`.
- `shell/samples.js` puts a prototype's sample comments in (`sample-comments.json` beside its `prototype.json`), on
  someone's own computer only.
- ELK (`elkjs`, the one package the viewer uses) lays out the flow view: where each screen sits and the path each
  arrow takes. The build copies it to `js/vendor/elk.js`, and `shell/elk.js` fetches it in the background once the
  viewer is up, so nothing waits for it. `test/large-prototype.mjs` is a made-up prototype of 63 screens, the size of
  a real project, that the tests lay out.

A prototype is any exploration with a `prototype.json`. Start one with `pnpm new-prototype <name>`, and see them all with
`pnpm present`. The `prototype-viewer` skill has the rest.

## What it needs from the project

The viewer is one add-on (`add-ons/prototype-viewer/`), so it can move to a repo of its own one day. Everything it
installs is listed there. These are the things it uses but doesn't bring, so a move would have to keep them working:

- **The `explorations` add-on.** `pnpm new-prototype` runs its `scripts/explorations/new.mjs <name> --with-ui` and then
  lays `explorations/.templates/prototype/` on top. `pnpm present` uses `explorationPackage`, `explorationsDir`, `run` and
  `sitesProject` from `scripts/explorations/lib.mjs`.
- **Publishing that rebuilds the viewer.** `scripts/explorations/ci-deploy.mjs` rebuilds any exploration whose
  package.json sets `"sites": {"rebuildOnAnyChange": true}` when another one changes, so a new prototype shows up.
- **`sites.json`** at the project's root: its `title` (or `project` slug) names the project in the viewer.
- **`@repo/ui`.** New prototypes are built with the project's components (the `--with-ui` template).
- **The add-on markers** in `CLAUDE.md` and `package.json` (`new-prototype`, `present`), which `pnpm addon` fills in.

Nothing outside the add-on depends on the viewer: the starter's other files mention it only as "if it's installed".
Keep it that way. A change that makes the core reach into `explorations/present/` belongs in the add-on instead.
