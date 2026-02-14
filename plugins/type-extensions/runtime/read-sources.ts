import { Block, NodeFlags, SyntaxKind, VariableDeclaration, WhileStatement, factory } from 'typescript';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { ClassName } from '../enums/class-name';
import { ConstName } from '../enums/const-name';
import { FunctionName } from '../enums/function-name';

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

export const generateReadSourcesFunction = (): VariableDeclaration =>
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
