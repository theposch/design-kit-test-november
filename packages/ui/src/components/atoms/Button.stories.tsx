import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Button } from './Button';

const meta = {
  title: 'Components/Atoms/Button',
  component: Button,
  parameters: {
    ...usage({
      choose: [
        { need: 'run an action here', not: '`LinkButton`, a clickable `div`' },
      ],
      purpose: 'Runs an action on the current page: save, submit, open.',
      useWhen: [
        'The click does something rather than going somewhere',
        'Submitting a form or opening a Dialog, Menu or Popover',
      ],
      alternatives: [
        { use: 'LinkButton', when: 'the click goes to another page or URL' },
        {
          use: 'Toggle',
          when: 'it switches something on and off and stays pressed',
        },
      ],
      do: [
        'Use one primary button per area; secondary, outline or ghost for the rest',
        'Label it with a verb: "Save changes", not "OK"',
        'Give icon-only buttons an aria-label',
      ],
      dont: [
        'Use it for navigation',
        'Use the destructive variant just to draw attention',
      ],
    }),
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'Button', onClick: fn() },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: /button/i });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Delete</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { children: 'Unavailable', disabled: true },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /unavailable/i });
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('data-disabled');
  },
};
