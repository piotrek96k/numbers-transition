import Extension from '../../../type-extensions/extension/extension';

export class Predicate extends Extension<boolean> {
  public readonly int: number = this.value ? 1 : 0;
}

export class Double extends Extension<number> {
  public static sum(first: number, second: number): number {
    return first + second;
  }

  public get bigInt(): bigint {
    return BigInt(this.value);
  }
}

export class Long extends Extension<bigint> {
  public get number(): number {
    return Number(this.value);
  }
}

export class CharSequence extends Extension<string> {
  public get bigInt(): bigint {
    return BigInt(this.value);
  }

  public get number(): number {
    return Number(this.value);
  }

  public readonly compact = (): string => this.value.replace(/\s+/g, ' ').trim();
}

export class Pattern extends Extension<RegExp> {
  public matches(string: string): string[] {
    return [...string.matchAll(this.value)].map<string>(([match]: RegExpMatchArray): string => match);
  }
}

export class List<T> extends Extension<T[]> {
  public append(element: T): T[] {
    return [...this.value, element];
  }
}

export class Struct<T extends object> extends Extension<T> {
  public keys(): string[] {
    return Object.keys(this.value);
  }
}
