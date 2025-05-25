declare global {
  interface ObjectConstructor {
    assign<T extends object, U, V extends Partial<T> & Partial<U>>(target: T, source: U): V;
    fromEntries<T extends string, U>(entries: Iterable<readonly [PropertyKey, U]>): { [k: T]: U };
  }

  interface String {
    capitalize(): string;
  }
  interface ArrayConstructor {
    isArray<T>(arg: T): arg is T[];
    isArray<T, U extends T[]>(arg: T): arg is U;
  }

  interface Array<T> {
    depth(): number;
    includes<U>(searchElement: T extends U ? U : never, fromIndex?: number): boolean;
    invert(invert: boolean): [...this];
    map<U, V extends U[]>(callbackfn: (value: T, index: number, array: [...this]) => U, thisArg?: unknown): V;
    reduce<U extends unknown[], V extends U>(
      callbackfn: (accumulator: U, currentValue: T, currentIndex: number, array: [...this]) => U,
      initialValue: U,
    ): V;
    zip<U>(array: U[]): [T, U][];
  }

  interface ReadonlyArray<T> {
    map<U, V extends U[]>(callbackfn: (value: T, index: number, array: [...this]) => U, thisArg?: unknown): V;
  }
}

export {};
