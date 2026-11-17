import { existsSync, readdirSync, readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/*
 * Keeps the library's bookkeeping honest, so neither a person nor an agent
 * can add a component and forget the rest: every component is shown by a
 * story in its folder and exported from the barrel, every hook is exported,
 * and a story's variant controls list exactly the variants the code has.
 */
const src = new URL('./', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, src), 'utf8');
const barrel = read('index.ts');

const tiers = ['atoms', 'molecules', 'organisms'].filter((tier) =>
  existsSync(new URL(`components/${tier}`, src)),
);

const components = tiers.flatMap((tier) =>
  readdirSync(new URL(`components/${tier}`, src))
    .filter((file) => file.endsWith('.tsx') && !file.includes('.stories.'))
    .map((file) => ({ tier, name: file.replace(/\.tsx$/, '') })),
);

function storiesIn(tier: string) {
  return readdirSync(new URL(`components/${tier}`, src))
    .filter((file) => file.endsWith('.stories.tsx'))
    .map((file) => ({ file, text: read(`components/${tier}/${file}`) }));
}

function parse(path: string, text = read(path)) {
  return ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
}

function walk(node: ts.Node, visit: (node: ts.Node) => void) {
  visit(node);
  node.forEachChild((child) => walk(child, visit));
}

const propertyName = (property: ts.ObjectLiteralElementLike) =>
  property.name &&
  (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
    ? property.name.text
    : undefined;

function objectProperty(object: ts.ObjectLiteralExpression, name: string) {
  const property = object.properties.find((p) => propertyName(p) === name);
  return property && ts.isPropertyAssignment(property)
    ? property.initializer
    : undefined;
}

/* `cva(base, { variants: { size: { sm, md } } })` → { size: ['sm', 'md'] } */
function cvaVariants(path: string): Record<string, string[]> {
  const variants: Record<string, string[]> = {};
  walk(parse(path), (node) => {
    if (
      !ts.isCallExpression(node) ||
      !ts.isIdentifier(node.expression) ||
      node.expression.text !== 'cva'
    ) {
      return;
    }
    const config = node.arguments[1];
    if (!config || !ts.isObjectLiteralExpression(config)) return;
    const map = objectProperty(config, 'variants');
    if (!map || !ts.isObjectLiteralExpression(map)) return;
    for (const variant of map.properties) {
      const name = propertyName(variant);
      if (!name || !ts.isPropertyAssignment(variant)) continue;
      if (!ts.isObjectLiteralExpression(variant.initializer)) continue;
      variants[name] = variant.initializer.properties
        .map(propertyName)
        .filter((key): key is string => key !== undefined);
    }
  });
  return variants;
}

/* The variants a component carries: its own cva plus any from #lib it imports. */
function variantsFor(tier: string, name: string): Record<string, string[]> {
  const path = `components/${tier}/${name}.tsx`;
  const libs = [...read(path).matchAll(/from '#lib\/(\w+)'/g)].map(
    ([, lib]) => `lib/${lib}.ts`,
  );
  return Object.assign(
    {},
    ...libs.map(cvaVariants),
    cvaVariants(path),
  ) as Record<string, string[]>;
}

/* The story's `meta.argTypes.<prop>.options` lists. */
function storyOptions(path: string): Record<string, string[]> {
  const options: Record<string, string[]> = {};
  walk(parse(path), (node) => {
    if (
      !ts.isVariableDeclaration(node) ||
      !ts.isIdentifier(node.name) ||
      node.name.text !== 'meta' ||
      !node.initializer
    ) {
      return;
    }
    let meta: ts.Expression = node.initializer;
    while (ts.isSatisfiesExpression(meta) || ts.isAsExpression(meta)) {
      meta = meta.expression;
    }
    if (!ts.isObjectLiteralExpression(meta)) return;
    const argTypes = objectProperty(meta, 'argTypes');
    if (!argTypes || !ts.isObjectLiteralExpression(argTypes)) return;
    for (const argType of argTypes.properties) {
      const name = propertyName(argType);
      if (!name || !ts.isPropertyAssignment(argType)) continue;
      if (!ts.isObjectLiteralExpression(argType.initializer)) continue;
      const list = objectProperty(argType.initializer, 'options');
      if (!list || !ts.isArrayLiteralExpression(list)) continue;
      options[name] = list.elements
        .filter(ts.isStringLiteral)
        .map((element) => element.text);
    }
  });
  return options;
}

/* True when the story's `meta.parameters` spreads `usage({...})`. */
function hasUsage(path: string) {
  let found = false;
  walk(parse(path), (node) => {
    if (
      !ts.isVariableDeclaration(node) ||
      !ts.isIdentifier(node.name) ||
      node.name.text !== 'meta' ||
      !node.initializer
    ) {
      return;
    }
    let meta: ts.Expression = node.initializer;
    while (ts.isSatisfiesExpression(meta) || ts.isAsExpression(meta)) {
      meta = meta.expression;
    }
    if (!ts.isObjectLiteralExpression(meta)) return;
    const parameters = objectProperty(meta, 'parameters');
    if (!parameters || !ts.isObjectLiteralExpression(parameters)) return;
    found = parameters.properties.some(
      (property) =>
        ts.isSpreadAssignment(property) &&
        ts.isCallExpression(property.expression) &&
        ts.isIdentifier(property.expression.expression) &&
        property.expression.expression.text === 'usage',
    );
  });
  return found;
}

/* A compound file exports several parts; variants then sit on one part, not on meta.component. */
const isSingleComponent = (tier: string, name: string) =>
  [...read(`components/${tier}/${name}.tsx`).matchAll(/^export function /gm)]
    .length === 1;

describe('drift', () => {
  it('finds components to check', () => {
    expect(components.length).toBeGreaterThan(0);
  });

  it.each(components)(
    '$tier/$name is shown by a story in its folder',
    ({ tier, name }) => {
      const importsIt = new RegExp(
        `from '(?:\\./|#components/${tier}/)${name}'`,
      );
      const stories = storiesIn(tier).filter(({ text }) =>
        importsIt.test(text),
      );
      expect(
        stories.map(({ file }) => file),
        `No story in components/${tier}/ imports ${name}. Add ${name}.stories.tsx.`,
      ).not.toEqual([]);
    },
  );

  it.each(components)(
    '$tier/$name is exported from src/index.ts',
    ({ tier, name }) => {
      expect(barrel).toContain(`'./components/${tier}/${name}'`);
    },
  );

  it.each(
    readdirSync(new URL('hooks', src))
      .filter((file) => file.endsWith('.ts') && !file.includes('.test.'))
      .map((file) => file.replace(/\.ts$/, '')),
  )('hook %s is exported from src/index.ts', (hook) => {
    expect(barrel).toContain(`'./hooks/${hook}'`);
  });

  it.each(
    tiers.flatMap((tier) =>
      storiesIn(tier).map(({ file }) => `components/${tier}/${file}`),
    ),
  )('%s gives usage guidance', (path) => {
    expect(
      hasUsage(path),
      `${path}: add ...usage({ purpose, useWhen, alternatives, do, dont }) to meta.parameters (from #storybook/usage)`,
    ).toBe(true);
  });

  it.each(
    tiers.flatMap((tier) =>
      storiesIn(tier).map(({ file, text }) => ({ tier, file, text })),
    ),
  )('components/$tier/$file sets its sidebar title', ({ tier, file, text }) => {
    const title = `Components/${tier.charAt(0).toUpperCase()}${tier.slice(1)}/${file.replace(/\.stories\.tsx$/, '')}`;
    expect(
      text,
      `Set title: '${title}' in meta, or Storybook files it under a lowercase folder of its own.`,
    ).toContain(`title: '${title}'`);
  });

  it.each(components)(
    '$tier/$name story controls match its variants',
    ({ tier, name }) => {
      const storyPath = `components/${tier}/${name}.stories.tsx`;
      if (!existsSync(new URL(storyPath, src))) return;
      const variants = variantsFor(tier, name);
      const options = storyOptions(storyPath);

      for (const [prop, values] of Object.entries(options)) {
        if (!(prop in variants)) continue;
        expect(values, `${storyPath}: argTypes.${prop}.options`).toEqual(
          variants[prop],
        );
      }
      if (isSingleComponent(tier, name)) {
        expect(
          Object.keys(variants).filter((prop) => !(prop in options)),
          `${storyPath}: add an argTypes control for each variant`,
        ).toEqual([]);
      }
    },
  );
});
