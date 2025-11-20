import { readFileSync } from 'fs';
import { dirname, relative, resolve } from 'path';
import { cwd } from 'process';
import { TransformHook, TransformResult } from 'rollup';
import {
  CallExpression,
  ClassDeclaration,
  ClassElement,
  Expression,
  Identifier,
  ImportDeclaration,
  ImportSpecifier,
  MethodDeclaration,
  ModifierLike,
  NamedImportBindings,
  NamedImports,
  NewLineKind,
  Node,
  NodeArray,
  NodeFlags,
  PropertyAccessExpression,
  PropertyDeclaration,
  ScriptKind,
  ScriptTarget,
  SourceFile,
  Statement,
  SyntaxKind,
  Visitor,
  createPrinter,
  createSourceFile,
  factory,
  findConfigFile,
  isArrayLiteralExpression,
  isArrowFunction,
  isBigIntLiteral,
  isCallChain,
  isCallExpression,
  isClassDeclaration,
  isExpressionStatement,
  isFunctionExpression,
  isIdentifier,
  isImportDeclaration,
  isMethodDeclaration,
  isNamedImports,
  isNewExpression,
  isNumericLiteral,
  isPropertyAccessChain,
  isPropertyAccessExpression,
  isPropertyDeclaration,
  isRegularExpressionLiteral,
  isStringLiteral,
  isTemplateLiteral,
  parseJsonConfigFileContent,
  readConfigFile,
  sys,
  visitEachChild,
} from 'typescript';
import { HmrContext, Plugin } from 'vite';

enum Encoding {
  Utf8 = 'utf-8',
}

enum JsType {
  Boolean = 'Boolean',
  Number = 'Number',
  BigInt = 'BigInt',
  String = 'String',
  RegExp = 'RegExp',
  Object = 'Object',
  Array = 'Array',
}

enum TempSourceFile {
  Name = 'temp.ts',
}

enum ValuePlaceholder {
  Placeholder = 'VALUE',
}

interface NamedClassDeclaration extends ClassDeclaration {
  name: Identifier;
}

interface IdentifierMethodDeclaration extends MethodDeclaration {
  name: Identifier;
}

interface IdentifierPropertyDeclaration extends PropertyDeclaration {
  name: Identifier;
}

type FunctionDeclaration = IdentifierMethodDeclaration | IdentifierPropertyDeclaration;

interface CallNode extends CallExpression {
  expression: PropertyAccessExpression;
}

type PropertyOrCallNode = CallNode | PropertyAccessExpression;

type PropertyOrCallTuple =
  | [PropertyOrCallNode, PropertyAccessExpression, NodeArray<Expression>]
  | [PropertyOrCallNode, PropertyAccessExpression];

interface InternalConfig {
  allowedFiles: Set<string>;
  extensionsMap: Map<string, TypeExtension>;
}

interface Method {
  name: string;
  isStatic: boolean;
}

interface Extension {
  type: string;
  typeCheck: string;
}

interface TypeExtension extends Extension {
  methods: Method[];
}

interface TypeExtensionsConfig {
  tsConfig: string;
  extensionsFilePath: string;
  extensions: Record<string, Extension>;
}

const literalChecksMap: Map<JsType, ((node: Node) => boolean)[]> = new Map<JsType, ((node: Node) => boolean)[]>([
  [
    JsType.Boolean,
    [(node: Node): boolean => [SyntaxKind.TrueKeyword, SyntaxKind.FalseKeyword].some((kind: SyntaxKind): boolean => kind === node.kind)],
  ],
  [JsType.Number, [isNumericLiteral]],
  [JsType.BigInt, [isBigIntLiteral]],
  [JsType.String, [isStringLiteral, isTemplateLiteral]],
  [JsType.RegExp, [isRegularExpressionLiteral]],
  [JsType.Array, [isArrayLiteralExpression]],
]);

const isConstructorCall = (node: Node, type: JsType): boolean =>
  (isCallExpression(node) || isNewExpression(node)) && isIdentifier(node.expression) && node.expression.text === type;

