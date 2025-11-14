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
  isArrowFunction,
  isCallExpression,
  isClassDeclaration,
  isExpressionStatement,
  isFunctionExpression,
  isIdentifier,
  isImportDeclaration,
  isMethodDeclaration,
  isNamedImports,
  isPropertyAccessChain,
  isPropertyAccessExpression,
  isPropertyDeclaration,
  isStringLiteral,
  parseJsonConfigFileContent,
  readConfigFile,
  sys,
  visitEachChild,
} from 'typescript';
import { Plugin } from 'vite';

enum Encoding {
  Utf8 = 'utf-8',
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

interface CallableNode extends CallExpression {
  expression: PropertyAccessExpression;
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

export interface TypeExtensionsOptions {
  tsConfig: string;
  extensionsFilePath: string;
  extensions: Record<string, Extension>;
}

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

const isCallableNode = (node: Node): node is CallableNode =>
  isCallExpression(node) && (isPropertyAccessExpression(node.expression) || isPropertyAccessChain(node.expression));

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
  isStatic: modifiers!.some(({ kind }: ModifierLike): boolean => kind === SyntaxKind.StaticKeyword),
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

const readUsedExtensions = (extensionImport: ImportDeclaration[]): Set<string> =>
  extensionImport
    .map<NamedImportBindings | undefined>(
      ({ importClause }: ImportDeclaration): NamedImportBindings | undefined => importClause?.namedBindings,
    )
    .filter((bindings: NamedImportBindings | undefined): bindings is NamedImports => !!bindings && isNamedImports(bindings))
    .map<string[]>(({ elements }: NamedImports): string[] => elements.map<string>(({ name: { text } }: ImportSpecifier): string => text))
    .flat<string[][], 1>()
    .reduce<Set<string>>((set: Set<string>, extension: string): Set<string> => set.add(extension), new Set<string>());

const buildStaticCallExpressions = (
  extensionsMap: Map<string, TypeExtension>,
  usedExtensions: Set<string>,
  { expression: { expression, name: methodName }, arguments: args }: CallableNode,
): (() => Expression)[] =>
  [...extensionsMap.entries()]
    .filter(
      ([, { type, methods }]: [string, TypeExtension]): boolean =>
        isIdentifier(expression) &&
        type === expression.text &&
        methods.some(({ name, isStatic }: Method): boolean => name === methodName.text && isStatic),
    )
    .map<string>(([className]: [string, TypeExtension]): string => usedExtensions.add(className) && className)
    .map<() => Expression>(
      (className: string): (() => Expression) =>
        () =>
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier(className), methodName.text),
            undefined,
            args,
          ),
    );

const buildConditionalExpressions = (
  sourceFile: SourceFile,
  extensionsMap: Map<string, TypeExtension>,
  usedExtensions: Set<string>,
  { expression: { expression, name: methodName }, arguments: args }: CallableNode,
): ((expression: Expression) => Expression)[] =>
  [...extensionsMap.entries()]
    .filter(([, { methods }]: [string, TypeExtension]): boolean =>
      methods.some(({ name, isStatic }: Method): boolean => name === methodName.text && !isStatic),
    )
    .map<string>(([className]: [string, TypeExtension]): string => usedExtensions.add(className) && className)
    .map<[Expression, string]>((className: string): [Expression, string] => [
      factory.createNewExpression(factory.createIdentifier(className), undefined, [expression]),
      extensionsMap
        .get(className)!
        .typeCheck.replace(new RegExp(String.raw`\b${ValuePlaceholder.Placeholder}\b`, 'g'), expression.getFullText(sourceFile)),
    ])
    .map<[Expression, Statement]>(([newInstance, rawCheck]: [Expression, string]): [Expression, Statement] => [
      factory.createCallExpression(factory.createPropertyAccessExpression(newInstance, methodName.text), undefined, args),
      createSourceFile(TempSourceFile.Name, rawCheck, ScriptTarget.ESNext, false, ScriptKind.JS).statements[0],
    ])
    .map<(expression: Expression) => Expression>(
      ([newCall, checkStatement]: [Expression, Statement]): ((expression: Expression) => Expression) =>
        (expression: Expression): Expression =>
          isExpressionStatement(checkStatement)
            ? factory.createConditionalExpression(checkStatement.expression, undefined, newCall, undefined, expression)
            : newCall,
    );

const buildPropertyAccessChainExpression = ({ expression }: CallableNode, builtExpression: Expression): Expression =>
  isPropertyAccessChain(expression)
    ? factory.createConditionalExpression(expression.expression, undefined, builtExpression, undefined, factory.createVoidZero())
    : builtExpression;

const buildVisitor = (sourceFile: SourceFile, extensionsMap: Map<string, TypeExtension>, usedExtensions: Set<string>): Visitor => {
  const visitor: Visitor = (node: Node): Node =>
    [node]
      .filter<CallableNode>(isCallableNode)
      .flatMap<[CallableNode, ((expression: Expression) => Expression)[]]>(
        (node: CallableNode): [CallableNode, ((expression: Expression) => Expression)[]][] => [
          [node, buildStaticCallExpressions(extensionsMap, usedExtensions, node)],
          [node, buildConditionalExpressions(sourceFile, extensionsMap, usedExtensions, node)],
        ],
      )
      .filter(([, { length }]: [CallableNode, ((expression: Expression) => Expression)[]]): boolean => !!length)
      .map<Expression>(
        ([node, callbacks]: [CallableNode, ((expression: Expression) => Expression)[]]): Expression =>
          buildPropertyAccessChainExpression(
            node,
            callbacks.reduce<Expression>(
              (expression: Expression, callback: (expression: Expression) => Expression): Expression => callback(expression),
              node,
            ),
          ),
      )
      .at(0) ?? visitEachChild<Node>(node, visitor, undefined);

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
    buildVisitor(sourceFile, extensionsMap, usedExtensions),
    undefined,
  );

  return {
    code: createPrinter({ newLine: NewLineKind.LineFeed }).printFile(
      factory.updateSourceFile(sourceFile, [...restImports, buildExtensionsImport(importPath, usedExtensions), ...statements]),
    ),
  };
};

const buildTransformer =
  (allowedFiles: Set<string>, extensionsFilePath: string, extensionsMap: Map<string, TypeExtension>): TransformHook =>
  (originalCode: string, id: string): TransformResult =>
    allowedFiles.has(resolve(id)) ? transformCode(extensionsFilePath, extensionsMap, originalCode, id) : null;

export default ({ tsConfig, extensionsFilePath, extensions }: TypeExtensionsOptions): Plugin => ({
  name: 'type-extensions-plugin',
  transform: buildTransformer(getAllowedFiles(tsConfig), extensionsFilePath, buildExtensionsMap(extensionsFilePath, extensions)),
});
