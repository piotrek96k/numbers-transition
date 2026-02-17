import { expect, it } from 'vitest';
import { transform } from '../transform/transform';

// TODO: revisit static once new model is created
it<object>('rewrite property access static literal', (): void => {
  const code: string = `
    export const number: number = [1, 2, 3].reduce(Number.sum);
  `;

  const expectedOutput: string = String.raw`
    import { Double as Double[0-9a-f]+ } from "\.\./extensions/extensions";
    export const number: number = \[1, 2, 3\]\.reduce\(Double[0-9a-f]+\.sum\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite property access boolean literal', (): void => {
  const code: string = `
    export const zero: number = false.int;
    export const one: number = true.int;
  `;

  const expectedOutput: string = String.raw`
    import { wrap[0-9a-f]+ as wrap[0-9a-f]+ } from "\.\./extensions/extensions";
    export const zero: number = wrap[0-9a-f]+\(false, "Boolean", "int"\)\.int;
    export const one: number = wrap[0-9a-f]+\(true, "Boolean", "int"\)\.int;
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite property access number literal', (): void => {
  const code: string = `
    export const zero: bigint = (0).bigInt;
  `;

  const expectedOutput: string = String.raw`
    import { wrap[0-9a-f]+ as wrap[0-9a-f]+ } from "\.\./extensions/extensions";
    export const zero: bigint = wrap[0-9a-f]+\(\(0\), "Number", "bigInt"\)\.bigInt;
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite property access bigint literal', (): void => {
  const code: string = `
    export const one: number = 1n.number;
  `;

  const expectedOutput: string = String.raw`
    import { wrap[0-9a-f]+ as wrap[0-9a-f]+ } from "\.\./extensions/extensions";
    export const one: number = wrap[0-9a-f]+\(1n, "BigInt", "number"\)\.number;
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite property access string literal', (): void => {
  const code: string = `
    export const squashed: string = '   Hello   World   '.compact();
  `;

  const expectedOutput: string = String.raw`
    import { wrap[0-9a-f]+ as wrap[0-9a-f]+ } from "\.\./extensions/extensions";
    export const squashed: string = wrap[0-9a-f]+\('   Hello   World   ', "String", "compact"\)\.compact\(\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite property access regexp literal', (): void => {
  const code: string = `
    export const matches: string[] = /[A-Za-z]/g.matches('Hello World');
  `;

  const expectedOutput: string = String.raw`
    import { wrap[0-9a-f]+ as wrap[0-9a-f]+ } from "\.\./extensions/extensions";
    export const matches: string\[\] = wrap[0-9a-f]+\(/\[A-Za-z\]/g, "RegExp", "matches"\)\.matches\('Hello World'\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite property access array literal', (): void => {
  const code: string = `
    export const array: number[] = [1, 2].append(3);
  `;

  const expectedOutput: string = String.raw`
    import { wrap[0-9a-f]+ as wrap[0-9a-f]+ } from "\.\./extensions/extensions";
    export const array: number\[\] = wrap[0-9a-f]+\(\[1, 2\], "Array", "append"\)\.append\(3\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite property access object literal', (): void => {
  const code: string = `
    export const keys: string[] = { hello: 'Hello World' }.keys();
  `;

  const expectedOutput: string = String.raw`
    import { wrap[0-9a-f]+ as wrap[0-9a-f]+ } from "\.\./extensions/extensions";
    export const keys: string\[\] = wrap[0-9a-f]+\(\{ hello: 'Hello World' \}, "Object", "keys"\)\.keys\(\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite property access array literal with object extension', (): void => {
  const code: string = `
    export const keys: string[] = [1, 2].keys();
  `;

  const expectedOutput: string = String.raw`
    import { wrap[0-9a-f]+ as wrap[0-9a-f]+ } from "\.\./extensions/extensions";
    export const keys: string\[\] = wrap[0-9a-f]+\(\[1, 2\], "Object", "keys"\)\.keys\(\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite property access new expression literal', (): void => {
  const code: string = `
    class Test {
      constructor(private readonly value: string) {}
    }
    export const keys: string[] = new Test('Hello World').keys();
  `;

  const expectedOutput: string = String.raw`
    import { proxy[0-9a-f]+ as proxy[0-9a-f]+ } from "\.\./extensions/extensions";
    class Test {
      constructor\(private readonly value: string\) { }
    }
    export const keys: string\[\] = \(proxy[0-9a-f]+\(new Test\('Hello World'\), \["Object"\], "keys"\)\.keys\)\(\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite property access variable', (): void => {
  const code: string = `
    const numeric: string = '1234';
    export const number: number = numeric.number;
  `;

  const expectedOutput: string = String.raw`
    import { proxy[0-9a-f]+ as proxy[0-9a-f]+ } from "\.\./extensions/extensions";
    const numeric: string = '1234';
    export const number: number = proxy[0-9a-f]+\(numeric, \["BigInt", "String"\], "number"\)\.number;
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite property access nested variable', (): void => {
  const code: string = `
    const numeric: string = '1234';
    export const bigInt: bigint = numeric.number.bigInt;
  `;

  const expectedOutput: string = String.raw`
    import { proxy[0-9a-f]+ as proxy[0-9a-f]+ } from "\.\./extensions/extensions";
    const numeric: string = '1234';
    export const bigInt: bigint = proxy[0-9a-f]+\(\(proxy[0-9a-f]+\(numeric, \["BigInt", "String"\], "number"\)\.number\), \["Number", "String"\], "bigInt"\)\.bigInt;
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('property access static property read', (): void => {
  expect<number>([1, 2, 3].reduce(Number.sum)).toEqual<number>(6);
});

it<object>('property access literal property read', (): void => {
  expect<number>(false.int).toEqual<number>(0);
});

it<object>('property access variable property read', (): void => {
  const boolean: boolean = true;
  expect<number>(boolean.int).toEqual<number>(1);
});

it<object>('property access literal getter read', (): void => {
  expect<number>('1234'.number).toEqual<number>(1234);
});

it<object>('property access variable getter read', (): void => {
  const string: string = '1234';
  expect<number>(string.number).toEqual<number>(1234);
});

it<object>('property access literal property function invocation', (): void => {
  expect<string>('   Hello   World   '.compact()).toEqual<string>('Hello World');
});

it<object>('property access variable property function invocation', (): void => {
  const string: string = '   Hello   World   ';
  expect<string>(string.compact()).toEqual<string>('Hello World');
});

it<object>('property access literal method invocation', (): void => {
  expect<number[]>([1, 2].append(3)).toEqual<number[]>([1, 2, 3]);
});

it<object>('property access variable method invocation', (): void => {
  const array: number[] = [1, 2];
  expect<number[]>(array.append(3)).toEqual<number[]>([1, 2, 3]);
});

it<object>('property access chained property read', (): void => {
  expect<number>('1234'.bigInt.number).toEqual<number>(1234);
});

it<object>('property access nested property read', (): void => {
  expect<number[]>([1, 2].append('3'.bigInt.number)).toEqual<number[]>([1, 2, 3]);
});

it<object>('property access not implemented', (): void => {
  expect<unknown>({}.notImplemented).toBeUndefined();
});

it<object>('property access existing method not shadowed', (): void => {
  expect<string[]>({ hello: 'Hello World' }.keys()).toEqual<string[]>(['hello']);
  expect<number[]>([...[1, 2].keys()]).toEqual<number[]>([0, 1]);
});

it<object>('property access existing getter not shadowed', (): void => {
  class Base {
    constructor(private readonly values: string[]) {}

    public get keys(): string[] {
      return this.values;
    }
  }

  expect<string[]>(new Base(['key', 'value']).keys).toEqual<string[]>(['key', 'value']);
});

it<object>('property access existing property not shadowed', (): void => {
  class Base {
    constructor(public readonly keys: string[]) {}
  }

  expect<string[]>(new Base(['key', 'value']).keys).toEqual<string[]>(['key', 'value']);
});

it<object>('property access inheritance not broken', (): void => {
  class Base {
    constructor(protected readonly value: string) {}
  }

  class Extension extends Base {}

  expect<string[]>(new Extension('Hello World').keys()).toEqual<string[]>(['value']);
});

it<object>('property access inheritance not broken', (): void => {
  class Base {
    constructor(protected readonly value: string) {}

    keys(): [string] {
      return [this.value];
    }
  }

  class Extension extends Base {}

  expect<string[]>(new Extension('Hello World').keys()).toEqual<string[]>(['Hello World']);
});

it<object>('property access inheritance not broken', (): void => {
  class Base {
    constructor(protected readonly value: string) {}
  }

  class Extension extends Base {
    keys(): [string] {
      return [this.value];
    }
  }

  expect<string[]>(new Extension('Hello World').keys()).toEqual<string[]>(['Hello World']);
});

it<object>('property access inheritance not broken', (): void => {
  class Base {
    constructor(protected readonly value: string) {}

    keys(): [string] {
      return ['key'];
    }
  }

  class Extension extends Base {
    keys(): [string] {
      return [this.value];
    }
  }

  expect<string[]>(new Extension('Hello World').keys()).toEqual<string[]>(['Hello World']);
});

it<object>('property access apply function', (): void => {
  expect<number[]>([1].append.apply<number[], [number], number[]>([1, 2], [3])).toEqual<number[]>([1, 2, 3]);
});

it<object>('property access call function', (): void => {
  expect<number[]>([1].append.call<number[], [number], number[]>([1, 2], 3)).toEqual<number[]>([1, 2, 3]);
});

it<object>('property access bind function', (): void => {
  expect<number[]>([1].append.bind<(element: number) => number[]>([1, 2])(3)).toEqual<number[]>([1, 2, 3]);
});
