import { resolve } from 'path';
import { UserConfig } from 'vite';
import { defineConfig } from 'vitest/config';
import typeExtensions from './plugins/dist/type-extensions';

const config: UserConfig = {
  plugins: [typeExtensions(resolve('plugins', 'tests', 'type-extensions', 'extensions.config.json'))],
  resolve: { alias: { extension: resolve('plugins', 'dist', 'extension') } },
  test: { globals: true, environment: 'node', include: ['plugins/tests/**/*.test.ts'] },
};

export default defineConfig(config);
