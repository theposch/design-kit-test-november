---
name: taste-review
description:
  A second, fresh Claude critiques a screen from pictures alone (hierarchy, spacing and rhythm, alignment, type, colour,
  balance, content) before a person sees it; the builder then fixes what it found. Use before showing a screen, page
  template or prototype to a designer or a client, when someone asks "does this look good?", "critique this" or "is this
  ready to show?", and after building a whole screen from Figma or from a template.
---

# Taste review

Lint, the a11y tests and the Figma checks say a screen is correct. None of them says it looks good. This skill gets a
second opinion from someone who wasn't there when it was built: a fresh Claude that sees only pictures of the screen and
a list of craft rules, the way a client sees it.

It is a review, not a gate. It runs when a screen is about to be shown, not on every change.

## When to use it

- A screen, page template or prototype is about to go in front of a designer or a client.
- Someone asks whether a screen looks good, or for a critique.
- A whole screen has just been built (from a template, from Figma, or from a description).

## When not to

- **A single component** (a button, a field): `review-component` covers those, and a lone atom has no layout to judge.
- **Contrast and labels**: the a11y tests already fail on those. The reviewer still says when one mode _looks_ weaker.
- **"Does it match the design?"**: that is `figma-to-code` and `pnpm figma:screen`. Taste review judges the screen on its
  own, with no design to compare with.
- **Explorations nobody will see yet.** Review when it's about to be shown.

## Commands

```bash
pnpm taste:shots <story id | part of a story title | http(s) address> […more]
pnpm taste:shots --list                 # every story it can photograph
pnpm taste:shots checkout --modes=light # one mode only (a single-mode project)
```

It photographs each target in light and dark at the project's screen sizes (`project.json`; all three when it doesn't
say) and prints the paths: `packages/ui/.taste/<name>/<size>-<mode>.png`. A long page is also saved in parts
(`…-part1.png`, `…-part2.png`) so its text stays readable. The folder is git-ignored, and each run replaces that
target's pictures.

- **A story**: part of its title is enough (`checkout`, `sign-in-card`, `"sign in/card"`). A page template is shot from
  its Phone, Tablet and Desktop stories; anything else is shot at every size. If several stories match, it lists them.
- **A running page** (a prototype from `pnpm present`, the product's app): give its full address, such as
  `http://localhost:4400/…`. Start it first. Dark is asked for through the browser's dark setting and the `.dark`
  class; a page that picks its mode some other way comes out the same in both, so add `--modes=light`.
- It uses the Storybook already running on port 6006 when it is this project's, and builds one otherwise.
- A page that scrolls inside a fixed frame (an app shell) shows only its first screenful.

## Steps

1. **Photograph.** Run `pnpm taste:shots <target>`. Open one picture yourself to check it shows the screen and not an
   error or a blank page.

2. **Start a fresh reviewer.** Use the Agent tool with a new agent. Never a fork, and never an agent that has seen this
   conversation: someone who knows why a choice was made stops seeing the choice. Give it exactly three things:
   - the picture paths the command printed (all of them, parts included);
   - the path to `rubric.md` beside this file;
   - one line on what the screen is for and who uses it ("Checkout for a furniture shop; shoppers on a phone, often
     one-handed").

   Don't give it the code, the request, your reasoning, or what you think is weak. Use the brief below as written.

3. **Read the findings** before changing anything. Check each one against the picture it points at. A finding you can't
   see in the picture is dropped, and the report says so.

4. **Fix** every `must fix` and `should fix`. `CLAUDE.md` wins over the reviewer: token classes and existing components
   only, spacing on the 8px grid, strings through props. When a fix would need a new token, a new prop or a design
   decision, don't make it: list it for the person. `polish` items are fixed when they are cheap and listed when not.

5. **Photograph again and review once more**, with another fresh reviewer and the same brief. Stop after this second
   round whatever it says: reviews never run out of opinions, and the person is the one who decides.

6. **Report** (format below). Then run the usual checks for whatever changed (`CLAUDE.md`, "Definition of done").

## The reviewer's brief

Fill in the two blanks and send it as is.

```text
You are reviewing a screen for visual craft. You have not seen how it was built, and you won't be told.

What the screen is: <one line: what it's for and who uses it>

Pictures, one per screen size and mode (long pages also come in numbered parts, which are slices of the same picture,
so nothing is really cut off where a part ends):
<the paths>

Rules to judge by: <path to rubric.md>. Read it first.

Look at every picture; say so if one won't open. Compare phone with desktop and light with dark: a problem at one size
or in one mode counts. Judge only what the pictures show. Don't read code, and don't guess at reasons.

Answer in this shape, and nothing else:

Verdict: <ready to show | ready after fixes | not ready> — <one line why>

Findings, worst first. For each one:
- Area: <a rubric area>
- Where: <which picture(s), and where on the screen>
- What's off: <what you see, with measurements where you can; one picture pixel is one CSS pixel>
- Fix: <the change you'd make, in plain words>
- Severity: <must fix | should fix | polish>

What works: <up to three things worth keeping>

Rubric areas with nothing to report: <list>

must fix = a person would notice within seconds, or it gets in the way of the screen's job. should fix = a designer
would notice. polish = optional. No finding without a place you can point at. If the screen is good, say so and keep
the list short: don't pad it.
```

## The report to the person

```markdown
## Taste review: <screen>

**Verdict:** <the last reviewer's verdict line>
**Pictures:** <folder> (show the phone and desktop pictures, light, inline when the app can show images)

### Fixed
- <area> — <what was off> → <what changed> (`path:line`)

### Left for you
- <finding> — <why it wasn't fixed: needs a new token / a design decision / polish>

### Dropped
- <finding> — <why: not visible in the picture / goes against CLAUDE.md>

Rounds: <1 or 2>. Checks run: <real output>
```

Say plainly when the reviewer found nothing. "It looks ready" is a useful answer.

## The rubric

`rubric.md` is a general starting list, not MetaLab's house rules. A team that has its own craft rules should replace
or extend it; the reviewer follows whatever the file says. In a project, `pnpm addon update` keeps an edited rubric and
puts the starter's new version beside it for merging.
