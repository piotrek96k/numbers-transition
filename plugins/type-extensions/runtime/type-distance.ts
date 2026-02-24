import { Block, CallExpression, NodeFlags, SyntaxKind, VariableDeclaration, WhileStatement, factory } from 'typescript';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { VariableName } from '../enums/variable-name';
import { ClassName } from '../enums/class-name';
import { PropertyName } from '../enums/property-name';
import { generateTypeMapGetCall } from './type-map';

const generateFoundVariable = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    VariableName.Found,
    undefined,
    undefined,
    factory.createPropertyAccessExpression(
      factory.createPropertyAccessExpression(generateTypeMapGetCall(), PropertyName.Type),
      PropertyName.Prototype,
    ),
  );

const generateDistanceVariable = (): VariableDeclaration =>
  factory.createVariableDeclaration(VariableName.Distance, undefined, undefined, factory.createNumericLiteral(0));

const generateWhileLoopBody = (): Block =>
  factory.createBlock([
    factory.createExpressionStatement(
      factory.createBinaryExpression(
        factory.createIdentifier(ArgName.Prototype),
        factory.createToken(SyntaxKind.EqualsToken),
        factory.createCallExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), PropertyName.GetPrototypeOf),
          undefined,
          [factory.createIdentifier(ArgName.Prototype)],
        ),
      ),
    ),
    factory.createExpressionStatement(factory.createPostfixIncrement(factory.createIdentifier(VariableName.Distance))),
  ]);

const generateWhileLoop = (): WhileStatement =>
  factory.createWhileStatement(
    factory.createBinaryExpression(
      factory.createBinaryExpression(
        factory.createIdentifier(ArgName.Prototype),
        SyntaxKind.AmpersandAmpersandToken,
        factory.createBinaryExpression(
          factory.createIdentifier(ArgName.Prototype),
          SyntaxKind.ExclamationEqualsEqualsToken,
          factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), PropertyName.Prototype),
        ),
      ),
      SyntaxKind.AmpersandAmpersandToken,
      factory.createBinaryExpression(
        factory.createIdentifier(ArgName.Prototype),
        SyntaxKind.ExclamationEqualsEqualsToken,
        factory.createIdentifier(VariableName.Found),
      ),
    ),
    generateWhileLoopBody(),
  );

export const generateTypeDistanceFunction = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(getContext().constAliases.get(VariableName.TypeDistance)!),
    undefined,
    undefined,
    factory.createArrowFunction(
      undefined,
      undefined,
      [
        factory.createParameterDeclaration(undefined, undefined, ArgName.Prototype),
        factory.createParameterDeclaration(undefined, undefined, ArgName.Type),
      ],
      undefined,
      factory.createToken(SyntaxKind.EqualsGreaterThanToken),
      factory.createBlock([
        factory.createVariableStatement(undefined, factory.createVariableDeclarationList([generateFoundVariable()], NodeFlags.Const)),
        factory.createVariableStatement(undefined, factory.createVariableDeclarationList([generateDistanceVariable()], NodeFlags.Let)),
        generateWhileLoop(),
        factory.createReturnStatement(factory.createIdentifier(VariableName.Distance)),
      ]),
    ),
  );

export const buildTypeDistanceFunctionCall = (): CallExpression =>
  factory.createCallExpression(factory.createIdentifier(getContext().constAliases.get(VariableName.TypeDistance)!), undefined, [
    factory.createIdentifier(ArgName.Value),
    factory.createIdentifier(ArgName.Type),
  ]);
