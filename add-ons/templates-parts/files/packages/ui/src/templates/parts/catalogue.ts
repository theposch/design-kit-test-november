/* Demo content shared by the docs and library templates: this kit's own parts. */
export type Part = {
  name: string;
  summary: string;
  group: 'Actions' | 'Forms' | 'Feedback' | 'Layout' | 'Content';
};

export const PARTS: Part[] = [
  {
    name: 'Button',
    group: 'Actions',
    summary:
      'Runs an action here: save, send, delete. One primary button per view.',
  },
  {
    name: 'LinkButton',
    group: 'Actions',
    summary:
      'Goes to another page while looking like a button, for calls to action.',
  },
  {
    name: 'IconButton',
    group: 'Actions',
    summary: 'A square button with just an icon, named by a tooltip.',
  },
  {
    name: 'Menu',
    group: 'Actions',
    summary:
      'A list of actions behind one button, for things people do less often.',
  },
  {
    name: 'Input',
    group: 'Forms',
    summary: 'A single line of text: names, emails, search terms.',
  },
  {
    name: 'Textarea',
    group: 'Forms',
    summary: 'Several lines of text, for messages and notes.',
  },
  {
    name: 'Select',
    group: 'Forms',
    summary: 'Picks one value from a long list without taking much room.',
  },
  {
    name: 'Checkbox',
    group: 'Forms',
    summary: 'Turns one option on or off, or picks several from a list.',
  },
  {
    name: 'Switch',
    group: 'Forms',
    summary: 'Flips a setting that takes effect straight away.',
  },
  {
    name: 'Tag',
    group: 'Forms',
    summary: 'A pill people press to pick topics or filters.',
  },
  {
    name: 'Banner',
    group: 'Feedback',
    summary: 'A message in the page about the content right below it.',
  },
  {
    name: 'Badge',
    group: 'Feedback',
    summary: 'A one- or two-word status, like Paid or Overdue.',
  },
  {
    name: 'Toaster',
    group: 'Feedback',
    summary: 'Brief confirmations that slide in and leave on their own.',
  },
  {
    name: 'Spinner',
    group: 'Feedback',
    summary: 'Shows that something small is loading or saving.',
  },
  {
    name: 'Skeleton',
    group: 'Feedback',
    summary: 'Grey stand-ins shaped like the content on its way.',
  },
  {
    name: 'Stack',
    group: 'Layout',
    summary: 'Lays things out in a row or a column with even gaps.',
  },
  {
    name: 'Grid',
    group: 'Layout',
    summary: 'Columns that reflow by themselves as the screen narrows.',
  },
  {
    name: 'Layout',
    group: 'Layout',
    summary: 'The page frame: header, side panels, content and footer.',
  },
  {
    name: 'Card',
    group: 'Layout',
    summary: 'A raised surface that holds one item.',
  },
  {
    name: 'List',
    group: 'Content',
    summary: 'Rows of like items, each with a picture, text and a figure.',
  },
  {
    name: 'DetailsList',
    group: 'Content',
    summary: 'Label and value pairs that stack in narrow spaces.',
  },
  {
    name: 'Avatar',
    group: 'Content',
    summary: 'A person’s photo, or their initials when there is none.',
  },
  {
    name: 'Timestamp',
    group: 'Content',
    summary: 'A date or time written the way the reader expects.',
  },
  {
    name: 'EmptyState',
    group: 'Content',
    summary: 'Fills the space where content would be, and says what to do.',
  },
];

export const GROUPS = [
  'Actions',
  'Forms',
  'Feedback',
  'Layout',
  'Content',
] as const;
