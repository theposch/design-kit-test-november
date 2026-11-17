# Explorations

A convention-free lane for standalone experiments — design- or engineering-led. Each folder here is its own little app, published as its own [Metalab Site](https://sites.metalab.com). None of the library's rules apply in this folder (no component tiers, no token contract, no stories, no Prettier/ESLint) — see `docs/adr/0007`. The only repo-wide rule that still applies is the commit message format, e.g. `feat: add checkout-flow exploration`.

## Quickstart

```bash
pnpm new-exploration my-idea             # blank Vite + React + TS
pnpm new-exploration my-idea --with-ui   # same, with @repo/ui + tokens pre-wired

pnpm --filter @explorations/my-idea dev  # local dev server
pnpm publish-exploration my-idea         # publish your personal draft site
```

Open a PR when you want it verified, and merge when you want it live:

- **Draft site** — `pnpm publish-exploration <name>` publishes to `https://sites.metalab.com/<project>/<name>-<you>/` using your own token. Publish as often as you like; nothing else ever writes to it.
- **Canonical site** — merging to main deploys `https://sites.metalab.com/<project>/<name>/` via CI. This URL always reflects merged, verified work.

## The contract

Explorations can use any stack and ignore every library convention, but tooling relies on exactly this much:

1. The folder is a workspace package (the generator handles this) whose `build` script writes a static site to `dist/`.
2. The folder name doubles as the site name: lowercase letters, numbers, and hyphens (`^[a-z0-9-]+$`). Two shapes are reserved for CI: `storybook` (the library's Storybook deploy) and the `pr-<n>-` prefix (pull-request previews, which CI creates and deletes — `docs/adr/0008`).
3. Optional overrides via a `"sites"` field in the exploration's `package.json`:

```json
"sites": {
  "dist": "out",       // if your framework insists on another output dir
  "spaFallback": true  // serve index.html for unmatched routes (client-side routing)
}
```

CI builds only the explorations a PR touches — a broken exploration never blocks library work, and library PRs never wait on explorations. Adding a `typecheck` script to your exploration opts it into CI typechecking too.

Because explorations live in the pnpm workspace, they use the repo's pinned Node/pnpm, share the lockfile, and new dependencies must be at least 7 days old (`minimumReleaseAge`).

## Using `@repo/ui`

`--with-ui` pre-wires everything: the `workspace:*` dependency, the theme CSS import, the Tailwind `@source` scan, and the `#` alias mirror in tsconfig. To remove it later, delete the dependency and the `src/index.css` imports. To add it to a blank exploration, copy those pieces from `.templates/with-ui/`.

## Setup (once per engagement)

1. Create a project on the [Sites dashboard](https://sites.metalab.com) ("New Project") and set its **write access** so the team can publish drafts (write members, or "All Okta users").
2. Put the project slug in `sites.json` at the repo root: `{ "project": "<slug>" }`.
3. On the project page, mint a **project token** and add it to this repo as the `SITES_PROJECT_TOKEN` GitHub Actions secret (used only by CI for canonical deploys).
4. Each person publishing drafts installs the CLI and sets their own token once:

```bash
curl https://sites.metalab.com/install.sh | sh
export SITES_TOKEN=sites_...   # personal token from the dashboard
```

Until step 2 is done, CI skips deploys and `pnpm publish-exploration` explains what's missing.

The same project and token also serve the library's Storybook: every green push to main deploys it to `https://sites.metalab.com/<project>/storybook/`, and every pull request gets a `pr-<n>-storybook` preview (linked from a comment on the PR, deleted when it closes) — which is why those site names are reserved.

## Cleaning up

Nothing automated ever deletes an exploration's site (CI only retires its own `pr-<n>-*` previews). When an exploration is done, delete its folder **and** clean up its sites:

```bash
sites delete <name> --project <slug>          # the canonical site
sites delete <name>-<you> --project <slug>    # your draft, if you published one
```

(Or use the dashboard's disable toggle if you want the URL recoverable.)
