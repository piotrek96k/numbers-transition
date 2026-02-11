declare global {
  interface Boolean {
    int: number;
  }

  interface NumberConstructor {
    sum(first: number, second: number): number;
  }

  interface Number {
    readonly bigInt: bigint;
  }

  interface BigInt {
    readonly number: number;
  }

  interface String {
    readonly bigInt: bigint;
    readonly number: number;
    compact: () => string;
  }

  interface RegExp {
    matches(string: string): string[];
  }

  interface Array<T> {
    append(element: T): T[];
  }

  interface Object {
    notImplemented: unknown;
    keys(): string[];
  }
}

export {};
