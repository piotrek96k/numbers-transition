import Extension, { ExtensionConstructor } from 'type-extensions/extension';

export class Predicate extends Extension<boolean> implements ExtensionConstructor<boolean, typeof Predicate> {
  public static readonly id: string = 'Boolean';
  public static readonly type: BooleanConstructor = Boolean;

  public static isType(value: unknown): boolean {
    return typeof value === 'boolean' || value instanceof Boolean;
  }

  public readonly int: number = this.value ? 1 : 0;
}

export class Double extends Extension<number> implements ExtensionConstructor<number, typeof Double> {
  public static readonly id: string = 'Number';
  public static readonly type: NumberConstructor = Number;

  public static isType(value: unknown): boolean {
    return typeof value === 'number' || value instanceof Number;
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

  public get number(): number {
    return Number(this.value);
  }
}

export class CharSequence extends Extension<string> implements ExtensionConstructor<string, typeof CharSequence> {
  public static readonly id: string = 'String';
  public static readonly type: StringConstructor = String;

  public static isType(value: unknown): boolean {
    return typeof value === 'string' || value instanceof String;
  }

  public readonly number: number = Number(this.value);

  public get bigInt(): bigint {
    return BigInt(this.value);
  }

  public readonly compact = (): string =>
    this.value
      .replace(/(?<=[()[\]])\s+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  public capitalize(): string {
    return `${this.value[0].toUpperCase()}${this.value.slice(1)}`;
  }
}

export class Pattern extends Extension<RegExp> implements ExtensionConstructor<RegExp, typeof Pattern> {
  public static readonly id: string = 'RegExp';
  public static readonly type: RegExpConstructor = RegExp;

  public static isType(value: unknown): boolean {
    return value instanceof RegExp;
  }

  public matches(string: string): string[] {
    return [...string.matchAll(this.value)].map<string>(([match]: RegExpMatchArray): string => match);
  }
}

export class List<T> extends Extension<T[]> implements ExtensionConstructor<T[], typeof List<T>> {
  public static readonly id: string = 'Array';
  public static readonly type: ArrayConstructor = Array;

  public static isType(value: unknown): boolean {
    return Array.isArray(value);
  }

  public append(element: T): T[] {
    return [...this.value, element];
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
}
