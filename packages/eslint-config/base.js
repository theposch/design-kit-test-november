import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import tsEslint from 'typescript-eslint';
import commentHygiene from './comment-hygiene.js';

export default [
  eslint.configs.recommended,
  ...tsEslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  // Type-aware rules require TS parser services, which JS files don't have.
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tsEslint.configs.disableTypeChecked,
  },
  {
    plugins: {
      '@eslint-community/eslint-comments': eslintComments,
    },
    rules: {
      '@eslint-community/eslint-comments/require-description': 'error',
      /*
       * An exception is one line with its reason, where a review sees it. A
       * file-wide disable switches a contract rule off for everything after
       * it, so new code in that file is never checked.
       */
      '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
      '@eslint-community/eslint-comments/disable-enable-pair': [
        'error',
        { allowWholeFile: false },
      ],
    },
  },
  {
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },
  {
    plugins: {
      'comment-hygiene': commentHygiene,
    },
    rules: {
      'comment-hygiene/no-mechanical-comments': 'error',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  prettierConfig,
];
