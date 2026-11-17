# Plan: add-ons and the prototype viewer

Status: draft for discussion · Nov 2026

## Why

The starter is copied once per client. Today everything comes along on day one: every page template, explorations, picture checkpoints, screencasts, Figma sync, and soon charts and a prototype viewer. Most projects use a few of these. The rest is weight: more files to read, more for Claude to wade through, more to keep working. And once a project is copied, it never gets later fixes.

We want two things:

1. **A lean core, with everything else added when a project needs it.** Any MetaLab designer or developer can contribute something new without making every project heavier.
2. **A prototype viewer** that presents prototypes to clients, hosted on MetaLab Sites. It's the first big add-on, and the test of the add-on idea.

## Part 1: lean core plus add-ons

Think of a kitchen: the basics are in the drawers, and the specialty gadgets stay in the shop until you need one.

### What stays in the core

Every project needs these, so they stay:

- The component library (`packages/ui`) with its colour, type and spacing settings. Only the parts a page uses end up in the finished site, so a big library costs nothing extra.
- The guardrails: lint rules, accessibility checks, the drift test.
- Storybook.
- `CLAUDE.md` and the setup skills (`env-setup`, `engagement-setup`).

### What becomes an add-on

| Add-on                                 | What it brings                                                       |
| -------------------------------------- | -------------------------------------------------------------------- |
| Page templates (each, or small groups) | The page file, its stories and pictures                              |
| `explorations`                         | The explorations folder, its commands and build-server steps         |
| `prototype-viewer`                     | The viewer (Part 2). Needs `explorations`                            |
| `visual-checkpoints`                   | The `look` commands and their skill                                  |
| `screencast`                           | The screencast skill and tools                                       |
| `code-to-figma`                        | The Figma sync skill                                                 |
| `charts`, `data-table`                 | Components with heavy outside packages (for example a chart library) |

Rule of thumb: if most projects use it, it's core. If it brings a heavy outside package, or only some projects need it, it's an add-on.

### What an add-on is

One folder in the catalog, with a small description file (`addon.json`) and the files it brings:

```
add-ons/
  prototype-viewer/
    addon.json         ← name, description, owner, version, what it needs
    files/             ← copied into the project
    skill/SKILL.md     ← teaches Claude how to use it
    claude.md          ← a few lines added to the project's CLAUDE.md
```

`addon.json` lists:

- **What it is:** name, one-line description, owner, version.
- **Files:** the files to copy, and where each one goes.
- **Packages:** any outside packages it needs.
- **Other add-ons it needs:** for example, the viewer needs `explorations`.
- **Commands:** shortcuts to add to `package.json`.
- **Build-server steps** (GitHub workflow files).
- **Its Claude skill** and its `CLAUDE.md` lines.

The format follows the shadcn registry, a widely used standard that Claude already understands, rather than inventing our own. Anything shadcn doesn't cover (build-server steps, `CLAUDE.md` lines, skills) goes in an extra section of the file.

### The command

```bash
pnpm addon list                     # what's available, and what's installed
pnpm addon add prototype-viewer     # adds it (and anything it needs)
pnpm addon remove screencast        # takes it out cleanly
pnpm addon new my-thing             # starts a new add-on to contribute
```

A small file in the project, `addons.lock.json`, records what's installed and which version. Remove and (later) update rely on it.

### How Claude knows what to do

- **`CLAUDE.md` gets one rule:** "Before building something, check `pnpm addon list`. If a task needs an add-on that isn't installed, say which one and add it."
- **A core skill, `add-ons`,** explains the command and when to suggest an add-on.
- **Each add-on brings its own skill.** So once the viewer is added, Claude knows how to use it, and a project that never adds it never carries those instructions.

So a designer who says "show this to the client" never needs to know add-ons exist. Claude notices the viewer is missing, adds it, and carries on.

### Where the catalog lives

- **First:** a folder in this starter repo (`add-ons/`), so it's reviewed like everything else.
  - When a client project is created from the template, the `engagement-setup` skill deletes the folder. It already has a "prune" step for this.
  - After that, `pnpm addon add` fetches add-ons from the starter repo through `gh`, which designers already have signed in.
- **Later, if useful:** publish the catalog to a private MetaLab Sites address. That address would also hold a browsable gallery of every add-on, like a Storybook of everything you could add.

### Contributing an add-on

This is what lets other designers add to the starter without adding bloat.

1. `pnpm addon new my-thing` creates the folder with a filled-in `addon.json`.
2. Build it in a project or an exploration, then move the files in.
3. The checks must pass:
   - It installs and removes cleanly in a fresh starter.
   - Its stories and accessibility checks pass.
   - It has an owner, a one-line description and a preview.
   - It contains no client names or client content.
