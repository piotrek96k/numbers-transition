import { Node, Visitor, visitEachChild } from 'typescript';
import { TypeExtension } from '../config/config';
import { buildArgumentDestructureFunctionExpressions, buildVariableDestructureExpressions } from '../expressions/object-destructure';
import { buildPropertyAccessExpressions } from '../expressions/property-access';

type ExpressionsBuilder<T extends Node = Node> = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  node: T,
) => (() => Node)[];

const modifyNode = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  node: Node,
): Node =>
  [
    buildPropertyAccessExpressions,
    buildVariableDestructureExpressions,
    buildArgumentDestructureFunctionExpressions,
    (): (() => Node)[] => [(): Node => node],
  ]
    .flatMap<() => Node>((builder: ExpressionsBuilder): (() => Node)[] =>
      builder(extensionsMap, constAliases, usedExtensions, isExtensionsFile, node),
    )
    .find((expression: () => Node): unknown => expression)!
    .call(undefined);

export const buildVisitor = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
): Visitor => {
  const visitor: Visitor = (node: Node): Node =>
    modifyNode(extensionsMap, constAliases, usedExtensions, isExtensionsFile, visitEachChild<Node>(node, visitor, undefined));

  return visitor;
};
