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

const createClassFields = (cls: Class): string => `
  public readonly ${Field.FieldToField}: string = '${Field.FieldToField}:${cls}';
  public readonly ${Field.FieldToArrowFunction}: string = '${Field.FieldToArrowFunction}:${cls}';
  public readonly ${Field.FieldToGetter}: string = '${Field.FieldToGetter}:${cls}';
  public readonly ${Field.FieldToMethod}: string = '${Field.FieldToMethod}:${cls}';

  public readonly ${Field.ArrowFunctionToField} = (): string => '${Field.ArrowFunctionToField}:${cls}';
  public readonly ${Field.ArrowFunctionToArrowFunction} = (): string => '${Field.ArrowFunctionToArrowFunction}:${cls}';
  public readonly ${Field.ArrowFunctionToGetter} = (): string => '${Field.ArrowFunctionToGetter}:${cls}';
  public readonly ${Field.ArrowFunctionToMethod} = (): string => '${Field.ArrowFunctionToMethod}:${cls}';

  public get ${Field.GetterToField}(): string {
    return '${Field.GetterToField}:${cls}';
  }
  public get ${Field.GetterToArrowFunction}(): string {
    return '${Field.GetterToArrowFunction}:${cls}';
  }
  public get ${Field.GetterToGetter}(): string {
    return '${Field.GetterToGetter}:${cls}';
  }
  public get ${Field.GetterToMethod}(): string {
    return '${Field.GetterToMethod}:${cls}';
  }

  public ${Field.MethodToField}(): string {
    return '${Field.MethodToField}:${cls}';
  }
  public ${Field.MethodToArrowFunction}(): string {
    return '${Field.MethodToArrowFunction}:${cls}';
  }
  public ${Field.MethodToGetter}(): string {
    return '${Field.MethodToGetter}:${cls}';
  }
  public ${Field.MethodToMethod}(): string {
    return '${Field.MethodToMethod}:${cls}';
  }
`;

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

const createExtensionClassFields = (cls: Class): string => `
  public readonly ${Field.FieldToField}: string = '${Field.FieldToField}:${cls}${Extension.Value}';
  public readonly ${Field.FieldToArrowFunction} = (): string => '${Field.FieldToArrowFunction}:${cls}${Extension.Value}';
  public get ${Field.FieldToGetter}(): string {
    return '${Field.FieldToGetter}:${cls}${Extension.Value}';
  }
  public ${Field.FieldToMethod}(): string {
    return '${Field.FieldToMethod}:${cls}${Extension.Value}';
  }

  public readonly ${Field.ArrowFunctionToField}: string = '${Field.ArrowFunctionToField}:${cls}${Extension.Value}';
  public readonly ${Field.ArrowFunctionToArrowFunction} = (): string => '${Field.ArrowFunctionToArrowFunction}:${cls}${Extension.Value}';
  public get ${Field.ArrowFunctionToGetter}(): string {
    return '${Field.ArrowFunctionToGetter}:${cls}${Extension.Value}';
  }
  public ${Field.ArrowFunctionToMethod}(): string {
    return '${Field.ArrowFunctionToMethod}:${cls}${Extension.Value}';
  }

  public readonly ${Field.GetterToField}: string = '${Field.GetterToField}:${cls}${Extension.Value}';
  public readonly ${Field.GetterToArrowFunction} = (): string => '${Field.GetterToArrowFunction}:${cls}${Extension.Value}';
  public get ${Field.GetterToGetter}(): string {
    return '${Field.GetterToGetter}:${cls}${Extension.Value}';
  }
  public ${Field.GetterToMethod}(): string {
    return '${Field.GetterToMethod}:${cls}${Extension.Value}';
  }
    
  public readonly ${Field.MethodToField}: string = '${Field.MethodToField}:${cls}${Extension.Value}';
  public readonly ${Field.MethodToArrowFunction} = (): string => '${Field.MethodToArrowFunction}:${cls}${Extension.Value}';
  public get ${Field.MethodToGetter}(): string {
    return '${Field.MethodToGetter}:${cls}${Extension.Value}';
  }
  public ${Field.MethodToMethod}(): string {
    return '${Field.MethodToMethod}:${cls}${Extension.Value}';
  }
`;

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

