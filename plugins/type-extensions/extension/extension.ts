import { ExtensionPropertyName } from '../enums/extension-property-name';
import { LiteralType } from './../enums/literal-type';

abstract class Extension<T> {
  readonly value!: T;

  public constructor(value: T) {
    Object.defineProperty<this>(this, ExtensionPropertyName.Value, { value, writable: false, enumerable: false, configurable: false });
  }
}

interface ExtensionClass<T> {
  new (...args: [T]): Extension<T>;
  type: ((...args: any[]) => any) | object;
  literalType?: LiteralType[];
  isType(value: unknown): boolean;
}

type ExtensionConstructor<T, U extends ExtensionClass<T>> = InstanceType<U>;

export default Extension;

export { LiteralType };

export type { ExtensionConstructor };
