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
  AnimationTimingFunctionTuple,
  ClassNameFactory,
  CssRule,
  CssRuleFactory,
  KeyframeFunction,
  NumbersTransitionExecutionContext,
  NumbersTransitionTheme,
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
  AnimationTimingFunctionTuple,
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
  OrReadOnly,
  ReadOnly,
  StyleFactory,
  TotalAnimationDuration,
  UncheckedBigDecimal,
  View,
};

export default NumbersTransition;
