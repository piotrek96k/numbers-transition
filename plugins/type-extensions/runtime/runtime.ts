import { NodeArray, NodeFlags, Statement, SyntaxKind, factory } from 'typescript';
import { generateGetThisValueFunction } from './get-this-value';
import { generateMergeFunction } from './merge';
import { generateProxyFunction } from './proxy';
import { generateReadSourcesFunction } from './read-sources';
import { generateTypeCheckMap } from './type-check-map';
import { generateTypeMap } from './type-map';
import { generateWrapFunction } from './wrap';

export const injectRuntimeProxies = (statements: NodeArray<Statement>): Statement[] => [
  factory.createVariableStatement(undefined, factory.createVariableDeclarationList([generateGetThisValueFunction()], NodeFlags.Const)),
  ...statements,
  factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList([generateTypeMap(), generateTypeCheckMap(), generateReadSourcesFunction()], NodeFlags.Const),
  ),
  factory.createVariableStatement(
    [factory.createModifier(SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList([generateWrapFunction(), generateMergeFunction(), generateProxyFunction()], NodeFlags.Const),
  ),
];
