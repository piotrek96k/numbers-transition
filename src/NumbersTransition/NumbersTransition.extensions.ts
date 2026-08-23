import Extension, { ExtensionConstructor, LiteralType } from 'type-extensions/extension';
import type { Drop, First, Last, Nullish, Optional, OrArray, OrFunction, Take, ValueOf, Zip } from './NumbersTransition.types';
import { DragAndDropVariableName, Integer, Text, Typeof } from './NumbersTransition.enums';

export class Double extends Extension<number> implements ExtensionConstructor<number, typeof Double> {
  public static readonly type: NumberConstructor = Number;
  public static readonly literalType: LiteralType[] = [LiteralType.Number];

  public static isType(value: unknown): value is number {
    return typeof value === Typeof.Number || value instanceof Number;
  }

  public static subtract(first: number, second: number): number {
    return first - second;
  }

  public static sum(first: number, second: number): number {
    return first + second;
  }
}

export class Long extends Extension<bigint> implements ExtensionConstructor<bigint, typeof Long> {
  public static readonly type: BigIntConstructor = BigInt;
  public static readonly literalType: LiteralType[] = [LiteralType.BigInt];

  public static isType(value: unknown): value is bigint {
    return typeof value === Typeof.BigInt;
  }

  public get digit(): number {
    return Math.abs(Number(this.value % BigInt(Integer.Ten)));
  }
}

export class Str extends Extension<string> implements ExtensionConstructor<string, typeof Str> {
  public static readonly type: StringConstructor = String;
  public static readonly literalType: LiteralType[] = [LiteralType.String];

  public static isType(value: unknown): value is string {
    return typeof value === Typeof.String || value instanceof String;
  }

  public get number(): number {
    return parseFloat(this.value);
  }

  public capitalize(): string {
    return `${this.value[Integer.Zero].toUpperCase()}${this.value.slice(Integer.One)}`;
  }

  public remove(searchValue: string | RegExp): string {
    return this.value.replace(searchValue, Text.Empty);
  }

  public take(size: number): string {
    return this.value.slice(Integer.Zero, size);
  }
}

export class Struct<T extends object> extends Extension<T> implements ExtensionConstructor<T, typeof Struct<T>> {
  public static readonly type: ObjectConstructor = Object;
  public static readonly literalType: LiteralType[] = Object.values<LiteralType>(LiteralType);

  public static isType(value: unknown): value is object {
    return [undefined, null].every((nullish: Nullish): boolean => value !== nullish);
  }

  public callOrGet(...args: T extends (...args: infer U) => any ? U : never): (T extends (...args: any[]) => infer U ? U : never) | T {
    return Callable.isType(this.value) ? this.value(...args) : this.value;
  }

  public keys(): string[] {
    return Object.keys(this.value);
  }

  public map<U>(mapper: (entry: [string, ValueOf<T>]) => [string, U]): Record<string, U> {
    return Object.fromEntries<U>(Object.entries<any>(this.value).map<[string, U]>(mapper));
  }

  public matches<U extends T>(predicate: unknown): this is Struct<U> {
    return !!predicate;
  }

  public pipe<U>(mapper: (value: T) => U): U {
    return mapper(this.value);
  }

  public pipeEach(...mappers: ((value: T) => T)[]): T {
    return mappers.reduce<T>((value: T, mapper: (value: T) => T): T => mapper(value), this.value);
  }

  public values(): ValueOf<T>[] {
    return Object.values<any>(this.value);
  }
}

export class List<T> extends Extension<T[]> implements ExtensionConstructor<T[], typeof List<T>> {
  public static readonly type: ArrayConstructor = Array;
  public static readonly literalType: LiteralType[] = [LiteralType.Array];

  public static isType(value: unknown): value is unknown[] {
    return Array.isArray<unknown>(value);
  }

  public static first<T extends unknown[]>(array: T): First<T> {
    return array[Integer.Zero];
  }

  public static range(size: number): number[] {
    return [...Array<unknown>(size).keys()];
  }

  public static toArray<T>(value: OrArray<T>): T[] {
    return Array.isArray<T>(value) ? value : [value];
  }

  // prettier-ignore
  public get depth(): number {
    const depth = <U>(value: U): number => Array.isArray<U>(value)
      ? Integer.One + (value.length && value.map<number>(depth<U>).reduce((curr: number, next: number): number => (curr === next ? next : Number.NaN)))
      : Integer.Zero;
    return depth<T[]>(this.value);
  }

  public append(element: T): T[] {
    this.value.push(element);
    return this.value;
  }

  public collapse(): string {
    return this.value.join(Text.Empty);
  }

  public equals<U extends T>({ length, ...array }: U[]): boolean {
    return this.value.length === length && this.value.every((value: T, index: number): boolean => value === array[index]);
  }

  public filterEach(...predicates: ((value: T, index: number, array: T[]) => unknown)[]): T[] {
    return predicates.reduce<T[]>(
      (array: T[], predicate: (value: T, index: number, array: T[]) => unknown): T[] => array.filter(predicate),
      this.value,
    );
  }