const literalExpressionsMap: Map<string, (node: Node) => boolean> = new Map<JsType, (node: Node) => boolean>(
  [...literalChecksMap].map<[JsType, (node: Node) => boolean]>(([jsType, checks]: [JsType, ((node: Node) => boolean)[]]) => [
    jsType,
    checks.reduce(
      (accumulatedCheck: (node: Node) => boolean, check: (node: Node) => boolean): ((node: Node) => boolean) =>
        (node: Node) =>
          accumulatedCheck(node) || check(node),
      (node: Node): boolean => isConstructorCall(node, jsType),
    ),
  ]),
);

const isExported = ({ modifiers }: ClassDeclaration): boolean =>
  !!modifiers?.some(({ kind }: ModifierLike): boolean => kind === SyntaxKind.ExportKeyword);

const isPublic = ({ modifiers }: PropertyDeclaration | MethodDeclaration): boolean =>
  !modifiers?.some(({ kind }: ModifierLike): boolean => [SyntaxKind.PrivateKeyword, SyntaxKind.ProtectedKeyword].includes(kind));

const isClass = (node: Node): node is NamedClassDeclaration => isClassDeclaration(node) && !!node.name && isExported(node);

const isPropertyFunction = (member: ClassElement): member is PropertyDeclaration =>
  isPropertyDeclaration(member) &&
  !!member.initializer &&
  (isArrowFunction(member.initializer) || isFunctionExpression(member.initializer));

const isMethod = (member: ClassElement): member is FunctionDeclaration =>
  (isMethodDeclaration(member) || isPropertyFunction(member)) && isIdentifier(member.name) && isPublic(member);

const isAccessNode = (node: Node): node is PropertyAccessExpression => isPropertyAccessExpression(node) || isPropertyAccessChain(node);

const isCallNode = (node: Node): node is CallNode => (isCallExpression(node) || isCallChain(node)) && isAccessNode(node.expression);

const isPropertyAccessNode = (node: Node): node is PropertyAccessExpression =>
  isAccessNode(node) && (!node.parent || !isCallNode(node.parent) || node.parent.arguments.includes(node));

const isPropertyOrCallNode = (node: Node): node is PropertyOrCallNode => isPropertyAccessNode(node) || isCallNode(node);

const isStaticMethod =
  (expression: Expression, methodName: string): ((entry: [string, TypeExtension]) => boolean) =>
  ([, { type, methods }]: [string, TypeExtension]): boolean =>
    isIdentifier(expression) &&
    type === expression.text &&
    methods.some(({ name, isStatic }: Method): boolean => name === methodName && isStatic);

const isObjectMethod =
  (methodName: string): ((entry: [string, TypeExtension]) => boolean) =>
  ([, { methods }]: [string, TypeExtension]): boolean =>
    methods.some(({ name, isStatic }: Method): boolean => name === methodName && !isStatic);

const readConfig = (configPath: string): TypeExtensionsConfig => JSON.parse(readFileSync(resolve(configPath), Encoding.Utf8));

const getAllowedFiles = (tsConfig: string): Set<string> =>
  new Set<string>(
    parseJsonConfigFileContent(
      readConfigFile(findConfigFile(cwd(), sys.fileExists, tsConfig)!, sys.readFile).config,
      sys,
      cwd(),
    ).fileNames.map<string>((file: string): string => resolve(file)),
  );

const mapMethod = ({ name: { text }, modifiers }: FunctionDeclaration): Method => ({
  name: text,
  isStatic: !!modifiers?.some(({ kind }: ModifierLike): boolean => kind === SyntaxKind.StaticKeyword),
});

