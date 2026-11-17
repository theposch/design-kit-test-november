import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Manifests } from 'storybook/internal/types';
import ts from 'typescript';

import { type Usage, usageText } from './usage';

type Guidance = { description: string; summary: string };
type Literal = string | Literal[] | { [key: string]: Literal };

function literal(node: ts.Node, where: string): Literal {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => literal(element, where));
  }
  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(
      node.properties.map((property) => {
        if (
          !ts.isPropertyAssignment(property) ||
          !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
        ) {
          throw new Error(
            `${where}: write each guidance field as \`name: value\`.`,
          );
        }
        return [property.name.text, literal(property.initializer, where)];
      }),
    );
  }
  throw new Error(
    `${where}: guidance must be plain text written inline, so Storybook can read it without running the story. Found \`${node.getText()}\`.`,
  );
}

/*
 * The Docs-page description a story file gives its component, read from the
 * source: the `usage({...})` guidance for a component, the `about('…')` note
 * for a template. Throws when either is there but not written as plain text.
 */
export function storyGuidance(
  source: string,
  where = 'story',
): Guidance | undefined {
  const file = ts.createSourceFile(where, source, ts.ScriptTarget.Latest, true);
  let found: Guidance | undefined;
  const visit = (node: ts.Node) => {
    if (
      !found &&
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.arguments[0]
    ) {
      if (node.expression.text === 'usage') {
        const guide = literal(node.arguments[0], where) as Usage;
        found = { description: usageText(guide), summary: guide.purpose };
      } else if (node.expression.text === 'about') {
        const purpose = literal(node.arguments[0], where) as string;
        found = { description: purpose, summary: purpose };
      }
    }
    node.forEachChild(visit);
  };
  visit(file);
  return found;
}

/*
 * Storybook's component manifest, which addon-mcp serves to coding agents,
 * only takes a description from JSDoc comments. This fills it from the same
 * guidance the Docs page shows. A story whose guidance can't be read keeps
 * Storybook's own entry, so the manifest still builds; the unit test is what
 * fails on it.
 */
export function withStoryGuidance(
  manifests: Manifests | undefined,
  root: string,
): Manifests | undefined {
  const components = manifests?.components?.components;
  if (!manifests?.components || !components) return manifests;
  const next = Object.fromEntries(
    Object.entries(components).map(([id, entry]) => {
      let guidance: Guidance | undefined;
      try {
        guidance = storyGuidance(
          readFileSync(path.resolve(root, entry.path), 'utf8'),
          entry.path,
        );
      } catch {
        return [id, entry];
      }
      if (!guidance) return [id, entry];
      return [
        id,
        {
          ...entry,
          description: [entry.description, guidance.description]
            .filter(Boolean)
            .join('\n\n'),
          summary: entry.summary ?? guidance.summary,
        },
      ];
    }),
  );
  return {
    ...manifests,
    components: { ...manifests.components, components: next },
  };
}
