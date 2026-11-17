import {
  base,
  filenames,
  libraryContract,
  node,
  react,
  storybook,
  tailwindContract,
} from '@repo/eslint-config';

export default [
  ...base,
  ...filenames,
  ...node,
  ...react,
  ...storybook,
  ...tailwindContract('src/globals.css', {
    layoutFiles: ['src/templates/**/*.tsx'],
  }),
  ...libraryContract(),
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: [
      'storybook-static/**',
      'node_modules/**',
      '.look/**',
      '.figma/**',
    ],
  },
];
