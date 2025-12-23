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
  isImportDeclaration,
  visitEachChild,
} from 'typescript';
import { InternalConfig, TypeExtension, TypeExtensionsConfig } from '../config/config';
import { buildExtensionsImport, getExtensionsImportPath, readUsedExtensions, splitImports } from '../imports/imports';
import { generateRuntimeProxies } from '../proxy/runtime-proxy';
import { buildVisitor } from '../visitor/visitor';

const transformCode = (
  extensionsFilePath: string,
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  code: string,
  id: string,
): TransformResult => {
  const importPath: string = getExtensionsImportPath(id, extensionsFilePath);
  const sourceFile: SourceFile = createSourceFile(id, code, ScriptTarget.ESNext, true);

  const [imports, restSource]: [ImportDeclaration[], Statement[]] = sourceFile.statements.reduce<[ImportDeclaration[], Statement[]]>(
    ([imports, restSource]: [ImportDeclaration[], Statement[]], statement: Statement): [ImportDeclaration[], Statement[]] =>
      isImportDeclaration(statement) ? [[...imports, statement], restSource] : [imports, [...restSource, statement]],
    [[], []],
  );

  const [extensionImport, restImports]: [ImportDeclaration[], ImportDeclaration[]] = splitImports(imports, importPath);
  const usedExtensions: Map<string, string> = readUsedExtensions(extensionImport);
  const isExtensionsFile: boolean = resolve(id) === resolve(extensionsFilePath);

  const { statements }: SourceFile = visitEachChild<SourceFile>(
    factory.createSourceFile(restSource, factory.createToken(SyntaxKind.EndOfFileToken), NodeFlags.None),
    buildVisitor(extensionsMap, constAliases, usedExtensions, isExtensionsFile),
    undefined,
  );

  return {
    code: createPrinter({ newLine: NewLineKind.LineFeed }).printFile(
      factory.updateSourceFile(sourceFile, [
        ...restImports,
        ...(isExtensionsFile ? [] : [buildExtensionsImport(importPath, usedExtensions)]),
        ...statements,
        ...(isExtensionsFile ? generateRuntimeProxies(extensionsMap, constAliases) : []),
      ]),
    ),
  };
};

export const buildTransformer =
  (config: TypeExtensionsConfig, internalConfig: InternalConfig): TransformHook =>
  (originalCode: string, id: string): TransformResult =>
    internalConfig.allowedFiles.has(resolve(id))
      ? transformCode(config.extensionsFilePath, internalConfig.extensionsMap, internalConfig.constAliases, originalCode, id)
      : null;
