import {
  AnimationTimingFunctions,
  DecimalSeparator,
  DigitGroupSeparator,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
} from './NumbersTransition/NumbersTransition.enums';
import {
  AnimationTimingFunction,
  CssRule,
  Keyframe,
  KeyframeFunction,
  KeyframeFunctionFactory,
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
  AnimationTimingFunction,
  AnimationDuration,
  BigDecimal,
  CssRule,
  ExtendedAnimationTimingFunction,
  Keyframe,
  KeyframeFunction,
  KeyframeFunctionFactory,
  NumbersTransitionExecutionContext,
  NumbersTransitionProps,
  NumbersTransitionTheme,
  TotalAnimationDuration,
  UncheckedBigDecimal,
  View,
};

export default NumbersTransition;
