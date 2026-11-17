import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { DocsHome } from './DocsHome';

const meta = {
  title: 'Templates/Docs/Home',
  component: DocsHome,
  parameters: about(
    'The front page of a docs site: a welcome panel, then every part in a grid of link cards, by group.',
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof DocsHome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };

export const Keyboard: Story = {
  globals: at('desktop'),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: /^button/i })).toHaveFocus();
  },
};
