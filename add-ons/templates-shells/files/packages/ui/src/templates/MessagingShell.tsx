import { ArrowLeft, Hash, MessageSquare, X } from 'lucide-react';
import { useState, type FormEvent, type MouseEvent } from 'react';

import * as Avatar from '#components/atoms/Avatar';
import { Button } from '#components/atoms/Button';
import * as Drawer from '#components/atoms/Drawer';
import * as Field from '#components/atoms/Field';
import { Heading } from '#components/atoms/Heading';
import { Layout } from '#components/atoms/Layout';
import * as SideNav from '#components/atoms/SideNav';
import { Stack } from '#components/atoms/Stack';
import { StatusDot } from '#components/atoms/StatusDot';
import { Text } from '#components/atoms/Text';
import { Textarea } from '#components/atoms/Textarea';
import { Timestamp } from '#components/atoms/Timestamp';
import { IconButton } from '#components/molecules/IconButton';
import { textOf } from './parts/formData';
import { useWideScreen } from './parts/useWideScreen';

const LOCALE = 'en-US';

const CHANNELS = [
  { name: 'general', topic: 'Company-wide news', unread: 0 },
  { name: 'design', topic: 'Critiques, files and questions', unread: 3 },
  { name: 'launch', topic: 'Everything for 14 March', unread: 0 },
];

const PEOPLE = [
  { name: 'Kai Lindqvist', online: true },
  { name: 'Sam Okafor', online: false },
];

type Message = {
  id: string;
  who: string;
  initials: string;
  when: string;
  text: string;
  replies?: Message[];
};

const FIRST_MESSAGES: Message[] = [
  {
    id: 'm1',
    who: 'Kai Lindqvist',
    initials: 'KL',
    when: '2026-03-04T09:02:00',
    text: 'New homepage hero is in the file. Two options for the headline.',
    replies: [
      {
        id: 'r1',
        who: 'Ada Moreno',
        initials: 'AM',
        when: '2026-03-04T09:20:00',
        text: 'Option B reads warmer. Can we try it with the sand background?',
      },
      {
        id: 'r2',
        who: 'Kai Lindqvist',
        initials: 'KL',
        when: '2026-03-04T09:31:00',
        text: 'Done, updated in the same frame.',
      },
    ],
  },
  {
    id: 'm2',
    who: 'Sam Okafor',
    initials: 'SO',
    when: '2026-03-04T10:15:00',
    text: 'Reminder: photography review at 2pm.',
  },
];

