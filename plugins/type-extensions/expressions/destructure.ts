/* eslint-disable no-use-before-define */
import {
  ArrayBindingElement,
  ArrayBindingPattern,
  ArrowFunction,
  BindingElement,
  BindingName,
  BindingPattern,
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
  isArrayBindingPattern,
  isArrowFunction,
  isBlock,
  isFunctionDeclaration,
  isFunctionExpression,
  isIdentifier,
  isMethodDeclaration,
  isObjectBindingPattern,
  isOmittedExpression,
  isVariableStatement,
} from 'typescript';
import { generateAlias } from '../alias/alias';
import { Property, TypeExtension } from '../config/config';
import { getContext } from '../context/context';
import { ArgName } from '../enums/arg-name';
import { isLiteralExpression } from '../literals/literal-expressions';
import { buildMergeCallExpression, buildProxyCallExpression } from '../runtime/runtime';

type DestructureDeclaration = BindingElement | VariableDeclaration | ParameterDeclaration;

type GenericFunctionDeclaration = FunctionDeclaration | FunctionExpression | ArrowFunction | MethodDeclaration;

type BindingPatternWrapper<T extends DestructureDeclaration, U extends BindingPattern> = T & { name: U };

type InitializerBindingPatternWrapper<T extends DestructureDeclaration, U extends BindingPattern> = BindingPatternWrapper<T, U> & {
  initializer: Expression;
};

type ObjectBindingPatternWrapper<T extends DestructureDeclaration> = BindingPatternWrapper<T, ObjectBindingPattern>;

type ArrayBindingPatternWrapper<T extends DestructureDeclaration> = BindingPatternWrapper<T, ArrayBindingPattern>;

type InitializerObjectBindingPatternWrapper<T extends DestructureDeclaration> = InitializerBindingPatternWrapper<T, ObjectBindingPattern>;

type InitializerArrayBindingPatternWrapper<T extends DestructureDeclaration> = InitializerBindingPatternWrapper<T, ArrayBindingPattern>;

const isObjectBindingPatternWrapper = <T extends DestructureDeclaration>(node: T): node is ObjectBindingPatternWrapper<T> =>
  isObjectBindingPattern(node.name);

const isArrayBindingPatternWrapper = <T extends DestructureDeclaration>(node: T): node is ArrayBindingPatternWrapper<T> =>
  isArrayBindingPattern(node.name);

const isInitializerObjectBindingPatternWrapper = <T extends DestructureDeclaration>(
  node: T,
): node is InitializerObjectBindingPatternWrapper<T> => isObjectBindingPatternWrapper(node) && node.initializer !== undefined;

const isInitializerArrayBindingPatternWrapper = <T extends DestructureDeclaration>(
  node: T,
): node is InitializerArrayBindingPatternWrapper<T> => isArrayBindingPatternWrapper(node) && node.initializer !== undefined;

const isDestructureProperty = (elements: NodeArray<BindingElement>): ((entry: [string, TypeExtension]) => boolean) => {
  const destructured: Identifier[] = elements
    .filter(({ dotDotDotToken }: BindingElement) => !dotDotDotToken)
    .map<PropertyName | BindingName>(({ propertyName, name }: BindingElement) => propertyName ?? name)
    .filter<Identifier>(isIdentifier);

  return ([, { properties }]: [string, TypeExtension]): boolean =>
    properties.some(({ name }: Property): boolean => destructured.some(({ text }: Identifier): boolean => text === name));
};

const isFunction = (node: Node): node is GenericFunctionDeclaration =>
  (isFunctionDeclaration(node) || isFunctionExpression(node) || isArrowFunction(node) || isMethodDeclaration(node)) && !!node.body;

const shouldUpdateInitializer = (extractedIdentifiers: Set<string>, { initializer }: DestructureDeclaration): boolean => {
  const visitEachChild = (node: Node): boolean =>
    (isIdentifier(node) && extractedIdentifiers.has(node.text)) || !!forEachChild<boolean>(node, visitEachChild);

  return !!initializer && visitEachChild(initializer);
};

const getExtensions = <T extends DestructureDeclaration>({
  name: { elements },
}: ObjectBindingPatternWrapper<T>): [string, TypeExtension][] => {
  const extensions: [string, TypeExtension][] = [...getContext().extensionsMap];
  const foundExtensions: [string, TypeExtension][] = extensions.filter(isDestructureProperty(elements));

  return foundExtensions.length || elements.every(({ dotDotDotToken }: BindingElement): boolean => !dotDotDotToken)
    ? foundExtensions
    : extensions;
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

const updateInitializerValue = (newValue: Expression, oldValue?: Expression): Expression =>
  oldValue ? factory.createBinaryExpression(newValue, factory.createToken(SyntaxKind.QuestionQuestionToken), oldValue) : newValue;

const updateInitializer = <T extends DestructureDeclaration>(
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
    updateInitializerValue(factory.createIdentifier(generateAlias(ArgName.Init, element)), element.initializer),
  );

  return [updateElement(element), [variable, ...variables]];
};

