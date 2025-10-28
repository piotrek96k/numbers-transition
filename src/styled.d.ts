import { ComponentPropsWithRef, DetailedHTMLProps, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { IStyledComponent } from 'styled-components';
import { BaseObject as BaseObjectImport, Keyframes as KeyframesImport, KnownTarget, Substitute } from 'styled-components/dist/types';
import { Runtime } from './NumbersTransition/NumbersTransition.enums';
import { NumbersTransitionTheme } from './NumbersTransition/NumbersTransition.styles';
import { Nullable } from './NumbersTransition/NumbersTransition.types';

declare module 'styled-components' {
  export interface DefaultTheme extends NumbersTransitionTheme {}
  export type BaseObject = BaseObjectImport;
  export interface Keyframes extends KeyframesImport {}

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
