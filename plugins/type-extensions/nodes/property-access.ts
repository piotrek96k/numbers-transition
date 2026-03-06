import { Node, PropertyAccessExpression, SyntaxKind, factory, isPropertyAccessChain, isPropertyAccessExpression } from 'typescript';
import { Property, TypeExtension } from '../config/config';
import { getContext } from '../context/context';
import { isLiteralExpression } from '../literals/literal-expressions';
import { buildProxyFunctionCall } from '../runtime/proxy';
import { RuntimeExtension } from '../runtime/types';
import { buildWrapCall } from '../runtime/wrap';

const filterPropertyAccess =
  (propertyName: string): ((entry: [string, TypeExtension]) => RuntimeExtension[]) =>
  ([id, { properties }]: [string, TypeExtension]): RuntimeExtension[] =>
    properties
      .filter(({ name }: Property): boolean => name === propertyName)
      .map<RuntimeExtension>(({ isStatic }: Property): RuntimeExtension => ({ id, isStatic }));

const buildLiteralPropertyAccess = (
  extensions: RuntimeExtension[],
  { expression, name: { text } }: PropertyAccessExpression,
): Node | undefined => {
  const literalExtensions: RuntimeExtension[] = extensions.filter(isLiteralExpression(expression));

  return literalExtensions.length
    ? factory.createPropertyAccessExpression(buildWrapCall(expression, literalExtensions, factory.createStringLiteral(text)), text)
    : undefined;
};

const buildPropertyAccess = (access: PropertyAccessExpression): (() => Node)[] =>
  [[...getContext().extensionsMap].flatMap<RuntimeExtension>(filterPropertyAccess(access.name.text))]
    .filter(({ length }: RuntimeExtension[]): unknown => length)
    .map<() => Node>(
      (extensions: RuntimeExtension[]): (() => Node) =>
        (): Node =>
          buildLiteralPropertyAccess(extensions, access) ??
          factory.createPropertyAccessChain(
            buildProxyFunctionCall(access.expression, extensions, access.name.text),
            isPropertyAccessChain(access) ? factory.createToken(SyntaxKind.QuestionDotToken) : undefined,
            access.name.text,
          ),
    );

export const buildPropertyAccessExpressions = (node: Node): (() => Node)[] =>
  isPropertyAccessExpression(node) ? buildPropertyAccess(node) : [];
