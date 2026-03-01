/* eslint-disable @typescript-eslint/no-wrapper-object-types */
import { expect, it } from 'vitest';
import { transformer } from '../transformer/transformer';

const transform: (code: string, ide?: string) => string = transformer();

it<object>('rewrite variable destructure static literal', (): void => {
  const code: string = `
    const { sum }: NumberConstructor = Number;
    export const number: number = [1, 2, 3].reduce(sum);
  `;

  const expectedOutput: string = String.raw`
    import { proxy[0-9a-f]+ as proxy[0-9a-f]+ } from "\.\./extensions/extensions";
    const { sum }: NumberConstructor = proxy[0-9a-f]+\(Number, \[{ id: "Number", isStatic: true }\]\);
    export const number: number = \[1, 2, 3\].reduce\(sum\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite variable destructure static variable', (): void => {
  const code: string = `
    const numeric: NumberConstructor = Number;
    const { sum }: NumberConstructor = numeric;
    export const number: number = [1, 2, 3].reduce(sum);
  `;

  const expectedOutput: string = String.raw`
    import { proxy[0-9a-f]+ as proxy[0-9a-f]+ } from "\.\./extensions/extensions";
    const numeric: NumberConstructor = Number;
    const { sum }: NumberConstructor = proxy[0-9a-f]+\(numeric, \[{ id: "Number", isStatic: true }\]\);
    export const number: number = \[1, 2, 3\].reduce\(sum\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite variable destructure static and object', (): void => {
  const code: string = `
    const string: string = 'hello World';
    const { capitalize: staticCapitalize }: StringConstructor = String;
    const { capitalize: objectCapitalize }: string = string;
    export const staticString: string = staticCapitalize(string);
    export const objectString: string = objectCapitalize();
  `;

  const expectedOutput: string = String.raw`
    import { proxy[0-9a-f]+ as proxy[0-9a-f]+ } from "\.\./extensions/extensions";
    const string: string = 'hello World';
    const { capitalize: staticCapitalize }: StringConstructor = proxy[0-9a-f]+\(String, \[{ id: "String", isStatic: true }, { id: "String", isStatic: false }\]\);
    const { capitalize: objectCapitalize }: string = proxy[0-9a-f]+\(string, \[{ id: "String", isStatic: true }, { id: "String", isStatic: false }\]\);
    export const staticString: string = staticCapitalize\(string\);
    export const objectString: string = objectCapitalize\(\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite variable destructure boolean literal', (): void => {
  const code: string = `
    export const { int: zero }: boolean = false;
    export const { int: one }: boolean = true;
  `;

  const expectedOutput: string = String.raw`
    import { merge[0-9a-f]+ as merge[0-9a-f]+ } from "\.\./extensions/extensions";
    export const { int: zero }: boolean = merge[0-9a-f]+\(false, \[{ id: "Boolean", isStatic: false }\]\);
    export const { int: one }: boolean = merge[0-9a-f]+\(true, \[{ id: "Boolean", isStatic: false }\]\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite variable destructure number literal', (): void => {
  const code: string = `
    export const { bigInt }: number = 0;
  `;

  const expectedOutput: string = String.raw`
    import { merge[0-9a-f]+ as merge[0-9a-f]+ } from "\.\./extensions/extensions";
    export const { bigInt }: number = merge[0-9a-f]+\(0, \[{ id: "Number", isStatic: false }\]\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite variable destructure bigint literal', (): void => {
  const code: string = `
    export const { number }: bigint = 1n;
  `;

  const expectedOutput: string = String.raw`
    import { merge[0-9a-f]+ as merge[0-9a-f]+ } from "\.\./extensions/extensions";
    export const { number }: bigint = merge[0-9a-f]+\(1n, \[{ id: "BigInt", isStatic: false }\]\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite variable destructure string literal', (): void => {
  const code: string = `
    export const { compact }: string = '   Hello   World   ';
  `;

  const expectedOutput: string = String.raw`
    import { merge[0-9a-f]+ as merge[0-9a-f]+ } from "\.\./extensions/extensions";
    export const { compact }: string = merge[0-9a-f]+\('   Hello   World   ', \[{ id: "String", isStatic: false }\]\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite variable destructure regexp literal', (): void => {
  const code: string = `
    export const { matches }: RegExp = /[A-Za-z]/g;
  `;

  const expectedOutput: string = String.raw`
    import { merge[0-9a-f]+ as merge[0-9a-f]+ } from "\.\./extensions/extensions";
    export const { matches }: RegExp = merge[0-9a-f]+\(/\[A-Za-z\]/g, \[{ id: "RegExp", isStatic: false }\]\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite variable destructure array literal', (): void => {
  const code: string = `
    export const { append }: number[] = [1, 2];
  `;

  const expectedOutput: string = String.raw`
    import { merge[0-9a-f]+ as merge[0-9a-f]+ } from "\.\./extensions/extensions";
    export const { append }: number\[\] = merge[0-9a-f]+\(\[1, 2\], \[{ id: "Array", isStatic: false }\]\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite variable destructure object literal', (): void => {
  const code: string = `
    interface Test {
      hello: string;
    }
    export const { keys }: Hello = { hello: 'Hello World' };
  `;

  const expectedOutput: string = String.raw`
    import { merge[0-9a-f]+ as merge[0-9a-f]+ } from "\.\./extensions/extensions";
    interface Test {
      hello: string;
    }
    export const { keys }: Hello = merge[0-9a-f]+\({ hello: 'Hello World' }, \[{ id: "Object", isStatic: false }\]\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite variable destructure array literal with object extension', (): void => {
  const code: string = `
    export const { keys }: number[] = [1, 2];
  `;

  const expectedOutput: string = String.raw`
    import { merge[0-9a-f]+ as merge[0-9a-f]+ } from "\.\./extensions/extensions";
    export const { keys }: number\[\] = merge[0-9a-f]+\(\[1, 2\], \[{ id: "Object", isStatic: false }\]\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite variable destructure new expression literal', (): void => {
  const code: string = `
    class Test {
      constructor(private readonly value: string) {}
    }
    export const { keys }: Test = new Test('Hello World');
  `;

  const expectedOutput: string = String.raw`
    import { proxy[0-9a-f]+ as proxy[0-9a-f]+ } from "\.\./extensions/extensions";
    class Test {
      constructor\(private readonly value: string\) {}
    }
    export const { keys }: Test = proxy[0-9a-f]+\(new Test\('Hello World'\), \[{ id: "Object", isStatic: true }, { id: "Object", isStatic: false }\]\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite variable destructure variable', (): void => {
  const code: string = `
    const numeric: string = '1234';
    export const { number }: string = numeric;
  `;

  const expectedOutput: string = String.raw`
    import { proxy[0-9a-f]+ as proxy[0-9a-f]+ } from "\.\./extensions/extensions";
    const numeric: string = '1234';
    export const { number }: string = proxy[0-9a-f]+\(numeric, \[{ id: "BigInt", isStatic: false }, { id: "String", isStatic: false }\]\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite variable destructure nested variable', (): void => {
  const code: string = `
    const numeric: string = '1234';
    export const { number: { bigInt } }: string = numeric;
  `;

  const expectedOutput: string = String.raw`
    import { proxy[0-9a-f]+ as proxy[0-9a-f]+ } from "\.\./extensions/extensions";
    const numeric: string = '1234';
    export const { number: arg[0-9a-f]+ }: string = proxy[0-9a-f]+\(numeric, \[{ id: "BigInt", isStatic: false }, { id: "String", isStatic: false }\]\),
    { bigInt } = proxy[0-9a-f]+\(arg[0-9a-f]+, \[{ id: "Number", isStatic: false }, { id: "String", isStatic: false }\]\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite variable destructure in array destructure', (): void => {
  const code: string = `
    export const [{ bigInt: one }, { bigInt: two }]: number[] = [1, 2];
  `;

  const expectedOutput: string = String.raw`
    import { proxy[0-9a-f]+ as proxy[0-9a-f]+ } from "\.\./extensions/extensions";
    export const \[arg[0-9a-f]+, arg[0-9a-f]+\]: number\[\] = \[1, 2\],
    { bigInt: one } = proxy[0-9a-f]+\(arg[0-9a-f]+, \[{ id: "Number", isStatic: false }, { id: "String", isStatic: false }\]\),
    { bigInt: two } = proxy[0-9a-f]+\(arg[0-9a-f]+, \[{ id: "Number", isStatic: false }, { id: "String", isStatic: false }\]\);
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite variable destructure with dependent initializer', (): void => {
  const code: string = `
    interface Test {
      one: number;
      two?: bigint;
      three?: number;
    }
    export const { one: { bigInt: one }, two: { number: two } = one + 1n, three = two + 1 } :Test = { one: 1 };
  `;

  const expectedOutput: string = String.raw`
    import { proxy[0-9a-f]+ as proxy[0-9a-f]+ } from "\.\./extensions/extensions";
    interface Test {
      one: number;
      two\?: bigint;
      three\?: number;
    }
    export const { one: arg[0-9a-f]+, two: init[0-9a-f]+, three: init[0-9a-f]+ }: Test = { one: 1 },
    { bigInt: one } = proxy[0-9a-f]+\(arg[0-9a-f]+, \[{ id: "Number", isStatic: false }, { id: "String", isStatic: false }\]\),
    arg[0-9a-f]+ = init[0-9a-f]+ \?\? one \+ 1n,
    { number: two } = proxy[0-9a-f]+\(arg[0-9a-f]+, \[{ id: "BigInt", isStatic: false }, { id: "String", isStatic: false }\]\),
    three = init[0-9a-f]+ \?\? two \+ 1;
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite variable destructure in array destructure with dependent initializer', (): void => {
  const code: string = `
    export const [{ bigInt: one }, { number: two } = one + 1n, three = two + 1, four]: [number, bigint | undefined, number | undefined, number] = [1, undefined, undefined, 4];
  `;

  const expectedOutput: string = String.raw`
    import { proxy[0-9a-f]+ as proxy[0-9a-f]+ } from "\.\./extensions/extensions";
    export const \[arg[0-9a-f]+, init[0-9a-f]+, init[0-9a-f]+, four\]: \[ number, bigint \| undefined, number \| undefined, number \] = \[1, undefined, undefined, 4\],
    { bigInt: one } = proxy[0-9a-f]+\(arg[0-9a-f]+, \[{ id: "Number", isStatic: false }, { id: "String", isStatic: false }\]\),
    arg[0-9a-f]+ = init[0-9a-f]+ \?\? one \+ 1n,
    { number: two } = proxy[0-9a-f]+\(arg[0-9a-f]+, \[{ id: "BigInt", isStatic: false }, { id: "String", isStatic: false }\]\),
    three = init[0-9a-f]+ \?\? two \+ 1;
  `;

  expect<string>(transform(code).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('variable destructure static literal property', (): void => {
  const { sum }: NumberConstructor = Number;
  expect<number>([1, 2, 3].reduce(sum)).toEqual<number>(6);
});

it<object>('variable destructure static variable property', (): void => {
  const numeric: NumberConstructor = Number;
  const { sum }: NumberConstructor = numeric;
  expect<number>([1, 2, 3].reduce(sum)).toEqual<number>(6);
});

it<object>('variable destructure static and object property', (): void => {
  const string: string = 'hello World';
  const { capitalize: staticCapitalize }: StringConstructor = String;
  const { capitalize: objectCapitalize }: string = string;
  expect<string>(staticCapitalize(string)).toEqual<string>('Hello World');
  expect<string>(objectCapitalize.call<string, [], string>(string)).toEqual<string>('Hello World');
});

it<object>('variable destructure static existing method not shadowed', (): void => {
  const { keys }: ObjectConstructor = Object;
  expect<string[]>(keys({ hello: 'Hello World' })).toEqual<string[]>(['hello']);
});

it<object>('variable destructure literal property', (): void => {
  const { int }: boolean = false;
  expect<number>(int).toEqual<number>(0);
});

it<object>('variable destructure literal property rename', (): void => {
  const { int: zero }: boolean = false;
  expect<number>(zero).toEqual<number>(0);
});

it<object>('variable destructure variable property', (): void => {
  const boolean: boolean = false;
  const { int }: boolean = boolean;
  expect<number>(int).toEqual<number>(0);
});

it<object>('variable destructure variable property rename', (): void => {
  const boolean: boolean = false;
  const { int: zero }: boolean = boolean;
  expect<number>(zero).toEqual<number>(0);
});

it<object>('variable destructure literal getter', (): void => {
  const { number }: string = '1234';
  expect<number>(number).toEqual<number>(1234);
});

it<object>('variable destructure literal getter rename', (): void => {
  const { number: numeric }: string = '1234';
  expect<number>(numeric).toEqual<number>(1234);
});

it<object>('variable destructure variable getter', (): void => {
  const string: string = '1234';
  const { number }: string = string;
  expect<number>(number).toEqual<number>(1234);
});

it<object>('variable destructure variable getter rename', (): void => {
  const string: string = '1234';
  const { number: numeric }: string = string;
  expect<number>(numeric).toEqual<number>(1234);
});

it<object>('variable destructure literal property function invocation', (): void => {
  const { compact }: string = '   Hello   World   ';
  expect<string>(compact()).toEqual<string>('Hello World');
});

it<object>('variable destructure literal property function invocation rename', (): void => {
  const { compact: squash }: string = '   Hello   World   ';
  expect<string>(squash()).toEqual<string>('Hello World');
});

it<object>('variable destructure variable property function invocation', (): void => {
  const string: string = '   Hello   World   ';
  const { compact }: string = string;
  expect<string>(compact()).toEqual<string>('Hello World');
});

it<object>('variable destructure variable property function invocation rename', (): void => {
  const string: string = '   Hello   World   ';
  const { compact: squash }: string = string;
  expect<string>(squash()).toEqual<string>('Hello World');
});

it<object>('variable destructure literal method invocation', (): void => {
  const { append }: number[] = [1, 2];
  expect<number[]>(append.call<number[], [number], number[]>([3, 4], 5)).toEqual<number[]>([3, 4, 5]);
});

it<object>('variable destructure literal method invocation rename', (): void => {
  const { append: add }: number[] = [1, 2];
  expect<number[]>(add.call<number[], [number], number[]>([3, 4], 5)).toEqual<number[]>([3, 4, 5]);
});

it<object>('variable destructure variable method invocation', (): void => {
  const { append }: number[] = [1, 2];
  expect<number[]>(append.call<number[], [number], number[]>([3, 4], 5)).toEqual<number[]>([3, 4, 5]);
});

it<object>('variable destructure variable method invocation rename', (): void => {
  const { append: add }: number[] = [1, 2];
  expect<number[]>(add.call<number[], [number], number[]>([3, 4], 5)).toEqual<number[]>([3, 4, 5]);
});

it<object>('variable destructure nested variable', (): void => {
  const {
    bigInt: { number },
  }: string = '1234';

  expect<number>(number).toEqual<number>(1234);
});

it<object>('variable destructure in array destructure', (): void => {
  const [
    {
      bigInt: { number },
    },
  ]: string[] = ['1234'];

  expect<number>(number).toEqual<number>(1234);
});

it<object>('variable destructure with dependent initializer', (): void => {
  interface Test {
    one: number;
    two?: bigint;
    three?: number;
  }
  const {
    one: { bigInt: one },
    two: { number: two } = one + 1n,
    three = two + 1,
  }: Test = { one: 1 };

  expect<[bigint, number, number]>([one, two, three]).toEqual<[bigint, number, number]>([1n, 2, 3]);
});

it<object>('variable destructure in array destructure with dependent initializer', (): void => {
  const [{ bigInt: one }, { number: two } = one + 1n, three = two + 1, four]: [number, bigint | undefined, number | undefined, number] = [
    1,
    undefined,
    undefined,
    4,
  ];

  expect<[bigint, number, number, number]>([one, two, three, four]).toEqual<[bigint, number, number, number]>([1n, 2, 3, 4]);
});

it<object>('variable destructure rest parameter', (): void => {
  const string: String = String('   Hello   World   ');
  const { ...rest }: String = string;

  expect<number>(rest.number).toEqual<number>(Number.NaN);
  expect<bigint>(rest.bigInt).toBeUndefined();
  expect<string>(rest.compact()).toEqual<string>('Hello World');
  expect<() => string>(rest.capitalize).toBeUndefined();
});

it<object>('variable destructure named with rest parameter', (): void => {
  const string: String = String('   1234   ');
  const { bigInt, capitalize, ...rest }: String = string;

  expect<number>(rest.number).toEqual<number>(1234);
  expect<bigint>(bigInt).toEqual<bigint>(1234n);
  expect<string>(rest.compact()).toEqual<string>('1234');
  expect<string>(capitalize.call<string, [], string>('hello World')).toEqual<string>('Hello World');
});

it<object>('variable destructure not implemented', (): void => {
  const { notImplemented }: object = {};
  expect<unknown>(notImplemented).toBeUndefined();
});

it<object>('variable destructure existing method not shadowed', (): void => {
  interface Test {
    hello: string;
  }

  const { keys: objectKeys }: Test = { hello: 'Hello World' };
  const { keys: arrayKeys }: number[] = [0, 1];

  expect<string[]>(objectKeys.call<Test, [], string[]>({ hello: 'Hello World' })).toEqual<string[]>(['hello']);
  expect<number[]>([...arrayKeys.call<number[], [], ArrayIterator<number>>([0, 1])]).toEqual<number[]>([0, 1]);
});
