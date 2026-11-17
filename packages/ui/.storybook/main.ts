import type { StorybookConfig } from '@storybook/react-vite';
import path from 'node:path';
import remarkGfm from 'remark-gfm';
import type { Manifests, PresetValue } from 'storybook/internal/types';

import { withStoryGuidance } from './manifest';

/* StorybookConfig doesn't list this experimental preset yet. */
type Config = StorybookConfig & {
  experimental_manifests?: PresetValue<Manifests | undefined>;
};

const config: Config = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } },
      },
    },
    '@storybook/addon-mcp',
    '@storybook/addon-themes',
  ],
  framework: '@storybook/react-vite',
  experimental_manifests: (manifests) =>
    withStoryGuidance(manifests, path.join(import.meta.dirname, '..')),
};
export default config;
