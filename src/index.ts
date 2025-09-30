import NumbersTransition, { NumbersTransitionProps } from './NumbersTransition/NumbersTransition';
import {
  AnimationDirection,
  AnimationId,
  AnimationInterruptionMode,
  AnimationNumber,
  AnimationTimingFunction,
  AnimationType,
  DecimalSeparatorCharacter,
  DigitGroupSeparatorCharacter,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  OptimizationStrategy,
  VariableName,
} from './NumbersTransition/NumbersTransition.enums';
import {
  AnimationAlgorithm,
  AnimationDuration,
  ExtendedAnimationTimingFunction,
  TotalAnimationDuration,
  View,
} from './NumbersTransition/NumbersTransition.hooks';
import {
  Animation,
  AnimationFactory,
  ClassNameFactory,
  CssRule,
  CssRuleFactory,
  CubicBezierEasingFunction,
  EasingFunction,
  KeyframeFunction,
  LinearEasingFunction,
  NumbersTransitionExecutionContext,
  NumbersTransitionTheme,
  StepsEasingFunction,
  StyleFactory,
} from './NumbersTransition/NumbersTransition.styles';
import { BigDecimal, Falsy, OrReadOnly, ReadOnly, UncheckedBigDecimal } from './NumbersTransition/NumbersTransition.types';

export {
  AnimationDirection,
  AnimationInterruptionMode,
  AnimationNumber,
  AnimationTimingFunction,
  AnimationType,
  DecimalSeparatorCharacter,
  DigitGroupSeparatorCharacter,
  NegativeCharacterAnimationMode,
  NegativeCharacter,
  OptimizationStrategy,
  VariableName,
};

export type {
  Animation,
  AnimationAlgorithm,
  AnimationDuration,
  AnimationFactory,
  AnimationId,
  BigDecimal,
  ClassNameFactory,
  CssRule,
  CssRuleFactory,
  CubicBezierEasingFunction,
  EasingFunction,
  ExtendedAnimationTimingFunction,
  Falsy,
  KeyframeFunction,
  LinearEasingFunction,
  NumbersTransitionExecutionContext,
  NumbersTransitionProps,
  NumbersTransitionTheme,
  OrReadOnly,
  ReadOnly,
  StepsEasingFunction,
  StyleFactory,
  TotalAnimationDuration,
  UncheckedBigDecimal,
  View,
};

export default NumbersTransition;
