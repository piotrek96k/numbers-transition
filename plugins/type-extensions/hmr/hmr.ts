import { resolve } from 'path';
import { HmrContext } from 'vite';
import { InternalConfig, TypeExtensionsConfig, buildInternalConfig, getAllowedFiles, readConfig } from '../config/config';

export const buildHotUpdateHandler =
  (configPath: string, config: TypeExtensionsConfig, internalConfig: InternalConfig): ((context: HmrContext) => void) =>
  ({ file, server }: HmrContext): void => {
    switch (resolve(file)) {
      case resolve(configPath):
        return (
          Object.assign<TypeExtensionsConfig, TypeExtensionsConfig>(config, readConfig(configPath)) &&
          Object.assign<InternalConfig, InternalConfig>(internalConfig, buildInternalConfig(config)) &&
          server.moduleGraph.invalidateAll()
        );
      case resolve(config.extensionsFilePath):
        return (
          Object.assign<InternalConfig, InternalConfig>(internalConfig, buildInternalConfig(config)) && server.moduleGraph.invalidateAll()
        );
      default:
        Object.assign<InternalConfig, Partial<InternalConfig>>(internalConfig, { allowedFiles: getAllowedFiles(config.tsConfig) });
    }
  };
