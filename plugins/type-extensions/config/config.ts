import { readFileSync } from 'fs';
import { resolve } from 'path';
import { cwd } from 'process';
import {
  ArrayLiteralExpression,
  CallExpression,
  ClassDeclaration,
  ClassElement,
  Expression,
  ExpressionWithTypeArguments,
  GetAccessorDeclaration,
  HeritageClause,
  Identifier,
  ImportDeclaration,
  ImportSpecifier,
  MethodDeclaration,
  ModifierLike,
  Node,
  PropertyAccessExpression,
  PropertyDeclaration,
  ReturnStatement,
  ScriptKind,
  ScriptTarget,
  SourceFile,
  Statement,
  SyntaxKind,
  createSourceFile,
  findConfigFile,
  isArrayLiteralExpression,
  isCallExpression,
  isClassDeclaration,
  isGetAccessor,
  isIdentifier,
  isMethodDeclaration,
  isNamedImports,
  isPropertyAccessExpression,
  isPropertyDeclaration,
  isReturnStatement,
  isStringLiteral,
  parseJsonConfigFileContent,
  readConfigFile,
  sys,
} from 'typescript';
import { generateAlias } from '../alias/alias';
import { ClassName } from '../enums/class-name';
import { Encoding } from '../enums/encoding';
import { LiteralType, LiteralTypeName } from '../enums/literal-type';
import { ModuleName } from '../enums/module-name';
import { StaticPropertyName } from '../enums/static-property-name';
import { VariableName } from '../enums/variable-name';
import { splitStatements } from '../imports/imports';
import { PropertyName } from './../enums/property-name';

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
  properties: Property[];
  literalTypes: LiteralType[];
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

const isLiteralTypeEnum = (
  node: Expression,
  literalTypeName: string | false | undefined,
): node is ArrayLiteralExpression | CallExpression =>
  (isArrayLiteralExpression(node) &&
    node.elements.every(
      (expression: Expression): boolean =>
        isPropertyAccessExpression(expression) && isIdentifier(expression.expression) && expression.expression.text === literalTypeName,
    )) ||
  (isCallExpression(node) &&
    isPropertyAccessExpression(node.expression) &&
    isIdentifier(node.expression.expression) &&
    node.expression.expression.text === ClassName.Object &&
    node.expression.name.text === PropertyName.Values &&
    node.arguments.length === 1 &&
    isIdentifier(node.arguments[0]) &&
    node.arguments[0].text === literalTypeName);

const isLiteralTypeEnumProperty = (
  property: MethodOrPropertyDeclaration,
  literalTypeName: string | false | undefined,
): property is IdentifierPropertyDeclaration =>
  isPropertyDeclaration(property) && !!property.initializer && isLiteralTypeEnum(property.initializer, literalTypeName);

const isLiteralTypeEnumGetter = (
  property: MethodOrPropertyDeclaration,
  literalTypeName: string | false | undefined,
): property is IdentifierGetAccessorDeclaration =>
  isGetAccessor(property) &&
  !!property.body &&
  isReturnStatement(property.body.statements[0]) &&
  !!property.body.statements[0].expression &&
  isLiteralTypeEnum(property.body.statements[0].expression, literalTypeName);

const isTypeProperty = (property: MethodOrPropertyDeclaration): boolean =>
  property.name.text === StaticPropertyName.Type &&
  isStatic(property) &&
  ((isPropertyDeclaration(property) && !!property.initializer) || (isGetAccessor(property) && !!property.body));

const isLiteralTypeProperty =
  (
    literalTypeName: string | false | undefined,
  ): ((property: MethodOrPropertyDeclaration) => property is IdentifierPropertyDeclaration | IdentifierGetAccessorDeclaration) =>
  (property: MethodOrPropertyDeclaration): property is IdentifierPropertyDeclaration | IdentifierGetAccessorDeclaration =>
    property.name.text === StaticPropertyName.LiteralType &&
    isStatic(property) &&
    !!literalTypeName &&
    (isLiteralTypeEnumProperty(property, literalTypeName) || isLiteralTypeEnumGetter(property, literalTypeName));

const isIsTypeProperty = (property: MethodOrPropertyDeclaration): boolean =>
  property.name.text === StaticPropertyName.IsType && isStatic(property);

const isInternalProperty = (property: MethodOrPropertyDeclaration, literalTypeName: string | false | undefined): boolean =>
  [isTypeProperty, isIsTypeProperty, isLiteralTypeProperty(literalTypeName)].some(
    (checker: (property: MethodOrPropertyDeclaration) => boolean): boolean => checker(property),
  );

