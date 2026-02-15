import { resolve } from 'path';
import type { TransformHook, TransformResult } from 'rollup';
import {
  ImportDeclaration,
  NewLineKind,
  NodeFlags,
  ScriptTarget,
  SourceFile,
  Statement,
  SyntaxKind,
  createPrinter,
  createSourceFile,
  factory,
  visitEachChild,
} from 'typescript';
import { TypeExtension, TypeExtensionsConfig } from '../config/config';
import { Context, getContext, provideContext } from '../context/context';
import { buildExtensionsImport, getExtensionsImportPath, readUsedExtensions, splitImports, splitStatements } from '../imports/imports';
import { injectRuntimeProxies } from '../runtime/runtime';
import { buildVisitor } from '../visitor/visitor';

const buildNewCode = (sourceFile: SourceFile, source: Statement[], importPath: string, imports: ImportDeclaration[]): string => {
  const { isExtensionsFile }: Context = getContext();

  const { statements }: SourceFile = visitEachChild<SourceFile>(
    factory.createSourceFile(source, factory.createToken(SyntaxKind.EndOfFileToken), NodeFlags.None),
    buildVisitor(),
    undefined,
  );

  return createPrinter({ newLine: NewLineKind.LineFeed }).printFile(
    factory.updateSourceFile(sourceFile, [
      ...imports,
      ...(isExtensionsFile ? [] : [buildExtensionsImport(importPath)]),
      ...(isExtensionsFile ? injectRuntimeProxies(statements) : statements),
    ]),
  );
};

const transformCode = (
  extensionsFilePath: string,
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  code: string,
  id: string,
): TransformResult => {
  const importPath: string = getExtensionsImportPath(id, extensionsFilePath);
  const sourceFile: SourceFile = createSourceFile(id, code, ScriptTarget.ESNext, true);

  const [imports, restSource]: [ImportDeclaration[], Statement[]] = splitStatements(sourceFile.statements);

  const [extensionImport, restImports]: [ImportDeclaration[], ImportDeclaration[]] = splitImports(imports, importPath);
  const usedExtensions: Map<string, string> = readUsedExtensions(extensionImport);
  const isExtensionsFile: boolean = resolve(id) === resolve(extensionsFilePath);

  const newCode: string = provideContext(
    { extensionsMap, constAliases, usedExtensions, isExtensionsFile },
    buildNewCode,
    sourceFile,
    restSource,
    importPath,
    restImports,
  );

  return { code: newCode, map: { mappings: '' } };
};

export const buildTransformer =
  (extensionsFilePath: string, config: TypeExtensionsConfig): TransformHook =>
  (originalCode: string, id: string): TransformResult =>
    config.allowedFiles.has(resolve(id))
      ? transformCode(extensionsFilePath, config.extensionsMap, config.constAliases, originalCode, id)
      : null;
