import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell } from 'lucide-react';
import { expect, screen, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Button } from './Button';
import * as Popover from './Popover';

const meta = {
  title: 'Components/Atoms/Popover',
  component: Popover.Root,
  parameters: {
    ...usage({
      choose: [
        { need: 'see controls tied to one button', not: '`Dialog`, `Tooltip`' },
      ],
      purpose:
        'A small floating panel attached to a control, for content people interact with.',
      useWhen: [
        'Quick settings, filters or a short form tied to one button',
        'Detail that needs links or buttons inside it',
      ],
      alternatives: [
        { use: 'Tooltip', when: 'it is a short label with nothing to click' },
        { use: 'Dialog', when: 'the task is larger or needs full attention' },
        { use: 'Menu', when: 'the content is a list of actions' },
      ],
      do: [
        "Give it a Title when the content isn't obvious",
        'Keep it small; it closes when people click away',
      ],
      dont: [
        'Put the only copy of critical information in it',
        'Make it open on hover; it opens on click',
      ],
    }),

    layout: 'centered',
    /*
     * The popup portals to <body>, outside the story root the a11y addon
     * scans by default; widening the context puts the open popover's
     * contrast and labelling under test.
     */
    a11y: { context: 'body' },
  },
  render: (args) => (
    <Popover.Root {...args}>
      <Popover.Trigger
        render={
          <Button variant="outline" size="sm" aria-label="Notifications" />
        }
      >
        <Bell aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner>
          <Popover.Popup>
            <Popover.Arrow />
            <Popover.Title>Notifications</Popover.Title>
            <Popover.Description>
              You’re all caught up. New mentions and replies will show up here.
            </Popover.Description>
            <div className="flex justify-end pt-2">
              <Popover.Close render={<Button variant="ghost" size="sm" />}>
                Close
              </Popover.Close>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
} satisfies Meta<typeof Popover.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /notifications/i });
    await userEvent.click(trigger);

    const popover = await screen.findByRole('dialog', {
      name: /notifications/i,
    });
    await waitFor(() => expect(popover).toBeVisible());
    await expect(popover).toHaveAccessibleDescription(/all caught up/i);

    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const Open: Story = {
  args: { defaultOpen: true },
};

export const Keyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /notifications/i });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    const popover = await screen.findByRole('dialog', {
      name: /notifications/i,
    });
    await waitFor(() => expect(popover).toBeVisible());

    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
