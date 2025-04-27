import {
  AnimationTimingFunctions,
  DecimalSeparator,
  DigitGroupSeparator,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
} from './NumbersTransition/NumbersTransition.enums';
import { AnimationTimingFunction } from './NumbersTransition/NumbersTransition.styles';
import NumbersTransition, { NumbersTransitionProps } from './NumbersTransition/NumbersTransition';
import { BigDecimal, UncheckedBigDecimal } from './NumbersTransition/NumbersTransition.hooks';

export {
  AnimationTimingFunctions,
  DecimalSeparator,
  DigitGroupSeparator,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
};

export type { AnimationTimingFunction, BigDecimal, NumbersTransitionProps, UncheckedBigDecimal };

export default NumbersTransition;
