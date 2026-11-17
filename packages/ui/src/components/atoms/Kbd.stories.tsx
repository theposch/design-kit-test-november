import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Kbd } from './Kbd';

const meta = {
  title: 'Components/Atoms/Kbd',
  component: Kbd,
  parameters: {
    ...usage({
      choose: [
        { need: 'show a keyboard key or shortcut', not: '`code` or a `Badge`' },
      ],
      purpose: 'Shows a key or shortcut to press.',
      useWhen: [
        'Next to a menu item or command that has a shortcut',
        'In help text that names a key, like "press Enter"',
      ],
      alternatives: [
        { use: 'Badge', when: 'it is a status, not a key' },
        { use: 'Text', when: 'it is ordinary code or a value' },
      ],
      do: [
        'Use the symbols people see on their keyboard: ⌘ ⇧ ⌥',
        'Keep one key or one combination per Kbd',
      ],
      dont: [
        'Make it clickable',
        'Show shortcuts that do not work on this device',
      ],
    }),
  },
  args: { children: '⌘K' },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('⌘K').tagName).toBe('KBD');
  },
};

export const InText: Story = {
  render: () => (
    <p className="type-body-sm text-foreground">
      Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search, or <Kbd>Esc</Kbd> to close.
    </p>
  ),
};
