import { NewExpression, factory } from 'typescript';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { ConstName } from '../enums/const-name';
import { FunctionName } from '../enums/function-name';

export const generateExtensionNewExpression = (): NewExpression =>
  factory.createNewExpression(
    factory.createParenthesizedExpression(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier(getContext().constAliases.get(ConstName.TypeMap)!),
          FunctionName.Get,
        ),
        undefined,
        [factory.createIdentifier(ArgName.Type)],
      ),
    ),
    undefined,
    [factory.createIdentifier(ArgName.Value)],
  );
