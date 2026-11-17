import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Slider from './Slider';

const meta = {
  title: 'Components/Atoms/Slider',
  component: Slider.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'set a rough number by dragging (volume)',
          not: '`NumberField` when the exact number matters',
        },
      ],
      purpose: 'Sets a number by dragging along a range.',
      useWhen: [
        'The rough position matters more than the exact number (volume, zoom)',
        'The value has a clear minimum and maximum',
      ],
      alternatives: [
        { use: 'Input with type="number"', when: 'the exact number matters' },
        { use: 'Progress', when: 'the value is only shown, never changed' },
      ],
      do: [
        'Label it and show the current value',
        'Choose a step size people can feel',
      ],
      dont: [
        'Use it for precise values',
        'Make the range so large that one step is invisible',
      ],
    }),
    layout: 'centered',
  },
  args: { defaultValue: 40, onValueChange: fn() },
  render: (args) => (
    <div className="w-72">
      <Slider.Root {...args}>
        <Slider.Label>Volume</Slider.Label>
        <Slider.Value />
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </div>
  ),
} satisfies Meta<typeof Slider.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const slider = canvas.getByRole('slider', { name: /volume/i });
    await expect(slider).toHaveValue('40');

    await userEvent.click(slider);
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await expect(slider).toHaveValue('42');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      42,
      expect.anything(),
    );

    await userEvent.keyboard('{End}');
    await expect(slider).toHaveValue('100');
    await expect(canvas.getByText('100')).toBeVisible();
  },
};

export const Range: Story = {
  args: { defaultValue: [20, 80], onValueChange: fn() },
  render: (args) => (
    <div className="w-72">
      <Slider.Root {...args}>
        <Slider.Label>Price range</Slider.Label>
        <Slider.Value />
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb index={0} aria-label="Minimum price" />
            <Slider.Thumb index={1} aria-label="Maximum price" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('slider', { name: /minimum price/i }),
    ).toHaveValue('20');
    await expect(
      canvas.getByRole('slider', { name: /maximum price/i }),
    ).toHaveValue('80');
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('slider')).toBeDisabled();
  },
};
