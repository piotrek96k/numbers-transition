import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { TransformPluginContext, TransformResult } from 'rollup';
import typeExtensions, { TypeExtensionsPlugin } from '../../../dist/type-extensions';

export const transformer = (
  extensionsFilePath: string = resolve(dirname(dirname(fileURLToPath(import.meta.url))), 'extensions', 'extensions.ts'),
): ((code: string, id?: string) => string) => {
  const plugin: TypeExtensionsPlugin = typeExtensions('tsconfig.plugins.test.json', extensionsFilePath);

  return (code: string, id: string = fileURLToPath(import.meta.url)): string => {
    const result: TransformResult = plugin.transform.call<TransformPluginContext, [string, string], TransformResult>(
      <TransformPluginContext>(<unknown>{}),
      code,
      id,
    );

    return typeof result === 'string' ? result : result!.code!;
  };
};
