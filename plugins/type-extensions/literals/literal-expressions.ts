import {
  Node,
  SyntaxKind,
  isArrayLiteralExpression,
  isBigIntLiteral,
  isCallExpression,
  isIdentifier,
  isNewExpression,
  isNumericLiteral,
  isObjectLiteralExpression,
  isParenthesizedExpression,
  isRegularExpressionLiteral,
  isStringLiteral,
  isTemplateLiteral,
} from 'typescript';
import { TypeExtension } from '../config/config';
import { JsType } from '../enums/js-type';

const literalChecksMap: Map<JsType, ((node: Node) => boolean)[]> = new Map<JsType, ((node: Node) => boolean)[]>([
  [
    JsType.Boolean,
    [({ kind }: Node): boolean => [SyntaxKind.TrueKeyword, SyntaxKind.FalseKeyword].some((key: SyntaxKind): boolean => key === kind)],
  ],
  [JsType.Number, [isNumericLiteral]],
  [JsType.BigInt, [isBigIntLiteral]],
  [JsType.String, [isStringLiteral, isTemplateLiteral]],
  [JsType.RegExp, [isRegularExpressionLiteral]],
  [JsType.Array, [isArrayLiteralExpression]],
  [JsType.Object, [isObjectLiteralExpression, isArrayLiteralExpression, isNewExpression]],
]);

const unwrap = (node: Node): Node => (isParenthesizedExpression(node) ? unwrap(node.expression) : node);

const isConstructorCall = (node: Node, type: JsType): boolean =>
  (isCallExpression(node) || isNewExpression(node)) && isIdentifier(node.expression) && node.expression.text === type;

const literalExpressionsMap: Map<string, (node: Node) => boolean> = new Map<JsType, (node: Node) => boolean>(
  [...literalChecksMap].map<[JsType, (node: Node) => boolean]>(([jsType, checks]: [JsType, ((node: Node) => boolean)[]]) => [
    jsType,
    checks.reduce(
      (accumulatedCheck: (node: Node) => boolean, check: (node: Node) => boolean): ((node: Node) => boolean) =>
        (node: Node): boolean =>
          accumulatedCheck(node) || check(unwrap(node)),
      (node: Node): boolean => isConstructorCall(unwrap(node), jsType),
    ),
  ]),
);

export const isLiteralExpression =
  (node: Node): ((entry: [string, TypeExtension]) => boolean) =>
  ([, { type }]: [string, TypeExtension]): boolean =>
    !!literalExpressionsMap.get(type)?.(node);
