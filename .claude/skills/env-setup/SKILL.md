---
name: env-setup
description:
  Set up or repair one person's local dev environment for this repo — on macOS the Xcode Command Line Tools and Homebrew, then
  mise, dependencies, Playwright Chromium, the gh CLI, and (if they publish explorations) the Metalab sites CLI. Use when
  onboarding to the repo, after cloning, or when local tooling is broken (commands not found, story tests failing to launch a
  browser, exploration publishes failing).
---

# Local environment setup

Per-person, per-machine walkthrough. The canonical commands live in the README under "Local environment", and the `sites` CLI
steps live in `explorations/README.md` under "Setup (once per engagement)" when the `explorations` add-on is installed — read both; this file is only the choreography.
Every step is idempotent, so re-running this skill on a working machine is a harmless health check — treat "everything already
passes" as a valid, quick outcome.

## Rules

- **Probe first, then fix only what's missing.** Show the user one status table (ok / missing / can't tell) before changing
  anything.
- **Never silently install a tool.** Name the exact command, ask, then run. Prefer Homebrew on macOS; otherwise the tool's
  official installer.
- **Interactive logins belong to the human.** The agent cannot drive them. Tell the user to type the command with a `!` prefix
  (e.g. `! gh auth login`) so it runs in-session and the result lands in the conversation.
- If `node`/`pnpm` aren't on the agent shell's PATH even after mise is installed, prefix commands with `mise exec --` instead of
  fighting shell activation.

## Probes

| Check      | Signal                                                                                  |
| ---------- | --------------------------------------------------------------------------------------- |
| clt        | macOS only: `xcode-select -p` prints a path (`git` and compilers come from here)         |
| brew       | macOS only: `command -v brew`                                                            |
| mise       | `command -v mise`                                                                        |
| toolchain  | `mise exec -- node -v` and `mise exec -- pnpm -v` print the pinned versions. Report those, not `mise current`: pnpm comes from `packageManager` in `package.json`, so the pnpm that runs can differ from the one mise lists |
| deps       | `node_modules/` present; `pnpm install` reports up to date                               |
| browsers   | a `chromium-*` folder exists in Playwright's cache (`~/Library/Caches/ms-playwright` on macOS, `~/.cache/ms-playwright` on Linux). Don't use `--dry-run`: it prints a download address even when the browser is there |
| gh         | `command -v gh` and `gh auth status` succeeds                                            |
| sites CLI  | `command -v sites`; `SITES_TOKEN` set in the user's shell profile                        |

## Steps (in order, skipping whatever probed ok)

1. **Xcode Command Line Tools + Homebrew (macOS)** — the layer under mise: a machine that has never had developer tools has
   neither. If `xcode-select -p` fails, offer `xcode-select --install`; it opens a macOS dialog the human must click through,
   so wait for them to say it finished, then re-probe. If `brew` is missing, offer Homebrew's official installer
   (`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`) and, when it finishes,
   point out the "Next steps" `shellenv` lines it prints — without them the current shell can't see `brew`; run them before
   continuing. On Linux, skip this step.
2. **mise** — the one true bootstrap problem; everything after it is `mise install`. If missing, offer `brew install mise`
   (macOS) or `curl https://mise.run | sh`, and point out the shell-activation line the installer prints — without it, new
   shells won't see the tools.
3. **Toolchain + deps** — `mise trust && mise install`, then `pnpm install`.
4. **Browsers** — `pnpm --filter @repo/ui exec playwright install chromium` (story tests run in real Chromium; without this,
   `pnpm test` fails at launch).
5. **gh** — recommended for everyone, not just admins: agents lean on it for PRs, CI logs, and reviews. Offer `brew install gh`,
   then have the user run `! gh auth login`.
6. **sites CLI** — opt-in. Ask once whether this person will publish exploration drafts from this machine; unless they say
   yes, skip with a one-line note and move on. If they will: install and personal-token steps are in `explorations/README.md`
   (and if `sites.json` still carries the template's placeholder slug, say there is nothing to publish to yet —
   wiring it is `engagement-setup`'s job). The token is minted by the human on the Sites dashboard; offer to append the
   `export SITES_TOKEN=…` line to their shell profile rather than pasting the token anywhere else.
7. **Verify** — `pnpm lint && pnpm typecheck && pnpm test`, then report the status table again with everything green (or
   exactly what still isn't, and why).
