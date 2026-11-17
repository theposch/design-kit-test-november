/*
 * Every rule here is shown failing on a bad snippet as well as passing on a
 * good one: a check that has never been seen to fail may be silently blind
 * (a gitignore-style `#components/*` pattern, for one, is a comment and
 * matches nothing).
 */

import { ESLint, RuleTester } from 'eslint';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import tsEslint from 'typescript-eslint';

import commentHygiene from './comment-hygiene.js';
import { appContract, libraryContract } from './library-contract.js';
import tailwindContract from './tailwind-contract.js';
import uiContract from './ui-contract.js';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run(
  'no-hardcoded-strings',
  uiContract.rules['no-hardcoded-strings'],
  {
    valid: [
      'function A({ label }) { return <button aria-label={label}>{label}</button>; }',
      "function A({ size = 'md' }) { return <span data-size={size} />; }",
      'function A() { return <span> {"·"} </span>; }',
      'function A({ label, open }) { return <b aria-label={open ? label : undefined}>{children}</b>; }',
    ],
    invalid: [
      {
        code: 'function A() { return <p>Close panel</p>; }',
        errors: [{ messageId: 'text' }],
      },
      {
        code: 'function A() { return <button aria-label="Close" />; }',
        errors: [{ messageId: 'attribute' }],
      },
      {
        code: 'function A() { return <input placeholder={`Search`} />; }',
        errors: [{ messageId: 'attribute' }],
      },
      {
        code: "function A({ label = 'Open menu' }) { return <b>{label}</b>; }",
        errors: [{ messageId: 'defaultValue' }],
      },
      {
        code: "function A() { return <p>{'Close dialog'}</p>; }",
        errors: [{ messageId: 'text' }],
      },
      {
        code: "function A({ label }) { return <p>{label ?? 'Untitled'}</p>; }",
        errors: [{ messageId: 'text' }],
      },
      {
        code: "function A({ open }) { return <button aria-label={open ? 'Open' : 'Close'} />; }",
        errors: [{ messageId: 'attribute' }],
      },
    ],
  },
);

ruleTester.run(
  'classname-passthrough',
  uiContract.rules['classname-passthrough'],
  {
    valid: [
      "function A({ className, ...props }) { return <div className={cn('flex', className)} {...props} />; }",
      'function A(props) { return <div {...props} />; }',
      'function A({ ...props }) { return <div {...props} />; }',
      "const A = (props) => <div {...props} className={cn('flex', props.className)} />;",
    ],
    invalid: [
      {
        code: 'function A({ className, ...props }) { return <div className="flex" {...props} />; }',
        errors: [{ messageId: 'dropped' }],
      },
      {
        code: 'function A({ children, ...rest }) { return <div className="flex" {...rest}>{children}</div>; }',
        errors: [{ messageId: 'clobbered' }],
      },
      {
        code: 'const B = function B(props) { return <div className="flex" {...props} />; };',
        errors: [{ messageId: 'clobbered' }],
      },
      {
        code: 'const B = function B({ className, ...props }) { return <div {...props} />; };',
        errors: [{ messageId: 'dropped' }],
      },
    ],
  },
);

ruleTester.run(
  'no-mechanical-comments',
  commentHygiene.rules['no-mechanical-comments'],
  {
    valid: ['/* Every component is exported from the barrel. */ const a = 1;'],
    invalid: [
      {
        code: '/* Ported from the old repo. */ const a = 1;',
        errors: [{ messageId: 'mechanical' }],
      },
    ],
  },
);

ruleTester.run('no-raw-color', uiContract.rules['no-raw-color'], {
  valid: [
    "import { cn } from '#lib/utils';",
    "const a = 'bg-primary text-muted-foreground';",
    "const a = 'dark-ish data-dark:block';",
    'const a = <a href="#add" />;',
  ],
  invalid: [
    { code: "const a = '#ff0000';", errors: [{ messageId: 'color' }] },
    {
      code: "const a = 'oklch(0.5 0.2 262)';",
      errors: [{ messageId: 'color' }],
    },
    {
      code: "const a = 'light-dark(white, black)';",
      errors: [{ messageId: 'mode' }],
    },
    {
      code: "const a = '[.dark_&]:bg-primary';",
      errors: [{ messageId: 'mode' }],
    },
    {
      code: "const a = '@media (prefers-color-scheme: dark)';",
      errors: [{ messageId: 'mode' }],
    },
  ],
});

async function restrictedImports(config, filePath, code) {
  const eslint = new ESLint({
    cwd: import.meta.dirname,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.{ts,tsx}'],
        languageOptions: { parser: tsEslint.parser },
      },
      ...config,
    ],
  });
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages
    .filter((message) => message.ruleId === 'no-restricted-imports')
    .map((message) => message.message);
}

