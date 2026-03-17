import { resolve } from 'path';
import { UserConfig, defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react';
import typeExtensions from './plugins/dist/type-extensions';

const config: UserConfig = {
  plugins: [
    typeExtensions('tsconfig.json', resolve('src', 'NumbersTransition', 'NumbersTransition.extensions.ts')),
    react(),
    dts({ rollupTypes: true }),
  ],
  resolve: { alias: { 'type-extensions/extension': resolve('plugins', 'dist', 'extension') } },
  build: {
    lib: { entry: resolve('src', 'index.ts'), name: 'numbers-transition', formats: ['es', 'cjs'] },
    rolldownOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'styled-components'],
      output: { exports: 'named' },
      checks: { pluginTimings: false },
    },
    minify: 'terser',
  },
};

export default defineConfig(config);
