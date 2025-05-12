import {
  AnimationTimingFunctions,
  AnimationType,
  DecimalSeparator,
  DigitGroupSeparator,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  NumberOfAnimations,
} from './NumbersTransition/NumbersTransition.enums';
import {
  Animation,
  AnimationFactory,
  AnimationTimingFunction,
  CssRule,
  CssRuleFactory,
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
  AnimationType,
  DecimalSeparator,
  DigitGroupSeparator,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  NumberOfAnimations,
};

export type {
  Animation,
  AnimationDuration,
  AnimationFactory,
  AnimationTimingFunction,
  BigDecimal,
  CssRule,
  CssRuleFactory,
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
