import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { TransformPluginContext, TransformResult } from 'rollup';
import typeExtensions, { TypeExtensionsPlugin } from '../../../dist/type-extensions';

const plugin: TypeExtensionsPlugin = typeExtensions(resolve(dirname(dirname(fileURLToPath(import.meta.url))), 'extensions.config.json'));

export const transform = (code: string, id: string = fileURLToPath(import.meta.url)): string => {
  const result: TransformResult = plugin.transform.call<TransformPluginContext, [string, string], TransformResult>(
    <TransformPluginContext>(<unknown>{}),
    code,
    id,
  );

  return typeof result === 'string' ? result : result!.code!;
};
