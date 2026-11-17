import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Field from './Field';
import { Textarea } from './Textarea';

const meta = {
  title: 'Components/Atoms/Textarea',
  component: Textarea,
  parameters: {
    ...usage({
      choose: [
        { need: 'type several lines (a comment, a message)', not: '`Input`' },
      ],
      purpose: 'Multi-line text entry: comments, descriptions, messages.',
      useWhen: [
        'The answer may run past one line',
        'Inside a Field, with a label',
      ],
      alternatives: [{ use: 'Input', when: 'the answer fits on one line' }],
      do: [
        'Let it grow with its content, as it does by default',
        'Mention any length limit in the Field description',
      ],
      dont: [
        'Use it for short single values',
        'Rely on the placeholder as the label',
      ],
    }),
    layout: 'centered',
  },
  args: {
    'aria-label': 'Project brief',
    placeholder: 'What are we building, and for whom?',
    rows: 4,
  },
  render: (args) => (
    <div className="w-80">
      <Textarea {...args} />
    </div>
  ),
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const textarea = canvas.getByRole('textbox', { name: /project brief/i });
    await userEvent.type(textarea, 'A booking app{enter}for dog walkers');
    await expect(textarea).toHaveValue('A booking app\nfor dog walkers');
  },
};

export const InField: Story = {
  args: { 'aria-label': undefined, required: true },
  render: (args) => (
    <Field.Root className="w-80" validationMode="onBlur">
      <Field.Label>Feedback</Field.Label>
      <Textarea {...args} placeholder="Tell us what worked and what didn’t" />
      <Field.Description>Shared with the project lead only.</Field.Description>
      <Field.Error match="valueMissing">Add a few words first.</Field.Error>
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const textarea = canvas.getByRole('textbox', { name: /feedback/i });
    await expect(textarea).toHaveAccessibleDescription(/project lead/i);

    await userEvent.type(textarea, 'x');
    await userEvent.clear(textarea);
    await userEvent.tab();
    await waitFor(() =>
      expect(canvas.getByText(/add a few words/i)).toBeVisible(),
    );
    await expect(textarea).toHaveAttribute('aria-invalid', 'true');
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Locked while the review is open.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toBeDisabled();
  },
};
