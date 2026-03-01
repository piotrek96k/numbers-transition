import { Block, CallExpression, Expression, NodeFlags, SyntaxKind, VariableDeclaration, WhileStatement, factory } from 'typescript';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { ClassName } from '../enums/class-name';
import { PropertyName } from '../enums/property-name';
import { VariableName } from '../enums/variable-name';

const generateSourcesVariable = (): VariableDeclaration =>
  factory.createVariableDeclaration(VariableName.Sources, undefined, undefined, factory.createArrayLiteralExpression([]));

const generateWhileLoopBody = (): Block =>
  factory.createBlock([
    factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(VariableName.Sources), PropertyName.Push),
        undefined,
        [factory.createIdentifier(ArgName.Value)],
      ),
    ),
    factory.createExpressionStatement(
      factory.createBinaryExpression(
        factory.createIdentifier(ArgName.Value),
        SyntaxKind.EqualsToken,
        factory.createCallExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), PropertyName.GetPrototypeOf),
          undefined,
          [factory.createIdentifier(ArgName.Value)],
        ),
      ),
    ),
  ]);

const generateWhileLoop = (): WhileStatement =>
  factory.createWhileStatement(
    factory.createBinaryExpression(
      factory.createIdentifier(ArgName.Value),
      SyntaxKind.AmpersandAmpersandToken,
      factory.createBinaryExpression(
        factory.createIdentifier(ArgName.Value),
        SyntaxKind.ExclamationEqualsEqualsToken,
        factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), PropertyName.Prototype),
      ),
    ),
    generateWhileLoopBody(),
  );

export const generateReadSourcesFunction = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(getContext().constAliases.get(VariableName.ReadSources)!),
    undefined,
    undefined,
    factory.createArrowFunction(
      undefined,
      undefined,
      [factory.createParameterDeclaration(undefined, undefined, ArgName.Value)],
      undefined,
      factory.createToken(SyntaxKind.EqualsGreaterThanToken),
      factory.createBlock([
        factory.createVariableStatement(undefined, factory.createVariableDeclarationList([generateSourcesVariable()], NodeFlags.Const)),
        generateWhileLoop(),
        factory.createReturnStatement(factory.createIdentifier(VariableName.Sources)),
      ]),
    ),
  );

export const buildReadSourcesFunctionCall = (source: Expression): CallExpression =>
  factory.createCallExpression(factory.createIdentifier(getContext().constAliases.get(VariableName.ReadSources)!), undefined, [source]);
