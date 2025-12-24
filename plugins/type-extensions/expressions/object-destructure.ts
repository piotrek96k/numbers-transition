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

const updateBindingInitializer = (
  extractedIdentifiers: Set<string>,
  element: BindingElement,
  variables: VariableDeclaration[],
): [BindingElement, VariableDeclaration[]] => {
  readBindingIdentifiers(element.name).forEach((identifier: string): unknown => extractedIdentifiers.add(identifier));

  const updatedElement: BindingElement = factory.updateBindingElement(
    element,
    element.dotDotDotToken,
    element.propertyName ?? (isIdentifier(element.name) ? element.name : undefined),
    factory.createIdentifier(generateAlias(ArgName.Init, element)),
    undefined,
  );

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

  return [updatedElement, [variable, ...variables]];
};

/* eslint-disable no-use-before-define */
const mapBindingElement =
  (
    extensionsMap: Map<string, TypeExtension>,
    constAliases: Map<string, string>,
    usedExtensions: Map<string, string>,
    isExtensionsFile: boolean,
    extractedIdentifiers: Set<string>,
  ): ((element: BindingElement) => [BindingElement, VariableDeclaration[]]) =>
  (element: BindingElement): [BindingElement, VariableDeclaration[]] => {
    const [updatedElement, variables]: [BindingElement, VariableDeclaration[]] = isObjectBindingPatternElement(element)
      ? updateObjectBindingPattern(extensionsMap, constAliases, usedExtensions, isExtensionsFile, element, extractedIdentifiers)
      : [element, []];

    return shouldUpdateInitializer(extractedIdentifiers, updatedElement)
      ? updateBindingInitializer(extractedIdentifiers, updatedElement, variables)
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
    >(mapBindingElement(extensionsMap, constAliases, usedExtensions, isExtensionsFile, extractedIdentifiers))
    .reduce<[BindingElement[], VariableDeclaration[]]>(reduceElementVariables<BindingElement>, [[], []]);

const updateObjectBindingPattern = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  binding: BindingPatternBindingElement,
  extractedIdentifiers: Set<string>,
): [BindingElement, VariableDeclaration[]] => {
  const extensions: [string, TypeExtension][] = [...extensionsMap].filter(isDestructureProperty(binding.name.elements));

  const identifiers: string[] = extensions.length ? readNestedIdentifiers(binding.name) : [];

  identifiers.forEach((identifier: string): unknown => extractedIdentifiers.add(identifier));

  const [elements, variables]: [BindingElement[], VariableDeclaration[]] = mapBindingElements(
    extensionsMap,
    constAliases,
    usedExtensions,
    isExtensionsFile,
    binding.name.elements,
    extractedIdentifiers,
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

const updateParameterInitializer = (
  extractedIdentifiers: Set<string>,
  parameter: ParameterDeclaration,
  variables: VariableDeclaration[],
): [ParameterDeclaration, VariableDeclaration[]] => {
  readBindingIdentifiers(parameter.name).forEach((identifier: string): unknown => extractedIdentifiers.add(identifier));

  const updatedParameter: ParameterDeclaration = factory.updateParameterDeclaration(
    parameter,
    parameter.modifiers,
    parameter.dotDotDotToken,
    factory.createIdentifier(generateAlias(ArgName.Init, parameter)),
    parameter.questionToken,
    parameter.type,
    undefined,
  );

  const variable: VariableDeclaration = factory.createVariableDeclaration(
    parameter.name,
    undefined,
    undefined,
    factory.createBinaryExpression(
      factory.createIdentifier(generateAlias(ArgName.Init, parameter)),
      factory.createToken(SyntaxKind.QuestionQuestionToken),
      parameter.initializer ?? factory.createVoidZero(),
    ),
  );

  return [updatedParameter, [variable, ...variables]];
};

const updateParameter = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  parameter: BindingPatternParameterDeclaration,
  extractedIdentifiers: Set<string>,
): [ParameterDeclaration, VariableDeclaration[]] => {
  const extensions: [string, TypeExtension][] = [...extensionsMap].filter(isDestructureProperty(parameter.name.elements));

  const identifiers: string[] = extensions.length ? readNestedIdentifiers(parameter.name) : [];

  identifiers.forEach((identifier: string): unknown => extractedIdentifiers.add(identifier));

  const [elements, variables]: [BindingElement[], VariableDeclaration[]] = mapBindingElements(
    extensionsMap,
    constAliases,
    usedExtensions,
    isExtensionsFile,
    parameter.name.elements,
    extractedIdentifiers,
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
    extractedIdentifiers: Set<string>,
  ): ((parameter: ParameterDeclaration) => [ParameterDeclaration, VariableDeclaration[]]) =>
  (parameter: ParameterDeclaration): [ParameterDeclaration, VariableDeclaration[]] => {
    const [updatedParameter, variables]: [ParameterDeclaration, VariableDeclaration[]] = isParamDestructure(parameter)
      ? updateParameter(extensionsMap, constAliases, usedExtensions, isExtensionsFile, parameter, extractedIdentifiers)
      : [parameter, []];

    return shouldUpdateInitializer(extractedIdentifiers, updatedParameter)
      ? updateParameterInitializer(extractedIdentifiers, updatedParameter, variables)
      : [updatedParameter, variables];
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
      >(mapFunctionParameter(extensionsMap, constAliases, usedExtensions, isExtensionsFile, new Set<string>()))
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
