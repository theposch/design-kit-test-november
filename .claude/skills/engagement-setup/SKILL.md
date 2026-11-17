---
name: engagement-setup
description:
  Walk through the one-time, per-engagement setup of a repo generated from this template — local env, rename, branch protection,
  palette, modes, type, prune, Metalab Sites, Dependabot security PRs. Use when starting a new engagement, or to check which
  setup steps remain.
---

# Engagement setup

One-time walkthrough, run by whoever is standing the engagement up. The steps' actual content — file locations, click-paths,
rationale — lives in the README under "Per-engagement checklist" and (when the `explorations` add-on is installed) in `explorations/README.md` under "Setup (once per
engagement)"; read both before starting. This file is only the choreography. Adding components is deliberately not part of the
checklist or this walkthrough: that's the steady-state workflow CLAUDE.md already owns.

## Shape

Interview-then-execute. Probe current state, show one status table, then take the unfinished steps one at a time: ask the
decision (one question per message), make the change yourself, verify, commit. Never tell the human to edit a file by hand —
the only work handed to them is what genuinely requires them (interactive logins, minting tokens on dashboards), passed along
with the `!`-prefix trick (`! gh auth login` runs in-session so the result lands in the conversation).

**"Skip / not decided yet" is a first-class answer for every step.** Real engagements start before design tokens exist. Record
deferrals in the closing summary and move on; the next run's probes surface them again — that's the whole memory model.

## 0. Environment first

Load and run the `env-setup` skill before anything else. Every step below verifies itself with `pnpm lint`/`pnpm test`, which
needs a working toolchain, and the GitHub-side steps need an authed `gh` (with admin on this repo — check, and fall back to the
README's UI click-paths when it's missing).

## 1. Probe

The repo is the state — there is no state file. "Untouched" means unchanged from the starter: compare against the
starter's tip (`git diff starter/main -- <file>` when a `starter` remote exists, otherwise the first commit). Don't count
commits: a copy made with `git clone` keeps the starter's whole history.

