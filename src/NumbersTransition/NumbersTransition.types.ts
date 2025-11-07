import { ReactElement, ReactNode, SyntheticEvent } from 'react';
import { Integer, Key, Text } from './NumbersTransition.enums';

export type ValueOf<T> = T extends unknown ? T[keyof T] : never;

export type Enum<E> = Record<keyof E, string | number> & { [key: number]: string };

export type EnumValue<E extends Enum<E>> = E extends unknown ? ValueOf<E> : never;

export type EnumType<E extends Enum<E>, V extends EnumValue<E>> = E extends unknown ? (V extends ValueOf<E> ? E : never) : never;

export type Optional<T> = T | undefined;

export type Nullable<T> = T | null;

export type ReadOnly<T> = { +readonly [K in keyof T]: ReadOnly<T[K]> };

export type OrReadOnly<T> = T | ReadOnly<T>;

export type OrArray<T> = T | T[];

export type TupleOfLength<T, U extends number, V extends T[] = []> = V[Key.Length] extends U ? V : TupleOfLength<T, U, [...V, T]>;

export type ArrayOfDepth<T, U extends number, V extends unknown[] = []> = U extends V[Key.Length]
  ? T
  : ArrayOfDepth<T[] | readonly T[], U, [...V, unknown]>;

export type Remove<T, U> = { [K in keyof T as T[K] extends U ? never : K]: T[K] };

export type Select<T, U> = { [K in keyof T as T[K] extends U ? K : never]: T[K] };

export type Slice<T extends string, U extends string> = T extends `${U}${infer V}` ? V : T;

export type Every<T extends [unknown, unknown][], U, V> = T extends [[infer W, infer X], ...infer Y extends [unknown, unknown][]]
  ? [W] extends [X]
    ? Every<Y, U, V>
    : V
  : U;

export type First<T extends [unknown, unknown, unknown][], U> = T extends [
  [infer V, infer W, infer X],
  ...infer Y extends [unknown, unknown, unknown][],
]
  ? V extends W
    ? X
    : First<Y, U>
  : U;

export type Switch<T, U extends [unknown, unknown][]> = U extends [[infer V, infer W], ...infer X extends [unknown, unknown][]]
  ? Every<[[[T], [V]], [[V], [T]]], W, Switch<T, X>>
  : never;

export type UnionProduct<T, U> = First<[[T, undefined, U], [U, undefined, T]], Every<[[T, unknown], [U, unknown]], T & U, never>>;

export type Zip<T extends unknown[], U extends unknown[]> = Every<
  [[`${Integer.Zero}`, keyof T], [`${Integer.Zero}`, keyof U], [keyof T, keyof U]],
  TupleOfLength<[T[number], U[number]], T[Key.Length]>,
  ([T[number]] | [T[number], U[number]])[]
>;

export type Falsy =
  | false
  | `${Text.Empty}`
  | (`${Integer.Zero}` extends `${infer T extends number}` ? T : never)
  | (`${Integer.Zero}` extends `${infer T extends bigint}` ? T : never)
  | null
  | undefined;

export type UncheckedBigDecimal = number | bigint | string;

export type BigDecimal = number | bigint | `${number}`;

export type ReactEvent<T extends SyntheticEvent<HTMLElement, Event>> = T & { target: HTMLElement };

export type GenericReactNode<T> = Exclude<ReactNode, ReactElement<unknown>> | ReactElement<T>;
