import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Skeleton } from './Skeleton';
import { Spinner } from './Spinner';

const meta = {
  title: 'Components/Atoms/Skeleton',
  component: Skeleton,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'show that something is loading',
          use: '`Skeleton` (shape known) / `Spinner`',
          not: 'a blank area, a toast',
        },
      ],
      purpose:
        'A grey stand-in shaped like the content that is loading, so the page does not jump.',
      useWhen: [
        'A list, card or profile is loading and its shape is known',
        'Content loads in after the page frame appears',
      ],
      alternatives: [
        { use: 'Spinner', when: 'the shape is unknown or the wait is tiny' },
        { use: 'EmptyState', when: 'it has loaded and there is nothing' },
      ],
      do: [
        'Match the size of the real content',
        'Announce the wait once with a Spinner or a status line',
      ],
      dont: [
        'Leave skeletons up after an error',
        'Animate them for people who prefer less motion',
      ],
    }),
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex w-80 items-center gap-3">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <span className="sr-only">
        <Spinner label="Loading profile" />
      </span>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('status', { name: 'Loading profile' }),
    ).toBeInTheDocument();
  },
};
