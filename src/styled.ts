/* eslint-disable @typescript-eslint/no-empty-object-type */
import type {
  ComponentPropsWithRef,
  ComponentType,
  DetailedHTMLProps,
  ExoticComponent,
  HTMLAttributes,
  ReactElement,
  ReactNode,
} from 'react';
import type { CSSProperties, FastOmit, IStyledComponent, SupportedHTMLElements } from 'styled-components';
import type { Runtime } from './NumbersTransition/NumbersTransition.enums';
import type { NumbersTransitionTheme } from './NumbersTransition/NumbersTransition.styles';
import type { Nullable, Optional } from './NumbersTransition/NumbersTransition.types';

declare module 'styled-components' {
  export type BaseObject = {};
  export type CSSPropertiesWithVars = CSSProperties & { [key: `--${string}`]: Optional<string | number> };
  export type StyledHTMLAttributes<T> = HTMLAttributes<T> & { style: CSSPropertiesWithVars };
  export interface DefaultTheme extends NumbersTransitionTheme {}

  export interface Keyframes {
    id: string;
    name: string;
    rules: string;
  }

  interface ExoticComponentWithDisplayName<T extends BaseObject = {}> extends ExoticComponent<T> {
    defaultProps?: Partial<T>;
    displayName?: string;
  }

  type AnyComponent<T extends BaseObject = any> = ExoticComponentWithDisplayName<T> | ComponentType<T>;
  type KnownTarget = SupportedHTMLElements | AnyComponent;
  type Substitute<T extends BaseObject, U extends BaseObject> = FastOmit<T, keyof U> & U;
  type StyledComponentBase<T extends object> = IStyledComponent<Runtime.Web, T>;
  type HTMLDetailedElement<T> = DetailedHTMLProps<HTMLAttributes<T>, T>;

  export type StyledComponent<T, U extends object = BaseObject> = StyledComponentBase<Substitute<HTMLDetailedElement<T>, U>>;
  export type ExtensionStyledComponent<T extends KnownTarget, U extends object = BaseObject> = StyledComponentBase<
    Substitute<ComponentPropsWithRef<T> & BaseObject, U>
  >;
  export type AttributesStyledComponent<T extends KnownTarget, U extends object, V extends object = BaseObject> = StyledComponentBase<
    Substitute<Substitute<Substitute<U extends KnownTarget ? ComponentPropsWithRef<U> : U, ComponentPropsWithRef<T>>, V>, BaseObject>
  >;

  export interface ThemeProviderProps {
    children?: ReactNode;
    theme: Partial<DefaultTheme> | ((outerTheme?: Partial<DefaultTheme>) => Partial<DefaultTheme>);
  }

  export function ThemeProvider(props: ThemeProviderProps): Nullable<ReactElement>;
}
