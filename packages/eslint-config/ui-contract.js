/*
 * Rules that turn CLAUDE.md's library contract from prose into checks. Each
 * message follows one shape so a person or an agent can act on it without
 * opening CLAUDE.md: what is wrong, why the rule exists, the exact fix, and
 * the workaround that does not count.
 */

const TEXT_ATTRIBUTES = new Set([
  'alt',
  'aria-description',
  'aria-label',
  'aria-placeholder',
  'aria-roledescription',
  'aria-valuetext',
  'label',
  'placeholder',
  'title',
]);

const hasLetters = (value) => /\p{L}/u.test(value);

function stringValue(node) {
  if (!node) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value;
  }
  if (node.type === 'TemplateLiteral') {
    return node.quasis.map((quasi) => quasi.value.cooked ?? '').join('');
  }
  if (node.type === 'JSXExpressionContainer') {
    return stringValue(node.expression);
  }
  return null;
}

/* Every string a value can resolve to, through `a ? 'x' : 'y'` and `a || 'x'`. */
function stringValues(node) {
  if (!node) return [];
  if (node.type === 'JSXExpressionContainer') {
    return stringValues(node.expression);
  }
  if (node.type === 'ConditionalExpression') {
    return [...stringValues(node.consequent), ...stringValues(node.alternate)];
  }
  if (node.type === 'LogicalExpression') {
    return [...stringValues(node.left), ...stringValues(node.right)];
  }
  const value = stringValue(node);
  return value === null ? [] : [value];
}

const noHardcodedStrings = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Library components take every user-facing string from props, including screen-reader text',
    },
    schema: [],
    messages: {
      text: 'Hard-coded user-facing text "{{text}}". Why: the consuming app owns copy and translation; a library string cannot be translated or reworded. Fix: add a required string prop (or render `children`) and let the story pass the example copy. Not a fix: moving the text into a const or a default value in this file.',
      attribute:
        'Hard-coded `{{name}}` text "{{text}}". Why: screen-reader and tooltip text is user-facing copy too, and the app must be able to translate it. Fix: take it from a required prop, or let the consumer pass `{{name}}` through `...props`. Not a fix: a fallback like `{{name}} ?? "…"`.',
      defaultValue:
        'English default "{{text}}" for prop `{{name}}`. Why: a default hides a missing translation, so the app ships English without noticing. Fix: make the prop required and drop the default; stories supply example copy. Not a fix: an empty-string default.',
    },
  },
  create(context) {
    function checkDefaults(params) {
      for (const param of params) {
        if (param.type !== 'ObjectPattern') continue;
        for (const property of param.properties) {
          if (property.type !== 'Property') continue;
          const { value } = property;
          if (value.type !== 'AssignmentPattern') continue;
          const text = stringValue(value.right);
          if (text && hasLetters(text) && /\s|^\p{Lu}/u.test(text)) {
            context.report({
              node: value.right,
              messageId: 'defaultValue',
              data: { text, name: property.key.name ?? '?' },
            });
          }
        }
      }
    }

    return {
      JSXText(node) {
        const text = node.value.trim();
        if (text && hasLetters(text)) {
          context.report({ node, messageId: 'text', data: { text } });
        }
      },
      JSXExpressionContainer(node) {
        if (
          node.parent.type !== 'JSXElement' &&
          node.parent.type !== 'JSXFragment'
        ) {
          return;
        }
        const text = stringValues(node).find((value) =>
          hasLetters(value.trim()),
        );
        if (text) {
          context.report({ node, messageId: 'text', data: { text } });
        }
      },
      JSXAttribute(node) {
        const name =
          node.name.type === 'JSXIdentifier' ? node.name.name : undefined;
        if (!name || !TEXT_ATTRIBUTES.has(name)) return;
        const text = stringValues(node.value).find(hasLetters);
        if (text) {
          context.report({
            node,
            messageId: 'attribute',
            data: { name, text },
          });
        }
      },
      FunctionDeclaration(node) {
        checkDefaults(node.params);
      },
      FunctionExpression(node) {
        checkDefaults(node.params);
      },
      ArrowFunctionExpression(node) {
        checkDefaults(node.params);
      },
    };
  },
};

function* jsxOpeningElements(node, keys) {
  if (!node || typeof node.type !== 'string') return;
  if (node.type === 'JSXOpeningElement') yield node;
  for (const key of keys[node.type] ?? []) {
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) yield* jsxOpeningElements(item, keys);
    } else {
      yield* jsxOpeningElements(child, keys);
    }
  }
}

