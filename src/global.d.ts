declare global {
  interface ObjectConstructor {
    assign<T extends object, U, V extends Partial<T> & Partial<U>>(target: T, source: U): V;
    fromEntries<T extends string, U>(entries: Iterable<readonly [PropertyKey, U]>): { [key: T]: U };
  }

  interface String {
    capitalize(): string;
  }

  interface ArrayConstructor {
    isArray<T>(arg: T | T[]): arg is T[];
    isArray<T, U extends unknown[] | readonly unknown[]>(arg: T | U): arg is T extends unknown[] | readonly unknown[] ? T | U : U;
  }

  interface Array<T> {
    depth(): number;
    equals<U>(array: U[]): boolean;
    includes<U>(searchElement: T extends U ? U : never, fromIndex?: number): boolean;
    invert(invert: boolean): [...this];
    map<U, V extends U[]>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: unknown): V;
    reduce<U extends unknown[], V extends U>(
      callbackfn: (accumulator: U, currentValue: T, currentIndex: number, array: T[]) => U,
      initialValue: U,
    ): V;
    zip<U>(array: U[]): ([T] | [T, U])[];
  }

  interface ReadonlyArray<T> {
    map<U, V extends U[]>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: unknown): V;
  }
}

export {};
