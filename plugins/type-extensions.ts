import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { dirname, relative, resolve } from 'path';
import { cwd } from 'process';
import type { TransformHook, TransformResult } from 'rollup';
import {
  ArrayLiteralExpression,
  ArrowFunction,
  BindingElement,
  BindingName,
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
  NewExpression,
  NewLineKind,
  Node,
  NodeArray,
  NodeFlags,
  ObjectBindingPattern,
  ParameterDeclaration,
  PropertyAccessExpression,
  PropertyDeclaration,
  PropertyName,
  ReturnStatement,
  ScriptKind,
  ScriptTarget,
  SourceFile,
  Statement,
  StringLiteral,
  SyntaxKind,
  VariableDeclaration,
  VariableStatement,
  Visitor,
  createPrinter,
  createSourceFile,
  factory,
  findConfigFile,
  isArrayLiteralExpression,
  isBigIntLiteral,
  isCallExpression,
  isClassDeclaration,
  isExpressionStatement,
  isIdentifier,
  isImportDeclaration,
  isMethodDeclaration,
  isNamedImports,
  isNewExpression,
  isNumericLiteral,
  isObjectBindingPattern,
  isPropertyAccessChain,
  isPropertyAccessExpression,
  isPropertyDeclaration,
  isRegularExpressionLiteral,
  isStringLiteral,
  isTemplateLiteral,
  isVariableDeclaration,
  parseJsonConfigFileContent,
  readConfigFile,
  sys,
  visitEachChild,
} from 'typescript';
import type { HmrContext, Plugin } from 'vite';

enum Encoding {
  Utf8 = 'utf-8',
  Hex = 'hex',
}

enum HashAlgorithm {
  Sha256 = 'sha256',
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

enum ClassName {
  Map = 'Map',
  Object = 'Object',
}

enum FunctionName {
  Assign = 'assign',
  Get = 'get',
  Find = 'find',
}

enum ConstName {
  Merge = 'merge',
  Proxy = 'proxy',
  Type = 'type',
  TypeMap = 'typeMap',
  TypeCheckMap = 'typeCheckMap',
}

enum ArgName {
  Cls = 'cls',
  Classes = 'classes',
  Merge = 'merge',
  Value = 'value',
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

type MethodOrPropertyDeclaration = IdentifierMethodDeclaration | IdentifierPropertyDeclaration;

interface VariableDestructureDeclaration extends VariableDeclaration {
  name: ObjectBindingPattern;
  initializer: Expression;
}

interface InternalConfig {
  allowedFiles: Set<string>;
  extensionsMap: Map<string, TypeExtension>;
  constAliases: Map<string, string>;
}

interface Property {
  name: string;
  isStatic: boolean;
}

interface Extension {
  type: string;
  typeCheck: string;
}

interface TypeExtension extends Extension {
  properties: Property[];
}

interface TypeExtensionsConfig {
  tsConfig: string;
  extensionsFilePath: string;
  extensions: Record<string, Extension>;
}

type ExpressionsBuilder = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  node: Node,
) => ((() => Node) | undefined)[];

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
        (node: Node): boolean =>
          accumulatedCheck(node) || check(node),
      (node: Node): boolean => isConstructorCall(node, jsType),
    ),
  ]),
);

const isLiteralExpression =
  (node: Node): ((entry: [string, TypeExtension]) => boolean) =>
  ([, { type }]: [string, TypeExtension]): boolean =>
    !!literalExpressionsMap.get(type)?.(node);

const isExported = ({ modifiers }: ClassDeclaration): boolean =>
  !!modifiers?.some(({ kind }: ModifierLike): boolean => kind === SyntaxKind.ExportKeyword);

const isPublic = ({ modifiers }: PropertyDeclaration | MethodDeclaration): boolean =>
  !modifiers?.some(({ kind }: ModifierLike): boolean => [SyntaxKind.PrivateKeyword, SyntaxKind.ProtectedKeyword].includes(kind));

