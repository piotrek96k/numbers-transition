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
import { TypeExtension } from '../config/config';
import { getContext } from '../context/context';
import { buildGetThisValueCallExpression } from '../runtime/get-this-value';
import { ConstName } from '../enums/const-name';

const isExtensionClassExpression = (node: Node): node is ClassDeclaration =>
  getContext().isExtensionsFile &&
  isClassDeclaration(node) &&
  !!node.name &&
  [...getContext().extensionsMap.values()].some(
    ({ implementationClass }: TypeExtension): boolean => implementationClass === node.name?.text,
  );

const isClassMethodDeclaration = (node: ClassElement): node is MethodDeclaration =>
  isMethodDeclaration(node) && !node.modifiers?.some(({ kind }: ModifierLike): boolean => kind === SyntaxKind.StaticKeyword);

const hasOwnThis = (node: Node): boolean =>
  (isFunctionLike(node) && !isArrowFunction(node)) || isClassDeclaration(node) || isClassExpression(node);

const rewriteThis = (node: Node): Node =>
  node.kind === SyntaxKind.ThisKeyword
    ? factory.createIdentifier(getContext().constAliases.get(ConstName.Self)!)
    : hasOwnThis(node)
      ? node
      : visitEachChild(node, rewriteThis, undefined);

const createSelfVariableStatement = (cls: Identifier): VariableStatement =>
  factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          getContext().constAliases.get(ConstName.Self)!,
          undefined,
          undefined,
          buildGetThisValueCallExpression(cls),
        ),
      ],
      NodeFlags.Const,
    ),
  );

const updateClassMethodDeclarationBody = (cls: Identifier, node: Block): Block =>
  factory.updateBlock(node, [createSelfVariableStatement(cls), ...visitEachChild(node, rewriteThis, undefined).statements]);

const updateClassMethodDeclaration = (cls: Identifier, node: MethodDeclaration): MethodDeclaration =>
  factory.updateMethodDeclaration(
    node,
    node.modifiers,
    node.asteriskToken,
    node.name,
    node.questionToken,
    node.typeParameters,
    node.parameters,
    node.type,
    node.body ? updateClassMethodDeclarationBody(cls, node.body) : node.body,
  );

const updateClassElement =
  (className: Identifier): ((node: ClassElement) => ClassElement) =>
  (node: ClassElement): ClassElement =>
    isClassMethodDeclaration(node) ? updateClassMethodDeclaration(className, node) : node;

const updateExtensionClassExpression = (node: ClassDeclaration): ClassDeclaration =>
  factory.updateClassDeclaration(
    node,
    node.modifiers,
    node.name,
    node.typeParameters,
    node.heritageClauses,
    node.members.map<ClassElement>(updateClassElement(node.name!)),
  );

export const buildExtensionClassExpressions = (node: Node): (() => Node)[] =>
  isExtensionClassExpression(node) ? [(): ClassDeclaration => updateExtensionClassExpression(node)] : [];
