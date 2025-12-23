import {
  ArrowFunction,
  BindingElement,
  BindingName,
  Block,
  Expression,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  MethodDeclaration,
  Node,
  NodeArray,
  NodeFlags,
  ObjectBindingPattern,
  ParameterDeclaration,
  PropertyName,
  VariableDeclaration,
  VariableStatement,
  factory,
  isArrowFunction,
  isBlock,
  isFunctionDeclaration,
  isFunctionExpression,
  isIdentifier,
  isMethodDeclaration,
  isObjectBindingPattern,
  isVariableStatement,
} from 'typescript';
import { generateAlias } from '../alias/alias';
import { Property, TypeExtension } from '../config/config';
import { ArgName } from '../enums/arg-name';
import { ConstName } from '../enums/const-name';
import { readImportName } from '../imports/imports';
import { isLiteralExpression } from '../literals/literal-expressions';
import { buildProxyCallExpression } from '../proxy/runtime-proxy';

interface VariableDestructureDeclaration extends VariableDeclaration {
  name: ObjectBindingPattern;
  initializer: Expression;
}

type GenericFunctionDeclaration = FunctionDeclaration | FunctionExpression | ArrowFunction | MethodDeclaration;

interface BindingPatternParameterDeclaration extends ParameterDeclaration {
  name: ObjectBindingPattern;
}

interface BindingPatternBindingElement extends BindingElement {
  name: ObjectBindingPattern;
}

const isVariableDestructure = (node: VariableDeclaration): node is VariableDestructureDeclaration =>
  isObjectBindingPattern(node.name) && node.initializer !== undefined;

const isParamDestructure = (node: ParameterDeclaration): node is BindingPatternParameterDeclaration => isObjectBindingPattern(node.name);

const isFunction = (node: Node): node is GenericFunctionDeclaration =>
  (isFunctionDeclaration(node) || isFunctionExpression(node) || isArrowFunction(node) || isMethodDeclaration(node)) && !!node.body;

const isObjectBindingPatternElement = (node: BindingElement): node is BindingPatternBindingElement => isObjectBindingPattern(node.name);

const isDestructureProperty = (elements: NodeArray<BindingElement>): ((entry: [string, TypeExtension]) => boolean) => {
  const destructured: Identifier[] = elements
    .map<PropertyName | BindingName>(({ propertyName, name }: BindingElement) => propertyName ?? name)
    .filter<Identifier>(isIdentifier);

  return ([, { properties }]: [string, TypeExtension]): boolean =>
    properties.some(({ name }: Property): boolean => destructured.some((id: Identifier): boolean => id.text === name));
};

const reduceElementVariables = <T>(
  [elements, variables]: [T[], VariableDeclaration[]],
  [element, newVariables]: [T, VariableDeclaration[]],
): [T[], VariableDeclaration[]] => [
  [...elements, element],
  [...variables, ...newVariables],
];

/* eslint-disable no-use-before-define */
const mapBindingElement =
  (
    extensionsMap: Map<string, TypeExtension>,
    constAliases: Map<string, string>,
    usedExtensions: Map<string, string>,
    isExtensionsFile: boolean,
  ): ((element: BindingElement) => [BindingElement, VariableDeclaration[]]) =>
  (element: BindingElement): [BindingElement, VariableDeclaration[]] =>
    isObjectBindingPatternElement(element)
      ? updateObjectBindingPattern(extensionsMap, constAliases, usedExtensions, isExtensionsFile, element)
      : [element, []];

const mapBindingElements = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  elements: NodeArray<BindingElement>,
): [BindingElement[], VariableDeclaration[]] =>
  elements
    .map<[BindingElement, VariableDeclaration[]]>(mapBindingElement(extensionsMap, constAliases, usedExtensions, isExtensionsFile))
    .reduce<[BindingElement[], VariableDeclaration[]]>(reduceElementVariables<BindingElement>, [[], []]);

const updateObjectBindingPattern = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  binding: BindingPatternBindingElement,
): [BindingElement, VariableDeclaration[]] => {
  const extensions: [string, TypeExtension][] = [...extensionsMap].filter(isDestructureProperty(binding.name.elements));

  const [elements, variables]: [BindingElement[], VariableDeclaration[]] = mapBindingElements(
    extensionsMap,
    constAliases,
    usedExtensions,
    isExtensionsFile,
    binding.name.elements,
  );

  const updatedBindingPattern: ObjectBindingPattern = factory.updateObjectBindingPattern(binding.name, elements);

  const updatedBinding: BindingElement = factory.updateBindingElement(
    binding,
    binding.dotDotDotToken,
    binding.propertyName,
    extensions.length ? factory.createIdentifier(generateAlias(ArgName.Arg, binding)) : updatedBindingPattern,
    binding.initializer,
  );

  const updatedVariables: VariableDeclaration[] = extensions.length
    ? [
        factory.createVariableDeclaration(
          updatedBindingPattern,
          undefined,
          undefined,
          buildProxyCallExpression(
            extensions,
            constAliases,
            usedExtensions,
            isExtensionsFile,
            factory.createIdentifier(generateAlias(ArgName.Arg, binding)),
            true,
          ),
        ),
        ...variables,
      ]
    : variables;

  return [updatedBinding, updatedVariables];
};

