import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { TopNavShell } from './TopNavShell';

const meta = {
  title: 'Templates/Shells/Top nav',
  component: TopNavShell,
  parameters: {
    ...about(
      'A site frame with navigation across the top: sections open wide panels of links, and fold into a drawer on small screens.',
    ),
    a11y: { context: 'body' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof TopNavShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };

export const OpenAPanel: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Shop' }));
    const link = await screen.findByRole('link', { name: /kitchen/i });
    await waitFor(() => expect(link).toBeVisible());
  },
};

export const MenuOnPhone: Story = {
  globals: at('phone'),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
    const drawer = await screen.findByRole('dialog', { name: 'Menu' });
    await waitFor(() => expect(drawer).toBeVisible());
    await userEvent.click(screen.getByRole('button', { name: 'Collections' }));
    const orchard = await screen.findByRole('link', { name: 'Orchard' });
    await waitFor(() => expect(orchard).toBeVisible());
  },
};
