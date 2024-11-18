import { ReadOnly } from './NumbersTransition.types';

export type AnimationTimingFunction = [[number, number], [number, number]];

interface EaseAnimationTimingFunctionEnum {
  readonly VALUES: ReadOnly<AnimationTimingFunction>;
}

interface NumberPrecisionEnum {
  readonly VALUE: bigint;
  readonly HALF_VALUE: bigint;
}

export enum AnimationType {
  HORIZONTAL = 'HORIZONTAL',
  VERTICAL = 'VERTICAL',
  STEP = 'STEP',
}

export enum NumberOfAnimations {
  ONE = 1,
  TWO,
  THREE,
}

export enum AnimationTransition {
  NONE = 'NONE',
  FIRST_TO_SECOND = 'FIRST_TO_SECOND',
  SECOND_TO_THIRD = 'SECOND_TO_THIRD',
}

export enum HorizontalAnimationDirection {
  RIGHT = 'NORMAL',
  LEFT = 'REVERSE',
}

export enum VerticalAnimationDirection {
  UP = 'NORMAL',
  DOWN = 'REVERSE',
}

export enum StepAnimationDirection {
  FORWARDS = 'NORMAL',
  BACKWARDS = 'REVERSE',
}

export type AnimationDirection = HorizontalAnimationDirection | VerticalAnimationDirection | StepAnimationDirection;

export enum StepAnimationPosition {
  ABSOLUTE = 'ABSOLUTE',
  RELATIVE = 'RELATIVE',
}

export enum NegativeCharacterAnimationMode {
  SINGLE = 'SINGLE',
  MULTI = 'MULTI',
}

export enum DecimalSeparator {
  COMMA = ',',
  DOT = '.',
}

export enum DigitGroupSeparator {
  NONE = '',
  COMMA = ',',
  DOT = '.',
  THIN_SPACE = ' ',
  SPACE = ' ',
  UNDERSCORE = '_',
  APOSTROPHE = "'",
}

export enum NegativeCharacter {
  HYPHEN = '-',
  HYPHEN_MINUS = '﹣',
  MINUS = '−',
  DASH = '–',
}

export enum EmptyCharacter {
  VALUE = '-',
}

export enum LinearAlgorithm {
  MAX_LENGTH = 14,
}

export enum EquationSolver {
  DERIVATIVE_DELTA = 1e-6,
  INITIAL_VALUE = 0.5,
}

export const EaseAnimationTimingFunction: EaseAnimationTimingFunctionEnum = {
  VALUES: [
    [0.25, 0.1],
    [0.25, 1],
  ],
};

export const NumberPrecision: NumberPrecisionEnum = {
  VALUE: 1_000_000_000_000_000n,
  HALF_VALUE: 500_000_000_000_000n,
};
