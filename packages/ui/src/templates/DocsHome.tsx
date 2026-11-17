import { Button } from '#components/atoms/Button';
import * as Card from '#components/atoms/Card';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Layout } from '#components/atoms/Layout';
import { LinkCard } from '#components/atoms/LinkCard';
import { Stack } from '#components/atoms/Stack';
import { Text } from '#components/atoms/Text';
import { GROUPS, PARTS } from './parts/catalogue';

/* The front page of a docs site: a welcome panel, then every part by group. */
export function DocsHome() {
  return (
    <Layout width="wide">
      <Stack gap={10}>
        <Card.Root variant="muted">
          <Grid
            columns={1}
            gap={8}
            className="desktop:grid-cols-2 tablet:p-10 p-6"
          >
            <Stack gap={4} align="start">
              <Heading level={1}>Component guide</Heading>
              <Text register="body-lg" tone="muted">
                The parts this kit is built from, with when to use each one and
                how they fit together.
              </Text>
              <Button size="lg">Get started</Button>
            </Stack>
          </Grid>
        </Card.Root>

        {GROUPS.map((group) => (
          <Stack key={group} gap={4} render={<section />}>
            <Heading level={2}>{group}</Heading>
            <Grid columns={{ minWidth: 240 }} gap={2} className="-m-2">
              {PARTS.filter((part) => part.group === group).map((part) => (
                <LinkCard
                  key={part.name}
                  variant="ghost"
                  href={`#${part.name.toLowerCase()}`}
                  className="gap-4"
                >
                  <div className="bg-muted h-40 rounded-lg" />
                  <Stack gap={1}>
                    <Text strong>{part.name}</Text>
                    <Text tone="muted" lines="3">
                      {part.summary}
                    </Text>
                  </Stack>
                </LinkCard>
              ))}
            </Grid>
          </Stack>
        ))}
      </Stack>
    </Layout>
  );
}
