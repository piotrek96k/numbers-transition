import {
  ArrowFunction,
  CallExpression,
  ConciseBody,
  Expression,
  NodeFlags,
  ReturnStatement,
  StringLiteral,
  SyntaxKind,
  VariableDeclaration,
  factory,
} from 'typescript';
import { TypeExtension } from '../config/config';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { PropertyName } from '../enums/property-name';
import { StaticPropertyName } from '../enums/static-property-name';
import { VariableName } from '../enums/variable-name';
import { readImportName } from '../imports/imports';
import { buildMergeFunctionCall } from './merge';
import { generateTypeMapGetCall, generateTypeMapKeysCall } from './type-map';
import { buildWrapCall } from './wrap';

const generateFilterFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [factory.createParameterDeclaration(undefined, undefined, ArgName.Type)],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createCallExpression(factory.createPropertyAccessExpression(generateTypeMapGetCall(), StaticPropertyName.IsType), undefined, [
      factory.createIdentifier(ArgName.Value),
    ]),
  );

const generateFoundTypesVariable = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    VariableName.Found,
    undefined,
    undefined,
    factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier(ArgName.Types), PropertyName.Filter),
      undefined,
      [generateFilterFunction()],
    ),
  );

const generateProxyFunctionReturn = (): ReturnStatement =>
  factory.createReturnStatement(
    factory.createConditionalExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier(VariableName.Found), PropertyName.Length),
      factory.createToken(SyntaxKind.QuestionToken),
      factory.createConditionalExpression(
        factory.createBinaryExpression(
          factory.createIdentifier(ArgName.Key),
          factory.createToken(SyntaxKind.ExclamationEqualsEqualsToken),
          factory.createVoidZero(),
        ),
        factory.createToken(SyntaxKind.QuestionToken),
        buildWrapCall(
          factory.createIdentifier(ArgName.Value),
          factory.createIdentifier(VariableName.Found),
          factory.createIdentifier(ArgName.Key),
        ),
        factory.createToken(SyntaxKind.ColonToken),
        buildMergeFunctionCall(factory.createIdentifier(ArgName.Value), factory.createIdentifier(VariableName.Found)),
      ),
      factory.createToken(SyntaxKind.ColonToken),
      factory.createIdentifier(ArgName.Value),
    ),
  );

const generateProxyFunctionBody = (): ConciseBody =>
  factory.createBlock([
    factory.createVariableStatement(undefined, factory.createVariableDeclarationList([generateFoundTypesVariable()], NodeFlags.Const)),
    generateProxyFunctionReturn(),
  ]);

export const generateProxyFunction = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(getContext().constAliases.get(VariableName.Proxy)!),
    undefined,
    undefined,
    factory.createArrowFunction(
      undefined,
      undefined,
      [
        factory.createParameterDeclaration(undefined, undefined, ArgName.Value),
        factory.createParameterDeclaration(
          undefined,
          undefined,
          ArgName.Types,
          undefined,
          undefined,
          factory.createArrayLiteralExpression([factory.createSpreadElement(generateTypeMapKeysCall())]),
        ),
        factory.createParameterDeclaration(undefined, undefined, ArgName.Key),
      ],
      undefined,
      factory.createToken(SyntaxKind.EqualsGreaterThanToken),
      generateProxyFunctionBody(),
    ),
  );

export const buildProxyFunctionCall = (value: Expression, extensions: [string, TypeExtension][], key?: string): CallExpression =>
  factory.createCallExpression(
    factory.createIdentifier(readImportName(getContext().constAliases.get(VariableName.Proxy)!, value)),
    undefined,
    [
      value,
      ...(extensions.length
        ? [
            factory.createArrayLiteralExpression(
              extensions.map<StringLiteral>(([id]: [string, TypeExtension]): StringLiteral => factory.createStringLiteral(id)),
            ),
            ...(key ? [factory.createStringLiteral(key)] : []),
          ]
        : []),
    ],
  );