const updateObjectBindingPattern = <T extends DestructureDeclaration>(
  element: ObjectBindingPatternWrapper<T>,
  updateElement: (extensions: [string, TypeExtension][], element: T, objectBindingPattern: ObjectBindingPattern) => T,
  extractedIdentifiers: Set<string>,
): [T, VariableDeclaration[]] => {
  const extensions: [string, TypeExtension][] = getExtensions<T>(element);
  const identifiers: string[] = extensions.length ? readNestedIdentifiers(element.name) : [];
  identifiers.forEach((identifier: string): unknown => extractedIdentifiers.add(identifier));

  const [elements, variables]: [BindingElement[], VariableDeclaration[]] = mapBindingElements(element.name.elements, extractedIdentifiers);

  const updatedBindingPattern: ObjectBindingPattern = factory.updateObjectBindingPattern(element.name, elements);
  const updatedElement: T = updateElement(extensions, element, updatedBindingPattern);

  const updatedVariables: VariableDeclaration[] = extensions.length
    ? [
        factory.createVariableDeclaration(
          updatedBindingPattern,
          undefined,
          undefined,
          buildProxyCallExpression(factory.createIdentifier(generateAlias(ArgName.Arg, element)), extensions),
        ),
        ...variables,
      ]
    : variables;

  return [updatedElement, updatedVariables];
};

const updateArrayBindingPattern = <T extends DestructureDeclaration>(
  element: ArrayBindingPatternWrapper<T>,
  updateElement: (extensions: [string, TypeExtension][], element: T, bindingPattern: BindingPattern) => T,
  extractedIdentifiers: Set<string>,
): [T, VariableDeclaration[]] => {
  const [elements, variables]: [ArrayBindingElement[], VariableDeclaration[]] = mapArrayBindingElements(
    element.name.elements,
    extractedIdentifiers,
  );

  const updatedBindingPattern: ArrayBindingPattern = factory.updateArrayBindingPattern(element.name, elements);
  const updatedElement: T = updateElement([], element, updatedBindingPattern);

  return [updatedElement, variables];
};

const mapElement =
  <T extends DestructureDeclaration>(
    updateElement: (extensions: [string, TypeExtension][], element: T, bindingPattern: BindingPattern) => T,
    updateElementInitializer: (element: T) => T,
    extractedIdentifiers: Set<string>,
  ): ((element: T) => [T, VariableDeclaration[]]) =>
  (element: T): [T, VariableDeclaration[]] => {
    const [updatedElement, variables]: [T, VariableDeclaration[]] = isObjectBindingPatternWrapper<T>(element)
      ? updateObjectBindingPattern<T>(element, updateElement, extractedIdentifiers)
      : isArrayBindingPatternWrapper<T>(element)
        ? updateArrayBindingPattern<T>(element, updateElement, extractedIdentifiers)
        : [element, []];

    return shouldUpdateInitializer(extractedIdentifiers, updatedElement)
      ? updateInitializer<T>(extractedIdentifiers, updatedElement, updateElementInitializer, variables)
      : [updatedElement, variables];
  };

const mapBindingElements = (
  elements: NodeArray<BindingElement>,
  extractedIdentifiers: Set<string>,
): [BindingElement[], VariableDeclaration[]] =>
  elements
    .map<
      [BindingElement, VariableDeclaration[]]
    >(mapElement<BindingElement>(updateBindingElement, updateBindingElementInitializer, extractedIdentifiers))
    .reduce<[BindingElement[], VariableDeclaration[]]>(reduceElementVariables<BindingElement>, [[], []]);

const mapArrayElement =
  (extractedIdentifiers: Set<string>): ((element: ArrayBindingElement) => [ArrayBindingElement, VariableDeclaration[]]) =>
  (element: ArrayBindingElement): [ArrayBindingElement, VariableDeclaration[]] =>
    isOmittedExpression(element)
      ? [element, []]
      : mapElement<BindingElement>(updateBindingElement, updateBindingElementInitializer, extractedIdentifiers)(element);

const mapArrayBindingElements = (
  elements: NodeArray<ArrayBindingElement>,
  extractedIdentifiers: Set<string>,
): [ArrayBindingElement[], VariableDeclaration[]] =>
  elements
    .map<[ArrayBindingElement, VariableDeclaration[]]>(mapArrayElement(extractedIdentifiers))
    .reduce<[ArrayBindingElement[], VariableDeclaration[]]>(reduceElementVariables<ArrayBindingElement>, [[], []]);

const updateBindingElementInitializer = (element: BindingElement): BindingElement =>
  factory.updateBindingElement(
    element,
    element.dotDotDotToken,
    element.propertyName ?? (isIdentifier(element.name) ? element.name : undefined),
    factory.createIdentifier(generateAlias(ArgName.Init, element)),
    undefined,
  );

const updateBindingElement = (
  extensions: [string, TypeExtension][],
  element: BindingElement,
  bindingPattern: BindingPattern,
): BindingElement =>
  factory.updateBindingElement(
    element,
    element.dotDotDotToken,
    element.propertyName,
    extensions.length ? factory.createIdentifier(generateAlias(ArgName.Arg, element)) : bindingPattern,
    element.initializer,
  );

