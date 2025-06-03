import NumbersTransition, { NumbersTransitionProps } from './NumbersTransition/NumbersTransition';
import {
  AnimationNumbers,
  AnimationTimingFunctions,
  AnimationTypes,
  DecimalSeparators,
  DigitGroupSeparators,
  NegativeCharacterAnimationModes,
  NegativeCharacters,
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
import { BigDecimal, Falsy, UncheckedBigDecimal } from './NumbersTransition/NumbersTransition.types';

export {
  AnimationNumbers,
  AnimationTimingFunctions,
  AnimationTypes,
  DecimalSeparators,
  DigitGroupSeparators,
  NegativeCharacters,
  NegativeCharacterAnimationModes,
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
  StyleFactory,
  TotalAnimationDuration,
  UncheckedBigDecimal,
  View,
};

export default NumbersTransition;
