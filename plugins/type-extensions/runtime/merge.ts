import {
  ArrowFunction,
  Block,
  CallExpression,
  Expression,
  ExpressionStatement,
  NodeFlags,
  ReturnStatement,
  SyntaxKind,
  VariableDeclaration,
  factory,
} from 'typescript';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { ClassName } from '../enums/class-name';
import { FunctionName } from '../enums/function-name';
import { PropertyName } from '../enums/property-name';
import { VariableName } from '../enums/variable-name';
import { readImportName } from '../imports/imports';
import { buildGetExtensionFunctionCall } from './get-extension';
import { buildFindOwnerDistanceFunctionCall } from './find-owner-distance';
import { buildReadSourcesFunctionCall } from './read-sources';
import { RuntimeExtension, buildTypesArgument } from './types-argument';
import { buildTypeDistanceFunctionCall } from './type-distance';

const generateObjectVariable = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    VariableName.Object,
    undefined,
    undefined,
    factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), PropertyName.Create),
      undefined,
      [
        factory.createCallExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), PropertyName.GetPrototypeOf),
          undefined,
          [factory.createIdentifier(ArgName.Value)],
        ),
      ],
    ),
  );

const generateGetOwnPropertyDescriptors = (): ExpressionStatement =>
  factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), PropertyName.DefineProperties),
      undefined,
      [
        factory.createIdentifier(VariableName.Object),
        factory.createCallExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), PropertyName.GetOwnPropertyDescriptors),
          undefined,
          [factory.createCallExpression(factory.createIdentifier(ClassName.Object), undefined, [factory.createIdentifier(ArgName.Value)])],
        ),
      ],
    ),
  );

const generateTypesMapFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [factory.createParameterDeclaration(undefined, undefined, ArgName.Type)],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createArrayLiteralExpression([buildReadSourcesFunctionCall(buildGetExtensionFunctionCall()), buildTypeDistanceFunctionCall()]),
  );

const generateTypesMapFunctionCall = (): CallExpression =>
  factory.createCallExpression(
    factory.createPropertyAccessExpression(factory.createIdentifier(ArgName.Types), PropertyName.Map),
    undefined,
    [generateTypesMapFunction()],
  );

const generateSourceFilterFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [factory.createParameterDeclaration(undefined, undefined, ArgName.Key)],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createBinaryExpression(
      factory.createIdentifier(ArgName.Key),
      factory.createToken(SyntaxKind.ExclamationEqualsEqualsToken),
      factory.createStringLiteral(FunctionName.Constructor),
    ),
  );

const generateSourceFilterFunctionCall = (): CallExpression =>
  factory.createCallExpression(
    factory.createPropertyAccessExpression(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), PropertyName.GetOwnPropertyNames),
        undefined,
        [factory.createIdentifier(ArgName.Source)],
      ),
      PropertyName.Filter,
    ),
    undefined,
    [generateSourceFilterFunction()],
  );

const generateSourceMapFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [factory.createParameterDeclaration(undefined, undefined, ArgName.Key)],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createArrayLiteralExpression([
      factory.createIdentifier(ArgName.Key),
      factory.createIdentifier(ArgName.Distance),
      factory.createIdentifier(ArgName.Index),
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), PropertyName.GetOwnPropertyDescriptor),
        undefined,
        [factory.createIdentifier(ArgName.Source), factory.createIdentifier(ArgName.Key)],
      ),
    ]),
  );

const generateSourceMapFunctionCall = (): CallExpression =>
  factory.createCallExpression(factory.createPropertyAccessExpression(generateSourceFilterFunctionCall(), PropertyName.Map), undefined, [
    generateSourceMapFunction(),
  ]);

const generateSourcesFlatMapFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [
      factory.createParameterDeclaration(undefined, undefined, ArgName.Source),
      factory.createParameterDeclaration(undefined, undefined, ArgName.Index),
    ],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    generateSourceMapFunctionCall(),
  );

const generateSourcesFlatMapFunctionCall = (): CallExpression =>
  factory.createCallExpression(
    factory.createPropertyAccessExpression(factory.createIdentifier(ArgName.Sources), PropertyName.FlatMap),
    undefined,
    [generateSourcesFlatMapFunction()],
  );

const generateTypesFlatMapFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [
      factory.createParameterDeclaration(
        undefined,
        undefined,
        factory.createArrayBindingPattern([
          factory.createBindingElement(undefined, undefined, factory.createIdentifier(ArgName.Sources), undefined),
          factory.createBindingElement(undefined, undefined, factory.createIdentifier(ArgName.Distance), undefined),
        ]),
      ),
    ],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    generateSourcesFlatMapFunctionCall(),
  );

const generateTypesFlatMapFunctionCallExpression = (): CallExpression =>
  factory.createCallExpression(factory.createPropertyAccessExpression(generateTypesMapFunctionCall(), PropertyName.FlatMap), undefined, [
    generateTypesFlatMapFunction(),
  ]);

const generateTypesSortFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [
      factory.createParameterDeclaration(undefined, undefined, ArgName.First),
      factory.createParameterDeclaration(undefined, undefined, ArgName.Second),
    ],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createBinaryExpression(
      factory.createBinaryExpression(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(
            factory.createElementAccessExpression(factory.createIdentifier(ArgName.First), 0),
            PropertyName.LocaleCompare,
          ),
          undefined,
          [factory.createElementAccessExpression(factory.createIdentifier(ArgName.Second), 0)],
        ),
        factory.createToken(SyntaxKind.BarBarToken),
        factory.createBinaryExpression(
          factory.createElementAccessExpression(factory.createIdentifier(ArgName.Second), 1),
          factory.createToken(SyntaxKind.MinusToken),
          factory.createElementAccessExpression(factory.createIdentifier(ArgName.First), 1),
        ),
      ),
      factory.createToken(SyntaxKind.BarBarToken),
      factory.createBinaryExpression(
        factory.createElementAccessExpression(factory.createIdentifier(ArgName.Second), 2),
        factory.createToken(SyntaxKind.MinusToken),
        factory.createElementAccessExpression(factory.createIdentifier(ArgName.First), 2),
      ),
    ),
  );

