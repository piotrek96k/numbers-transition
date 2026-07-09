import type { CompilerOptions } from 'typescript';
import { execSync } from 'child_process';
import { Dirent, cpSync, existsSync, mkdtempSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'fs';
import { basename, relative, resolve } from 'path';

interface TsConfig {
  extends: string;
  compilerOptions: CompilerOptions;
  include: string[];
  exclude: string[];
}

const filterDts = (src: string): boolean => statSync(src).isDirectory() || src.endsWith('.d.ts');

const renameDts = (dir: string): void =>
  readdirSync(dir, { withFileTypes: true })
    .map<[Dirent<string>, string]>((entry: Dirent<string>): [Dirent<string>, string] => [entry, resolve(dir, entry.name)])
    .forEach(([entry, path]: [Dirent<string>, string]): void =>
      entry.isDirectory() ? renameDts(path) : renameSync(path, path.replace('.d.ts', '.ts')),
    );

const verifyValidDts = (absoluteTsConfig: string, dir: string, absoluteDir: string, tsArgs: string[]): void => {
  process.stdout.write(`\n[verify:dts] Verifying declarations in '${dir}'...\n`);
  const tempDir: string = mkdtempSync(resolve('verify'));
  const generatedTsConfig: string = resolve(tempDir, 'tsconfig.json');

  const config: TsConfig = {
    extends: relative(tempDir, absoluteTsConfig),
    compilerOptions: { rootDir: '.', isolatedModules: false, noEmit: true, plugins: [] },
    include: ['.'],
    exclude: [],
  };

  try {
    cpSync(absoluteDir, tempDir, { recursive: true, filter: filterDts });
    renameDts(tempDir);
    writeFileSync(generatedTsConfig, JSON.stringify(config, null, 2));
    execSync(`tsc -p "${generatedTsConfig}" ${tsArgs.join(' ')}`, { env: { ...process.env, FORCE_COLOR: '1' } });
    process.stdout.write(`[verify:dts] ✓ Declaration verification passed for '${dir}'.\n`);
  } catch (error: any) {
    process.stdout.write((error.stdout?.toString() ?? '').replaceAll(basename(tempDir), dir).replaceAll('.ts', '.d.ts'));
    process.exitCode = error.status ?? 1;
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
};

export const verifyDts = ([tsConfig, dir, ...tsArgs]: string[]): void => {
  const [absoluteTsConfig, absoluteDir]: string[] = [tsConfig, dir].map<string>((path: string): string => resolve(path));

  const tsConfigExists: boolean = existsSync(absoluteTsConfig) && statSync(absoluteTsConfig).isFile();
  const dirExists: boolean = existsSync(absoluteDir) && statSync(absoluteDir).isDirectory();
  const isValid: boolean = tsConfigExists && dirExists;

  return isValid ? verifyValidDts(absoluteTsConfig, dir, absoluteDir, tsArgs) : undefined;
};
