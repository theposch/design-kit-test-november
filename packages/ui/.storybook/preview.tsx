import { withThemeByClassName } from '@storybook/addon-themes';
import type { Decorator, Preview } from '@storybook/react-vite';

import '../src/globals.css';
import { ThemedDocsContainer } from './ThemedDocsContainer';
import { viewports } from './viewports';

/*
 * Modes live at the token level, so switching only has to move the `.dark`
 * class — zero component involvement. The toolbar switcher covers manual
 * review; automated coverage comes from vite.config.ts, which runs the story
 * suite once per mode by seeding the `theme` global per Vitest project.
 */
const THEMES = { Light: '', Dark: 'dark' };
const withTheme: Decorator = withThemeByClassName({
  themes: THEMES,
  defaultTheme: 'Light',
});

const preview: Preview = {
  tags: ['autodocs'],
  decorators: [
    /* A theme typed into the address (`theme:dark`) matches in any case, and
     * an unknown one falls back to Light instead of crashing the story. */
    (Story, context) => {
      const asked = String(context.globals.theme ?? '').toLowerCase();
      const theme =
        Object.keys(THEMES).find((name) => name.toLowerCase() === asked) ??
        'Light';
      return withTheme(Story, {
        ...context,
        globals: { ...context.globals, theme },
      });
    },
  ],
  parameters: {
    backgrounds: { disable: true },
    docs: { container: ThemedDocsContainer },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'error',
      config: {
        rules: [
          /*
           * Base UI puts invisible, aria-hidden "focus guards" around popups
           * so Tab moves into and out of them. They are meant to be
           * focusable; every other aria-hidden element is still checked.
           */
          {
            id: 'aria-hidden-focus',
            selector: '[aria-hidden="true"]:not([data-base-ui-focus-guard])',
          },
        ],
      },
    },
    viewport: { options: viewports },
  },
};

export default preview;
