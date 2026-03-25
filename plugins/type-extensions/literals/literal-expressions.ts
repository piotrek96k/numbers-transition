import {
  Node,
  SyntaxKind,
  isArrayLiteralExpression,
  isArrowFunction,
  isBigIntLiteral,
  isFunctionExpression,
  isNumericLiteral,
  isObjectLiteralExpression,
  isParenthesizedExpression,
  isRegularExpressionLiteral,
  isStringLiteralLike,
} from 'typescript';
import { getContext } from '../context/context';
import { LiteralType } from '../enums/literal-type';
import { RuntimeExtension } from '../runtime/types';

const unwrap = (node: Node): Node => (isParenthesizedExpression(node) ? unwrap(node.expression) : node);

const literalChecksMap: Map<LiteralType, (node: Node) => boolean> = new Map<LiteralType, (node: Node) => boolean>([
  [LiteralType.Boolean, ({ kind }: Node): boolean => SyntaxKind.TrueKeyword === kind || SyntaxKind.FalseKeyword === kind],
  [LiteralType.Number, isNumericLiteral],
  [LiteralType.BigInt, isBigIntLiteral],
  [LiteralType.String, isStringLiteralLike],
  [LiteralType.RegExp, isRegularExpressionLiteral],
  [LiteralType.Object, isObjectLiteralExpression],
  [LiteralType.Array, isArrayLiteralExpression],
  [LiteralType.Function, (node: Node): boolean => isFunctionExpression(node) || isArrowFunction(node)],
]);

export const isLiteralExpression =
  (node: Node): ((entry: RuntimeExtension) => boolean) =>
  ({ id, isStatic }: RuntimeExtension): boolean =>
    !isStatic &&
    getContext()
      .extensionsMap.get(id)!
      .literalTypes.some((literalType: LiteralType): boolean => literalChecksMap.get(literalType)!(unwrap(node)));
