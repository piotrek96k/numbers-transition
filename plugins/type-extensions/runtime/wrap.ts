import {
  ArrowFunction,
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
import { VariableName } from '../enums/variable-name';
import { readImportName } from '../imports/imports';
import { buildFindOwnerDistanceFunctionCall } from './find-owner-distance';
import { buildTypeDistanceFunctionCall } from './type-distance';
import { generateNewTypeMapGetCall } from './type-map';

const generateMapFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [factory.createParameterDeclaration(undefined, undefined, factory.createIdentifier(ArgName.Type))],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createArrayLiteralExpression([factory.createIdentifier(ArgName.Type), buildTypeDistanceFunctionCall()]),
  );

const generateMapFunctionCall = (): CallExpression =>
  factory.createCallExpression(
    factory.createPropertyAccessExpression(factory.createIdentifier(ArgName.Types), PropertyName.Map),
    undefined,
    [generateMapFunction()],
  );

const generateSortFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [
      factory.createParameterDeclaration(
        undefined,
        undefined,
        factory.createArrayBindingPattern([
          factory.createOmittedExpression(),
          factory.createBindingElement(undefined, undefined, factory.createIdentifier(ArgName.First), undefined),
        ]),
      ),
      factory.createParameterDeclaration(
        undefined,
        undefined,
        factory.createArrayBindingPattern([
          factory.createOmittedExpression(),
          factory.createBindingElement(undefined, undefined, factory.createIdentifier(ArgName.Second), undefined),
        ]),
      ),
    ],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createBinaryExpression(
      factory.createIdentifier(ArgName.First),
      factory.createToken(SyntaxKind.MinusToken),
      factory.createIdentifier(ArgName.Second),
    ),
  );

const generateSortFunctionCall = (): CallExpression =>
  factory.createCallExpression(factory.createPropertyAccessExpression(generateMapFunctionCall(), PropertyName.Sort), undefined, [
    generateSortFunction(),
  ]);

const generateArrayDestructureVariable = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createArrayBindingPattern([
      factory.createBindingElement(undefined, undefined, factory.createIdentifier(VariableName.Type), undefined),
      factory.createBindingElement(undefined, undefined, factory.createIdentifier(VariableName.Distance), undefined),
    ]),
    undefined,
    undefined,
    factory.createElementAccessExpression(generateSortFunctionCall(), 0),
  );

const generateWrapFunctionReturn = (): ReturnStatement =>
  factory.createReturnStatement(
    factory.createConditionalExpression(
      factory.createBinaryExpression(
        factory.createBinaryExpression(
          factory.createElementAccessChain(
            factory.createIdentifier(ArgName.Value),
            factory.createToken(SyntaxKind.QuestionDotToken),
            factory.createIdentifier(ArgName.Key),
          ),
          factory.createToken(SyntaxKind.EqualsEqualsEqualsToken),
          factory.createVoidZero(),
        ),
        factory.createToken(SyntaxKind.BarBarToken),
        factory.createBinaryExpression(
          buildFindOwnerDistanceFunctionCall(),
          factory.createToken(SyntaxKind.GreaterThanToken),
          factory.createIdentifier(VariableName.Distance),
        ),
      ),
      factory.createToken(SyntaxKind.QuestionToken),
      generateNewTypeMapGetCall(),
      factory.createToken(SyntaxKind.ColonToken),
      factory.createIdentifier(ArgName.Value),
    ),
  );

const generateWrapFunctionBody = (): ConciseBody =>
  factory.createBlock([
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList([generateArrayDestructureVariable()], NodeFlags.Const),
    ),
    generateWrapFunctionReturn(),
  ]);

export const generateWrapFunction = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(getContext().constAliases.get(VariableName.Wrap)!),
    undefined,
    undefined,
    factory.createArrowFunction(
      undefined,
      undefined,
      [
        factory.createParameterDeclaration(undefined, undefined, ArgName.Value),
        factory.createParameterDeclaration(undefined, undefined, ArgName.Types),
        factory.createParameterDeclaration(undefined, undefined, ArgName.Key),
      ],
      undefined,
      factory.createToken(SyntaxKind.EqualsGreaterThanToken),
      generateWrapFunctionBody(),
    ),
  );

export const buildWrapCall = (value: Expression, types: Expression, key: Expression): CallExpression =>
  factory.createCallExpression(
    factory.createIdentifier(readImportName(getContext().constAliases.get(VariableName.Wrap)!, value)),
    undefined,
    [value, types, key],
  );
