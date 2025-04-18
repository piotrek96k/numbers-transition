import {
  AnimationTimingFunctions,
  DecimalSeparator,
  DigitGroupSeparator,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
} from './NumbersTransition/NumbersTransition.enums';
import { AnimationTimingFunction } from './NumbersTransition/NumbersTransition.styles';
import NumbersTransition from './NumbersTransition/NumbersTransition';
import { BigDecimal } from './NumbersTransition/NumbersTransition.hooks';

export {
  AnimationTimingFunctions,
  DecimalSeparator,
  DigitGroupSeparator,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
};

export type { AnimationTimingFunction, BigDecimal };

export default NumbersTransition;
