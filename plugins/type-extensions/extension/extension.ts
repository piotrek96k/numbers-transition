import { PropertyName } from '../enums/property-name';

abstract class Extension<T> {
  readonly value!: T;

  public constructor(value: T) {
    Object.defineProperty<this>(this, PropertyName.Value, { value, writable: false, enumerable: false, configurable: false });
  }
}

interface ExtensionClass<T> {
  new (...args: [T]): Extension<T>;
  id: string;
  type: ((...args: any[]) => any) | object;
  isType(value: unknown): boolean;
}

type ExtensionConstructor<T, U extends ExtensionClass<T>> = InstanceType<U>;

export default Extension;

export type { ExtensionConstructor };
