import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { ContactForm } from './ContactForm';

const meta = {
  title: 'Templates/Forms/Contact',
  component: ContactForm,
  parameters: about(
    'A lead form: three promises, contact details, goals as tags, choices, and a thank-you once sent.',
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof ContactForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };

export const MissingFields: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByText('Enter your name.'),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(await canvas.findByText('Enter your name.')).toBeVisible();
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      /at least one goal/i,
    );
    await expect(canvas.getByText('Pick a budget.')).toBeVisible();
  },
};

export const Sent: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText('Full name'), 'Ada Moreno');
    await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(canvas.getByLabelText('Company'), 'Northwind');
    await userEvent.type(canvas.getByLabelText('Phone'), '555 0100');
    await userEvent.click(canvas.getByRole('button', { name: 'Events' }));

    for (const [field, option] of [
      [/when would you like to start/i, /1 to 3 months/i],
      [/rough monthly budget/i, /\$5k to \$15k/i],
    ] as const) {
      await userEvent.click(canvas.getByRole('combobox', { name: field }));
      await userEvent.click(
        await screen.findByRole('option', { name: option }),
      );
      await waitFor(() =>
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
      );
    }

    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(
      await canvas.findByText(/we've got your message/i),
    ).toBeVisible();
  },
};
