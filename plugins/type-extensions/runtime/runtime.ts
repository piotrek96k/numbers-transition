import { NodeArray, NodeFlags, Statement, SyntaxKind, factory } from 'typescript';
import { generateGetThisValueFunction } from './get-this-value';
import { generateMergeFunction } from './merge';
import { generateProxyFunction } from './proxy';
import { generateReadSourcesFunction } from './read-sources';
import { generateTypeDistanceFunction } from './type-distance';
import { generateTypeMap } from './type-map';
import { generateWrapFunction } from './wrap';
import { generateFindOwnerDistanceFunction } from './find-owner-distance';

export const injectRuntimeProxies = (statements: NodeArray<Statement>): Statement[] => [
  factory.createVariableStatement(undefined, factory.createVariableDeclarationList([generateGetThisValueFunction()], NodeFlags.Const)),
  ...statements,
  factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [generateTypeMap(), generateReadSourcesFunction(), generateTypeDistanceFunction(), generateFindOwnerDistanceFunction()],
      NodeFlags.Const,
    ),
  ),
  factory.createVariableStatement(
    [factory.createModifier(SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList([generateWrapFunction(), generateMergeFunction(), generateProxyFunction()], NodeFlags.Const),
  ),
];
