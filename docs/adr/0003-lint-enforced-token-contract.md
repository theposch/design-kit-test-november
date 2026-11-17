# The token contract is enforced by lint, not review

The "semantic tokens only" styling rule is enforced in ESLint (the `tailwindContract` factory in `@repo/eslint-config`, via `eslint-plugin-better-tailwindcss`) rather than by reviewer attention — in the engagement this template was extracted from, hard-coded hexes shipped to review and were caught only because a human happened to look.

- `no-restricted-classes` rejects the known off-contract shapes: color literals in arbitrary values, hard-coded radii and font sizes, non-token font families, `dark:` variants (see ADR 0006), and the default Tailwind text scale (see ADR 0004).
- `no-unknown-classes` validates every class against the theme actually compiled from the package's entry CSS, so wiped default-palette classes (`bg-zinc-900`) and typos (`bg-primry`) — which Tailwind silently ignores — become errors.
- Escape hatch: `eslint-disable-next-line` with a `-- reason` description, which `@eslint-community/eslint-comments/require-description` makes mandatory. A file-wide `eslint-disable` is refused (`no-unlimited-disable`, `disable-enable-pair`), so an exception never covers code written after it.

The same stance covers conventions that are not about tokens: file naming (`.tsx` PascalCase, `.ts` camelCase) is a `check-file` rule in the shared `filenames` config, not a line in a style guide.

**Consequence:** an off-contract value fails `pnpm lint` (and CI). If a design needs a value no token provides, add a token to the right partial under `src/theme/` instead of writing the value at the call site.
