/* eslint-disable no-fallthrough */
import { resolve } from 'path';
import { HmrContext } from 'vite';
import { InternalConfig, TypeExtensionsConfig, buildConstAliases, buildExtensionsMap, getAllowedFiles, readConfig } from '../config/config';

export const buildHotUpdateHandler =
  (configPath: string, config: TypeExtensionsConfig, internalConfig: InternalConfig): ((context: HmrContext) => void) =>
  ({ file, server }: HmrContext): void => {
    switch (resolve(file)) {
      case resolve(configPath):
        Object.assign<TypeExtensionsConfig, TypeExtensionsConfig>(config, readConfig(configPath));
      case resolve(config.extensionsFilePath):
        Object.assign<InternalConfig, Partial<InternalConfig>>(internalConfig, {
          extensionsMap: buildExtensionsMap(config.extensionsFilePath, config.extensions),
          constAliases: buildConstAliases(config.extensionsFilePath),
        });
        server.moduleGraph.invalidateAll();
      default:
        Object.assign<InternalConfig, Partial<InternalConfig>>(internalConfig, { allowedFiles: getAllowedFiles(config.tsConfig) });
    }
  };
