import type { Meta, StoryObj } from '@storybook/react-vite';
import { Columns2, Funnel, Trash2 } from 'lucide-react';
import { expect, fn, screen, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import { IconButton } from './IconButton';

const meta = {
  title: 'Components/Molecules/IconButton',
  component: IconButton,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'run an action with only an icon',
          not: '`Button` with no label',
        },
      ],
      purpose:
        'A square button with only an icon, named by a tooltip and for screen readers.',
      useWhen: [
        'A well-known action in tight space, like show panel or filter',
        'A row of tools in a header',
      ],
      alternatives: [
        { use: 'Button', when: 'there is room for a word' },
        { use: 'Toggle', when: 'it switches something on and off' },
      ],
      do: [
        'Write the label as the action: "Show panel"',
        'Use icons people already know',
      ],
      dont: [
        'Use one for the main action on a page',
        'Use an icon that needs explaining',
      ],
    }),
    /* The tooltip portals to <body>, outside the story root the a11y scan reads by default. */
    a11y: { context: 'body' },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  args: { icon: Columns2, label: 'Show panel', onClick: fn() },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Show panel' });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await waitFor(() => expect(screen.getByText('Show panel')).toBeVisible());
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex gap-2">
      <IconButton icon={Funnel} label="Filter" />
      <IconButton icon={Columns2} label="Show panel" variant="outline" />
      <IconButton icon={Trash2} label="Delete" variant="destructive" />
    </div>
  ),
};
