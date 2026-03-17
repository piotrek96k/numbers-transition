import type { Plugin, Rolldown } from 'vite';
import { TypeExtensionsConfig, buildConfig } from '../config/config';
import { buildHotUpdateHandler } from '../hmr/hmr';
import { buildTransformer } from '../transformer/transformer';

interface TypeExtensionsPlugin extends Plugin {
  transform: (this: Rolldown.TransformPluginContext, code: string, id: string) => Rolldown.SourceDescription | null;
}

const typeExtensions = (tsConfig: string, extensionsFilePath: string): TypeExtensionsPlugin => {
  const config: TypeExtensionsConfig = buildConfig(tsConfig, extensionsFilePath);

  return {
    name: 'type-extensions-plugin',
    enforce: 'pre',
    handleHotUpdate: buildHotUpdateHandler(tsConfig, extensionsFilePath, config),
    transform: buildTransformer(extensionsFilePath, config),
  };
};

export default typeExtensions;

export type { TypeExtensionsPlugin };
