# zero-design-kit

A component library template that designers author directly in code.

## Language

### Component tiers

**Atom**: The smallest hand-authored component — native markup, or a single Base UI component wrapped and styled. Never composed of other library components. _Avoid_: element, primitive, base component

**Molecule**: A reusable composition of Atoms and/or other Molecules. What promotes a component to Organism is app coupling, not composition depth. _Avoid_: pattern

**Organism**: A complex, distinct area of the interface, composed of the tiers below; may hold app-specific logic and state. _Avoid_: section

**Control**: An interactive Atom the user activates or gives input to (Button, LinkButton, Input, Select, …); the only kind of component permitted a size ladder.

**Part**: One piece of a compound Atom, exported on its namespace (`Dialog.Popup`). Every Base UI part is wrapped, whether or not it carries styles. _Avoid_: sub-component, slot

**Base UI**: The headless library (`@base-ui/react`) supplying behavior and accessibility beneath Atoms. Consumers never import it; only Atoms do. _Avoid_: primitives library, headless components

There is no wrapper tier: shared behavior lives in `src/hooks/` or in the consuming app. _Avoid_: wrapper

### Styling

**Token**: A named semantic design value (a color role, radius, or type size); the only sanctioned styling vocabulary for components. _Avoid_: CSS variable, style constant

**Registered token**: A Token mapped into a Tailwind namespace in `@theme inline`, which is what gives it a class form (`--primary` → `bg-primary`). The registration exists for the compiler to build the class from; the typography composites read the underlying raw vars directly.

**Mode**: One of the two token resolutions of the palette — light (the `:root` values) or dark (the `.dark` overrides). Modes exist only at the token level; components are mode-blind. _Avoid_: theme, skin

### Workflow

**Story**: A component's Storybook entry; it is simultaneously the component's preview, documentation, and test.

**Exploration**: A standalone experiment — design- or engineering-led — exempt from the library's conventions and published as its own Metalab Site. Nothing in the library may depend on one. _Avoid_: prototype, spike, sandbox

**Canonical site**: The published form of an Exploration as merged on main; there is exactly one per Exploration.

**Draft site**: A personally published work-in-progress copy of an Exploration, distinct per publisher and never written to by automation.
