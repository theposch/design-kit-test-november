import type { Meta, StoryObj } from '@storybook/react-vite';
import { Check } from 'lucide-react';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Badge } from './Badge';

const meta = {
  title: 'Components/Atoms/Badge',
  component: Badge,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'show a short status (Paid, Overdue)',
          use: '`Badge` / `StatusDot`',
          not: 'coloured text alone',
        },
      ],
      purpose: 'A short label for the status or type of an item.',
      useWhen: [
        'An order, task or invoice has a state, like Paid or Unfulfilled',
        'A row needs a category marker, like Beta',
      ],
      alternatives: [
        { use: 'Tag', when: 'people click it to pick or filter' },
        { use: 'Banner', when: 'the message needs a sentence' },
        { use: 'StatusDot', when: 'a dot beside a name is enough' },
      ],
      do: [
        'Keep it to one or two words',
        'Use the same variant for the same state everywhere',
      ],
      dont: [
        'Rely on colour alone; the words must say the state',
        'Make a badge clickable',
      ],
    }),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'info', 'success', 'warning', 'destructive'],
    },
  },
  args: { children: 'Unfulfilled', variant: 'warning' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Unfulfilled').tagName).toBe('SPAN');
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Draft</Badge>
      <Badge variant="info">In review</Badge>
      <Badge variant="success">
        <Check aria-hidden />
        Paid
      </Badge>
      <Badge variant="warning">Unfulfilled</Badge>
      <Badge variant="destructive">Overdue</Badge>
    </div>
  ),
};
