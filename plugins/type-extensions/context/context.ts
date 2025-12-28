import { AsyncLocalStorage } from 'async_hooks';
import { TypeExtension } from '../config/config';

export interface Context {
  extensionsMap: Map<string, TypeExtension>;
  constAliases: Map<string, string>;
  usedExtensions: Map<string, string>;
  isExtensionsFile: boolean;
}

const context: AsyncLocalStorage<Context> = new AsyncLocalStorage<Context>();

export const provideContext: <T, U extends unknown[]>(context: Context, callback: (...args: U) => T, ...args: U) => T =
  context.run.bind(context);

export const getContext = (): Context => context.getStore()!;
