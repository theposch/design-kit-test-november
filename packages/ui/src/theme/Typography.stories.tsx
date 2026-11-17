import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { expect } from 'storybook/test';

const meta = {
  title: 'Theme/Typography',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/*
 * Each composite class must appear as a literal string for Tailwind's scanner
 * to emit it, so the rows cannot be mapped from TYPE_SIZE_TOKENS in
 * #lib/utils. Keep this list in sync with the composites in typography.css.
 */
function Specimen({
  composite,
  children,
}: {
  composite: string;
  children: string;
}) {
  return (
    <div className="border-border flex items-baseline gap-6 border-b pb-3">
      <span className="type-body-sm text-muted-foreground w-36 shrink-0">
        {composite}
      </span>
      <span className={composite}>{children}</span>
    </div>
  );
}

export const TypeScale: Story = {
  render: () => (
    <div className="text-foreground flex flex-col gap-3">
      <Specimen composite="type-heading-1">Design in code</Specimen>
      <Specimen composite="type-heading-2">Design in code</Specimen>
      <Specimen composite="type-heading-3">Design in code</Specimen>
      <Specimen composite="type-heading-4">Design in code</Specimen>
      <Specimen composite="type-body-lg">
        The quick brown fox jumps over the lazy dog.
      </Specimen>
      <Specimen composite="type-body-base">
        The quick brown fox jumps over the lazy dog.
      </Specimen>
      <Specimen composite="type-body-sm">
        The quick brown fox jumps over the lazy dog.
      </Specimen>
      <Specimen composite="type-body-xs">
        The quick brown fox jumps over the lazy dog.
      </Specimen>
      <Specimen composite="type-label-base">Save changes</Specimen>
      <Specimen composite="type-label-sm">Save changes</Specimen>
      <Specimen composite="type-label-xs">Save changes</Specimen>
    </div>
  ),
};

const PARAGRAPH =
  'Type that wraps shows its line height: too open and the lines drift apart, too tight and they collide. Each style sets its own.';

/* Line height only shows once text wraps, so each style runs at a narrow measure. */
export const Wrapped: Story = {
  render: () => (
    <div className="text-foreground flex max-w-md flex-col gap-8">
      <p className="type-heading-1">
        Design systems that designers write in code
      </p>
      <p className="type-heading-2">
        Design systems that designers write in code
      </p>
      <p className="type-heading-3">
        Design systems that designers write in code
      </p>
      <p className="type-heading-4">
        Design systems that designers write in code
      </p>
      <p className="type-body-lg">{PARAGRAPH}</p>
      <p className="type-body-base">{PARAGRAPH}</p>
      <p className="type-body-sm">{PARAGRAPH}</p>
      <p className="type-body-xs">{PARAGRAPH}</p>
    </div>
  ),
};

/*
 * Copy the designer didn't write: a translation's long compound word, stacked
 * accents, a script Geist doesn't cover. Nothing may spill past its column.
 */
export const Stress: Story = {
  render: () => (
    <div className="text-foreground flex flex-col gap-8">
      <div data-testid="column" className="flex w-64 flex-col gap-4">
        <h2 className="type-heading-2">
          Datenschutzgrundverordnungskonformität
        </h2>
        <h3 className="type-heading-3">
          Paramètres de confidentialité et de sécurité du compte
        </h3>
        <p className="type-body-base">
          https://example.com/settings/notifications/email-preferences
        </p>
        <span className="type-label-sm">Benachrichtigungseinstellungen</span>
      </div>
      <div className="flex flex-col gap-2">
        <p className="type-heading-3">Ếểỗ Ộờ Ữự Ặẫ gjpqy</p>
        <p className="type-body-sm">Ếểỗ Ộờ Ữự Ặẫ gjpqy, stacked accents</p>
        <p className="type-body-base">設定を保存しました。こんにちは。</p>
        <p className="type-body-base">تم حفظ الإعدادات</p>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const column = canvas.getByTestId('column');
    for (const child of Array.from(column.children)) {
      await expect(child.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
    }
  },
};

/* Someone who sets their browser to bigger text gets bigger type everywhere. */
export const LargeText: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        const root = document.documentElement;
        root.style.fontSize = '200%';
        return () => {
          root.style.fontSize = '';
        };
      }, []);
      return <Story />;
    },
  ],
  render: () => (
    <div className="text-foreground flex max-w-md flex-col gap-4">
      <p className="type-heading-2">Design in code</p>
      <p data-testid="body" className="type-body-base">
        {PARAGRAPH}
      </p>
      <span className="type-label-sm">Save changes</span>
    </div>
  ),
  play: async ({ canvas }) => {
    const size = getComputedStyle(canvas.getByTestId('body')).fontSize;
    await expect(size).toBe('32px');
  },
};

const SAMPLE_LINE = 'The quick brown fox jumps over the lazy dog, 0123456789.';

/*
 * Until Geist loads, text shows in Geist Fallback: Arial reshaped to Geist's
 * width and line box. The two lines should run to nearly the same length;
 * after a font change, retune it (see font.css) and check here.
 */
export const BackupFont: Story = {
  render: () => (
    <div className="text-foreground flex flex-col gap-2">
      <p className="type-body-base w-fit whitespace-nowrap">{SAMPLE_LINE}</p>
      <p
        className="type-body-base w-fit whitespace-nowrap"
        style={{ fontFamily: "'Geist Fallback'" }}
      >
        {SAMPLE_LINE}
      </p>
    </div>
  ),
};
