import { ArrowRight } from 'lucide-react';

import { AspectRatio } from '#components/atoms/AspectRatio';
import { Button } from '#components/atoms/Button';
import { Heading } from '#components/atoms/Heading';
import { Icon } from '#components/atoms/Icon';
import { Layout } from '#components/atoms/Layout';
import { Stack } from '#components/atoms/Stack';
import { Text } from '#components/atoms/Text';
import { DemoImage } from './parts/DemoImage';

/* A centred headline and actions over one wide image. */
export function CenteredHero() {
  return (
    <Layout>
      <Stack gap={10}>
        <Stack gap={6} align="center">
          <Stack gap={4} align="center">
            <Heading level={1} align="center">
              Small comforts for ordinary days
            </Heading>
            <Text tone="muted" align="center" balance className="max-w-2xl">
              Thoughtful things for the moments in between: the first coffee,
              the walk home, the quiet hour before bed.
            </Text>
          </Stack>
          <Stack direction="row" gap={2} wrap justify="center">
            <Button>
              Get started <Icon icon={ArrowRight} />
            </Button>
            <Button variant="outline">Learn more</Button>
          </Stack>
        </Stack>
        <AspectRatio ratio="16/9" className="rounded-2xl">
          <DemoImage alt="A sunlit kitchen table set for breakfast" />
        </AspectRatio>
      </Stack>
    </Layout>
  );
}
