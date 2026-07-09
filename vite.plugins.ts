import { resolve } from 'path';
import { Diagnostic, DiagnosticCategory } from 'typescript';
import dts from 'unplugin-dts/vite';
import { UserConfig, defineConfig } from 'vite';

interface Plugin {
  name: string;
  entry?: string;
  path?: string[];
  fileName?: string;
}

const throwDiagnosticError = (): void => {
  throw new Error('Declaration diagnostics failed');
};

const afterDiagnostic = (diagnostics: readonly Diagnostic[]): void =>
  diagnostics.some(({ category }: Diagnostic): boolean => category === DiagnosticCategory.Error) ? throwDiagnosticError() : undefined;

const mapPlugin = ({ name, entry = name, path = [], fileName = 'plugin' }: Plugin): Record<string, string> => ({
  [entry]: resolve('plugins', name, ...path, `${fileName}.ts`),
});

const reducePlugins = (acc: Record<string, string>, curr: Record<string, string>): Record<string, string> => ({ ...acc, ...curr });

const plugins: Plugin[] = [
  { name: 'suppress-diagnostics' },
  { name: 'type-extensions', path: ['plugin'] },
  { name: 'type-extensions', entry: 'extension', path: ['extension'], fileName: 'extension' },
  { name: 'verify-dts' },
];

const config: UserConfig = {
  plugins: [dts({ tsconfigPath: resolve('tsconfig.plugins.json'), bundleTypes: true, afterDiagnostic })],
  build: {
    lib: { entry: plugins.map<Record<string, string>>(mapPlugin).reduce(reducePlugins), formats: ['es'] },
    rolldownOptions: {
      external: ['async_hooks', 'child_process', 'crypto', 'fs', 'path', 'process', 'typescript'],
      checks: { pluginTimings: false },
    },
    outDir: resolve('plugins', 'dist'),
    minify: 'terser',
  },
};

export default defineConfig(config);
