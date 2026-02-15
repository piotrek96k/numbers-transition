import { readFileSync } from 'fs';
import { resolve } from 'path';
import { cwd } from 'process';
import {
  ClassDeclaration,
  ClassElement,
  ExpressionWithTypeArguments,
  GetAccessorDeclaration,
  HeritageClause,
  Identifier,
  ImportDeclaration,
  MethodDeclaration,
  ModifierLike,
  Node,
  PropertyDeclaration,
  ReturnStatement,
  ScriptKind,
  ScriptTarget,
  SourceFile,
  Statement,
  StringLiteralLike,
  SyntaxKind,
  createSourceFile,
  findConfigFile,
  isClassDeclaration,
  isGetAccessor,
  isIdentifier,
  isMethodDeclaration,
  isPropertyDeclaration,
  isReturnStatement,
  isStringLiteral,
  isStringLiteralLike,
  parseJsonConfigFileContent,
  readConfigFile,
  sys,
} from 'typescript';
import { generateAlias } from '../alias/alias';
import { ConstName } from '../enums/const-name';
import { Encoding } from '../enums/encoding';
import { splitStatements } from '../imports/imports';
import { ModuleName } from '../enums/module-name';
import { InternalPropertyName } from '../enums/internal-property-name';

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

export interface TypeExtension {
  implementationClass: string;
  properties: Property[];
}

export interface TypeExtensionsConfig {
  allowedFiles: Set<string>;
  extensionsMap: Map<string, TypeExtension>;
  constAliases: Map<string, string>;
}

const isExported = ({ modifiers }: ClassDeclaration): boolean =>
  !!modifiers?.some(({ kind }: ModifierLike): boolean => kind === SyntaxKind.ExportKeyword);

const isPublic = ({ modifiers }: PropertyDeclaration | MethodDeclaration | GetAccessorDeclaration): boolean =>
  !modifiers?.some(({ kind }: ModifierLike): boolean => [SyntaxKind.PrivateKeyword, SyntaxKind.ProtectedKeyword].includes(kind));

const isStatic = ({ modifiers }: MethodOrPropertyDeclaration): boolean =>
  !!modifiers?.some(({ kind }: ModifierLike): boolean => kind === SyntaxKind.StaticKeyword);

const extendsClass = (node: ClassDeclaration, extensionClassName: string): boolean =>
  !!node.heritageClauses?.some(
    ({ token, types }: HeritageClause): boolean =>
      token === SyntaxKind.ExtendsKeyword &&
      types.some(
        ({ expression }: ExpressionWithTypeArguments): boolean => isIdentifier(expression) && expression.text === extensionClassName,
      ),
  );

const isExtensionClass =
  (extensionClassName: string | undefined): ((node: Node) => node is NamedClassDeclaration) =>
  (node: Node): node is NamedClassDeclaration =>
    isClassDeclaration(node) && !!node.name && isExported(node) && !!extensionClassName && extendsClass(node, extensionClassName);

const isMethodOrProperty = (member: ClassElement): member is MethodOrPropertyDeclaration =>
  (isMethodDeclaration(member) || isPropertyDeclaration(member) || isGetAccessor(member)) && isIdentifier(member.name) && isPublic(member);

const isStringLiteralProperty = (property: MethodOrPropertyDeclaration): property is IdentifierPropertyDeclaration =>
  isPropertyDeclaration(property) && !!property.initializer && isStringLiteralLike(property.initializer);

const isStringLiteralGetter = (property: MethodOrPropertyDeclaration): property is IdentifierGetAccessorDeclaration =>
  isGetAccessor(property) &&
  !!property.body &&
  isReturnStatement(property.body.statements[0]) &&
  !!property.body.statements[0].expression &&
  isStringLiteralLike(property.body.statements[0].expression);

const isIdProperty = (
  property: MethodOrPropertyDeclaration,
): property is IdentifierPropertyDeclaration | IdentifierGetAccessorDeclaration =>
  property.name.text === InternalPropertyName.Id &&
  isStatic(property) &&
  (isStringLiteralProperty(property) || isStringLiteralGetter(property));

const isTypeProperty = (property: MethodOrPropertyDeclaration): boolean =>
  property.name.text === InternalPropertyName.Type &&
  isStatic(property) &&
  ((isPropertyDeclaration(property) && !!property.initializer) || (isGetAccessor(property) && !!property.body));

