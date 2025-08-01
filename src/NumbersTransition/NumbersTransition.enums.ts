export enum Runtime {
  WEB = 'web',
}

export enum HTMLElements {
  DIV = 'div',
}

export enum ForwardProps {
  ID = 'id',
  STYLE = 'style',
  CLASS = 'class',
  CHILDREN = 'children',
  ON_ANIMATION_END = 'onAnimationEnd',
}

export enum StyledComponents {
  CONTAINER = 'container',
  CHARACTER = 'character',
  DIGIT = 'digit',
  SEPARATOR = 'separator',
  DECIMAL_SEPARATOR = 'decimalSeparator',
  DIGIT_GROUP_SEPARATOR = 'digitGroupSeparator',
  NEGATIVE_CHARACTER = 'negativeCharacter',
  INVALID = 'invalid',
}

export enum ViewKeys {
  STYLE = 'style',
  CLASS_NAME = 'className',
  CSS = 'css',
  ANIMATION = 'animation',
}

export enum VariableNames {
  ANIMATION_TYPE = '--animation-type',
  ANIMATION_DIRECTION = '--animation-direction',
  NUMBER_OF_ANIMATIONS = '--number-of-animations',
  ANIMATION_NUMBER = '--animation-number',
  ANIMATION_DURATION = '--animation-duration',
  ANIMATION_TIMING_FUNCTION = '--animation-timing-function',
  HORIZONTAL_ANIMATION_DURATION = '--horizontal-animation-duration',
  VERTICAL_ANIMATION_DURATION = '--vertical-animation-duration',
  TOTAL_ANIMATION_DURATION = '--total-animation-duration',
  CHARACTERS_LENGTH = '--characters-length',
  CHARACTER_INDEX = '--character-index',
  DIGITS_LENGTH = '--digits-length',
  DIGIT_INDEX = '--digit-index',
  SEPARATORS_LENGTH = '--separators-length',
  SEPARATOR_INDEX = '--separator-index',
  DECIMAL_SEPARATOR_LENGTH = '--decimal-separator-length',
  DECIMAL_SEPARATOR_INDEX = '--decimal-separator-index',
  DIGIT_GROUP_SEPARATORS_LENGTH = '--digit-group-separators-length',
  DIGIT_GROUP_SEPARATOR_INDEX = '--digit-group-separators-index',
  NEGATIVE_CHARACTER_LENGTH = '--negative-character-length',
  NEGATIVE_CHARACTER_INDEX = '--negative-character-index',
  INVALID_LENGTH = '--invalid-length',
  INVALID_INDEX = '--invalid-index',
  COLUMN_LENGTH = '--column-length',
  ROW_INDEX = '--row-index',
}

export enum AnimationIds {
  HORIZONTAL_ANIMATION = 'horizontal-animation',
  VERTICAL_ANIMATION = 'vertical-animation',
}

export enum AnimationKeys {
  HORIZONTAL_ANIMATION = 'horizontalAnimation',
  VERTICAL_ANIMATION = 'verticalAnimation',
}

export enum AnimationTypes {
  NONE = 'none',
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
}

export enum AnimationNumbers {
  ZERO,
  ONE,
  TWO,
  THREE,
}

export enum AnimationTransitions {
  NONE = 'none',
  FIRST_TO_SECOND = 'first-to-second',
  SECOND_TO_THIRD = 'second-to-third',
}

export enum AnimationDirections {
  NORMAL = 'normal',
  REVERSE = 'reverse',
  NONE = 'none',
}

export enum AnimationInterruptionModes {
  INTERRUPT = 'interrupt',
  CONTINUE = 'continue',
}

export enum NegativeCharacterAnimationModes {
  SINGLE = 'single',
  MULTI = 'multi',
}

export enum DecimalSeparators {
  COMMA = ',',
  DOT = '.',
}

export enum DigitGroupSeparators {
  NONE = '',
  COMMA = ',',
  DOT = '.',
  THIN_SPACE = ' ',
  SPACE = ' ',
  UNDERSCORE = '_',
  APOSTROPHE = "'",
}

export enum NegativeCharacters {
  HYPHEN = '-',
  HYPHEN_MINUS = '﹣',
  MINUS = '−',
  DASH = '–',
}

export enum OptimizationStrategies {
  NONE = 'none',
  SPLIT = 'split',
}

export enum EquationSolver {
  DERIVATIVE_DELTA = 1e-6,
  INITIAL_VALUE = 0.5,
}

export const NumberPrecision = {
  VALUE: 1_000_000_000_000_000n,
  HALF_VALUE: 500_000_000_000_000n,
} as const;

export const RegularExpressions = {
  BIG_DECIMAL: /^-?(([1-9]\d*)|0)((\.|,)\d+)?$/,
  SINGLE_DIGIT: /^\d{1}$/,
  DOT_OR_COMMA: /\.|,/,
} as const;

export enum Strings {
  COMMA = ',',
  EMPTY = '',
  MINUS = '-',
  SPACE = ' ',
  UNDERSCORE = '_',
  VERTICAL_LINE = '|',
  LENGTH = 'length',
}

export enum Numbers {
  MINUS_ONE_HUNDRED = -100,
  MINUS_ONE = -1,
  ZERO,
  ONE,
  TWO,
  THREE,
  FIVE = 5,
  SEVEN = 7,
  TEN = 10,
  FOURTEEN = 14,
  ONE_HUNDRED = 100,
}

export const AnimationTimingFunctions = {
  LINEAR: [
    [0, 0],
    [1, 1],
  ],
  EASE: [
    [0.25, 0.1],
    [0.25, 1],
  ],
  EASE_IN: [
    [0.42, 0],
    [1, 1],
  ],
  EASE_OUT: [
    [0, 0],
    [0.58, 1],
  ],
  EASE_IN_OUT: [
    [0.42, 0],
    [0.58, 1],
  ],
} as const;

export enum AnimationDurationValues {
  HORIZONTAL_ANIMATION = 2_000,
  VERTICAL_ANIMATION = 5_000,
}

export enum TotalAnimationDurationValues {
  ANIMATION_DURATION = 6_000,
  RATIO = 2.5,
}

export enum InvalidValue {
  VALUE = '',
}

export enum StorybookValue {
  VALUE = 123_456_789,
}
