import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Avatar from './Avatar';

/*
 * A self-contained SVG data URI stands in for a photo so the story never
 * depends on the network.
 */
const portrait =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#6d5dfc"/><circle cx="20" cy="16" r="7" fill="#fff"/><rect x="8" y="26" width="24" height="14" rx="7" fill="#fff"/></svg>',
  );

const meta = {
  title: 'Components/Atoms/Avatar',
  component: Avatar.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'show a person or account as a round picture or initials',
          not: 'a rounded `<img>`, `Thumbnail`',
        },
      ],
      purpose:
        'Shows a person or team as an image, with initials when the image is missing.',
      useWhen: [
        'Next to names in lists, comments and headers',
        'Showing who owns or changed something',
      ],
      alternatives: [],
      do: [
        'Always pass a Fallback, such as initials',
        "Give the image the person's name as alt text, or empty alt when the name is shown beside it",
      ],
      dont: [
        'Use it for logos or product images',
        'Make it clickable on its own; put it inside a Button or Menu trigger',
      ],
    }),
    layout: 'centered',
  },
} satisfies Meta<typeof Avatar.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  render: (args) => (
    <Avatar.Root {...args}>
      <Avatar.Image src={portrait} alt="Ada Lovelace" />
      <Avatar.Fallback>AL</Avatar.Fallback>
    </Avatar.Root>
  ),
  play: async ({ canvas }) => {
    await waitFor(() =>
      expect(canvas.getByRole('img', { name: /ada lovelace/i })).toBeVisible(),
    );
  },
};

export const Fallback: Story = {
  render: (args) => (
    <Avatar.Root {...args}>
      <Avatar.Image src="/missing-avatar.png" alt="Grace Hopper" />
      <Avatar.Fallback>GH</Avatar.Fallback>
    </Avatar.Root>
  ),
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText('GH')).toBeVisible());
    await expect(canvas.queryByRole('img')).not.toBeInTheDocument();
  },
};

export const Group: Story = {
  render: () => (
    <div className="flex -space-x-2">
      {['AL', 'GH', 'KJ', 'MH'].map((initials) => (
        <Avatar.Root key={initials} className="border-background border-2">
          <Avatar.Fallback>{initials}</Avatar.Fallback>
        </Avatar.Root>
      ))}
    </div>
  ),
};

export const Footprints: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar.Root className="size-6">
        <Avatar.Fallback className="type-body-xs">AL</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root>
        <Avatar.Fallback>AL</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root className="size-14">
        <Avatar.Fallback className="type-body-lg">AL</Avatar.Fallback>
      </Avatar.Root>
    </div>
  ),
};
