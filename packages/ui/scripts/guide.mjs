#!/usr/bin/env node
/*
 * pnpm guide           writes the "Which component?" table in CLAUDE.md from the stories
 * pnpm guide --check   exits 1 when the table is out of date, or a component has no row (a unit test runs this)
 *
 * Each story's `usage({ choose: [...] })` owns its component's rows, so the
 * table can't fall behind the library: a component that no row names fails the
 * check, and so does a table edited by hand.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const PACKAGE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const GUIDE = path.resolve(PACKAGE, '../../CLAUDE.md');
const COMPONENTS = path.join(PACKAGE, 'src/components');
const TIERS = ['atoms', 'molecules', 'organisms'];
export const OPEN = '<!-- which-component -->';
export const CLOSE = '<!-- /which-component -->';

const propertyName = (property) =>
  property.name &&
  (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
    ? property.name.text
    : undefined;

function text(node, where) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  throw new Error(
    `${where}: \`choose\` takes plain strings only, so the table can be read without running the story.`,
  );
}

/* The `choose` rows in a story's `usage({...})` call, in the order written. */
export function chooseRows(source, where = 'story') {
  const file = ts.createSourceFile(where, source, ts.ScriptTarget.Latest, true);
  const rows = [];
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'usage' &&
      node.arguments[0] &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      const choose = node.arguments[0].properties.find(
        (property) => propertyName(property) === 'choose',
      );
      if (choose && ts.isPropertyAssignment(choose)) {
        if (!ts.isArrayLiteralExpression(choose.initializer)) {
          throw new Error(
            `${where}: \`choose\` must be a list written inline.`,
          );
        }
        for (const element of choose.initializer.elements) {
          if (!ts.isObjectLiteralExpression(element)) {
            throw new Error(`${where}: each \`choose\` row is { need, not }.`);
          }
          const row = {};
          for (const property of element.properties) {
            const name = propertyName(property);
            if (name && ts.isPropertyAssignment(property)) {
              row[name] = text(property.initializer, where);
            }
          }
          if (!row.need || !row.not) {
            throw new Error(
              `${where}: a \`choose\` row needs both need and not.`,
            );
          }
          rows.push(row);
        }
      }
    }
    node.forEachChild(visit);
  };
  visit(file);
  return rows;
}

/* Every component file, and every row its story declares, tier by tier. */
export function readLibrary(dir = COMPONENTS) {
  const components = [];
  const rows = [];
  for (const tier of TIERS) {
    const folder = path.join(dir, tier);
    if (!existsSync(folder)) continue;
    for (const file of readdirSync(folder).sort()) {
      if (!file.endsWith('.tsx')) continue;
      if (!file.endsWith('.stories.tsx')) {
        components.push(file.replace(/\.tsx$/, ''));
        continue;
      }
      const name = file.replace(/\.stories\.tsx$/, '');
      const where = `components/${tier}/${file}`;
      for (const row of chooseRows(
        readFileSync(path.join(folder, file), 'utf8'),
        where,
      )) {
        rows.push({ use: `\`${name}\``, ...row });
      }
    }
  }
  return { components, rows };
}

/* Components no row's "Use" cell names. */
export function uncovered({ components, rows }) {
  const used = rows.map((row) => row.use).join(' ');
  return components.filter((name) => !used.includes(`\`${name}\``));
}

const cell = (value) => value.replaceAll('|', '\\|');

export function table(rows) {
  return [
    '| The person needs to… | Use | Not |',
    '| --- | --- | --- |',
    ...rows.map(
      (row) => `| ${cell(row.need)} | ${cell(row.use)} | ${cell(row.not)} |`,
    ),
  ].join('\n');
}

export function place(guide, markdown) {
  const start = guide.indexOf(OPEN);
  const end = guide.indexOf(CLOSE);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `CLAUDE.md has no ${OPEN} … ${CLOSE} markers to write the table between.`,
    );
  }
  return `${guide.slice(0, start)}${OPEN}\n\n${markdown}\n\n${guide.slice(end)}`;
}

/* Formatted the way `pnpm format` would, so the two never fight over the file. */
export async function render(guide, library = readLibrary()) {
  const prettier = await import('prettier');
  const options = (await prettier.resolveConfig(GUIDE)) ?? {};
  return prettier.format(place(guide, table(library.rows)), {
    ...options,
    filepath: GUIDE,
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const library = readLibrary();
  const missing = uncovered(library);
  if (missing.length > 0) {
    console.error(
      `\nNo row in the "Which component?" table names: ${missing.join(', ')}.\n` +
        'Add `choose: [{ need, not }]` to usage({...}) in its story, or name it in the `use` of a related row. Then run: pnpm guide\n',
    );
    process.exit(1);
  }
  const current = readFileSync(GUIDE, 'utf8');
  const next = await render(current, library);
  if (process.argv.includes('--check')) {
    if (current !== next) {
      console.error(
        '\nThe "Which component?" table in CLAUDE.md is out of date with the stories. Run: pnpm guide\n',
      );
      process.exit(1);
    }
    console.log('The "Which component?" table is up to date.');
  } else {
    writeFileSync(GUIDE, next);
    console.log(`Wrote ${library.rows.length} rows to CLAUDE.md.`);
  }
}
