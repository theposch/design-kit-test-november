import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Collapsible from './Collapsible';

const meta = {
  title: 'Components/Atoms/Collapsible',
  component: Collapsible.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'tuck one section away under its title',
          not: '`Accordion` for a single section',
        },
      ],
      purpose: 'One section that opens and closes under its own heading.',
      useWhen: [
        'A side panel with sections people can tuck away',
        'Extra detail most people skip',
      ],
      alternatives: [
        { use: 'Accordion', when: 'several sections behave as one set' },
        { use: 'Tabs', when: 'the sections are peers and only one shows' },
      ],
      do: [
        'Start open when most people need the content',
        'Wrap the trigger text in a heading when it titles a section',
      ],
      dont: [
        'Hide the only copy of something people must read',
        'Nest collapsibles inside collapsibles',
      ],
    }),
  },
  args: { defaultOpen: true, onOpenChange: fn() },
  render: (args) => (
    <Collapsible.Root {...args} className="w-80">
      <Collapsible.Trigger>
        <span className="type-heading-4">Notes</span>
      </Collapsible.Trigger>
      <Collapsible.Panel>
        <p className="type-body-sm text-foreground">
          Repeat customer, third order this season. Asked for gift wrap.
        </p>
      </Collapsible.Panel>
    </Collapsible.Root>
  ),
} satisfies Meta<typeof Collapsible.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /notes/i });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByText(/gift wrap/i)).toBeVisible();

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() =>
      expect(canvas.queryByText(/gift wrap/i)).not.toBeInTheDocument(),
    );
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.anything(),
    );
  },
};

export const Closed: Story = { args: { defaultOpen: false } };
