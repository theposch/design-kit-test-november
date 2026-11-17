import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { SideNavShell } from './SideNavShell';

const meta = {
  title: 'Templates/Shells/Side nav',
  component: SideNavShell,
  parameters: {
    ...about(
      'An app frame with navigation down the side that can be hidden, a drawer on small screens, and ⌘K search.',
    ),
    a11y: { context: 'body' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof SideNavShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };

export const HideSidebar: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('navigation', { name: 'Main' }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Hide sidebar' }));
    await expect(
      canvas.queryByRole('navigation', { name: 'Main' }),
    ).not.toBeInTheDocument();
  },
};

export const SearchWithShortcut: Story = {
  globals: at('desktop'),
  play: async () => {
    await userEvent.keyboard('{Meta>}k{/Meta}');
    const dialog = await screen.findByRole('dialog', { name: 'Search' });
    await waitFor(() => expect(dialog).toBeVisible());
  },
};

export const MenuOnPhone: Story = {
  globals: at('phone'),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
    const drawer = await screen.findByRole('dialog', { name: 'Menu' });
    await waitFor(() => expect(drawer).toBeVisible());
    await expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};
