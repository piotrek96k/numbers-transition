import { PropertyName } from '../enums/property-name';

abstract class Extension<T> {
  readonly value!: T;

  public constructor(value: T) {
    Object.defineProperty<this>(this, PropertyName.Value, { value, writable: false, enumerable: false, configurable: false });
  }
}

export default Extension;
