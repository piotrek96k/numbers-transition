import {
  ArrowFunction,
  CallExpression,
  Expression,
  NodeFlags,
  ParameterDeclaration,
  ReturnStatement,
  StringLiteral,
  SyntaxKind,
  VariableDeclaration,
  VariableStatement,
  factory,
} from 'typescript';
import { TypeExtension } from '../config/config';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { ConstName } from '../enums/const-name';
import { FunctionName } from '../enums/function-name';
import { readImportName } from '../imports/imports';

const generateProxyFindFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [factory.createParameterDeclaration(undefined, undefined, ArgName.Cls)],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createCallExpression(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier(getContext().constAliases.get(ConstName.TypeCheckMap)!),
          FunctionName.Get,
        ),
        undefined,
        [factory.createIdentifier(ArgName.Cls)],
      ),
      undefined,
      [factory.createIdentifier(ArgName.Value)],
    ),
  );

const generateProxyFindCall = (): CallExpression =>
  factory.createCallExpression(
    factory.createPropertyAccessExpression(factory.createIdentifier(ArgName.Classes), FunctionName.Find),
    undefined,
    [generateProxyFindFunction()],
  );

const generateProxyFindExpression = (): VariableStatement =>
  factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [factory.createVariableDeclaration(ConstName.Type, undefined, undefined, generateProxyFindCall())],
      NodeFlags.Const,
    ),
  );

const generateProxyFunctionResult = (): ReturnStatement =>
  factory.createReturnStatement(
    factory.createConditionalExpression(
      factory.createIdentifier(ConstName.Type),
      factory.createToken(SyntaxKind.QuestionToken),
      factory.createConditionalExpression(
        factory.createIdentifier(ArgName.Key),
        factory.createToken(SyntaxKind.QuestionToken),
        factory.createCallExpression(factory.createIdentifier(getContext().constAliases.get(ConstName.Wrap)!), undefined, [
          factory.createIdentifier(ArgName.Value),
          factory.createIdentifier(ConstName.Type),
          factory.createIdentifier(ArgName.Key),
        ]),
        factory.createToken(SyntaxKind.ColonToken),
        factory.createCallExpression(factory.createIdentifier(getContext().constAliases.get(ConstName.Merge)!), undefined, [
          factory.createIdentifier(ArgName.Value),
          factory.createIdentifier(ConstName.Type),
        ]),
      ),
      factory.createToken(SyntaxKind.ColonToken),
      factory.createIdentifier(ArgName.Value),
    ),
  );

export const generateProxyFunction = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(getContext().constAliases.get(ConstName.Proxy)!),
    undefined,
    undefined,
    factory.createArrowFunction(
      undefined,
      undefined,
      [ArgName.Value, ArgName.Classes, ArgName.Key].map<ParameterDeclaration>(
        (param: string): ParameterDeclaration => factory.createParameterDeclaration(undefined, undefined, param),
      ),
      undefined,
      factory.createToken(SyntaxKind.EqualsGreaterThanToken),
      factory.createBlock([generateProxyFindExpression(), generateProxyFunctionResult()]),
    ),
  );

export const buildProxyCallExpression = (value: Expression, extensions: [string, TypeExtension][], key?: string): CallExpression =>
  factory.createCallExpression(
    factory.createIdentifier(readImportName(getContext().constAliases.get(ConstName.Proxy)!, value)),
    undefined,
    [
      value,
      factory.createArrayLiteralExpression(
        extensions.map<StringLiteral>(([, { type }]: [string, TypeExtension]): StringLiteral => factory.createStringLiteral(type)),
      ),
      ...(key ? [factory.createStringLiteral(key)] : []),
    ],
  );
