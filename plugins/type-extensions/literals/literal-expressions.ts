import {
  Node,
  SyntaxKind,
  isArrayLiteralExpression,
  isBigIntLiteral,
  isNumericLiteral,
  isObjectLiteralExpression,
  isParenthesizedExpression,
  isRegularExpressionLiteral,
  isStringLiteralLike,
} from 'typescript';
import { getContext } from '../context/context';
import { LiteralType } from '../enums/literal-type';
import { RuntimeExtension } from '../runtime/types-argument';

const isBooleanLiteral = ({ kind }: Node): boolean =>
  [SyntaxKind.TrueKeyword, SyntaxKind.FalseKeyword].some((key: SyntaxKind): boolean => key === kind);

const unwrap = (node: Node): Node => (isParenthesizedExpression(node) ? unwrap(node.expression) : node);

const literalChecksMap: Map<LiteralType, (node: Node) => boolean> = new Map<LiteralType, (node: Node) => boolean>([
  [LiteralType.Boolean, isBooleanLiteral],
  [LiteralType.Number, isNumericLiteral],
  [LiteralType.BigInt, isBigIntLiteral],
  [LiteralType.String, isStringLiteralLike],
  [LiteralType.RegExp, isRegularExpressionLiteral],
  [LiteralType.Object, isObjectLiteralExpression],
  [LiteralType.Array, isArrayLiteralExpression],
]);

export const isLiteralExpression =
  (node: Node): ((entry: RuntimeExtension) => boolean) =>
  ({ id, isStatic }: RuntimeExtension): boolean =>
    !isStatic &&
    getContext()
      .extensionsMap.get(id)!
      .literalTypes.some((literalType: LiteralType): boolean => literalChecksMap.get(literalType)!(unwrap(node)));
