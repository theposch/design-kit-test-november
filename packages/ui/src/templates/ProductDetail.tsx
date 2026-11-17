import { Heart, Star } from 'lucide-react';
import { useId, useState } from 'react';

import * as Accordion from '#components/atoms/Accordion';
import { AspectRatio } from '#components/atoms/AspectRatio';
import { Badge } from '#components/atoms/Badge';
import * as Banner from '#components/atoms/Banner';
import { Button } from '#components/atoms/Button';
import * as Card from '#components/atoms/Card';
import * as Field from '#components/atoms/Field';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Icon } from '#components/atoms/Icon';
import { Layout } from '#components/atoms/Layout';
import * as NumberField from '#components/atoms/NumberField';
import { Stack } from '#components/atoms/Stack';
import { Text } from '#components/atoms/Text';
import { TextLink } from '#components/atoms/TextLink';
import { Toggle } from '#components/atoms/Toggle';
import { ToggleGroup } from '#components/atoms/ToggleGroup';
import { IconButton } from '#components/molecules/IconButton';
import { DemoImage } from './parts/DemoImage';

const PHOTOS = [
  'The jacket from the front',
  'The jacket from the back',
  'The collar up close',
  'The inside lining',
  'Worn with the hood up',
  'Folded into its pocket',
];

const COLOURS = ['Moss', 'Navy', 'Sand'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

const DETAILS = [
  {
    title: 'Details',
    text: 'Recycled nylon shell with a light, quilted lining. Two zip pockets and a hood that rolls into the collar.',
  },
  {
    title: 'Delivery and returns',
    text: 'Free delivery over $100. Return it unworn within 30 days for a full refund.',
  },
  {
    title: 'Care',
    text: 'Machine wash cold on a gentle cycle. Hang to dry. Do not iron.',
  },
];

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/* A labelled row of single-choice toggles, such as colours or sizes. */
function Options({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}) {
  const labelId = useId();
  return (
    <Stack gap={2}>
      <Text id={labelId} register="label-sm" render={<span />}>
        {label}
        {value[0] && (
          <span className="text-muted-foreground">: {value[0]}</span>
        )}
      </Text>
      <ToggleGroup
        aria-labelledby={labelId}
        value={value}
        onValueChange={onChange}
        className="w-fit flex-wrap"
      >
        {options.map((option) => (
          <Toggle key={option} value={option} className="px-4">
            {option}
          </Toggle>
        ))}
      </ToggleGroup>
      {error && (
        <Text register="body-sm" tone="destructive" role="alert">
          {error}
        </Text>
      )}
    </Stack>
  );
}

/*
 * A product page: a photo gallery on one side and everything needed to
 * choose and buy on the other. They stack on phones.
 */
export function ProductDetail() {
  const [photo, setPhoto] = useState(0);
  const [colour, setColour] = useState(['Moss']);
  const [size, setSize] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number | null>(1);
  const [sizeError, setSizeError] = useState<string>();
  const [added, setAdded] = useState(false);

  /* Demo only: a size must be chosen before the jacket goes in the bag. */
  function addToBag() {
    const missing = size.length === 0;
    setSizeError(missing ? 'Choose a size.' : undefined);
    setAdded(!missing);
  }

  return (
    <Layout>
      <Grid columns={{ minWidth: 320, max: 2 }} gap={12} align="start">
        <Stack gap={4}>
          <Card.Root variant="muted">
            <AspectRatio ratio="4/5">
              <DemoImage alt={PHOTOS[photo] ?? ''} shade={photo} />
            </AspectRatio>
          </Card.Root>
          <ToggleGroup
            aria-label="Photos"
            value={[String(photo)]}
            onValueChange={(value) => {
              if (value[0] !== undefined) setPhoto(Number(value[0]));
            }}
            className="grid grid-cols-6 gap-2 border-0 bg-transparent p-0"
          >
            {PHOTOS.map((alt, index) => (
              <Toggle
                key={alt}
                value={String(index)}
                aria-label={`Show photo ${index + 1}: ${alt}`}
                className="data-pressed:ring-primary h-auto overflow-hidden p-0 data-pressed:ring-2"
              >
                <AspectRatio ratio="1/1" className="w-full">
                  <DemoImage alt={alt} shade={index} />
                </AspectRatio>
              </Toggle>
            ))}
          </ToggleGroup>
        </Stack>

        <Stack gap={8}>
          <Stack gap={4}>
            <Text register="body-sm" tone="muted">
              <TextLink href="#outerwear">Outerwear</TextLink> / Jackets
            </Text>
            <Heading level={1} register="heading-2">
              Harbour packable jacket
            </Heading>
            <Stack direction="row" align="center" gap={2}>
              <span
                role="img"
                aria-label="Rated 4 out of 5"
                className="text-primary flex"
              >
                {[0, 1, 2, 3, 4].map((star) => (
                  <Icon
                    key={star}
                    icon={Star}
                    className={star < 4 ? 'size-4 fill-current' : 'size-4'}
                  />
                ))}
              </span>
              <TextLink href="#reviews" className="type-body-sm">
                128 reviews
              </TextLink>
            </Stack>
            <Stack direction="row" align="center" gap={2}>
              <Text register="body-lg" strong>
                {money.format(119)}
              </Text>
              <Text register="body-sm" tone="muted" className="line-through">
                <span className="sr-only">Was </span>
                {money.format(149)}
              </Text>
              <Badge variant="destructive">Sale</Badge>
            </Stack>
            <Text tone="muted">
              A light rain jacket that packs into its own pocket. Made for
              changeable days by the sea.
            </Text>
          </Stack>

          <Options
            label="Colour"
            options={COLOURS}
            value={colour}
            onChange={setColour}
          />
          <Options
            label="Size"
            options={SIZES}
            value={size}
            onChange={(value) => {
              setSize(value);
              setSizeError(undefined);
            }}
            error={sizeError}
          />

          <Field.Root className="w-40">
            <Field.Label>Quantity</Field.Label>
            <NumberField.Root
              value={quantity}
              onValueChange={setQuantity}
              min={1}
              max={10}
            >
              <NumberField.Group>
                <NumberField.Decrement label="One fewer" />
                <NumberField.Input />
                <NumberField.Increment label="One more" />
              </NumberField.Group>
            </NumberField.Root>
          </Field.Root>

          <Stack gap={4}>
            <Stack direction="row" gap={2}>
              <Button size="lg" className="flex-1" onClick={addToBag}>
                Add to bag
              </Button>
              <IconButton
                icon={Heart}
                label="Save for later"
                variant="outline"
                size="lg"
              />
            </Stack>
            {added && (
              <Banner.Root status="success">
                <Banner.Title>
                  Added {quantity} {colour[0]} jacket in {size[0]} to your bag.
                </Banner.Title>
              </Banner.Root>
            )}
          </Stack>

          <Accordion.Root>
            {DETAILS.map((item) => (
              <Accordion.Item key={item.title} value={item.title}>
                <Accordion.Header render={<h2 />}>
                  <Accordion.Trigger>{item.title}</Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel>
                  <Text register="body-sm" tone="muted">
                    {item.text}
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </Stack>
      </Grid>
    </Layout>
  );
}
