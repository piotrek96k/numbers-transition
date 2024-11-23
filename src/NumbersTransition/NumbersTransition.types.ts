import { ComponentPropsWithRef, DetailedHTMLProps, HTMLAttributes } from 'react';
import { BaseObject, IStyledComponent, KnownTarget, Substitute } from 'styled-components/dist/types';

export type ReadOnly<T> = {
  +readonly [K in keyof T]: ReadOnly<T[K]>;
};

type StyledComponentBase<T extends object> = IStyledComponent<'web', T>;

export type HTMLDetailedElement<T> = DetailedHTMLProps<HTMLAttributes<T>, T>;

export type StyledComponent<T, U extends object = BaseObject> = StyledComponentBase<
  Substitute<HTMLDetailedElement<T>, U>
>;

export type ExtensionStyledComponent<T extends KnownTarget> = StyledComponentBase<
  Substitute<ComponentPropsWithRef<T> & BaseObject, BaseObject>
>;

export type AttributesStyledComponent<
  T extends KnownTarget,
  U extends object,
  V extends object = BaseObject,
> = StyledComponentBase<
  Substitute<
    Substitute<Substitute<U extends KnownTarget ? ComponentPropsWithRef<U> : U, ComponentPropsWithRef<T>>, V>,
    BaseObject
  >
>;

export type BigDecimal = number | bigint | `${number}`;
