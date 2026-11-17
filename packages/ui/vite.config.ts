import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import type { TestProjectConfiguration } from 'vitest/config';

/*
 * The a11y checks only see the palette a story renders in, and light/dark
 * live entirely in palette.css — so the story suite runs once per mode.
 * initialGlobals is injected at runtime (vitest provide/inject), NOT via
 * define(): a build-time define bakes into the optimizer cache the two
 * projects share (the plugin keys it on configDir) and poisons the other
 * mode's run.
 */
function storybookProject(theme: 'Light' | 'Dark'): TestProjectConfiguration {
  return {
    extends: true,
    plugins: [
      storybookTest({
        configDir: path.join(import.meta.dirname, '.storybook'),
        initialGlobals: { theme },
      }),
    ],
    test: {
      name: `storybook-${theme.toLowerCase()}`,
      setupFiles: ['./.storybook/vitest.setup.ts'],
      /* Story files share one page instead of a fresh one each: about twice as fast. */
      isolate: false,
      browser: {
        enabled: true,
        headless: true,
        provider: playwright({}),
        instances: [{ browser: 'chromium' }],
      },
    },
  };
}

/*
 * Every Base UI part the library imports, bundled before any story runs.
 * Otherwise Vite meets a part it hasn't bundled partway through a run (say,
 * after switching to a branch with a new component), rebundles and reloads
 * the browser, and the stories already running fail. A changed list also
 * resets Vite's cache, so a stale cache from another branch can't linger.
 */
function baseUiParts() {
  const src = path.join(import.meta.dirname, 'src');
  const parts = new Set<string>();
  for (const file of readdirSync(src, { recursive: true, encoding: 'utf8' })) {
    if (!/\.tsx?$/.test(file)) continue;
    const text = readFileSync(path.join(src, file), 'utf8');
    for (const [part] of text.matchAll(/@base-ui\/react\/[\w-]+/g)) {
      parts.add(part);
    }
  }
  return [...parts].sort();
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: { include: baseUiParts() },
  test: {
    projects: [
      {
        /*
         * Node unit tests (`*.test.ts`) for build-config invariants no story
         * can host - e.g. the typography.css <-> utils.ts registration guard.
         * The Storybook project below discovers only story files, so a
         * `.test.ts` runs here and nowhere else.
         */
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.{ts,tsx}'],
          environment: 'node',
        },
      },
      storybookProject('Light'),
      storybookProject('Dark'),
    ],
  },
});
