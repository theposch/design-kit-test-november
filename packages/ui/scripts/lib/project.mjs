/*
 * The project's screen sizes, from project.json at the repo root:
 *
 *   { "screens": ["phone"], "sizes": { "phone": { "width": 402, "height": 874 } } }
 *
 * `screens` is which sizes the product has; `sizes` overrides the size a
 * screen is drawn at (the designer's phone frame, say). With no file, or no
 * `screens`, a project has all three sizes at their defaults.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const REPO = path.resolve(import.meta.dirname, '..', '..', '..', '..');
export const PROJECT_FILE = path.join(REPO, 'project.json');

export const SCREENS = ['phone', 'tablet', 'desktop'];

export const DEFAULT_SIZES = {
  phone: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1440, height: 900 },
};

/* Where each size has to sit, from src/theme/breakpoints.css (48rem, 64rem). */
const RANGES = {
  phone: [0, 767],
  tablet: [768, 1023],
  desktop: [1024, Infinity],
};

export function readProject(file = PROJECT_FILE) {
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(
      `${path.basename(file)} isn't valid JSON: ${error.message}`,
      {
        cause: error,
      },
    );
  }
}

/* Settings with the defaults filled in, plus any problems found. */
export function projectScreens(project = readProject()) {
  const problems = [];
  const screens = Array.isArray(project.screens)
    ? project.screens.filter((name) => {
        if (SCREENS.includes(name)) return true;
        problems.push(
          `"${name}" isn't a screen size; use ${SCREENS.join(', ')}.`,
        );
        return false;
      })
    : [...SCREENS];
  const sizes = {};
  for (const name of SCREENS) {
    const size = { ...DEFAULT_SIZES[name], ...project.sizes?.[name] };
    const [min, max] = RANGES[name];
    if (size.width < min || size.width > max)
      problems.push(
        `The ${name} width ${size.width} sits outside the ${name} range (${min}–${max === Infinity ? '…' : max}), so it would show the wrong layout.`,
      );
    sizes[name] = size;
  }
  return {
    screens: screens.length ? screens : [...SCREENS],
    sizes,
    set: Array.isArray(project.screens),
    problems,
  };
}
