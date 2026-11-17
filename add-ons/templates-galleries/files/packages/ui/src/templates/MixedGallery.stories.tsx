import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { MixedGallery } from './MixedGallery';

const meta = {
  title: 'Templates/Galleries/Mixed',
  component: MixedGallery,
  parameters: about(
    'A featured image beside a tile, over a row of three. Stacks into one column on a phone.',
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof MixedGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };
