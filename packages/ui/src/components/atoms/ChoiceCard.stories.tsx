import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId } from 'react';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { ChoiceCard } from './ChoiceCard';
import * as Radio from './Radio';
import { RadioGroup } from './RadioGroup';

const plans = [
  {
    value: 'starter',
    name: 'Starter',
    price: '$0',
    text: 'For trying things out.',
  },
  {
    value: 'team',
    name: 'Team',
    price: '$12',
    text: 'For small teams shipping weekly.',
  },
  {
    value: 'scale',
    name: 'Scale',
    price: '$32',
    text: 'For many teams and audits.',
  },
];

const meta = {
  title: 'Components/Atoms/ChoiceCard',
  component: ChoiceCard,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'pick an option that needs a description',
          use: '`ChoiceCard` around a `Radio`',
          not: 'a `Card` with `onClick`',
        },
      ],
      purpose:
        'A card people pick by clicking anywhere on it, for choices that need a description.',
      useWhen: [
        'Plans, shipping speeds or templates to choose between',
        'Each option has a price or a line of detail',
      ],
      alternatives: [
        { use: 'Radio', when: 'the labels are short and need no detail' },
        { use: 'Select', when: 'there are many options' },
      ],
      do: [
        'Put exactly one Radio or Checkbox inside',
        'Keep the cards the same height in a row',
      ],
      dont: [
        'Put buttons or links inside the card',
        'Mix radio and checkbox cards in one group',
      ],
    }),
  },
  render: function Render() {
    const labelId = useId();
    return (
      <div className="flex flex-col gap-3">
        <span id={labelId} className="type-body-sm text-foreground">
          Plan
        </span>
        <RadioGroup
          aria-labelledby={labelId}
          defaultValue="team"
          className="grid w-xl grid-cols-3 gap-3"
        >
          {plans.map((plan) => (
            <ChoiceCard key={plan.value}>
              <Radio.Root value={plan.value} className="mt-0.5">
                <Radio.Indicator />
              </Radio.Root>
              <span className="flex flex-col gap-1">
                <span className="type-body-sm type-strong">{plan.name}</span>
                <span className="type-heading-4">{plan.price}</span>
                <span className="type-body-sm text-muted-foreground">
                  {plan.text}
                </span>
              </span>
            </ChoiceCard>
          ))}
        </RadioGroup>
      </div>
    );
  },
} satisfies Meta<typeof ChoiceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const scale = canvas.getByRole('radio', { name: /scale/i });
    await userEvent.click(canvas.getByText('For many teams and audits.'));
    await expect(scale).toBeChecked();
  },
};
