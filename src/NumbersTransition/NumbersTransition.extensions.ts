import { Numbers } from './NumbersTransition.enums';

export type OrArray<T> = T | T[];

Array.prototype.depth = function (): number {
  const depth = <T>(array: OrArray<T>): number =>
    Array.isArray<OrArray<T>>(array)
      ? Numbers.ONE + Math.max(Numbers.ZERO, ...array.map<number>(depth<T>))
      : Numbers.ZERO;

  return depth<unknown>(this);
};

Array.prototype.invert = function <T>(reverse: boolean): T[] {
  return reverse ? this.reverse() : this;
};

Array.prototype.zip = function <T>(array: T[]): [unknown, T][] {
  return this.map<[unknown, T]>((value: unknown, index: number): [unknown, T] => [value, array[index]]);
};

Object.isEmpty = function <T extends object>(object: T): boolean {
  return this.keys(object).length === Numbers.ZERO;
};
