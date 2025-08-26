export enum Runtime {
  Web = 'web',
}

export enum HTMLElement {
  Div = 'div',
}

export enum ForwardProp {
  Id = 'id',
  Style = 'style',
  Class = 'class',
  Children = 'children',
  OnAnimationEnd = 'onAnimationEnd',
}

export enum Styled {
  Container = 'container',
  Symbol = 'symbol',
  Digit = 'digit',
  Separator = 'separator',
  DecimalSeparator = 'decimalSeparator',
  DigitGroupSeparator = 'digitGroupSeparator',
  Negative = 'negative',
  Invalid = 'invalid',
}

export enum ViewKey {
  Style = 'style',
  ClassName = 'className',
  Css = 'css',
  Animation = 'animation',
}

export enum VariableName {
  AnimationType = '--animation-type',
  AnimationDirection = '--animation-direction',
  NumberOfAnimations = '--number-of-animations',
  AnimationNumber = '--animation-number',
  AnimationDuration = '--animation-duration',
  AnimationTimingFunction = '--animation-timing-function',
  HorizontalAnimationDuration = '--horizontal-animation-duration',
  VerticalAnimationDuration = '--vertical-animation-duration',
  TotalAnimationDuration = '--total-animation-duration',
  SymbolsLength = '--symbols-length',
  DigitsLength = '--digits-length',
  SeparatorsLength = '--separators-length',
  DecimalSeparatorLength = '--decimal-separator-length',
  DigitGroupSeparatorsLength = '--digit-group-separators-length',
  NegativeCharacterLength = '--negative-character-length',
  InvalidLength = '--invalid-length',
  ColumnLength = '--column-length',
}

export enum AnimationId {
  HorizontalAnimation = 'horizontal-animation',
  VerticalAnimation = 'vertical-animation',
}

export enum AnimationKey {
  HorizontalAnimation = 'horizontalAnimation',
  VerticalAnimation = 'verticalAnimation',
}

export enum AnimationType {
  None = 'none',
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export enum AnimationNumber {
  Zero,
  One,
  Two,
  Three,
}

export enum AnimationTransition {
  None = 'none',
  FirstToSecond = 'first-to-second',
  SecondToThird = 'second-to-third',
}

export enum AnimationDirection {
  Normal = 'normal',
  Reverse = 'reverse',
  None = 'none',
}

export enum AnimationInterruptionMode {
  Interrupt = 'interrupt',
  Continue = 'continue',
}

export enum NegativeCharacterAnimationMode {
  Single = 'single',
  Multi = 'multi',
}

export enum DecimalSeparatorCharacter {
  Comma = ',',
  Dot = '.',
}

export enum DigitGroupSeparatorCharacter {
  None = '',
  Comma = ',',
  Dot = '.',
  ThinSpace = ' ',
  Space = ' ',
  Underscore = '_',
  Apostrophe = "'",
}

export enum NegativeCharacter {
  Hyphen = '-',
  HyphenMinus = '﹣',
  Minus = '−',
  Dash = '–',
}

export enum OptimizationStrategy {
  None = 'none',
  Split = 'split',
  Delay = 'delay',
}

export enum EquationSolver {
  DerivativeDelta = 1e-6,
  InitialValue = 0.5,
}

export const NumberPrecision = {
  Value: 1_000_000_000_000_000n,
  HalfValue: 500_000_000_000_000n,
} as const;

export const RegularExpression = {
  BigDecimal: /^-?(([1-9]\d*)|0)((\.|,)\d+)?$/,
  Digit: /^\d{1}$/,
  DecimalSeparator: /\.|,/,
} as const;

export enum Character {
  Comma = ',',
  Empty = '',
  Minus = '-',
  Space = ' ',
  Underscore = '_',
  VerticalLine = '|',
}

export enum Integer {
  MinusOneHundred = -100,
  MinusOne = -1,
  Zero,
  One,
  Two,
  Three,
  Five = 5,
  Seven = 7,
  Ten = 10,
  Fourteen = 14,
  OneHundred = 100,
  TwoThousandFiveHundred = 2_500,
}

export const AnimationTimingFunction = {
  Linear: [
    [0, 0],
    [1, 1],
  ],
  Ease: [
    [0.25, 0.1],
    [0.25, 1],
  ],
  EaseIn: [
    [0.42, 0],
    [1, 1],
  ],
  EaseOut: [
    [0, 0],
    [0.58, 1],
  ],
  EaseInOut: [
    [0.42, 0],
    [0.58, 1],
  ],
} as const;

export enum AnimationDurationValue {
  HorizontalAnimation = 2_000,
  VerticalAnimation = 5_000,
}

export enum TotalAnimationDurationValue {
  AnimationDuration = 6_000,
  Ratio = 2.5,
}

export enum InvalidValue {
  Value = Number.NaN,
}

export enum StorybookValue {
  Value = 123_456_789,
}
