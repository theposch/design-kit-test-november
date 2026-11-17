---
name: configuring-tailwind
description:
  Contains rules for building Tailwind-based CSS themes with strict structural patterns. MUST LOAD BEFORE writing or modifying any
  tailwind-related CSS code.
---

# Tailwind CSS

## Overview

This skill describes best practices for configuring Tailwind CSS. Use this skill when:

- Creating custom design systems with consistent spacing, colors, and typography
- Implementing dark mode and other custom themes
- Building reusable utility classes for typography and other common styles
- Converting existing Figma tokens and styles into Tailwind-compatible CSS variables and utilities.

## Folder structure

```
packages/ui/src/
├─ theme/            # one file per category
│   ├─ breakpoints.css
│   ├─ effects.css   # multi-property effects (glass, glow), one @utility each
│   ├─ font.css
│   ├─ motion.css
│   ├─ palette.css
│   ├─ radii.css
│   ├─ scrollbar.css
│   ├─ spacing.css
│   └─ typography.css
└─ globals.css       # imports, custom variants, base resets only
```

Read the real files before changing one; the examples below are cut down from them.

## The token pattern

Every category follows the same three parts:

1. Raw values as plain CSS variables on `:root`, inside `@layer base`.
2. A `@theme inline` block that registers the public names Tailwind turns into classes, each pointing at a raw
   variable. `inline` makes the class use the variable itself, so a mode or breakpoint override reaches it.
3. Overrides that change the raw variables only: a `.dark` class block for dark mode (left outside `@layer base` so it
   wins), a `@media` block for phones, `prefers-reduced-motion` for motion.

Components never branch on mode: `dark:` is lint-banned in components. Light and dark differ in one place, the `.dark`
block.

`palette.css`, cut down:

```css
@theme {
  --color-*: initial;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* … etc */
}

@layer base {
  :root {
    --background: oklch(0.985 0 0);
    --foreground: oklch(0.145 0 0);
    --primary: oklch(0.5 0.2 262);
    --primary-foreground: oklch(0.985 0 0);
  }
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.72 0.14 262);
  --primary-foreground: oklch(0.145 0 0);
}
```

Type styles combine several properties, so `typography.css` adds one `@utility` per style, reading the raw variables
directly (`@apply` can't take a variable, see `docs/adr/0004`). Font files and families live in `font.css`.

```css
@theme inline {
  --text-heading-1: var(--heading-1-size);
}

@layer base {
  :root {
    --heading-1-size: 3rem;
    --heading-1-tracking: -0.02em;
    --heading-weight: 700;
  }

  @media (width < 48rem) {
    :root {
      --heading-1-size: 2.25rem;
    }
  }
}

@utility type-heading-1 {
  font-family: var(--heading-font);
  font-size: var(--heading-1-size);
  font-weight: var(--heading-weight);
  letter-spacing: var(--heading-1-tracking);
}
```

## Rules

1. Always reset default color palette with `--color-*: initial`.
2. Only expose known semantic values (eg, `surface`, `muted-foreground`) as tailwind tokens. Values named for colors should only be
   added as root-level CSS variables.
3. Except for the type styles above, avoid adding more `@utility` and `@apply` directives. The one
   other home for `@utility` is `effects.css`: effects that need several properties together (glass, a glow, a masked
   rim, layered gradients), one utility each, with a one-line comment naming the design effect it rebuilds. Their
   values still come from tokens where a token exists.
4. Avoid adding anything other than `@imports`, `@source`'s, and global reset styles to the main/global/index CSS file. All theme-specific
   values should be added to category-specific CSS files (eg, `spacing.css`, `typography.css`, etc).
5. Avoid repetitive comments in CSS files, especially if they can be inferred from file or block names. At most, single-line comments
   for grouping related tokens together are acceptable.
6. After any token change, run `pnpm tokens`. It writes `packages/ui/design.tokens.json`, the same tokens in the shared
   DTCG format for Figma and other tools, and a unit test fails until it matches. A new theme file that declares tokens
   needs an entry in `FILES` in `packages/ui/scripts/tokens.mjs` (which collection, which modes), or the script stops
   and says so.