const isClass = (node: Node): node is NamedClassDeclaration => isClassDeclaration(node) && !!node.name && isExported(node);

const isMethodOrProperty = (member: ClassElement): member is MethodOrPropertyDeclaration =>
  (isMethodDeclaration(member) || isPropertyDeclaration(member)) && isIdentifier(member.name) && isPublic(member);

const isVariableDestructure = (node: Node): node is VariableDestructureDeclaration =>
  isVariableDeclaration(node) && isObjectBindingPattern(node.name) && node.initializer !== undefined;

const isStaticProperty =
  (expression: Expression, propertyName: string): ((entry: [string, TypeExtension]) => boolean) =>
  ([, { type, properties }]: [string, TypeExtension]): boolean =>
    isIdentifier(expression) &&
    type === expression.text &&
    properties.some(({ name, isStatic }: Property): boolean => name === propertyName && isStatic);

const isObjectProperty =
  (propertyName: string): ((entry: [string, TypeExtension]) => boolean) =>
  ([, { properties }]: [string, TypeExtension]): boolean =>
    properties.some(({ name, isStatic }: Property): boolean => name === propertyName && !isStatic);

const isDestructuredProperty = (elements: NodeArray<BindingElement>): ((entry: [string, TypeExtension]) => boolean) => {
  const destructured: Identifier[] = elements
    .map<PropertyName | BindingName>(({ propertyName, name }: BindingElement) => propertyName ?? name)
    .filter<Identifier>(isIdentifier);

  return ([, { properties }]: [string, TypeExtension]): boolean =>
    properties.some(({ name }: Property): boolean => destructured.some((id: Identifier): boolean => id.text === name));
};

const generateAlias = (name: string, node: Node | string): string =>
  `${name}${createHash(HashAlgorithm.Sha256)
    .update(typeof node === 'string' ? `${node}${name}` : `${node.pos}${name}${node.end}`)
    .digest(Encoding.Hex)}`;

const readConfig = (configPath: string): TypeExtensionsConfig => JSON.parse(readFileSync(resolve(configPath), Encoding.Utf8));

const getAllowedFiles = (tsConfig: string): Set<string> =>
  new Set<string>(
    parseJsonConfigFileContent(
      readConfigFile(findConfigFile(cwd(), sys.fileExists, tsConfig)!, sys.readFile).config,
      sys,
      cwd(),
    ).fileNames.map<string>((file: string): string => resolve(file)),
  );

const mapProperty = ({ name: { text }, modifiers }: MethodOrPropertyDeclaration): Property => ({
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
    .map<[string, Property[]]>(({ name: { text }, members }: NamedClassDeclaration): [string, Property[]] => [
      text,
      members.filter<MethodOrPropertyDeclaration>(isMethodOrProperty).map<Property>(mapProperty),
    ])
    .filter(([className]: [string, Property[]]): boolean => Object.keys(extensions).includes(className))
    .reduce<Map<string, TypeExtension>>(
      (map: Map<string, TypeExtension>, [className, properties]: [string, Property[]]): Map<string, TypeExtension> =>
        map.set(className, { type: extensions[className].type, typeCheck: extensions[className].typeCheck, properties }),
      new Map<string, TypeExtension>(),
    );

const generateMap = (name: string, entries: ArrayLiteralExpression[]): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(name),
    undefined,
    undefined,
    factory.createNewExpression(factory.createIdentifier(ClassName.Map), undefined, [factory.createArrayLiteralExpression(entries)]),
  );

const generateTypeMap = (extensionsMap: Map<string, TypeExtension>, constAliases: Map<string, string>): VariableDeclaration =>
  generateMap(
    constAliases.get(ConstName.TypeMap)!,
    [...extensionsMap].map<ArrayLiteralExpression>(
      ([className, { type }]: [string, TypeExtension]): ArrayLiteralExpression =>
        factory.createArrayLiteralExpression([factory.createStringLiteral(type), factory.createIdentifier(className)]),
    ),
  );

const generateTypeCheckMap = (extensionsMap: Map<string, TypeExtension>, constAliases: Map<string, string>): VariableDeclaration =>
  generateMap(
    constAliases.get(ConstName.TypeCheckMap)!,
    [...extensionsMap]
      .map<
        [string, Statement]
      >(([, { type, typeCheck }]: [string, TypeExtension]): [string, Statement] => [type, createSourceFile(TempSourceFile.Name, typeCheck.replace(new RegExp(ValuePlaceholder.Placeholder, 'g'), ArgName.Value), ScriptTarget.ESNext, false, ScriptKind.TS).statements[0]])
      .map<ArrayLiteralExpression>(
        ([type, typeCheck]: [string, Statement]): ArrayLiteralExpression =>
          factory.createArrayLiteralExpression([
            factory.createStringLiteral(type),
            factory.createArrowFunction(
              undefined,
              undefined,
              [factory.createParameterDeclaration(undefined, undefined, ArgName.Value)],
              undefined,
              factory.createToken(SyntaxKind.EqualsGreaterThanToken),
              isExpressionStatement(typeCheck) ? typeCheck.expression : factory.createVoidZero(),
            ),
          ]),
      ),
  );

const generateWrapperNewExpression = (constAliases: Map<string, string>, value: string, type: string): NewExpression =>
  factory.createNewExpression(
    factory.createParenthesizedExpression(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(constAliases.get(ConstName.TypeMap)!), FunctionName.Get),
        undefined,
        [factory.createIdentifier(type)],
      ),
    ),
    undefined,
    [factory.createIdentifier(value)],
  );

