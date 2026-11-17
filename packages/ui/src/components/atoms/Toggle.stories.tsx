import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bold } from 'lucide-react';
import { expect, fn } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Toggle } from './Toggle';

const meta = {
  title: 'Components/Atoms/Toggle',
  component: Toggle,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'press an on/off tool (Bold)',
          use: '`Toggle` / `ToggleGroup`',
          not: '`Switch`',
        },
      ],
      purpose:
        'A button that stays pressed or unpressed, like Bold in a text editor.',
      useWhen: [
        'Turning a formatting or view option on and off',
        'Compact on/off controls in a toolbar',
      ],
      alternatives: [
        { use: 'Switch', when: 'it is a setting in a settings list' },
        {
          use: 'ToggleGroup',
          when: 'several related toggles, or one choice among several',
        },
        { use: 'Button', when: 'it runs an action once' },
      ],
      do: [
        'Give icon-only toggles an aria-label',
        'Keep the label the same whether pressed or not',
      ],
      dont: [
        'Change the label when pressed ("Bold" to "Unbold")',
        'Use it for navigation',
      ],
    }),
    layout: 'centered',
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: {
    'aria-label': 'Bold',
    children: <Bold aria-hidden />,
    onPressedChange: fn(),
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const toggle = canvas.getByRole('button', { name: /bold/i });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(args.onPressedChange).toHaveBeenLastCalledWith(
      true,
      expect.anything(),
    );
  },
};

export const WithText: Story = {
  args: {
    'aria-label': undefined,
    children: (
      <>
        <Bold aria-hidden />
        Bold
      </>
    ),
    defaultPressed: true,
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Toggle {...args} size="sm" />
      <Toggle {...args} size="md" />
      <Toggle {...args} size="lg" />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button')).toBeDisabled();
  },
};
