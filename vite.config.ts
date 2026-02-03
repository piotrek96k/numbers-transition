import { resolve } from 'path';
import { UserConfig, defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react-swc';
import typeExtensions from './plugins/dist/type-extensions';

const config: UserConfig = {
  plugins: [typeExtensions('extensions.config.json'), react(), dts({ rollupTypes: true })],
  resolve: { alias: { extension: resolve('plugins', 'dist', 'extension') } },
  build: {
    lib: { entry: resolve('src', 'index.ts'), name: 'numbers-transition' },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'styled-components'],
      output: [{ format: 'es' }, { format: 'cjs', exports: 'named', interop: 'auto' }],
    },
    minify: 'terser',
  },
};

export default defineConfig(config);
