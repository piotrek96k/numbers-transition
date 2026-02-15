/* eslint-disable no-fallthrough */
import { resolve } from 'path';
import { HmrContext } from 'vite';
import { TypeExtensionsConfig, buildConstAliases, buildExtensionsMap, getAllowedFiles } from '../config/config';

export const buildHotUpdateHandler =
  (tsConfig: string, extensionsFilePath: string, config: TypeExtensionsConfig): ((context: HmrContext) => void) =>
  ({ file, server }: HmrContext): void => {
    switch (resolve(file)) {
      case resolve(extensionsFilePath):
        Object.assign<TypeExtensionsConfig, Partial<TypeExtensionsConfig>>(config, {
          extensionsMap: buildExtensionsMap(extensionsFilePath),
          constAliases: buildConstAliases(extensionsFilePath),
        });
        server.moduleGraph.invalidateAll();
      default:
        Object.assign<TypeExtensionsConfig, Partial<TypeExtensionsConfig>>(config, { allowedFiles: getAllowedFiles(tsConfig) });
    }
  };
