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
import { getContext } from '../context/context';
import { readImportName } from '../imports/imports';
import { isLiteralExpression } from '../literals/literal-expressions';
import { buildProxyFunctionCall } from '../runtime/proxy';
import { buildWrapCall } from '../runtime/wrap';

const isStaticProperty =
  (expression: Expression, propertyName: string): ((entry: [string, TypeExtension]) => boolean) =>
  ([id, { properties }]: [string, TypeExtension]): boolean =>
    isIdentifier(expression) &&
    id === expression.text &&
    properties.some(({ name, isStatic }: Property): boolean => name === propertyName && isStatic);

const isObjectProperty =
  (propertyName: string): ((entry: [string, TypeExtension]) => boolean) =>
  ([, { properties }]: [string, TypeExtension]): boolean =>
    properties.some(({ name, isStatic }: Property): boolean => name === propertyName && !isStatic);

const buildStaticPropertyAccess = ({ expression, name: { text } }: PropertyAccessExpression): (() => Node)[] =>
  [...getContext().extensionsMap]
    .filter(isStaticProperty(expression, text))
    .map<string>(([, { implementationClass }]: [string, TypeExtension]): string => readImportName(implementationClass, expression))
    .map<() => Node>(
      (className: string): (() => Node) =>
        (): Node =>
          factory.createPropertyAccessExpression(factory.createIdentifier(className), text),
    );

const buildLiteralPropertyAccess = (
  extensions: [string, TypeExtension][],
  { expression, name: { text } }: PropertyAccessExpression,
): Node | undefined =>
  extensions
    .filter(isLiteralExpression(expression))
    .map<Node>(
      ([id]: [string, TypeExtension]): Node =>
        factory.createPropertyAccessExpression(
          buildWrapCall(
            expression,
            factory.createArrayLiteralExpression([factory.createStringLiteral(id)]),
            factory.createStringLiteral(text),
          ),
          text,
        ),
    )
    .pop();

const buildPropertyAccess = (access: PropertyAccessExpression): (() => Node)[] =>
  [[...getContext().extensionsMap].filter(isObjectProperty(access.name.text))]
    .filter(({ length }: [string, TypeExtension][]): unknown => length)
    .map<() => Node>(
      (extensions: [string, TypeExtension][]): (() => Node) =>
        (): Node =>
          buildLiteralPropertyAccess(extensions, access) ??
          factory.createPropertyAccessChain(
            buildProxyFunctionCall(access.expression, extensions, access.name.text),
            isPropertyAccessChain(access) ? factory.createToken(SyntaxKind.QuestionDotToken) : undefined,
            access.name.text,
          ),
    );

export const buildPropertyAccessExpressions = (node: Node): (() => Node)[] =>
  isPropertyAccessExpression(node)
    ? [buildStaticPropertyAccess, buildPropertyAccess].flatMap<() => Node>(
        (builder: (node: PropertyAccessExpression) => (() => Node)[]): (() => Node)[] => builder(node),
      )
    : [];
