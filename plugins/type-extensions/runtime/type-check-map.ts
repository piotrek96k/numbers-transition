import {
  ArrayLiteralExpression,
  ScriptKind,
  ScriptTarget,
  Statement,
  SyntaxKind,
  VariableDeclaration,
  createSourceFile,
  factory,
  isExpressionStatement,
} from 'typescript';
import { TypeExtension } from '../config/config';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { ConstName } from '../enums/const-name';
import { TempSourceFile } from '../enums/temp-source-file';
import { ValuePlaceholder } from '../enums/value-placeholder';
import { generateMap } from './map';

export const generateTypeCheckMap = (): VariableDeclaration =>
  generateMap(
    getContext().constAliases.get(ConstName.TypeCheckMap)!,
    [...getContext().extensionsMap]
      .map<
        [string, Statement]
      >(([, { type, typeCheck }]: [string, TypeExtension]): [string, Statement] => [type, createSourceFile(TempSourceFile.Name, typeCheck.replace(new RegExp(ValuePlaceholder.Placeholder, 'g'), ArgName.Value), ScriptTarget.ESNext, false, ScriptKind.TS).statements[0]])
      .map<ArrayLiteralExpression>(
        ([type, typeCheck]: [string, Statement]): ArrayLiteralExpression =>
          factory.createArrayLiteralExpression([
            factory.createStringLiteral(type),
            factory.createArrowFunction(
              undefined,
              undefined,
              [factory.createParameterDeclaration(undefined, undefined, ArgName.Value)],
              undefined,
              factory.createToken(SyntaxKind.EqualsGreaterThanToken),
              isExpressionStatement(typeCheck) ? typeCheck.expression : factory.createVoidZero(),
            ),
          ]),
      ),
  );
