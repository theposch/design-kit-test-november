/*
 * CLAUDE.md's library rules as lint: strings come from above, className is
 * merged, colors and modes stay in src/theme/, and the import and tier
 * boundaries hold. See docs/adr/0003 for why the contract is lint-enforced.
 *
 * Flat config replaces, not merges, a rule set by two matching blocks, so each
 * `no-restricted-imports` block below repeats the shared patterns. Patterns
 * use gitignore syntax, where a leading `#` starts a comment: `\\#components`
 * escapes it, or the pattern silently matches nothing.
 */

import uiContract from './ui-contract.js';

const COMPONENT_SOURCE = ['src/components/**/*.tsx'];
const NOT_STORIES = ['**/*.stories.tsx', '**/*.test.{ts,tsx}'];

const sharedImportPatterns = [
  {
    group: ['@/*'],
    message:
      "Bundler aliases resolve against the consumer's bundler and break the source-only package. Fix: use the package's # subpath imports (#components/*, #lib/*, #hooks/*).",
  },
  {
    group: ['../*', '../**'],
    message:
      'Relative imports must not climb out of the folder. Fix: use the # subpath imports (#components/atoms/Button, #lib/utils). Not a fix: a longer ../../ chain.',
  },
];

const baseUiBarrel = {
  name: '@base-ui/react',
  message:
    "Import one Base UI component per file from its subpath. Fix: `import { Dialog as BaseDialog } from '@base-ui/react/dialog'`.",
};

const atomPatterns = [
  ...sharedImportPatterns,
  {
    group: ['\\#components/**', './*', '!./*.css'],
    message:
      "Atoms must not compose other library components (CLAUDE.md, Component tiers). Fix: if this needs another component, it is a molecule; move it to src/components/molecules/. Shared styling goes in src/lib/ (like buttonVariants or focusRing). Not a fix: re-implementing the other component's markup inline.",
  },
];

const moleculePatterns = [
  ...sharedImportPatterns,
  {
    group: ['\\#components/organisms/**'],
    message:
      'Molecules compose atoms and molecules only (CLAUDE.md, Component tiers). Fix: move this composition up to src/components/organisms/, or pass the organism in as children.',
  },
];

/*
 * Raw elements a library component already covers, with what to use. Atoms
 * are exempt: wrapping these elements is their job.
 */
const RAW_ELEMENTS = {
  button:
    'Button (or a Base UI part such as Dialog.Trigger with render={<Button />})',
  a: 'LinkButton when it should look like a button; a plain <a> stays fine for inline text links',
  input:
    'Input, Checkbox.Root, Radio.Root inside RadioGroup, Switch.Root or Slider.Root',
  textarea: 'Textarea',
  select: 'Select',
  hr: 'Separator',
  progress: 'Progress',
  dialog: 'Dialog, or AlertDialog to confirm a risky action',
  details: 'Accordion',
};

const rawElementRules = Object.entries(RAW_ELEMENTS)
  .filter(([element]) => element !== 'a')
  .map(([element, use]) => ({
    selector: `JSXOpeningElement[name.name='${element}']`,
    message: `Raw <${element}>. Why: the library version carries the tokens, focus ring, keyboard handling and a11y wiring this one lacks. Fix: use ${use} (see "Which component?" in CLAUDE.md). Not a fix: copying the library's classes onto the raw element.`,
  }));

export function libraryContract() {
  return [
    {
      files: ['src/**/*.{ts,tsx}'],
      ignores: ['src/index.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          { paths: [baseUiBarrel], patterns: sharedImportPatterns },
        ],
      },
    },
    {
      files: ['src/components/atoms/*.tsx'],
      ignores: NOT_STORIES,
      rules: {
        'no-restricted-imports': [
          'error',
          { paths: [baseUiBarrel], patterns: atomPatterns },
        ],
      },
    },
    {
      files: ['src/components/molecules/*.tsx'],
      ignores: NOT_STORIES,
      rules: {
        'no-restricted-imports': [
          'error',
          { paths: [baseUiBarrel], patterns: moleculePatterns },
        ],
      },
    },
    {
      files: COMPONENT_SOURCE,
      ignores: NOT_STORIES,
      plugins: { 'ui-contract': uiContract },
      rules: {
        'ui-contract/no-hardcoded-strings': 'error',
        'ui-contract/classname-passthrough': 'error',
      },
    },
    {
      files: [
        'src/components/molecules/*.tsx',
        'src/components/organisms/*.tsx',
      ],
      ignores: NOT_STORIES,
      rules: {
        'no-restricted-syntax': ['error', ...rawElementRules],
      },
    },
    {
      /*
       * Templates are pages built the way an app builds them: library
       * components only, so copying one into an app passes the app contract.
       */
      files: ['src/templates/**/*.tsx'],
      ignores: NOT_STORIES,
      rules: {
        'no-restricted-syntax': ['error', ...rawElementRules],
        'no-restricted-imports': [
          'error',
          {
            paths: [baseUiBarrel],
            patterns: [
              ...sharedImportPatterns,
              {
                group: ['@base-ui/react/*'],
                message:
                  'Templates use library components, never Base UI directly, so they copy cleanly into an app. Fix: import the component from #components/*; if it is missing, add it to the library first.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/**/*.{ts,tsx}'],
      ignores: [...NOT_STORIES, 'src/theme/**'],
      plugins: { 'ui-contract': uiContract },
      rules: {
        'ui-contract/no-raw-color': 'error',
      },
    },
  ];
}

export function appContract() {
  return [
    {
      files: ['src/**/*.{ts,tsx}'],
      plugins: { 'ui-contract': uiContract },
      rules: {
        'ui-contract/no-raw-color': 'error',
        'no-restricted-syntax': ['error', ...rawElementRules],
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@base-ui/react',
                message:
                  "Apps use the library, never Base UI directly. Fix: import the wrapped component from @repo/ui (e.g. `import { Dialog } from '@repo/ui'`); if it is missing, add it to packages/ui first.",
              },
            ],
            patterns: [
              {
                group: ['@base-ui/react/*'],
                message:
                  'Apps use the library, never Base UI directly. Fix: import the wrapped component from @repo/ui; if it is missing, add it to packages/ui first.',
              },
              {
                group: ['@repo/ui/*', '!@repo/ui/styles/*'],
                message:
                  "Import from the @repo/ui barrel, not a deep path, so the library can move files freely. Fix: `import { Button } from '@repo/ui'`.",
              },
            ],
          },
        ],
      },
    },
  ];
}
