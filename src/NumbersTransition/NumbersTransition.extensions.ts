import { Integer } from './NumbersTransition.enums';
import type { ArrayOfDepth, OrArray, Zip } from './NumbersTransition.types';

class Value<T> {
  public constructor(protected readonly value: T) {}
}

export class Double extends Value<number> {
  public static subtract(first: number, second: number): number {
    return first - second;
  }

  public static sum(first: number, second: number): number {
    return first + second;
  }

  public get bigInt(): bigint {
    return BigInt(this.value);
  }
}

export class Long extends Value<bigint> {
  public get digit(): number {
    return Math.abs(Number(this.value % BigInt(Integer.Ten)));
  }
}

export class CharSequence extends Value<string> {
  public get bigInt(): bigint {
    return BigInt(this.value);
  }

  public capitalize(): string {
    return `${this.value[Integer.Zero].toUpperCase()}${this.value.slice(Integer.One)}`;
  }
}

export class Pattern extends Value<RegExp> {
  public testAny<T>(unknown: unknown): unknown is T {
    return this.value.test(`${unknown}`);
  }
}

export class List<T> extends Value<T[]> {
  public static toArray<T>(value: OrArray<T>): T[] {
    return Array.isArray<T>(value) ? value : [value];
  }

  public static isOfDepth<T, U extends number>(array: unknown, depth: U): array is ArrayOfDepth<T, U> {
    return this.depth<unknown>(array) === depth;
  }

  // prettier-ignore
  public static depth<T>(array: T): number {
    return Array.isArray<T>(array)
      ? Integer.One + array.map<number>(Array.depth).reduce((current: number, next: number): number => (current === next ? next : Number.NaN))
      : Integer.Zero;
  }

  public append(element: T): T[] {
    return [...this.value, element];
  }

  public equals<U extends T>({ length, ...array }: U[]): boolean {
    return this.value.length === length && this.value.every((value: T, index: number): boolean => value === array[index]);
  }

  public filterAll(predicate: unknown): T[] {
    return predicate ? this.value : [];
  }

  public filterMulti(predicates: ((value: T, index: number, array: T[]) => boolean)[]): T[] {
    return predicates.reduce<T[]>(
      (array: T[], predicate: (value: T, index: number, array: T[]) => boolean): T[] => array.filter(predicate),
      this.value,
    );
  }

  public mapAll<U>(mapper: (array: T[]) => U): U {
    return mapper(this.value);
  }

  public mapMulti(mappers: ((value: T, index: number, array: T[]) => T)[]): T[] {
    return mappers.reduce<T[]>((array: T[], mapper: (value: T, index: number, array: T[]) => T): T[] => array.map<T>(mapper), this.value);
  }

  public zip<U>(array: U[]): Zip<T[], U[]> {
    return this.value.map<[T] | T[] | [T, U] | [...T[], U], Zip<T[], U[]>>((value: T, index: number): [T] | T[] | [T, U] | [...T[], U] => [
      ...Array.toArray<T>(value),
      ...((array[index] === undefined ? [] : [array[index]]) satisfies [] | [U]),
    ]);
  }
}

export class Method<T extends (...args: unknown[]) => unknown> extends Value<T> {
  public static invoke<T extends () => any>(callback: T): ReturnType<T> {
    return callback();
  }

  public static optionalCall<T extends (...args: unknown[]) => any>(callback: T, ...args: Parameters<T>): ReturnType<T> {
    return typeof callback === 'function' ? callback(...args) : callback;
  }
}
