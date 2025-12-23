import { dirname, relative } from 'path';
import {
  ImportDeclaration,
  ImportSpecifier,
  NamedImportBindings,
  NamedImports,
  Node,
  factory,
  isNamedImports,
  isStringLiteral,
} from 'typescript';
import { generateAlias } from '../alias/alias';

export const getExtensionsImportPath = (id: string, extensionsFilePath: string): string =>
  relative(dirname(id), extensionsFilePath)
    .replace(/\\/g, '/')
    .replace(/^(?!\.{1,2}\/)(\/?)/, './')
    .replace(/\.[a-z]+$/, '');

export const splitImports = (imports: ImportDeclaration[], importPath: string): [ImportDeclaration[], ImportDeclaration[]] =>
  imports.reduce<[ImportDeclaration[], ImportDeclaration[]]>(
    (
      [extensionImport, restImports]: [ImportDeclaration[], ImportDeclaration[]],
      importDeclaration: ImportDeclaration,
    ): [ImportDeclaration[], ImportDeclaration[]] =>
      isStringLiteral(importDeclaration.moduleSpecifier) && importDeclaration.moduleSpecifier.text === importPath
        ? [[importDeclaration], restImports]
        : [extensionImport, [...restImports, importDeclaration]],
    [[], []],
  );

export const readUsedExtensions = (extensionImport: ImportDeclaration[]): Map<string, string> =>
  extensionImport
    .map<NamedImportBindings | undefined>(
      ({ importClause }: ImportDeclaration): NamedImportBindings | undefined => importClause?.namedBindings,
    )
    .filter<NamedImports>((bindings: NamedImportBindings | undefined): bindings is NamedImports => !!bindings && isNamedImports(bindings))
    .map<[string, string][]>(({ elements }: NamedImports): [string, string][] =>
      elements.map<[string, string]>(({ propertyName, name }: ImportSpecifier): [string, string] => [
        propertyName?.text ?? name.text,
        name.text,
      ]),
    )
    .flat<[string, string][][], 1>()
    .reduce<Map<string, string>>(
      (map: Map<string, string>, [key, value]: [string, string]): Map<string, string> => map.set(key, value),
      new Map<string, string>(),
    );

const mapExtensionImport = ([original, local]: [string, string]): ImportSpecifier =>
  factory.createImportSpecifier(
    false,
    original === local ? undefined : factory.createIdentifier(original),
    factory.createIdentifier(local),
  );

export const buildExtensionsImport = (importPath: string, usedExtensions: Map<string, string>): ImportDeclaration =>
  factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      undefined,
      undefined,
      factory.createNamedImports([...usedExtensions].map<ImportSpecifier>(mapExtensionImport)),
    ),
    factory.createStringLiteral(importPath),
  );

export const readImportName = (importName: string, usedExtensions: Map<string, string>, isExtensionsFile: boolean, node: Node): string =>
  usedExtensions.get(importName) ??
  (usedExtensions.set(importName, isExtensionsFile ? importName : generateAlias(importName, node)) && usedExtensions.get(importName)!);
