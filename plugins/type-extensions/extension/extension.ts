import { Constructor } from '../enums/constructor';

abstract class Extension<T> {
  readonly #value: T;

  public constructor(value: T) {
    this.#value = value;
    this.#copyOriginalProperties();
  }

  #copyOriginalProperties(): void {
    const valObj: object = Object(this.#value);
    Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter((key: string): boolean => key !== Constructor.Name && key in valObj)
      .map<this>((key: string): this => Object.defineProperty(this, key, Object.getOwnPropertyDescriptor(valObj, key)!));
  }

  protected get value(): T {
    return this.#value;
  }
}

export default Extension;
