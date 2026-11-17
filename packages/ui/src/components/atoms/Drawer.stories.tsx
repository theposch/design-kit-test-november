import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Button } from './Button';
import * as Drawer from './Drawer';

const meta = {
  title: 'Components/Atoms/Drawer',
  component: Drawer.Popup,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'slide a panel in from the side, like a menu on a phone',
          not: 'a `Dialog` styled to the edge',
        },
      ],
      purpose: 'A panel that slides in from the side over the page.',
      useWhen: [
        'Navigation on a phone, behind a menu button',
        'Filters or details that need more room than a popover',
      ],
      alternatives: [
        {
          use: 'Dialog',
          when: 'it is a short task in the middle of the screen',
        },
        { use: 'Popover', when: 'it is a few controls tied to one button' },
      ],
      do: [
        'Give it a Title, even a visually hidden one',
        'Match swipeDirection to the side it comes from',
      ],
      dont: [
        'Open a drawer from a drawer',
        'Use it for messages that need an answer; use AlertDialog',
      ],
    }),
    a11y: { context: 'body' },
  },
  argTypes: {
    side: { control: 'inline-radio', options: ['start', 'end'] },
  },
  args: { side: 'start' },
  render: ({ side }) => (
    <Drawer.Root swipeDirection={side === 'end' ? 'right' : 'left'}>
      <Drawer.Trigger render={<Button variant="outline" />}>
        Open menu
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Viewport side={side}>
          <Drawer.Popup side={side}>
            <Drawer.Content>
              <Drawer.Title>Menu</Drawer.Title>
              <Drawer.Description>
                Everything in the app, one tap away.
              </Drawer.Description>
              <Drawer.Close render={<Button variant="outline" />}>
                Close
              </Drawer.Close>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  ),
} satisfies Meta<typeof Drawer.Popup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
    const drawer = await screen.findByRole('dialog', { name: 'Menu' });
    await waitFor(() => expect(drawer).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  },
};

export const FromTheEnd: Story = { args: { side: 'end' } };
