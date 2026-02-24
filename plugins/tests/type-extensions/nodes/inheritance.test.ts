import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { basename, dirname, extname, join, resolve } from 'path';
import { expect, it } from 'vitest';
import { transformer } from '../transformer/transformer';

enum Class {
  GrandParent = 'GrandParent',
  Parent = 'Parent',
  Child = 'Child',
}

enum Case {
  NotDefinedFieldsNotExtended,
  DefinedFieldsNotExtended,
  NotDefinedFieldsExtended,
  DefinedFieldsExtended,
}

enum Field {
  FieldToField = 'fieldToField',
  FieldToArrowFunction = 'fieldToArrowFunction',
  FieldToGetter = 'fieldToGetter',
  FieldToMethod = 'fieldToMethod',
  ArrowFunctionToField = 'arrowFunctionToField',
  ArrowFunctionToArrowFunction = 'arrowFunctionToArrowFunction',
  ArrowFunctionToGetter = 'arrowFunctionToGetter',
  ArrowFunctionToMethod = 'arrowFunctionToMethod',
  GetterToField = 'getterToField',
  GetterToArrowFunction = 'getterToArrowFunction',
  GetterToGetter = 'getterToGetter',
  GetterToMethod = 'getterToMethod',
  MethodToField = 'methodToField',
  MethodToArrowFunction = 'methodToArrowFunction',
  MethodToGetter = 'methodToGetter',
  MethodToMethod = 'methodToMethod',
}

enum Extension {
  Value = 'Extension',
}

enum File {
  Classes = 'classes.ts',
  Extensions = 'extensions.ts',
  Execute = 'execute.ts',
}

enum Dirname {
  Generated = 'generated',
}

interface TestCase {
  cls: Class;
  cases: [number, number][];
  title: string;
}

const classes: Class[] = Object.values<Class>(Class);

const numberOfCases: number = Object.keys(Case).length / 2;
const numberOfFields: number = Object.keys(Field).length;

const mapCase =
  (caseIndex: number): ((classIndex: number, _: number, { length }: number[]) => [number, number]) =>
  (classIndex: number, _: number, { length }: number[]): [number, number] => [
    classIndex,
    Math.floor(caseIndex / numberOfCases ** (length - 1 - classIndex)) % numberOfCases,
  ];

const buildTitle = (title: string, [classIndex, caseIndex]: [number, number], index: number, { length }: [number, number][]): string =>
  `${title} ${Object.keys(Case)[numberOfCases + caseIndex].pascalCaseToText()} ${Object.values<Class>(Class)[classIndex].pascalCaseToText()}${index === length - 1 ? '' : ' ->'}`;

const testCases: TestCase[] = Object.values<Class>(Class).flatMap<TestCase>((cls: Class, index: number): TestCase[] =>
  [...Array<unknown>(numberOfCases ** (index + 1)).keys()]
    .map<
      Omit<TestCase, 'title'>
    >((caseIndex: number): Omit<TestCase, 'title'> => ({ cls, cases: [...Array<unknown>(index + 1).keys()].map<[number, number]>(mapCase(caseIndex)) }))
    .map<TestCase>(
      ({ cls, cases }: Omit<TestCase, 'title'>): TestCase => ({
        cls,
        cases,
        title: cases.reduce<string>(buildTitle, `${cls.pascalCaseToText()} instance with:`),
      }),
    ),
);

const createFields = (
  cls: Class,
  fields: Field[],
  arrowFunctions: Field[],
  getters: Field[],
  methods: Field[],
  extension: string = '',
): string => `
  ${fields.map<string>((field: Field): string => `public readonly ${field}: string = '${field}:${cls}${extension}';`)}

  ${arrowFunctions.map<string>((field: Field): string => `public readonly ${field} = (): string => '${field}:${cls}${extension}';`)}

  ${getters.map<string>(
    (field: Field): string => `
      public get ${field}(): string {
        return '${field}:${cls}${extension}';
      }
    `,
  )}

  ${methods.map<string>(
    (field: Field): string => `
      public ${field}(): string {
        return '${field}:${cls}${extension}';
      }
    `,
  )}
`;

const createClassFields = (cls: Class): string =>
  createFields(
    cls,
    [Field.FieldToField, Field.FieldToArrowFunction, Field.FieldToGetter, Field.FieldToMethod],
    [Field.ArrowFunctionToField, Field.ArrowFunctionToArrowFunction, Field.ArrowFunctionToGetter, Field.ArrowFunctionToMethod],
    [Field.GetterToField, Field.GetterToArrowFunction, Field.GetterToGetter, Field.GetterToMethod],
    [Field.MethodToField, Field.MethodToArrowFunction, Field.MethodToGetter, Field.MethodToMethod],
  );

