import { resolve } from 'path';
import { UserConfig, defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

interface Plugin {
  name: string;
  entry?: string;
  path?: string[];
  fileName?: string;
}

const mapPlugin = ({ name, entry = name, path = [], fileName = 'plugin' }: Plugin): Record<string, string> => ({
  [entry]: resolve('plugins', name, ...path, `${fileName}.ts`),
});

const reducePlugins = (acc: Record<string, string>, curr: Record<string, string>): Record<string, string> => ({ ...acc, ...curr });

const plugins: Plugin[] = [
  { name: 'suppress-diagnostics' },
  { name: 'type-extensions', path: ['plugin'] },
  { name: 'type-extensions', entry: 'extension', path: ['extension'], fileName: 'extension' },
];

const config: UserConfig = {
  plugins: [dts({ tsconfigPath: resolve('tsconfig.plugins.json'), rollupTypes: true })],
  build: {
    lib: { entry: plugins.map<Record<string, string>>(mapPlugin).reduce(reducePlugins), formats: ['es'] },
    rollupOptions: { external: ['async_hooks', 'crypto', 'fs', 'path', 'process', 'typescript'] },
    outDir: resolve('plugins', 'dist'),
    minify: 'terser',
  },
};

export default defineConfig(config);
