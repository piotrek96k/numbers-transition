import { readFileSync } from 'fs';
import { resolve } from 'path';
import { cwd } from 'process';
import {
  ClassDeclaration,
  ClassElement,
  GetAccessorDeclaration,
  Identifier,
  MethodDeclaration,
  ModifierLike,
  Node,
  PropertyDeclaration,
  ScriptKind,
  ScriptTarget,
  SyntaxKind,
  createSourceFile,
  findConfigFile,
  isClassDeclaration,
  isGetAccessor,
  isIdentifier,
  isMethodDeclaration,
  isPropertyDeclaration,
  parseJsonConfigFileContent,
  readConfigFile,
  sys,
} from 'typescript';
import { generateAlias } from '../alias/alias';
import { ConstName } from '../enums/const-name';
import { Encoding } from '../enums/encoding';

interface NamedClassDeclaration extends ClassDeclaration {
  name: Identifier;
}

interface IdentifierMethodDeclaration extends MethodDeclaration {
  name: Identifier;
}

interface IdentifierPropertyDeclaration extends PropertyDeclaration {
  name: Identifier;
}

interface IdentifierGetAccessorDeclaration extends GetAccessorDeclaration {
  name: Identifier;
}

type MethodOrPropertyDeclaration = IdentifierMethodDeclaration | IdentifierPropertyDeclaration | IdentifierGetAccessorDeclaration;

export interface Property {
  name: string;
  isStatic: boolean;
  isProperty: boolean;
}

interface Extension {
  type: string;
  typeCheck: string;
}

export interface TypeExtension extends Extension {
  properties: Property[];
}

export interface InternalConfig {
  allowedFiles: Set<string>;
  extensionsMap: Map<string, TypeExtension>;
  constAliases: Map<string, string>;
}

export interface TypeExtensionsConfig {
  tsConfig: string;
  extensionsFilePath: string;
  extensions: Record<string, Extension>;
}

const isExported = ({ modifiers }: ClassDeclaration): boolean =>
  !!modifiers?.some(({ kind }: ModifierLike): boolean => kind === SyntaxKind.ExportKeyword);

const isPublic = ({ modifiers }: PropertyDeclaration | MethodDeclaration | GetAccessorDeclaration): boolean =>
  !modifiers?.some(({ kind }: ModifierLike): boolean => [SyntaxKind.PrivateKeyword, SyntaxKind.ProtectedKeyword].includes(kind));

const isClass = (node: Node): node is NamedClassDeclaration => isClassDeclaration(node) && !!node.name && isExported(node);

const isMethodOrProperty = (member: ClassElement): member is MethodOrPropertyDeclaration =>
  (isMethodDeclaration(member) || isPropertyDeclaration(member) || isGetAccessor(member)) && isIdentifier(member.name) && isPublic(member);

export const getAllowedFiles = (tsConfig: string): Set<string> =>
  new Set<string>(
    parseJsonConfigFileContent(
      readConfigFile(findConfigFile(cwd(), sys.fileExists, tsConfig)!, sys.readFile).config,
      sys,
      cwd(),
    ).fileNames.map<string>((file: string): string => resolve(file)),
  );

const mapProperty = (member: MethodOrPropertyDeclaration): Property => ({
  name: member.name.text,
  isStatic: !!member.modifiers?.some(({ kind }: ModifierLike): boolean => kind === SyntaxKind.StaticKeyword),
  isProperty: isPropertyDeclaration(member),
});

const buildExtensionsMap = (extensionsFilePath: string, extensions: Record<string, Extension>): Map<string, TypeExtension> =>
  createSourceFile(
    resolve(extensionsFilePath),
    readFileSync(resolve(extensionsFilePath), Encoding.Utf8),
    ScriptTarget.ESNext,
    true,
    ScriptKind.TS,
  )
    .statements.filter<NamedClassDeclaration>(isClass)
    .map<[string, Property[]]>(({ name: { text }, members }: NamedClassDeclaration): [string, Property[]] => [
      text,
      members.filter<MethodOrPropertyDeclaration>(isMethodOrProperty).map<Property>(mapProperty),
    ])
    .filter(([className]: [string, Property[]]): boolean => Object.keys(extensions).includes(className))
    .reduce<Map<string, TypeExtension>>(
      (map: Map<string, TypeExtension>, [className, properties]: [string, Property[]]): Map<string, TypeExtension> =>
        map.set(className, { type: extensions[className].type, typeCheck: extensions[className].typeCheck, properties }),
      new Map<string, TypeExtension>(),
    );

export const readConfig = (configPath: string): TypeExtensionsConfig => JSON.parse(readFileSync(resolve(configPath), Encoding.Utf8));

export const buildInternalConfig = ({ tsConfig, extensionsFilePath, extensions }: TypeExtensionsConfig): InternalConfig => ({
  allowedFiles: getAllowedFiles(tsConfig),
  extensionsMap: buildExtensionsMap(extensionsFilePath, extensions),
  constAliases: new Map<string, string>(
    Object.values<ConstName>(ConstName).map<[string, string]>((value: ConstName): [string, string] => [
      value,
      generateAlias(value, extensionsFilePath),
    ]),
  ),
});
