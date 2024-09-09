import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react(), dts({ rollupTypes: true })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'numbers-transition',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
    },
  },
});
