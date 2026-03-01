import {
  ArrowFunction,
  BinaryExpression,
  CallExpression,
  ConciseBody,
  Expression,
  NodeFlags,
  ReturnStatement,
  SyntaxKind,
  VariableDeclaration,
  factory,
} from 'typescript';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { PropertyName } from '../enums/property-name';
import { StaticPropertyName } from '../enums/static-property-name';
import { VariableName } from '../enums/variable-name';
import { readImportName } from '../imports/imports';
import { Typeof } from '../enums/typeof';
import { buildDefaultTypesIdentifier } from './default-types';
import { buildMergeFunctionCall } from './merge';
import { RuntimeExtension, buildTypesArgument } from './types-argument';
import { generateTypeMapGetCall } from './type-map';
import { buildWrapCall } from './wrap';

const generateTypeVariable = (): VariableDeclaration =>
  factory.createVariableDeclaration(VariableName.Type, undefined, undefined, generateTypeMapGetCall());

const generateStaticTypeCheck = (): BinaryExpression =>
  factory.createBinaryExpression(
    factory.createBinaryExpression(
      factory.createIdentifier(ArgName.Value),
      factory.createToken(SyntaxKind.EqualsEqualsEqualsToken),
      factory.createPropertyAccessExpression(factory.createIdentifier(VariableName.Type), PropertyName.Type),
    ),
    factory.createToken(SyntaxKind.BarBarToken),
    factory.createBinaryExpression(
      factory.createBinaryExpression(
        factory.createTypeOfExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier(VariableName.Type), PropertyName.Type),
        ),
        factory.createToken(SyntaxKind.EqualsEqualsEqualsToken),
        factory.createStringLiteral(Typeof.Function),
      ),
      factory.createToken(SyntaxKind.AmpersandAmpersandToken),
      factory.createBinaryExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(ArgName.Value), PropertyName.Prototype),
        factory.createToken(SyntaxKind.InstanceOfKeyword),
        factory.createPropertyAccessExpression(factory.createIdentifier(VariableName.Type), PropertyName.Type),
      ),
    ),
  );

const generateObjectTypeCheck = (): CallExpression =>
  factory.createCallExpression(
    factory.createPropertyAccessExpression(factory.createIdentifier(VariableName.Type), StaticPropertyName.IsType),
    undefined,
    [factory.createIdentifier(ArgName.Value)],
  );

const generateFilterFunctionReturn = (): ReturnStatement =>
  factory.createReturnStatement(
    factory.createConditionalExpression(
      factory.createIdentifier(PropertyName.IsStatic),
      factory.createToken(SyntaxKind.QuestionToken),
      generateStaticTypeCheck(),
      factory.createToken(SyntaxKind.ColonToken),
      generateObjectTypeCheck(),
    ),
  );

const generateFilterFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [
      factory.createParameterDeclaration(
        undefined,
        undefined,
        factory.createObjectBindingPattern([
          factory.createBindingElement(undefined, undefined, factory.createIdentifier(PropertyName.Id), undefined),
          factory.createBindingElement(undefined, undefined, factory.createIdentifier(PropertyName.IsStatic), undefined),
        ]),
      ),
    ],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createBlock([
      factory.createVariableStatement(undefined, factory.createVariableDeclarationList([generateTypeVariable()], NodeFlags.Const)),
      generateFilterFunctionReturn(),
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
        factory.createParameterDeclaration(undefined, undefined, ArgName.Types, undefined, undefined, buildDefaultTypesIdentifier()),
        factory.createParameterDeclaration(undefined, undefined, ArgName.Key),
      ],
      undefined,
      factory.createToken(SyntaxKind.EqualsGreaterThanToken),
      generateProxyFunctionBody(),
    ),
  );

export const buildProxyFunctionCall = (value: Expression, extensions: RuntimeExtension[], key?: string): CallExpression =>
  factory.createCallExpression(
    factory.createIdentifier(readImportName(getContext().constAliases.get(VariableName.Proxy)!, value)),
    undefined,
    [value, ...(extensions.length ? [buildTypesArgument(extensions), ...(key ? [factory.createStringLiteral(key)] : [])] : [])],
  );
