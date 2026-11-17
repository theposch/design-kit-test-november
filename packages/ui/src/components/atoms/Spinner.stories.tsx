import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Spinner } from './Spinner';

const meta = {
  title: 'Components/Atoms/Spinner',
  component: Spinner,
  parameters: {
    ...usage({
      purpose: 'Shows that something small is loading or being saved.',
      useWhen: [
        'A short wait inside a button or beside a field',
        'A panel is fetching and its shape is unknown',
      ],
      alternatives: [
        { use: 'Skeleton', when: 'you know the shape of what is coming' },
        { use: 'Progress', when: 'you know how far along it is' },
      ],
      do: [
        'Say what is loading in the label',
        'Disable the control that started the wait',
      ],
      dont: [
        'Cover a whole page with a spinner',
        'Show more than one at a time for the same wait',
      ],
    }),
  },
  args: { label: 'Loading orders' },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('status', { name: 'Loading orders' }),
    ).toBeVisible();
  },
};

export const InText: Story = {
  render: () => (
    <p className="type-body-lg text-foreground flex items-center gap-2">
      <Spinner label="Saving" />
      Saving your changes
    </p>
  ),
};
