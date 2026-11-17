import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Banner from './Banner';

const meta = {
  title: 'Components/Atoms/Banner',
  component: Banner.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'explain a problem with the whole form',
          not: 'a toast, a `Badge`',
        },
      ],
      purpose:
        'A message that sits in the page, above the content it is about.',
      useWhen: [
        'A form as a whole could not be sent',
        'A notice about the page, like scheduled maintenance',
      ],
      alternatives: [
        { use: 'Field.Error', when: 'the problem belongs to one input' },
        { use: 'Toaster', when: 'it confirms an action and can go away' },
        { use: 'AlertDialog', when: 'people must decide before going on' },
      ],
      do: [
        'Say what happened and what to do next',
        'Place it right above the thing it is about',
      ],
      dont: [
        'Stack several banners; merge them into one',
        'Use destructive for anything that is not a problem',
      ],
    }),
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['info', 'success', 'warning', 'destructive'],
    },
  },
  args: { status: 'destructive' },
  render: (args) => (
    <Banner.Root {...args} className="max-w-md">
      <Banner.Title>We couldn&apos;t send your message</Banner.Title>
      <Banner.Description>
        Check your connection and try again.
      </Banner.Description>
    </Banner.Root>
  ),
} satisfies Meta<typeof Banner.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      /couldn.t send your message/i,
    );
  },
};

export const Statuses: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-3">
      <Banner.Root status="info">
        <Banner.Title>Maintenance on Sunday from 2 to 4 am</Banner.Title>
      </Banner.Root>
      <Banner.Root status="success">
        <Banner.Title>Your settings are saved</Banner.Title>
      </Banner.Root>
      <Banner.Root status="warning">
        <Banner.Title>Your trial ends in 3 days</Banner.Title>
        <Banner.Description>
          Add a payment method to keep your projects.
        </Banner.Description>
      </Banner.Root>
      <Banner.Root status="destructive">
        <Banner.Title>Please enter both email and password</Banner.Title>
      </Banner.Root>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('status')).toHaveLength(3);
    await expect(canvas.getByRole('alert')).toBeVisible();
  },
};
