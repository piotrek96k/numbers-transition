import Extension, { ExtensionConstructor } from 'type-extensions/extension';
import { Integer } from './NumbersTransition.enums';
import type { ArrayOfDepth, Optional, OrArray, ValueOf, Zip } from './NumbersTransition.types';

export class Predicate extends Extension<boolean> implements ExtensionConstructor<boolean, typeof Predicate> {
  public static readonly id: string = 'Boolean';
  public static readonly type: BooleanConstructor = Boolean;

  public static isType(value: unknown): boolean {
    return typeof value === 'boolean' || value instanceof Boolean;
  }

  public get int(): number {
    return this.value ? Integer.One : Integer.Zero;
  }

  public get bigInt(): bigint {
    return BigInt(this.int);
  }
}

export class Double extends Extension<number> implements ExtensionConstructor<number, typeof Double> {
  public static readonly id: string = 'Number';
  public static readonly type: NumberConstructor = Number;

  public static isType(value: unknown): boolean {
    return typeof value === 'number' || value instanceof Number;
  }

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

export class Long extends Extension<bigint> implements ExtensionConstructor<bigint, typeof Long> {
  public static readonly id: string = 'BigInt';
  public static readonly type: BigIntConstructor = BigInt;

  public static isType(value: unknown): boolean {
    return typeof value === 'bigint';
  }

  public get digit(): number {
    return Math.abs(Number(this.value % BigInt(Integer.Ten)));
  }
}

export class CharSequence extends Extension<string> implements ExtensionConstructor<string, typeof CharSequence> {
  public static readonly id: string = 'String';
  public static readonly type: StringConstructor = String;

  public static isType(value: unknown): boolean {
    return typeof value === 'string' || value instanceof String;
  }

  public get bigInt(): bigint {
    return BigInt(this.value);
  }

  public get number(): number {
    return parseFloat(this.value);
  }

  public capitalize(): string {
    return `${this.value[Integer.Zero].toUpperCase()}${this.value.slice(Integer.One)}`;
  }
}

export class Pattern extends Extension<RegExp> implements ExtensionConstructor<RegExp, typeof Pattern> {
  public static readonly id: string = 'RegExp';
  public static readonly type: RegExpConstructor = RegExp;

  public static isType(value: unknown): boolean {
    return value instanceof RegExp;
  }

  public testAny<T>(unknown: unknown): unknown is T {
    return this.value.test(`${unknown}`);
  }
}

export class List<T> extends Extension<T[]> implements ExtensionConstructor<T[], typeof List<T>> {
  public static readonly id: string = 'Array';
  public static readonly type: ArrayConstructor = Array;

  public static isType(value: unknown): boolean {
    return Array.isArray<unknown>(value);
  }

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

  public zip<U>(...{ length, ...array }: U[]): Zip<T[], U[]> {
    return this.value.map<[T] | T[] | [T, U] | [...T[], U], Zip<T[], U[]>>((value: T, index: number): [T] | T[] | [T, U] | [...T[], U] => [
      ...Array.toArray<T>(value),
      ...((index < length ? [array[index]] : []) satisfies [U] | []),
    ]);
  }
}

export class Method<T extends (...args: unknown[]) => unknown> extends Extension<T> implements ExtensionConstructor<T, typeof Method<T>> {
  public static readonly id: string = 'Function';
  public static readonly type: FunctionConstructor = Function;

  public static isType(value: unknown): boolean {
    return typeof value === 'function';
  }

  public static invoke<T>(callback: () => T): T {
    return callback();
  }

  public static optionalCall<T extends (...args: unknown[]) => any>(callback: T, ...args: Parameters<T>): ReturnType<T> {
    return typeof callback === 'function' ? callback(...args) : callback;
  }
}

export class Struct<T extends object> extends Extension<T> implements ExtensionConstructor<T, typeof Struct<T>> {
  public static readonly id: string = 'Object';
  public static readonly type: ObjectConstructor = Object;

  public static isType(value: unknown): boolean {
    return (typeof value === 'object' || typeof value === 'function') && value !== null;
  }

  public keys(): string[] {
    return Object.keys(this.value);
  }

  public map<U>(mapper: (entry: [string, ValueOf<T>]) => [string, U]): Record<string, U> {
    return Object.fromEntries<U>(Object.entries<any>(this.value).map<[string, U]>(mapper));
  }

  public matches<U extends T>(predicate: (value: T) => value is U): this is U {
    return predicate(this.value);
  }

  public pipe<U>(mapper: (value: T) => U): U {
    return mapper(this.value);
  }

  public values(): ValueOf<T>[] {
    return Object.values<any>(this.value);
  }
}

export class Calc extends Extension<never> implements ExtensionConstructor<never, typeof Calc> {
  public static readonly id: string = 'Math';
  public static readonly type: Math = Math;

  public static isType(): boolean {
    return false;
  }

  public static roundTo(value: number, precision: number): number {
    return Math.round(value * Integer.Ten ** precision) / Integer.Ten ** precision;
  }
}

export class DomElement extends Extension<HTMLElement> implements ExtensionConstructor<HTMLElement, typeof DomElement> {
  public static readonly id: string = 'HTMLElement';
  public static readonly type: typeof HTMLElement = HTMLElement;

  public static isType(value: unknown): boolean {
    return value instanceof HTMLElement;
  }

  public get computedStyle(): CSSStyleDeclaration {
    return getComputedStyle(this.value);
  }
}
