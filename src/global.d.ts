import { ArrayOfDepth, OrArray } from './NumbersTransition/NumbersTransition.types';

declare global {
  interface Number {
    toFixed(fractionDigits?: number): `${number}`;
  }

  interface ObjectConstructor {
    assign<T extends object, U, V extends Partial<T> & Partial<U>>(target: T, source: U): V;
    fromEntries<T extends string, U>(entries: Iterable<readonly [PropertyKey, U]>): { [key: T]: U };
  }

  interface String {
    capitalize(): string;
  }

  interface RegExp {
    testAny<T>(unknown: unknown): unknown is T;
  }

  interface ArrayConstructor {
    isArray<T>(arg: OrArray<T>): arg is T[];
    isArray<T, U extends unknown[] | readonly unknown[]>(arg: T | U): arg is T extends unknown[] | readonly unknown[] ? T | U : U;
    isOfDepth<T, U extends number>(array: unknown, depth: U): array is ArrayOfDepth<T, U>;
    depth<T>(array: T): number;
  }

  interface Array<T> {
    equals<U>(array: U[]): boolean;
    includes<U>(searchElement: T extends U ? U : never, fromIndex?: number): boolean;
    invert(invert: boolean): [...this];
    map<U, V extends U[]>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: unknown): V;
    reduce<U extends unknown[], V extends U>(
      callbackfn: (accumulator: U, currentValue: T, currentIndex: number, array: T[]) => U,
      initialValue: U,
    ): V;
    zip<U>(array: U[]): ([T] | [T, U])[];
  }

  interface ReadonlyArray<T> {
    map<U, V extends U[]>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: unknown): V;
  }
}

export {};