const generateMergeFunction = (constAliases: Map<string, string>): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(constAliases.get(ConstName.Merge)!),
    undefined,
    undefined,
    factory.createArrowFunction(
      undefined,
      undefined,
      [
        ...[ArgName.Value, ArgName.Cls].map<ParameterDeclaration>(
          (param: string): ParameterDeclaration => factory.createParameterDeclaration(undefined, undefined, param),
        ),
      ],
      undefined,
      factory.createToken(SyntaxKind.EqualsGreaterThanToken),
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(ClassName.Object), FunctionName.Assign),
        undefined,
        [
          factory.createCallExpression(factory.createIdentifier(ClassName.Object), undefined, [factory.createIdentifier(ArgName.Value)]),
          generateWrapperNewExpression(constAliases, ArgName.Value, ArgName.Cls),
        ],
      ),
    ),
  );

const generateProxyFindFunction = (constAliases: Map<string, string>): ArrowFunction =>
  factory.createArrowFunction(
    undefined,
    undefined,
    [factory.createParameterDeclaration(undefined, undefined, ArgName.Cls)],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createCallExpression(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(constAliases.get(ConstName.TypeCheckMap)!), FunctionName.Get),
        undefined,
        [factory.createIdentifier(ArgName.Cls)],
      ),
      undefined,
      [factory.createIdentifier(ArgName.Value)],
    ),
  );

const generateProxyFindExpression = (constAliases: Map<string, string>): VariableStatement =>
  factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          ConstName.Type,
          undefined,
          undefined,
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier(ArgName.Classes), FunctionName.Find),
            undefined,
            [generateProxyFindFunction(constAliases)],
          ),
        ),
      ],
      NodeFlags.Const,
    ),
  );

const generateProxyResult = (constAliases: Map<string, string>): ReturnStatement =>
  factory.createReturnStatement(
    factory.createConditionalExpression(
      factory.createIdentifier(ConstName.Type),
      factory.createToken(SyntaxKind.QuestionToken),
      factory.createConditionalExpression(
        factory.createIdentifier(ArgName.Merge),
        factory.createToken(SyntaxKind.QuestionToken),
        factory.createCallExpression(factory.createIdentifier(constAliases.get(ConstName.Merge)!), undefined, [
          factory.createIdentifier(ArgName.Value),
          factory.createIdentifier(ConstName.Type),
        ]),
        factory.createToken(SyntaxKind.ColonToken),
        generateWrapperNewExpression(constAliases, ArgName.Value, ConstName.Type),
      ),
      factory.createToken(SyntaxKind.ColonToken),
      factory.createIdentifier(ArgName.Value),
    ),
  );

