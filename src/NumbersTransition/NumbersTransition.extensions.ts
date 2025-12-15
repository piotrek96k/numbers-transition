import { Integer } from './NumbersTransition.enums';
import type { ArrayOfDepth, OrArray, Zip } from './NumbersTransition.types';

class Value<T> {
  public constructor(protected readonly value: T) {}
}

export class Double extends Value<number> {
  public static readonly subtract = (first: number, second: number): number => first - second;

  public static readonly sum = (first: number, second: number): number => first + second;
}

export class BigInteger extends Value<bigint> {
  public readonly digit: number = Math.abs(Number(this.value % BigInt(Integer.Ten)));
}

export class CharSequence extends Value<string> {
  public readonly capitalize = (): string => `${this.value[Integer.Zero].toUpperCase()}${this.value.slice(Integer.One)}`;
}

export class Pattern extends Value<RegExp> {
  public readonly testAny = <T>(unknown: unknown): unknown is T => this.value.test(`${unknown}`);
}

export class List<T> extends Value<T[]> {
  public static readonly toArray = <T>(value: OrArray<T>): T[] => (Array.isArray<T>(value) ? value : [value]);

  public static readonly isOfDepth = <T, U extends number>(array: unknown, depth: U): array is ArrayOfDepth<T, U> =>
    this.depth<unknown>(array) === depth;

  // prettier-ignore
  public static readonly depth = <T>(array: T): number =>
    Array.isArray<T>(array)
      ? Integer.One + array.map<number>(this.depth).reduce((current: number, next: number): number => (current === next ? next : Number.NaN))
      : Integer.Zero;

  public readonly equals = <U extends T>({ length, ...array }: U[]): boolean =>
    this.value.length === length && this.value.every((value: T, index: number): boolean => value === array[index]);

  public readonly filterAll = (predicate: unknown): T[] => (predicate ? this.value : []);

  public readonly filterMulti = (predicates: ((value: T, index: number, array: T[]) => boolean)[]): T[] =>
    predicates.reduce<T[]>(
      (array: T[], predicate: (value: T, index: number, array: T[]) => boolean): T[] => array.filter(predicate),
      this.value,
    );

  public readonly mapAll = <U>(mapper: (array: T[]) => U): U => mapper(this.value);

  public readonly mapMulti = (mappers: ((value: T, index: number, array: T[]) => T)[]): T[] =>
    mappers.reduce<T[]>((array: T[], mapper: (value: T, index: number, array: T[]) => T): T[] => array.map<T>(mapper), this.value);

  public readonly zip = <U>(array: U[]): Zip<T[], U[]> =>
    this.value.map<[T] | T[] | [T, U] | [...T[], U], Zip<T[], U[]>>((value: T, index: number): [T] | T[] | [T, U] | [...T[], U] => [
      ...Array.toArray<T>(value),
      ...((array[index] === undefined ? [] : [array[index]]) satisfies [] | [U]),
    ]);
}

export class Method<T extends (...args: unknown[]) => unknown> extends Value<T> {
  public static readonly invoke = <T extends () => any>(callback: T): ReturnType<T> => callback();

  public static readonly optionalCall = <T extends (...args: unknown[]) => any>(callback: T, ...args: Parameters<T>): ReturnType<T> =>
    typeof callback === 'function' ? callback(...args) : callback;
}
