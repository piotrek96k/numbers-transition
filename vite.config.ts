import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { Diagnostic, DiagnosticCategory } from 'typescript';
import { UserConfig, defineConfig } from 'vite';
import { bundleDts } from 'vite-plugin-bundle-dts';
import typeExtensions from './plugins/dist/type-extensions.js';

const throwDiagnosticError = (): void => {
  throw new Error('Declaration diagnostics failed');
};

const afterDiagnostic = (diagnostics: readonly Diagnostic[]): void =>
  diagnostics.some(({ category }: Diagnostic): boolean => category === DiagnosticCategory.Error) ? throwDiagnosticError() : undefined;

const config: UserConfig = {
  plugins: [
    typeExtensions('tsconfig.json', resolve('src', 'NumbersTransition', 'NumbersTransition.extensions.ts')),
    react(),
    bundleDts({ rollupTypes: true, afterDiagnostic }),
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