const isIsTypeProperty = (property: MethodOrPropertyDeclaration): boolean =>
  property.name.text === InternalPropertyName.IsType && isStatic(property);

const isInternalProperty = (property: MethodOrPropertyDeclaration): boolean =>
  [isIdProperty, isTypeProperty, isIsTypeProperty].some((checker: (property: MethodOrPropertyDeclaration) => boolean): boolean =>
    checker(property),
  );

const hasAllInternalProperties = ([, [{ length }]]: [string, [MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]]]): boolean =>
  Object.values(InternalPropertyName).length === length;

const readId = (property: IdentifierPropertyDeclaration | IdentifierGetAccessorDeclaration): string =>
  isPropertyDeclaration(property)
    ? (<StringLiteralLike>property.initializer).text
    : (<StringLiteralLike>(<ReturnStatement>property.body!.statements[0]).expression).text;

const groupProperties = (
  [internalProperties, properties]: [MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]],
  property: MethodOrPropertyDeclaration,
): [MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]] =>
  isInternalProperty(property) ? [[property, ...internalProperties], properties] : [internalProperties, [...properties, property]];

const mapClassDeclaration = ({
  name: { text },
  members,
}: NamedClassDeclaration): [string, [MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]]] => [
  text,
  members
    .filter<MethodOrPropertyDeclaration>(isMethodOrProperty)
    .reduce<[MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]]>(groupProperties, [[], []]),
];

const mapProperty = (member: MethodOrPropertyDeclaration): Property => ({
  name: member.name.text,
  isStatic: isStatic(member),
  isProperty: isPropertyDeclaration(member),
});

const mapToTypeExtensionTuple = ([implementationClass, [internalProperties, properties]]: [
  string,
  [MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]],
]): [string, TypeExtension] => [
  readId(internalProperties.find<IdentifierPropertyDeclaration | IdentifierGetAccessorDeclaration>(isIdProperty)!),
  { implementationClass, properties: properties.map<Property>(mapProperty) },
];

export const getAllowedFiles = (tsConfig: string): Set<string> =>
  new Set<string>(
    parseJsonConfigFileContent(
      readConfigFile(findConfigFile(cwd(), sys.fileExists, tsConfig)!, sys.readFile).config,
      sys,
      cwd(),
    ).fileNames.map<string>((file: string): string => resolve(file)),
  );

export const buildExtensionsMap = (extensionsFilePath: string): Map<string, TypeExtension> => {
  const sourceFile: SourceFile = createSourceFile(
    resolve(extensionsFilePath),
    readFileSync(resolve(extensionsFilePath), Encoding.Utf8),
    ScriptTarget.ESNext,
    true,
    ScriptKind.TS,
  );

  const [imports, restSource]: [ImportDeclaration[], Statement[]] = splitStatements(sourceFile.statements);

  const extensionImport: ImportDeclaration | undefined = imports.find(
    (importDeclaration: ImportDeclaration): boolean =>
      isStringLiteral(importDeclaration.moduleSpecifier) && importDeclaration.moduleSpecifier.text === ModuleName.Extension,
  );

  return restSource
    .filter<NamedClassDeclaration>(isExtensionClass(extensionImport?.importClause?.name?.text))
    .map<[string, [MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]]]>(mapClassDeclaration)
    .filter(hasAllInternalProperties)
    .map<[string, TypeExtension]>(mapToTypeExtensionTuple)
    .reduce<Map<string, TypeExtension>>(
      (map: Map<string, TypeExtension>, [id, typeExtension]: [string, TypeExtension]): Map<string, TypeExtension> =>
        map.set(id, typeExtension),
      new Map<string, TypeExtension>(),
    );
};

export const buildConstAliases = (extensionsFilePath: string): Map<string, string> =>
  new Map<string, string>(
    Object.values<ConstName>(ConstName).map<[string, string]>((value: ConstName): [string, string] => [
      value,
      generateAlias(value, extensionsFilePath),
    ]),
  );

export const buildConfig = (tsConfig: string, extensionsFilePath: string): TypeExtensionsConfig => ({
  allowedFiles: getAllowedFiles(tsConfig),
  extensionsMap: buildExtensionsMap(extensionsFilePath),
  constAliases: buildConstAliases(extensionsFilePath),
});
