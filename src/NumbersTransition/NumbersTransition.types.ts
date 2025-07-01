import { SyntheticEvent } from 'react';
import { Numbers, Strings } from './NumbersTransition.enums';

export type TypeOf<T> = T[keyof T];

export type Enum<E> = Record<keyof E, string | number> & { [key: number]: string };

export type TupleIndex<T extends unknown[]> = Exclude<keyof T, keyof unknown[]>;

export type MappedTuple<T extends { [index: `${number}`]: unknown }, U extends unknown[] = []> = `${U[Strings.LENGTH]}` extends keyof T
  ? MappedTuple<T, [...U, T[`${U[Strings.LENGTH]}`]]>
  : U;

export type ReadOnly<T> = { +readonly [K in keyof T]: ReadOnly<T[K]> };

export type OrReadOnly<T> = T | ReadOnly<T>;

export type OrArray<T> = T | T[];

export type Slice<T extends string, U extends string> = T extends `${U}${infer V}` ? V : T;

export type Falsy =
  | false
  | `${Strings.EMPTY}`
  | (`${Numbers.ZERO}` extends `${infer T extends number}` ? T : never)
  | (`${Numbers.ZERO}` extends `${infer T extends bigint}` ? T : never)
  | null
  | undefined;

export type UncheckedBigDecimal = number | bigint | string;

export type BigDecimal = number | bigint | `${number}`;

export type ReactEvent<T extends SyntheticEvent<HTMLElement, Event>> = T & { target: HTMLElement };
