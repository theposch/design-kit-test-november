/*
 * The three screen sizes from src/theme/breakpoints.css, as Storybook
 * toolbar options. Each sits inside its range: a phone below `tablet:`, a
 * tablet between `tablet:` and `desktop:`, a desktop above. A project can
 * draw a size at its designer's frame instead (`sizes` in project.json at the
 * repo root); scripts/lib/project.mjs reads the same file for look.mjs and
 * the Figma checks.
 */
type Size = { width: number; height: number };
type Project = { sizes?: Partial<Record<ViewportName, Partial<Size>>> };

/* A glob, not an import, so a project without the file still builds. */
const project =
  Object.values(
    import.meta.glob<Project>('../../../project.json', {
      eager: true,
      import: 'default',
    }),
  )[0] ?? {};

const DEFAULTS = {
  phone: { name: 'Phone', type: 'mobile', width: 390, height: 844 },
  tablet: { name: 'Tablet', type: 'tablet', width: 820, height: 1180 },
  desktop: { name: 'Desktop', type: 'desktop', width: 1440, height: 900 },
} as const;

export type ViewportName = keyof typeof DEFAULTS;

const viewport = (key: ViewportName) => {
  const { name, type, ...size } = DEFAULTS[key];
  const { width, height } = { ...size, ...project.sizes?.[key] };
  return { name, type, styles: { width: `${width}px`, height: `${height}px` } };
};

export const viewports = {
  phone: viewport('phone'),
  tablet: viewport('tablet'),
  desktop: viewport('desktop'),
};

/* Story globals that open a story at one of the sizes. */
export const at = (name: ViewportName) => ({
  viewport: { value: name, isRotated: false },
});
