import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { Library } from './Library';

const meta = {
  title: 'Templates/Content/Library',
  component: Library,
  parameters: about(
    'A searchable catalogue: search, a group filter, a sort menu, and cards grouped under headings, with an empty state.',
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof Library>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };

export const Filtered: Story = {
  globals: at('desktop'),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Forms' }));
    await expect(canvas.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'Forms' }),
    ).toBeVisible();
  },
};

export const NoResults: Story = {
  globals: at('desktop'),
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole('searchbox', { name: /search/i }),
      'spaceship',
    );
    await expect(
      canvas.getByRole('heading', { name: 'No results' }),
    ).toBeVisible();
  },
};
