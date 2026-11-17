/*
 * The styling contract: components style exclusively with the semantic tokens
 * defined in src/theme/. This config catches off-contract values (hard-coded
 * colors, radii, font sizes/families) at lint time instead of review time.
 * See docs/adr/0003-lint-enforced-token-contract.md.
 *
 * Each message states the problem, why it matters, the fix, and the
 * workaround that does not count, so an agent can act on it without opening
 * CLAUDE.md.
 */

import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import { getDefaultSelectors } from 'eslint-plugin-better-tailwindcss/api/defaults';

const FOCUS_RING_SOURCE = 'src/lib/focusRing.ts';

/*
 * The plugin only scans variables named like `className` or `classes`, so the
 * shared class constants in src/lib/ (`focusRing*`, `dialogClasses`) would
 * otherwise escape every rule here.
 */
const selectors = [
  ...getDefaultSelectors(),
  {
    kind: 'variable',
    name: String.raw`^(?:focusRing\w*|\w+Classes)$`,
    match: [{ type: 'strings' }, { type: 'objectValues' }],
  },
];

const tokenRules = [
  {
    pattern: String.raw`(?:^|:)(?:bg|text|border(?:-[trblxyse])?|from|via|to|fill|stroke|ring|outline|shadow|inset-shadow|decoration|accent|caret|divide)-\[[^\]]*(?:#[0-9a-fA-F]{3,8}\b|(?<![a-zA-Z0-9-])(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\()`,
    message:
      'Off-contract color literal. Why: a literal color ignores light/dark mode and every future theme. Fix: use a palette token class (bg-primary, text-muted-foreground, …); if none fits, add a token with a .dark override to src/theme/palette.css. Not a fix: wrapping the literal in var(--x, #hex).',
  },
  {
    pattern: String.raw`(?:^|:)(?:bg|text|border(?:-[trblxyse])?|from|via|to|fill|stroke|ring|outline|shadow|inset-shadow|decoration|accent|caret|divide)-\[(?![^\]]*var\(--)`,
    message:
      'Arbitrary value on a color utility. Why: only palette tokens follow the mode and theme. Fix: use a palette token class, or add a token to src/theme/palette.css. Not a fix: an arbitrary value that happens to equal a token today.',
  },
  {
    pattern: String.raw`(?:^|:)rounded(?:-(?:t|r|b|l|tl|tr|br|bl|s|e|ss|se|es|ee))?-\[[^\]]*\d+(?:px|rem|em|%)`,
    message:
      'Off-contract radius. Why: every radius derives from --radius so a theme can retune them all at once. Fix: use rounded-sm … rounded-4xl, or add a token to src/theme/radii.css. Not a fix: rounded-[var(--some-new-var)] defined outside radii.css.',
  },
  {
    pattern: String.raw`(?:^|:)text-\[[^\]]*\d+(?:px|rem|em|%)`,
    message:
      'Off-contract font size. Why: size, weight, leading and tracking are tuned together as one type style (docs/adr/0004). Fix: use a type composite (type-body-*, type-label-*, type-heading-*) from src/theme/typography.css. Not a fix: pairing a raw size with a leading-* class.',
  },
  {
    pattern: String.raw`(?:^|:)font-(?:sans|serif|mono\b|\[)`,
    message:
      'Off-contract font family. Why: families belong to the type composites so a theme can swap them in one place. Fix: use a type composite (type-body-*, type-label-*, type-heading-*), or add a token to src/theme/font.css.',
  },
  {
    pattern: String.raw`(?:^|\s|'|"|` + '`' + String.raw`)dark:`,
    message:
      'The `dark:` variant in a component. Why: components are mode-blind; light and dark diverge only in src/theme/palette.css (docs/adr/0006). Fix: use semantic token classes and adjust the token pair in palette.css. Not a fix: `[.dark_&]:`, `light-dark()` or a media query in the component.',
  },
  {
    pattern: String.raw`(?:^|:)text-(?:xs|sm|base|lg|xl|[2-9]xl)\b`,
    message:
      "Tailwind's default text scale. Why: it bypasses the type composites, so size drifts from weight and leading (docs/adr/0004). Fix: use type-body-*, type-label-* or type-heading-*.",
  },
  {
    pattern: String.raw`(?:^|:)text-(?:body|label|heading)-`,
    message:
      'Bare size token. Why: the size tokens are internal to the type composites (docs/adr/0004). Fix: use the matching type-body-*, type-label-* or type-heading-* composite.',
  },
  {
    pattern: String.raw`(?:^|:)leading-`,
    message:
      'Standalone line height. Why: each type style sets its own line height, tuned to its size, so a font swap retunes them in one place (docs/adr/0004). Fix: use the type-body-* / type-label-* / type-heading-* composite; to change one, edit its --<style>-leading in src/theme/typography.css.',
  },
  {
    pattern: String.raw`(?:^|:)tracking-`,
    message:
      'Standalone letter spacing. Why: each type style sets its own tracking, so a font swap retunes them in one place (docs/adr/0004). Fix: use the type-body-* / type-label-* / type-heading-* composite; to change one, edit its --<style>-tracking in src/theme/typography.css.',
  },
  {
    pattern: String.raw`(?:^|:)font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b`,
    message:
      'Standalone font weight. Why: weight belongs to the type style, not the call site (docs/adr/0004). Fix: pick the type-body-* / type-label-* / type-heading-* composite with the weight you need; if none exists, add one to src/theme/typography.css (and mirror it in lib/utils.ts).',
  },
  {
    pattern: String.raw`(?:^|:)(?:(?:group|peer)-)?focus(?:-within)?:(?:ring(?:$|-)|outline-(?!none$)|border-)`,
    message:
      'Focus style on `focus:` or `focus-within:`. Why: those also fire on mouse click, so the ring flashes for pointer users. Fix: compose focusRing / focusRingBordered / focusRingWithin from #lib/focusRing.',
  },
  {
    pattern: String.raw`(?:^|:)duration-(?:\d|\[)`,
    message:
      'Raw transition duration. Why: only the motion tokens drop to 0ms under prefers-reduced-motion. Fix: duration-(--motion-duration-fast|normal|slow), or duration-(--motion-hover-duration) for hover. Not a fix: duration-[150ms].',
  },
  {
    pattern: String.raw`(?<!motion-safe)(?:^|:)animate-(?!none$)`,
    message:
      'Animation without a reduced-motion guard. Why: keyframe animations ignore the motion tokens, so they keep running for people who asked the OS to stop motion. Fix: prefix it with `motion-safe:` (motion-safe:animate-pulse). Not a fix: a shorter animation.',
  },
];

