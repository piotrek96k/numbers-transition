import { Integer } from './NumbersTransition.enums';
import { ArrayOfDepth, OrArray, Zip } from './NumbersTransition.types';

class GenericExt<T> {
  public constructor(protected readonly value: T) {}
}

export class StringExt extends GenericExt<string> {
  public readonly capitalize = (): string => `${this.value[Integer.Zero].toUpperCase()}${this.value.slice(Integer.One)}`;
}

export class RegExpExt extends GenericExt<RegExp> {
  public readonly testAny = <T>(unknown: unknown): unknown is T => this.value.test(`${unknown}`);
}

export class ArrayExt<T> extends GenericExt<T[]> {
  public static readonly toArray = <T>(value: OrArray<T>): T[] => (Array.isArray<T>(value) ? value : [value]);

  public static readonly isOfDepth = <T, U extends number>(array: unknown, depth: U): array is ArrayOfDepth<T, U> =>
    this.depth<unknown>(array) === depth;

  public static readonly depth = <T>(array: T): number =>
    Array.isArray<T>(array)
      ? Integer.One +
        array.map<number>(this.depth).reduce((current: number, next: number): number => (current === next ? next : Number.NaN))
      : Integer.Zero;

  public readonly equals = <U extends T>({ length, ...array }: U[]): boolean =>
    this.value.length === length && this.value.every((value: T, index: number): boolean => value === array[index]);

  public readonly filterAll = (predicate: (array: T[]) => boolean): T[] => (predicate(this.value) ? this.value : []);

  public readonly filterMulti = (predicates: ((value: T, index: number, array: T[]) => boolean)[]): T[] =>
    predicates.reduce<T[]>(
      (array: T[], predicate: (value: T, index: number, array: T[]) => boolean): T[] => array.filter(predicate),
      this.value,
    );

  public readonly zip = <U>(array: U[]): Zip<T[], U[]> =>
    this.value.map<[T] | [T, U], Zip<T[], U[]>>((value: T, index: number): [T] | [T, U] =>
      array[index] === undefined ? [value] : [value, array[index]],
    );
}

export class FunctionExt extends GenericExt<(...args: unknown[]) => unknown> {
  public static readonly invoke = <T extends () => any>(callback: T): ReturnType<T> => callback();

  public static readonly optionalCall: {
    <T extends (...args: unknown[]) => any>(callback: T, ...args: Parameters<T>): ReturnType<T>;
    <T>(callback: T): T;
  } = <T extends (...args: unknown[]) => any>(callback: T, ...args: Parameters<T>): ReturnType<T> =>
    typeof callback === 'function' ? callback(...args) : callback;
}
