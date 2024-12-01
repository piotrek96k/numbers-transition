declare global {
  interface Array<T> {
    map<U, V = U>(
      callbackfn: (value: T, index: number, array: [...this]) => U,
      thisArg?: unknown,
    ): { [K in keyof this]: V };
    reduce<U, V = U>(
      callbackfn: (accumulator: U, currentValue: T, currentIndex: number, array: T[]) => U,
      initialValue: U,
    ): V;
    reverse(): [...this];
  }
}

export {};
