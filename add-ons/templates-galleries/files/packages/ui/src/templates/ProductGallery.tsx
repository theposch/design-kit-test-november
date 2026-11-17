import { ArrowRight } from 'lucide-react';

import { AspectRatio } from '#components/atoms/AspectRatio';
import { Button } from '#components/atoms/Button';
import * as Card from '#components/atoms/Card';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Icon } from '#components/atoms/Icon';
import { Layout } from '#components/atoms/Layout';
import { Stack } from '#components/atoms/Stack';
import { Text } from '#components/atoms/Text';
import { DemoImage } from './parts/DemoImage';

const PRODUCTS = [
  {
    name: 'Travel mug',
    blurb: 'Keeps coffee hot for the whole commute.',
    price: 32,
  },
  {
    name: 'Linen napkins',
    blurb: 'A set of four, softer with every wash.',
    price: 28,
  },
  {
    name: 'Desk lamp',
    blurb: 'Warm light that dims down for the evening.',
    price: 89,
  },
  {
    name: 'Stoneware bowl',
    blurb: 'Glazed by hand, safe in the dishwasher.',
    price: 24,
  },
  {
    name: 'Wool throw',
    blurb: 'Heavy enough for winter, light to fold away.',
    price: 120,
  },
  {
    name: 'Notebook set',
    blurb: 'Three dotted notebooks in seasonal colours.',
    price: 18,
  },
];

const price = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/* An intro beside a call to action, over a grid of products. */
export function ProductGallery() {
  return (
    <Layout>
      <Stack gap={6}>
        <Grid columns={{ minWidth: 280, stretch: true }} gap={4} align="start">
          <Heading level={1}>Things that make the day a little better</Heading>
          <Stack gap={4} align="start">
            <Text>
              Everyday objects, chosen because they are a pleasure to use. Each
              one is made to last and easy to love.
            </Text>
            <Button>
              Shop all <Icon icon={ArrowRight} />
            </Button>
          </Stack>
        </Grid>
        <Grid columns={{ minWidth: 280, max: 3 }} gap={6}>
          {PRODUCTS.map((product, i) => (
            <Stack key={product.name} gap={4}>
              <Card.Root>
                <AspectRatio ratio="1/1">
                  <DemoImage alt={product.name} shade={i} />
                </AspectRatio>
              </Card.Root>
              <Stack gap={1}>
                <Heading level={2} register="heading-4">
                  {product.name}
                </Heading>
                <Text tone="muted" lines="2">
                  {product.blurb}
                </Text>
                <Text register="body-lg" strong>
                  {price.format(product.price)}
                </Text>
              </Stack>
            </Stack>
          ))}
        </Grid>
      </Stack>
    </Layout>
  );
}