  public findMap<U>(mapper: (value: T, index: number, array: T[]) => Optional<U>, fallback?: U): Optional<U> {
    let result: Optional<U>;
    this.value.find((...args: [value: T, index: number, array: T[]]): unknown => (result = mapper(...args)) !== undefined);
    return result ?? fallback;
  }

  public first(): First<T[]> {
    return this.value[Integer.Zero];
  }

  public insert(index: number, value: T): T[] {
    return [...this.value.slice(Integer.Zero, index), value, ...this.value.slice(index)];
  }

  public intersects(array: T[]): boolean {
    return this.value.some((value: T): boolean => array.includes(value));
  }

  public last(): Last<T[]> {
    return this.value[this.value.length - Integer.One];
  }

  public mapEach(...mappers: ((value: T, index: number, array: T[]) => T)[]): T[] {
    return mappers.reduce<T[]>((array: T[], mapper: (value: T, index: number, array: T[]) => T): T[] => array.map<T>(mapper), this.value);
  }

  public when(predicate: unknown): T[] {
    return predicate ? this.value : [];
  }

  public zip<U>(...{ length, ...array }: U[]): Zip<T[], U[]> {
    return this.value.map<T[] | [...T[], U], Zip<T[], U[]>>((value: T, index: number): T[] | [...T[], U] => [
      ...List.toArray<T>(value),
      ...((index < length ? [array[index]] : []) satisfies [U?]),
    ]);
  }
}

export class Callable<T extends (...args: any[]) => any> extends Extension<T> implements ExtensionConstructor<T, typeof Callable<T>> {
  public static readonly type: FunctionConstructor = Function;
  public static readonly literalType: LiteralType[] = [LiteralType.Function];

  public static isType(value: unknown): value is (...args: any[]) => any {
    return typeof value === Typeof.Function;
  }

  public static call<T extends (...args: any[]) => any>(callback: T, ...args: Parameters<T>): ReturnType<T> {
    return callback(...args);
  }

  public static identity<T>(value: T): T {
    return value;
  }

  public bindArgs<U extends number>(...outerArgs: Take<Parameters<T>, U>): (...innerArgs: Drop<Parameters<T>, U>) => ReturnType<T> {
    return (...innerArgs: Drop<Parameters<T>, U>): ReturnType<T> => this.value(...outerArgs, ...innerArgs);
  }

  public bindWhen(condition: OrFunction<Parameters<T>, any>): (...args: Parameters<T>) => Optional<ReturnType<T>> {
    return (...args: Parameters<T>): Optional<ReturnType<T>> => this.callWhen(condition, ...args);
  }

  public callWhen(condition: OrFunction<Parameters<T>, any>, ...args: Parameters<T>): Optional<ReturnType<T>> {
    return new Struct<OrFunction<Parameters<T>, any>>(condition).callOrGet(...args) ? this.value(...args) : undefined;
  }

  public invokeWhen(condition: OrFunction<Parameters<T>, any>, ...args: Parameters<T>): void {
    this.callWhen(condition, ...args);
  }

  // prettier-ignore
  public splitArgs<U extends number>(index: U): (...outerArgs: [...Take<Parameters<T>, U>, ...unknown[]]) => (...innerArgs: Drop<Parameters<T>, U>) => ReturnType<T> {
    return (...outerArgs: [...Take<Parameters<T>, U>, ...unknown[]]): ((...innerArgs: Drop<Parameters<T>, U>) => ReturnType<T>) =>
      this.bindArgs<U>(...outerArgs.slice<Integer.Zero, U, Take<Parameters<T>, U>>(Integer.Zero, index));
  }
}

export class Calc extends Extension<never> implements ExtensionConstructor<never, typeof Calc> {
  public static readonly type: Math = Math;

  public static isType(): false {
    return false;
  }

  public static roundTo(value: number, precision: number): number {
    return Math.round(value * Integer.Ten ** precision) / Integer.Ten ** precision;
  }
}

export class Element extends Extension<HTMLElement> implements ExtensionConstructor<HTMLElement, typeof Element> {
  public static readonly type: typeof HTMLElement = HTMLElement;

  public static isType(value: unknown): value is HTMLElement {
    return value instanceof HTMLElement;
  }

  public get boundingClientRect(): DOMRect {
    return this.value.getBoundingClientRect();
  }

  public get computedStyle(): CSSStyleDeclaration {
    return getComputedStyle(this.value);
  }
}

export class Style extends Extension<CSSStyleDeclaration> implements ExtensionConstructor<CSSStyleDeclaration, typeof Style> {
  public static readonly type: typeof CSSStyleDeclaration = CSSStyleDeclaration;

  public static isType(value: unknown): value is CSSStyleDeclaration {
    return value instanceof CSSStyleDeclaration;
  }

  public get transformProperty(): string {
    return this.value.getPropertyValue(DragAndDropVariableName.Transform);
  }
}