const generateTypesSortFunctionCall = (): CallExpression =>
  factory.createCallExpression(
    factory.createPropertyAccessExpression(generateTypesFlatMapFunctionCallExpression(), PropertyName.Sort),
    undefined,
    [generateTypesSortFunction()],
  );

const generateTypesReduceFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [
      factory.createParameterDeclaration(undefined, undefined, ArgName.Map),
      factory.createParameterDeclaration(undefined, undefined, ArgName.Entry),
    ],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier(ArgName.Map), PropertyName.Set),
      undefined,
      [factory.createElementAccessExpression(factory.createIdentifier(ArgName.Entry), 0), factory.createIdentifier(ArgName.Entry)],
    ),
  );

const generateTypesReduceFunctionCall = (): CallExpression =>
  factory.createCallExpression(factory.createPropertyAccessExpression(generateTypesSortFunctionCall(), PropertyName.Reduce), undefined, [
    generateTypesReduceFunction(),
    factory.createNewExpression(factory.createIdentifier(ClassName.Map), undefined, []),
  ]);

const generatePropertiesVariable = (): VariableDeclaration =>
  factory.createVariableDeclaration(VariableName.Properties, undefined, undefined, generateTypesReduceFunctionCall());

const generatePropertiesFilterFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [
      factory.createParameterDeclaration(
        undefined,
        undefined,
        factory.createArrayBindingPattern([
          factory.createBindingElement(undefined, undefined, factory.createIdentifier(ArgName.Key), undefined),
          factory.createBindingElement(undefined, undefined, factory.createIdentifier(ArgName.Distance), undefined),
        ]),
      ),
    ],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createBinaryExpression(
      factory.createPrefixUnaryExpression(
        SyntaxKind.ExclamationToken,
        factory.createBinaryExpression(
          factory.createIdentifier(ArgName.Key),
          factory.createToken(SyntaxKind.InKeyword),
          factory.createIdentifier(VariableName.Object),
        ),
      ),
      factory.createToken(SyntaxKind.BarBarToken),
      factory.createBinaryExpression(
        buildFindOwnerDistanceFunctionCall(),
        factory.createToken(SyntaxKind.GreaterThanToken),
        factory.createIdentifier(ArgName.Distance),
      ),
    ),
  );

const generatePropertiesFilterFunctionCall = (): CallExpression =>
  factory.createCallExpression(
    factory.createPropertyAccessExpression(
      factory.createArrayLiteralExpression([
        factory.createSpreadElement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier(VariableName.Properties), PropertyName.Values),
            undefined,
            [],
          ),
        ),
      ]),
      PropertyName.Filter,
    ),
    undefined,
    [generatePropertiesFilterFunction()],
  );

const generatePropertiesForEachFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [
      factory.createParameterDeclaration(
        undefined,
        undefined,
        factory.createArrayBindingPattern([
          factory.createBindingElement(undefined, undefined, factory.createIdentifier(ArgName.Key), undefined),
          factory.createOmittedExpression(),
          factory.createOmittedExpression(),
          factory.createBindingElement(undefined, undefined, factory.createIdentifier(ArgName.Descriptor), undefined),
        ]),
      ),
    ],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), PropertyName.DefineProperty),
      undefined,
      [factory.createIdentifier(VariableName.Object), factory.createIdentifier(ArgName.Key), factory.createIdentifier(ArgName.Descriptor)],
    ),
  );

const generatePropertiesForEachFunctionCall = (): CallExpression =>
  factory.createCallExpression(
    factory.createPropertyAccessExpression(generatePropertiesFilterFunctionCall(), PropertyName.ForEach),
    undefined,
    [generatePropertiesForEachFunction()],
  );

const generateMergeFunctionReturn = (): ReturnStatement => factory.createReturnStatement(factory.createIdentifier(VariableName.Object));

const generateMergeFunctionBody = (): Block =>
  factory.createBlock([
    factory.createVariableStatement(undefined, factory.createVariableDeclarationList([generateObjectVariable()], NodeFlags.Const)),
    generateGetOwnPropertyDescriptors(),
    factory.createVariableStatement(undefined, factory.createVariableDeclarationList([generatePropertiesVariable()], NodeFlags.Const)),
    factory.createExpressionStatement(generatePropertiesForEachFunctionCall()),
    generateMergeFunctionReturn(),
  ]);

export const generateMergeFunction = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(getContext().constAliases.get(VariableName.Merge)!),
    undefined,
    undefined,
    factory.createArrowFunction(
      undefined,
      undefined,
      [
        factory.createParameterDeclaration(undefined, undefined, ArgName.Value),
        factory.createParameterDeclaration(undefined, undefined, ArgName.Types),
      ],
      undefined,
      factory.createToken(SyntaxKind.EqualsGreaterThanToken),
      generateMergeFunctionBody(),
    ),
  );

export const buildMergeFunctionCall = (value: Expression, types: Expression | RuntimeExtension[]): CallExpression =>
  factory.createCallExpression(
    factory.createIdentifier(readImportName(getContext().constAliases.get(VariableName.Merge)!, value)),
    undefined,
    [value, Array.isArray(types) ? buildTypesArgument(types) : types],
  );
