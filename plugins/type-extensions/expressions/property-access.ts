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

const buildPropertyAccessStaticExpression = ({ expression, name: { text } }: PropertyAccessExpression): (() => Node)[] =>
  [...getContext().extensionsMap]
    .filter(isStaticProperty(expression, text))
    .map<string>(([className]: [string, TypeExtension]): string => readImportName(className, expression))
    .map<() => Node>(
      (className: string): (() => Node) =>
        (): Node =>
          factory.createPropertyAccessExpression(factory.createIdentifier(className), text),
    );

const buildPropertyAccessLiteralExpression = (
  extensions: [string, TypeExtension][],
  { expression, name: { text } }: PropertyAccessExpression,
): Node | undefined =>
  extensions
    .filter(isLiteralExpression(expression))
    .map<string>(([className]: [string, TypeExtension]): string => readImportName(className, expression))
    .map<Node>(
      (className: string): Node =>
        factory.createPropertyAccessExpression(
          factory.createNewExpression(factory.createIdentifier(className), undefined, [expression]),
          text,
        ),
    )
    .pop();

const buildPropertyAccessExpression = (access: PropertyAccessExpression): (() => Node)[] =>
  [[...getContext().extensionsMap].filter(isObjectProperty(access.name.text))]
    .filter(({ length }: [string, TypeExtension][]): unknown => length)
    .map<() => Node>(
      (extensions: [string, TypeExtension][]): (() => Node) =>
        (): Node =>
          buildPropertyAccessLiteralExpression(extensions, access) ??
          factory.createPropertyAccessChain(
            buildProxyCallExpression(extensions, access.expression, false),
            isPropertyAccessChain(access) ? factory.createToken(SyntaxKind.QuestionDotToken) : undefined,
            access.name.text,
          ),
    );

export const buildPropertyAccessExpressions = (node: Node): (() => Node)[] =>
  isPropertyAccessExpression(node)
    ? [buildPropertyAccessStaticExpression, buildPropertyAccessExpression].flatMap<() => Node>(
        (builder: (node: PropertyAccessExpression) => (() => Node)[]): (() => Node)[] => builder(node),
      )
    : [];
