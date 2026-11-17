import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Theme/Radii',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Corner({ token, className }: { token: string; className: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`bg-primary h-20 w-28 ${className}`} />
      <span className="type-body-xs text-muted-foreground">{token}</span>
    </div>
  );
}

export const RadiusScale: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-6">
      <Corner token="rounded-sm" className="rounded-sm" />
      <Corner token="rounded-md" className="rounded-md" />
      <Corner token="rounded-lg" className="rounded-lg" />
      <Corner token="rounded-xl" className="rounded-xl" />
      <Corner token="rounded-2xl" className="rounded-2xl" />
      <Corner token="rounded-3xl" className="rounded-3xl" />
      <Corner token="rounded-4xl" className="rounded-4xl" />
    </div>
  ),
};