const buildVariableDestructureLiteralExpression = (
  extensions: [string, TypeExtension][],
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  variableDeclaration: VariableDestructureDeclaration,
): Expression | undefined =>
  extensions
    .filter(isLiteralExpression(variableDeclaration.initializer))
    .map<Expression>(
      ([, { type }]: [string, TypeExtension]): Expression =>
        factory.createCallExpression(
          factory.createIdentifier(
            readImportName(constAliases.get(ConstName.Merge)!, usedExtensions, isExtensionsFile, variableDeclaration.initializer),
          ),
          undefined,
          [variableDeclaration.initializer, factory.createStringLiteral(type)],
        ),
    )
    .pop();

const updateVariableDestructureDeclaration =
  (
    extensionsMap: Map<string, TypeExtension>,
    constAliases: Map<string, string>,
    usedExtensions: Map<string, string>,
    isExtensionsFile: boolean,
    variableDeclaration: VariableDestructureDeclaration,
  ): ((extensions: [string, TypeExtension][]) => VariableDeclaration[]) =>
  (extensions: [string, TypeExtension][]): VariableDeclaration[] => {
    const [elements, variables]: [BindingElement[], VariableDeclaration[]] = mapBindingElements(
      extensionsMap,
      constAliases,
      usedExtensions,
      isExtensionsFile,
      variableDeclaration.name.elements,
    );

    const variable: VariableDeclaration = factory.updateVariableDeclaration(
      variableDeclaration,
      factory.updateObjectBindingPattern(variableDeclaration.name, elements),
      variableDeclaration.exclamationToken,
      variableDeclaration.type,
      extensions.length
        ? (buildVariableDestructureLiteralExpression(extensions, constAliases, usedExtensions, isExtensionsFile, variableDeclaration) ??
            buildProxyCallExpression(extensions, constAliases, usedExtensions, isExtensionsFile, variableDeclaration.initializer, true))
        : variableDeclaration.initializer,
    );

    return [variable, ...variables];
  };

const mapVariableDeclaration =
  (
    extensionsMap: Map<string, TypeExtension>,
    constAliases: Map<string, string>,
    usedExtensions: Map<string, string>,
    isExtensionsFile: boolean,
  ): ((variableDeclaration: VariableDeclaration) => VariableDeclaration | VariableDeclaration[]) =>
  (variableDeclaration: VariableDeclaration): VariableDeclaration | VariableDeclaration[] =>
    isVariableDestructure(variableDeclaration)
      ? [[...extensionsMap].filter(isDestructureProperty(variableDeclaration.name.elements))].flatMap<VariableDeclaration>(
          updateVariableDestructureDeclaration(extensionsMap, constAliases, usedExtensions, isExtensionsFile, variableDeclaration),
        )
      : variableDeclaration;

const buildVariableDestructureExpression =
  (
    extensionsMap: Map<string, TypeExtension>,
    constAliases: Map<string, string>,
    usedExtensions: Map<string, string>,
    isExtensionsFile: boolean,
    variableStatement: VariableStatement,
  ): (() => Node) =>
  (): Node =>
    factory.updateVariableStatement(
      variableStatement,
      variableStatement.modifiers,
      factory.updateVariableDeclarationList(
        variableStatement.declarationList,
        variableStatement.declarationList.declarations.flatMap<VariableDeclaration>(
          mapVariableDeclaration(extensionsMap, constAliases, usedExtensions, isExtensionsFile),
        ),
      ),
    );

export const buildVariableDestructureExpressions = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  node: Node,
): (() => Node)[] =>
  isVariableStatement(node)
    ? [buildVariableDestructureExpression(extensionsMap, constAliases, usedExtensions, isExtensionsFile, node)]
    : [];

const updateFunctionParameter = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  parameter: BindingPatternParameterDeclaration,
): [ParameterDeclaration, VariableDeclaration[]] => {
  const extensions: [string, TypeExtension][] = [...extensionsMap].filter(isDestructureProperty(parameter.name.elements));

  const [elements, variables]: [BindingElement[], VariableDeclaration[]] = mapBindingElements(
    extensionsMap,
    constAliases,
    usedExtensions,
    isExtensionsFile,
    parameter.name.elements,
  );

  const updatedParam: ParameterDeclaration = factory.updateParameterDeclaration(
    parameter,
    parameter.modifiers,
    parameter.dotDotDotToken,
    extensions.length
      ? factory.createIdentifier(generateAlias(ArgName.Arg, parameter))
      : factory.updateObjectBindingPattern(parameter.name, elements),
    parameter.questionToken,
    parameter.type,
    parameter.initializer,
  );

  const updatedVariables: VariableDeclaration[] = extensions.length
    ? [
        factory.createVariableDeclaration(
          parameter.name,
          undefined,
          undefined,
          buildProxyCallExpression(
            extensions,
            constAliases,
            usedExtensions,
            isExtensionsFile,
            factory.createIdentifier(generateAlias(ArgName.Arg, parameter)),
            true,
          ),
        ),
        ...variables,
      ]
    : variables;

  return [updatedParam, updatedVariables];
};

