import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Kbd } from './Kbd';
import * as Menu from './Menu';
import * as Menubar from './Menubar';

const MENUS = [
  {
    label: 'File',
    items: [
      ['New file', '⌘N'],
      ['Open…', '⌘O'],
      ['Save', '⌘S'],
    ],
  },
  {
    label: 'Edit',
    items: [
      ['Undo', '⌘Z'],
      ['Redo', '⇧⌘Z'],
    ],
  },
  { label: 'View', items: [['Show sidebar', '⌘B']] },
];

const meta = {
  title: 'Components/Atoms/Menubar',
  component: Menubar.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'an app menu bar (File, Edit, View)',
          use: '`Menubar` with `Menu`',
          not: 'a row of buttons',
        },
      ],
      purpose:
        'A row of menus, such as File, Edit and View, for app-like tools.',
      useWhen: [
        'Editors and tools with many commands',
        'People expect desktop-app menus and shortcuts',
      ],
      alternatives: [
        { use: 'Menu', when: 'there is one set of actions behind a button' },
        { use: 'NavigationMenu', when: 'the items go to other pages' },
      ],
      do: [
        'Show shortcuts with Kbd at the end of items',
        'Offer the same commands in a command palette',
      ],
      dont: [
        'Use it on websites',
        'Hide everyday actions only in it; keep a visible button too',
      ],
    }),
    a11y: { context: 'body' },
  },
  render: () => (
    <Menubar.Root>
      {MENUS.map((menu) => (
        <Menu.Root key={menu.label}>
          <Menubar.Trigger>{menu.label}</Menubar.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                {menu.items.map(([label, shortcut]) => (
                  <Menu.Item key={label}>
                    <span className="flex-1">{label}</span>
                    <Kbd>{shortcut}</Kbd>
                  </Menu.Item>
                ))}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      ))}
    </Menubar.Root>
  ),
} satisfies Meta<typeof Menubar.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('menubar')).toBeVisible();
    await userEvent.click(canvas.getByRole('menuitem', { name: 'File' }));
    const item = await screen.findByRole('menuitem', { name: /new file/i });
    await waitFor(() => expect(item).toBeVisible());
    await userEvent.keyboard('{Escape}');
  },
};
