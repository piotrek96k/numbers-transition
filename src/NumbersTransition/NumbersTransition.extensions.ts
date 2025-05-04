import { Numbers } from './NumbersTransition.enums';

Array.depth = <T>(array: T | T[]): number =>
  Array.isArray(array) ? Numbers.ONE + Math.max(Numbers.ZERO, ...array.map<number>(Array.depth<T>)) : Numbers.ZERO;

Array.prototype.invert = function <T>(reverse: boolean): T[] {
  return reverse ? this.reverse() : this;
};
