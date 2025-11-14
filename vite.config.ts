import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react-swc';
import typeExtensions, { TypeExtensionsOptions } from './plugins/type-extensions';

const extensionsConfig: TypeExtensionsOptions = {
  tsConfig: 'tsconfig.json',
  extensionsFilePath: 'src/NumbersTransition/NumbersTransition.extensions.ts',
  extensions: {
    StringExt: { type: 'String', typeCheck: "typeof VALUE === 'string' || VALUE instanceof String" },
    RegExpExt: { type: 'RegExp', typeCheck: 'VALUE instanceof RegExp' },
    ArrayExt: { type: 'Array', typeCheck: 'Array.isArray(VALUE)' },
  },
};

export default defineConfig({
  plugins: [react(), dts({ rollupTypes: true }), typeExtensions(extensionsConfig)],
  build: {
    lib: { entry: resolve(dirname(fileURLToPath(import.meta.url)), 'src/index.ts'), name: 'numbers-transition' },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'styled-components'],
      output: [{ format: 'es' }, { format: 'cjs', exports: 'named', interop: 'auto' }],
    },
  },
});
