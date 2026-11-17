import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { StatusDot } from './StatusDot';

const meta = {
  title: 'Components/Atoms/StatusDot',
  component: StatusDot,
  parameters: {
    ...usage({
      purpose: 'A small coloured dot for presence or health.',
      useWhen: [
        'Someone is online, away or busy',
        'A service or task is healthy, slow or down',
      ],
      alternatives: [
        { use: 'Badge', when: 'the state needs a visible word' },
        { use: 'Banner', when: 'the state needs explaining' },
      ],
      do: [
        'Put words beside it, or give it a label',
        'Use the same tone for the same state everywhere',
      ],
      dont: ['Use colour as the only signal', 'Use it for counts; use a Badge'],
    }),
  },
  argTypes: {
    tone: {
      control: 'select',
      options: ['neutral', 'info', 'success', 'warning', 'destructive'],
    },
  },
  args: { tone: 'success', label: 'Online' },
} satisfies Meta<typeof StatusDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Online' })).toBeVisible();
  },
};

export const BesideText: Story = {
  render: () => (
    <ul className="type-body-sm text-foreground flex flex-col gap-2">
      <li className="flex items-center gap-2">
        <StatusDot tone="success" />
        Payments: working
      </li>
      <li className="flex items-center gap-2">
        <StatusDot tone="warning" />
        Search: slow
      </li>
      <li className="flex items-center gap-2">
        <StatusDot tone="destructive" />
        Email: down
      </li>
      <li className="flex items-center gap-2">
        <StatusDot />
        Reports: paused
      </li>
    </ul>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('img')).toBeNull();
  },
};
