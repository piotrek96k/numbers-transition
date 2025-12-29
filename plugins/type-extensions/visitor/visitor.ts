import { Node, Visitor, visitEachChild } from 'typescript';
import { buildArgumentDestructureFunctionExpressions, buildVariableDestructureExpressions } from '../expressions/destructure';
import { buildPropertyAccessExpressions } from '../expressions/property-access';

const modifyNode = (node: Node): Node =>
  [
    buildPropertyAccessExpressions,
    buildVariableDestructureExpressions,
    buildArgumentDestructureFunctionExpressions,
    (): (() => Node)[] => [(): Node => node],
  ]
    .flatMap<() => Node>((builder: (node: Node) => (() => Node)[]): (() => Node)[] => builder(node))
    .find((expression: () => Node): unknown => expression)!
    .call(undefined);

export const buildVisitor = (): Visitor => {
  const visitor: Visitor = (node: Node): Node => modifyNode(visitEachChild<Node>(node, visitor, undefined));

  return visitor;
};
