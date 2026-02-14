import {
  ArrowFunction,
  Block,
  CallExpression,
  Expression,
  ExpressionStatement,
  NodeFlags,
  ParameterDeclaration,
  ReturnStatement,
  SyntaxKind,
  VariableDeclaration,
  factory,
} from 'typescript';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { ClassName } from '../enums/class-name';
import { ConstName } from '../enums/const-name';
import { FunctionName } from '../enums/function-name';
import { readImportName } from '../imports/imports';
import { generateExtensionNewExpression } from './extension-new-expression';

const generateObjectVariable = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    ConstName.Object,
    undefined,
    undefined,
    factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), FunctionName.Create),
      undefined,
      [
        factory.createCallExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), FunctionName.GetPrototypeOf),
          undefined,
          [factory.createIdentifier(ArgName.Value)],
        ),
      ],
    ),
  );

const generateGetOwnPropertyNamesCall = (): CallExpression =>
  factory.createCallExpression(
    factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), FunctionName.GetOwnPropertyNames),
    undefined,
    [factory.createIdentifier(ArgName.Source)],
  );

const generatePropertyNamesFilterFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [factory.createParameterDeclaration(undefined, undefined, ArgName.Key)],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createBinaryExpression(
      factory.createBinaryExpression(
        factory.createIdentifier(ArgName.Key),
        SyntaxKind.ExclamationEqualsEqualsToken,
        factory.createStringLiteral(FunctionName.Constructor),
      ),
      SyntaxKind.AmpersandAmpersandToken,
      factory.createPrefixUnaryExpression(
        SyntaxKind.ExclamationToken,
        factory.createBinaryExpression(
          factory.createIdentifier(ArgName.Key),
          SyntaxKind.InKeyword,
          factory.createIdentifier(ConstName.Object),
        ),
      ),
    ),
  );

const generatePropertyNamesFilterCall = (): CallExpression =>
  factory.createCallExpression(factory.createPropertyAccessExpression(generateGetOwnPropertyNamesCall(), FunctionName.Filter), undefined, [
    generatePropertyNamesFilterFunction(),
  ]);

const generatePropertyNamesMapFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [factory.createParameterDeclaration(undefined, undefined, ArgName.Key)],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createArrayLiteralExpression([
      factory.createIdentifier(ArgName.Key),
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), FunctionName.GetOwnPropertyDescriptor),
        undefined,
        [factory.createIdentifier(ArgName.Source), factory.createIdentifier(ArgName.Key)],
      ),
    ]),
  );

const generatePropertyNamesMapCall = (): CallExpression =>
  factory.createCallExpression(factory.createPropertyAccessExpression(generatePropertyNamesFilterCall(), FunctionName.Map), undefined, [
    generatePropertyNamesMapFunction(),
  ]);

const generateFromEntriesCall = (): CallExpression =>
  factory.createCallExpression(
    factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), FunctionName.FromEntries),
    undefined,
    [generatePropertyNamesMapCall()],
  );

const generateSourceMapFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [factory.createParameterDeclaration(undefined, undefined, ArgName.Source)],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    generateFromEntriesCall(),
  );

const generateSourcesMapCall = (): CallExpression =>
  factory.createCallExpression(
    factory.createPropertyAccessExpression(
      factory.createCallExpression(factory.createIdentifier(getContext().constAliases.get(ConstName.ReadSources)!), undefined, [
        generateExtensionNewExpression(),
      ]),
      FunctionName.Map,
    ),
    undefined,
    [generateSourceMapFunction()],
  );

const generateDescriptionsVariable = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    ConstName.Descriptions,
    undefined,
    undefined,
    factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), FunctionName.Assign),
      undefined,
      [factory.createObjectLiteralExpression(), factory.createSpreadElement(generateSourcesMapCall())],
    ),
  );

const generateGetOwnPropertyDescriptors = (): ExpressionStatement =>
  factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), FunctionName.DefineProperties),
      undefined,
      [
        factory.createIdentifier(ConstName.Object),
        factory.createCallExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), FunctionName.GetOwnPropertyDescriptors),
          undefined,
          [factory.createCallExpression(factory.createIdentifier(ClassName.Object), undefined, [factory.createIdentifier(ArgName.Value)])],
        ),
      ],
    ),
  );

const generateMergeFunctionResult = (): ReturnStatement =>
  factory.createReturnStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), FunctionName.DefineProperties),
      undefined,
      [factory.createIdentifier(ConstName.Object), factory.createIdentifier(ConstName.Descriptions)],
    ),
  );

const generateMergeFunctionBody = (): Block =>
  factory.createBlock([
    factory.createVariableStatement(undefined, factory.createVariableDeclarationList([generateObjectVariable()], NodeFlags.Const)),
    generateGetOwnPropertyDescriptors(),
    factory.createVariableStatement(undefined, factory.createVariableDeclarationList([generateDescriptionsVariable()], NodeFlags.Const)),
    generateMergeFunctionResult(),
  ]);

export const generateMergeFunction = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(getContext().constAliases.get(ConstName.Merge)!),
    undefined,
    undefined,
    factory.createArrowFunction(
      undefined,
      undefined,
      [
        ...[ArgName.Value, ArgName.Cls].map<ParameterDeclaration>(
          (param: string): ParameterDeclaration => factory.createParameterDeclaration(undefined, undefined, param),
        ),
      ],
      undefined,
      factory.createToken(SyntaxKind.EqualsGreaterThanToken),
      generateMergeFunctionBody(),
    ),
  );

export const buildMergeCallExpression = (value: Expression, type: string): CallExpression =>
  factory.createCallExpression(
    factory.createIdentifier(readImportName(getContext().constAliases.get(ConstName.Merge)!, value)),
    undefined,
    [value, factory.createStringLiteral(type)],
  );
