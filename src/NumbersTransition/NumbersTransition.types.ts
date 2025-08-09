import { ReactElement, ReactNode, SyntheticEvent } from 'react';
import { Character, Integer } from './NumbersTransition.enums';

export type TypeOf<T> = T[keyof T];

export type Enum<E> = Record<keyof E, string | number> & { [key: number]: string };

export type TupleIndex<T extends unknown[]> = Exclude<keyof T, keyof unknown[]>;

export type MappedTuple<
  T extends { [index: `${number}`]: unknown },
  U extends unknown[] = [],
> = `${U[TypeOf<{ [K in keyof unknown[]]: unknown[][K] extends number ? K : never }>]}` extends keyof T
  ? MappedTuple<T, [...U, T[`${U[TypeOf<{ [K in keyof unknown[]]: unknown[][K] extends number ? K : never }>]}`]]>
  : U;

export type ReadOnly<T> = { +readonly [K in keyof T]: ReadOnly<T[K]> };

export type OrReadOnly<T> = T | ReadOnly<T>;

export type OrArray<T> = T | T[];

export type ArrayOfDepth<T, U extends number, V extends unknown[] = []> = U extends V[TypeOf<{
  [K in keyof unknown[]]: unknown[][K] extends number ? K : never;
}>]
  ? T
  : ArrayOfDepth<T[], U, [...V, unknown]>;

export type Slice<T extends string, U extends string> = T extends `${U}${infer V}` ? V : T;

export type Falsy =
  | false
  | `${Character.Empty}`
  | (`${Integer.Zero}` extends `${infer T extends number}` ? T : never)
  | (`${Integer.Zero}` extends `${infer T extends bigint}` ? T : never)
  | null
  | undefined;

export type UncheckedBigDecimal = number | bigint | string;

export type BigDecimal = number | bigint | `${number}`;

export type ReactEvent<T extends SyntheticEvent<HTMLElement, Event>> = T & { target: HTMLElement };

export type GenericReactNode<T> = Exclude<ReactNode, ReactElement<unknown>> | ReactElement<T>;
