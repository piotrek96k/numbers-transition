type ReadOnly<T> = {
  +readonly [K in keyof T]: ReadOnly<T[K]>;
};

export type OrReadOnly<T> = T | ReadOnly<T>;

export type OrArray<T> = T | T[];

export type Not<T, U> = T extends U ? never : T;
