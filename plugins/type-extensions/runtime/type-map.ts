import { ArrayLiteralExpression, VariableDeclaration, factory } from 'typescript';
import { TypeExtension } from '../config/config';
import { getContext } from '../context/context';
import { ConstName } from '../enums/const-name';
import { generateMap } from './map';

export const generateTypeMap = (): VariableDeclaration =>
  generateMap(
    getContext().constAliases.get(ConstName.TypeMap)!,
    [...getContext().extensionsMap].map<ArrayLiteralExpression>(
      ([className, { type }]: [string, TypeExtension]): ArrayLiteralExpression =>
        factory.createArrayLiteralExpression([factory.createStringLiteral(type), factory.createIdentifier(className)]),
    ),
  );