const mapFunctionParameter =
  (
    extensionsMap: Map<string, TypeExtension>,
    constAliases: Map<string, string>,
    usedExtensions: Map<string, string>,
    isExtensionsFile: boolean,
  ): ((parameter: ParameterDeclaration) => [ParameterDeclaration, VariableDeclaration[]]) =>
  (parameter: ParameterDeclaration): [ParameterDeclaration, VariableDeclaration[]] =>
    isParamDestructure(parameter)
      ? updateFunctionParameter(extensionsMap, constAliases, usedExtensions, isExtensionsFile, parameter)
      : [parameter, []];

const updateFunctionBody = (declaration: GenericFunctionDeclaration, variables: VariableDeclaration[]): Block | undefined =>
  variables.length
    ? factory.createBlock([
        factory.createVariableStatement(undefined, factory.createVariableDeclarationList(variables, NodeFlags.Const)),
        ...(isBlock(declaration.body!) ? declaration.body : factory.createBlock([factory.createReturnStatement(declaration.body)], true))
          .statements,
      ])
    : undefined;

const updateArrowFunction = (arrowFunction: ArrowFunction, parameters: ParameterDeclaration[], body: Block | undefined) =>
  factory.updateArrowFunction(
    arrowFunction,
    arrowFunction.modifiers,
    arrowFunction.typeParameters,
    parameters,
    arrowFunction.type,
    arrowFunction.equalsGreaterThanToken,
    body ?? arrowFunction.body,
  );

const updateFunctionDeclaration = (functionDeclaration: FunctionDeclaration, parameters: ParameterDeclaration[], body: Block | undefined) =>
  factory.updateFunctionDeclaration(
    functionDeclaration,
    functionDeclaration.modifiers,
    functionDeclaration.asteriskToken,
    functionDeclaration.name,
    functionDeclaration.typeParameters,
    parameters,
    functionDeclaration.type,
    body ?? functionDeclaration.body,
  );

const updateFunctionExpression = (functionExpression: FunctionExpression, parameters: ParameterDeclaration[], body: Block | undefined) =>
  factory.updateFunctionExpression(
    functionExpression,
    functionExpression.modifiers,
    functionExpression.asteriskToken,
    functionExpression.name,
    functionExpression.typeParameters,
    parameters,
    functionExpression.type,
    body ?? functionExpression.body,
  );

const updateMethodDeclaration = (methodDeclaration: MethodDeclaration, parameters: ParameterDeclaration[], body: Block | undefined) =>
  factory.updateMethodDeclaration(
    methodDeclaration,
    methodDeclaration.modifiers,
    methodDeclaration.asteriskToken,
    methodDeclaration.name,
    methodDeclaration.questionToken,
    methodDeclaration.typeParameters,
    parameters,
    methodDeclaration.type,
    body ?? methodDeclaration.body,
  );

const updateGenericFunctionDeclaration = (
  declaration: GenericFunctionDeclaration,
  parameters: ParameterDeclaration[],
  body: Block | undefined,
): GenericFunctionDeclaration =>
  [
    isArrowFunction(declaration) && updateArrowFunction(declaration, parameters, body),
    isFunctionDeclaration(declaration) && updateFunctionDeclaration(declaration, parameters, body),
    isFunctionExpression(declaration) && updateFunctionExpression(declaration, parameters, body),
    isMethodDeclaration(declaration) && updateMethodDeclaration(declaration, parameters, body),
  ].find<GenericFunctionDeclaration>(
    (declaration: GenericFunctionDeclaration | false): declaration is GenericFunctionDeclaration => !!declaration,
  )!;

const buildArgumentDestructureFunctionExpression =
  (
    extensionsMap: Map<string, TypeExtension>,
    constAliases: Map<string, string>,
    usedExtensions: Map<string, string>,
    isExtensionsFile: boolean,
    node: GenericFunctionDeclaration,
  ): (() => Node) =>
  (): Node => {
    const [parameters, variables]: [ParameterDeclaration[], VariableDeclaration[]] = node.parameters
      .map<
        [ParameterDeclaration, VariableDeclaration[]]
      >(mapFunctionParameter(extensionsMap, constAliases, usedExtensions, isExtensionsFile))
      .reduce<[ParameterDeclaration[], VariableDeclaration[]]>(reduceElementVariables<ParameterDeclaration>, [[], []]);

    return updateGenericFunctionDeclaration(node, parameters, updateFunctionBody(node, variables));
  };

export const buildArgumentDestructureFunctionExpressions = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  node: Node,
): (() => Node)[] =>
  isFunction(node) ? [buildArgumentDestructureFunctionExpression(extensionsMap, constAliases, usedExtensions, isExtensionsFile, node)] : [];
