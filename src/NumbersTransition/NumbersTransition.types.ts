import { Strings } from './NumbersTransition.enums';

export type TypeOf<T> = T[keyof T];

type Length = TypeOf<{ [K in keyof unknown[]]: unknown[][K] extends number ? K : never }>;

export type TupleIndex<T extends unknown[]> = Exclude<keyof T, keyof unknown[]>;

export type MappedTuple<T extends { [index: `${number}`]: unknown }, U extends unknown[] = []> = `${U[Length]}` extends keyof T
  ? MappedTuple<T, [...U, T[`${U[Length]}`]]>
  : U;

export type ReadOnly<T> = { +readonly [K in keyof T]: ReadOnly<T[K]> };

export type OrReadOnly<T> = T | ReadOnly<T>;

export type OrArray<T> = T | T[];

export type Slice<T extends string, U extends string> = U extends `${T}${infer V}` ? V : U;

export type CamelCase<T extends string, U extends string> = T extends `${Strings.EMPTY}` ? U : `${T}${Capitalize<U>}`;

export type Falsy = undefined | null | false | `${Strings.EMPTY}` | [][Length];

export type UncheckedBigDecimal = number | bigint | string;

export type BigDecimal = number | bigint | `${number}`;
