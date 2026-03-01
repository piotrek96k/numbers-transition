import { ArrowFunction, Identifier, SyntaxKind, VariableDeclaration, factory } from 'typescript';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { PropertyName } from '../enums/property-name';
import { VariableName } from '../enums/variable-name';
import { generateTypeMapKeysCall } from './type-map';

const generateFilterFunction = (): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [factory.createParameterDeclaration(undefined, undefined, ArgName.Id)],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createArrayLiteralExpression([
      factory.createObjectLiteralExpression([
        factory.createShorthandPropertyAssignment(PropertyName.Id),
        factory.createPropertyAssignment(PropertyName.IsStatic, factory.createFalse()),
      ]),
      factory.createObjectLiteralExpression([
        factory.createShorthandPropertyAssignment(PropertyName.Id),
        factory.createPropertyAssignment(PropertyName.IsStatic, factory.createTrue()),
      ]),
    ]),
  );

export const generateDefaultTypes = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(getContext().constAliases.get(VariableName.DefaultTypes)!),
    undefined,
    undefined,
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createArrayLiteralExpression([factory.createSpreadElement(generateTypeMapKeysCall())]),
        PropertyName.FlatMap,
      ),
      undefined,
      [generateFilterFunction()],
    ),
  );

export const buildDefaultTypesIdentifier = (): Identifier =>
  factory.createIdentifier(getContext().constAliases.get(VariableName.DefaultTypes)!);
