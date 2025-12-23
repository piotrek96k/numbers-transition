import {
  Expression,
  Node,
  PropertyAccessExpression,
  SyntaxKind,
  factory,
  isIdentifier,
  isPropertyAccessChain,
  isPropertyAccessExpression,
} from 'typescript';
import { Property, TypeExtension } from '../config/config';
import { readImportName } from '../imports/imports';
import { isLiteralExpression } from '../literals/literal-expressions';
import { buildProxyCallExpression } from '../proxy/runtime-proxy';

const isStaticProperty =
  (expression: Expression, propertyName: string): ((entry: [string, TypeExtension]) => boolean) =>
  ([, { type, properties }]: [string, TypeExtension]): boolean =>
    isIdentifier(expression) &&
    type === expression.text &&
    properties.some(({ name, isStatic }: Property): boolean => name === propertyName && isStatic);

const isObjectProperty =
  (propertyName: string): ((entry: [string, TypeExtension]) => boolean) =>
  ([, { properties }]: [string, TypeExtension]): boolean =>
    properties.some(({ name, isStatic }: Property): boolean => name === propertyName && !isStatic);

const buildPropertyAccessStaticExpression = (
  extensionsMap: Map<string, TypeExtension>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  { expression, name: { text } }: PropertyAccessExpression,
): (() => Node)[] =>
  [...extensionsMap]
    .filter(isStaticProperty(expression, text))
    .map<string>(([className]: [string, TypeExtension]): string => readImportName(className, usedExtensions, isExtensionsFile, expression))
    .map<() => Node>(
      (className: string): (() => Node) =>
        (): Node =>
          factory.createPropertyAccessExpression(factory.createIdentifier(className), text),
    );

const buildPropertyAccessLiteralExpression = (
  extensions: [string, TypeExtension][],
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  { expression, name: { text } }: PropertyAccessExpression,
): Node | undefined =>
  extensions
    .filter(isLiteralExpression(expression))
    .map<string>(([className]: [string, TypeExtension]): string => readImportName(className, usedExtensions, isExtensionsFile, expression))
    .map<Node>(
      (className: string): Node =>
        factory.createPropertyAccessExpression(
          factory.createNewExpression(factory.createIdentifier(className), undefined, [expression]),
          text,
        ),
    )
    .pop();

const buildPropertyAccessExpression = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  access: PropertyAccessExpression,
): (() => Node)[] =>
  [[...extensionsMap].filter(isObjectProperty(access.name.text))]
    .filter(({ length }: [string, TypeExtension][]): unknown => length)
    .map<() => Node>(
      (extensions: [string, TypeExtension][]): (() => Node) =>
        (): Node =>
          buildPropertyAccessLiteralExpression(extensions, usedExtensions, isExtensionsFile, access) ??
          factory.createPropertyAccessChain(
            buildProxyCallExpression(extensions, constAliases, usedExtensions, isExtensionsFile, access.expression, false),
            isPropertyAccessChain(access) ? factory.createToken(SyntaxKind.QuestionDotToken) : undefined,
            access.name.text,
          ),
    );

export const buildPropertyAccessExpressions = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  node: Node,
): (() => Node)[] =>
  isPropertyAccessExpression(node)
    ? [
        ...buildPropertyAccessStaticExpression(extensionsMap, usedExtensions, isExtensionsFile, node),
        ...buildPropertyAccessExpression(extensionsMap, constAliases, usedExtensions, isExtensionsFile, node),
      ]
    : [];
