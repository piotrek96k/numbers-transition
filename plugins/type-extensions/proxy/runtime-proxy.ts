import {
  ArrayLiteralExpression,
  ArrowFunction,
  CallExpression,
  Expression,
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
  createSourceFile,
  factory,
  isExpressionStatement,
} from 'typescript';
import { TypeExtension } from '../config/config';
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

const generateTypeMap = (extensionsMap: Map<string, TypeExtension>, constAliases: Map<string, string>): VariableDeclaration =>
  generateMap(
    constAliases.get(ConstName.TypeMap)!,
    [...extensionsMap].map<ArrayLiteralExpression>(
      ([className, { type }]: [string, TypeExtension]): ArrayLiteralExpression =>
        factory.createArrayLiteralExpression([factory.createStringLiteral(type), factory.createIdentifier(className)]),
    ),
  );

const generateTypeCheckMap = (extensionsMap: Map<string, TypeExtension>, constAliases: Map<string, string>): VariableDeclaration =>
  generateMap(
    constAliases.get(ConstName.TypeCheckMap)!,
    [...extensionsMap]
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

const generateWrapperNewExpression = (constAliases: Map<string, string>, value: string, type: string): NewExpression =>
  factory.createNewExpression(
    factory.createParenthesizedExpression(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(constAliases.get(ConstName.TypeMap)!), FunctionName.Get),
        undefined,
        [factory.createIdentifier(type)],
      ),
    ),
    undefined,
    [factory.createIdentifier(value)],
  );

const generateMergeFunction = (constAliases: Map<string, string>): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(constAliases.get(ConstName.Merge)!),
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
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), FunctionName.Assign),
        undefined,
        [
          factory.createCallExpression(factory.createIdentifier(ClassName.Object), undefined, [factory.createIdentifier(ArgName.Value)]),
          generateWrapperNewExpression(constAliases, ArgName.Value, ArgName.Cls),
        ],
      ),
    ),
  );

const generateProxyFindFunction = (constAliases: Map<string, string>): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [factory.createParameterDeclaration(undefined, undefined, ArgName.Cls)],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createCallExpression(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(constAliases.get(ConstName.TypeCheckMap)!), FunctionName.Get),
        undefined,
        [factory.createIdentifier(ArgName.Cls)],
      ),
      undefined,
      [factory.createIdentifier(ArgName.Value)],
    ),
  );

const generateProxyFindExpression = (constAliases: Map<string, string>): VariableStatement =>
  factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          ConstName.Type,
          undefined,
          undefined,
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier(ArgName.Classes), FunctionName.Find),
            undefined,
            [generateProxyFindFunction(constAliases)],
          ),
        ),
      ],
      NodeFlags.Const,
    ),
  );

const generateProxyResult = (constAliases: Map<string, string>): ReturnStatement =>
  factory.createReturnStatement(
    factory.createConditionalExpression(
      factory.createIdentifier(ConstName.Type),
      factory.createToken(SyntaxKind.QuestionToken),
      factory.createConditionalExpression(
        factory.createIdentifier(ArgName.Merge),
        factory.createToken(SyntaxKind.QuestionToken),
        factory.createCallExpression(factory.createIdentifier(constAliases.get(ConstName.Merge)!), undefined, [
          factory.createIdentifier(ArgName.Value),
          factory.createIdentifier(ConstName.Type),
        ]),
        factory.createToken(SyntaxKind.ColonToken),
        generateWrapperNewExpression(constAliases, ArgName.Value, ConstName.Type),
      ),
      factory.createToken(SyntaxKind.ColonToken),
      factory.createIdentifier(ArgName.Value),
    ),
  );

const generateProxyFunction = (constAliases: Map<string, string>): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(constAliases.get(ConstName.Proxy)!),
    undefined,
    undefined,
    factory.createArrowFunction(
      undefined,
      undefined,
      [
        ...[ArgName.Value, ArgName.Classes].map<ParameterDeclaration>(
          (param: string): ParameterDeclaration => factory.createParameterDeclaration(undefined, undefined, param),
        ),
        factory.createParameterDeclaration(undefined, undefined, ArgName.Merge, undefined, undefined, factory.createFalse()),
      ],
      undefined,
      factory.createToken(SyntaxKind.EqualsGreaterThanToken),
      factory.createBlock([generateProxyFindExpression(constAliases), generateProxyResult(constAliases)]),
    ),
  );

export const generateRuntimeProxies = (extensionsMap: Map<string, TypeExtension>, constAliases: Map<string, string>): Statement[] => [
  factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [generateTypeMap(extensionsMap, constAliases), generateTypeCheckMap(extensionsMap, constAliases)],
      NodeFlags.Const,
    ),
  ),
  factory.createVariableStatement(
    [factory.createModifier(SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList([generateMergeFunction(constAliases), generateProxyFunction(constAliases)], NodeFlags.Const),
  ),
];

export const buildProxyCallExpression = (
  extensions: [string, TypeExtension][],
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  value: Expression,
  merge: boolean,
): CallExpression =>
  factory.createCallExpression(
    factory.createIdentifier(readImportName(constAliases.get(ConstName.Proxy)!, usedExtensions, isExtensionsFile, value)),
    undefined,
    [
      value,
      factory.createArrayLiteralExpression(
        extensions.map<StringLiteral>(([, { type }]: [string, TypeExtension]): StringLiteral => factory.createStringLiteral(type)),
      ),
      ...(merge ? [factory.createTrue()] : []),
    ],
  );
