import { Numbers } from './NumbersTransition.enums';
import { OrArray } from './NumbersTransition.types';

String.prototype.capitalize = function (): string {
  return `${this[Numbers.ZERO].toUpperCase()}${this.slice(Numbers.ONE)}`;
};

Array.prototype.depth = function (): number {
  const depth = <T>(array: OrArray<T>): number =>
    Array.isArray<OrArray<T>>(array) ? Numbers.ONE + Math.max(Numbers.ZERO, ...array.map<number>(depth<T>)) : Numbers.ZERO;

  return depth<unknown>(this);
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
