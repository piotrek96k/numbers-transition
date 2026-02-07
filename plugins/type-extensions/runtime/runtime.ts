import {
  ArrayLiteralExpression,
  ArrowFunction,
  Block,
  CallExpression,
  ConciseBody,
  Expression,
  ExpressionStatement,
  NewExpression,
  NodeFlags,
  ParameterDeclaration,
  ReturnStatement,
  ScriptKind,
  ScriptTarget,
  Statement,
  StringLiteral,
  SyntaxKind,
  VariableDeclaration,
  VariableStatement,
  WhileStatement,
  createSourceFile,
  factory,
  isExpressionStatement,
} from 'typescript';
import { TypeExtension } from '../config/config';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { ClassName } from '../enums/class-name';
import { ConstName } from '../enums/const-name';
import { FunctionName } from '../enums/function-name';
import { TempSourceFile } from '../enums/temp-source-file';
import { ValuePlaceholder } from '../enums/value-placeholder';
import { readImportName } from '../imports/imports';

const generateMap = (name: string, entries: ArrayLiteralExpression[]): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(name),
    undefined,
    undefined,
    factory.createNewExpression(factory.createIdentifier(ClassName.Map), undefined, [factory.createArrayLiteralExpression(entries)]),
  );

const generateTypeMap = (): VariableDeclaration =>
  generateMap(
    getContext().constAliases.get(ConstName.TypeMap)!,
    [...getContext().extensionsMap].map<ArrayLiteralExpression>(
      ([className, { type }]: [string, TypeExtension]): ArrayLiteralExpression =>
        factory.createArrayLiteralExpression([factory.createStringLiteral(type), factory.createIdentifier(className)]),
    ),
  );

const generateTypeCheckMap = (): VariableDeclaration =>
  generateMap(
    getContext().constAliases.get(ConstName.TypeCheckMap)!,
    [...getContext().extensionsMap]
      .map<
        [string, Statement]
      >(([, { type, typeCheck }]: [string, TypeExtension]): [string, Statement] => [type, createSourceFile(TempSourceFile.Name, typeCheck.replace(new RegExp(ValuePlaceholder.Placeholder, 'g'), ArgName.Value), ScriptTarget.ESNext, false, ScriptKind.TS).statements[0]])
      .map<ArrayLiteralExpression>(
        ([type, typeCheck]: [string, Statement]): ArrayLiteralExpression =>
          factory.createArrayLiteralExpression([
            factory.createStringLiteral(type),
            factory.createArrowFunction(
              undefined,
              undefined,
              [factory.createParameterDeclaration(undefined, undefined, ArgName.Value)],
              undefined,
              factory.createToken(SyntaxKind.EqualsGreaterThanToken),
              isExpressionStatement(typeCheck) ? typeCheck.expression : factory.createVoidZero(),
            ),
          ]),
      ),
  );

const generateExtensionNewExpression = (): NewExpression =>
  factory.createNewExpression(
    factory.createParenthesizedExpression(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier(getContext().constAliases.get(ConstName.TypeMap)!),
          FunctionName.Get,
        ),
        undefined,
        [factory.createIdentifier(ArgName.Cls)],
      ),
    ),
    undefined,
    [factory.createIdentifier(ArgName.Value)],
  );

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

const generateWrapFunction = (): VariableDeclaration =>
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

const generateSourcesVariable = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    ConstName.Sources,
    undefined,
    undefined,
    factory.createArrayLiteralExpression([factory.createIdentifier(ConstName.Extension)]),
  );

const generatePrototypeVariable = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    ConstName.Prototype,
    undefined,
    undefined,
    factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), FunctionName.GetPrototypeOf),
      undefined,
      [factory.createIdentifier(ConstName.Extension)],
    ),
  );

const generateWhileLoopBody = (): Block =>
  factory.createBlock([
    factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(ConstName.Sources), FunctionName.Unshift),
        undefined,
        [factory.createIdentifier(ConstName.Prototype)],
      ),
    ),
    factory.createExpressionStatement(
      factory.createBinaryExpression(
        factory.createIdentifier(ConstName.Prototype),
        SyntaxKind.EqualsToken,
        factory.createCallExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), FunctionName.GetPrototypeOf),
          undefined,
          [factory.createIdentifier(ConstName.Prototype)],
        ),
      ),
    ),
  ]);

const generateWhileLoop = (): WhileStatement =>
  factory.createWhileStatement(
    factory.createBinaryExpression(
      factory.createIdentifier(ConstName.Prototype),
      SyntaxKind.AmpersandAmpersandToken,
      factory.createBinaryExpression(
        factory.createIdentifier(ConstName.Prototype),
        SyntaxKind.ExclamationEqualsEqualsToken,
        factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), ConstName.Prototype),
      ),
    ),
    generateWhileLoopBody(),
  );

const generateReadSourcesFunction = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(getContext().constAliases.get(ConstName.ReadSources)!),
    undefined,
    undefined,
    factory.createArrowFunction(
      undefined,
      undefined,
      [factory.createParameterDeclaration(undefined, undefined, ArgName.Extension)],
      undefined,
      factory.createToken(SyntaxKind.EqualsGreaterThanToken),
      factory.createBlock([
        factory.createVariableStatement(undefined, factory.createVariableDeclarationList([generateSourcesVariable()], NodeFlags.Const)),
        factory.createVariableStatement(undefined, factory.createVariableDeclarationList([generatePrototypeVariable()], NodeFlags.Let)),
        generateWhileLoop(),
        factory.createReturnStatement(factory.createIdentifier(ConstName.Sources)),
      ]),
    ),
  );

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

const generateMergeFunction = (): VariableDeclaration =>
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

const generateProxyFunction = (): VariableDeclaration =>
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

export const generateRuntimeProxies = (): Statement[] => [
  factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList([generateTypeMap(), generateTypeCheckMap()], NodeFlags.Const),
  ),
  factory.createVariableStatement(
    [factory.createModifier(SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList(
      [generateWrapFunction(), generateReadSourcesFunction(), generateMergeFunction(), generateProxyFunction()],
      NodeFlags.Const,
    ),
  ),
];

export const buildWrapCallExpression = (value: Expression, type: string, key: string): CallExpression =>
  factory.createCallExpression(factory.createIdentifier(readImportName(getContext().constAliases.get(ConstName.Wrap)!, value)), undefined, [
    value,
    factory.createStringLiteral(type),
    factory.createStringLiteral(key),
  ]);

export const buildMergeCallExpression = (value: Expression, type: string): CallExpression =>
  factory.createCallExpression(
    factory.createIdentifier(readImportName(getContext().constAliases.get(ConstName.Merge)!, value)),
    undefined,
    [value, factory.createStringLiteral(type)],
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
