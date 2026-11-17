import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bold, Italic, Underline, type LucideIcon } from 'lucide-react';
import { expect, screen, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Button } from './Button';
import * as Tooltip from './Tooltip';

/*
 * Base UI tooltips are visual-only: the trigger carries the accessible name
 * via `aria-label`, and the popup repeats it for sighted users.
 */
const tools: { label: string; Icon: LucideIcon }[] = [
  { label: 'Bold', Icon: Bold },
  { label: 'Italic', Icon: Italic },
  { label: 'Underline', Icon: Underline },
];

const meta = {
  title: 'Components/Atoms/Tooltip',
  component: Tooltip.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'read a short label on hover or focus',
          not: '`title=""`, `Popover`',
        },
      ],
      purpose:
        'A short label that appears on hover or keyboard focus to name or explain a control.',
      useWhen: ['Naming an icon-only button', 'A brief, non-essential hint'],
      alternatives: [
        {
          use: 'Popover',
          when: 'the content is interactive or longer than a phrase',
        },
        {
          use: 'Field description',
          when: 'the hint matters for filling in a form',
        },
      ],
      do: [
        'Keep it to a few words',
        'Still give icon-only buttons an aria-label',
      ],
      dont: [
        'Put links or buttons inside it',
        "Hide essential information in it; touch screens can't hover",
      ],
    }),

    layout: 'centered',
    /*
     * The popup portals to <body>, outside the story root the a11y addon
     * scans by default; widening the context puts the open tooltip's contrast
     * under test.
     */
    a11y: { context: 'body' },
  },
  render: (args) => (
    <Tooltip.Provider>
      <div className="flex gap-1">
        {tools.map(({ label, Icon }, index) => (
          <Tooltip.Root key={label} {...(index === 0 ? args : {})}>
            <Tooltip.Trigger
              render={<Button variant="ghost" size="sm" aria-label={label} />}
            >
              <Icon aria-hidden />
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>
                  <Tooltip.Arrow />
                  {label}
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </div>
    </Tooltip.Provider>
  ),
} satisfies Meta<typeof Tooltip.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const bold = canvas.getByRole('button', { name: /^bold$/i });

    await userEvent.tab();
    await expect(bold).toHaveFocus();
    const tip = await screen.findByText('Bold');
    await waitFor(() => expect(tip).toBeVisible());

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Bold')).toBeNull());
  },
};

export const Open: Story = {
  args: { defaultOpen: true },
};
