import {
  Node,
  SyntaxKind,
  isArrayLiteralExpression,
  isBigIntLiteral,
  isCallExpression,
  isIdentifier,
  isNewExpression,
  isNumericLiteral,
  isRegularExpressionLiteral,
  isStringLiteral,
  isTemplateLiteral,
} from 'typescript';
import { TypeExtension } from '../config/config';
import { JsType } from '../enums/js-type';

const literalChecksMap: Map<JsType, ((node: Node) => boolean)[]> = new Map<JsType, ((node: Node) => boolean)[]>([
  [
    JsType.Boolean,
    [(node: Node): boolean => [SyntaxKind.TrueKeyword, SyntaxKind.FalseKeyword].some((kind: SyntaxKind): boolean => kind === node.kind)],
  ],
  [JsType.Number, [isNumericLiteral]],
  [JsType.BigInt, [isBigIntLiteral]],
  [JsType.String, [isStringLiteral, isTemplateLiteral]],
  [JsType.RegExp, [isRegularExpressionLiteral]],
  [JsType.Array, [isArrayLiteralExpression]],
]);

const isConstructorCall = (node: Node, type: JsType): boolean =>
  (isCallExpression(node) || isNewExpression(node)) && isIdentifier(node.expression) && node.expression.text === type;

const literalExpressionsMap: Map<string, (node: Node) => boolean> = new Map<JsType, (node: Node) => boolean>(
  [...literalChecksMap].map<[JsType, (node: Node) => boolean]>(([jsType, checks]: [JsType, ((node: Node) => boolean)[]]) => [
    jsType,
    checks.reduce(
      (accumulatedCheck: (node: Node) => boolean, check: (node: Node) => boolean): ((node: Node) => boolean) =>
        (node: Node): boolean =>
          accumulatedCheck(node) || check(node),
      (node: Node): boolean => isConstructorCall(node, jsType),
    ),
  ]),
);

export const isLiteralExpression =
  (node: Node): ((entry: [string, TypeExtension]) => boolean) =>
  ([, { type }]: [string, TypeExtension]): boolean =>
    !!literalExpressionsMap.get(type)?.(node);
