import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Separator } from './Separator';

const meta = {
  title: 'Components/Atoms/Separator',
  component: Separator,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'divide groups of content with a thin line',
          not: 'an `<hr>`; a line where a gap would do',
        },
      ],
      purpose: 'A thin line that divides groups of content.',
      useWhen: [
        'Between groups in a toolbar, list or panel',
        "When spacing alone doesn't make the groups clear",
      ],
      alternatives: [
        { use: 'Spacing', when: 'a gap is enough; prefer space over lines' },
      ],
      do: [
        'Try spacing first',
        'Use the vertical orientation between items in a row',
      ],
      dont: [
        'Stack separators to draw borders',
        "Add lines that don't separate real groups",
      ],
    }),
    layout: 'centered',
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div className="type-body-sm text-foreground flex w-72 flex-col gap-3">
      <p>Account settings</p>
      <Separator {...args} />
      <p className="text-muted-foreground">Billing and invoices</p>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('separator')).toHaveAttribute(
      'aria-orientation',
      'horizontal',
    );
  },
};

export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div className="type-body-sm text-foreground flex h-5 items-center gap-3">
      <span>Docs</span>
      <Separator {...args} />
      <span>Changelog</span>
      <Separator {...args} />
      <span>Support</span>
    </div>
  ),
  play: async ({ canvas }) => {
    const [first] = canvas.getAllByRole('separator');
    await expect(first).toHaveAttribute('aria-orientation', 'vertical');
  },
};
