import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { AspectRatio } from './AspectRatio';
import { Button } from './Button';
import * as Card from './Card';
import { Heading } from './Heading';
import { Text } from './Text';

const meta = {
  title: 'Components/Atoms/Card',
  component: Card.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'group content on a raised surface',
          not: 'a bordered `div` (card soup)',
        },
      ],
      purpose:
        'A raised surface that groups one item: a product, a form, a summary.',
      useWhen: [
        'One self-contained item in a grid or list',
        'A form that needs a frame on a plain page, like sign-in',
      ],
      alternatives: [
        { use: 'Stack', when: 'content only needs spacing, not a frame' },
        { use: 'Dialog', when: 'it must sit on top of the page' },
      ],
      do: [
        'Put images straight in Card.Root so they run edge to edge',
        'Put text and actions inside Card.Body',
      ],
      dont: [
        'Nest cards inside cards',
        'Wrap every section of a page in a card',
      ],
    }),
  },
} satisfies Meta<typeof Card.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card.Root className="w-80">
      <Card.Body>
        <Heading level={3} register="heading-4">
          Weekly summary
        </Heading>
        <Text register="body-sm" tone="muted">
          Twelve new sign-ups and three orders since Monday.
        </Text>
      </Card.Body>
    </Card.Root>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 3 })).toBeVisible();
  },
};

export const WithImage: Story = {
  render: () => (
    <Card.Root className="w-80">
      <AspectRatio ratio="4/3">
        <div className="from-muted to-secondary bg-linear-to-br" />
      </AspectRatio>
      <Card.Body>
        <div className="flex flex-col gap-1">
          <Heading level={3} register="heading-4">
            Ceramic mug
          </Heading>
          <Text register="body-sm" tone="muted">
            Hand-glazed, holds 350 ml
          </Text>
        </div>
        <Button>Add to cart</Button>
      </Card.Body>
    </Card.Root>
  ),
};

export const Muted: Story = {
  render: () => (
    <Card.Root variant="muted" className="w-80">
      <Card.Body>
        <Heading level={3} register="heading-4">
          Getting started
        </Heading>
        <Text register="body-sm">
          A muted card sits back from the page, for a hero panel or a note.
        </Text>
      </Card.Body>
    </Card.Root>
  ),
};
