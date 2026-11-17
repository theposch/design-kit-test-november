---
name: add-ons
description:
  Find, add and remove the starter's optional pieces (page-template groups, explorations, visual checkpoints, screencasts,
  Figma sync, and more as people contribute them) with `pnpm addon`. Use when a task needs something that might be an
  add-on, when someone asks what's available, when pruning a new engagement, or when changing or contributing an add-on.
---

# Add-ons

The core is the component library, its guardrails, Storybook and the guides. Everything else is an add-on in `add-ons/`,
installed only where a project needs it (`docs/adr/0009`). People shouldn't have to know add-ons exist: notice when a task
needs one, say which in a line, add it, and carry on.

## Commands

```bash
pnpm addon list               # catalog, with ✓ for what's installed (--json for machines)
pnpm addon add <name...>      # adds it and anything it needs, runs pnpm install if packages changed
pnpm addon update [name...]   # brings installed add-ons up to the starter's latest (all, or the ones named)
pnpm addon remove <name...>   # takes it out; keeps files someone changed (--force deletes them)
pnpm addon check              # catalog valid, installed copies match, everything round-trips
```

## When a task needs one

- **Check first.** Before building a page, a tool or a workflow, run `pnpm addon list`. A page that matches a template group
  that isn't installed → add the group and start from its template. Publishing a prototype → `explorations`. Comparing
  screenshots → `visual-checkpoints`. A video → `screencast`. Figma → `code-to-figma`.
- **Say it in one line**, e.g. "The sign-in templates aren't installed; adding `templates-sign-in`." Then add it. No need to ask
  first unless the add-on brings new packages; then mention them.
- **Removing** is the person's call, except while pruning a new engagement with them (`engagement-setup`).

## Updating

`pnpm addon update` reads the newest add-ons from the starter repo (`source` in `addons.lock.json`; `--from <git url or
folder>` and `--ref <branch>` to point elsewhere). It replaces what nobody changed, leaves deleted files deleted, and for
a file someone changed keeps theirs and puts the new version beside it as `<file>.addon-update`. After an update, merge
each `.addon-update` file into its neighbour (keep the project's changes, take the add-on's improvements), delete it, and
tell the person what changed. `package.json` values someone changed are kept the same way, and listed.

## Changing an add-on

In the starter repo, each installed add-on's files also live in the catalog (`add-ons/<name>/files/<same path>`). Make every
change in both places, then run `pnpm addon add <name>` to refresh `addons.lock.json`, and `pnpm addon check`. Text between
`addon:<name>` markers in shared files (CLAUDE.md, `.gitignore`, `pnpm-workspace.yaml`) belongs to that add-on: change it in
the add-on's `addon.json` (`meta.blocks`) as well.

## Contributing a new add-on

1. Make a folder `add-ons/<name>/` (lowercase, hyphens) with an `addon.json` copied from a similar add-on. It follows the shadcn
   registry-item shape: `name`, `title`, a one-line `description`, `registryDependencies` (other add-ons it needs) and `files`
   (`path` inside the folder, `target` in the project). Our extras go in `meta`: `version`, `owner`, `packageJson` (scripts and
   packages to merge), `blocks` (text for shared files).
2. Put the files under `add-ons/<name>/files/` at the same paths they'll have in the project.
3. `pnpm addon add <name>`, try it, then `pnpm addon check`. Stories and a11y checks must pass like any other code.
4. No client names or client content in an add-on.