const buildVariableDestructureInitializer = (
  extensions: [string, TypeExtension][],
  variableDeclaration: InitializerObjectBindingPatternWrapper<VariableDeclaration>,
): [Expression, VariableDeclaration[]] =>
  extensions.length && !isIdentifier(variableDeclaration.initializer)
    ? [
        factory.createIdentifier(generateAlias(ArgName.Value, variableDeclaration.initializer)),
        [
          factory.createVariableDeclaration(
            generateAlias(ArgName.Value, variableDeclaration.initializer),
            undefined,
            undefined,
            variableDeclaration.initializer,
          ),
        ],
      ]
    : [variableDeclaration.initializer, []];

const updateVariableObjectDestructureDeclaration =
  (
    variableDeclaration: InitializerObjectBindingPatternWrapper<VariableDeclaration>,
  ): ((extensions: [string, TypeExtension][]) => VariableDeclaration[]) =>
  (extensions: [string, TypeExtension][]): VariableDeclaration[] => {
    const literalExtension: [string, TypeExtension] | undefined = extensions.find(isLiteralExpression(variableDeclaration.initializer));

    const [elements, variables]: [BindingElement[], VariableDeclaration[]] = mapBindingElements(
      variableDeclaration.name.elements,
      new Set<string>(),
    );

    const [initializer, initializerVariables]: [Expression, VariableDeclaration[]] = buildVariableDestructureInitializer(
      extensions,
      variableDeclaration,
    );

    const variable: VariableDeclaration = factory.updateVariableDeclaration(
      variableDeclaration,
      factory.updateObjectBindingPattern(variableDeclaration.name, elements),
      variableDeclaration.exclamationToken,
      variableDeclaration.type,
      extensions.length
        ? literalExtension
          ? buildMergeCallExpression(initializer, literalExtension[1].type)
          : buildProxyCallExpression(initializer, extensions)
        : initializer,
    );

    return [...initializerVariables, variable, ...variables];
  };

const updateVariableArrayDestructureDeclaration = (
  variableDeclaration: InitializerArrayBindingPatternWrapper<VariableDeclaration>,
): VariableDeclaration[] => {
  const [elements, variables]: [ArrayBindingElement[], VariableDeclaration[]] = mapArrayBindingElements(
    variableDeclaration.name.elements,
    new Set<string>(),
  );

  const variable: VariableDeclaration = factory.updateVariableDeclaration(
    variableDeclaration,
    factory.updateArrayBindingPattern(variableDeclaration.name, elements),
    variableDeclaration.exclamationToken,
    variableDeclaration.type,
    variableDeclaration.initializer,
  );
  return [variable, ...variables];
};

const mapVariableDeclaration = (variableDeclaration: VariableDeclaration): VariableDeclaration | VariableDeclaration[] =>
  isInitializerObjectBindingPatternWrapper<VariableDeclaration>(variableDeclaration)
    ? [getExtensions<VariableDeclaration>(variableDeclaration)].flatMap<VariableDeclaration>(
        updateVariableObjectDestructureDeclaration(variableDeclaration),
      )
    : isInitializerArrayBindingPatternWrapper<VariableDeclaration>(variableDeclaration)
      ? updateVariableArrayDestructureDeclaration(variableDeclaration)
      : variableDeclaration;

const buildVariableDestructureExpression =
  (variableStatement: VariableStatement): (() => Node) =>
  (): Node =>
    factory.updateVariableStatement(
      variableStatement,
      variableStatement.modifiers,
      factory.updateVariableDeclarationList(
        variableStatement.declarationList,
        variableStatement.declarationList.declarations.flatMap<VariableDeclaration>(mapVariableDeclaration),
      ),
    );

export const buildVariableDestructureExpressions = (node: Node): (() => Node)[] =>
  isVariableStatement(node) ? [buildVariableDestructureExpression(node)] : [];

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
  extensions: [string, TypeExtension][],
  parameter: ParameterDeclaration,
  bindingPattern: BindingPattern,
): ParameterDeclaration =>
  factory.updateParameterDeclaration(
    parameter,
    parameter.modifiers,
    parameter.dotDotDotToken,
    extensions.length ? factory.createIdentifier(generateAlias(ArgName.Arg, parameter)) : bindingPattern,
    parameter.questionToken,
    parameter.type,
    parameter.initializer,
  );

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
  (node: GenericFunctionDeclaration): (() => Node) =>
  (): Node => {
    const [parameters, variables]: [ParameterDeclaration[], VariableDeclaration[]] = node.parameters
      .map<
        [ParameterDeclaration, VariableDeclaration[]]
      >(mapElement<ParameterDeclaration>(updateParameterDeclaration, updateParameterDeclarationInitializer, new Set<string>()))
      .reduce<[ParameterDeclaration[], VariableDeclaration[]]>(reduceElementVariables<ParameterDeclaration>, [[], []]);

    return updateGenericFunctionDeclaration(node, parameters, updateFunctionBody(node, variables));
  };

export const buildArgumentDestructureFunctionExpressions = (node: Node): (() => Node)[] =>
  isFunction(node) ? [buildArgumentDestructureFunctionExpression(node)] : [];
