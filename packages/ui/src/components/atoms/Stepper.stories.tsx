import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Stepper from './Stepper';

const steps = ['Cart', 'Shipping', 'Delivery', 'Payment'];

const meta = {
  title: 'Components/Atoms/Stepper',
  component: Stepper.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'see the steps of a task and where they are',
          not: '`Tabs`, a row of numbers',
        },
      ],
      purpose: 'Shows the steps of a task done in order, and where you are.',
      useWhen: [
        'A checkout or setup split into three to six steps',
        'People need to know how much is left',
      ],
      alternatives: [
        { use: 'Tabs', when: 'the sections can be done in any order' },
        {
          use: 'Progress',
          when: 'there are no named steps, just a share done',
        },
      ],
      do: [
        'Name steps with one or two words',
        'Add hidden text like "done" to completed steps',
      ],
      dont: [
        'Use more than six steps; group them instead',
        'Use it for page navigation',
      ],
    }),
  },
  argTypes: {
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
  },
  args: { orientation: 'horizontal' },
  render: (args) => (
    <Stepper.Root {...args} aria-label="Checkout" className="w-2xl">
      {steps.map((step, index) => (
        <Stepper.Item
          key={step}
          status={index < 2 ? 'complete' : index === 2 ? 'current' : 'upcoming'}
        >
          <Stepper.Indicator>{index + 1}</Stepper.Indicator>
          <Stepper.Label>
            {step}
            {index < 2 && <span className="sr-only"> (done)</span>}
          </Stepper.Label>
          {args.orientation !== 'vertical' && index < steps.length - 1 && (
            <Stepper.Connector />
          )}
        </Stepper.Item>
      ))}
    </Stepper.Root>
  ),
} satisfies Meta<typeof Stepper.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const items = canvas.getAllByRole('listitem');
    await expect(items).toHaveLength(4);
    await expect(items[2]).toHaveAttribute('aria-current', 'step');
    await expect(items[0]).toHaveTextContent(/cart \(done\)/i);
  },
};

export const Vertical: Story = { args: { orientation: 'vertical' } };
