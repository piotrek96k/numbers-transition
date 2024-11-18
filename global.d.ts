declare global {
  interface Array<T> {
    map<U>(callbackfn: (value: T, index: number, array: [...this]) => U, thisArg?: unknown): { [K in keyof this]: U };
    reverse(): [...this];
  }
}

export {};