const classnamePassthrough = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "A wrapper must merge the consumer's className with its own, never drop or overwrite it",
    },
    schema: [],
    messages: {
      dropped:
        "`{{name}}` is destructured but never used, so the consumer's className is silently dropped. Why: consumers position and size library components through className. Fix: pass it last into cn(): `className={cn('…own classes…', {{name}})}`. Not a fix: renaming it with a leading underscore.",
      clobbered:
        "This element sets `className` and also spreads `{{rest}}`, which still carries the consumer's className, so one silently overwrites the other. Why: the merge must be explicit or a consumer override vanishes (or wipes the component's styling). Fix: destructure it, `({ className, ...{{rest}} })`, and write `className={cn('…own classes…', className)}`. Not a fix: moving the spread before or after `className`.",
    },
  },
  create(context) {
    const { sourceCode } = context;

    function elementsSettingClassNameAndSpreading(node, name) {
      return [...jsxOpeningElements(node.body, sourceCode.visitorKeys)].filter(
        (element) =>
          element.attributes.some(
            (attribute) =>
              attribute.type === 'JSXAttribute' &&
              attribute.name.name === 'className',
          ) &&
          element.attributes.some(
            (attribute) =>
              attribute.type === 'JSXSpreadAttribute' &&
              attribute.argument.type === 'Identifier' &&
              attribute.argument.name === name,
          ),
      );
    }

    function check(node) {
      const param = node.params[0];
      if (!param) return;

      /* `(props) => <div className="…" {...props} />`: fine only if it reads props.className. */
      if (param.type === 'Identifier') {
        const variable = sourceCode
          .getDeclaredVariables(node)
          .find((candidate) => candidate.name === param.name);
        const readsClassName = variable?.references.some(
          (reference) =>
            reference.identifier.parent.type === 'MemberExpression' &&
            reference.identifier.parent.object === reference.identifier &&
            reference.identifier.parent.property.name === 'className',
        );
        if (readsClassName) return;
        for (const element of elementsSettingClassNameAndSpreading(
          node,
          param.name,
        )) {
          context.report({
            node: element,
            messageId: 'clobbered',
            data: { rest: param.name },
          });
        }
        return;
      }
      if (param.type !== 'ObjectPattern') return;

      const classNameProperty = param.properties.find(
        (property) =>
          property.type === 'Property' &&
          property.key.type === 'Identifier' &&
          property.key.name === 'className',
      );
      if (classNameProperty) {
        const local =
          classNameProperty.value.type === 'AssignmentPattern'
            ? classNameProperty.value.left
            : classNameProperty.value;
        if (local.type !== 'Identifier') return;
        const variable = sourceCode
          .getDeclaredVariables(node)
          .find((candidate) => candidate.name === local.name);
        if (variable && variable.references.length === 0) {
          context.report({
            node: classNameProperty,
            messageId: 'dropped',
            data: { name: local.name },
          });
        }
        return;
      }

      const rest = param.properties.find(
        (property) => property.type === 'RestElement',
      );
      if (!rest || rest.argument.type !== 'Identifier') return;
      const restName = rest.argument.name;

      for (const element of elementsSettingClassNameAndSpreading(
        node,
        restName,
      )) {
        context.report({
          node: element,
          messageId: 'clobbered',
          data: { rest: restName },
        });
      }
    }

    return {
      FunctionDeclaration: check,
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    };
  },
};

const RAW_COLOR =
  /(?<![\w&/-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/;
/* `href="#add"` is a fragment, not the colour #add. */
const ID_ATTRIBUTES = new Set(['href', 'to', 'id', 'htmlFor', 'xlinkHref']);

function inIdAttribute(node) {
  let current = node.parent;
  if (current?.type === 'JSXExpressionContainer') current = current.parent;
  return (
    current?.type === 'JSXAttribute' &&
    current.name.type === 'JSXIdentifier' &&
    ID_ATTRIBUTES.has(current.name.name)
  );
}

const MODE_LEAK =
  /light-dark\(|prefers-color-scheme|(?:^|[\s[(:'"&_])\.dark(?![a-zA-Z0-9-])/;

const noRawColor = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Colors and mode switches live only in src/theme/; components reference tokens',
    },
    schema: [],
    messages: {
      color:
        'Raw color "{{text}}" outside src/theme/. Why: a literal color ignores light/dark mode and every future theme. Fix: use a palette token class (bg-primary, text-muted-foreground, …); if no token fits, add one to src/theme/palette.css with a .dark override. Not a fix: a CSS variable defined in this file.',
      mode: 'Mode switch "{{text}}" outside src/theme/. Why: components are mode-blind (docs/adr/0006); light and dark diverge only in palette.css. Fix: use semantic token classes and adjust the token pair in src/theme/palette.css. Not a fix: `light-dark()`, `[.dark_&]:` or a `prefers-color-scheme` query in the component.',
    },
  },
  create(context) {
    function check(node, text) {
      const parent = node.parent;
      if (
        parent &&
        (parent.type === 'ImportDeclaration' ||
          parent.type === 'ExportNamedDeclaration' ||
          parent.type === 'ExportAllDeclaration' ||
          parent.type === 'ImportExpression')
      ) {
        return;
      }
      if (inIdAttribute(node)) return;
      const color = RAW_COLOR.exec(text);
      if (color) {
        context.report({
          node,
          messageId: 'color',
          data: { text: color[0] },
        });
        return;
      }
      const mode = MODE_LEAK.exec(text);
      if (mode) {
        context.report({
          node,
          messageId: 'mode',
          data: { text: mode[0].trim() },
        });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.cooked ?? node.value.raw);
      },
    };
  },
};

export default {
  meta: { name: 'ui-contract' },
  rules: {
    'classname-passthrough': classnamePassthrough,
    'no-hardcoded-strings': noHardcodedStrings,
    'no-raw-color': noRawColor,
  },
};
