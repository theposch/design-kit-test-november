import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { SideGallery } from './SideGallery';

const meta = {
  title: 'Templates/Galleries/Side',
  component: SideGallery,
  parameters: about(
    'Text, a call to action and figures beside a square image grid. Stacks on narrow screens.',
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof SideGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };
