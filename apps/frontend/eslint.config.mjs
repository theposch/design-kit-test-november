import {
  appContract,
  base,
  filenames,
  react,
  tailwindContract,
} from '@repo/eslint-config';

export default [
  ...base,
  ...filenames,
  ...react,
  ...tailwindContract('src/index.css', { layoutFiles: ['src/**/*.tsx'] }),
  ...appContract(),
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ['dist/**'],
  },
];
