/*
 * The fixed shape every component's guidance takes. It renders as the
 * description on the component's Docs page, and `@storybook/addon-mcp` serves
 * the same text to coding agents, so the same words guide designers in
 * Storybook and an AI picking a component. Storybook builds the agents' copy
 * by reading source, not by running stories, so `main.ts` reads each
 * `usage({...})` from the story file: every value in it must be written
 * inline as plain text (`manifest.test.ts` checks). The drift test fails any
 * story file whose meta skips it, and `pnpm guide --check` fails a component
 * that no `choose` row names.
 */
type AtLeastTwo = [string, string, ...string[]];

export type Usage = {
  /**
   * This component's rows in the "Which component?" table of CLAUDE.md, which
   * `pnpm guide` writes from here. `need` finishes "The person needs to…";
   * `use` defaults to the component's name. Plain strings only.
   */
  choose?: { need: string; use?: string; not: string }[];
  /** One sentence: the job this component does. */
  purpose: string;
  /** The situations to reach for it. */
  useWhen: AtLeastTwo;
  /** The nearest other choices, and when each one wins instead. */
  alternatives: { use: string; when: string }[];
  do: AtLeastTwo;
  dont: AtLeastTwo;
};

const list = (items: string[]) => items.map((item) => `- ${item}`).join('\n');

export function usageText(guide: Usage) {
  const alternatives = guide.alternatives
    .map(({ use, when }) => `- **${use}** — ${when}`)
    .join('\n');
  return [
    guide.purpose,
    `**Use it when**\n\n${list(guide.useWhen)}`,
    alternatives && `**Use something else when**\n\n${alternatives}`,
    `**Do**\n\n${list(guide.do)}`,
    `**Don't**\n\n${list(guide.dont)}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function usage(guide: Usage) {
  return { docs: { description: { component: usageText(guide) } } };
}
