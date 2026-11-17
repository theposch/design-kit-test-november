/*
 * File naming is a lint rule, not a convention to remember: a `.tsx` file
 * exports a component and is PascalCase; a `.ts` file exports functions,
 * hooks, or config and is camelCase. Middle extensions (`.stories`, `.test`,
 * `.config`) are ignored so `Button.stories.tsx` and `vite.config.ts` pass.
 * The negated globs carve out the names Vite and Storybook mandate.
 */

import checkFile from 'eslint-plugin-check-file';

export default [
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'check-file': checkFile,
    },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {
          '**/!(main|preview).tsx': 'PASCAL_CASE',
          '**/*.ts': 'CAMEL_CASE',
        },
        { ignoreMiddleExtensions: true },
      ],
    },
  },
];
