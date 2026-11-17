---
name: screencast
description:
  Produce a short Loom-style screencast — a scripted screen recording with an AI voiceover — of anything in this repo:
  Storybook, the demo app, a terminal workflow, an exploration. Use when asked to make a video, demo, tour, or walkthrough,
  or to refresh an existing one (the README's repo tour, docs/repo-tour.mp4, is one product of this flow).
---

# Screencasts

Fully AI-produced videos, no human recording: script → per-beat TTS voiceover (its measured durations drive every scene
length) → Playwright-filmed scenes of real running surfaces → ffmpeg assembly. Working files live in the session scratchpad;
only the deliverables land in the repo.

## 0. Shape the video first

Interview the user, or confirm what's already specified — don't produce anything until the script is approved verbatim:

- **Subject and audience** — what should the viewer understand or believe when it ends?
- **Beats** — one idea per ~10s beat; ~150 words ≈ 55s of narration at the default voice's pace. 30–90s is the sweet spot.
- **Deliverable** — default `docs/<slug>.mp4`. Refreshing an existing video means reusing its slug (the repo tour is
  `repo-tour`). Inline README playback comes from a GitHub drag-and-drop attachment that only a human can create in the web
  editor — after refreshing an embedded video, remind the user to re-upload it there.

Rules that outrank any script draft:

- The voiceover must never claim something the screen doesn't show at that moment.
- If a beat needs footage that doesn't exist (a story, a page, a flow), build the real thing first — and it must pass the
  full gate like any other change. Mind that a11y runs at `error`: demo stories must respect text contrast (e.g. token
  swatches must not carry sample text on borderline pairs).
- Terminal footage is curated real output: run the command, keep the honest lines, drop noise (`.npmrc` warnings, install
  spew). Never invent output.

## Prerequisites

- `ffmpeg` on PATH, and `uvx edge-tts` (no API key).
- Playwright: import `chromium` from `packages/ui/node_modules/playwright/index.mjs` (absolute path in scripts).
- Whatever surface is being filmed, running locally: `pnpm storybook` (:6006), `pnpm dev` (demo app),
  `pnpm --filter @explorations/<name> dev`, or this skill's terminal stage. A busy port usually means an instance is already
  up — filming is read-only, so use it.

## 1. Voiceover

- One clip per beat: `uvx edge-tts --voice en-US-AndrewNeural --text "…" --write-media beatN.mp3`
- Spell awkward tokens phonetically for the TTS input only ("pnpm" → "P N P M"); the display script keeps the real spelling.
- `ffprobe` each clip's duration. Scene length = 0.5s lead + VO + 0.5s tail (1.0s tail on the final scene).
- When a cut must land on a spoken word, `--write-subtitles` yields sentence-level cues; interpolate within a sentence by
  word count. Word-level events are unreliable in the CLI.

## 2. Film

Copy `assets/film-helpers.mjs` and `assets/terminal.html` from this skill into the scratchpad, then write a `film.mjs` that
imports the helpers: one recording context per scene at 1920×1080, choreography scheduled on a `Clock`, context closed the
moment the clock runs out. Recon before trusting any selector — screenshot every page you plan to film and Read the image;
what a page looks like is never safe to assume.

Terminal beats replay real output on the terminal stage: capture the command's output, curate the lines, and drive
`terminal.html` with `__run({ cmd, lines, prompt, title })`. Set `prompt` to the project's name (the `name` in the root
`package.json`), so the terminal shows this project, not the starter.

### If filming Storybook

Hard-won selector knowledge — verify against the live instance (`curl -s localhost:6006/index.json` for story ids), but
expect these to hold:

- Sidebar **group headers navigate** (to the group's Docs) instead of just expanding. To pre-expand, click the section
  header's `button[aria-label="Expand all"]`. Collapsed items are not in the DOM.
- Docs pages theme through a decorator that only runs when a story renders — a story-less docs page can never go dark. For
  dark docs footage use a docs page that contains stories.
- `&globals=theme:Dark` works on story views. The toolbar switcher is a one-click toggle: `[role="toolbar"] button` with
  text matching /theme/i. Locating "theme" without the toolbar scope hits the sidebar THEME group instead.
- Hide the "Storybook x.y" promo box before filming (`hidePromo` in the helpers).
- `pnpm test` at the root may be a turbo **cache hit** ("replaying logs") — film `pnpm --filter @repo/ui test`. Per-test ✓
  lines only print under a TTY: capture with `script -q out.raw <cmd>`, then strip ANSI.
- Controls live-edit: a string control is `textarea[name="<prop>"]`; select-all is `ControlOrMeta+a`.
- The a11y addons tab is `div[id$="tab-storybook/a11y/panel"]`; its subtabs are real `button[role="tab"]`s.

### If filming the demo app or an exploration

Same recon rule. These are plain Vite apps — no manager chrome, so the whole viewport is yours; check what port the dev
server actually printed before pointing Playwright at it.

## 3. QA — non-negotiable

Extract frames from every scene's trim window (`ffmpeg -ss … -frames:v 1`) and actually look at them with Read. Verify the
right thing is on screen at each VO moment, the cursor is visible, mode flips happened, and no stray UI noise crept in.
Re-record single scenes as needed (`node film.mjs <scene>` — the helpers' recorder honors an argv scene filter).

## 4. Assemble

- Trim keeps the **last** target-seconds of each recording — load/settle noise sits at the front, and the 0.5s lead is a
  static hold so ±0.3s of drift is invisible:
  `ffmpeg -i sN.webm -ss $(dur - target) -t target -r 30 -c:v libx264 -crf 19 -pix_fmt yuv420p -an clipN.mp4`
- Concat with the concat demuxer (`-c copy`). Then recompute VO offsets from the **actual** clip durations (cumulative scene
  start + 0.5s) — frame rounding shaves a few hundredths per clip.
- Audio: `anullsrc` base at total length, one `adelay=<ms>|<ms>` per beat, `amix=inputs=N:normalize=0:duration=first`, AAC
  192k. Sanity-check with `volumedetect` (mean ≈ −20 dB, peak < −1 dB).
- Mux `-c copy -movflags +faststart` → `docs/<slug>.mp4`, then spot-check frames at beat boundaries in the final file.

## Cleanup

Leave the user's dev servers running. If anything was scaffolded just for footage (e.g. a throwaway exploration), delete it
and `pnpm install` to restore the lockfile. `git status` must end clean apart from the intended deliverables.