const handWrittenRingRules = [
  {
    pattern: String.raw`(?:^|:)(?:(?:group|peer)-)?focus-visible:(?:ring(?:$|-(?:\d|\[))|border-ring\b|outline-(?:\d|ring\b|\[))`,
    message:
      'Hand-written focus ring. Why: the keyboard focus indicator is tuned in one place so it stays consistent. Fix: compose focusRing (or focusRingBordered) from #lib/focusRing; colour overrides such as focus-visible:ring-destructive/20 are fine. Not a fix: copying the ring classes here.',
  },
  {
    pattern: String.raw`(?:^|:)has-focus-visible:(?:ring(?:$|-(?:\d|\[))|outline-(?:\d|ring\b|\[))`,
    message:
      'Hand-written focus ring. Why: the keyboard focus indicator is tuned in one place so it stays consistent. Fix: compose focusRingWithin from #lib/focusRing.',
  },
];

/*
 * Page-level layout (templates, apps) steps in 8px. Components keep the finer
 * 4px half-steps inside their own padding, so this applies only to the files
 * a caller lists.
 */
const SPACING = String.raw`(?:^|:)-?(?:p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy])-`;
const layoutGridRules = [
  {
    pattern: SPACING + String.raw`(?:0\.5|1\.5|2\.5|3\.5|[3579]|1[13579])$`,
    message:
      'Off-grid spacing. Why: page layout steps in multiples of 8px so every page shares one rhythm; 4px (step 1) is the one finer step, for pairing a label with its text. Fix: use step 2, 4, 6, 8, 10, 12, 14 or 16 (8px each), or a Stack/Grid gap. Not a fix: an arbitrary value such as p-[12px].',
  },
  {
    pattern: SPACING + String.raw`\[`,
    message:
      'Arbitrary spacing. Why: page layout steps in multiples of 8px so every page shares one rhythm. Fix: use step 2, 4, 6, 8, 10, 12, 14 or 16 (8px each), or a Stack/Grid gap.',
  },
];

export default function tailwindContract(
  entryPoint,
  { layoutFiles = [] } = {},
) {
  return [
    {
      files: ['src/**/*.{ts,tsx}'],
      plugins: {
        'better-tailwindcss': betterTailwindcss,
      },
      settings: {
        'better-tailwindcss': {
          entryPoint,
          selectors,
        },
      },
      rules: {
        'better-tailwindcss/no-restricted-classes': [
          'error',
          { restrict: [...tokenRules, ...handWrittenRingRules] },
        ],
        'better-tailwindcss/no-unknown-classes': 'error',
      },
    },
    ...(layoutFiles.length > 0
      ? [
          {
            files: layoutFiles,
            rules: {
              'better-tailwindcss/no-restricted-classes': [
                'error',
                {
                  restrict: [
                    ...tokenRules,
                    ...handWrittenRingRules,
                    ...layoutGridRules,
                  ],
                },
              ],
            },
          },
        ]
      : []),
    {
      files: [FOCUS_RING_SOURCE],
      rules: {
        'better-tailwindcss/no-restricted-classes': [
          'error',
          { restrict: tokenRules },
        ],
      },
    },
  ];
}