const buildExtensionsMap = (extensionsFilePath: string, extensions: Record<string, Extension>): Map<string, TypeExtension> =>
  createSourceFile(
    resolve(extensionsFilePath),
    readFileSync(resolve(extensionsFilePath), Encoding.Utf8),
    ScriptTarget.ESNext,
    true,
    ScriptKind.TS,
  )
    .statements.filter<NamedClassDeclaration>(isClass)
    .map<[string, Method[]]>(({ name: { text }, members }: NamedClassDeclaration): [string, Method[]] => [
      text,
      members.filter<FunctionDeclaration>(isMethod).map<Method>(mapMethod),
    ])
    .filter(([className]: [string, Method[]]): boolean => Object.keys(extensions).includes(className))
    .reduce<Map<string, TypeExtension>>(
      (map: Map<string, TypeExtension>, [className, methods]: [string, Method[]]): Map<string, TypeExtension> =>
        map.set(className, { type: extensions[className].type, typeCheck: extensions[className].typeCheck, methods }),
      new Map<string, TypeExtension>(),
    );

const buildInternalConfig = ({ tsConfig, extensionsFilePath, extensions }: TypeExtensionsConfig): InternalConfig => ({
  allowedFiles: getAllowedFiles(tsConfig),
  extensionsMap: buildExtensionsMap(extensionsFilePath, extensions),
});

const buildHotUpdateHandler =
  (configPath: string, config: TypeExtensionsConfig, internalConfig: InternalConfig): ((context: HmrContext) => void) =>
  ({ file, server }: HmrContext): void => {
    switch (resolve(file)) {
      case resolve(configPath):
        return (
          Object.assign<TypeExtensionsConfig, TypeExtensionsConfig>(config, readConfig(configPath)) &&
          Object.assign<InternalConfig, InternalConfig>(internalConfig, buildInternalConfig(config)) &&
          server.moduleGraph.invalidateAll()
        );
      case resolve(config.extensionsFilePath):
        return (
          Object.assign<InternalConfig, InternalConfig>(internalConfig, buildInternalConfig(config)) && server.moduleGraph.invalidateAll()
        );
      default:
        Object.assign<InternalConfig, Partial<InternalConfig>>(internalConfig, { allowedFiles: getAllowedFiles(config.tsConfig) });
    }
  };

const readUsedExtensions = (extensionImport: ImportDeclaration[]): Set<string> =>
  extensionImport
    .map<NamedImportBindings | undefined>(
      ({ importClause }: ImportDeclaration): NamedImportBindings | undefined => importClause?.namedBindings,
    )
    .filter((bindings: NamedImportBindings | undefined): bindings is NamedImports => !!bindings && isNamedImports(bindings))
    .map<string[]>(({ elements }: NamedImports): string[] => elements.map<string>(({ name: { text } }: ImportSpecifier): string => text))
    .flat<string[][], 1>()
    .reduce<Set<string>>((set: Set<string>, extension: string): Set<string> => set.add(extension), new Set<string>());

const mapToPropertyOrCallNode = (node: PropertyOrCallNode): PropertyOrCallTuple => [
  node,
  ...(isCallNode(node)
    ? ([node.expression, node.arguments] satisfies [PropertyAccessExpression, NodeArray<Expression>])
    : ([node] satisfies [PropertyAccessExpression])),
];

const createOptionalCallExpression = (expression: Expression, args?: NodeArray<Expression>): Expression =>
  args ? factory.createCallExpression(expression, undefined, args) : expression;

const buildStaticExpressions = (
  extensionsMap: Map<string, TypeExtension>,
  usedExtensions: Set<string>,
  { expression, name: { text } }: PropertyAccessExpression,
  args?: NodeArray<Expression>,
): (() => Expression)[] =>
  [...extensionsMap]
    .filter(isStaticMethod(expression, text))
    .map<string>(([className]: [string, TypeExtension]): string => usedExtensions.add(className) && className)
    .map<() => Expression>(
      (className: string): (() => Expression) =>
        () =>
          createOptionalCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier(className), text), args),
    );

