import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { TransformPluginContext, TransformResult } from 'rollup';
import typeExtensions, { TypeExtensionsPlugin } from '../../../dist/type-extensions';

const plugin: TypeExtensionsPlugin = typeExtensions(resolve(dirname(dirname(fileURLToPath(import.meta.url))), 'extensions.config.json'));

export const transform = (code: string): string => {
  const result: TransformResult = plugin.transform.call<TransformPluginContext, [string, string], TransformResult>(
    <TransformPluginContext>(<unknown>{}),
    code,
    fileURLToPath(import.meta.url),
  );

  return typeof result === 'string' ? result : result!.code!;
};
