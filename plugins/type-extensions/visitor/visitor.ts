import { Node, Visitor, visitEachChild } from 'typescript';
import { buildExtensionClassExpressions } from '../nodes/class';
import { buildArgumentDestructureFunctionExpressions, buildVariableDestructureExpressions } from '../nodes/destructure';
import { buildPropertyAccessExpressions } from '../nodes/property-access';

const modifyNode = (node: Node): Node =>
  [
    buildPropertyAccessExpressions,
    buildVariableDestructureExpressions,
    buildArgumentDestructureFunctionExpressions,
    buildExtensionClassExpressions,
    (): (() => Node)[] => [(): Node => node],
  ]
    .flatMap<() => Node>((builder: (node: Node) => (() => Node)[]): (() => Node)[] => builder(node))
    .find((expression: () => Node): unknown => expression)!
    .call<undefined, [], Node>(undefined);

export const buildVisitor = (): Visitor => {
  const visitor: Visitor = (node: Node): Node => modifyNode(visitEachChild<Node>(node, visitor, undefined));

  return visitor;
};
