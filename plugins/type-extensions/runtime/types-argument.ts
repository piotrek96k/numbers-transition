import { ArrayLiteralExpression, ObjectLiteralExpression, factory } from 'typescript';
import { PropertyName } from '../enums/property-name';

export interface RuntimeExtension {
  id: string;
  isStatic: boolean;
}

export const buildTypesArgument = (extensions: RuntimeExtension[]): ArrayLiteralExpression =>
  factory.createArrayLiteralExpression(
    extensions.map<ObjectLiteralExpression>(
      ({ id, isStatic }: RuntimeExtension): ObjectLiteralExpression =>
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment(PropertyName.Id, factory.createStringLiteral(id)),
          factory.createPropertyAssignment(PropertyName.IsStatic, isStatic ? factory.createTrue() : factory.createFalse()),
        ]),
    ),
  );
