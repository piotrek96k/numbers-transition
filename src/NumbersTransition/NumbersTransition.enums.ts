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
  Character = 'character',
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

export enum ViewType {
  BaseView,
  View,
  StyledView,
  StyledViewWithProps,
}

export enum VariableName {
  AnimationType = '--animation-type',
  AnimationDirection = '--animation-direction',
  NumberOfAnimations = '--number-of-animations',
  AnimationNumber = '--animation-number',
  AnimationTimingFunction = '--animation-timing-function',
  AnimationFillMode = '--animation-fill-mode',
  AnimationDuration = '--animation-duration',
  HorizontalAnimationDuration = '--horizontal-animation-duration',
  VerticalAnimationDuration = '--vertical-animation-duration',
  TotalAnimationDuration = '--total-animation-duration',
  CharactersLength = '--characters-length',
  DigitsLength = '--digits-length',
  SeparatorsLength = '--separators-length',
  DecimalSeparatorLength = '--decimal-separator-length',
  DigitGroupSeparatorsLength = '--digit-group-separators-length',
  NegativeCharacterLength = '--negative-character-length',
  InvalidLength = '--invalid-length',
  ColumnLength = '--column-length',
}

export enum CssSyntax {
  Integer = '<integer>',
  Time = '<time>',
  Universal = '*',
}

export enum CssUnit {
  Character = 'ch',
  LineHeight = 'lh',
  Millisecond = 'ms',
  Percent = '%',
  Pixel = 'px',
  Rem = 'rem',
  Turn = 'turn',
}

export enum Size {
  FitContent = 'fit-content',
  Inherit = 'inherit',
}

export enum Position {
  Absolute = 'absolute',
  Relative = 'relative',
}

export enum Display {
  Block = 'block',
  InlineBlock = 'inline-block',
  InlineFlex = 'inline-flex',
}

export enum Float {
  Right = 'right',
}

export enum FlexDirection {
  Column = 'column',
  ColumnReverse = 'column-reverse',
}

export enum Overflow {
  Clip = 'clip',
  Hidden = 'hidden',
}

export enum WhiteSpace {
  NoWrap = 'nowrap',
  Pre = 'pre',
}

export enum BoxSizing {
  BorderBox = 'border-box',
}

export enum BorderStyle {
  Solid = 'solid',
}

export enum Color {
  Blue = '#036CDB',
  Yellow = '#f0ff95',
  Transparent = 'transparent',
}

export enum AnimationFillMode {
  Forwards = 'forwards',
  Backwards = 'backwards',
}

export enum StepPosition {
  JumpStart = 'jump-start',
  JumpEnd = 'jump-end',
  JumpNone = 'jump-none',
  JumpBoth = 'jump-both',
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
  None = 'none',
  Normal = 'normal',
  Reverse = 'reverse',
}

export enum AnimationInterruptionMode {
  Interrupt = 'interrupt',
  Continue = 'continue',
}

export enum NegativeCharacterAnimationMode {
  Single = 'single',
  Multi = 'multi',
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

export enum DecimalSeparatorCharacter {
  Comma = ',',
  Dot = '.',
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

export enum Key {
  Length = 'length',
}

export enum Text {
  Comma = ',',
  Dot = '.',
  Empty = '',
  Minus = '-',
  Space = ' ',
  Underscore = '_',
  VerticalLine = '|',
}

export enum Integer {
  MinusOneHundred = -100,
  MinusFifteen = -15,
  MinusOne = -1,
  Zero,
  One,
  Two,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
  Nine,
  Ten,
  Fourteen = 14,
  Sixteen = 16,
  Twenty = 20,
  TwentySeven = 27,
  FortyTwo = 42,
  FiftyEight = 58,
  OneHundred = 100,
  TwoThousand = 2_000,
  TwoThousandFiveHundred = 2_500,
  FiveThousand = 5_000,
  SixThousand = 6_000,
}

export const RegularExpression = {
  BigDecimal: /^-?(([1-9]\d*)|0)((\.|,)\d+)?$/,
  Digit: /^\d{1}$/,
  DecimalSeparator: /\.|,/,
} as const;

export const NumberPrecision = {
  Value: 1_000_000_000_000_000n,
  HalfValue: 500_000_000_000_000n,
} as const;

export const AnimationTimingFunction = {
  Linear: [Integer.Zero, Integer.One],
  Ease: [
    [Integer.One / Integer.Four, Integer.One / Integer.Ten],
    [Integer.One / Integer.Four, Integer.One],
  ],
  EaseIn: [
    [Integer.FortyTwo / Integer.OneHundred, Integer.Zero],
    [Integer.One, Integer.One],
  ],
  EaseOut: [
    [Integer.Zero, Integer.Zero],
    [Integer.FiftyEight / Integer.OneHundred, Integer.One],
  ],
  EaseInOut: [
    [Integer.FortyTwo / Integer.OneHundred, Integer.Zero],
    [Integer.FiftyEight / Integer.OneHundred, Integer.One],
  ],
  StepStart: { steps: Integer.One, stepPosition: StepPosition.JumpStart },
  StepEnd: { steps: Integer.One, stepPosition: StepPosition.JumpEnd },
} as const;