const createClass = (classIndex: number, caseIndex: number): string => `
  export class ${classes[classIndex]} ${classIndex ? `extends ${classes[classIndex - 1]}` : ''} {
    ${caseIndex === Case.DefinedFieldsNotExtended || caseIndex === Case.DefinedFieldsExtended ? createClassFields(classes[classIndex]) : ''}
  }
`;

const createClasses = (cases: [number, number][]): string =>
  cases.map<string>(([classIndex, caseIndex]: [number, number]): string => createClass(classIndex, caseIndex)).join('\n');

const createExtensionsImports = (classIndexes: number[]): string => `
  import Extension, { ExtensionConstructor } from 'type-extensions/extension';
  ${classIndexes.length ? `import { ${classIndexes.map<Class>((classIndex: number): Class => classes[classIndex]).join()} } from './${basename(File.Classes, extname(File.Classes))}';` : ''}
`;

const createExtensionClassFields = (cls: Class): string =>
  createFields(
    cls,
    [Field.FieldToField, Field.ArrowFunctionToField, Field.GetterToField, Field.MethodToField],
    [Field.FieldToArrowFunction, Field.ArrowFunctionToArrowFunction, Field.GetterToArrowFunction, Field.MethodToArrowFunction],
    [Field.FieldToGetter, Field.ArrowFunctionToGetter, Field.GetterToGetter, Field.MethodToGetter],
    [Field.FieldToMethod, Field.ArrowFunctionToMethod, Field.GetterToMethod, Field.MethodToMethod],
    Extension.Value,
  );

const createExtensionClass = (classIndex: number): string => `
  export class ${classes[classIndex]}${Extension.Value} extends Extension<${classes[classIndex]}> implements ExtensionConstructor<${classes[classIndex]}, typeof ${classes[classIndex]}${Extension.Value}> {
    public static readonly id: string = '${classes[classIndex]}';
    public static readonly type: typeof ${classes[classIndex]} = ${classes[classIndex]};

    public static isType(value: unknown): boolean {
      return value instanceof ${classes[classIndex]};
    }
    ${createExtensionClassFields(classes[classIndex])}
  }
`;

const createExtensionClasses = (cases: [number, number][]): string => {
  const extensionCases: [number, number][] = cases.filter(
    ([, caseIndex]: [number, number]): boolean => caseIndex === Case.NotDefinedFieldsExtended || caseIndex === Case.DefinedFieldsExtended,
  );

  return extensionCases
    .map<string>(([classIndex]: [number, number]): string => createExtensionClass(classIndex))
    .reduce(
      (code: string, extensionClass: string): string => `${code} ${extensionClass}`,
      createExtensionsImports(extensionCases.map<number>(([classIndex]: [number, number]): number => classIndex)),
    );
};

const createExecuteExpressionMapper =
  (first: (field: Field) => string, second: (field: Field) => string, third: (field: Field) => string): ((field: Field) => string) =>
  (field: Field): string => {
    switch (field) {
      case Field.FieldToField:
      case Field.FieldToGetter:
      case Field.GetterToField:
      case Field.GetterToGetter:
        return first(field);
      case Field.FieldToArrowFunction:
      case Field.FieldToMethod:
      case Field.ArrowFunctionToField:
      case Field.ArrowFunctionToGetter:
      case Field.GetterToArrowFunction:
      case Field.GetterToMethod:
      case Field.MethodToField:
      case Field.MethodToGetter:
        return second(field);
      case Field.ArrowFunctionToArrowFunction:
      case Field.ArrowFunctionToMethod:
      case Field.MethodToArrowFunction:
      case Field.MethodToMethod:
        return third(field);
    }
  };

const createPropertyAccessExecute = (cls: Class): string => `
  export const executePropertyAccess = (): string[] => {
    const instance: ${cls} = new ${cls}();

    ${Object.values<Field>(Field)
      .map<string>(
        createExecuteExpressionMapper(
          (field: Field): string => `const ${field}: string | undefined = instance.${field};`,
          (field: Field): string =>
            `const ${field}: string | undefined = typeof instance.${field} === 'function' ? instance.${field}() : instance.${field};`,
          (field: Field): string =>
            `const ${field}: string | undefined = typeof instance.${field} === 'function' ? instance.${field}() : instance.${field};`,
        ),
      )
      .join('\n')}

    return [${Object.values<Field>(Field).join()}];
  };
`;

