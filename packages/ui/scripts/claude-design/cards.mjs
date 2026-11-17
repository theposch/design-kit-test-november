// What build.mjs can't read from the code: a note per colour, the spacing
// steps, and the preview cards. A card's `render` is the body of a
// React.createElement tree, with S = the bundle and h = createElement.

export const COLOR_NOTES = {
  background: 'Page background.',
  foreground: 'Text on background.',
  surface: 'Raised surfaces: cards, popups.',
  'surface-foreground': 'Text on surface.',
  primary:
    'The main action: primary buttons, the active tab bar, a checked switch.',
  'primary-foreground': 'Text and icons on primary.',
  secondary: 'Quiet fills: secondary buttons, the avatar fallback.',
  'secondary-foreground': 'Text on secondary.',
  muted: 'Subtle fills: hovered rows, the active side-menu item.',
  'muted-foreground': 'Secondary text: descriptions, hints, placeholders.',
  destructive: 'Irreversible actions and errors.',
  'destructive-foreground': 'Text on destructive.',
  'success-subtle': 'Success badge and banner fill.',
  'success-subtle-foreground': 'Text or dot on success-subtle.',
  'warning-subtle': 'Warning badge and banner fill.',
  'warning-subtle-foreground': 'Text or dot on warning-subtle.',
  'info-subtle': 'Info badge and banner fill.',
  'info-subtle-foreground': 'Text or dot on info-subtle.',
  'destructive-subtle': 'Error badge and banner fill.',
  'destructive-subtle-foreground': 'Text or dot on destructive-subtle.',
  border: 'Hairlines: card edges, dividers, outline buttons.',
  input:
    'Control outlines (inputs, selects); clears 3:1 against background and surface.',
  ring: 'Keyboard focus ring.',
};

export const SPACING = [
  ['space-1', '4px', 'Inside components only.'],
  ['space-2', '8px', 'Tight groups: an icon and its label, button pairs.'],
  ['space-4', '16px', 'Form fields in a stack; card content.'],
  ['space-6', '24px', 'Card padding; between cards.'],
  ['space-8', '32px', 'Page sections; page padding on desktop.'],
  ['space-10', '40px', 'Large gaps.'],
  ['space-12', '48px', 'Large gaps.'],
  ['space-16', '64px', 'Hero spacing.'],
].map(([name, value, usage]) => ({ name, value, usage }));

