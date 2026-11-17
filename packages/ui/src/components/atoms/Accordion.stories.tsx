import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Accordion from './Accordion';

const faqs = [
  {
    value: 'kickoff',
    question: 'What happens in the first week?',
    answer:
      'A kickoff workshop, access to your tools, and a shared plan for the first milestone.',
  },
  {
    value: 'handoff',
    question: 'Do you hand off design files?',
    answer:
      'The component library is the source of truth; Figma mirrors it for exploration.',
  },
  {
    value: 'support',
    question: 'What does support look like after launch?',
    answer: 'A dedicated channel and a monthly review for the first quarter.',
  },
];

const meta = {
  title: 'Components/Atoms/Accordion',
  component: Accordion.Root,
  parameters: {
    ...usage({
      choose: [{ need: 'reveal optional detail in place', not: '`Tabs`' }],
      purpose:
        'Stacks sections that each expand to reveal more, so a long page stays easy to scan.',
      useWhen: [
        'FAQs or settings where people need one or two sections, not all of them',
        'Secondary detail that would otherwise push the main content down',
      ],
      alternatives: [
        {
          use: 'Tabs',
          when: 'the sections are peers people switch between, one at a time',
        },
      ],
      do: [
        'Write headers that say what is inside',
        "Keep each panel's content short",
      ],
      dont: [
        'Hide content everyone needs, like prices or errors',
        'Nest an accordion inside another accordion',
      ],
    }),
    layout: 'centered',
  },
  render: (args) => (
    <Accordion.Root className="w-96" {...args}>
      {faqs.map(({ value, question, answer }) => (
        <Accordion.Item key={value} value={value}>
          <Accordion.Header>
            <Accordion.Trigger>{question}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>{answer}</Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
} satisfies Meta<typeof Accordion.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const first = canvas.getByRole('button', { name: /first week/i });
    const second = canvas.getByRole('button', { name: /design files/i });
    await expect(first).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(first);
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() =>
      expect(canvas.getByText(/kickoff workshop/i)).toBeVisible(),
    );

    await userEvent.click(second);
    await expect(second).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() =>
      expect(first).toHaveAttribute('aria-expanded', 'false'),
    );

    await userEvent.keyboard('{Enter}');
    await expect(second).toHaveAttribute('aria-expanded', 'false');
  },
};

export const Multiple: Story = {
  args: { multiple: true, defaultValue: ['kickoff', 'support'] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: /first week/i }),
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(
      canvas.getByRole('button', { name: /after launch/i }),
    ).toHaveAttribute('aria-expanded', 'true');
  },
};

export const DisabledItem: Story = {
  render: (args) => (
    <Accordion.Root className="w-96" {...args}>
      {faqs.map(({ value, question, answer }) => (
        <Accordion.Item
          key={value}
          value={value}
          disabled={value === 'support'}
        >
          <Accordion.Header>
            <Accordion.Trigger>{question}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>{answer}</Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const support = canvas.getByRole('button', { name: /after launch/i });
    await expect(support).toHaveAttribute('data-disabled');
    support.focus();
    await userEvent.keyboard('{Enter}');
    await expect(support).toHaveAttribute('aria-expanded', 'false');
  },
};

export const LongContent: Story = {
  render: (args) => (
    <Accordion.Root className="w-96" defaultValue={['long']} {...args}>
      <Accordion.Item value="long">
        <Accordion.Header>
          <Accordion.Trigger>
            Can we keep using our existing design tokens, icon set and component
            naming while the new library is being built?
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>
          Yes. The first milestone maps your current tokens onto the
          library&rsquo;s semantic ones, so screens built today keep working.
          Icons and names carry over, and anything that changes is listed in the
          migration notes with a before and after for each component.
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /design tokens/i });
    /* The header wraps instead of overflowing the column. */
    await expect(trigger.scrollWidth).toBeLessThanOrEqual(trigger.clientWidth);
  },
};
