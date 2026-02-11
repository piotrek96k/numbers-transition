import type { TransformHook } from 'rollup';
import type { Plugin } from 'vite';
import { InternalConfig, TypeExtensionsConfig, buildInternalConfig, readConfig } from '../config/config';
import { buildHotUpdateHandler } from '../hmr/hmr';
import { buildTransformer } from '../transformer/transformer';

interface TypeExtensionsPlugin extends Plugin {
  transform: TransformHook;
}

const typeExtensions = (configPath: string): TypeExtensionsPlugin => {
  const config: TypeExtensionsConfig = readConfig(configPath);
  const internalConfig: InternalConfig = buildInternalConfig(config);

  return {
    name: 'type-extensions-plugin',
    enforce: 'pre',
    handleHotUpdate: buildHotUpdateHandler(configPath, config, internalConfig),
    transform: buildTransformer(config, internalConfig),
  };
};

export default typeExtensions;

export type { TypeExtensionsPlugin };
