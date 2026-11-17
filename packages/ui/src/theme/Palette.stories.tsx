import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Theme/Palette',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/*
 * Swatches carry no text: the muted and destructive pairs sit at the AA
 * contrast boundary, and addon-a11y runs at error, so sample text on the
 * swatch itself would fail the suite. Labels stay on the page background.
 */
type SwatchProps = { token: string; className: string };

function Swatch({ token, className }: SwatchProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`border-border h-16 rounded-lg border ${className}`} />
      <span className="type-body-xs text-muted-foreground">{token}</span>
    </div>
  );
}

function Group({
  title,
  description,
  swatches,
}: {
  title: string;
  description: string;
  swatches: SwatchProps[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="type-heading-3 text-foreground">{title}</h2>
        <p className="type-body-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {swatches.map((swatch) => (
          <Swatch key={swatch.token} {...swatch} />
        ))}
      </div>
    </section>
  );
}

export const Swatches: Story = {
  render: () => (
    <div className="flex flex-col gap-10">
      <Group
        title="Page"
        description="The page itself and its default foreground."
        swatches={[
          { token: 'background', className: 'bg-background' },
          { token: 'foreground', className: 'bg-foreground' },
        ]}
      />
      <Group
        title="Surface"
        description="Elevated layers — cards, popups, menus, dialogs — and their default foreground."
        swatches={[
          { token: 'surface', className: 'bg-surface' },
          { token: 'surface-foreground', className: 'bg-surface-foreground' },
        ]}
      />
      <Group
        title="Primary"
        description="The brand action: the one thing on screen you most want pressed."
        swatches={[
          { token: 'primary', className: 'bg-primary' },
          { token: 'primary-foreground', className: 'bg-primary-foreground' },
        ]}
      />
      <Group
        title="Secondary"
        description="Quiet actions and subdued fills that sit beside a primary without competing."
        swatches={[
          { token: 'secondary', className: 'bg-secondary' },
          {
            token: 'secondary-foreground',
            className: 'bg-secondary-foreground',
          },
        ]}
      />
      <Group
        title="Muted"
        description="De-emphasized text and fills — captions, placeholders, hover states."
        swatches={[
          { token: 'muted', className: 'bg-muted' },
          { token: 'muted-foreground', className: 'bg-muted-foreground' },
        ]}
      />
      <Group
        title="Destructive"
        description="Irreversible or dangerous actions and the errors that go with them."
        swatches={[
          { token: 'destructive', className: 'bg-destructive' },
          {
            token: 'destructive-foreground',
            className: 'bg-destructive-foreground',
          },
        ]}
      />
      <Group
        title="Status tints"
        description="Soft fills for badges and banners; each foreground also works as a status dot."
        swatches={[
          { token: 'success-subtle', className: 'bg-success-subtle' },
          {
            token: 'success-subtle-foreground',
            className: 'bg-success-subtle-foreground',
          },
          { token: 'warning-subtle', className: 'bg-warning-subtle' },
          {
            token: 'warning-subtle-foreground',
            className: 'bg-warning-subtle-foreground',
          },
          { token: 'info-subtle', className: 'bg-info-subtle' },
          {
            token: 'info-subtle-foreground',
            className: 'bg-info-subtle-foreground',
          },
          { token: 'destructive-subtle', className: 'bg-destructive-subtle' },
          {
            token: 'destructive-subtle-foreground',
            className: 'bg-destructive-subtle-foreground',
          },
        ]}
      />
      <Group
        title="Lines & focus"
        description="Hairline borders, form-control edges, and the focus-visible ring."
        swatches={[
          { token: 'border', className: 'bg-border' },
          { token: 'input', className: 'bg-input' },
          { token: 'ring', className: 'bg-ring' },
        ]}
      />
    </div>
  ),
};
