import { Numbers } from './NumbersTransition.enums';
import { ArrayOfDepth, OrArray } from './NumbersTransition.types';

String.prototype.capitalize = function (): string {
  return `${this[Numbers.ZERO].toUpperCase()}${this.slice(Numbers.ONE)}`;
};

RegExp.prototype.testAny = function <T>(unknown: unknown): unknown is T {
  return this.test(`${unknown}`);
};

Array.isOfDepth = function <T, U extends number>(array: unknown, depth: U): array is ArrayOfDepth<T, U> {
  return Array.depth<unknown>(array) === depth;
};

Array.depth = function <T>(array: T): number {
  const depth = (array: OrArray<T>): number =>
    Array.isArray<T>(array) ? Numbers.ONE + Math.max(Numbers.ZERO, ...array.map<number>(depth)) : Numbers.ZERO;

  return depth(array);
};

Array.prototype.equals = function <T>(array: T[]): boolean {
  return this.length === array.length && this.every((value: unknown, index: number): boolean => value === array[index]);
};

Array.prototype.invert = function <T>(reverse: boolean): T[] {
  return reverse ? this.reverse() : this;
};

Array.prototype.zip = function <T>(array: T[]): ([unknown] | [unknown, T])[] {
  return this.map<[unknown] | [unknown, T]>((value: unknown, index: number): [unknown] | [unknown, T] =>
    array[index] === undefined ? [value] : [value, array[index]],
  );
};