4. Review, then it joins the catalog. Nothing changes for projects that don't add it.

## Part 2: the prototype viewer

Based on the prototype template Marcus Brown made ([sites.metalab.com/marcus-brown/prototype-template-wip](https://sites.metalab.com/marcus-brown/prototype-template-wip/)). We should bring Marcus in as a partner or reviewer: it's their design, and they know what clients responded to.

### What the viewer keeps from Marcus's template

- **Device frames:** a phone frame (iPhone, Android or none), and a browser window for desktop.
- **Rounds:** the work shared with the client each week or so, each with a name, date and a line on what changed.
- **Numbered notes:** dots on parts of the screen, each joined to a short note beside it.
- **Getting around:** arrows, swiping, and a zoomed-out view of every screen.
- **Settings and dark mode:** skip the intro, change the background colour, pick the device.

### What changes

In Marcus's template, the prototype and the presentation are built as one piece, so each project rebuilds it by hand. The viewer separates them:

- **The viewer is one site** in the client's Sites project: `sites.metalab.com/<project>/present/`. The build server publishes it, the same way it already publishes Storybook. Nobody installs or uploads anything.
- **Prototypes are explorations.** Each one is already its own site in the project. A prototype can add an "about card" (`prototype.json`):
  - its name and description
  - phone or desktop
  - its screens
  - its notes
- **Notes are pinned with a tag.** The designer adds `data-note="header"` to the part of the screen a note belongs to. Notes don't break when the design moves.
- **Clickable flows:** a small helper lets a prototype tell the viewer "go to the checkout screen".

### How prototypes get into the viewer

1. **Every prototype in the repo is listed automatically.** The build server already knows every exploration, so each time it publishes, it hands the viewer a fresh list. There's no sync step and no key on anyone's laptop.
2. **Designers choose what the client sees.** A MetaLab person who opens the viewer sees every prototype, each with a "show to client" switch, a way to set the order, and a way to group prototypes into rounds. Their choices are saved in the viewer site's own small database on Sites, so nothing is re-uploaded.
3. **Clients see only the clean presentation.** The viewer tells staff and guests apart through Sites' sign-in. Staff have MetaLab emails; clients are invited guests.
4. **Claude can do the choosing too.** For example: "show onboarding and checkout to the client, hide the rest". It does this through the Sites connection, which the starter lists so Claude asks once to connect. The designer signs in with their normal MetaLab login; no key to copy.

### Access

The client must be able to open the viewer **and** every prototype shown in it. Otherwise they hit a sign-in screen inside the phone frame.

- The engagement lead invites the client's emails once. This becomes a new step in `engagement-setup`.
- The build server keeps the access of the shown prototypes in line with the viewer's.

### What a designer does

- **First time:** open the project in Claude and say "set me up". The existing `env-setup` skill does the rest, plus one MetaLab sign-in.
- **After that:** just talk to Claude.
  - "Make a prototype of the onboarding flow."
  - "Add notes to the sign-up screen."
  - "Show it to the client."

  Prototypes reach the viewer whenever work is merged.

## Test results (6 Nov 2026)

Tested with two throwaway sites, `christian-poschmann/viewer-test-a` (a viewer stand-in with a frame) and `viewer-test-b` (a prototype stand-in). Both are staff-only.

| #   | Question                                                   | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Can a signed-in MetaLab person save choices from the page? | **Yes.** The page saved a choice, and Sites stamped it with the person's email. The page also knew who was viewing. Staff are told apart by their `@metalab.com` email: an invited guest carries the same `tenant` as staff.                                                                                                                                                                                                                                                                                  |
| 1b  | Can a client read the saved choices?                       | **Yes, and they can't change them.** With the test site briefly made public, a signed-out visitor got a short-lived visitor pass from Sites and read both saved choices. Their attempt to save was refused, because the site only lets editors save (`db_write_policy: editors`). An invited guest is signed in, so they should get at least the same. The site went back to staff-only straight after.                                                                                                       |
| 2   | Do saved choices survive a republish?                      | **Yes.** After republishing, the site kept its number and both saved choices.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 3   | Can Claude's Sites connection save choices?                | **Yes.** Saved as the signed-in person, so Claude can flip "show to client" switches for a designer.                                                                                                                                                                                                                                                                                                                                                                                                          |
| 4   | Can we list every site in a project?                       | **Yes, through a member's login** (it listed the project's `storybook` site). Changing who can view a site is also possible through the connection. The shared project key itself wasn't tested: it lives only in GitHub's secret store.                                                                                                                                                                                                                                                                      |
| 5   | Do frames work, and what about guests?                     | **Frames work.** Sites in the same project share one address, so the viewer can show a prototype in a frame, read inside it (useful for pinning notes), and receive "go to screen" messages from it. **Each site checks access on its own**, so a client must be allowed on every prototype shown, not just the viewer. The build server should copy the viewer's guest list onto shown prototypes. Sites also offers a **company** access option, which may be simpler than listing guest emails one by one. |
| 6   | Does the shadcn format have room for our extras?           | **Yes.** Each item has a free-form `meta` section, and each file can name where it goes in the project (`target`). That covers skills and build-server files.                                                                                                                                                                                                                                                                                                                                                 |
| 7   | Is Marcus happy for us to build on their template?         | **Yes.** Marcus gave their blessing (confirmed by Christian, 6 Nov 2026). Keep crediting them and invite them to review the viewer.                                                                                                                                                                                                                                                                                                                                                                           |

All questions are answered. Ready to build.

## Build order

Each step is its own local branch on top of the current stack (`stack/11-…`, `stack/12-…`), committed locally like the rest.

1. **Tests:** done (see Test results).
2. **The add-on command and format:** done on `stack/12-addons` (`docs/adr/0009`).
   - Build `pnpm addon list / add / remove` and the lock file.
   - Prove it by turning two existing things into add-ons: `visual-checkpoints` and `explorations`.
   - Add the build-server check that every add-on installs and removes cleanly.
3. **Slim the core:** done on `stack/13-slim-core`. Client projects can drop the catalog folder since `stack/16` (the catalog then comes from the starter repo).
   - Move the page templates and the optional tools into the catalog.
   - Add the catalog cleanup to `engagement-setup`.
   - Add the `CLAUDE.md` rule and the `add-ons` skill.
4. **Viewer, first version:** done on `stack/14-viewer`, as the `prototype-viewer` add-on.
   - Marcus's template is used as they made it (`explorations/present/marcus/`), with their sample app swapped for a live
     prototype in a frame. The phone frame, step bar, zoomed-out view, settings, dark mode, swiping and arrows all came
     with it.
   - The list of prototypes is built from every exploration with a `prototype.json`, and the viewer is rebuilt whenever
     any exploration changes (`"sites": {"rebuildOnAnyChange": true}`).
   - Staff see a show-to-client switch per prototype and a Client View setting; clients see only what is switched on.
     Rounds and order are saved too, but only Claude sets them for now (through the Sites connection).
   - `pnpm new-prototype <name>` and `pnpm present` (the viewer on your own computer).
   - Tried on Sites: staff are recognised and their switches save and reload. Not yet tried: a client opening it.
5. **Viewer, full version:** mostly done on `stack/15-viewer-polish`.
   - Done: numbered notes, screen notes and the pointer hints, written per screen in `prototype.json` and pinned with
     `data-note`. Marcus's scripts for them run unchanged.
   - Done: setting rounds and order from the panel (drag, or arrow keys; add and rename rounds).
   - Done: the desktop frame, tried with a temporary desktop prototype (labels show on hover there, as Marcus made them).
   - Done on `stack/17-guest-list`: Claude copies the viewer's guests onto shown prototypes and makes hidden ones
     staff-only (the build server can't: Sites only lets a person's login change access). Not yet run live.
   - Done on `stack/18-comments`: pinned comments with replies, emoji reactions and resolve, live for everyone
     looking. Tried on Sites as staff (live updates included); not yet with a client.
   - **Its own repo? Not yet** (decided 2026-11-06). It still leans on the starter (the explorations add-on, publishing,
     `@repo/ui`) and changes too fast for two repos to stay in step, and anyone can already improve it through the
     add-on's folder. It is kept movable instead: everything it brings is in its add-on, nothing outside depends on it,
     and its README lists what it needs from the project. Move it when one of these happens:
     - a team outside the starter wants to use it;
     - viewer changes keep waiting on starter releases;
     - someone (Marcus, say) wants to own it.

     Moving it means a new repo holding the add-on, and teaching `pnpm addon` that an add-on can come from its own repo
     (today a project has one source for all of them, in `addons.lock.json`).
6. **Contributing:** `pnpm addon new`, the contribution checks, and a short guide.
7. **Updates:** done on `stack/16-addon-update`. `pnpm addon update` pulls newer add-on versions into a project from the
   starter repo, keeping anything the project changed (the new version goes beside it), and projects without an
   `add-ons/` folder read the catalog from the starter repo. It works once the add-ons are on the starter's main branch.
8. **Later:**
   - a hosted add-on gallery
   - a "follow me" mode for live calls
