import 'styled-components';
import { NumbersTransitionTheme } from './NumbersTransition/NumbersTransition.styles';

declare module 'styled-components' {
  export interface DefaultTheme extends NumbersTransitionTheme {}
}
