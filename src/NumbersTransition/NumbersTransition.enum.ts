export enum StyledComponentType {
  STYLED = 'STYLED',
  EXTENSION = 'EXTENSION',
  ATTRIBUTES = 'ATTRIBUTES',
}

export enum AnimationType {
  HORIZONTAL = 'HORIZONTAL',
  VERTICAL = 'VERTICAL',
}

export enum HorizontalAnimationDirection {
  RIGHT = 'RIGHT',
  LEFT = 'LEFT',
}

export enum VerticalAnimationDirection {
  UP = 'UP',
  DOWN = 'DOWN',
}

export type AnimationDirection = HorizontalAnimationDirection | VerticalAnimationDirection;

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

export enum EmptyCharacter {
  VALUE = '-',
}

export enum LinearAlgorithm {
  MAX_LENGTH = 14,
}

export const NumberPrecision = {
  VALUE: 1_000_000_000_000_000n,
  HALF_VALUE: 500_000_000_000_000n,
} as const;
