import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Progress from './Progress';

const meta = {
  title: 'Components/Atoms/Progress',
  component: Progress.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'see how far along a task is',
          not: '`Spinner` when the length is known',
        },
      ],
      purpose: 'Shows how far along a task is.',
      useWhen: [
        'Uploads, imports or multi-step processes with a known amount',
        'Leave the value out (indeterminate) when the length is unknown',
      ],
      alternatives: [
        { use: 'Slider', when: 'people should set the value themselves' },
      ],
      do: ['Label it with what is loading', 'Show the value when you know it'],
      dont: [
        'Use it for a score or rating',
        'Leave it on screen after the task finishes',
      ],
    }),
    layout: 'centered',
  },
  args: { value: 64 },
  render: (args) => (
    <Progress.Root className="w-80" {...args}>
      <Progress.Label>Uploading assets</Progress.Label>
      <Progress.Value />
      <Progress.Track>
        <Progress.Indicator />
      </Progress.Track>
    </Progress.Root>
  ),
} satisfies Meta<typeof Progress.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar', { name: /uploading assets/i });
    await expect(bar).toHaveAttribute('aria-valuenow', '64');
    await expect(canvas.getByText('64%')).toBeVisible();
  },
};

export const Complete: Story = {
  args: { value: 100 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar')).toHaveAttribute(
      'data-complete',
    );
  },
};

export const Indeterminate: Story = {
  args: { value: null },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar')).not.toHaveAttribute(
      'aria-valuenow',
    );
  },
};
