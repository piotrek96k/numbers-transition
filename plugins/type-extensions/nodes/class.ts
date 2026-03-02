import {
  Block,
  ClassDeclaration,
  ClassElement,
  Identifier,
  MethodDeclaration,
  ModifierLike,
  Node,
  NodeFlags,
  SyntaxKind,
  VariableStatement,
  factory,
  isArrowFunction,
  isClassDeclaration,
  isClassExpression,
  isFunctionLike,
  isMethodDeclaration,
  visitEachChild,
} from 'typescript';
import { getContext } from '../context/context';
import { VariableName } from '../enums/variable-name';
import { buildGetThisValueFunctionCall } from '../runtime/get-this-value';

const isExtensionClass = (node: Node): node is ClassDeclaration =>
  isClassDeclaration(node) && !!node.name && getContext().extensionsMap.has(node.name?.text);

const isClassMethod = (node: ClassElement): node is MethodDeclaration =>
  isMethodDeclaration(node) && !node.modifiers?.some(({ kind }: ModifierLike): boolean => kind === SyntaxKind.StaticKeyword);

const hasOwnThis = (node: Node): boolean =>
  (isFunctionLike(node) && !isArrowFunction(node)) || isClassDeclaration(node) || isClassExpression(node);

const rewriteThis = (node: Node): Node =>
  node.kind === SyntaxKind.ThisKeyword
    ? factory.createIdentifier(getContext().constAliases.get(VariableName.Self)!)
    : hasOwnThis(node)
      ? node
      : visitEachChild(node, rewriteThis, undefined);

const createSelfVariable = (cls: Identifier): VariableStatement =>
  factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          getContext().constAliases.get(VariableName.Self)!,
          undefined,
          undefined,
          buildGetThisValueFunctionCall(cls),
        ),
      ],
      NodeFlags.Const,
    ),
  );

const updateClassMethodBody = (cls: Identifier, node: Block): Block =>
  factory.updateBlock(node, [createSelfVariable(cls), ...visitEachChild(node, rewriteThis, undefined).statements]);

const updateClassMethod = (cls: Identifier, node: MethodDeclaration): MethodDeclaration =>
  factory.updateMethodDeclaration(
    node,
    node.modifiers,
    node.asteriskToken,
    node.name,
    node.questionToken,
    node.typeParameters,
    node.parameters,
    node.type,
    node.body ? updateClassMethodBody(cls, node.body) : node.body,
  );

const updateClass =
  (className: Identifier): ((node: ClassElement) => ClassElement) =>
  (node: ClassElement): ClassElement =>
    isClassMethod(node) ? updateClassMethod(className, node) : node;

const updateExtensionClass = (node: ClassDeclaration): ClassDeclaration =>
  factory.updateClassDeclaration(
    node,
    node.modifiers,
    node.name,
    node.typeParameters,
    node.heritageClauses,
    node.members.map<ClassElement>(updateClass(node.name!)),
  );

export const buildExtensionClassExpressions = (node: Node): (() => Node)[] =>
  isExtensionClass(node) ? [(): ClassDeclaration => updateExtensionClass(node)] : [];
