import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { TwoColumnForm } from './TwoColumnForm';

const meta = {
  title: 'Templates/Forms/Two column',
  component: TwoColumnForm,
  parameters: about(
    'A pitch and picture beside a short contact form, with ways to reach you underneath.',
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof TwoColumnForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };

export const MissingFields: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Send message' }));
    await expect(await canvas.findAllByText('Required')).toHaveLength(3);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Pick a topic.');
  },
};

export const Sent: Story = {
  globals: at('phone'),
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText('Full name'), 'Ada Moreno');
    await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.com');
    await userEvent.click(canvas.getByRole('button', { name: 'Support' }));
    await userEvent.type(canvas.getByLabelText('Message'), 'Hello there');
    await userEvent.click(canvas.getByRole('button', { name: 'Send message' }));
    await expect(await canvas.findByText(/message sent/i)).toBeVisible();
  },
};