const generateProxyFunction = (constAliases: Map<string, string>): VariableDeclaration =>
  factory.createVariableDeclaration(
    factory.createIdentifier(constAliases.get(ConstName.Proxy)!),
    undefined,
    undefined,
    factory.createArrowFunction(
      undefined,
      undefined,
      [
        ...[ArgName.Value, ArgName.Classes].map<ParameterDeclaration>(
          (param: string): ParameterDeclaration => factory.createParameterDeclaration(undefined, undefined, param),
        ),
        factory.createParameterDeclaration(undefined, undefined, ArgName.Merge, undefined, undefined, factory.createFalse()),
      ],
      undefined,
      factory.createToken(SyntaxKind.EqualsGreaterThanToken),
      factory.createBlock([generateProxyFindExpression(constAliases), generateProxyResult(constAliases)]),
    ),
  );

const generateRuntimeProxies = (extensionsMap: Map<string, TypeExtension>, constAliases: Map<string, string>): Statement[] => [
  factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [generateTypeMap(extensionsMap, constAliases), generateTypeCheckMap(extensionsMap, constAliases)],
      NodeFlags.Const,
    ),
  ),
  factory.createVariableStatement(
    [factory.createModifier(SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList([generateMergeFunction(constAliases), generateProxyFunction(constAliases)], NodeFlags.Const),
  ),
];

const buildInternalConfig = ({ tsConfig, extensionsFilePath, extensions }: TypeExtensionsConfig): InternalConfig => ({
  allowedFiles: getAllowedFiles(tsConfig),
  extensionsMap: buildExtensionsMap(extensionsFilePath, extensions),
  constAliases: new Map<string, string>(
    Object.values<ConstName>(ConstName).map<[string, string]>((value: ConstName): [string, string] => [
      value,
      generateAlias(value, extensionsFilePath),
    ]),
  ),
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

const readUsedExtensions = (extensionImport: ImportDeclaration[]): Map<string, string> =>
  extensionImport
    .map<NamedImportBindings | undefined>(
      ({ importClause }: ImportDeclaration): NamedImportBindings | undefined => importClause?.namedBindings,
    )
    .filter((bindings: NamedImportBindings | undefined): bindings is NamedImports => !!bindings && isNamedImports(bindings))
    .map<[string, string][]>(({ elements }: NamedImports): [string, string][] =>
      elements.map<[string, string]>(({ propertyName, name }: ImportSpecifier): [string, string] => [
        propertyName?.text ?? name.text,
        name.text,
      ]),
    )
    .flat<[string, string][][], 1>()
    .reduce<Map<string, string>>(
      (map: Map<string, string>, [key, value]: [string, string]): Map<string, string> => map.set(key, value),
      new Map<string, string>(),
    );

const readImportName = (importName: string, usedExtensions: Map<string, string>, isExtensionsFile: boolean, node: Node): string =>
  usedExtensions.get(importName) ??
  (usedExtensions.set(importName, isExtensionsFile ? importName : generateAlias(importName, node)) && usedExtensions.get(importName)!);

const buildProxyCallExpression = (
  extensions: [string, TypeExtension][],
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  value: Expression,
  merge: boolean,
): CallExpression =>
  factory.createCallExpression(
    factory.createIdentifier(readImportName(constAliases.get(ConstName.Proxy)!, usedExtensions, isExtensionsFile, value)),
    undefined,
    [
      value,
      factory.createArrayLiteralExpression(
        extensions.map<StringLiteral>(([, { type }]: [string, TypeExtension]): StringLiteral => factory.createStringLiteral(type)),
      ),
      ...(merge ? [factory.createTrue()] : []),
    ],
  );

const updateVariableDeclaration = (variableDeclaration: VariableDestructureDeclaration, initializer: Expression): VariableDeclaration =>
  factory.updateVariableDeclaration(
    variableDeclaration,
    variableDeclaration.name,
    variableDeclaration.exclamationToken,
    variableDeclaration.type,
    initializer,
  );

const buildPropertyAccessStaticExpression = (
  extensionsMap: Map<string, TypeExtension>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  { expression, name: { text } }: PropertyAccessExpression,
): (() => Node) | undefined =>
  [...extensionsMap]
    .filter(isStaticProperty(expression, text))
    .map<string>(([className]: [string, TypeExtension]): string => readImportName(className, usedExtensions, isExtensionsFile, expression))
    .map<() => Node>(
      (className: string): (() => Node) =>
        (): Node =>
          factory.createPropertyAccessExpression(factory.createIdentifier(className), text),
    )
    .pop();

const buildPropertyAccessLiteralExpression = (
  extensionsMap: Map<string, TypeExtension>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  { expression, name: { text } }: PropertyAccessExpression,
): (() => Node) | undefined =>
  [...extensionsMap]
    .filter(isObjectProperty(text))
    .filter(isLiteralExpression(expression))
    .map<string>(([className]: [string, TypeExtension]): string => readImportName(className, usedExtensions, isExtensionsFile, expression))
    .map<() => Node>(
      (className: string): (() => Node) =>
        (): Node =>
          factory.createPropertyAccessExpression(
            factory.createNewExpression(factory.createIdentifier(className), undefined, [expression]),
            text,
          ),
    )
    .pop();

const buildPropertyAccessProxiedExpression = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  access: PropertyAccessExpression,
): (() => Node) | undefined =>
  [[...extensionsMap].filter(isObjectProperty(access.name.text))]
    .filter(({ length }: [string, TypeExtension][]): boolean => !!length)
    .map<() => Node>(
      (extensions: [string, TypeExtension][]): (() => Node) =>
        (): Node =>
          factory.createPropertyAccessChain(
            buildProxyCallExpression(extensions, constAliases, usedExtensions, isExtensionsFile, access.expression, false),
            isPropertyAccessChain(access) ? factory.createToken(SyntaxKind.QuestionDotToken) : undefined,
            access.name.text,
          ),
    )
    .pop();

const buildPropertyAccessExpressions = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  node: Node,
): ((() => Node) | undefined)[] =>
  isPropertyAccessExpression(node)
    ? [
        buildPropertyAccessStaticExpression(extensionsMap, usedExtensions, isExtensionsFile, node),
        buildPropertyAccessLiteralExpression(extensionsMap, usedExtensions, isExtensionsFile, node),
        buildPropertyAccessProxiedExpression(extensionsMap, constAliases, usedExtensions, isExtensionsFile, node),
      ]
    : [];

const buildVariableDestructureLiteralExpression = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  variableDeclaration: VariableDestructureDeclaration,
): (() => Node) | undefined =>
  [...extensionsMap]
    .filter(isDestructuredProperty(variableDeclaration.name.elements))
    .filter(isLiteralExpression(variableDeclaration.initializer))
    .map<() => Node>(
      ([, { type }]: [string, TypeExtension]): (() => Node) =>
        (): Node =>
          updateVariableDeclaration(
            variableDeclaration,
            factory.createCallExpression(
              factory.createIdentifier(
                readImportName(constAliases.get(ConstName.Merge)!, usedExtensions, isExtensionsFile, variableDeclaration.initializer),
              ),
              undefined,
              [variableDeclaration.initializer, factory.createStringLiteral(type)],
            ),
          ),
    )
    .pop();

