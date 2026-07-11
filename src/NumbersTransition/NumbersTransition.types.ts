import type { Dispatch, ReactElement, ReactNode, SetStateAction, SyntheticEvent } from 'react';
import type { Integer, Key, Text } from './NumbersTransition.enums';

// React
export type SetState<T> = Dispatch<SetStateAction<T>>;

export type ReactState<T> = [T, SetState<T>];

export type ReactEvent<T extends SyntheticEvent<HTMLElement, Event>> = T & { target: HTMLElement };

export type GenericReactNode<T> = Exclude<ReactNode, ReactElement<unknown>> | ReactElement<T>;

// Base Types
export type Primitive = boolean | string | number | bigint | null | undefined;

export type Nullish = undefined | null;

export type Falsy = false | `${Text.Empty}` | ParseNumber<`${Integer.Zero}`> | ParseBigInt<`${Integer.Zero}`> | null | undefined;

export type UncheckedBigDecimal = number | bigint | string;

export type BigDecimal = number | bigint | `${number}`;

// Type Constructors
export type Optional<T> = T | undefined;

export type Nullable<T> = T | null;

export type Maybe<T> = T | Falsy;

export type ReadOnly<T> = { +readonly [K in keyof T]: ReadOnly<T[K]> };

export type OrReadOnly<T> = T | ReadOnly<T>;

export type OrArray<T> = T | T[];

export type OrFunction<T extends unknown[], U> = ((...args: T) => U) | U;

// Type Logic
export type Assert<T, U> = T extends infer V extends U ? V : never;

export type When<T extends [unknown, unknown], U, V> = T extends [infer W, infer X] ? (W extends X ? U : V) : never;

export type Every<T extends [unknown, unknown][], U, V> = T extends [
  infer W extends [unknown, unknown],
  ...infer X extends [unknown, unknown][],
]
  ? When<W, Every<X, U, V>, V>
  : U;

export type Find<T extends [unknown, unknown, unknown][], U> = T extends [
  [...infer V extends [unknown, unknown], infer W],
  ...infer X extends [unknown, unknown, unknown][],
]
  ? When<V, W, Find<X, U>>
  : U;

export type Switch<T, U extends [unknown, unknown][], V = never> = U extends [[infer W, infer X], ...infer Y extends [unknown, unknown][]]
  ? Every<[[[T], [W]], [[W], [T]]], X, Switch<T, Y, V>>
  : V;

// Numbers
export type ParseNumber<T extends string> = T extends `${infer U extends number}` ? U : never;

// BigInts
export type ParseBigInt<T extends string> = T extends `${infer U extends bigint}` ? U : never;

// Strings
export type Slice<T extends string, U extends string> = T extends `${U}${infer V}` ? V : T;

// Objects
export type ValueOf<T> = T extends unknown ? T[keyof T] : never;

export type Select<T, U> = { [K in keyof T as T[K] extends U ? K : never]: T[K] };

export type Remove<T, U> = { [K in keyof T as T[K] extends U ? never : K]: T[K] };

// Enums
export type Enum<E> = Record<keyof E, string | number> & { [key: number]: string };

export type EnumValue<E extends Enum<E>> = E extends unknown ? ValueOf<E> : never;

export type EnumType<E extends Enum<E>, V extends EnumValue<E>> = E extends unknown ? (V extends ValueOf<E> ? E : never) : never;

// Tuples
export type ArrayOfDepth<T, U extends number, V extends unknown[] = []> = U extends V[Key.Length]
  ? T
  : ArrayOfDepth<T[] | readonly T[], U, [...V, unknown]>;

export type Tuple<T, U extends number, V extends T[] = []> = U extends unknown
  ? V[Key.Length] extends U
    ? V
    : Tuple<T, U, [...V, T]>
  : never;

export type At<T extends unknown[], U extends number | `${number}`> = When<
  [`${Integer.Zero}`, keyof T],
  When<
    [`${U}`, `${Text.Minus}${number}`],
    Add<T[Key.Length], ParseNumber<`${U}`>> extends infer W extends number ? When<[`${W}`, keyof T], T[W], undefined> : never,
    When<[`${U}`, keyof T], T[ParseNumber<`${U}`>], undefined>
  >,
  Optional<T[number]>
>;

export type First<T extends unknown[]> = `${Integer.Zero}` extends keyof T ? T[Integer.Zero] : T[number];

export type Join<T extends Primitive[], U extends string = Text.Empty, V extends string = Text.Empty> = T extends [
  infer W extends Primitive,
  ...infer X extends Primitive[],
]
  ? Join<X, U, V extends Text.Empty ? `${W}` : `${V}${U}${W}`>
  : V;

