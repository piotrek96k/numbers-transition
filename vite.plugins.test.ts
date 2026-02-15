import { resolve } from 'path';
import { UserConfig } from 'vite';
import { defineConfig } from 'vitest/config';
import typeExtensions from './plugins/dist/type-extensions';

const config: UserConfig = {
  plugins: [typeExtensions('tsconfig.plugins.test.json', resolve('plugins', 'tests', 'type-extensions', 'extensions', 'extensions.ts'))],
  resolve: { alias: { 'type-extensions/extension': resolve('plugins', 'dist', 'extension') } },
  test: { globals: true, environment: 'node', include: ['plugins/tests/**/*.test.ts'] },
};

export default defineConfig(config);
