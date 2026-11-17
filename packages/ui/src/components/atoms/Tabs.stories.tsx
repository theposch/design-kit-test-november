import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Tabs from './Tabs';

const meta = {
  title: 'Components/Atoms/Tabs',
  component: Tabs.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'switch between peer views',
          not: '`Accordion`, `ToggleGroup`',
        },
      ],
      purpose: 'Switches between related views in the same place.',
      useWhen: [
        'The sections are peers and people look at one at a time',
        'The content would be too long shown side by side',
      ],
      alternatives: [
        {
          use: 'Accordion',
          when: 'people may want several sections open at once',
        },
        {
          use: 'ToggleGroup',
          when: 'it switches a mode or filter, not panels of content',
        },
        {
          use: 'Separate pages',
          when: 'the sections are unrelated or need their own URLs',
        },
      ],
      do: [
        'Keep tab labels to one or two words',
        'Keep the tabs in the same order everywhere',
      ],
      dont: ['Use tabs as steps in a sequence', 'Put tabs inside tabs'],
    }),
    layout: 'centered',
  },
  args: { defaultValue: 'overview', onValueChange: fn() },
  render: (args) => (
    <Tabs.Root className="w-96" {...args}>
      <Tabs.List>
        <Tabs.Tab value="overview">Overview</Tabs.Tab>
        <Tabs.Tab value="projects">Projects</Tabs.Tab>
        <Tabs.Tab value="billing" disabled>
          Billing
        </Tabs.Tab>
        <Tabs.Tab value="account">Account</Tabs.Tab>
        <Tabs.Indicator />
      </Tabs.List>
      <Tabs.Panel value="overview" className="type-body-sm text-foreground">
        Workspace stats and recent activity.
      </Tabs.Panel>
      <Tabs.Panel value="projects" className="type-body-sm text-foreground">
        Milestones and deadlines across every project.
      </Tabs.Panel>
      <Tabs.Panel value="billing" className="type-body-sm text-foreground">
        Plan, invoices and payment details.
      </Tabs.Panel>
      <Tabs.Panel value="account" className="type-body-sm text-foreground">
        Profile, security and preferences.
      </Tabs.Panel>
    </Tabs.Root>
  ),
} satisfies Meta<typeof Tabs.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const overview = canvas.getByRole('tab', { name: /overview/i });
    const projects = canvas.getByRole('tab', { name: /projects/i });
    const account = canvas.getByRole('tab', { name: /account/i });

    await expect(overview).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent(
      /recent activity/i,
    );

    await userEvent.click(projects);
    await expect(projects).toHaveAttribute('aria-selected', 'true');
    /* The outgoing panel lingers through its exit transition; wait it out. */
    await waitFor(() =>
      expect(canvas.getByRole('tabpanel')).toHaveTextContent(/milestones/i),
    );
    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      'projects',
      expect.anything(),
    );

    const billing = canvas.getByRole('tab', { name: /billing/i });
    await userEvent.keyboard('{ArrowRight}');
    await expect(billing).toHaveFocus();
    await expect(billing).toHaveAttribute('aria-disabled', 'true');
    await userEvent.keyboard('{Enter}');
    await expect(projects).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{ArrowRight}{Enter}');
    await expect(account).toHaveFocus();
    await expect(account).toHaveAttribute('aria-selected', 'true');
  },
};
