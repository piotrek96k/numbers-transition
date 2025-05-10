import {
  AnimationTimingFunctions,
  DecimalSeparator,
  DigitGroupSeparator,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
} from './NumbersTransition/NumbersTransition.enums';
import {
  Animation,
  AnimationFactory,
  AnimationTimingFunction,
  CssRule,
  KeyframeFunction,
  NumbersTransitionExecutionContext,
  NumbersTransitionTheme,
} from './NumbersTransition/NumbersTransition.styles';
import NumbersTransition, { NumbersTransitionProps, View } from './NumbersTransition/NumbersTransition';
import {
  AnimationDuration,
  BigDecimal,
  ExtendedAnimationTimingFunction,
  TotalAnimationDuration,
  UncheckedBigDecimal,
} from './NumbersTransition/NumbersTransition.hooks';

export {
  AnimationTimingFunctions,
  DecimalSeparator,
  DigitGroupSeparator,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
};

export type {
  Animation,
  AnimationDuration,
  AnimationFactory,
  AnimationTimingFunction,
  BigDecimal,
  CssRule,
  ExtendedAnimationTimingFunction,
  KeyframeFunction,
  NumbersTransitionExecutionContext,
  NumbersTransitionProps,
  NumbersTransitionTheme,
  TotalAnimationDuration,
  UncheckedBigDecimal,
  View,
};

export default NumbersTransition;
