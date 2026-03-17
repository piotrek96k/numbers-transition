import { resolve } from 'path';
import { UserConfig } from 'vite';
import { defineConfig } from 'vitest/config';
import typeExtensions from './plugins/dist/type-extensions';

const mapAlias = ([key, value]: [string, string]): [string, string] => [`type-extensions/${key}`, resolve('plugins', 'dist', value)];

const config: UserConfig = {
  plugins: [typeExtensions('tsconfig.plugins.test.json', resolve('plugins', 'tests', 'type-extensions', 'extensions', 'extensions.ts'))],
  resolve: {
    alias: Object.fromEntries<string>(
      Object.entries<string>({ plugin: 'type-extensions', extension: 'extension' }).map<[string, string]>(mapAlias),
    ),
  },
  test: { globals: true, environment: 'node', include: ['plugins/tests/**/*.test.ts'] },
};

export default defineConfig(config);
