import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { expect, fn } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Toggle } from './Toggle';
import { ToggleGroup } from './ToggleGroup';

const meta = {
  title: 'Components/Atoms/ToggleGroup',
  component: ToggleGroup,
  parameters: {
    ...usage({
      purpose:
        'A set of toggles that work together, with one or several pressed.',
      useWhen: [
        'Text alignment or view modes such as grid and list',
        'Formatting options that combine, like bold and italic (set multiple)',
      ],
      alternatives: [
        {
          use: 'Radio',
          when: 'a form choice that needs visible labels and descriptions',
        },
        { use: 'Tabs', when: 'each option shows a different panel of content' },
      ],
      do: [
        'Label the group with aria-label',
        'Give icon-only items an aria-label',
      ],
      dont: [
        'Mix unrelated actions in one group',
        "Use it for actions that don't stay pressed",
      ],
    }),
    layout: 'centered',
  },
  args: {
    'aria-label': 'Text alignment',
    defaultValue: ['left'],
    onValueChange: fn(),
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <Toggle value="left" size="sm" aria-label="Align left">
        <AlignLeft aria-hidden />
      </Toggle>
      <Toggle value="center" size="sm" aria-label="Align center">
        <AlignCenter aria-hidden />
      </Toggle>
      <Toggle value="right" size="sm" aria-label="Align right">
        <AlignRight aria-hidden />
      </Toggle>
    </ToggleGroup>
  ),
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const left = canvas.getByRole('button', { name: /align left/i });
    const center = canvas.getByRole('button', { name: /align center/i });
    await expect(left).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(center);
    await expect(center).toHaveAttribute('aria-pressed', 'true');
    await expect(left).toHaveAttribute('aria-pressed', 'false');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      ['center'],
      expect.anything(),
    );

    await userEvent.keyboard('{ArrowRight}');
    await expect(
      canvas.getByRole('button', { name: /align right/i }),
    ).toHaveFocus();
  },
};

export const Multiple: Story = {
  args: { multiple: true, defaultValue: ['left', 'right'] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: /align left/i }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      canvas.getByRole('button', { name: /align right/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    for (const toggle of canvas.getAllByRole('button')) {
      await expect(toggle).toBeDisabled();
    }
    /* Disabled toggles leave the tab order, so Tab finds nothing to press. */
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};