describe('library import boundaries', () => {
  const atom = 'src/components/atoms/Probe.tsx';

  it('stops an atom composing another library component', async () => {
    const messages = await restrictedImports(
      libraryContract(),
      atom,
      "import { Button } from '#components/atoms/Button';\nimport { Icon } from './Icon';",
    );
    assert.equal(messages.length, 2);
    assert.match(messages[0], /Atoms must not compose/);
  });

  it('lets an atom story compose freely', async () => {
    const messages = await restrictedImports(
      libraryContract(),
      'src/components/atoms/Probe.stories.tsx',
      "import { Button } from './Button';",
    );
    assert.deepEqual(messages, []);
  });

  it('stops a molecule importing an organism', async () => {
    const messages = await restrictedImports(
      libraryContract(),
      'src/components/molecules/Probe.tsx',
      "import { Shell } from '#components/organisms/Shell';",
    );
    assert.equal(messages.length, 1);
  });

  it('rejects climbing relative imports and the Base UI barrel', async () => {
    const messages = await restrictedImports(
      libraryContract(),
      'src/lib/probe.ts',
      "import { cn } from '../lib/utils';\nimport { Dialog } from '@base-ui/react';",
    );
    assert.equal(messages.length, 2);
  });

  it('keeps apps off Base UI and deep library paths', async () => {
    const messages = await restrictedImports(
      appContract(),
      'src/App.tsx',
      "import { Dialog } from '@base-ui/react/dialog';\nimport { Button } from '@repo/ui/src/index';\nimport { Card } from '@repo/ui';",
    );
    assert.equal(messages.length, 2);
  });

  it('bans raw colours in apps too', async () => {
    const eslint = new ESLint({
      cwd: import.meta.dirname,
      overrideConfigFile: true,
      overrideConfig: [
        {
          files: ['**/*.{ts,tsx}'],
          languageOptions: { parser: tsEslint.parser },
        },
        ...appContract(),
      ],
    });
    const [result] = await eslint.lintText(
      "export const brand = '#ff0000';\n",
      {
        filePath: 'src/theme.ts',
      },
    );
    assert.deepEqual(
      result.messages.map((message) => message.ruleId),
      ['ui-contract/no-raw-color'],
    );
  });
});

describe('tailwind contract', () => {
  const eslint = new ESLint({
    cwd: new URL('../ui/', import.meta.url).pathname,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
          parser: tsEslint.parser,
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
      },
      ...tailwindContract('src/globals.css', {
        layoutFiles: ['src/templates/**/*.tsx'],
      }),
    ],
  });

  async function flagged(
    className,
    filePath = 'src/components/atoms/Probe.tsx',
  ) {
    const [result] = await eslint.lintText(
      `export const A = () => <span className="${className}" />;\n`,
      { filePath },
    );
    return result.messages.filter(
      (message) =>
        message.ruleId === 'better-tailwindcss/no-restricted-classes',
    ).length;
  }

  for (const bad of [
    'duration-200',
    'animate-spin',
    'group-focus:ring-2',
    'focus-visible:ring',
    'focus-visible:outline-2',
    'focus-visible:outline-ring',
    'has-focus-visible:ring-3',
    'leading-tight',
    'tablet:leading-6',
    'tracking-wide',
    'tracking-[0.02em]',
    'text-label-sm',
  ]) {
    it(`flags ${bad}`, async () => {
      assert.equal(await flagged(bad), 1);
    });
  }

  const TEMPLATE = 'src/templates/Probe.tsx';
  for (const bad of ['p-3', 'gap-5', 'tablet:px-1.5', '-mt-7', 'p-[12px]']) {
    it(`flags off-grid ${bad} in a template`, async () => {
      assert.equal(await flagged(bad, TEMPLATE), 1);
    });
  }
  for (const good of ['p-4', 'gap-1', 'desktop:px-8', 'space-y-6', 'p-0']) {
    it(`allows on-grid ${good} in a template`, async () => {
      assert.equal(await flagged(good, TEMPLATE), 0);
    });
  }
  it('leaves half-steps alone inside components', async () => {
    assert.equal(await flagged('px-2.5 py-1.5'), 0);
  });
  it('still applies the token rules in templates', async () => {
    assert.equal(await flagged('duration-200', TEMPLATE), 1);
  });

  for (const good of [
    'duration-(--motion-duration-fast)',
    'motion-safe:animate-pulse',
    'focus:outline-none',
    'focus-visible:outline-none',
    'focus-visible:ring-destructive',
  ]) {
    it(`allows ${good}`, async () => {
      assert.equal(await flagged(good), 0);
    });
  }

  it('scans the shared class constants in src/lib', async () => {
    const [result] = await eslint.lintText(
      "export const probeClasses = { root: 'focus-visible:ring-3' };\n",
      { filePath: 'src/lib/probeClasses.ts' },
    );
    assert.equal(result.messages.length, 1);
  });
});

describe('raw elements', () => {
  async function syntaxMessages(config, filePath, code) {
    const eslint = new ESLint({
      cwd: import.meta.dirname,
      overrideConfigFile: true,
      overrideConfig: [
        {
          files: ['**/*.{ts,tsx}'],
          languageOptions: {
            parser: tsEslint.parser,
            parserOptions: { ecmaFeatures: { jsx: true } },
          },
        },
        ...config,
      ],
    });
    const [result] = await eslint.lintText(code, { filePath });
    return result.messages.filter(
      (message) => message.ruleId === 'no-restricted-syntax',
    );
  }

  const code =
    'export const A = () => <div><button /><input /><hr /><a href="/x">x</a></div>;';

  it('points an app at the library component', async () => {
    const messages = await syntaxMessages(appContract(), 'src/App.tsx', code);
    assert.equal(messages.length, 3);
    assert.match(messages[0].message, /Fix: use Button/);
  });

  it('applies to molecules but not atoms', async () => {
    const molecule = await syntaxMessages(
      libraryContract(),
      'src/components/molecules/Probe.tsx',
      code,
    );
    const atom = await syntaxMessages(
      libraryContract(),
      'src/components/atoms/Probe.tsx',
      code,
    );
    assert.equal(molecule.length, 3);
    assert.equal(atom.length, 0);
  });
});
