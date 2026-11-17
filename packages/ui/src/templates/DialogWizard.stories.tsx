import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { DialogWizard } from './DialogWizard';

const meta = {
  title: 'Templates/Forms/Wizard in a dialog',
  component: DialogWizard,
  parameters: {
    ...about(
      'A short three-step wizard that opens in a dialog over the page and confirms with a toast.',
    ),
    a11y: { context: 'body' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof DialogWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };

export const Open: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Schedule a report' }),
    );
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());
  },
};

export const ScheduleIt: Story = {
  globals: at('phone'),
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Schedule a report' }),
    );
    const next = () =>
      userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await next();
    const attention = await screen.findByText('1 field needs attention');
    await waitFor(() => expect(attention).toBeVisible());
    await userEvent.type(
      screen.getByLabelText('Report name'),
      'Weekly numbers',
    );
    await next();
    await next();
    await userEvent.click(screen.getByRole('button', { name: 'Schedule' }));
    const missing = await screen.findByText('Add someone to send it to.');
    await waitFor(() => expect(missing).toBeVisible());
    await userEvent.type(
      screen.getByRole('combobox', { name: 'Send to' }),
      'kai',
    );
    await userEvent.click(
      await screen.findByRole('option', { name: 'kai@example.com' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Schedule' }));
    const done = await screen.findByText('Report scheduled');
    await waitFor(() => expect(done).toBeVisible());
  },
};
