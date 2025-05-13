export enum Runtime {
  WEB = 'web',
}

export enum HTMLElements {
  'DIV' = 'div',
}

export enum Display {
  BLOCK = 'BLOCK',
  INLINE = 'INLINE_BLOCK',
}

export enum AnimationType {
  NONE = 'NONE',
  HORIZONTAL = 'HORIZONTAL',
  VERTICAL = 'VERTICAL',
}

export enum AnimationNumber {
  ZERO,
  ONE,
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

export type AnimationDirection = HorizontalAnimationDirection | VerticalAnimationDirection;

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

export enum Canvas {
  ELEMENT = 'canvas',
  CONTEXT_ID = '2d',
}

export enum DigitsGenerator {
  SWITCH_VALUE = 14,
  INITIAL_VALUE = 1,
  MULTIPLY_VALUE = 0.5,
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
  DIGITS: /\d+/,
  SINGLE_DIGIT: /^\d{1}$/,
  DOT_OR_COMMA: /\.|,/,
} as const;

export enum Strings {
  COMMA = ',',
  EMPTY = '',
  MINUS = '-',
  SPACE = ' ',
  UNDERSCORE = '_',
}

export enum Numbers {
  MINUS_ONE_HUNDRED = -100,
  MINUS_ONE = -1,
  ZERO,
  ONE,
  TWO,
  THREE,
  FIVE = 5,
  TEN = 10,
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

export enum DefaultAnimationDuration {
  HORIZONTAL_ANIMATION = 2_000,
  VERTICAL_ANIMATION = 5_000,
}

export enum DefaultTotalAnimationDuration {
  ANIMATION_DURATION = 6_000,
  RATIO = 2.5,
}

export enum StorybookDefaultValue {
  VALUE = 123_456_789,
}
