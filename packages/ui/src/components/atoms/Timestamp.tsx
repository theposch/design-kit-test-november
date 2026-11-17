import type { ComponentProps } from 'react';

import { cn } from '#lib/utils';

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
];

const FORMATS = {
  date: { dateStyle: 'medium' },
  time: { timeStyle: 'short' },
  datetime: { dateStyle: 'medium', timeStyle: 'short' },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

function relative(date: Date, now: Date, locale: string) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const [unit, size] =
    UNITS.find(([, length]) => Math.abs(seconds) >= length) ?? UNITS[6];
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
    Math.round(seconds / size),
    unit,
  );
}

type TimestampProps = Omit<
  ComponentProps<'time'>,
  'children' | 'dateTime' | 'className'
> & {
  date: Date;
  /** The reader's language, e.g. `en-GB`; it decides the words and order. */
  locale: string;
  /** `relative` reads "3 hours ago"; the exact time stays on hover. */
  format?: keyof typeof FORMATS | 'relative';
  /** The moment `relative` counts from. Pass it to keep stories and tests stable. */
  now?: Date;
  className?: string;
};

/* A date or time in the reader's language, marked up so machines can read it too. */
export function Timestamp({
  date,
  locale,
  format = 'date',
  now,
  className,
  ...props
}: TimestampProps) {
  const exact = new Intl.DateTimeFormat(locale, FORMATS.datetime).format(date);
  return (
    <time
      dateTime={date.toISOString()}
      title={format === 'relative' ? exact : undefined}
      className={cn('whitespace-nowrap', className)}
      {...props}
    >
      {format === 'relative'
        ? relative(date, now ?? new Date(), locale)
        : new Intl.DateTimeFormat(locale, FORMATS[format]).format(date)}
    </time>
  );
}
