export enum Runtime {
  WEB = 'web',
}

export enum HTMLElements {
  'DIV' = 'div',
}

export enum ForwardProps {
  ID = 'id',
  STYLE = 'style',
  CLASS = 'class',
  CHILDREN = 'children',
  ON_ANIMATION_END = 'onAnimationEnd',
}

export enum Display {
  BLOCK = 'block',
  INLINE_BLOCK = 'inline-block',
}

export enum StyledComponents {
  CONTAINER = '',
  CHARACTER = 'character',
  DIGIT = 'digit',
}

export enum ViewKeys {
  STYLE = 'style',
  CLASS_NAME = 'className',
  CSS = 'css',
  ANIMATION = 'animation',
}

export enum AnimationId {
  HORIZONTAL_ANIMATION = 'horizontal-animation',
  VERTICAL_ANIMATION = 'vertical-animation',
}

export enum AnimationKeys {
  HORIZONTAL_ANIMATION = 'horizontalAnimation',
  VERTICAL_ANIMATION = 'verticalAnimation',
}

export enum AnimationType {
  NONE = 'none',
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
}

export enum AnimationNumber {
  ZERO,
  ONE,
  TWO,
  THREE,
}

export enum AnimationTransition {
  NONE = 'none',
  FIRST_TO_SECOND = 'first-to-second',
  SECOND_TO_THIRD = 'second-to-third',
}

export enum HorizontalAnimationDirection {
  RIGHT = 'normal',
  LEFT = 'reverse',
}

export enum VerticalAnimationDirection {
  UP = 'normal',
  DOWN = 'reverse',
}

export type AnimationDirection = HorizontalAnimationDirection | VerticalAnimationDirection;

export enum NegativeCharacterAnimationMode {
  SINGLE = 'single',
  MULTI = 'multi',
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
  DOLLAR = '$',
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
