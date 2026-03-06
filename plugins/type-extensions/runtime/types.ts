import { ArrayLiteralExpression, Expression, Identifier, ObjectLiteralExpression, VariableDeclaration, factory } from 'typescript';
import { TypeExtension } from '../config/config';
import { getContext } from '../context/context';
import { PropertyName } from '../enums/property-name';
import { VariableName } from '../enums/variable-name';
import { readImportName } from '../imports/imports';

export interface RuntimeExtension {
  id: string;
  isStatic: boolean;
}

export const generateTypes = (): VariableDeclaration =>
  factory.createVariableDeclaration(
    getContext().constAliases.get(VariableName.Types)!,
    undefined,
    undefined,
    factory.createArrayLiteralExpression(
      [...getContext().extensionsMap].map<Identifier>(([id]: [string, TypeExtension]): Identifier => factory.createIdentifier(id)),
    ),
  );

export const buildTypesIdentifier = (): Identifier => factory.createIdentifier(getContext().constAliases.get(VariableName.Types)!);

export const buildTypesArgument = (value: Expression, extensions: RuntimeExtension[]): ArrayLiteralExpression =>
  factory.createArrayLiteralExpression(
    extensions.map<ObjectLiteralExpression>(
      ({ id, isStatic }: RuntimeExtension): ObjectLiteralExpression =>
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment(PropertyName.Type, factory.createIdentifier(readImportName(id, value))),
          factory.createPropertyAssignment(PropertyName.IsStatic, isStatic ? factory.createTrue() : factory.createFalse()),
        ]),
    ),
  );
