import { ArrayLiteralExpression, CallExpression, NewExpression, VariableDeclaration, factory } from 'typescript';
import { TypeExtension } from '../config/config';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { PropertyName } from '../enums/property-name';
import { VariableName } from '../enums/variable-name';
import { generateMap } from './map';

export const generateTypeMap = (): VariableDeclaration =>
  generateMap(
    getContext().constAliases.get(VariableName.TypeMap)!,
    [...getContext().extensionsMap].map<ArrayLiteralExpression>(
      ([id, { implementationClass }]: [string, TypeExtension]): ArrayLiteralExpression =>
        factory.createArrayLiteralExpression([factory.createStringLiteral(id), factory.createIdentifier(implementationClass)]),
    ),
  );

export const generateTypeMapKeysCall = (): CallExpression =>
  factory.createCallExpression(
    factory.createPropertyAccessExpression(
      factory.createIdentifier(getContext().constAliases.get(VariableName.TypeMap)!),
      PropertyName.Keys,
    ),
    undefined,
    [],
  );

export const generateTypeMapGetCall = (): CallExpression =>
  factory.createCallExpression(
    factory.createPropertyAccessExpression(
      factory.createIdentifier(getContext().constAliases.get(VariableName.TypeMap)!),
      PropertyName.Get,
    ),
    undefined,
    [factory.createIdentifier(PropertyName.Id)],
  );

export const generateNewTypeMapGetCall = (): NewExpression =>
  factory.createNewExpression(factory.createParenthesizedExpression(generateTypeMapGetCall()), undefined, [
    factory.createIdentifier(ArgName.Value),
  ]);