const buildLiteralExpressions = (
  extensionsMap: Map<string, TypeExtension>,
  usedExtensions: Set<string>,
  { expression, name: { text } }: PropertyAccessExpression,
  args?: NodeArray<Expression>,
) =>
  [...extensionsMap]
    .filter(isObjectMethod(text))
    .filter(([, { type }]: [string, TypeExtension]): boolean => !!literalExpressionsMap.get(type)?.(expression))
    .map<string>(([className]: [string, TypeExtension]): string => usedExtensions.add(className) && className)
    .map<() => Expression>(
      (className: string): (() => Expression) =>
        () =>
          createOptionalCallExpression(
            factory.createPropertyAccessExpression(
              factory.createNewExpression(factory.createIdentifier(className), undefined, [expression]),
              text,
            ),
            args,
          ),
    );

const replaceValuePlaceholder = <T extends Node>(node: T, replacement: Expression): T =>
  visitEachChild<T>(
    node,
    (child: Node): Node =>
      isIdentifier(child) && child.text === ValuePlaceholder.Placeholder ? replacement : replaceValuePlaceholder<Node>(child, replacement),
    undefined,
  );

const buildConditionalExpressions = (
  extensionsMap: Map<string, TypeExtension>,
  usedExtensions: Set<string>,
  { expression, name: { text } }: PropertyAccessExpression,
  args?: NodeArray<Expression>,
): ((expression: Expression) => Expression)[] =>
  [...extensionsMap]
    .filter(isObjectMethod(text))
    .map<string>(([className]: [string, TypeExtension]): string => usedExtensions.add(className) && className)
    .map<[Expression, Statement]>((className: string): [Expression, Statement] => [
      factory.createNewExpression(factory.createIdentifier(className), undefined, [expression]),
      createSourceFile(TempSourceFile.Name, extensionsMap.get(className)!.typeCheck, ScriptTarget.ESNext, false, ScriptKind.TS)
        .statements[0],
    ])
    .map<[Expression, Expression]>(([newInstance, checkStatement]: [Expression, Statement]): [Expression, Expression] => [
      createOptionalCallExpression(factory.createPropertyAccessExpression(newInstance, text), args),
      isExpressionStatement(checkStatement) ? replaceValuePlaceholder(checkStatement.expression, expression) : expression,
    ])
    .map<(expression: Expression) => Expression>(
      ([newCall, checkStatement]: [Expression, Expression]): ((expression: Expression) => Expression) =>
        (expression: Expression): Expression =>
          factory.createConditionalExpression(checkStatement, undefined, newCall, undefined, expression),
    );

const flatMapExpressionsBuilders =
  (
    extensionsMap: Map<string, TypeExtension>,
    usedExtensions: Set<string>,
  ): (([node, expression, args]: PropertyOrCallTuple) => [PropertyOrCallNode, ((expression: Expression) => Expression)[]][]) =>
  ([node, expression, args]: PropertyOrCallTuple): [PropertyOrCallNode, ((expression: Expression) => Expression)[]][] => [
    [node, buildStaticExpressions(extensionsMap, usedExtensions, expression, args)],
    [node, buildLiteralExpressions(extensionsMap, usedExtensions, expression, args)],
    [node, buildConditionalExpressions(extensionsMap, usedExtensions, expression, args)],
  ];

const buildPropertyAccessChainExpression = ({ expression }: PropertyOrCallNode, builtExpression: Expression): Expression =>
  isPropertyAccessChain(expression)
    ? factory.createConditionalExpression(
        factory.createBinaryExpression(expression.expression, SyntaxKind.EqualsEqualsToken, factory.createVoidZero()),
        undefined,
        expression.expression,
        undefined,
        builtExpression,
      )
    : builtExpression;

const reduceExpressionsCallbacks = ([node, callbacks]: [PropertyOrCallNode, ((expression: Expression) => Expression)[]]): Expression =>
  buildPropertyAccessChainExpression(
    node,
    callbacks.reduce<Expression>(
      (expression: Expression, callback: (expression: Expression) => Expression): Expression => callback(expression),
      node,
    ),
  );