const buildVariableDestructureProxiedExpression = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  variableDeclaration: VariableDestructureDeclaration,
): (() => Node) | undefined =>
  [[...extensionsMap].filter(isDestructuredProperty(variableDeclaration.name.elements))]
    .filter(({ length }: [string, TypeExtension][]): boolean => !!length)
    .map<() => Node>(
      (extensions: [string, TypeExtension][]): (() => Node) =>
        (): Node =>
          updateVariableDeclaration(
            variableDeclaration,
            buildProxyCallExpression(extensions, constAliases, usedExtensions, isExtensionsFile, variableDeclaration.initializer, true),
          ),
    )
    .pop();

const buildVariableDestructureExpressions = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  node: Node,
): ((() => Node) | undefined)[] =>
  isVariableDestructure(node)
    ? [
        buildVariableDestructureLiteralExpression(extensionsMap, constAliases, usedExtensions, isExtensionsFile, node),
        buildVariableDestructureProxiedExpression(extensionsMap, constAliases, usedExtensions, isExtensionsFile, node),
      ]
    : [];

const modifyNode = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
  node: Node,
): Node =>
  [buildPropertyAccessExpressions, buildVariableDestructureExpressions, (): (() => Node)[] => [(): Node => node]]
    .flatMap<(() => Node) | undefined>((builder: ExpressionsBuilder): ((() => Node) | undefined)[] =>
      builder(extensionsMap, constAliases, usedExtensions, isExtensionsFile, node),
    )
    .find((expression: (() => Node) | undefined): unknown => expression)!
    .call(undefined);

