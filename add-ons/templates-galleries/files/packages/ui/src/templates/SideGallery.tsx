import { AspectRatio } from '#components/atoms/AspectRatio';
import { Button } from '#components/atoms/Button';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Layout } from '#components/atoms/Layout';
import { Separator } from '#components/atoms/Separator';
import { Stack } from '#components/atoms/Stack';
import { Text } from '#components/atoms/Text';
import { DemoImage } from './parts/DemoImage';

const STATS = [
  { value: '12k+', label: 'Photos' },
  { value: '350+', label: 'Projects' },
  { value: '8 yrs', label: 'In business' },
];

const TILES = [
  'A teapot on a windowsill',
  'Rain on a café window',
  'A row of terracotta pots',
  'A dog asleep on a rug',
  'Bicycles outside a bakery',
  'Folded towels on a shelf',
  'A lantern in a garden',
  'Notebooks and pencils',
  'A hammock between trees',
];

/* Text and a call to action beside a square image grid; stacks on phones. */
export function SideGallery() {
  return (
    <Layout width="wide">
      <Grid columns={{ minWidth: 360, stretch: true }} gap={8} align="center">
        <Stack gap={6}>
          <Stack gap={4}>
            <Text register="body-sm" tone="muted" strong>
              Colourful
            </Text>
            <Heading level={1}>Small comforts for ordinary days</Heading>
            <Text tone="muted">
              The details that catch your eye and make you pause are the ones
              that turn an ordinary day into one worth remembering.
            </Text>
          </Stack>
          <Stack direction="row">
            <Button>Explore</Button>
          </Stack>
          <Stack gap={4}>
            <Separator />
            <Stack direction="row" gap={6} render={<dl />}>
              {STATS.map(({ value, label }) => (
                <div key={label} className="flex flex-col-reverse">
                  <Text register="body-sm" tone="muted" render={<dt />}>
                    {label}
                  </Text>
                  <Text register="body-lg" strong render={<dd />}>
                    {value}
                  </Text>
                </div>
              ))}
            </Stack>
          </Stack>
        </Stack>
        <Grid columns={3} gap={2}>
          {TILES.map((alt, i) => (
            <AspectRatio key={alt} ratio="1/1" className="rounded-lg">
              <DemoImage alt={alt} shade={i} />
            </AspectRatio>
          ))}
        </Grid>
      </Grid>
    </Layout>
  );
}
