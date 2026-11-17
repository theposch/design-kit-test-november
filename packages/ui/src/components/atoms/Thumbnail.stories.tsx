import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Thumbnail } from './Thumbnail';

/* A tiny inline picture, so the story needs no network. */
const PICTURE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4'%3E%3Crect width='4' height='4' fill='%23c7d2fe'/%3E%3Ccircle cx='2' cy='2' r='1' fill='%234f46e5'/%3E%3C/svg%3E";

const meta = {
  title: 'Components/Atoms/Thumbnail',
  component: Thumbnail,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'show an item as a small square picture',
          not: '`Avatar` (that one is for people)',
        },
      ],
      purpose: 'A small square picture of an item, cropped to fill.',
      useWhen: ['Products in an order or a cart', 'Files or pages in a list'],
      alternatives: [
        { use: 'Avatar', when: 'it shows a person' },
        { use: 'AspectRatio', when: 'the picture is large, in a card' },
      ],
      do: [
        'Use alt="" when the row text already names the item',
        'Change the footprint with a size-* class',
      ],
      dont: ['Put text inside a thumbnail', 'Use it for icons; use Icon'],
    }),
  },
} satisfies Meta<typeof Thumbnail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Thumbnail>
      <img src={PICTURE} alt="Stoneware mug" />
    </Thumbnail>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', { name: 'Stoneware mug' }),
    ).toBeVisible();
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      <Thumbnail className="size-8">
        <img src={PICTURE} alt="" />
      </Thumbnail>
      <Thumbnail>
        <img src={PICTURE} alt="" />
      </Thumbnail>
      <Thumbnail className="size-20">
        <img src={PICTURE} alt="" />
      </Thumbnail>
    </div>
  ),
};
