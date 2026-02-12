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
    number: number;
    readonly bigInt: bigint;
    compact: () => string;
    capitalize(): string;
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
