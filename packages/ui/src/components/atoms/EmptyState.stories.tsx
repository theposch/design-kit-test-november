import type { Meta, StoryObj } from '@storybook/react-vite';
import { Inbox, SearchX } from 'lucide-react';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Button } from './Button';
import * as EmptyState from './EmptyState';

const meta = {
  title: 'Components/Atoms/EmptyState',
  component: EmptyState.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'fill a space that has no content yet',
          not: 'a blank area, a lone sentence',
        },
      ],
      purpose:
        'Fills the space where content would be, and says what to do next.',
      useWhen: [
        'A list or table has nothing in it yet',
        'A search or filter matches nothing',
      ],
      alternatives: [
        { use: 'Skeleton', when: 'the content is still loading' },
        { use: 'Banner', when: 'something went wrong' },
      ],
      do: [
        'Offer the one action that fills the space',
        'Say why it is empty in plain words',
      ],
      dont: [
        'Show it while data is still loading',
        'Leave the space blank instead',
      ],
    }),
  },
} satisfies Meta<typeof EmptyState.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <EmptyState.Root>
      <EmptyState.Media>
        <Inbox />
      </EmptyState.Media>
      <EmptyState.Title>No orders yet</EmptyState.Title>
      <EmptyState.Description>
        When customers buy something, their orders show up here.
      </EmptyState.Description>
      <EmptyState.Actions>
        <Button>Share your shop</Button>
      </EmptyState.Actions>
    </EmptyState.Root>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { level: 2, name: /no orders yet/i }),
    ).toBeVisible();
    await expect(canvas.getByRole('button')).toBeVisible();
  },
};

export const NoResults: Story = {
  render: () => (
    <EmptyState.Root>
      <EmptyState.Media>
        <SearchX />
      </EmptyState.Media>
      <EmptyState.Title render={<h3 />}>No results</EmptyState.Title>
      <EmptyState.Description>
        Try a different word, or clear the filters.
      </EmptyState.Description>
      <EmptyState.Actions>
        <Button variant="outline">Clear filters</Button>
      </EmptyState.Actions>
    </EmptyState.Root>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 3 })).toBeVisible();
  },
};
