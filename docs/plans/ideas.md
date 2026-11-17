# Ideas for later

Ideas we liked but haven't planned yet. An add-on earns its place when it gives Claude something it can't make up by
itself: somewhere to host things, a loop with real people, a way to check its own work, a connection to the team's
tools, or MetaLab's taste. Plain boilerplate (sample data, presets) doesn't qualify: Claude writes that on request.

## Loops with clients and people

- **Comments become changes.** A client comments in the viewer, Claude makes the change, a new round appears with
  "what changed", and Claude replies on the thread. Builds on the viewer's comments.
- **Live co-design session.** On a call the client asks for a change, Claude makes it, and everyone's viewer updates
  live. Builds on the "follow me" idea.
- **Five directions, then vote.** Claude makes several different takes on a screen, side by side in the viewer; the
  team and client vote with reactions, and the winner becomes the next round.

## Checks on Claude's own work

- **Taste reviewer.** A second Claude critiques screens against MetaLab's craft rules (hierarchy, rhythm, spacing,
  contrast) from screenshots, before a person sees them.
- **Match the design.** Given a Figma frame, Claude rebuilds and compares screenshots until the code matches, with a
  score for how close it is.
- **Pretend testers.** AI personas click through a prototype and report where they got stuck: a cheap round before
  real testing.

## Knowledge Claude doesn't have

- **Engagement memory.** A shared log of client decisions ("no carousels", "dark mode is a must"), gathered from meeting
  notes and comments, which Claude follows in all later work.
- **Real client data.** Prototypes connected to the client's test systems, showing their real products and content.

## Things that need human hands

- **Feel tuner.** Sliders over a live prototype for timing, springiness and spacing; a designer tunes by feel, and
  Claude writes the chosen values back into the design tokens.

**First picks (2026-11-07):** comments become changes, taste reviewer, five directions then vote.

## Across an engagement

Ways Claude can help from kickoff to handoff. Some are add-ons, some are skills or scheduled jobs.

- **Competitor teardown (research).** Claude walks through competitors' apps and sites, captures their key flows, and
  lays them out side by side in the viewer.
- **Every state and edge case (design).** For each screen Claude lists the states it's missing (empty, loading, error,
  very long text, hundreds of items) and builds them. Then it screenshots every screen with long German words,
  right-to-left text, the largest text size and the smallest phone, and flags what breaks.
- **Figma drift watch (library).** Each night Claude compares the Figma library with the code and reports what no
  longer matches.
- **Weekly client update (communication).** Claude drafts "what changed this week" from new rounds, resolved comments
  and decisions, for a person to check and send.
- **Walkthrough per round (communication).** Each new round in the viewer gets a short narrated video tour, made with
  the screencast add-on.
- **Meeting to action (communication).** After a client call, Claude updates the decision log, drafts the tickets and
  makes the small prototype changes that were agreed, for a person to approve.
- **Lessons flow back (the team).** At the end of an engagement Claude collects what the team built or fixed that would
  help everyone, and proposes it as an add-on for the starter.
