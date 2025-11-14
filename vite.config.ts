import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react-swc';
import typeExtensions from './plugins/type-extensions';

export default defineConfig({
  plugins: [react(), dts({ rollupTypes: true }), typeExtensions('extensions.config.json')],
  build: {
    lib: { entry: resolve(dirname(fileURLToPath(import.meta.url)), 'src/index.ts'), name: 'numbers-transition' },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'styled-components'],
      output: [{ format: 'es' }, { format: 'cjs', exports: 'named', interop: 'auto' }],
    },
  },
});