const modifyNode = (extensionsMap: Map<string, TypeExtension>, usedExtensions: Set<string>, node: Node): Node =>
  [node]
    .filter<PropertyOrCallNode>(isPropertyOrCallNode)
    .map<PropertyOrCallTuple>(mapToPropertyOrCallNode)
    .flatMap<[PropertyOrCallNode, ((expression: Expression) => Expression)[]]>(flatMapExpressionsBuilders(extensionsMap, usedExtensions))
    .filter(([, { length }]: [PropertyOrCallNode, ((expression: Expression) => Expression)[]]): boolean => !!length)
    .map<Expression>(reduceExpressionsCallbacks)
    .at(0) ?? node;

const buildVisitor = (extensionsMap: Map<string, TypeExtension>, usedExtensions: Set<string>): Visitor => {
  const visitor: Visitor = (node: Node): Node => modifyNode(extensionsMap, usedExtensions, visitEachChild<Node>(node, visitor, undefined));

  return visitor;
};

const mapExtensionImport = (name: string): ImportSpecifier =>
  factory.createImportSpecifier(false, undefined, factory.createIdentifier(name));

const buildExtensionsImport = (importPath: string, usedExtensions: Set<string>): ImportDeclaration =>
  factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      undefined,
      undefined,
      factory.createNamedImports([...usedExtensions].map<ImportSpecifier>(mapExtensionImport)),
    ),
    factory.createStringLiteral(importPath),
  );

const transformCode = (
  extensionsFilePath: string,
  extensionsMap: Map<string, TypeExtension>,
  originalCode: string,
  id: string,
): TransformResult => {
  const importPath: string = relative(dirname(id), extensionsFilePath)
    .replace(/\\/g, '/')
    .replace(/^(?!\.{1,2}\/)(\/?)/, './')
    .replace(/\.[a-z]+$/, '');

  const sourceFile: SourceFile = createSourceFile(id, originalCode, ScriptTarget.ESNext, true);

  const [imports, restSource]: [ImportDeclaration[], Statement[]] = sourceFile.statements.reduce<[ImportDeclaration[], Statement[]]>(
    ([imports, restSource]: [ImportDeclaration[], Statement[]], statement: Statement): [ImportDeclaration[], Statement[]] =>
      isImportDeclaration(statement) ? [[...imports, statement], restSource] : [imports, [...restSource, statement]],
    [[], []],
  );

  const [extensionImport, restImports]: [ImportDeclaration[], ImportDeclaration[]] = imports.reduce<
    [ImportDeclaration[], ImportDeclaration[]]
  >(
    (
      [extensionImport, restImports]: [ImportDeclaration[], ImportDeclaration[]],
      importDeclaration: ImportDeclaration,
    ): [ImportDeclaration[], ImportDeclaration[]] =>
      isStringLiteral(importDeclaration.moduleSpecifier) && importDeclaration.moduleSpecifier.text === importPath
        ? [[importDeclaration], restImports]
        : [extensionImport, [...restImports, importDeclaration]],
    [[], []],
  );

  const usedExtensions: Set<string> = readUsedExtensions(extensionImport);

  const { statements }: SourceFile = visitEachChild<SourceFile>(
    factory.createSourceFile(restSource, factory.createToken(SyntaxKind.EndOfFileToken), NodeFlags.None),
    buildVisitor(extensionsMap, usedExtensions),
    undefined,
  );

  return {
    code: createPrinter({ newLine: NewLineKind.LineFeed }).printFile(
      factory.updateSourceFile(sourceFile, [...restImports, buildExtensionsImport(importPath, usedExtensions), ...statements]),
    ),
  };
};

const buildTransformer =
  (config: TypeExtensionsConfig, internalConfig: InternalConfig): TransformHook =>
  (originalCode: string, id: string): TransformResult =>
    internalConfig.allowedFiles.has(resolve(id))
      ? transformCode(config.extensionsFilePath, internalConfig.extensionsMap, originalCode, id)
      : null;

export default (configPath: string): Plugin => {
  const config: TypeExtensionsConfig = readConfig(configPath);
  const internalConfig: InternalConfig = buildInternalConfig(config);

  return {
    name: 'type-extensions-plugin',
    handleHotUpdate: buildHotUpdateHandler(configPath, config, internalConfig),
    transform: buildTransformer(config, internalConfig),
  };
};
