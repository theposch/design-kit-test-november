import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { LinkCard } from './LinkCard';

const meta = {
  title: 'Components/Atoms/LinkCard',
  component: LinkCard,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'open an item from a card in a grid',
          not: 'a `Card` wrapped in `<a>`',
        },
      ],
      purpose: 'A whole card that is one link to the item’s own page.',
      useWhen: [
        'A grid of articles, products or components to open',
        'A dashboard tile that leads to its report',
      ],
      alternatives: [
        { use: 'Card', when: 'it holds buttons or more than one link' },
        { use: 'TextLink', when: 'the link sits in running text' },
      ],
      do: [
        'Start with the title so the link reads well aloud',
        'Use variant="ghost" in dense grids',
      ],
      dont: [
        'Put buttons or other links inside it',
        'Use it to run an action; use Button',
      ],
    }),
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['surface', 'ghost'] },
  },
  args: { href: '#stack', variant: 'surface' },
  render: (args) => (
    <LinkCard {...args} className="w-72">
      <div className="bg-muted h-32" />
      <div className="flex flex-col gap-1 p-4">
        <span className="type-body-base type-strong">Stack</span>
        <span className="type-body-sm text-muted-foreground">
          Lays things out in a row or a column with even gaps.
        </span>
      </div>
    </LinkCard>
  ),
} satisfies Meta<typeof LinkCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const link = canvas.getByRole('link', { name: /^stack/i });
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(link).toHaveAttribute('href', '#stack');
  },
};

export const Ghost: Story = { args: { variant: 'ghost' } };
