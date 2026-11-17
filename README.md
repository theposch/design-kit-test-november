# zero-design-kit

A Metalab engagement template for "design in code" client projects: a component library that designers and agents author directly in code, with the guardrails that keep that workable — a lint-enforced token contract, tiered components, stories as the only tests, and source-only distribution. Generate a repo from it, re-skin it, and start building components; the methodology is already wired.

https://github.com/user-attachments/assets/0683337e-f2e8-4419-a760-bcd636a475c7

_A quick intro to the repo. Script, footage, voiceover, and edit are all AI-made; regenerate it (or create a different video) with the `screencast` add-on's skill (`pnpm addon add screencast`)._

## Humans read this

1. Click **Use this template** on GitHub to generate the engagement repo — not a clone or fork, so you get a clean history.
2. Starting the engagement? Run `/engagement-setup` in Claude Code. It interviews you and does the rest — local env, rename, palette, modes, type, branch protection, Sites.
3. Joining one? Run `/env-setup` — toolchain, dependencies, browsers, `gh`, `sites`.
4. Pushing the library into Figma? Add the `code-to-figma` add-on (`pnpm addon add code-to-figma`) and run `/code-to-figma` — it rebuilds components as a hand-authored Figma library, one at a time with sign-off, or maintains a migration doc that `/loop` works through autonomously.

## More details for curious people or agents

### Stack

pnpm + Turborepo · React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · Base UI · Storybook 10 · Vitest 4 (browser mode via Playwright/Chromium) · ESLint 10 + Prettier · husky + commitlint · GitHub Actions

### Layout

- **`packages/ui`** — the component library (`@repo/ui`). Ships source-only; Storybook and the tests live here.
- **`apps/frontend`** — a minimal Vite SPA consuming `@repo/ui`, proving source-only consumption, Tailwind scanning of ui source, and the light/dark toggle end to end.
- **`add-ons/`** — the catalog of optional pieces (explorations, visual checkpoints, …). A project adds only what it needs with `pnpm addon add <name>`; `pnpm addon list` shows what's there (`docs/adr/0009`).
- **`packages/eslint-config`** — shared flat configs: `base`, `react`, `storybook`, and the `tailwindContract(entryPoint)` factory.
- **`packages/typescript-config`** — shared `base.json` / `react.json`.

### Local environment

What `/env-setup` runs for you, if you'd rather do it by hand. On a Mac that has never had developer tools, first
`xcode-select --install` (the Xcode Command Line Tools) and then [Homebrew](https://brew.sh); everything below assumes both.

```bash
mise trust && mise install   # node + pnpm at the pinned versions
pnpm install
pnpm --filter @repo/ui exec playwright install chromium   # browsers for story tests
pnpm storybook               # the component workshop, http://localhost:6006
pnpm dev                     # the demo app
pnpm test                    # unit + browser-mode story tests
pnpm lint && pnpm typecheck && pnpm build
```

Also recommended for everyone: an authed `gh` CLI (agents lean on it for PRs and CI logs). The `sites` CLI is opt-in — only people who publish exploration drafts need it (see the `explorations` add-on).

### Per-engagement checklist

`/engagement-setup` walks these; they're listed here as the reference it works from.

1. **Rename** — decide whether the `@repo/*` scope and the repo name survive; `frontend` is a placeholder app name.
2. **Protect `main`** — import `.github/rulesets/protect-main.json` at Settings → Rules → Rulesets → New ruleset → Import a ruleset. It requires squash-merged PRs with one approval and passing `ci` and `pr-title` checks, and blocks direct pushes, force pushes, and deletion (admins bypass via PR only). Import is one-way: later UI edits should be re-exported back to the file.
3. **Set the palette** — replace the neutral placeholder values in `packages/ui/src/theme/palette.css` with the engagement's tokens (light on `:root`, dark under `.dark`). Load the `configuring-tailwind` skill first.
4. **Pick modes** — this starter ships light + dark at the token level. A single-mode engagement deletes the `.dark` block and the Storybook theme switcher; components never change either way.
5. **Set type** — swap Geist and the scale in `theme/font.css` / `theme/typography.css`. Keep the composites in sync with `lib/utils.ts` (a unit test guards this).
6. **Prune** — add-ons the engagement won't use (`pnpm addon list`, then `pnpm addon remove <name>`: page-template groups, explorations, screencasts, …), the comment-hygiene lint rule, the demo app's copy, any partial you don't need, and the `engagement-setup` skill itself once every step here is done are all deletable.
7. **Wire Metalab Sites (optional)** — to enable the Storybook deploy and exploration deploys, create a project on the [Sites dashboard](https://sites.metalab.com) ("New Project", with write access for the team), set its slug in `sites.json` at the repo root, and on the project page mint a project token and add it as the `SITES_PROJECT_TOKEN` repo secret. Once wired, every green push to main publishes the library's Storybook to `https://sites.metalab.com/<project>/storybook/`, and every PR gets a `pr-<n>-storybook` preview linked from a comment on the PR (deleted when the PR closes — `docs/adr/0008`); until then, CI skips deploys.
8. **Enable Dependabot security PRs** — version updates need no toggle (`.github/dependabot.yml` ships with the template), but alerts and security-fix PRs are repo settings: `gh api --method PUT repos/{owner}/{repo}/vulnerability-alerts` then `gh api --method PUT repos/{owner}/{repo}/automated-security-fixes`. UI fallback: Settings → Advanced Security → enable Dependabot alerts and Dependabot security updates.

There is deliberately no "add components" step — that's the day-to-day workflow, not setup. CLAUDE.md owns it. The library ships with a full set of components to build on; Button, Dialog and SignInForm are the three to read first as the finished shape — a single control, a compound component, and an organism that holds its own state.

### Consuming `@repo/ui` from an app

The library has no build step — the consumer's bundler compiles `src/` directly. An app needs three things (see `apps/frontend` for all three):

1. `@import '@repo/ui/styles/globals'` in its entry CSS, plus an `@source` directive pointing at `packages/ui/src` so Tailwind scans the library source behind the workspace symlink.
2. A `paths` mirror of the `#` aliases in its tsconfig — the app's `tsc` compiles the ui source, and TypeScript won't extension-probe the wildcard `imports` targets the way Vite does.
3. `react`/`react-dom` ≥ 19 (peer deps).
