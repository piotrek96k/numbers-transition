import Extension from 'extension';
import { Integer } from './NumbersTransition.enums';
import type { ArrayOfDepth, Optional, OrArray, ValueOf, Zip } from './NumbersTransition.types';

export class Predicate extends Extension<boolean> {
  public get int(): number {
    return this.value ? Integer.One : Integer.Zero;
  }

  public get bigInt(): bigint {
    return BigInt(this.int);
  }
}

export class Double extends Extension<number> {
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

export class Long extends Extension<bigint> {
  public get digit(): number {
    return Math.abs(Number(this.value % BigInt(Integer.Ten)));
  }
}

export class CharSequence extends Extension<string> {
  public get bigInt(): bigint {
    return BigInt(this.value);
  }

  public capitalize(): string {
    return `${this.value[Integer.Zero].toUpperCase()}${this.value.slice(Integer.One)}`;
  }
}

export class Pattern extends Extension<RegExp> {
  public testAny<T>(unknown: unknown): unknown is T {
    return this.value.test(`${unknown}`);
  }
}

export class List<T> extends Extension<T[]> {
  public static toArray<T>(value: OrArray<T>): T[] {
    return Array.isArray<T>(value) ? value : [value];
  }

  public static isOfDepth<T, U extends number>(array: unknown, depth: U): array is ArrayOfDepth<T, U> {
    return Array.depth<unknown>(array) === depth;
  }

  public static depth<T>(array: T): number {
    return Array.isArray<T>(array)
      ? Integer.One + array.map<number>(Array.depth).reduce((curr: number, next: number): number => (curr === next ? next : Number.NaN))
      : Integer.Zero;
  }

  public append(element: T): T[] {
    return [...this.value, element];
  }

  public equals<U extends T>({ length, ...array }: U[]): boolean {
    return this.value.length === length && this.value.every((value: T, index: number): boolean => value === array[index]);
  }

  public filterEach(...predicates: ((value: T, index: number, array: T[]) => boolean)[]): T[] {
    return predicates.reduce<T[]>(
      (array: T[], predicate: (value: T, index: number, array: T[]) => boolean): T[] => array.filter(predicate),
      this.value,
    );
  }

  public findMap<U>(predicate: (value: T, index: number, obj: T[]) => unknown, callback: (value: T) => U, fallback?: U): Optional<U> {
    const element: Optional<T> = this.value.find(predicate);
    return element === undefined ? fallback : callback(element);
  }

  public mapEach(...mappers: ((value: T, index: number, array: T[]) => T)[]): T[] {
    return mappers.reduce<T[]>((array: T[], mapper: (value: T, index: number, array: T[]) => T): T[] => array.map<T>(mapper), this.value);
  }

  public when(predicate: unknown): T[] {
    return predicate ? this.value : [];
  }

  public zip<U>({ length, ...array }: U[]): Zip<T[], U[]> {
    return this.value.map<[T] | T[] | [T, U] | [...T[], U], Zip<T[], U[]>>((value: T, index: number): [T] | T[] | [T, U] | [...T[], U] => [
      ...Array.toArray<T>(value),
      ...((index < length ? [array[index]] : []) satisfies [U] | []),
    ]);
  }
}

export class Method<T extends (...args: unknown[]) => unknown> extends Extension<T> {
  public static invoke<T>(callback: () => T): T {
    return callback();
  }

  public static optionalCall<T extends (...args: unknown[]) => any>(callback: T, ...args: Parameters<T>): ReturnType<T> {
    return typeof callback === 'function' ? callback(...args) : callback;
  }
}

export class Struct<T extends object> extends Extension<T> {
  public fieldKeys(): string[] {
    return Object.keys(this.value);
  }

  public fieldValues(): ValueOf<T>[] {
    return Object.values(this.value);
  }

  public map<U>(mapper: (entry: [string, ValueOf<T>]) => [string, U]): Record<string, U> {
    return Object.fromEntries<U>(Object.entries(this.value).map<[string, U]>(mapper));
  }

  public matches<U extends T>(predicate: (value: T) => value is U): this is U {
    return predicate(this.value);
  }

  public pipe<U>(mapper: (value: T) => U): U {
    return mapper(this.value);
  }
}

export class Calc extends Extension<never> {
  public static roundTo(value: number, precision: number): number {
    return Math.round(value * Integer.Ten ** precision) / Integer.Ten ** precision;
  }
}
