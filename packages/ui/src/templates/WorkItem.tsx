import {
  Columns2,
  Link2,
  MoreHorizontal,
  Paperclip,
  Upload,
  X,
} from 'lucide-react';
import { Fragment, useState, type FormEvent } from 'react';

import * as Avatar from '#components/atoms/Avatar';
import { Button } from '#components/atoms/Button';
import * as Card from '#components/atoms/Card';
import * as Checkbox from '#components/atoms/Checkbox';
import * as Combobox from '#components/atoms/Combobox';
import * as DetailsList from '#components/atoms/DetailsList';
import * as Dialog from '#components/atoms/Dialog';
import * as Field from '#components/atoms/Field';
import { FileDrop } from '#components/atoms/FileDrop';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Icon } from '#components/atoms/Icon';
import { Layout } from '#components/atoms/Layout';
import * as List from '#components/atoms/List';
import * as Progress from '#components/atoms/Progress';
import { Stack } from '#components/atoms/Stack';
import { Text } from '#components/atoms/Text';
import { Textarea } from '#components/atoms/Textarea';
import { TextLink } from '#components/atoms/TextLink';
import { Timestamp } from '#components/atoms/Timestamp';
import { IconButton } from '#components/molecules/IconButton';
import { textOf } from './parts/formData';
import { SelectField } from './parts/FormFields';
import { useWideScreen } from './parts/useWideScreen';

const LOCALE = 'en-US';
const NOW = new Date('2026-03-04T10:00:00');

const LABELS = ['Bug', 'Design', 'iOS', 'Android', 'Accessibility', 'Copy'];

const ATTACHMENTS = [
  { name: 'login-flow.fig', size: '2.4 MB' },
  { name: 'crash-log.txt', size: '18 KB' },
  { name: 'screen-recording.mov', size: '11 MB' },
];

type Entry = { who: string; initials: string; text: string; when: string };

const FIRST_ACTIVITY: Entry[] = [
  {
    who: 'Sam Okafor',
    initials: 'SO',
    text: 'created this item',
    when: '2026-03-02T09:12:00',
  },
  {
    who: 'Kai Lindqvist',
    initials: 'KL',
    text: 'It also happens on the tablet layout, I added a recording.',
    when: '2026-03-03T16:40:00',
  },
];

