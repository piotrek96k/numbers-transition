import { NodeArray, NodeFlags, Statement, SyntaxKind, factory } from 'typescript';
import { generateDefaultTypes } from './default-types';
import { generateFindOwnerDistanceFunction } from './find-owner-distance';
import { generateGetExtensionFunction } from './get-extension';
import { generateGetThisValueFunction } from './get-this-value';
import { generateMergeFunction } from './merge';
import { generateProxyFunction } from './proxy';
import { generateReadSourcesFunction } from './read-sources';
import { generateTypeDistanceFunction } from './type-distance';
import { generateTypes } from './types';
import { generateWrapFunction } from './wrap';

export const injectRuntimeProxies = (statements: NodeArray<Statement>): Statement[] => [
  factory.createVariableStatement(undefined, factory.createVariableDeclarationList([generateGetThisValueFunction()], NodeFlags.Const)),
  ...statements,
  factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        generateTypes(),
        generateDefaultTypes(),
        generateReadSourcesFunction(),
        generateTypeDistanceFunction(),
        generateFindOwnerDistanceFunction(),
        generateGetExtensionFunction(),
      ],
      NodeFlags.Const,
    ),
  ),
  factory.createVariableStatement(
    [factory.createModifier(SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList([generateWrapFunction(), generateMergeFunction(), generateProxyFunction()], NodeFlags.Const),
  ),
];
