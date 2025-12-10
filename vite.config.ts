import { resolve } from 'path';
import { UserConfig, defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react-swc';
import typeExtensions from './plugins/dist/type-extensions';

const config: UserConfig = {
  plugins: [react(), dts({ rollupTypes: true }), typeExtensions('extensions.config.json')],
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