export type Last<T extends unknown[]> = T extends [...unknown[], infer U] ? U : T[number];

export type PadStart<T extends unknown[], U, V extends number> = Switch<
  MinUnsignedInt<T[Key.Length], V>,
  [[T[Key.Length], [...Tuple<U, SubtractUnsignedInt<[V, T[Key.Length]]>>, ...T]], [V, T]]
>;

export type PadEnd<T extends unknown[], U, V extends number> = Switch<
  MinUnsignedInt<T[Key.Length], V>,
  [[T[Key.Length], [...T, ...Tuple<U, SubtractUnsignedInt<[V, T[Key.Length]]>>]], [V, T]]
>;

export type Split<T extends unknown[], U extends number, V extends unknown[] = []> = `${U}` extends `${Text.Minus}${infer W extends number}`
  ? When<[W, V[Key.Length]], [T, V], T extends [...infer X, infer Y] ? Split<X, U, [Y, ...V]> : [T, V]>
  : When<[U, V[Key.Length]], [V, T], T extends [infer X, ...infer Y] ? Split<Y, U, [...V, X]> : [V, T]>;

export type TrimStart<T extends unknown[], U, V extends number = Integer.Zero> = Switch<
  MinUnsignedInt<T[Key.Length], V>,
  [[T[Key.Length], T], [V, T extends [infer W, ...infer X] ? (W extends U ? TrimStart<X, U, V> : T) : T]]
>;

export type TrimEnd<T extends unknown[], U, V extends number = Integer.Zero> = Switch<
  MinUnsignedInt<T[Key.Length], V>,
  [[T[Key.Length], T], [V, T extends [...infer W, infer X] ? (X extends U ? TrimEnd<W, U, V> : T) : T]]
>;

export type UnionProduct<T, U> = Find<[[T, undefined, U], [U, undefined, T]], Every<[[T, unknown], [U, unknown]], T & U, never>>;

export type Zip<T extends unknown[], U extends unknown[]> = Every<
  [[`${Integer.Zero}`, keyof T], [`${Integer.Zero}`, keyof U], [keyof T, keyof U]],
  Tuple<T[number] extends Array<unknown> ? [...T[number], U[number]] : [T[number], U[number]], T[Key.Length]>,
  ([T[number]] | [T[number], U[number]])[]
>;

// Math Number Parsers
type DecomposeDigits<T extends string | number, U extends number[] = []> = `${T}` extends `${infer V extends number}${infer W}`
  ? DecomposeDigits<W, [...U, V]>
  : U;

type DecomposeSignedInt<T extends string[], U extends number[], V extends number, W extends number[], X extends number> = [
  T,
  [...PadStart<U, Integer.Zero, V>, ...PadEnd<W, Integer.Zero, X>],
];

type DecomposeUnsignedFloat<T extends number> = `${T}` extends `${infer U extends number}${Text.Dot}${infer V extends string}`
  ? [DecomposeDigits<U>, DecomposeDigits<V>]
  : [DecomposeDigits<T>, []];

type DecomposeSignedFloat<T extends number> = `${T}` extends `${Text.Minus}${infer U extends number}`
  ? [[Text.Minus], ...DecomposeUnsignedFloat<U>]
  : [[], ...DecomposeUnsignedFloat<T>];

type DecomposeSignedFloats<Q extends number, R extends number> = [DecomposeSignedFloat<Q>, DecomposeSignedFloat<R>] extends [
  [infer S extends string[], infer T extends number[], infer U extends number[]],
  [infer V extends string[], infer W extends number[], infer X extends number[]],
]
  ? [MaxUnsignedInt<T[Key.Length], W[Key.Length]>, MaxUnsignedInt<U[Key.Length], X[Key.Length]>] extends [
      infer Y extends number,
      infer Z extends number,
    ]
    ? [DecomposeSignedInt<S, T, Y, U, Z>, DecomposeSignedInt<V, W, Y, X, Z>, Z]
    : never
  : never;

type ParseUnsignedFloat<T extends number[], U extends number> =
  Split<T, ParseNumber<`${Text.Minus}${U}`>> extends [infer V extends number[], infer W extends number[]]
    ? [
        ...TrimStart<V, Integer.Zero, Integer.One>,
        ...(TrimEnd<W, Integer.Zero> extends infer X extends number[] ? When<[X[Key.Length], Integer.Zero], [], [Text.Dot, ...X]> : never),
      ]
    : never;