**Origin before anything.** Run `git remote -v` first. If `origin` points at the starter (its GitHub address, or a folder
on this computer), a plain `git push` would write into the starter. Rename it at once, before any other step:
`git remote rename origin starter`. Then ask for the project's own repository address and add it as `origin`, or leave
none for now (the `.husky/pre-push` guard refuses pushes to a local folder either way).
Once `origin` is the project's own, and the `project-notebook` add-on is installed, ask whether this computer has a
notebook for the project and link it: `pnpm notebook link <notebook name>` (it refuses the starter's address).

**No GitHub repository yet** is a normal start. Steps 2, 7 (GitHub half) and 8 need one: mark them "waiting on a repo"
and commit locally without pushing until it exists.

| Step             | Signal                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| 1 Rename         | root `package.json` name still `zero-design-kit`; `@repo/` scope; repo name (`gh repo view`) |
| 2 Protect main   | `gh api repos/{owner}/{repo}/rulesets` shows no ruleset targeting the default branch              |
| 3 Palette        | `packages/ui/src/theme/palette.css` untouched since the initial commit                            |
| 4 Modes          | `.dark` block still in `palette.css` (present = dual-mode chosen *or* undecided — ask which)      |
| 5 Type           | `theme/font.css` / `theme/typography.css` untouched; Geist still referenced                       |
| 6 Prune          | `pnpm addon list` — every add-on still installed means nothing pruned yet; otherwise ask           |
| 7 Sites          | `sites.json` slug still `design-in-code-starter`; `gh secret list` lacks `SITES_PROJECT_TOKEN` |
| 8 Dependabot     | `gh api repos/{owner}/{repo}/automated-security-fixes` reports `enabled: false`                   |
| 9 Figma          | `figma.json` (when a Figma add-on is installed) still has empty `files`                          |
| 10 Screen sizes  | no `project.json` at the root, or it has no `screens`                                            |

## 2. Execute — code first, GitHub last

Branch protection blocks direct pushes the moment it lands, so every code-touching step runs before it. One Conventional Commit
per completed step, pushed to `main` once the project has its own `origin` (subject ≤ 50 chars; pre-commit runs typecheck/lint/format). Order:

1. **Rename** (item 1) — repo name, `@repo/*` scope, the `frontend` placeholder; each is a separate keep-or-rename decision.
   If `claude-design.json` is there, it's the starter's: set `title` to the project's name and `repo` to the project's
   `origin` (`github.com/org/name`), and remove `url`, so nobody publishes over the starter's design system.
2. **Screen sizes** (item 10) — which sizes does the product have: phone, tablet, desktop, or some of them? Some apps are
   phone only, some tools desktop only, and building or checking a size nobody asked for is wasted work. If `pnpm notebook`
   finds a notebook, look in `brief.md` and `decisions.md` for the platform (an iOS app, a web dashboard) and suggest an
   answer, naming the decision; the person confirms it. Write `project.json` at the root:
   `{ "screens": ["phone"] }`. If the designer draws a phone at a size other than 390×844 (402×874, say), add
   `"sizes": { "phone": { "width": 402, "height": 874 } }`, so Storybook, `pnpm look:compare` and the Figma checks use the
   designer's frame. A phone must stay under 768 wide, a tablet 768–1023, a desktop 1024 or more.
3. **Pick modes** (item 4) — before the palette, so a single-mode decision saves authoring dark values at all.
4. **Set the palette** (item 3) — load the `configuring-tailwind` skill first. Ask for the source: Figma, pasted token values,
   or defer. The palette is written in oklch; `pnpm palette:convert '#1a1f2e' 'rgba(255,255,255,0.2)'` turns hex or rgb
   values into it.
5. **Set type** (item 5) — same skill, same source question. The typography composites must stay mirrored in `lib/utils.ts`;
   a unit test fails until they do. Font files the project owns go in `packages/ui/src/theme/fonts/` with `@font-face`
   rules in `font.css` (it has an example); when Geist is no longer used, remove `@import '@fontsource-variable/geist'`
   from `globals.css` and the package from `packages/ui/package.json`. Type changes restyle every component, so with
   `visual-checkpoints` installed, save a checkpoint first (`pnpm look:save`) and run `pnpm look:compare` after, and
   report what moved. Turning on text trimming especially tightens text against its neighbours.
6. **Prune** (item 6) — first add-ons: show `pnpm addon list` and ask which to keep, in groups (page templates the product
   will need, explorations and the prototype tools, screencasts, Figma sync). `pnpm addon remove` the rest; anything removed can
   come back later with `pnpm addon add`. Then walk the README's deletable list; it includes this skill itself once every step
   here is done.
7. **Figma** (item 9, only when `figma-check` or `figma-to-code` is installed) — ask for the design file's link and,
   if there is one, the library file's. Ask which side leads: `figma-first` (we build from the design) or `code-first`
   (code leads, Figma follows). Write the answers into `figma.json` (`files.design`, `files.library`, `direction`). No
   file yet: leave it empty and record the deferral. Then check the figma-console MCP is there (`figma_get_status`);
   if not, set it up with the `figma-check` skill's `setup.md`.
8. **Sites slug** (item 7, code half) — the human creates the project on the Sites dashboard; you write the slug into
   `sites.json`. Wiring Sites enables both the canonical Storybook deploy and exploration deploys.

After the theme steps (3–5), run `pnpm test` before committing — a11y contrast failures against a new palette should surface
here, not in CI.

Then the GitHub side, last:

9. **Protect main** (item 2) — `gh api --method POST repos/{owner}/{repo}/rulesets --input .github/rulesets/protect-main.json`
   (the file is the exact API payload). Verify by listing rulesets. No admin `gh`? Hand over the README's import click-path.
10. **Sites secret** (item 7, GitHub half) — the human mints the project token on the dashboard, then runs
   `! gh secret set SITES_PROJECT_TOKEN` so the value goes into gh's own prompt, never the chat. Fallback: repo Settings →
   Secrets and variables → Actions.
   If the `prototype-viewer` add-on is installed, its skill's **Client access** section has the one-time Sites step for
   the client (inviting them to the viewer, and letting them comment).
11. **Dependabot security PRs** (item 8) — `gh api --method PUT repos/{owner}/{repo}/vulnerability-alerts`, then the same for
   `automated-security-fixes`. Version updates need no toggle — `.github/dependabot.yml` ships with the template. No admin
   `gh`? Hand over the README's click-path.

## 3. Close

- Full verification: `pnpm lint && pnpm typecheck && pnpm test`.
- Summarize done vs deferred, with what unblocks each deferral (e.g. "palette: waiting on tokens — re-run this skill when they
  land").
- Hand off: setup is over; day-to-day component work — Base UI wrappers, tiers, tokens, stories — is CLAUDE.md's territory.
