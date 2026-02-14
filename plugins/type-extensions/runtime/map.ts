import { ArrayLiteralExpression, VariableDeclaration, factory } from 'typescript';
import { ClassName } from '../enums/class-name';

export const generateMap = (name: string, entries: ArrayLiteralExpression[]): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(name),
    undefined,
    undefined,
    factory.createNewExpression(factory.createIdentifier(ClassName.Map), undefined, [factory.createArrayLiteralExpression(entries)]),
  );
