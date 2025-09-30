import { ArrayOfDepth, Optional, OrArray, Zip } from './NumbersTransition/NumbersTransition.types';

declare global {
  interface Number {
    toFixed(fractionDigits?: number): `${number}`;
  }

  interface ObjectConstructor {
    assign<T extends object, U, V extends Partial<T> & Partial<U>>(target: T, source: U): V;
    fromEntries<T extends string, U>(entries: Iterable<readonly [PropertyKey, U]>): { [key: T]: U };
    values<T>(o: { [s: string]: T } | ArrayLike<T>): T[];
    values<T, U extends T[]>(o: { [s: string]: T } | ArrayLike<T>): U;
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
    toArray<T>(value: OrArray<T>): T[];
    toArray<T, U extends T[]>(value: OrArray<T>): U;
  }

  interface Array<T> {
    at(index: U): Optional<T>;
    at<U extends number>(index: U): U extends keyof this ? this[U] : Optional<T>;
    equals<U>(array: U[]): boolean;
    flatMap<U, V extends U[], W = undefined>(
      callback: (this: W, value: T, index: number, array: T[]) => U | ReadonlyArray<U>,
      thisArg?: W,
    ): V;
    forEach(callbackfn: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): void;
    includes<U>(searchElement: T extends U ? U : never, fromIndex?: number): boolean;
    map<U, V extends U[]>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: unknown): V;
    reduce<U extends unknown[], V extends U>(
      callbackfn: (accumulator: U, currentValue: T, currentIndex: number, array: T[]) => U,
      initialValue: U,
    ): V;
    zip<U extends unknown[]>(array: U): Zip<this, U>;
    zip<U extends this, V extends unknown[]>(array: V): Zip<U, V>;
  }

  interface ReadonlyArray<T> {
    map<U, V extends U[]>(callbackfn: (value: T, index: number, array: readonly T[]) => U, thisArg?: unknown): V;
    reduce<U extends unknown[], V extends U>(
      callbackfn: (accumulator: U, currentValue: T, currentIndex: number, array: readonly T[]) => U,
      initialValue: U,
    ): V;
  }
}

export {};
