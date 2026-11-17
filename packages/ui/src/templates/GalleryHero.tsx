import { ArrowRight } from 'lucide-react';

import { AspectRatio } from '#components/atoms/AspectRatio';
import { Button } from '#components/atoms/Button';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Icon } from '#components/atoms/Icon';
import { Layout } from '#components/atoms/Layout';
import { Stack } from '#components/atoms/Stack';
import { Text } from '#components/atoms/Text';
import { DemoImage } from './parts/DemoImage';

const IMAGES = [
  'A ceramic vase of dried flowers',
  'Morning light across a linen bed',
  'A stack of paperback books on a stool',
];

/* A centred headline and actions over a row of tall images. */
export function GalleryHero() {
  return (
    <Layout>
      <Stack gap={10}>
        <Stack gap={6} align="center">
          <Stack gap={4} align="center">
            <Heading level={1} align="center">
              Small comforts for ordinary days
            </Heading>
            <Text tone="muted" align="center" balance className="max-w-2xl">
              Thoughtful things for the moments in between.
            </Text>
          </Stack>
          <Stack direction="row" gap={2} wrap justify="center">
            <Button>
              Get started <Icon icon={ArrowRight} />
            </Button>
            <Button variant="outline">Learn more</Button>
          </Stack>
        </Stack>
        <Grid columns={{ minWidth: 200, stretch: true }} gap={4}>
          {IMAGES.map((alt, i) => (
            <AspectRatio key={alt} ratio="4/5" className="rounded-xl">
              <DemoImage alt={alt} shade={i} />
            </AspectRatio>
          ))}
        </Grid>
      </Stack>
    </Layout>
  );
}