const createPropertyAccessExecute = (cls: Class): string => `
  export const executePropertyAccess = (): string[] => {
    const instance: ${cls} = new ${cls}();

    const ${Field.FieldToField} : string | undefined = instance.${Field.FieldToField};
    const ${Field.FieldToArrowFunction}: string | undefined = typeof instance.${Field.FieldToArrowFunction} === 'function' ? instance.${Field.FieldToArrowFunction}() : instance.${Field.FieldToArrowFunction};
    const ${Field.FieldToGetter}: string | undefined = instance.${Field.FieldToGetter};
    const ${Field.FieldToMethod}: string | undefined = typeof instance.${Field.FieldToMethod} === 'function' ? instance.${Field.FieldToMethod}() : instance.${Field.FieldToMethod};

    const ${Field.ArrowFunctionToField}: string | undefined = typeof instance.${Field.ArrowFunctionToField} === 'function' ? instance.${Field.ArrowFunctionToField}() : instance.${Field.ArrowFunctionToField};
    const ${Field.ArrowFunctionToArrowFunction}: string | undefined = instance.${Field.ArrowFunctionToArrowFunction}?.();
    const ${Field.ArrowFunctionToGetter}: string | undefined = typeof instance.${Field.ArrowFunctionToGetter} === 'function' ? instance.${Field.ArrowFunctionToGetter}() : instance.${Field.ArrowFunctionToGetter};
    const ${Field.ArrowFunctionToMethod}: string | undefined = instance.${Field.ArrowFunctionToMethod}?.();

    const ${Field.GetterToField}: string | undefined = instance.${Field.GetterToField};
    const ${Field.GetterToArrowFunction}: string | undefined = typeof instance.${Field.GetterToArrowFunction} === 'function' ? instance.${Field.GetterToArrowFunction}() : instance.${Field.GetterToArrowFunction};
    const ${Field.GetterToGetter}: string | undefined = instance.${Field.GetterToGetter};
    const ${Field.GetterToMethod}: string | undefined = typeof instance.${Field.GetterToMethod} === 'function' ? instance.${Field.GetterToMethod}() : instance.${Field.GetterToMethod};

    const ${Field.MethodToField}: string | undefined = typeof instance.${Field.MethodToField} === 'function' ? instance.${Field.MethodToField}() : instance.${Field.MethodToField};
    const ${Field.MethodToArrowFunction}: string | undefined = instance.${Field.MethodToArrowFunction}?.();
    const ${Field.MethodToGetter}: string | undefined = typeof instance.${Field.MethodToGetter} === 'function' ? instance.${Field.MethodToGetter}() : instance.${Field.MethodToGetter};
    const ${Field.MethodToMethod}: string | undefined = instance.${Field.MethodToMethod}?.();

    return [
      ${Field.FieldToField},
      ${Field.FieldToArrowFunction},
      ${Field.FieldToGetter},
      ${Field.FieldToMethod},
      ${Field.ArrowFunctionToField},
      ${Field.ArrowFunctionToArrowFunction},
      ${Field.ArrowFunctionToGetter},
      ${Field.ArrowFunctionToMethod},
      ${Field.GetterToField},
      ${Field.GetterToArrowFunction},
      ${Field.GetterToGetter},
      ${Field.GetterToMethod},
      ${Field.MethodToField},
      ${Field.MethodToArrowFunction},
      ${Field.MethodToGetter},
      ${Field.MethodToMethod},
    ];
  };
`;

const createDestructureExecute = (cls: Class): string => `
  export const executeDestructure = (): string[] => {
    const instance: ${cls} = new ${cls}();

    const {
      ${Field.FieldToField},
      ${Field.FieldToArrowFunction},
      ${Field.FieldToGetter},
      ${Field.FieldToMethod},

      ${Field.ArrowFunctionToField},
      ${Field.ArrowFunctionToArrowFunction},
      ${Field.ArrowFunctionToGetter},
      ${Field.ArrowFunctionToMethod},

      ${Field.GetterToField},
      ${Field.GetterToArrowFunction},
      ${Field.GetterToGetter},
      ${Field.GetterToMethod},

      ${Field.MethodToField},
      ${Field.MethodToArrowFunction},
      ${Field.MethodToGetter},
      ${Field.MethodToMethod},
    }: ${cls} = instance;

    return [
      ${Field.FieldToField},
      typeof ${Field.FieldToArrowFunction} === 'function' ? ${Field.FieldToArrowFunction}() : ${Field.FieldToArrowFunction},
      ${Field.FieldToGetter},
      typeof ${Field.FieldToMethod} === 'function' ? ${Field.FieldToMethod}() : ${Field.FieldToMethod},
      typeof ${Field.ArrowFunctionToField} === 'function' ? ${Field.ArrowFunctionToField}() : ${Field.ArrowFunctionToField},
      ${Field.ArrowFunctionToArrowFunction}?.(),
      typeof ${Field.ArrowFunctionToGetter} === 'function' ? ${Field.ArrowFunctionToGetter}() : ${Field.ArrowFunctionToGetter},
      ${Field.ArrowFunctionToMethod}?.(),
      ${Field.GetterToField},
      typeof ${Field.GetterToArrowFunction} === 'function' ? ${Field.GetterToArrowFunction}() : ${Field.GetterToArrowFunction},
      ${Field.GetterToGetter},
      typeof ${Field.GetterToMethod} === 'function' ? ${Field.GetterToMethod}() : ${Field.GetterToMethod},
      typeof ${Field.MethodToField} === 'function' ? ${Field.MethodToField}() : ${Field.MethodToField},
      ${Field.MethodToArrowFunction}?.(),
      typeof ${Field.MethodToGetter} === 'function' ? ${Field.MethodToGetter}() : ${Field.MethodToGetter},
      ${Field.MethodToMethod}?.(),
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
