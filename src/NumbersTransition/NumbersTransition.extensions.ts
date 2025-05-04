import { Numbers } from './NumbersTransition.enums';

Array.prototype.depth = function (): number {
  const depth = <T>(array: T | T[]): number =>
    Array.isArray(array) ? Numbers.ONE + Math.max(Numbers.ZERO, ...array.map<number>(depth<T>)) : Numbers.ZERO;

  return depth<unknown>(this);
};

Array.prototype.invert = function <T>(reverse: boolean): T[] {
  return reverse ? this.reverse() : this;
};
