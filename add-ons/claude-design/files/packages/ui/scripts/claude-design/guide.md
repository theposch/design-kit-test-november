# zero-design-kit

MetaLab's starter component library, where designers author the product directly in code. The code is the source of truth: these components are the real ones from `packages/ui`, bundled for the browser, not lookalikes. It is read-only here: to change a component, a colour or this guide, change the code and run `pnpm design:build` again, then have Claude republish it.

## Content fundamentals

- **Plain and short.** Labels say what happens: "Sign in", "Save profile", "Change password". Buttons start with a verb.
- **Sentence case** everywhere: headings, buttons, tabs, menu items.
- **Every string comes from the product.** Components ship no copy of their own: labels, placeholders and screen-reader text are passed in. On a canvas, write real copy, not lorem ipsum.
- **Errors sit next to their cause** ("Incorrect password. Try again." under the password field), never in a toast.

## Visual foundations

### Colour

Neutral first, one blue for action. Every colour is a role, not a hue: `background` for the page, `surface` for raised cards, `foreground` and `muted-foreground` for text, `primary` for the one main action per area, `border` for hairlines, `input` for control outlines. Status colours come as quiet pairs (`success-subtle` with `success-subtle-foreground`, and so on) for badges and banners. Light and dark are the same tokens with different values: never pick a colour per mode.

### Type

One family, Geist, for everything. Headings are bold (700) with slight negative tracking on the two largest sizes; body text is regular (400), with `body-strong` (600) for figures and names inside a sentence. Use the named styles only (`heading-1` … `heading-4`, `body-lg` … `body-xs`), never a one-off size. The two largest headings step down on phones.

### Space and layout

- **8px grid for page layout**: padding, margins and gaps use `space-2`, `space-4`, `space-6`, `space-8`, `space-10`, `space-12`, `space-16`. 4px half-steps belong inside components only.
- **Three screen sizes**: phone (default), tablet from 768px, desktop from 1024px. Check every page at all three.
- **Group with space, not boxes.** A border marks a real container (a card, a control); don't wrap every group in a bordered box ("card soup").

### Corners, borders, shadows

Corners from the radius scale: `radius-lg` (10px) for buttons, inputs and images, `radius-xl` (14px) for cards, `radius-full` for avatars and switches. Borders are 1px `border`; control outlines are `input`. Shadows only on things that float (menus, popovers, dialogs).

### Motion

Short and quiet: colour and opacity transitions on hover and open, nothing that bounces. Everything honours reduced motion.

## Iconography

Lucide icons, always through `Icon` (`<Icon icon={Starter.Icons.Search} label="Search" />`), sized to the text beside them. Give `label` only when the icon stands alone. No emoji, no icon fonts. The whole Lucide set is in `Starter.Icons`, by name.

## Choosing a component

| The person needs to…                   | Use                                  | Not                              |
| -------------------------------------- | ------------------------------------ | -------------------------------- |
| run an action here                     | `Button`                             | a link styled as a button        |
| go to another page, styled as a button | `LinkButton`                         | `Button` with navigation         |
| confirm something irreversible         | `AlertDialog`                        | `Dialog`                         |
| do a short task over the page          | `Dialog`                             | a new page for two fields        |
| pick one value from a list             | `Select` (many) / `RadioGroup` (≤ 6) | `Menu`                           |
| flip a setting that applies now        | `Switch`                             | `Checkbox`                       |
| switch between peer views              | `Tabs`                               | `Accordion`                      |
| label, describe or flag a form control | `Field`                              | a placeholder as the label       |
| lay things out in a row or column      | `Stack`                              | hand-written flex                |
| lay out a grid that reflows            | `Grid`                               | breakpoint-by-breakpoint columns |
| group content on a raised surface      | `Card`                               | a bordered box                   |
| set a heading or paragraph             | `Heading` / `Text`                   | a bare `h2`                      |
| show a short status                    | `Badge` / `StatusDot`                | coloured text alone              |
| fill a space with no content yet       | `EmptyState`                         | a blank area                     |

## Using it on a canvas

Compound components are namespaces: mount their parts (`Starter.Card.Root` with `Starter.Card.Body`, `Starter.Field.Root` with `Starter.Field.Label` and `Starter.Input`, `Starter.Tabs.Root` with `Tabs.List`, `Tabs.Tab`, `Tabs.Indicator`, `Tabs.Panel`). Layout comes from `Starter.Stack` and `Starter.Grid` (`gap` in 8px-grid steps: 0, 1, 2, 4, 6, 8, 10, 12, 16, in units of 4px).

On a Design canvas, through `x-import`:

- Text props are plain attributes (`variant="outline"`); numbers, `true`/`false`, lists and icons go through a hole filled by the artboard's `renderVals()` (`gap="{{four}}"` with `four: 4`, `icon="{{icons.Search}}"` with `icons: window.Starter.Icons`).
- `class-name` adds layout classes from the library's own stylesheet (`class-name="flex-1"`); prefer `Stack` and `Grid` props first.
- Hand-written markup between components can use the same classes (`class="type-body-sm text-muted-foreground"`).

**Dark mode**: wrap the artboard's content in an element with the `dark` class (`<div class="dark">`). That always works; the canvas's own theme switch may not reach every component.

## Not in this system yet

- **Types**: props come from these guidelines and Storybook. Each component's Docs page in Storybook has the full guidance.
- **Page templates** (sign-in, settings, galleries…): build pages from the components.
- **Preview cards** exist for the components used most; the rest are in the bundle and work, without a card.
