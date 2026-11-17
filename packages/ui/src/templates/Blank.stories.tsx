import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { Blank } from './Blank';

const meta = {
  title: 'Templates/Basics/Blank',
  component: Blank,
  parameters: about(
    'The empty page frame: start here when no other template fits.',
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof Blank>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };
