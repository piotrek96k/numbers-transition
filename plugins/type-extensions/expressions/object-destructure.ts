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
  SyntaxKind,
  VariableDeclaration,
  VariableStatement,
  factory,
  forEachChild,
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

type ObjectBindingPatternWrapper<T extends BindingElement | ParameterDeclaration> = T & { name: ObjectBindingPattern };

const isVariableDestructure = (node: VariableDeclaration): node is VariableDestructureDeclaration =>
  isObjectBindingPattern(node.name) && node.initializer !== undefined;

const isParamDestructure = (node: ParameterDeclaration): node is ObjectBindingPatternWrapper<ParameterDeclaration> =>
  isObjectBindingPattern(node.name);

const isFunction = (node: Node): node is GenericFunctionDeclaration =>
  (isFunctionDeclaration(node) || isFunctionExpression(node) || isArrowFunction(node) || isMethodDeclaration(node)) && !!node.body;

const isObjectBindingPatternElement = (node: BindingElement): node is ObjectBindingPatternWrapper<BindingElement> =>
  isObjectBindingPattern(node.name);

const isDestructureProperty = (elements: NodeArray<BindingElement>): ((entry: [string, TypeExtension]) => boolean) => {
  const destructured: Identifier[] = elements
    .map<PropertyName | BindingName>(({ propertyName, name }: BindingElement) => propertyName ?? name)
    .filter<Identifier>(isIdentifier);

  return ([, { properties }]: [string, TypeExtension]): boolean =>
    properties.some(({ name }: Property): boolean => destructured.some((id: Identifier): boolean => id.text === name));
};

const shouldUpdateInitializer = (extractedIdentifiers: Set<string>, { initializer }: BindingElement | ParameterDeclaration): boolean => {
  const visitEachChild = (node: Node): boolean =>
    (isIdentifier(node) && extractedIdentifiers.has(node.text)) || !!forEachChild<boolean>(node, visitEachChild);

  return !!initializer && visitEachChild(initializer);
};

const readNestedIdentifiers = ({ elements }: ObjectBindingPattern): string[] =>
  elements
    .map<BindingName>(({ name }: BindingElement): BindingName => name)
    .flatMap<string>((element: BindingName): string | string[] =>
      isIdentifier(element) ? element.text : isObjectBindingPattern(element) ? readNestedIdentifiers(element) : [],
    );

const readBindingIdentifiers = (binding: BindingName): string[] =>
  isIdentifier(binding) ? [binding.text] : isObjectBindingPattern(binding) ? readNestedIdentifiers(binding) : [];

const reduceElementVariables = <T>(
  [elements, variables]: [T[], VariableDeclaration[]],
  [element, newVariables]: [T, VariableDeclaration[]],
): [T[], VariableDeclaration[]] => [
  [...elements, element],
  [...variables, ...newVariables],
];

const updateInitializer = <T extends BindingElement | ParameterDeclaration>(
  extractedIdentifiers: Set<string>,
  element: T,
  updateElement: (element: T) => T,
  variables: VariableDeclaration[],
): [T, VariableDeclaration[]] => {
  readBindingIdentifiers(element.name).forEach((identifier: string): unknown => extractedIdentifiers.add(identifier));

  const variable: VariableDeclaration = factory.createVariableDeclaration(
    element.name,
    undefined,
    undefined,
    factory.createBinaryExpression(
      factory.createIdentifier(generateAlias(ArgName.Init, element)),
      factory.createToken(SyntaxKind.QuestionQuestionToken),
      element.initializer ?? factory.createVoidZero(),
    ),
  );

  return [updateElement(element), [variable, ...variables]];
};

/* eslint-disable no-use-before-define */
const updateObjectBindingPattern = <T extends BindingElement | ParameterDeclaration>(
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  element: ObjectBindingPatternWrapper<T>,
  updateElement: (
    element: ObjectBindingPatternWrapper<T>,
    elements: BindingElement[],
    extensions: [string, TypeExtension][],
  ) => [T, ObjectBindingPattern],
  extractedIdentifiers: Set<string>,
): [T, VariableDeclaration[]] => {
  const extensions: [string, TypeExtension][] = [...extensionsMap].filter(isDestructureProperty(element.name.elements));

  const identifiers: string[] = extensions.length ? readNestedIdentifiers(element.name) : [];

  identifiers.forEach((identifier: string): unknown => extractedIdentifiers.add(identifier));

  const [elements, variables]: [BindingElement[], VariableDeclaration[]] = mapBindingElements(
    extensionsMap,
    constAliases,
    usedExtensions,
    isExtensionsFile,
    element.name.elements,
    extractedIdentifiers,
  );

  const [updatedElement, updatedBindingPattern]: [T, ObjectBindingPattern] = updateElement(element, elements, extensions);

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
            factory.createIdentifier(generateAlias(ArgName.Arg, element)),
            true,
          ),
        ),
        ...variables,
      ]
    : variables;

  return [updatedElement, updatedVariables];
};

const mapElement =
  <T extends BindingElement | ParameterDeclaration>(
    extensionsMap: Map<string, TypeExtension>,
    constAliases: Map<string, string>,
    usedExtensions: Map<string, string>,
    isExtensionsFile: boolean,
    isObjectBindingPatternElement: (node: T) => node is ObjectBindingPatternWrapper<T>,
    updateElement: (
      element: ObjectBindingPatternWrapper<T>,
      elements: BindingElement[],
      extensions: [string, TypeExtension][],
    ) => [T, ObjectBindingPattern],
    updateElementInitializer: (element: T) => T,
    extractedIdentifiers: Set<string>,
  ): ((element: T) => [T, VariableDeclaration[]]) =>
  (element: T): [T, VariableDeclaration[]] => {
    const [updatedElement, variables]: [T, VariableDeclaration[]] = isObjectBindingPatternElement(element)
      ? updateObjectBindingPattern<T>(
          extensionsMap,
          constAliases,
          usedExtensions,
          isExtensionsFile,
          element,
          updateElement,
          extractedIdentifiers,
        )
      : [element, []];

    return shouldUpdateInitializer(extractedIdentifiers, updatedElement)
      ? updateInitializer<T>(extractedIdentifiers, updatedElement, updateElementInitializer, variables)
      : [updatedElement, variables];
  };

const mapBindingElements = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  elements: NodeArray<BindingElement>,
  extractedIdentifiers: Set<string> = new Set<string>(),
): [BindingElement[], VariableDeclaration[]] =>
  elements
    .map<
      [BindingElement, VariableDeclaration[]]
    >(mapElement<BindingElement>(extensionsMap, constAliases, usedExtensions, isExtensionsFile, isObjectBindingPatternElement, updateBindingElement, updateBindingElementInitializer, extractedIdentifiers))
    .reduce<[BindingElement[], VariableDeclaration[]]>(reduceElementVariables<BindingElement>, [[], []]);

const updateBindingElementInitializer = (element: BindingElement): BindingElement =>
  factory.updateBindingElement(
    element,
    element.dotDotDotToken,
    element.propertyName ?? (isIdentifier(element.name) ? element.name : undefined),
    factory.createIdentifier(generateAlias(ArgName.Init, element)),
    undefined,
  );

const updateBindingElement = (
  element: ObjectBindingPatternWrapper<BindingElement>,
  elements: BindingElement[],
  extensions: [string, TypeExtension][],
): [BindingElement, ObjectBindingPattern] => {
  const updatedBindingPattern: ObjectBindingPattern = factory.updateObjectBindingPattern(element.name, elements);

  const updatedBinding: BindingElement = factory.updateBindingElement(
    element,
    element.dotDotDotToken,
    element.propertyName,
    extensions.length ? factory.createIdentifier(generateAlias(ArgName.Arg, element)) : updatedBindingPattern,
    element.initializer,
  );

  return [updatedBinding, updatedBindingPattern];
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

const updateParameterDeclarationInitializer = (parameter: ParameterDeclaration): ParameterDeclaration =>
  factory.updateParameterDeclaration(
    parameter,
    parameter.modifiers,
    parameter.dotDotDotToken,
    factory.createIdentifier(generateAlias(ArgName.Init, parameter)),
    parameter.questionToken,
    parameter.type,
    undefined,
  );

const updateParameterDeclaration = (
  parameter: ObjectBindingPatternWrapper<ParameterDeclaration>,
  elements: BindingElement[],
  extensions: [string, TypeExtension][],
): [ParameterDeclaration, ObjectBindingPattern] => {
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

  return [updatedParam, parameter.name];
};

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
      >(mapElement<ParameterDeclaration>(extensionsMap, constAliases, usedExtensions, isExtensionsFile, isParamDestructure, updateParameterDeclaration, updateParameterDeclarationInitializer, new Set<string>()))
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
