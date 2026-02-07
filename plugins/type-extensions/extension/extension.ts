import { ArgName } from '../enums/arg-name';

abstract class Extension<T> {
  readonly value!: T;

  public constructor(value: T) {
    Object.defineProperty<this>(this, ArgName.Value, { value, writable: false, enumerable: false, configurable: false });
  }
}

export default Extension;
