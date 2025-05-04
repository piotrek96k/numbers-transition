import 'styled-components';
import { NumbersTransitionTheme } from './NumbersTransition/NumbersTransition.styles';

declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends NumbersTransitionTheme {}
}
