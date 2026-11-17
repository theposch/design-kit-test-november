import { AspectRatio } from '#components/atoms/AspectRatio';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Layout } from '#components/atoms/Layout';
import { Stack } from '#components/atoms/Stack';
import { Text } from '#components/atoms/Text';
import { DemoImage } from './parts/DemoImage';

/*
 * A wide feature image beside a single tile, over a row of three. Every row
 * is the same height: the feature spans two columns at 3:1, which matches
 * one 3:2 tile. Below tablet width all tiles stack at 3:2.
 */
export function MixedGallery() {
  return (
    <Layout width="wide">
      <Stack gap={6}>
        <Stack gap={2} align="center">
          <Heading level={1} align="center">
            Moments worth keeping
          </Heading>
          <Text tone="muted" align="center" balance>
            A few favourite scenes from this season.
          </Text>
        </Stack>
        <Grid columns={1} gap={4} className="tablet:grid-cols-3">
          <AspectRatio
            ratio="3/2"
            className="tablet:col-span-2 tablet:aspect-3/1 rounded-xl"
          >
            <DemoImage alt="A coastline at golden hour" />
          </AspectRatio>
          <AspectRatio ratio="3/2" className="rounded-xl">
            <DemoImage alt="A bowl of lemons on a table" shade={1} />
          </AspectRatio>
          <AspectRatio ratio="3/2" className="rounded-xl">
            <DemoImage alt="A cyclist on a tree-lined path" shade={2} />
          </AspectRatio>
          <AspectRatio ratio="3/2" className="rounded-xl">
            <DemoImage alt="A window seat with cushions" shade={3} />
          </AspectRatio>
          <AspectRatio ratio="3/2" className="rounded-xl">
            <DemoImage alt="A market stall of flowers" shade={0} />
          </AspectRatio>
        </Grid>
      </Stack>
    </Layout>
  );
}
