import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as AlertDialog from './AlertDialog';
import { Button } from './Button';

const meta = {
  title: 'Components/Atoms/AlertDialog',
  component: AlertDialog.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'confirm something irreversible',
          not: '`Dialog`, `window.confirm`',
        },
      ],
      purpose:
        'Interrupts to confirm a decision that is destructive or hard to undo.',
      useWhen: [
        "Deleting, discarding unsaved work or another action that can't be reversed",
        'The person must answer before they continue',
      ],
      alternatives: [
        {
          use: 'Dialog',
          when: 'the content is a task or form, not a yes/no decision',
        },
        {
          use: 'Toaster with Undo',
          when: 'the action can be reversed: let it happen and offer Undo instead of asking first',
        },
      ],
      do: [
        'Name the action on the confirm button ("Delete project"), never "OK"',
        'Say what will be lost in the description',
      ],
      dont: [
        'Use it for information that needs no decision',
        'Open one alert on top of another',
      ],
    }),

    layout: 'centered',
    /*
     * The popup portals to <body>, outside the story root the a11y addon
     * scans by default; widening the context puts the open dialog's
     * contrast and labelling under test.
     */
    a11y: { context: 'body' },
  },
  render: (args) => (
    <AlertDialog.Root {...args}>
      <AlertDialog.Trigger render={<Button variant="outline" />}>
        Discard draft
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop />
        <AlertDialog.Popup>
          <AlertDialog.Title>Discard this draft?</AlertDialog.Title>
          <AlertDialog.Description>
            Your unsaved changes will be lost. You can’t undo this.
          </AlertDialog.Description>
          <div className="flex justify-end gap-3">
            <AlertDialog.Close render={<Button variant="ghost" />}>
              Keep editing
            </AlertDialog.Close>
            <AlertDialog.Close render={<Button variant="destructive" />}>
              Discard
            </AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  ),
} satisfies Meta<typeof AlertDialog.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /discard draft/i });
    await userEvent.click(trigger);

    const dialog = await screen.findByRole('alertdialog', {
      name: /discard this draft\?/i,
    });
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(dialog).toHaveAccessibleDescription(/can’t undo/i);

    await userEvent.click(document.body);
    await expect(dialog).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /keep editing/i }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const Open: Story = {
  args: { defaultOpen: true },
};