function MessageRow({
  message,
  onThread,
}: {
  message: Message;
  onThread?: () => void;
}) {
  return (
    <Stack direction="row" gap={4} render={<li />}>
      <Avatar.Root className="size-8">
        <Avatar.Fallback className="type-body-xs">
          {message.initials}
        </Avatar.Fallback>
      </Avatar.Root>
      <Stack gap={1} className="min-w-0 flex-1">
        <Stack direction="row" align="baseline" gap={2} wrap>
          <Text register="body-sm" strong render={<span />}>
            {message.who}
          </Text>
          <Text register="body-xs" tone="muted" render={<span />}>
            <Timestamp
              date={new Date(message.when)}
              locale={LOCALE}
              format="time"
            />
          </Text>
        </Stack>
        <Text register="body-base">{message.text}</Text>
        {onThread && message.replies && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={onThread}
          >
            <MessageSquare aria-hidden />
            {message.replies.length} replies
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

function Composer({
  label,
  onSend,
}: {
  label: string;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState('');
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = textOf(new FormData(event.currentTarget), 'message');
    if (text === '') return;
    onSend(text);
    setDraft('');
  }
  return (
    <Stack gap={2} render={<form onSubmit={send} />}>
      <Field.Root name="message">
        <Field.Label className="sr-only">{label}</Field.Label>
        <Textarea
          placeholder={label}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="min-h-20"
        />
      </Field.Root>
      <Stack direction="row" justify="end">
        <Button type="submit" size="sm">
          Send
        </Button>
      </Stack>
    </Stack>
  );
}

function Thread({
  message,
  onClose,
}: {
  message: Message;
  onClose: () => void;
}) {
  return (
    <Stack gap={6}>
      <Stack direction="row" align="center" justify="between">
        <Heading level={2} register="heading-4">
          Thread
        </Heading>
        <IconButton icon={X} label="Close thread" onClick={onClose} />
      </Stack>
      <Stack gap={6} render={<ol />}>
        <MessageRow message={message} />
        {message.replies?.map((reply) => (
          <MessageRow key={reply.id} message={reply} />
        ))}
      </Stack>
    </Stack>
  );
}

/*
 * A team chat frame: channels down the side, the conversation in the middle
 * and a reply thread beside it. On tablets and phones the channel list and
 * the conversation are separate screens, and threads slide in.
 */
export function MessagingShell() {
  const wide = useWideScreen();
  const [channel, setChannel] = useState('design');
  const [browsing, setBrowsing] = useState(false);
  const [messages, setMessages] = useState(FIRST_MESSAGES);
  const [threadId, setThreadId] = useState<string>();
  const current = CHANNELS.find((item) => item.name === channel) ?? CHANNELS[0];
  const thread = messages.find((message) => message.id === threadId);

  const channels = (
    <SideNav.Root label="Conversations">
      <SideNav.Group>
        <SideNav.GroupLabel>Channels</SideNav.GroupLabel>
        <SideNav.List>
          {CHANNELS.map((item) => (
            <SideNav.Item key={item.name}>
              <SideNav.Link
                href={`#${item.name}`}
                current={item.name === channel}
                onClick={(event: MouseEvent) => {
                  event.preventDefault();
                  setChannel(item.name);
                  setBrowsing(false);
                }}
              >
                <Hash aria-hidden />
                {item.name}
                {item.unread > 0 && (
                  <SideNav.LinkEnd>
                    {item.unread}
                    <span className="sr-only"> unread</span>
                  </SideNav.LinkEnd>
                )}
              </SideNav.Link>
            </SideNav.Item>
          ))}
        </SideNav.List>
      </SideNav.Group>
      <SideNav.Group>
        <SideNav.GroupLabel>Direct messages</SideNav.GroupLabel>
        <SideNav.List>
          {PEOPLE.map((person) => (
            <SideNav.Item key={person.name}>
              <SideNav.Link href="#dm">
                <StatusDot
                  tone={person.online ? 'success' : 'neutral'}
                  label={person.online ? 'Online' : 'Away'}
                />
                {person.name}
              </SideNav.Link>
            </SideNav.Item>
          ))}
        </SideNav.List>
      </SideNav.Group>
    </SideNav.Root>
  );

  if (!wide && browsing) {
    return (
      <Layout>
        <Stack gap={6}>
          <Heading level={1} register="heading-2">
            Northwind
          </Heading>
          {channels}
        </Stack>
      </Layout>
    );
  }

  return (
    <>
      <Layout
        height="screen"
        width="full"
        start={wide ? { label: 'Conversations', content: channels } : undefined}
        end={
          wide && thread
            ? {
                label: 'Thread',
                content: (
                  <Thread
                    message={thread}
                    onClose={() => setThreadId(undefined)}
                  />
                ),
              }
            : undefined
        }
        header={
          <Stack direction="row" align="center" gap={2}>
            {!wide && (
              <IconButton
                icon={ArrowLeft}
                label="All conversations"
                onClick={() => setBrowsing(true)}
              />
            )}
            <Stack gap={1} className="min-w-0">
              <Heading level={1} register="heading-4">
                #{current.name}
              </Heading>
              <Text register="body-sm" tone="muted" lines="1">
                {current.topic}
              </Text>
            </Stack>
          </Stack>
        }
      >
        <Stack gap={8} className="min-h-full justify-end">
          <Stack gap={6} render={<ol aria-label="Messages" />}>
            {messages.map((message) => (
              <MessageRow
                key={message.id}
                message={message}
                onThread={() => setThreadId(message.id)}
              />
            ))}
          </Stack>
          <Composer
            label={`Message #${current.name}`}
            onSend={(text) =>
              setMessages([
                ...messages,
                {
                  id: `m${messages.length + 1}`,
                  who: 'Ada Moreno',
                  initials: 'AM',
                  when: '2026-03-04T10:40:00',
                  text,
                },
              ])
            }
          />
        </Stack>
      </Layout>

      <Drawer.Root
        open={!wide && thread !== undefined}
        onOpenChange={(open) => !open && setThreadId(undefined)}
        swipeDirection="right"
      >
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Viewport side="end">
            <Drawer.Popup side="end" aria-label="Thread">
              {thread && (
                <Thread
                  message={thread}
                  onClose={() => setThreadId(undefined)}
                />
              )}
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
