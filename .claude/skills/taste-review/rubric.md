# Craft rubric

**This is a general starting rubric.** It collects widely used interface-design rules of thumb plus this repo's own
layout rules. It is not MetaLab's house style. Replace or extend it with the team's own craft rules; the reviewer follows
whatever this file says.

Every rule is written so it can be checked from a picture. One picture pixel is one CSS pixel, so distances can be
measured. Sizes are named phone, tablet and desktop; modes are light and dark.

## 1. Hierarchy

- **One primary action.** Each screen, or each clearly separate area of it, has one button that looks most important.
  Two equally loud buttons side by side is a finding.
- **Squint test.** Blur the picture in your mind: the first thing that still stands out should be the thing the screen
  is for (the title, the main number, the main action). If it's a logo, a decoration or a secondary button, that's a
  finding.
- **Three levels, clearly apart.** Title, body and supporting text should each be told apart at a glance by size,
  weight or colour. Two levels that are nearly the same size read as a mistake.
- **Reading order follows importance.** The eye should travel top-left to bottom-right through things in the order a
  person needs them. The main action shouldn't sit above the information needed to take it.
- **Destructive and secondary actions are quieter** than the primary one, and never placed where the primary one
  usually sits.

## 2. Spacing and rhythm

- **8px grid.** Gaps and padding between page-level blocks should measure in steps of 8 (4 is fine inside a small
  component). A 13px or 22px gap between blocks is a finding.
- **Near means related.** The space inside a group is smaller than the space between groups. A label is closer to its
  own field than to the field above. A heading is closer to the content it introduces than to the content before it.
- **Same job, same gap.** The gaps between repeated things (cards, rows, form fields, sections) are equal. One gap that
  differs from its siblings is a finding.
- **A small set of gaps.** A screen that uses more than about four or five different gap sizes looks unplanned.
- **Room at the edges.** Content doesn't touch the screen edge or a container's edge. On a phone the side margin is at
  least 16px. Padding inside a container is even on matching sides.
- **Vertical rhythm.** Sections follow each other at a steady beat. A sudden large hole or a cramped pile-up is a
  finding.

## 3. Alignment

- **Shared edges.** Things in a column share a left edge (or a centre line). Count the distinct left edges on the
  screen: more than two or three in one area is a finding.
- **Baselines in a row.** Text, icons and buttons that sit in one row line up on a baseline or a centre line; an icon
  that sits a pixel or two high or low is a finding.
- **One alignment per block.** Centred text mixed with left-aligned text in the same block is a finding. Body text
  longer than two or three lines is left-aligned, not centred.
- **Columns of numbers** are right-aligned or aligned on the decimal point.
- **Optical checks.** A shape that is mathematically centred but looks off (a play triangle, an icon in a circle) is
  worth a polish note.

## 4. Type

- **Few sizes.** About four text sizes or fewer per screen. More than that is a finding.
- **Line length.** Body text runs roughly 45 to 75 characters a line on desktop and 30 to 45 on a phone. Lines that run
  the full width of a wide screen are a finding.
- **No orphans or widows.** A heading isn't left alone at the bottom of a block with its content cut off below. A
  paragraph or heading doesn't end with a single short word on its own line when a small change would fix it.
- **Headings break well.** A two-line heading has lines of similar length, and doesn't break in the middle of a
  phrase.
- **Nothing is cut off by accident.** Truncated text ("Continue with G…") or text that overflows its box is a must fix.
- **Small text stays readable.** Supporting text isn't both small and faint.
- **Consistent case and punctuation.** Buttons and headings use one capitalisation style across the screen.

## 5. Colour and contrast

- **Accent is rare.** The accent colour marks the primary action and a few key things. When it's everywhere, nothing
  stands out: a finding.
- **Colour means something.** Red for danger or errors, green for success, and so on, used the same way throughout.
  A status shown by colour alone, with no text or icon, is a finding.
- **Both modes hold.** Compare light and dark side by side. The hierarchy should be the same in both. Look for borders
  that vanish, surfaces that merge into the background, shadows that do nothing in dark, images or logos that glare,
  and text that goes muddy.
- **Layers are readable.** Background, surface and raised surface can be told apart, in both modes.
- **Greys are consistent.** Body text, supporting text and disabled text each use one grey, not several near-identical
  ones.

## 6. Density and balance

- **Weight is distributed.** The screen doesn't have everything crowded on one side and a large empty area on the
  other, unless that emptiness is clearly on purpose (a centred sign-in).
- **Density fits the job.** A screen to scan (a table, a dashboard) can be tight; a screen to read or decide on needs
  air. Cramped reading and airy data are both findings.
- **Phone isn't a shrunken desktop.** On a phone: one column, touch targets at least about 44px tall, the main action
  easy to reach, nothing needing a sideways scroll. On desktop: content doesn't stretch across the whole width with
  nothing to hold it.
- **Each size is designed.** Compare phone, tablet and desktop: an element that looks right at one size and lost,
  squeezed or oversized at another is a finding.
- **Above the fold.** The first screenful says what the screen is and shows (or clearly leads to) the main action.

## 7. Content realism

- **Real-looking copy.** No "Lorem ipsum", "Title here", "Button" or "Test". Names, prices, dates and numbers look like
  ones a real product would show, and agree with each other (a total equals its lines).
- **Hard cases shown.** Look for whether the layout would survive a long name, a long word, a big number, a missing
  picture. If every example is short and tidy, say which element looks likely to break.
- **Empty, loading and error states.** If the pictures include them, they should explain what's going on and what to do
  next. A blank area with no explanation is a finding.
- **Words do work.** Buttons say what they do ("Save changes", not "OK"). Headings name the content. No two things on a
  screen have the same label.
- **Pictures fit.** Images are sharp, cropped on purpose and suited to the content. A stretched, blurry or obviously
  placeholder picture is a finding.

## 8. Consistency

- **Same thing, same look.** Buttons of the same importance match in size and style. Cards in a set share padding,
  corner radius and shadow. Icons share one style and stroke weight and one size per context.
- **Same thing, same place.** Across the sizes and across the screens in the set, the main action, the navigation and
  the page title keep their position.
- **Corners and borders agree.** Nested corners look deliberate (an inner corner isn't rounder than the one outside
  it). Borders are one weight and one colour for one purpose.
- **One way to show each state.** Selected, disabled and error each look one way everywhere.

## 9. Named anti-patterns

These come from this repo's `CLAUDE.md`. Seeing one is at least a should fix.

- **Card soup.** Every group wrapped in a bordered box. Group with spacing; borders are for real containers. Boxes
  inside boxes inside boxes is the tell.
- **Placeholder label.** A field named only by the grey text inside it, with no label above or beside it.
- **Div button.** From a picture: something that looks clickable but doesn't look like a button or a link, or a button
  that doesn't look clickable.
- **Dialog stack.** A dialog showing on top of another dialog.
- **Toast for errors.** A problem the person must fix shown as a floating message instead of next to its cause.

## Severity

- **must fix:** a person would notice within seconds, or it gets in the way of what the screen is for. Cut-off or
  overlapping text, a missing or unclear primary action, a broken layout at one size, a mode in which something can't be
  read, placeholder copy.
- **should fix:** a designer would notice. Uneven gaps, misaligned edges, too many text sizes, accent overuse, card
  soup.
- **polish:** optional refinement. Optical centring, a heading that could break better.
