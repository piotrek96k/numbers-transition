import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { StorybookConfig } from '@storybook/react-vite';
import { InlineConfig } from 'vite';
import typeExtensions from '../plugins/type-extensions';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@chromatic-com/storybook', '@storybook/addon-docs'],
  framework: { name: '@storybook/react-vite', options: {} },
  docs: {},
  typescript: { reactDocgen: 'react-docgen-typescript' },
  viteFinal: ({ plugins, ...restConfig }: InlineConfig): InlineConfig => ({
    ...restConfig,
    plugins: [
      ...(plugins ?? []),
      typeExtensions(JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../extensions.config.json'), 'utf-8'))),
    ],
  }),
};

export default config;
