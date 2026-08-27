import type { Integer, Key } from './NumbersTransition.enums';
import type { NumbersTransitionTheme } from './NumbersTransition.styles';
import type {
  Assert,
  At,
  Drop,
  First,
  Last,
  Nullable,
  Optional,
  OrArray,
  OrFunction,
  OrReadOnly,
  ReactElement,
  ReactNode,
  Slice,
  Take,
  Tuple,
  Zip,
} from './NumbersTransition.types';

declare global {
  interface NumberConstructor {
    subtract(first: number, second: number): number;
    sum(first: number, second: number): number;
  }

  interface BigInt {
    readonly digit: number;
  }

  interface String {
    readonly number: number;
    capitalize(): string;
    capitalize<T extends string>(this: T): Capitalize<T>;
    partition(index: number): [string, string];
    take(size: number): string;
  }

  interface Object {
    callOrGet<T extends unknown[], U>(this: OrFunction<T, U>, ...args: T): U;
    callOrGet<T extends unknown[], U extends unknown[], V>(this: OrFunction<T, V>, ...args: T | U): V;
    keys(): string[];
    map<T, U>(this: Record<string, T>, mapper: (entry: [string, T]) => [string, U]): Record<string, U>;
    matches<T, U extends T>(this: T, predicate: unknown): this is U;
    pipe<T, U>(this: T, mapper: (value: T) => U): U;
    pipeEach<T, U extends unknown[]>(this: T, ...mappers: { [I in keyof U]: (value: At<[T, ...U], I>) => U[I] }): Last<U>;
    values<T>(this: Record<string, T>): T[];
    values<T, U extends T[]>(this: Record<string, T>): U;
  }

  interface ArrayConstructor {
    first<T extends unknown[]>(array: T): First<T>;
    isArray<T>(arg: OrArray<T>): arg is T[];
    isArray<T, U extends OrReadOnly<unknown[]>>(arg: T | U): arg is T extends OrReadOnly<unknown[]> ? T | U : U;
    range(size: number): number[];
    toArray<T>(value: OrArray<T>): T[];
  }

  interface Array<T> {
    readonly depth: number;
    append(element: T): T[];
    append<U>(element: U): T extends U ? U[] : never;
    at(index: number): Optional<T>;
    at<U extends number>(index: U): At<this, U>;
    collapse(): string;
    equals<U extends T>(array: U[]): boolean;
    filterEach(...predicates: ((value: T, index: number, array: T[]) => unknown)[]): T[];
    findMap<U>(mapper: (value: T, index: number, array: T[]) => Optional<U>): Optional<U>;
    findMap<U>(mapper: (value: T, index: number, array: T[]) => Optional<U>, fallback: U): U;
    first(): First<this>;
    insert(index: number, value: T): T[];
    intersects(array: T[]): boolean;
    last(): Last<this>;
    map<U>(callback: (value: T, index: number, array: T[]) => U, thisArg?: unknown): { [I in keyof this]: U };
    map<U, V extends number | U[]>(callback: (value: T, index: number, array: T[]) => U, thisArg?: unknown): V extends number ? Tuple<U, V> : V;
    mapEach(...mappers: ((value: T, index: number, array: T[]) => T)[]): T[];
    mapEach<U>(...mappers: [(value: T, index: number, array: T[]) => U, ...((vale: U, index: number, array: U[]) => U)[]]): U[];
    mapEach<U extends unknown[], V extends { [I in keyof U]: U[I][] } = { [I in keyof U]: U[I][] }>(
      ...mappers: { [I in keyof U]: (value: Assert<At<[this, ...V], I>, unknown[]>[number], index: number, array: At<[this, ...V], I>) => U[I] }
    ): Last<V>;
    mapEach<
      U extends unknown[],
      V extends number | { [I in keyof U]: U[I][] },
      W extends { [I in keyof U]: U[I][] } = { [I in keyof U]: V extends number ? Tuple<U[I], V> : U[I][] },
    >(
      ...mappers: { [I in keyof U]: (value: Assert<At<[this, ...W], I>, unknown[]>[number], index: number, array: At<[this, ...W], I>) => U[I] }
    ): Last<W>;
    pipe<U>(mapper: (array: this) => U): U;
    pipeEach<U extends unknown[]>(...mappers: { [I in keyof U]: (value: At<[this, ...U], I>) => U[I] }): Last<U>;
    reduce<U extends unknown[], V extends number | U>(callback: (acc: U, curr: T, index: number, array: T[]) => U, initial: U): V extends number ? Tuple<U[number], V> : V;
    slice(start?: number, end?: number): T[];
    slice<T extends number = Integer.Zero>(start: T): Slice<[...this], T, this[Key.Length]>;
    slice<T extends number = Integer.Zero, U extends number = this[Key.Length]>(start: T, end: U): Slice<[...this], T, U>;
    slice<T extends number = Integer.Zero, U extends number = this[Key.Length], V = Slice<[...this], T, U>>(start: T, end: U): Slice<[...this], T, U> extends V ? V : never;
    when(predicate: unknown): T[];
    zip<U extends unknown[]>(...array: U): Zip<this, U>;
    zip<U extends this, V extends unknown[]>(...array: V): Zip<U, V>;
  }

  interface ReadonlyArray<T> {
    readonly depth: number;
    map<U>(callback: (value: T, index: number, array: readonly T[]) => U, thisArg?: unknown): { -readonly [I in keyof this]: U };
    map<U, V extends number | U[]>(callback: (value: T, index: number, array: readonly T[]) => U, thisArg?: unknown): V extends number ? Tuple<U, V> : V;
  }

  interface FunctionConstructor {
    call<T extends (...args: any[]) => unknown>(callback: T, ...args: Parameters<T>): ReturnType<T>;
    identity<T>(value: T): T;
  }

  interface Function {
    bindArgs<T extends (...args: any[]) => unknown, U extends number>(this: T, ...args: Take<Parameters<T>, U>): (...args: Drop<Parameters<T>, U>) => ReturnType<T>;
    bindWhen<T extends (...args: any[]) => unknown>(this: T, condition: OrFunction<Parameters<T>, unknown>): (...args: Parameters<T>) => Optional<ReturnType<T>>;
    callWhen<T extends (...args: any[]) => unknown>(this: T, condition: OrFunction<Parameters<T>, unknown>, ...args: Parameters<T>): Optional<ReturnType<T>>;
    invokeWhen<T extends (...args: any[]) => unknown>(this: T, condition: OrFunction<Parameters<T>, unknown>, ...args: Parameters<T>): void;
    splitArgs<T extends (...args: any[]) => unknown, U extends number>(this: T, index: U): (...args: Take<Parameters<T>, U>) => (...args: Drop<Parameters<T>, U>) => ReturnType<T>;
  }

  interface Math {
    roundTo(value: number, precision: number): number;
  }

  interface HTMLElement {
    readonly boundingClientRect: DOMRect;
    readonly computedStyle: CSSStyleDeclaration;
  }

  interface CSSStyleDeclaration {
    readonly transformProperty: string;
  }
}

declare module 'styled-components' {
  export interface DefaultTheme extends NumbersTransitionTheme {}

  export interface ThemeProviderProps {
    children?: ReactNode;
    theme: OrFunction<[Partial<DefaultTheme>], Partial<DefaultTheme>>;
  }

  export function ThemeProvider(props: ThemeProviderProps): Nullable<ReactElement>;
}
