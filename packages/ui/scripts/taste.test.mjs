import assert from 'node:assert/strict';
import { test } from 'node:test';

import { projectScreens } from './lib/project.mjs';
import {
  findStories,
  parseArgs,
  partsOf,
  planTarget,
  slug,
  TasteError,
} from './taste.mjs';

const story = (title, name) => ({
  id: `${slug(title)}--${slug(name)}`,
  title,
  name,
});

const STORIES = [
  ...['Desktop', 'Tablet', 'Phone'].map((name) =>
    story('Templates/Sign in/Card', name),
  ),
  ...['Desktop', 'Tablet', 'Phone'].map((name) =>
    story('Templates/Sign in/Simple', name),
  ),
  story('Components/Atoms/Card', 'Default'),
  story('Components/Atoms/Button', 'Default'),
  story('Components/Atoms/Button', 'Variants'),
  story('Components/Molecules/IconButton', 'Default'),
];

const ALL = projectScreens({});
const PHONE_ONLY = projectScreens({ screens: ['phone'] });

test('a title is found however it is typed', () => {
  for (const target of [
    'Templates/Sign in/Card',
    'templates-sign-in-card',
    'sign in/card',
    'sign-in-card',
  ]) {
    const found = findStories(target, STORIES);
    assert.equal(found.byId, false);
    assert.deepEqual(
      found.stories.map((s) => s.name),
      ['Desktop', 'Tablet', 'Phone'],
      target,
    );
  }
});

test("a whole name wins over a partial match, so button isn't IconButton", () => {
  const found = findStories('button', STORIES);
  assert.deepEqual(
    [...new Set(found.stories.map((s) => s.title))],
    ['Components/Atoms/Button'],
  );
});

test('an exact story id names that one story', () => {
  const found = findStories('components-atoms-button--variants', STORIES);
  assert.equal(found.byId, true);
  assert.deepEqual(
    found.stories.map((s) => s.name),
    ['Variants'],
  );
});

test('several matches are listed in a form that can be typed back', () => {
  assert.throws(
    () => findStories('card', STORIES),
    (error) =>
      error instanceof TasteError &&
      /matches 2 stories/.test(error.message) &&
      error.message.includes('templates-sign-in-card') &&
      error.message.includes('components-atoms-card'),
  );
  for (const line of ['templates-sign-in-card', 'components-atoms-card']) {
    assert.equal(findStories(line, STORIES).stories.length > 0, true);
  }
});

test('no match says how to see what there is', () => {
  assert.throws(
    () => findStories('checkout', STORIES),
    (error) => error instanceof TasteError && /--list/.test(error.message),
  );
  assert.throws(() => findStories('/', STORIES), TasteError);
});

test("a template is shot from each size's own story, at the project's sizes only", () => {
  const [group] = planTarget('sign-in-card', STORIES, ALL);
  assert.equal(group.slug, 'templates-sign-in-card');
  assert.deepEqual(
    group.shots.map((shot) => [shot.screen, shot.id, shot.size.width]),
    [
      ['phone', 'templates-sign-in-card--phone', 390],
      ['tablet', 'templates-sign-in-card--tablet', 820],
      ['desktop', 'templates-sign-in-card--desktop', 1440],
    ],
  );

  const [phone] = planTarget('sign-in-card', STORIES, PHONE_ONLY);
  assert.deepEqual(
    phone.shots.map((shot) => shot.id),
    ['templates-sign-in-card--phone'],
  );
});

test('a template story named by id is shot at its own size, whatever the project has', () => {
  const [group] = planTarget(
    'templates-sign-in-card--tablet',
    STORIES,
    PHONE_ONLY,
  );
  assert.equal(group.slug, 'templates-sign-in-card--tablet');
  assert.deepEqual(
    group.shots.map((shot) => shot.screen),
    ['tablet'],
  );
});

test('any other title gets a folder per story, each at every project size', () => {
  const groups = planTarget('button', STORIES, ALL);
  assert.deepEqual(
    groups.map((group) => group.slug),
    ['components-atoms-button--default', 'components-atoms-button--variants'],
  );
  assert.deepEqual(
    groups[0].shots.map((shot) => shot.screen),
    ['phone', 'tablet', 'desktop'],
  );
});

test('an address is shot at every project size, in a folder named after it', () => {
  const [group] = planTarget(
    'http://localhost:5173/settings?tab=team',
    [],
    ALL,
  );
  assert.equal(group.slug, 'localhost-5173-settings-tab-team');
  assert.equal(group.shots.length, 3);
  assert.equal(group.shots[0].url, 'http://localhost:5173/settings?tab=team');
});

test('options are read, and a wrong one is named', () => {
  assert.deepEqual(parseArgs(['--', 'card', '--modes=dark']), {
    targets: ['card'],
    modes: ['Dark'],
    list: false,
    storybookUrl: 'http://localhost:6006',
  });
  assert.deepEqual(parseArgs(['card']).modes, ['Light', 'Dark']);
  assert.throws(() => parseArgs(['card', '--modes=sepia']), TasteError);
  assert.throws(() => parseArgs(['card', '--mode=dark']), /Unknown option/);
});

test('a long page is cut into parts of two screens, a short one is not', () => {
  assert.deepEqual(partsOf(844, 844), []);
  assert.deepEqual(partsOf(1688, 844), []);
  assert.deepEqual(partsOf(4000, 844), [
    { y: 0, height: 1688 },
    { y: 1688, height: 1688 },
    { y: 3376, height: 624 },
  ]);
});
