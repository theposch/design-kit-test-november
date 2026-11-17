---
name: code-to-figma
description:
  Interactive walkthrough for migrating or updating `@repo/ui` components into a hand-authored Figma library via the
  figma-console MCP — either one component at a time with sign-off, or by maintaining a local migration doc that /loop runs
  autonomously. Invoked explicitly with /code-to-figma.
---

# Code → Figma

Rebuilds the component library as a hand-authored Figma library: real variants, real component properties, variable-driven
modes — never screenshot dumps. Code is the source of truth; Figma is a curated translation of it.

This file is only the interactive choreography. The actual process lives in two sibling files, single-sourced so both this
walkthrough and unattended loop iterations run the identical procedure:

- `component-loop.md` — philosophy, per-session ground truth, and the measure → translate → build → verify → describe loop.
- `figma-gotchas.md` — Figma plugin API traps; required reading before any `figma_execute`.

State lives in `.claude/code-to-figma.local.md` (the "ledger"). It is per-person and gitignored (`*.local.md`) — never commit
it. It doubles as the `/loop` prompt: its bootstrap section reads the two files above directly and never this one, so the
walkthrough below stays out of unattended context.

## Preflight — every run

1. **Bridge**: `figma_get_status` (with probe). No such tool: the figma-console MCP isn't installed or running; set it up
   with the `figma-check` skill's `setup.md`, then come back. If the Desktop Bridge isn't connected, walk the user through it: Figma Desktop
   open → the engagement's Figma file focused → `Plugins → Development → Figma Desktop Bridge`. There is no fallback path —
   without the bridge, stop. (The official Figma MCP is not a substitute; this process requires the raw plugin API.)
2. **Right file**: read `figma.json`. The open file's key must match `files.library` (the key is the part after
   `/design/` or `/file/` in the link). Stop, change nothing, and say why when:
   - `files.library` is empty: ask for the library's link and write it there first;
   - the open file is `files.design` or its `readFrom` copy: that's the client's file, never written to;
   - the open file is anything else: ask the person to open the library.
   Then lock onto it (`figma_navigate` with `lock: true`), since other sessions' bridges can switch files.
3. **Restore point**: before the first write of a run, `figma.saveVersionHistoryAsync('code-to-figma: <rows>')` through
   `figma_execute`. If it fails, write nothing and report the plan only. Never publish the library: a person reviews it in
   Figma's publish dialog.
4. **Storybook**: check `http://localhost:6006` responds; if not, start `pnpm storybook` in the background and wait for it.
   Measurement always runs against the local checkout — never a deployed Storybook, which can lag the code the ledger's SHAs
   point at.
5. **Recordable SHA**: note `git rev-parse HEAD` and whether the tree is dirty. A dirty tree is allowed but gets flagged in
   the row's notes — a synced SHA is only trustworthy when it actually describes what was measured.

## First run — interview, then census

No ledger file yet means first run. Ask, one question per message:

1. **Figma library link**, if `figma.json` has none. Never offer the focused file as the default: it may be the
   client's design file.
2. **Review-backlog cap** — how many `built, pending review` rows may pile up before an unattended loop stops and asks for
   review. "Uncapped" is a valid answer.

Then build the census and write the ledger from the template below:

- **Phase rows first**: `Tokens — variables & modes`, `Text styles`, `Icons` (see `component-loop.md` § Tokens & foundations).
  Nothing else is buildable before variables exist, so they head the queue like any other rows.
- **One row per component file** under `packages/ui/src/components/`, ordered atoms → molecules → organisms and leaf-first
  within a tier (a component never precedes something it nests). The parts of a compound component (`Dialog.Popup`, …) build as
  their own Figma components inside their file's row — one row = one page = one review.
- **Cross-check** `src/index.ts` exports against Storybook's `/index.json`. Exported but story-less → `blocked: no story`
  (it can't be measured, and by this repo's definition of done it isn't finished). Hooks and non-visual exports get no row.
- **Propose exclusions** for anything matching the three curation categories in `component-loop.md` — one at a time, with the
  written rationale — and record only what the user confirms. Census runs only here in the walkthrough, so every exclusion is
  human-confirmed.

## Steady state — status, then one question

Ledger exists: print a one-line-per-status summary (todo / built, pending review / signed off / excluded / blocked /
needs re-check / stale), then ask what to do now. Offer only the branches the state supports:

- **Migrate or update a component now** — run `component-loop.md` on the named row. Show the result in-session and ask for
  sign-off: yes → `signed off`; no → capture what's wrong in notes, status back to `todo`. This is the only path that may
  mark `signed off`.
- **Review pending work** — walk the `built, pending review` rows one at a time: open the page, show a screenshot, ask.
  Kick-backs go to `todo` with notes, and every built row that nests the rejected component flips to `needs re-check`
  (instances inherit master fixes, so a re-check is usually a re-verify, not a rebuild).
- **Refresh the census** — re-run the census against the current checkout: new components get rows, removed ones are flagged,
  and any built row whose files (or `packages/ui/src/theme/`) changed since its synced SHA is marked stale
  (`git log <sha>..HEAD -- <paths>`).
- **Prep the loop** — verify the doc is current (offer a census refresh if it isn't), confirm the backlog cap, then hand over
  the exact line to run: `/loop @.claude/code-to-figma.local.md`. Never start the loop yourself.

## Ledger statuses

`todo` · `built, pending review` · `signed off` · `excluded: <reason>` · `blocked: no story` · `needs re-check` — plus a
`stale` flag on any built/signed-off row whose code has moved since its synced SHA. Rows record: name, tier, status, synced
SHA, date, notes. Gaps (real visuals documented in descriptions but not yet drawn) and exclusions each get a section under
the queue — rationales must survive there, revisitable later.

## Loop doc template

```markdown
# Code → Figma migration

Maintained by the `code-to-figma` skill. Per-person state — gitignored, never commit.

## Each iteration

You are one iteration of an unattended code→Figma migration loop. Do exactly one row of work:

1. Read `.claude/skills/code-to-figma/component-loop.md` and `.claude/skills/code-to-figma/figma-gotchas.md` and follow them
   exactly. Do NOT invoke the code-to-figma skill — that opens an interactive walkthrough, which is wrong here.
2. Preflight: `figma_get_status` shows the Desktop Bridge connected and the Figma file below focused; local Storybook is up
   (start `pnpm storybook` in the background if not). Any failure: stop the loop and report what's missing.
3. If the review-backlog cap below is set and the `built, pending review` count meets it, stop the loop and ask for a review
   pass. If no row is actionable, stop the loop and say so.
4. Take the FIRST actionable row: status `todo` or `needs re-check`, and every component it nests is at least `built`.
   Run the component loop on it.
5. Update the row — status `built, pending review` (or back to `built, pending review` after a re-check), synced SHA, date —
   and the Gaps/Exclusions sections. Never mark your own work `signed off`; only a human review does that.

## Engagement facts

- Figma file: <url>
- Modes: <from palette.css — light, dark by default>
- Review backlog cap: <uncapped | N>
- Storybook: local checkout only (`pnpm storybook`, http://localhost:6006)

## Queue

| # | Row | Tier | Status | Synced SHA | Date | Notes |
| - | --- | ---- | ------ | ---------- | ---- | ----- |

## Gaps

## Exclusions
```
