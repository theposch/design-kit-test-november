import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronDown, Copy, Pencil, Trash2 } from 'lucide-react';
import { expect, fn, screen, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Button } from './Button';
import * as Menu from './Menu';

const onRename = fn();

const meta = {
  title: 'Components/Atoms/Menu',
  component: Menu.Root,
  parameters: {
    ...usage({
      choose: [{ need: 'pick an action from a list', not: '`Select`' }],
      purpose: 'A list of actions that opens from a button.',
      useWhen: [
        'More actions than fit on screen, behind a "\u2026" button',
        'Related commands like Edit, Duplicate and Delete',
      ],
      alternatives: [
        {
          use: 'Select',
          when: 'the person is choosing a value for a form, not running an action',
        },
        {
          use: 'Popover',
          when: 'the content is not a list of actions, such as a small form',
        },
      ],
      do: [
        'Keep item labels short verbs',
        'Group destructive items last, after a Separator',
      ],
      dont: [
        'Put form fields inside a menu',
        'Nest submenus more than one level deep',
      ],
    }),

    layout: 'centered',
    /*
     * The popup portals to <body>, outside the story root the a11y addon
     * scans by default; widening the context puts the open menu's contrast
     * and roles under test.
     */
    a11y: { context: 'body' },
  },
  render: (args) => (
    <Menu.Root {...args}>
      <Menu.Trigger render={<Button variant="outline" />}>
        Project
        <ChevronDown aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup>
            <Menu.Item onClick={onRename}>
              <Pencil aria-hidden />
              Rename
            </Menu.Item>
            <Menu.Item>
              <Copy aria-hidden />
              Duplicate
            </Menu.Item>
            <Menu.Item disabled>Move to archive</Menu.Item>
            <Menu.Separator />
            <Menu.Group>
              <Menu.GroupLabel>View</Menu.GroupLabel>
              <Menu.CheckboxItem defaultChecked>
                <Menu.CheckboxItemIndicator />
                Show sidebar
              </Menu.CheckboxItem>
              <Menu.CheckboxItem>
                <Menu.CheckboxItemIndicator />
                Show minimap
              </Menu.CheckboxItem>
            </Menu.Group>
            <Menu.Separator />
            <Menu.Group>
              <Menu.GroupLabel>Sort by</Menu.GroupLabel>
              <Menu.RadioGroup defaultValue="updated">
                <Menu.RadioItem value="name">
                  <Menu.RadioItemIndicator />
                  Name
                </Menu.RadioItem>
                <Menu.RadioItem value="updated">
                  <Menu.RadioItemIndicator />
                  Last updated
                </Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Group>
            <Menu.Separator />
            <Menu.SubmenuRoot>
              <Menu.SubmenuTrigger>Share</Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner sideOffset={4} alignOffset={-4}>
                  <Menu.Popup>
                    <Menu.Item>Copy link</Menu.Item>
                    <Menu.Item>Invite people</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>
            <Menu.LinkItem href="#help">Help centre</Menu.LinkItem>
            <Menu.Separator />
            <Menu.Item>
              <Trash2 aria-hidden />
              Delete
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
} satisfies Meta<typeof Menu.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    onRename.mockClear();
    const trigger = canvas.getByRole('button', { name: /project/i });

    await userEvent.click(trigger);
    const menu = await screen.findByRole('menu');
    await waitFor(() => expect(menu).toBeVisible());

    await expect(
      screen.getByRole('menuitemcheckbox', { name: /show sidebar/i }),
    ).toBeChecked();
    await expect(
      screen.getByRole('menuitemradio', { name: /last updated/i }),
    ).toBeChecked();

    await userEvent.click(
      screen.getByRole('menuitemcheckbox', { name: /show minimap/i }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('menuitemcheckbox', { name: /show minimap/i }),
      ).toBeChecked(),
    );

    await userEvent.click(screen.getByRole('menuitem', { name: /rename/i }));
    await waitFor(() => expect(onRename).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );
  },
};

export const Keyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /project/i });
    trigger.focus();

    await userEvent.keyboard('{Enter}');
    await screen.findByRole('menu');
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: /rename/i })).toHaveFocus(),
    );
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: /duplicate/i }),
      ).toHaveFocus(),
    );

    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const Open: Story = {
  args: { defaultOpen: true },
};
