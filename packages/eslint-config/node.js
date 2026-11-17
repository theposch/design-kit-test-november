import globals from 'globals';

/* Tooling scripts run in Node; browser globals cover code they send into a page (Playwright's evaluate). */
export default [
  {
    files: ['scripts/**/*.{js,mjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
];
