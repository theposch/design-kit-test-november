import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { SetupWizard } from './SetupWizard';

const meta = {
  title: 'Templates/Forms/Setup wizard',
  component: SetupWizard,
  parameters: about(
    'A four-step setup in one form: workspace, team, plan with a live price, then a review.',
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof SetupWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };

export const NameRequired: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(await canvas.findByText('Name your workspace.')).toBeVisible();
    await expect(canvas.getByText('Step 1 of 4')).toBeVisible();
  },
};

export const AllTheWay: Story = {
  globals: at('phone'),
  play: async ({ canvas }) => {
    const next = () =>
      userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await userEvent.type(canvas.getByLabelText('Workspace name'), 'Northwind');
    await next();
    await userEvent.click(canvas.getByRole('button', { name: 'Skip' }));
    await userEvent.click(canvas.getByRole('button', { name: 'More seats' }));
    await expect(canvas.getByText('$72')).toBeVisible();
    await next();
    await expect(canvas.getByText('Team, 6 seats')).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Create workspace' }),
    );
    await expect(
      await canvas.findByText('Agree to the terms to continue.'),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('checkbox', { name: /terms of service/i }),
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Create workspace' }),
    );
    await expect(
      await canvas.findByRole('heading', { name: 'Your workspace is ready' }),
    ).toBeVisible();
  },
};
