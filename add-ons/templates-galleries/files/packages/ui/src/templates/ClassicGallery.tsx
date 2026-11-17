import { useState } from 'react';

import { AspectRatio } from '#components/atoms/AspectRatio';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Layout } from '#components/atoms/Layout';
import { Stack } from '#components/atoms/Stack';
import { Text } from '#components/atoms/Text';
import { Toggle } from '#components/atoms/Toggle';
import { ToggleGroup } from '#components/atoms/ToggleGroup';
import { DemoImage } from './parts/DemoImage';

type Category = 'all' | 'people' | 'places' | 'home';

const FILTERS: { value: Category; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'people', label: 'People' },
  { value: 'places', label: 'Places' },
  { value: 'home', label: 'Home' },
];

const PHOTOS: { alt: string; category: Exclude<Category, 'all'> }[] = [
  { alt: 'A harbour at dusk', category: 'places' },
  { alt: 'Two friends laughing on a bench', category: 'people' },
  { alt: 'A reading nook by a window', category: 'home' },
  { alt: 'A mountain road in fog', category: 'places' },
  { alt: 'A baker shaping dough', category: 'people' },
  { alt: 'A tiled kitchen with copper pans', category: 'home' },
  { alt: 'A quiet street after rain', category: 'places' },
  { alt: 'A potter at the wheel', category: 'people' },
  { alt: 'A hallway lined with plants', category: 'home' },
];

/* A centred intro, a filter, and an even grid of photos. */
export function ClassicGallery() {
  const [filter, setFilter] = useState<Category>('all');
  const shown =
    filter === 'all' ? PHOTOS : PHOTOS.filter((p) => p.category === filter);

  return (
    <Layout width="wide">
      <Stack gap={8}>
        <Stack gap={4} align="center" className="mx-auto max-w-2xl">
          <Stack gap={2} align="center">
            <Heading level={1} align="center">
              Moments worth keeping
            </Heading>
            <Text tone="muted" align="center" balance>
              A collection of everyday scenes, sorted so you can find the mood
              you are after.
            </Text>
          </Stack>
          <ToggleGroup
            aria-label="Filter photos"
            value={[filter]}
            onValueChange={(values) => {
              const [next] = values as Category[];
              if (next) setFilter(next);
            }}
          >
            {FILTERS.map(({ value, label }) => (
              <Toggle key={value} value={value} size="sm">
                {label}
              </Toggle>
            ))}
          </ToggleGroup>
        </Stack>
        <Grid columns={{ minWidth: 240, stretch: true }} gap={4}>
          {shown.map(({ alt }, i) => (
            <AspectRatio key={alt} ratio="3/2" className="rounded-xl">
              <DemoImage alt={alt} shade={i} />
            </AspectRatio>
          ))}
        </Grid>
      </Stack>
    </Layout>
  );
}
