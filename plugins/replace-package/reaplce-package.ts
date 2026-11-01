import { mkdirSync, rmSync, symlinkSync } from 'fs';
import { dirname, resolve } from 'path';
import { NodeModules } from './node-modules';
import { SymlinkType } from './symlink-type';

export const replacePackage = (args: string[]): void => {
  const [target, path] = args.map<string>((pckg: string): string => resolve(NodeModules.Dir, pckg));

  rmSync(target, { recursive: true, force: true });
  mkdirSync(dirname(target), { recursive: true });
  symlinkSync(path, target, SymlinkType.Junction);
};
