import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { SettingsPanels } from './SettingsPanels';

const meta = {
  title: 'Templates/Settings/Panels',
  component: SettingsPanels,
  parameters: about(
    'Settings as panels: a section list beside the open section, rows edited in place, and a drill-down list on small screens.',
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof SettingsPanels>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };

export const EditInPlace: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Edit email' }));
    const input = canvas.getByLabelText('Email');
    await userEvent.clear(input);
    await userEvent.type(input, 'ada@northwind.example');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(canvas.getByText('ada@northwind.example')).toBeVisible();
  },
};

export const DrillDownOnPhone: Story = {
  globals: at('phone'),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('link', { name: /billing/i }));
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Billing' }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'All settings' }));
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Settings' }),
    ).toBeVisible();
  },
};
