type ReadOnly<T> = {
  +readonly [K in keyof T]: ReadOnly<T[K]>;
};

export type OrReadOnly<T> = T | ReadOnly<T>;

export type OrArray<T> = T | T[];

export type Falsy = undefined | null | false | '' | 0 | 0n;

export type UncheckedBigDecimal = number | bigint | string;

export type BigDecimal = number | bigint | `${number}`;
