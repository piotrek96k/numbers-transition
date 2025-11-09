import { Integer } from './NumbersTransition.enums';
import { ArrayOfDepth, OrArray, Zip } from './NumbersTransition.types';

String.prototype.capitalize = function capitalize(): string {
  return `${this[Integer.Zero].toUpperCase()}${this.slice(Integer.One)}`;
};

RegExp.prototype.testAny = function testAny<T>(unknown: unknown): unknown is T {
  return this.test(`${unknown}`);
};

Array.isOfDepth = function isOfDepth<T, U extends number>(array: unknown, depth: U): array is ArrayOfDepth<T, U> {
  return Array.depth<unknown>(array) === depth;
};

Array.depth = function depth<T>(array: T): number {
  return Array.isArray<T>(array)
    ? Integer.One + array.map<number>(depth).reduce((current: number, next: number): number => (current === next ? next : Number.NaN))
    : Integer.Zero;
};

Array.toArray = function toArray<T>(value: OrArray<T>): T[] {
  return Array.isArray<T>(value) ? value : [value];
};

Array.prototype.equals = function equals<T>({ length, ...array }: T[]): boolean {
  return this.length === length && this.every((value: unknown, index: number): boolean => value === array[index]);
};

Array.prototype.zip = function zip<T extends unknown[], U extends unknown[]>(array: U): Zip<T, U> {
  return this.map<[T[number]] | [T[number], U[number]], Zip<T, U>>(
    (value: T[number], index: number): [T[number]] | [T[number], U[number]] =>
      array[index] === undefined ? [value] : [value, array[index]],
  );
};
