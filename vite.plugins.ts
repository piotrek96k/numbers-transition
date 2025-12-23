import { resolve } from 'path';
import { UserConfig, defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const config: UserConfig = {
  plugins: [dts({ rollupTypes: true, tsconfigPath: resolve('tsconfig.plugins.json') })],
  build: {
    lib: {
      entry: ['suppress-diagnostics', 'type-extensions'].map<string>((plugin: string): string =>
        resolve('plugins', plugin, `${plugin}.ts`),
      ),
      formats: ['es'],
    },
    rollupOptions: { external: ['crypto', 'fs', 'path', 'process', 'typescript'] },
    outDir: resolve('plugins', 'dist'),
    minify: 'terser',
  },
};

export default defineConfig(config);
