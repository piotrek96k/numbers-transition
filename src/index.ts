import NumbersTransition, { NumbersTransitionProps, View } from './NumbersTransition/NumbersTransition';
import {
  AnimationNumber,
  AnimationTimingFunctions,
  AnimationType,
  DecimalSeparator,
  DigitGroupSeparator,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
} from './NumbersTransition/NumbersTransition.enums';
import {
  AnimationDuration,
  BigDecimal,
  ExtendedAnimationTimingFunction,
  TotalAnimationDuration,
  UncheckedBigDecimal,
} from './NumbersTransition/NumbersTransition.hooks';
import {
  Animation,
  AnimationFactory,
  AnimationTimingFunction,
  ClassNameFactory,
  CssRule,
  CssRuleFactory,
  KeyframeFunction,
  NumbersTransitionExecutionContext,
  NumbersTransitionTheme,
  StyleFactory,
} from './NumbersTransition/NumbersTransition.styles';
import { Falsy } from './NumbersTransition/NumbersTransition.types';

export {
  AnimationNumber,
  AnimationTimingFunctions,
  AnimationType,
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
  ClassNameFactory,
  CssRule,
  CssRuleFactory,
  ExtendedAnimationTimingFunction,
  Falsy,
  KeyframeFunction,
  NumbersTransitionExecutionContext,
  NumbersTransitionProps,
  NumbersTransitionTheme,
  StyleFactory,
  TotalAnimationDuration,
  UncheckedBigDecimal,
  View,
};

export default NumbersTransition;
