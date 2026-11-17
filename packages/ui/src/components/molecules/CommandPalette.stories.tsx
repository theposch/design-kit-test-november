import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilePlus, Folder, Moon, Settings } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, screen, userEvent, waitFor } from 'storybook/test';

import { Button } from '#components/atoms/Button';
import { usage } from '#storybook/usage';
import { CommandPalette, type CommandGroup } from './CommandPalette';

const GROUPS: CommandGroup[] = [
  {
    label: 'Go to',
    items: [
      { value: 'projects', label: 'Projects', icon: Folder },
      { value: 'settings', label: 'Settings', icon: Settings, shortcut: '⌘,' },
    ],
  },
  {
    label: 'Actions',
    items: [
      { value: 'new', label: 'New file', icon: FilePlus, shortcut: '⌘N' },
      { value: 'theme', label: 'Switch to dark mode', icon: Moon },
    ],
  },
];

const meta = {
  title: 'Components/Molecules/CommandPalette',
  component: CommandPalette,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'search and run commands from anywhere (⌘K)',
          not: 'a `Dialog` with a list',
        },
      ],
      purpose:
        'A search box over every place and command, opened with ⌘K, for moving fast.',
      useWhen: [
        'Apps with many pages or commands',
        'People who prefer the keyboard',
      ],
      alternatives: [
        { use: 'Autocomplete', when: 'it searches content, not commands' },
        { use: 'Menu', when: 'there are only a few actions' },
      ],
      do: [
        'Also open it from a visible search button',
        'Group results: places, then actions',
      ],
      dont: [
        'Make it the only way to reach a feature',
        'Put destructive actions in it without a confirm step',
      ],
    }),
    a11y: { context: 'body' },
  },
  args: {
    open: false,
    onOpenChange: fn(),
    label: 'Search',
    placeholder: 'Search or jump to…',
    emptyText: 'Nothing matches.',
    hints: [
      { key: 'Enter', label: 'to open' },
      { key: 'Esc', label: 'to close' },
    ],
    groups: GROUPS,
    onSelect: fn(),
  },
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Search
        </Button>
        <CommandPalette {...args} open={open} onOpenChange={setOpen} />
      </>
    );
  },
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Search' }));
    const dialog = await screen.findByRole('dialog', { name: 'Search' });
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.type(
      screen.getByRole('combobox', { name: 'Search' }),
      'new',
    );
    await userEvent.keyboard('{Enter}');
    await expect(args.onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'new' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  },
};

export const NothingMatches: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Search' }));
    await userEvent.type(
      await screen.findByRole('combobox', { name: 'Search' }),
      'zzz',
    );
    const nothing = await screen.findByText('Nothing matches.');
    await waitFor(() => expect(nothing).toBeVisible());
  },
};
