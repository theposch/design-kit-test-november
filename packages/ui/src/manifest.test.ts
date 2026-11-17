import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { storyGuidance, withStoryGuidance } from '#storybook/manifest';

const SRC = path.dirname(fileURLToPath(import.meta.url));
const stories = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.stories.tsx'))
  .sort();

/*
 * Coding agents learn which component to use from the guidance addon-mcp
 * serves, which `main.ts` reads straight from each story file. A story whose
 * guidance can't be read that way drops out of what agents see.
 */
describe('guidance for coding agents', () => {
  it.each(stories.filter((file) => file.startsWith('components/')))(
    '%s has usage() an agent can read',
    (file) => {
      const guidance = storyGuidance(
        readFileSync(path.join(SRC, file), 'utf8'),
        file,
      );
      expect(guidance?.summary).toBeTruthy();
      expect(guidance?.description).toContain('**Use it when**');
    },
  );

  it.each(stories.filter((file) => file.startsWith('templates/')))(
    '%s has an about() note an agent can read',
    (file) => {
      const guidance = storyGuidance(
        readFileSync(path.join(SRC, file), 'utf8'),
        file,
      );
      expect(guidance?.description).toBeTruthy();
    },
  );

  it('names the file and the value when guidance is not plain text', () => {
    expect(() =>
      storyGuidance(`usage({ purpose: PURPOSE })`, 'Thing.stories.tsx'),
    ).toThrow(/Thing\.stories\.tsx: .*`PURPOSE`/);
  });

  it('adds the guidance to the manifest and keeps a JSDoc description', () => {
    const manifests = withStoryGuidance(
      {
        components: {
          v: 0,
          components: {
            button: {
              id: 'button',
              name: 'Button',
              path: './src/components/atoms/Button.stories.tsx',
              description: 'From JSDoc.',
              stories: [],
              jsDocTags: {},
            },
          },
        },
      },
      path.join(SRC, '..'),
    );
    const button = manifests?.components?.components.button;
    expect(button?.description).toMatch(
      /^From JSDoc\.\n\n.+\*\*Use it when\*\*/s,
    );
    expect(button?.summary).toBeTruthy();
  });
});
