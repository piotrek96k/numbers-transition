import type { ReactElement, ReactNode } from 'react';
import type { NumbersTransitionTheme } from './NumbersTransition/NumbersTransition.styles';
import type { Nullable, OrFunction } from './NumbersTransition/NumbersTransition.types';

declare module 'styled-components' {
  export interface DefaultTheme extends NumbersTransitionTheme {}

  export interface ThemeProviderProps {
    children?: ReactNode;
    theme: OrFunction<[Partial<DefaultTheme>], Partial<DefaultTheme>>;
  }

  export function ThemeProvider(props: ThemeProviderProps): Nullable<ReactElement>;
}
