import type { ArrayOfDepth, Optional, OrArray, PreviousElement, Zip } from './NumbersTransition/NumbersTransition.types';

declare global {
  interface Boolean {
    readonly int: number;
    readonly bigInt: bigint;
  }

  interface NumberConstructor {
    subtract(first: number, second: number): number;
    sum(first: number, second: number): number;
  }

  interface Number {
    readonly bigInt: bigint;
    toFixed(fractionDigits?: number): `${number}`;
  }

  interface BigInt {
    readonly digit: number;
  }

  interface String {
    readonly bigInt: bigint;
    capitalize(): string;
    capitalize<T extends string>(this: T): Capitalize<T>;
  }

  interface RegExp {
    testAny<T>(unknown: unknown): unknown is T;
  }

  interface ArrayConstructor {
    isArray<T>(arg: OrArray<T>): arg is T[];
    isArray<T, U extends unknown[] | readonly unknown[]>(arg: T | U): arg is T extends unknown[] | readonly unknown[] ? T | U : U;
    isOfDepth<T, U extends number>(array: unknown, depth: U): array is ArrayOfDepth<T, U>;
    depth<T>(array: T): number;
    toArray<T>(value: OrArray<T>): T[];
    toArray<T, U extends T[]>(value: OrArray<T>): U;
  }

  interface Array<T> {
    append(element: T): T[];
    append<U>(element: U): T extends U ? U[] : never;
    at(index: number): Optional<T>;
    at<U extends number>(index: U): U extends keyof this ? this[U] : Optional<T>;
    equals<U>(array: U[]): boolean;
    filterEach(...predicates: ((value: T, index: number, array: T[]) => boolean)[]): T[];
    findMap<U>(predicate: (value: T, index: number, obj: T[]) => unknown, callback: (value: T) => U): Optional<U>;
    findMap<U>(predicate: (value: T, index: number, obj: T[]) => unknown, callback: (value: T) => U, fallback: U): U;
    flatMap<U, V extends U[], W = undefined>(
      callback: (this: W, value: T, index: number, array: T[]) => U | ReadonlyArray<U>,
      thisArg?: W,
    ): V;
    forEach(callbackfn: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): void;
    includes<U>(searchElement: T extends U ? U : never, fromIndex?: number): boolean;
    map<U, V extends U[]>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: unknown): V;
    mapEach(...mappers: ((value: T, index: number, array: T[]) => T)[]): T[];
    mapEach<U extends unknown[], V extends { [I in keyof U]: U[I][] } = { [I in keyof U]: U[I][] }>(
      ...mappers: {
        [I in keyof U]: (
          value: PreviousElement<V, this, I> extends Array<infer W> ? W : never,
          index: number,
          array: PreviousElement<V, this, I>,
        ) => U[I];
      }
    ): V extends [...unknown[], infer W] ? W : never;
    pipe<U>(mapper: (array: this) => U): U;
    reduce(
      callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T extends unknown[] ? T[number][] : T,
    ): T extends unknown[] ? T[number][] : T;
    reduce<U extends unknown[], V extends U>(
      callbackfn: (accumulator: U, currentValue: T, currentIndex: number, array: T[]) => U,
      initialValue: U,
    ): V;
    when(predicate: unknown): T[];
    zip<U extends unknown[]>(...array: U): Zip<this, U>;
    zip<U extends this, V extends unknown[]>(...array: V): Zip<U, V>;
  }

  interface ReadonlyArray<T> {
    map<U, V extends U[]>(callbackfn: (value: T, index: number, array: readonly T[]) => U, thisArg?: unknown): V;
    reduce<U extends unknown[], V extends U>(
      callbackfn: (accumulator: U, currentValue: T, currentIndex: number, array: readonly T[]) => U,
      initialValue: U,
    ): V;
  }

  interface FunctionConstructor {
    invoke<T>(callback: () => T): T;
    optionalCall<T extends (...args: any[]) => unknown, U>(callback: T | U, ...args: Parameters<T>): ReturnType<T> | U;
    optionalCall<T extends (...args: any[]) => unknown, U, V extends Parameters<T>, W extends unknown[]>(
      callback: T | U,
      ...args: V | W
    ): ReturnType<T> | U;
  }

  interface Object {
    fieldKeys(): string[];
    fieldValues<T>(this: Record<string, T>): T[];
    fieldValues<T, U extends T[]>(this: Record<string, T>): U;
    map<T, U>(this: Record<string, T>, mapper: (entry: [string, T]) => [string, U]): Record<string, U>;
    matches<T extends object, U extends T>(this: T, predicate: (value: T) => value is U): this is U;
    pipe<T extends object, U>(this: T, mapper: (value: T) => U): U;
  }

  interface Math {
    roundTo(value: number, precision: number): number;
  }
}
