import { CallExpression, SyntaxKind, VariableDeclaration, factory } from 'typescript';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { PropertyName } from '../enums/property-name';
import { VariableName } from '../enums/variable-name';

export const generateGetExtensionFunction = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(getContext().constAliases.get(VariableName.GetExtension)!),
    undefined,
    undefined,
    factory.createArrowFunction(
      undefined,
      undefined,
      [
        factory.createParameterDeclaration(undefined, undefined, ArgName.Value),
        factory.createParameterDeclaration(
          undefined,
          undefined,
          factory.createObjectBindingPattern([
            factory.createBindingElement(undefined, undefined, factory.createIdentifier(PropertyName.Type), undefined),
            factory.createBindingElement(undefined, undefined, factory.createIdentifier(PropertyName.IsStatic), undefined),
          ]),
        ),
      ],
      undefined,
      factory.createToken(SyntaxKind.EqualsGreaterThanToken),
      factory.createConditionalExpression(
        factory.createIdentifier(PropertyName.IsStatic),
        factory.createToken(SyntaxKind.QuestionToken),
        factory.createIdentifier(PropertyName.Type),
        factory.createToken(SyntaxKind.ColonToken),
        factory.createNewExpression(factory.createIdentifier(PropertyName.Type), undefined, [factory.createIdentifier(ArgName.Value)]),
      ),
    ),
  );

export const buildGetExtensionFunctionCall = (): CallExpression =>
  factory.createCallExpression(factory.createIdentifier(getContext().constAliases.get(VariableName.GetExtension)!), undefined, [
    factory.createIdentifier(ArgName.Value),
    factory.createIdentifier(ArgName.Type),
  ]);