const buildVisitor = (
  extensionsMap: Map<string, TypeExtension>,
  constAliases: Map<string, string>,
  usedExtensions: Map<string, string>,
  isExtensionsFile: boolean,
): Visitor => {
  const visitor: Visitor = (node: Node): Node =>
    modifyNode(extensionsMap, constAliases, usedExtensions, isExtensionsFile, visitEachChild<Node>(node, visitor, undefined));

  return visitor;
};

const mapExtensionImport = ([original, local]: [string, string]): ImportSpecifier =>
  factory.createImportSpecifier(
    false,
    original === local ? undefined : factory.createIdentifier(original),
    factory.createIdentifier(local),
  );

const buildExtensionsImport = (importPath: string, usedExtensions: Map<string, string>): ImportDeclaration =>
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
  constAliases: Map<string, string>,
  code: string,
  id: string,
): TransformResult => {
  const importPath: string = relative(dirname(id), extensionsFilePath)
    .replace(/\\/g, '/')
    .replace(/^(?!\.{1,2}\/)(\/?)/, './')
    .replace(/\.[a-z]+$/, '');

  const sourceFile: SourceFile = createSourceFile(id, code, ScriptTarget.ESNext, true);

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

  const usedExtensions: Map<string, string> = readUsedExtensions(extensionImport);
  const isExtensionsFile: boolean = resolve(id) === resolve(extensionsFilePath);

  const { statements }: SourceFile = visitEachChild<SourceFile>(
    factory.createSourceFile(restSource, factory.createToken(SyntaxKind.EndOfFileToken), NodeFlags.None),
    buildVisitor(extensionsMap, constAliases, usedExtensions, isExtensionsFile),
    undefined,
  );

  return {
    code: createPrinter({ newLine: NewLineKind.LineFeed }).printFile(
      factory.updateSourceFile(sourceFile, [
        ...restImports,
        ...(isExtensionsFile ? [] : [buildExtensionsImport(importPath, usedExtensions)]),
        ...statements,
        ...(isExtensionsFile ? generateRuntimeProxies(extensionsMap, constAliases) : []),
      ]),
    ),
  };
};

const buildTransformer =
  (config: TypeExtensionsConfig, internalConfig: InternalConfig): TransformHook =>
  (originalCode: string, id: string): TransformResult =>
    internalConfig.allowedFiles.has(resolve(id))
      ? transformCode(config.extensionsFilePath, internalConfig.extensionsMap, internalConfig.constAliases, originalCode, id)
      : null;

const typeExtensions = (configPath: string): Plugin => {
  const config: TypeExtensionsConfig = readConfig(configPath);
  const internalConfig: InternalConfig = buildInternalConfig(config);

  return {
    name: 'type-extensions-plugin',
    handleHotUpdate: buildHotUpdateHandler(configPath, config, internalConfig),
    transform: buildTransformer(config, internalConfig),
  };
};

export default typeExtensions;
