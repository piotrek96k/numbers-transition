import { ReactElement, ReactNode, SyntheticEvent } from 'react';
import { Integer, Key, Text } from './NumbersTransition.enums';

export type TypeOf<T> = T[keyof T];

export type Enum<E> = Record<keyof E, string | number> & { [key: number]: string };

export type Optional<T> = T | undefined;

export type Nullable<T> = T | null;

export type ReadOnly<T> = { +readonly [K in keyof T]: ReadOnly<T[K]> };

export type OrReadOnly<T> = T | ReadOnly<T>;

export type OrArray<T> = T | T[];

export type TupleOfLength<T, U extends number, V extends T[] = []> = V[Key.Length] extends U ? V : TupleOfLength<T, U, [...V, T]>;

export type ArrayOfDepth<T, U extends number, V extends unknown[] = []> = U extends V[Key.Length]
  ? T
  : ArrayOfDepth<T[], U, [...V, unknown]>;

export type ReadOnlyArrayOfDepth<T, U extends number, V extends readonly unknown[] = readonly []> = U extends V[Key.Length]
  ? T
  : ReadOnlyArrayOfDepth<readonly T[], U, readonly [...V, unknown]>;

export type Slice<T extends string, U extends string> = T extends `${U}${infer V}` ? V : T;

export type Every<T extends [unknown, unknown][], U, V, W extends unknown[] = []> = W[Key.Length] extends T[Key.Length]
  ? U
  : T[W[Key.Length]][Integer.Zero] extends T[W[Key.Length]][Integer.One]
    ? Every<T, U, V, [...W, unknown]>
    : V;

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
