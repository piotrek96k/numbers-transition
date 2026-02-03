import type { Plugin } from 'vite';
import { InternalConfig, TypeExtensionsConfig, buildInternalConfig, readConfig } from '../config/config';
import { buildHotUpdateHandler } from '../hmr/hmr';
import { buildTransformer } from '../transformer/transformer';

const typeExtensions = (configPath: string): Plugin => {
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
