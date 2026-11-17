import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, waitFor } from 'storybook/test';

import { Button } from '#components/atoms/Button';
import * as Toast from '#components/atoms/Toast';
import { useToastManager } from '#hooks/useToastManager';
import { usage } from '#storybook/usage';

import { Toaster } from './Toaster';

const onUndo = fn();

function Triggers() {
  const toastManager = useToastManager();
  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        onClick={() =>
          toastManager.add({
            title: 'Changes saved',
            description: 'Your project settings were updated.',
          })
        }
      >
        Save changes
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toastManager.add({
            title: 'File deleted',
            description: 'brand-guidelines.pdf was moved to the bin.',
            actionProps: { children: 'Undo', onClick: onUndo },
          })
        }
      >
        Delete file
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toastManager.add({
            type: 'error',
            title: 'Upload failed',
            description: 'Check your connection and try again.',
          })
        }
      >
        Fail upload
      </Button>
    </div>
  );
}

const meta = {
  title: 'Components/Molecules/Toaster',
  component: Toaster,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'hear that something happened',
          use: '`Toaster` + `useToastManager`',
          not: '`AlertDialog`; never for form errors',
        },
      ],
      purpose:
        'The drop-in notification stack: mount it once, then show toasts from anywhere.',
      useWhen: [
        'Confirming that something happened ("Saved", "Link copied")',
        'Offering a quick Undo after an action',
      ],
      alternatives: [
        { use: 'Toast', when: 'you need a different position or design' },
        { use: 'Field error', when: 'the message is about a form field' },
        {
          use: 'AlertDialog',
          when: 'the person must respond before continuing',
        },
      ],
      do: [
        'Keep titles short and in the past tense',
        'Add an Undo action for reversible changes',
      ],
      dont: [
        'Use toasts for errors people must act on',
        'Show several toasts for one event',
      ],
    }),

    layout: 'centered',
    /*
     * Toasts portal to <body>, outside the story root the a11y addon scans
     * by default; widening the context puts them under test.
     */
    a11y: { context: 'body' },
  },
  args: { label: 'Notifications', closeLabel: 'Dismiss notification' },
  render: (args) => (
    <Toast.Provider timeout={0}>
      <Triggers />
      <Toaster {...args} />
    </Toast.Provider>
  ),
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    onUndo.mockClear();

    await userEvent.click(
      canvas.getByRole('button', { name: /save changes/i }),
    );
    const saved = await screen.findByText('Changes saved');
    await waitFor(() => expect(saved).toBeVisible());

    await userEvent.click(canvas.getByRole('button', { name: /delete file/i }));
    await userEvent.click(await screen.findByRole('button', { name: /undo/i }));
    await expect(onUndo).toHaveBeenCalledOnce();

    const dismissButtons = screen.getAllByRole('button', {
      name: /dismiss notification/i,
    });
    for (const dismiss of dismissButtons) {
      await userEvent.click(dismiss);
    }
    await waitFor(() =>
      expect(screen.queryByText('Changes saved')).not.toBeInTheDocument(),
    );
  },
};

export const Error: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /fail upload/i }));
    const title = await screen.findByText('Upload failed');
    await expect(title).toHaveAttribute('data-type', 'error');
    await waitFor(() =>
      expect(screen.getByText(/check your connection/i)).toBeVisible(),
    );
  },
};
