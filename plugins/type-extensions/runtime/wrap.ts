import { CallExpression, ConciseBody, Expression, SyntaxKind, VariableDeclaration, factory } from 'typescript';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { ConstName } from '../enums/const-name';
import { readImportName } from '../imports/imports';
import { generateExtensionNewExpression } from './extension-new-expression';

const generateWrapFunctionBody = (): ConciseBody =>
  factory.createConditionalExpression(
    factory.createBinaryExpression(
      factory.createElementAccessChain(
        factory.createIdentifier(ArgName.Value),
        factory.createToken(SyntaxKind.QuestionDotToken),
        factory.createIdentifier(ArgName.Key),
      ),
      factory.createToken(SyntaxKind.EqualsEqualsEqualsToken),
      factory.createVoidZero(),
    ),
    factory.createToken(SyntaxKind.QuestionToken),
    generateExtensionNewExpression(),
    factory.createToken(SyntaxKind.ColonToken),
    factory.createIdentifier(ArgName.Value),
  );

export const generateWrapFunction = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(getContext().constAliases.get(ConstName.Wrap)!),
    undefined,
    undefined,
    factory.createArrowFunction(
      undefined,
      undefined,
      [
        factory.createParameterDeclaration(undefined, undefined, ArgName.Value),
        factory.createParameterDeclaration(undefined, undefined, ArgName.Cls),
        factory.createParameterDeclaration(undefined, undefined, ArgName.Key),
      ],
      undefined,
      factory.createToken(SyntaxKind.EqualsGreaterThanToken),
      generateWrapFunctionBody(),
    ),
  );

export const buildWrapCallExpression = (value: Expression, type: string, key: string): CallExpression =>
  factory.createCallExpression(factory.createIdentifier(readImportName(getContext().constAliases.get(ConstName.Wrap)!, value)), undefined, [
    value,
    factory.createStringLiteral(type),
    factory.createStringLiteral(key),
  ]);
