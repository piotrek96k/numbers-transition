type ReadOnly<T> = {
  +readonly [K in keyof T]: ReadOnly<T[K]>;
};

export type OrReadOnly<T> = T | ReadOnly<T>;

export type OrArray<T> = T | T[];

export type Slice<T extends string, U extends string> = U extends `${T}${infer V}` ? V : U;

export type CamelCase<T extends string, U extends string> = T extends '' ? U : `${T}${Capitalize<U>}`;

export type Falsy = undefined | null | false | '' | 0 | 0n;

export type UncheckedBigDecimal = number | bigint | string;

export type BigDecimal = number | bigint | `${number}`;
