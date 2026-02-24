import { CallExpression, Identifier, SyntaxKind, VariableDeclaration, factory } from 'typescript';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { VariableName } from '../enums/variable-name';

export const generateGetThisValueFunction = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(getContext().constAliases.get(VariableName.GetThisValue)!),
    undefined,
    undefined,
    factory.createArrowFunction(
      undefined,
      undefined,
      [
        factory.createParameterDeclaration(undefined, undefined, ArgName.Self),
        factory.createParameterDeclaration(undefined, undefined, ArgName.Type),
      ],
      undefined,
      factory.createToken(SyntaxKind.EqualsGreaterThanToken),
      factory.createConditionalExpression(
        factory.createBinaryExpression(
          factory.createIdentifier(ArgName.Self),
          factory.createToken(SyntaxKind.InstanceOfKeyword),
          factory.createIdentifier(ArgName.Type),
        ),
        factory.createToken(SyntaxKind.QuestionToken),
        factory.createIdentifier(ArgName.Self),
        factory.createToken(SyntaxKind.ColonToken),
        factory.createNewExpression(factory.createIdentifier(ArgName.Type), undefined, [factory.createIdentifier(ArgName.Self)]),
      ),
    ),
  );

export const buildGetThisValueFunctionCall = (cls: Identifier): CallExpression =>
  factory.createCallExpression(factory.createIdentifier(getContext().constAliases.get(VariableName.GetThisValue)!), undefined, [
    factory.createThis(),
    cls,
  ]);