const hasRequiredInternalProperties = ([, [{ length }]]: [
  string,
  [MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]],
]): boolean => [StaticPropertyName.Type, StaticPropertyName.LiteralType].length <= length;

const readLiteralType = (property: IdentifierPropertyDeclaration | IdentifierGetAccessorDeclaration): LiteralType[] => {
  const enumProperty: ArrayLiteralExpression | CallExpression = <ArrayLiteralExpression | CallExpression>(
    (isPropertyDeclaration(property) ? property.initializer : (<ReturnStatement>property.body!.statements[0]).expression)
  );

  return isCallExpression(enumProperty)
    ? Object.values<LiteralType>(LiteralType)
    : enumProperty.elements
        .map<string>((expression: Expression) => (<PropertyAccessExpression>expression).name.text)
        .map<LiteralType>((key: string): LiteralType => LiteralType[<keyof typeof LiteralType>key]);
};

const groupProperties =
  (
    literalTypeName: string | false | undefined,
  ): ((
    properties: [MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]],
    property: MethodOrPropertyDeclaration,
  ) => [MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]]) =>
  (
    [internalProperties, properties]: [MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]],
    property: MethodOrPropertyDeclaration,
  ): [MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]] =>
    isInternalProperty(property, literalTypeName)
      ? [[property, ...internalProperties], properties]
      : [internalProperties, [...properties, property]];

const mapClassDeclaration =
  (
    literalTypeName: string | false | undefined,
  ): ((declaration: NamedClassDeclaration) => [string, [MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]]]) =>
  ({ name: { text }, members }: NamedClassDeclaration): [string, [MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]]] => [
    text,
    members
      .filter<MethodOrPropertyDeclaration>(isMethodOrProperty)
      .reduce<[MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]]>(groupProperties(literalTypeName), [[], []]),
  ];

const mapProperty = (member: MethodOrPropertyDeclaration): Property => ({
  name: member.name.text,
  isStatic: isStatic(member),
  isProperty: isPropertyDeclaration(member),
});

const mapLiteralTypeProperty = (
  internalProperties: MethodOrPropertyDeclaration[],
  literalTypeName: string | false | undefined,
): LiteralType[] => {
  const literalType: IdentifierPropertyDeclaration | IdentifierGetAccessorDeclaration | undefined = internalProperties.find<
    IdentifierPropertyDeclaration | IdentifierGetAccessorDeclaration
  >(isLiteralTypeProperty(literalTypeName));

  return literalType ? readLiteralType(literalType) : [];
};

const mapToTypeExtensionTuple =
  (
    literalTypeName: string | false | undefined,
  ): ((tuple: [string, [MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]]]) => [string, TypeExtension]) =>
  ([id, [internalProperties, properties]]: [string, [MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]]]): [
    string,
    TypeExtension,
  ] => [
    id,
    { properties: properties.map<Property>(mapProperty), literalTypes: mapLiteralTypeProperty(internalProperties, literalTypeName) },
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

  const literalTypeName: string | false | undefined =
    extensionImport?.importClause?.namedBindings &&
    isNamedImports(extensionImport.importClause.namedBindings) &&
    extensionImport.importClause.namedBindings.elements.find(
      (element: ImportSpecifier): boolean => (element.propertyName ?? element.name).text === LiteralTypeName.Value,
    )?.name.text;

  return restSource
    .filter<NamedClassDeclaration>(isExtensionClass(extensionImport?.importClause?.name?.text))
    .map<[string, [MethodOrPropertyDeclaration[], MethodOrPropertyDeclaration[]]]>(mapClassDeclaration(literalTypeName))
    .filter(hasRequiredInternalProperties)
    .map<[string, TypeExtension]>(mapToTypeExtensionTuple(literalTypeName))
    .reduce<Map<string, TypeExtension>>(
      (map: Map<string, TypeExtension>, [id, typeExtension]: [string, TypeExtension]): Map<string, TypeExtension> =>
        map.set(id, typeExtension),
      new Map<string, TypeExtension>(),
    );
};

export const buildConstAliases = (extensionsFilePath: string): Map<string, string> =>
  new Map<string, string>(
    Object.values<VariableName>(VariableName).map<[string, string]>((value: VariableName): [string, string] => [
      value,
      generateAlias(value, extensionsFilePath),
    ]),
  );

export const buildConfig = (tsConfig: string, extensionsFilePath: string): TypeExtensionsConfig => ({
  allowedFiles: getAllowedFiles(tsConfig),
  extensionsMap: buildExtensionsMap(extensionsFilePath),
  constAliases: buildConstAliases(extensionsFilePath),
});
