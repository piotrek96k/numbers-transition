import { expect, it } from 'vitest';

it<object>('property access apply function', (): void => {
  expect<number[]>([1].append.apply<number[], [number], number[]>([1, 2], [3])).toEqual<number[]>([1, 2, 3]);
});

it<object>('property access call function', (): void => {
  expect<number[]>([1].append.call<number[], [number], number[]>([1, 2], 3)).toEqual<number[]>([1, 2, 3]);
});

it<object>('property access bind function', (): void => {
  expect<number[]>([1].append.bind<(element: number) => number[]>([1, 2])(3)).toEqual<number[]>([1, 2, 3]);
});

it<object>('variable destructure apply function', (): void => {
  const { append } = [1];
  expect<number[]>(append.apply<number[], [number], number[]>([1, 2], [3])).toEqual<number[]>([1, 2, 3]);
});

it<object>('variable destructure call function', (): void => {
  const { append } = [1];
  expect<number[]>(append.call<number[], [number], number[]>([1, 2], 3)).toEqual<number[]>([1, 2, 3]);
});

it<object>('variable destructure bind function', (): void => {
  const { append } = [1];
  expect<number[]>(append.bind<(element: number) => number[]>([1, 2])(3)).toEqual<number[]>([1, 2, 3]);
});