const createDestructureExecute = (cls: Class): string => `
  export const executeDestructure = (): string[] => {
    const instance: ${cls} = new ${cls}();

    const { ${Object.values<Field>(Field).join()} }: ${cls} = instance;

    return [
      ${Object.values<Field>(Field)
        .map<string>(
          createExecuteExpressionMapper(
            (field: Field): string => field,
            (field: Field): string => `typeof ${field} === 'function' ? ${field}() : ${field}`,
            (field: Field): string => `${field}?.()`,
          ),
        )
        .join()}
    ];
  };
`;

const createExecute = (cls: Class): string => `
  import { ${cls} } from './${basename(File.Classes, extname(File.Classes))}';

  ${createPropertyAccessExecute(cls)}
  ${createDestructureExecute(cls)}
`;

const executeGeneratedCode = async (dir: string, cls: Class, cases: [number, number][]): Promise<(string | undefined)[][]> => {
  const files: [string, string][] = [
    [File.Classes, createClasses(cases)],
    [File.Extensions, createExtensionClasses(cases)],
    [File.Execute, createExecute(cls)],
  ].map<[string, string]>(([file, code]: string[]): [string, string] => [join(dir, file), code]);

  files.forEach(([path, code]: [string, string]): void => writeFileSync(path, code));
  const transform: (code: string, id?: string) => string = transformer(join(dir, File.Extensions));
  files.forEach(([path, code]: [string, string]): void => writeFileSync(path, transform(code, path)));

  const module: any = await import(join(dir, File.Execute));
  return [module.executePropertyAccess(), module.executeDestructure()];
};

const findNativePropertiesAssertion = (cases: [number, number][]): Class | undefined => {
  const foundCase: [number, number] | undefined = cases.findLast(
    ([, caseIndex]: [number, number]): boolean => caseIndex === Case.DefinedFieldsNotExtended || caseIndex === Case.DefinedFieldsExtended,
  );

  return foundCase && classes[foundCase[0]];
};

const findExtensionPropertiesAssertion = (cases: [number, number][]): string | undefined => {
  const foundCase: [number, number] | undefined = cases.findLast(
    ([, caseIndex]: [number, number]): boolean => caseIndex === Case.NotDefinedFieldsExtended,
  );

  return foundCase && `${classes[foundCase[0]]}${Extension.Value}`;
};

const createPropertiesAssertion = (cases: [number, number][]): (string | undefined)[] => {
  const id: string | undefined = findNativePropertiesAssertion(cases) ?? findExtensionPropertiesAssertion(cases);

  return id
    ? Object.values<Field>(Field)
        .slice(0, numberOfFields / 2)
        .map<string>((field: Field): string => `${field}:${id}`)
    : Array<undefined>(numberOfFields / 2).fill(undefined);
};

const createPrototypeAssertion = (cases: [number, number][]): (string | undefined)[] => {
  const foundCase: [number, number] | undefined = cases.findLast(
    ([, caseIndex]: [number, number]): boolean => caseIndex !== Case.NotDefinedFieldsNotExtended,
  );

  return foundCase
    ? Object.values<Field>(Field)
        .slice(numberOfFields / 2)
        .map<string>(
          (field: Field): string =>
            `${field}:${classes[foundCase[0]]}${foundCase[1] === Case.NotDefinedFieldsExtended ? Extension.Value : ''}`,
        )
    : Array<undefined>(numberOfFields / 2).fill(undefined);
};

const createAssertion = (cases: [number, number][]): (string | undefined)[] => [
  ...createPropertiesAssertion(cases),
  ...createPrototypeAssertion(cases),
];

it.each<TestCase>(testCases)('$title', async ({ cls, cases }: TestCase): Promise<void> => {
  const dir: string = resolve(
    dirname(import.meta.dirname),
    `${Dirname.Generated}${cases.map<string>((tuple: [number, number]): string => tuple.join('')).join('')}`,
  );

  try {
    mkdirSync(dir);

    const [propertyAccess, destructure]: (string | undefined)[][] = await executeGeneratedCode(dir, cls, cases);
    const expectedValue: (string | undefined)[] = createAssertion(cases);

    expect<(string | undefined)[]>(propertyAccess).toEqual<(string | undefined)[]>(expectedValue);
    expect<(string | undefined)[]>(destructure).toEqual<(string | undefined)[]>(expectedValue);
  } finally {
    rmSync(dir, { recursive: true });
  }
});
