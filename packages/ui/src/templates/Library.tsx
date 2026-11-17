import { ArrowDownUp, Search, SearchX } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';

import { AspectRatio } from '#components/atoms/AspectRatio';
import { Button } from '#components/atoms/Button';
import * as Card from '#components/atoms/Card';
import * as EmptyState from '#components/atoms/EmptyState';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Icon } from '#components/atoms/Icon';
import { Input } from '#components/atoms/Input';
import { Layout } from '#components/atoms/Layout';
import * as Menu from '#components/atoms/Menu';
import { Separator } from '#components/atoms/Separator';
import { Stack } from '#components/atoms/Stack';
import { Text } from '#components/atoms/Text';
import { Toggle } from '#components/atoms/Toggle';
import { ToggleGroup } from '#components/atoms/ToggleGroup';
import { GROUPS, PARTS, type Part } from './parts/catalogue';
import { DemoImage } from './parts/DemoImage';

type Sort = 'a-z' | 'z-a' | 'newest';

const SORTS: { value: Sort; label: string }[] = [
  { value: 'a-z', label: 'A to Z' },
  { value: 'z-a', label: 'Z to A' },
  { value: 'newest', label: 'Newest' },
];

function sorted(parts: Part[], sort: Sort) {
  if (sort === 'newest') return [...parts].reverse();
  const az = [...parts].sort((a, b) => a.name.localeCompare(b.name));
  return sort === 'a-z' ? az : az.reverse();
}

/* A searchable, filterable catalogue of cards, grouped under headings. */
export function Library() {
  const [group, setGroup] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('a-z');

  const sections = useMemo(() => {
    const words = query.trim().toLowerCase();
    const matches = sorted(PARTS, sort).filter(
      (part) =>
        (group === 'All' || part.group === group) &&
        (words === '' ||
          `${part.name} ${part.summary}`.toLowerCase().includes(words)),
    );
    return GROUPS.map((name) => ({
      name,
      parts: matches.filter((part) => part.group === name),
    })).filter((section) => section.parts.length > 0);
  }, [group, query, sort]);

  return (
    <Layout header={<Heading level={1}>Library</Heading>} width="wide">
      <Stack gap={6}>
        <Stack gap={4}>
          <div className="relative">
            <Icon
              icon={Search}
              className="text-muted-foreground pointer-events-none absolute start-4 top-1/2 -translate-y-1/2"
            />
            <Input
              type="search"
              aria-label="Search the library"
              placeholder="Search"
              size="lg"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="ps-10"
            />
          </div>
          <Stack direction="row" gap={4} align="center" justify="between">
            <div className="min-w-0 scrollbar-none overflow-x-auto">
              <ToggleGroup
                aria-label="Filter by group"
                value={[group]}
                onValueChange={(values) => {
                  const [next] = values;
                  if (next) setGroup(next);
                }}
              >
                {['All', ...GROUPS].map((name) => (
                  <Toggle key={name} value={name}>
                    {name}
                  </Toggle>
                ))}
              </ToggleGroup>
            </div>
            <Menu.Root>
              <Menu.Trigger render={<Button variant="outline" />}>
                <ArrowDownUp aria-hidden />
                {SORTS.find((option) => option.value === sort)?.label}
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner align="end">
                  <Menu.Popup>
                    <Menu.RadioGroup
                      value={sort}
                      onValueChange={(value) => setSort(value as Sort)}
                    >
                      {SORTS.map((option) => (
                        <Menu.RadioItem key={option.value} value={option.value}>
                          <Menu.RadioItemIndicator />
                          {option.label}
                        </Menu.RadioItem>
                      ))}
                    </Menu.RadioGroup>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Stack>
        </Stack>

        {sections.length === 0 ? (
          <EmptyState.Root>
            <EmptyState.Media>
              <SearchX />
            </EmptyState.Media>
            <EmptyState.Title>No results</EmptyState.Title>
            <EmptyState.Description>
              Nothing matches “{query}”. Try another word or pick All.
            </EmptyState.Description>
          </EmptyState.Root>
        ) : (
          sections.map((section, index) => (
            <Fragment key={section.name}>
              <Separator />
              <Stack gap={6} render={<section />}>
                <Heading level={2}>{section.name}</Heading>
                <Grid columns={{ minWidth: 320 }} gap={4}>
                  {section.parts.map((part) => (
                    <Card.Root key={part.name}>
                      <AspectRatio ratio="16/9">
                        <DemoImage alt={`${part.name} preview`} shade={index} />
                      </AspectRatio>
                      <Card.Body className="gap-1 p-4">
                        <Heading level={3} register="heading-4">
                          {part.name}
                        </Heading>
                        <Text register="body-sm" tone="muted">
                          {part.summary}
                        </Text>
                      </Card.Body>
                    </Card.Root>
                  ))}
                </Grid>
              </Stack>
            </Fragment>
          ))
        )}
      </Stack>
    </Layout>
  );
}
