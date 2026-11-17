import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Button } from './Button';
import * as Dialog from './Dialog';

const meta = {
  title: 'Components/Atoms/Dialog',
  component: Dialog.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'do a short task over the page',
          not: 'a new page for a two-field form',
        },
      ],
      purpose:
        'Opens a focused layer over the page for a short task, without leaving the page.',
      useWhen: [
        'A short form or detail view that belongs to the current page',
        "The task needs the person's full attention",
      ],
      alternatives: [
        {
          use: 'AlertDialog',
          when: 'it is a yes/no confirmation of a risky action',
        },
        {
          use: 'Popover',
          when: 'the content is small and belongs to one control',
        },
        { use: 'A new page', when: 'the task is long or needs its own URL' },
      ],
      do: [
        'Always give it a Title; screen readers announce it',
        'Put the main action last, with Cancel or Close beside it',
      ],
      dont: [
        'Open a dialog from inside a dialog',
        'Fill it with long, scrolling content',
      ],
    }),

    layout: 'centered',
    /*
     * The popup portals to <body>, outside the story root the a11y addon
     * scans by default; widening the context is what puts the open dialog's
     * contrast and labelling under test.
     */
    a11y: { context: 'body' },
  },
  render: (args) => (
    <Dialog.Root {...args}>
      <Dialog.Trigger render={<Button variant="outline" />}>
        Delete project
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <Dialog.Title>Delete this project?</Dialog.Title>
          <Dialog.Description>
            This removes the project and all of its files. This action cannot be
            undone.
          </Dialog.Description>
          <div className="flex justify-end gap-3">
            <Dialog.Close render={<Button variant="ghost" />}>
              Cancel
            </Dialog.Close>
            <Dialog.Close render={<Button variant="destructive" />}>
              Delete
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  ),
} satisfies Meta<typeof Dialog.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /delete project/i });
    await userEvent.click(trigger);

    const dialog = await screen.findByRole('dialog', {
      name: /delete this project\?/i,
    });
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(dialog).toHaveAccessibleDescription(/cannot be undone/i);

    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const Open: Story = {
  args: { defaultOpen: true },
};

export const LongContent: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Dialog.Root {...args}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <Dialog.Title>Terms of service</Dialog.Title>
          <Dialog.Description>
            Please read these terms before continuing.
          </Dialog.Description>
          {Array.from({ length: 30 }, (_, index) => (
            <p key={index} className="type-body-sm text-surface-foreground">
              Section {index + 1}. These terms cover how the service is
              provided, what you agree to when you use it, and how either side
              can end the agreement.
            </p>
          ))}
          <div className="flex justify-end gap-3">
            <Dialog.Close render={<Button variant="ghost" />}>
              Decline
            </Dialog.Close>
            <Dialog.Close render={<Button />}>Accept</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  play: async () => {
    const dialog = await screen.findByRole('dialog', {
      name: /terms of service/i,
    });
    /* Long content must scroll inside the dialog, never push it off screen. */
    const { top, bottom } = dialog.getBoundingClientRect();
    await expect(top).toBeGreaterThanOrEqual(0);
    await expect(bottom).toBeLessThanOrEqual(window.innerHeight);

    const accept = screen.getByRole('button', { name: /accept/i });
    accept.scrollIntoView();
    await waitFor(() => expect(accept).toBeVisible());
  },
};
