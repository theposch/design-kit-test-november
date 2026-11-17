import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { WorkspaceShell } from './WorkspaceShell';

const meta = {
  title: 'Templates/Shells/Top and side nav',
  component: WorkspaceShell,
  parameters: {
    ...about(
      'A tool frame with menus and ⌘K search across the top and a folder tree down the side, which moves into a drawer on small screens.',
    ),
    a11y: { context: 'body' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof WorkspaceShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };

export const OpenFromTheTree: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('link', { name: 'Colours' }));
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Colours' }),
    ).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Colours' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};

export const OpenFromSearch: Story = {
  globals: at('phone'),
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search documents' }),
    );
    const input = await screen.findByRole('combobox', {
      name: 'Search documents',
    });
    await userEvent.type(input, 'press');
    await userEvent.keyboard('{Enter}');
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { level: 1, name: 'Press list' }),
      ).toBeVisible(),
    );
  },
};
