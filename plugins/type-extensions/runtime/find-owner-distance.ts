import { Block, CallExpression, NodeFlags, SyntaxKind, VariableDeclaration, WhileStatement, factory } from 'typescript';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { ClassName } from '../enums/class-name';
import { PropertyName } from '../enums/property-name';
import { VariableName } from '../enums/variable-name';

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
      factory.createIdentifier(ArgName.Prototype),
      SyntaxKind.AmpersandAmpersandToken,
      factory.createPrefixUnaryExpression(
        SyntaxKind.ExclamationToken,
        factory.createCallExpression(
          factory.createPropertyAccessExpression(
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), PropertyName.Prototype),
              PropertyName.HasOwnProperty,
            ),
            PropertyName.Call,
          ),
          undefined,
          [factory.createIdentifier(ArgName.Prototype), factory.createIdentifier(ArgName.Key)],
        ),
      ),
    ),
    generateWhileLoopBody(),
  );

export const generateFindOwnerDistanceFunction = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(getContext().constAliases.get(VariableName.FindOwnerDistance)!),
    undefined,
    undefined,
    factory.createArrowFunction(
      undefined,
      undefined,
      [
        factory.createParameterDeclaration(undefined, undefined, ArgName.Prototype),
        factory.createParameterDeclaration(undefined, undefined, ArgName.Key),
      ],
      undefined,
      factory.createToken(SyntaxKind.EqualsGreaterThanToken),
      factory.createBlock([
        factory.createVariableStatement(undefined, factory.createVariableDeclarationList([generateDistanceVariable()], NodeFlags.Let)),
        generateWhileLoop(),
        factory.createReturnStatement(factory.createIdentifier(VariableName.Distance)),
      ]),
    ),
  );

export const buildFindOwnerDistanceFunctionCall = (): CallExpression =>
  factory.createCallExpression(factory.createIdentifier(getContext().constAliases.get(VariableName.FindOwnerDistance)!), undefined, [
    factory.createIdentifier(ArgName.Value),
    factory.createIdentifier(ArgName.Key),
  ]);
