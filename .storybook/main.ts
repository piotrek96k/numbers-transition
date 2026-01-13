import type { InlineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { withoutVitePlugins } from '@storybook/builder-vite';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@chromatic-com/storybook', '@storybook/addon-docs'],
  framework: { name: '@storybook/react-vite', options: {} },
  typescript: { reactDocgen: 'react-docgen-typescript' },
  viteFinal: async ({ build, plugins, ...config }: InlineConfig): Promise<InlineConfig> => ({
    ...config,
    build: { ...build, chunkSizeWarningLimit: 2_500 },
    plugins: await withoutVitePlugins(plugins, [dts().name]),
  }),
};

export default config;
