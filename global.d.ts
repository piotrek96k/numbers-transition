declare global {
  interface Array<T> {
    depth(): number;
    invert(invert: boolean): [...this];
    map<U, V = { [K in keyof this]: U }>(
      callbackfn: (value: T, index: number, array: [...this]) => U,
      thisArg?: unknown,
    ): V;
    reduce<U, V = U>(
      callbackfn: (accumulator: U, currentValue: T, currentIndex: number, array: [...this]) => U,
      initialValue: U,
    ): V;
    reverse(): [...this];
  }

  interface ReadonlyArray<T> {
    map<U, V = { -readonly [K in keyof this]: U }>(
      callbackfn: (value: T, index: number, array: [...this]) => U,
      thisArg?: unknown,
    ): V;
  }
}

export {};
