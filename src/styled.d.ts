import { ComponentPropsWithRef, DetailedHTMLProps, HTMLAttributes } from 'react';
import { IStyledComponent } from 'styled-components';
import { BaseObject as BaseObjectImport, Keyframes as KeyframesImport, KnownTarget, Substitute } from 'styled-components/dist/types';
import { Runtime } from './NumbersTransition/NumbersTransition.enums';
import { NumbersTransitionTheme } from './NumbersTransition/NumbersTransition.styles';

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

  type ThemeFn = (outerTheme?: Partial<DefaultTheme>) => Partial<DefaultTheme>;
  type ThemeArgument = Partial<DefaultTheme> | ThemeFn;

  export interface ThemeProviderProps {
    children?: React.ReactNode;
    theme: ThemeArgument;
  }

  export function ThemeProvider(props: ThemeProviderProps): React.JSX.Element | null;
}
