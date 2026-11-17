import type { Meta, StoryObj } from '@storybook/react-vite';
import { Upload } from 'lucide-react';
import { expect, fn } from 'storybook/test';

import { usage } from '#storybook/usage';
import { FileDrop } from './FileDrop';

const meta = {
  title: 'Components/Atoms/FileDrop',
  component: FileDrop,
  parameters: {
    ...usage({
      choose: [{ need: 'drop or browse for files', not: 'a bare file input' }],
      purpose: 'A zone people click to browse for files, or drop files onto.',
      useWhen: [
        'Uploading a cover, a logo or documents',
        'People may drag files from their desktop',
      ],
      alternatives: [
        { use: 'Button', when: 'the upload starts elsewhere, like a menu' },
      ],
      do: [
        'Say the accepted types and size limit inside the zone',
        'Set accept to the types you allow',
      ],
      dont: [
        'Upload before people confirm, unless it is the only step',
        'Hide which file was picked; show its name afterwards',
      ],
    }),
  },
  args: {
    'aria-label': 'Cover image',
    accept: 'image/png, image/jpeg',
    onChange: fn(),
    children: (
      <>
        <Upload aria-hidden />
        <span className="text-foreground">Drop an image or browse</span>
        <span>PNG or JPG, up to 5 MB</span>
      </>
    ),
  },
} satisfies Meta<typeof FileDrop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <FileDrop {...args} className="w-96" />,
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByLabelText('Cover image');
    await userEvent.tab();
    await expect(input).toHaveFocus();
    await userEvent.upload(
      input,
      new File(['x'], 'cover.png', { type: 'image/png' }),
    );
    await expect(args.onChange).toHaveBeenCalledOnce();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => <FileDrop {...args} className="w-96" />,
};
