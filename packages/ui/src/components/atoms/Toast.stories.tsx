import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, waitFor, within } from 'storybook/test';

import { useToastManager } from '#hooks/useToastManager';
import { usage } from '#storybook/usage';

import { Button } from './Button';
import * as Toast from './Toast';

/*
 * The parts composed by hand, for a project whose toasts need a layout the
 * drop-in `Toaster` molecule doesn't offer. Here: a compact single-line toast
 * pinned to the top centre of the screen.
 */
function CompactList() {
  const { toasts } = useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport
        aria-label="Notifications"
        className="tablet:top-8 tablet:right-auto tablet:bottom-auto top-4 right-auto bottom-auto left-1/2 -translate-x-1/2"
      >
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            swipeDirection="up"
            className="top-0 bottom-auto"
          >
            <Toast.Content className="items-center py-2.5">
              <Toast.Title className="flex-1" />
              <Toast.Close aria-label="Dismiss" />
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

function Trigger() {
  const toastManager = useToastManager();
  return (
    <Button
      variant="outline"
      onClick={() => toastManager.add({ title: 'Link copied' })}
    >
      Copy link
    </Button>
  );
}

/*
 * The default bottom-right stack, for exercising the collapse-and-fan-out
 * recipe on `Toast.Root` with several toasts at once.
 */
function StackList() {
  const { toasts } = useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport aria-label="Notifications">
        {toasts.map((toast) => (
          <Toast.Root key={toast.id} toast={toast}>
            <Toast.Content>
              <Toast.Title className="flex-1" />
              <Toast.Close aria-label="Dismiss" />
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

function BatchTrigger() {
  const toastManager = useToastManager();
  return (
    <Button
      variant="outline"
      onClick={() => {
        for (const name of ['cover.png', 'brief.pdf', 'notes.md']) {
          toastManager.add({ title: `${name} uploaded` });
        }
      }}
    >
      Upload files
    </Button>
  );
}

const meta = {
  title: 'Components/Atoms/Toast',
  component: Toast.Provider,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'build a notification with a custom layout',
          use: '`Toast` parts',
          not: 'the first choice; try `Toaster`',
        },
      ],
      purpose: 'The parts for building brief notifications in a custom layout.',
      useWhen: [
        "The drop-in Toaster's position or style doesn't fit",
        'A project needs its own toast design',
      ],
      alternatives: [
        { use: 'Toaster', when: 'the standard stack works; try it first' },
        { use: 'AlertDialog', when: 'the person must respond' },
      ],
      do: [
        "Give Viewport an aria-label in the app's language",
        'Give Close an aria-label',
      ],
      dont: [
        'Put the only copy of important information in a toast',
        'Use it for form errors; show those in the Field',
      ],
    }),

    layout: 'centered',
    /*
     * Toasts portal to <body>, outside the story root the a11y addon scans
     * by default; widening the context puts them under test.
     */
    a11y: { context: 'body' },
  },
  args: { timeout: 0 },
  render: (args) => (
    <Toast.Provider {...args}>
      <Trigger />
      <CompactList />
    </Toast.Provider>
  ),
} satisfies Meta<typeof Toast.Provider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Composed: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /copy link/i }));
    const title = await screen.findByText('Link copied');
    await waitFor(() => expect(title).toBeVisible());

    /*
     * Base UI keeps Close out of the accessibility tree until the viewport is
     * expanded (hovered, or focused — F6 jumps there) so a new toast isn't
     * announced with a stray "Dismiss".
     */
    await userEvent.hover(title);
    await userEvent.click(
      await screen.findByRole('button', { name: /dismiss/i }),
    );
    await waitFor(() =>
      expect(screen.queryByText('Link copied')).not.toBeInTheDocument(),
    );
  },
};

export const Stacked: Story = {
  render: (args) => (
    <Toast.Provider {...args}>
      <BatchTrigger />
      <StackList />
    </Toast.Provider>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: /upload files/i }),
    );
    const region = await screen.findByRole('region', {
      name: /notifications/i,
    });

    // Collapsed, only the newest toast's content shows; the rest peek behind it.
    await waitFor(() =>
      expect(within(region).getByText('notes.md uploaded')).toBeVisible(),
    );
    await waitFor(() =>
      expect(within(region).getByText('cover.png uploaded')).not.toBeVisible(),
    );

    await userEvent.hover(region);
    for (const title of [
      'cover.png uploaded',
      'brief.pdf uploaded',
      'notes.md uploaded',
    ]) {
      await waitFor(() =>
        expect(within(region).getByText(title)).toBeVisible(),
      );
    }
  },
};

export const Keyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /copy link/i });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await screen.findByText('Link copied');

    // F6 is Base UI's shortcut to the notification region; Tab enters the toast.
    await userEvent.keyboard('{F6}');
    await waitFor(() =>
      expect(
        screen.getByRole('region', { name: /notifications/i }),
      ).toHaveFocus(),
    );
    await userEvent.tab();
    await waitFor(() =>
      expect(document.activeElement).toHaveTextContent('Link copied'),
    );
    await userEvent.tab();
    await expect(
      screen.getByRole('button', { name: /dismiss/i }),
    ).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await waitFor(() =>
      expect(screen.queryByText('Link copied')).not.toBeInTheDocument(),
    );
    await expect(trigger).toHaveFocus();
  },
};