export const CARDS = {
  Button: {
    group: 'Actions',
    height: 120,
    summary:
      'Runs an action on this page; one primary per area, the rest outline or ghost.',
    props:
      'Props: `variant` primary | secondary | outline | ghost | destructive; `size` sm | md | lg; `disabled`. Never navigate with it: use `LinkButton`.',
    render: `h(Stack, { direction: 'row', gap: 2, wrap: true, align: 'center' },
      h(S.Button, null, 'Save'), h(S.Button, { variant: 'secondary' }, 'Secondary'),
      h(S.Button, { variant: 'outline' }, 'Outline'), h(S.Button, { variant: 'ghost' }, 'Ghost'),
      h(S.Button, { variant: 'destructive' }, 'Delete')),
    h(Stack, { direction: 'row', gap: 2, align: 'center' },
      h(S.Button, { size: 'sm' }, 'Small'), h(S.Button, null, 'Medium'),
      h(S.Button, { size: 'lg' }, 'Large'), h(S.Button, { disabled: true }, 'Disabled'))`,
  },
  Input: {
    group: 'Forms',
    height: 100,
    summary: 'A one-line text box; always inside a Field with a label.',
    props:
      'Props: `size` sm | md | lg, plus any native input attribute (`type`, `placeholder`, `defaultValue`).',
    render: `h(Stack, { gap: 2 }, h(S.Input, { placeholder: 'name@company.com', 'aria-label': 'Email' }),
      h(S.Input, { size: 'lg', defaultValue: 'Ada Moreno', 'aria-label': 'Name' }))`,
  },
  Field: {
    group: 'Forms',
    height: 150,
    summary:
      'Labels, describes and flags a form control: label above, hint or error below.',
    props:
      'Parts: `Field.Root` (`invalid`, `disabled`), `Field.Label`, `Field.Description`, `Field.Error` (`match` to always show it). The placeholder is never the label.',
    render: `h(S.Field.Root, null, h(S.Field.Label, null, 'Email'), h(S.Input, { defaultValue: 'ada@example' }),
      h(S.Field.Description, null, 'We never share it.')),
    h(S.Field.Root, { invalid: true }, h(S.Field.Label, null, 'Password'),
      h(S.Input, { type: 'password', defaultValue: 'short' }),
      h(S.Field.Error, { match: true }, 'Use at least 12 characters.'))`,
  },
  Card: {
    group: 'Layout',
    height: 140,
    summary:
      'Groups related content on a raised surface: a real container, not decoration.',
    props:
      'Parts: `Card.Root` (`variant` surface | muted), `Card.Body`. Group with space first; a card marks a real container.',
    render: `h(Stack, { direction: 'row', gap: 4 },
      h(S.Card.Root, { className: 'flex-1' }, h(S.Card.Body, null,
        h(S.Heading, { level: 3, register: 'heading-4' }, 'Profile'),
        h(S.Text, { register: 'body-sm', tone: 'muted' }, 'How you appear to people.'))),
      h(S.Card.Root, { variant: 'muted', className: 'flex-1' }, h(S.Card.Body, null,
        h(S.Text, { strong: true }, 'Muted'),
        h(S.Text, { register: 'body-sm', tone: 'muted' }, 'For empty or quiet areas.'))))`,
  },
  Tabs: {
    group: 'Navigation',
    height: 110,
    summary: 'Switches between peer views of the same thing.',
    props:
      'Parts: `Tabs.Root` (`defaultValue`, `orientation`), `Tabs.List`, `Tabs.Tab` (`value`), `Tabs.Indicator`, `Tabs.Panel` (`value`).',
    render: `h(S.Tabs.Root, { defaultValue: 'profile' }, h(S.Tabs.List, null,
      h(S.Tabs.Tab, { value: 'profile' }, h(S.Icon, { icon: S.Icons.UserRound }), 'Profile'),
      h(S.Tabs.Tab, { value: 'security' }, h(S.Icon, { icon: S.Icons.KeyRound }), 'Security'),
      h(S.Tabs.Tab, { value: 'alerts' }, h(S.Icon, { icon: S.Icons.Bell }), 'Notifications'),
      h(S.Tabs.Indicator)))`,
  },
  Switch: {
    group: 'Forms',
    height: 80,
    summary: 'Flips a setting that applies straight away.',
    props:
      'Parts: `Switch.Root` (`checked` / `defaultChecked`, `onCheckedChange`, `disabled`), `Switch.Thumb`. For choices saved with a button, use `Checkbox`.',
    render: `h(Stack, { direction: 'row', gap: 4, align: 'center' },
      h(S.Switch.Root, { defaultChecked: true, 'aria-label': 'On' }, h(S.Switch.Thumb)),
      h(S.Switch.Root, { 'aria-label': 'Off' }, h(S.Switch.Thumb)),
      h(S.Switch.Root, { disabled: true, 'aria-label': 'Disabled' }, h(S.Switch.Thumb)))`,
  },
  Select: {
    group: 'Forms',
    height: 100,
    summary: 'Picks one value from a list too long for radio buttons.',
    props:
      'Parts: `Select.Root` (`items`, `defaultValue`), `Select.Trigger`, `Select.Value` (`placeholder`), `Select.Icon`, then `Select.Portal` › `Positioner` › `Popup` › `List` › `Item` (`ItemIndicator`, `ItemText`).',
    render: `h(S.Select.Root, { items: [{ value: 'london', label: 'London (UTC+0)' }, { value: 'berlin', label: 'Berlin (UTC+1)' }], defaultValue: 'london' },
      h(S.Select.Trigger, { className: 'max-w-72', 'aria-label': 'Time zone' },
        h(S.Select.Value, { placeholder: 'Choose a time zone' }), h(S.Select.Icon)),
      h(S.Select.Portal, null, h(S.Select.Positioner, null, h(S.Select.Popup, null, h(S.Select.List, null,
        h(S.Select.Item, { value: 'london' }, h(S.Select.ItemIndicator), h(S.Select.ItemText, null, 'London (UTC+0)')),
        h(S.Select.Item, { value: 'berlin' }, h(S.Select.ItemIndicator), h(S.Select.ItemText, null, 'Berlin (UTC+1)')))))))`,
  },
  Avatar: {
    group: 'Data display',
    height: 90,
    summary: 'Shows a person: their photo, or their initials.',
    props:
      'Parts: `Avatar.Root`, `Avatar.Image` (`src`, `alt`), `Avatar.Fallback` (initials).',
    render: `h(Stack, { direction: 'row', gap: 4, align: 'center' },
      h(S.Avatar.Root, null, h(S.Avatar.Fallback, null, 'AM')),
      h(S.Avatar.Root, { className: 'size-16' }, h(S.Avatar.Fallback, null, 'JK')))`,
  },
  Heading: {
    group: 'Type',
    height: 210,
    summary: 'Sets a heading in one of the four named styles.',
    props:
      'Props: `level` 1–6 (the outline), `register` heading-1 … heading-4 to change the look without changing the level.',
    render: `h(S.Heading, { level: 1 }, 'Heading 1'), h(S.Heading, { level: 2 }, 'Heading 2'),
    h(S.Heading, { level: 3 }, 'Heading 3'), h(S.Heading, { level: 4 }, 'Heading 4')`,
  },
  Text: {
    group: 'Type',
    height: 130,
    summary: 'Sets a paragraph or a run of text in a named body style.',
    props:
      'Props: `register` body-lg | body-base | body-sm | body-xs | label-sm; `tone` inherit | muted | destructive; `strong`; `align`; `lines` to cut long text off.',
    render: `h(S.Text, { register: 'body-lg' }, 'Body large'), h(S.Text, null, 'Body base, the default'),
    h(S.Text, { register: 'body-sm', tone: 'muted' }, 'Body small, muted'),
    h(S.Text, { register: 'body-xs' }, 'Body extra small')`,
  },
  Stack: {
    group: 'Layout',
    height: 90,
    summary:
      'Lays things out in a row or a column with a gap from the 8px grid.',
    props:
      'Props: `direction` row | column; `gap` 0, 1, 2, 4, 6, 8, 10, 12, 16 (×4px); `align`, `justify`, `wrap`.',
    render: `h(Stack, { direction: 'row', gap: 2 }, h(S.Button, { variant: 'outline' }, 'One'),
      h(S.Button, { variant: 'outline' }, 'Two'), h(S.Button, { variant: 'outline' }, 'Three'))`,
  },
  Icon: {
    group: 'Data display',
    height: 70,
    summary: 'Shows a Lucide icon at the size of the text beside it.',
    props:
      'Props: `icon` (any `Starter.Icons.<Name>`), `label` only when it stands alone.',
    render: `h(Stack, { direction: 'row', gap: 4, align: 'center' },
      ['Search', 'Bell', 'Settings', 'UserRound', 'CreditCard', 'ShieldCheck'].map(function (name) {
        return h(S.Icon, { key: name, icon: S.Icons[name], label: name });
      }))`,
  },
};
