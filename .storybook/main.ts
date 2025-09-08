import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@chromatic-com/storybook', '@storybook/addon-docs'],
  framework: { name: '@storybook/react-vite', options: {} },
  docs: {},
  typescript: { reactDocgen: 'react-docgen-typescript' },
};

export default config;
