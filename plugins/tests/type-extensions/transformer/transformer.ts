import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { Rolldown } from 'vite';
import typeExtensions, { TypeExtensionsPlugin } from 'type-extensions/plugin';

export const transformer = (
  extensionsFilePath: string = resolve(dirname(dirname(fileURLToPath(import.meta.url))), 'extensions', 'extensions.ts'),
): ((code: string, id?: string) => string) => {
  const plugin: TypeExtensionsPlugin = typeExtensions('tsconfig.plugins.test.json', extensionsFilePath);

  return (code: string, id: string = fileURLToPath(import.meta.url)): string =>
    plugin.transform.call<Rolldown.TransformPluginContext, [string, string], Rolldown.SourceDescription | null>(
      <Rolldown.TransformPluginContext>{},
      code,
      id,
    )?.code ?? '';
};
