import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentPropsWithRef } from 'react';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { LinkButton } from './LinkButton';

const meta = {
  title: 'Components/Atoms/LinkButton',
  component: LinkButton,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'go to another page, styled as a button',
          not: '`Button` with `onClick` navigation',
        },
      ],
      purpose:
        "A link styled as a button, for navigation that deserves a button's weight.",
      useWhen: [
        'A call to action that goes to another page ("Start free trial")',
        'A router link that needs button styling; pass it through render',
      ],
      alternatives: [
        { use: 'Button', when: 'the click performs an action on this page' },
      ],
      do: [
        "Pass your router's link component through render",
        'Use the same variants as Button so the page stays consistent',
      ],
      dont: [
        'Use it to submit a form or open a dialog',
        'Cancel the navigation in an onClick',
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
} satisfies Meta<typeof LinkButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'View pricing', href: '#pricing' },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: /view pricing/i });
    await expect(link).toHaveAttribute('href', '#pricing');
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument();
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <LinkButton href="#">Primary</LinkButton>
      <LinkButton href="#" variant="secondary">
        Secondary
      </LinkButton>
      <LinkButton href="#" variant="outline">
        Outline
      </LinkButton>
      <LinkButton href="#" variant="ghost">
        Ghost
      </LinkButton>
      <LinkButton href="#" variant="destructive">
        Delete
      </LinkButton>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <LinkButton href="#" size="sm">
        Small
      </LinkButton>
      <LinkButton href="#" size="md">
        Medium
      </LinkButton>
      <LinkButton href="#" size="lg">
        Large
      </LinkButton>
    </div>
  ),
};

/*
 * Stands in for a router's link component (React Router `Link`, TanStack
 * `Link`, …): it owns navigation, takes `to` instead of `href`, and spreads
 * the rest onto the anchor — exactly what `render` expects to receive.
 */
function RouterLink({
  to,
  ...props
}: { to: string } & Omit<ComponentPropsWithRef<'a'>, 'href'>) {
  return <a href={to} {...props} />;
}

export const WithRouterLink: Story = {
  args: { children: 'Open settings' },
  render: (args) => (
    <LinkButton {...args} render={<RouterLink to="/settings" />} />
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: /open settings/i });
    await expect(link).toHaveAttribute('href', '/settings');
  },
};