type ParseSignedFloat<T extends [string[], number[]], U extends number> = T extends [infer V extends string[], infer W extends number[]]
  ? ParseNumber<Join<[...V, ...ParseUnsignedFloat<W, U>]>>
  : never;

// Math Unsigned Integers
type MinUnsignedInt<T extends number, U extends number> = When<[Tuple<unknown, T>, [...Tuple<unknown, U>, ...unknown[]]], U, T>;

type MaxUnsignedInt<T extends number, U extends number> = When<[Tuple<unknown, T>, [...Tuple<unknown, U>, ...unknown[]]], T, U>;

type CompareUnsignedInts<T extends number[], U extends number[]> = [T, U] extends [
  [infer V extends number, ...infer W extends number[]],
  [infer X extends number, ...infer Y extends number[]],
]
  ? V extends X
    ? CompareUnsignedInts<W, Y>
    : Switch<MaxUnsignedInt<V, X>, [[V, Integer.One], [X, Integer.MinusOne]]>
  : Integer.Zero;

type AddUnsignedInt<T extends number[], U extends unknown[] = []> = T extends [infer V extends number, ...infer W extends number[]]
  ? AddUnsignedInt<W, [...U, ...Tuple<unknown, V>]>
  : Assert<U[Key.Length], number>;

type SubtractUnsignedInt<T extends number[], U extends number = T extends [infer V extends number, ...number[]] ? V : never> = T extends [
  number,
  infer V extends number,
  ...infer W extends number[],
]
  ? SubtractUnsignedInt<[Tuple<unknown, U> extends [...Tuple<unknown, V>, ...infer W] ? W[Key.Length] : never, ...W]>
  : U;

// Math Unsigned Integer Tuples
type AddUnsignedInts<P extends number[], Q extends number[], R extends number[] = [], S extends number = Integer.Zero> = [P, Q] extends [
  [...infer T extends number[], infer U extends number],
  [...infer V extends number[], infer W extends number],
]
  ? AddUnsignedInt<[S, U, W]> extends infer X extends number
    ? `${X}` extends `${infer Y extends number}${infer Z extends number}`
      ? AddUnsignedInts<T, V, [Z, ...R], Y>
      : AddUnsignedInts<T, V, [X, ...R]>
    : never
  : [S, ...R];

type SubtractUnsignedInts<R extends number[], S extends number[], T extends number[] = [], U extends number = Integer.Zero> = [
  R,
  S,
] extends [[...infer V extends number[], infer W extends number], [...infer X extends number[], infer Y extends number]]
  ? AddUnsignedInt<[Y, U]> extends infer Z extends number
    ? W extends MaxUnsignedInt<W, Z>
      ? SubtractUnsignedInts<V, X, [SubtractUnsignedInt<[W, Z]>, ...T]>
      : SubtractUnsignedInts<V, X, [SubtractUnsignedInt<[AddUnsignedInt<[W, Integer.Ten]>, Z]>, ...T], Integer.One>
    : never
  : T;

// Math Signed Integer Tuples
type AddSignedInts<T extends string[], U extends number[], V extends string[], W extends number[]> = T extends V
  ? [T, AddUnsignedInts<U, W>]
  : SubtractSignedInts<T, U, T, W>;

type SubtractSignedInts<T extends string[], U extends number[], V extends string[], W extends number[]> = T extends V
  ? Switch<
      CompareUnsignedInts<U, W>,
      [
        [Integer.One, [T, SubtractUnsignedInts<U, W>]],
        [Integer.Zero, [[], SubtractUnsignedInts<U, W>]],
        [Integer.MinusOne, [T[Key.Length] extends Integer.Zero ? [Text.Minus] : [], SubtractUnsignedInts<W, U>]],
      ]
    >
  : AddSignedInts<T, U, T, W>;

// Math Operations
export type Add<T extends number, U extends number> =
  DecomposeSignedFloats<T, U> extends [
    [infer V extends string[], infer W extends number[]],
    [infer X extends string[], infer Y extends number[]],
    infer Z extends number,
  ]
    ? ParseSignedFloat<AddSignedInts<V, W, X, Y>, Z>
    : never;

export type Subtract<T extends number, U extends number> =
  DecomposeSignedFloats<T, U> extends [
    [infer V extends string[], infer W extends number[]],
    [infer X extends string[], infer Y extends number[]],
    infer Z extends number,
  ]
    ? ParseSignedFloat<SubtractSignedInts<V, W, X, Y>, Z>
    : never;
