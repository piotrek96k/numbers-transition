import NumbersTransition, { NumbersTransitionProps } from './NumbersTransition/NumbersTransition';
import {
  AnimationDirections,
  AnimationInterruptionModes,
  AnimationNumbers,
  AnimationTimingFunctions,
  AnimationTypes,
  DecimalSeparators,
  DigitGroupSeparators,
  NegativeCharacterAnimationModes,
  NegativeCharacters,
  OptimizationStrategies,
  VariableNames,
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
  AnimationTimingFunction,
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
  AnimationDirections,
  AnimationInterruptionModes,
  AnimationNumbers,
  AnimationTimingFunctions,
  AnimationTypes,
  DecimalSeparators,
  DigitGroupSeparators,
  NegativeCharacterAnimationModes,
  NegativeCharacters,
  OptimizationStrategies,
  VariableNames,
};

export type {
  Animation,
  AnimationAlgorithm,
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
  OrReadOnly,
  ReadOnly,
  StyleFactory,
  TotalAnimationDuration,
  UncheckedBigDecimal,
  View,
};

export default NumbersTransition;