function Details() {
  return (
    <Stack gap={6}>
      <SelectField
        name="status"
        label="Status"
        placeholder="Choose a status"
        defaultValue="progress"
        options={[
          { value: 'todo', label: 'To do' },
          { value: 'progress', label: 'In progress' },
          { value: 'review', label: 'In review' },
          { value: 'done', label: 'Done' },
        ]}
      />
      <SelectField
        name="priority"
        label="Priority"
        placeholder="Choose a priority"
        defaultValue="high"
        options={[
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ]}
      />
      <SelectField
        name="assignee"
        label="Assignee"
        placeholder="Nobody yet"
        defaultValue="ada"
        options={[
          { value: 'ada', label: 'Ada Moreno' },
          { value: 'kai', label: 'Kai Lindqvist' },
          { value: 'sam', label: 'Sam Okafor' },
        ]}
      />
      <Combobox.Root items={LABELS} multiple defaultValue={['Bug', 'iOS']}>
        <Field.Root>
          <Field.Label>Labels</Field.Label>
          <Combobox.InputGroup>
            <Combobox.Chips>
              <Combobox.Value>
                {(chosen: string[]) => (
                  <Fragment>
                    {chosen.map((label) => (
                      <Combobox.Chip key={label} aria-label={label}>
                        {label}
                        <Combobox.ChipRemove label={`Remove ${label}`} />
                      </Combobox.Chip>
                    ))}
                    <Combobox.Input
                      placeholder={chosen.length > 0 ? '' : 'Add labels'}
                    />
                  </Fragment>
                )}
              </Combobox.Value>
            </Combobox.Chips>
          </Combobox.InputGroup>
        </Field.Root>
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Empty>No labels match.</Combobox.Empty>
              <Combobox.List>
                {(label: string) => (
                  <Combobox.Item key={label} value={label}>
                    <Combobox.ItemIndicator />
                    {label}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
      <DetailsList.Root>
        <DetailsList.Item>
          <DetailsList.Term>Due</DetailsList.Term>
          <DetailsList.Value>
            <Timestamp date={new Date('2026-03-12')} locale={LOCALE} />
          </DetailsList.Value>
        </DetailsList.Item>
        <DetailsList.Item>
          <DetailsList.Term>Created</DetailsList.Term>
          <DetailsList.Value>
            <Timestamp date={new Date('2026-03-02T09:12:00')} locale={LOCALE} />
          </DetailsList.Value>
        </DetailsList.Item>
      </DetailsList.Root>
    </Stack>
  );
}

function Subtasks() {
  const [tasks, setTasks] = useState([
    { title: 'Reproduce on iOS 19', done: true },
    { title: 'Find which release broke it', done: true },
    { title: 'Fix the keyboard covering the button', done: false },
    { title: 'Check the tablet layout', done: false },
    { title: 'Add a regression test', done: false },
  ]);
  const done = tasks.filter((task) => task.done).length;
  return (
    <Stack gap={4} render={<section aria-labelledby="subtasks" />}>
      <Heading level={2} register="heading-4" id="subtasks">
        Subtasks
      </Heading>
      <Progress.Root value={(done / tasks.length) * 100}>
        <Progress.Label>
          {done} of {tasks.length} done
        </Progress.Label>
        <Progress.Track>
          <Progress.Indicator />
        </Progress.Track>
      </Progress.Root>
      <Stack gap={2}>
        {tasks.map((task, index) => (
          <Text
            key={task.title}
            register="body-sm"
            render={<label />}
            className="flex items-center gap-2"
          >
            <Checkbox.Root
              checked={task.done}
              onCheckedChange={(checked) =>
                setTasks(
                  tasks.map((t, i) =>
                    i === index ? { ...t, done: checked } : t,
                  ),
                )
              }
            >
              <Checkbox.Indicator />
            </Checkbox.Root>
            <span
              className={task.done ? 'text-muted-foreground line-through' : ''}
            >
              {task.title}
            </span>
          </Text>
        ))}
      </Stack>
    </Stack>
  );
}

function Attachments() {
  return (
    <Stack gap={4} render={<section aria-labelledby="attachments" />}>
      <Heading level={2} register="heading-4" id="attachments">
        Attachments
      </Heading>
      <Grid columns={{ minWidth: 200 }} gap={4}>
        {ATTACHMENTS.map((file) => (
          <Card.Root key={file.name}>
            <Card.Body className="flex-row items-center gap-4">
              <Icon icon={Paperclip} className="text-muted-foreground size-4" />
              <Stack gap={1} className="min-w-0">
                <Text register="body-sm" lines="1">
                  {file.name}
                </Text>
                <Text register="body-xs" tone="muted">
                  {file.size}
                </Text>
              </Stack>
            </Card.Body>
          </Card.Root>
        ))}
      </Grid>
      <FileDrop aria-label="Add attachments" multiple>
        <Upload aria-hidden />
        <span className="text-foreground">Drop files or browse</span>
        <span>Up to 25 MB each</span>
      </FileDrop>
    </Stack>
  );
}

function Activity() {
  const [entries, setEntries] = useState(FIRST_ACTIVITY);
  const [draft, setDraft] = useState('');

  function comment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = textOf(new FormData(event.currentTarget), 'comment');
    if (text === '') return;
    setEntries([
      ...entries,
      { who: 'Ada Moreno', initials: 'AM', text, when: NOW.toISOString() },
    ]);
    setDraft('');
  }

  return (
    <Stack gap={4} render={<section aria-labelledby="activity" />}>
      <Heading level={2} register="heading-4" id="activity">
        Activity
      </Heading>
      <List.Root>
        {entries.map((entry) => (
          <List.Item key={`${entry.who}-${entry.when}`}>
            <Avatar.Root className="size-8">
              <Avatar.Fallback className="type-body-xs">
                {entry.initials}
              </Avatar.Fallback>
            </Avatar.Root>
            <List.Content>
              <List.Title>{entry.who}</List.Title>
              <List.Description>{entry.text}</List.Description>
            </List.Content>
            <List.End>
              <Text register="body-xs" tone="muted" render={<span />}>
                <Timestamp
                  date={new Date(entry.when)}
                  locale={LOCALE}
                  format="relative"
                  now={NOW}
                />
              </Text>
            </List.End>
          </List.Item>
        ))}
      </List.Root>
      <Stack gap={2} render={<form onSubmit={comment} />}>
        <Field.Root name="comment">
          <Field.Label>Add a comment</Field.Label>
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </Field.Root>
        <Stack direction="row" justify="end">
          <Button type="submit" variant="outline">
            Comment
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}

/*
 * One task in a tracker: what it is, its checklist, files and discussion,
 * with editable details beside it on desktop or in a dialog below that.
 */
export function WorkItem() {
  const wide = useWideScreen();
  const [sidePanel, setSidePanel] = useState(true);
  const [dialog, setDialog] = useState(false);
  const panelShown = wide ? sidePanel : dialog;

  return (
    <>
      <Layout
        width="narrow"
        header={
          <Stack direction="row" align="center" justify="between" gap={4}>
            <Text
              register="body-sm"
              tone="muted"
              render={<nav aria-label="Breadcrumb" />}
            >
              <TextLink href="#project" tone="muted">
                Mobile app
              </TextLink>{' '}
              / MOB-142
            </Text>
            <Stack direction="row" gap={1}>
              <IconButton icon={Link2} label="Copy link" />
              <IconButton icon={MoreHorizontal} label="More actions" />
              <IconButton
                icon={Columns2}
                label={panelShown ? 'Hide details' : 'Show details'}
                aria-pressed={panelShown}
                onClick={() =>
                  wide ? setSidePanel(!sidePanel) : setDialog(!dialog)
                }
              />
            </Stack>
          </Stack>
        }
        end={
          wide && sidePanel
            ? { label: 'Details', content: <Details /> }
            : undefined
        }
      >
        <Stack gap={8}>
          <Stack gap={4}>
            <Heading level={1} register="heading-2">
              The keyboard covers the sign-in button
            </Heading>
            <Text tone="muted">
              On smaller phones the keyboard slides up over the sign-in button,
              so people have to close it before they can continue. The button
              should stay above the keyboard.
            </Text>
          </Stack>
          <Subtasks />
          <Attachments />
          <Activity />
        </Stack>
      </Layout>

      <Dialog.Root open={!wide && dialog} onOpenChange={setDialog}>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Stack direction="row" align="center" justify="between">
              <Dialog.Title>Details</Dialog.Title>
              <Dialog.Close
                render={<Button variant="ghost" size="sm" aria-label="Close" />}
              >
                <X aria-hidden />
              </Dialog.Close>
            </Stack>
            <Details />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
