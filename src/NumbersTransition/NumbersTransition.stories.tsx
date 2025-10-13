import { ComponentProps } from 'react';
import { RuleSet, css } from 'styled-components';
import { ArgTypes, Meta, StoryObj } from '@storybook/react-vite';
import NumbersTransition from './NumbersTransition';
import {
  AnimationDirection,
  AnimationId,
  AnimationInterruptionMode,
  AnimationNumber,
  AnimationTimingFunction,
  AnimationType,
  Character,
  DecimalSeparatorCharacter,
  DigitGroupSeparatorCharacter,
  Integer,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  OptimizationStrategy,
  StepPosition,
  VariableName,
} from './NumbersTransition.enums';
import { AnimationDuration, ExtendedAnimationTimingFunction } from './NumbersTransition.hooks';
import {
  Animation,
  AnimationFactory,
  CssRuleFactory,
  EasingFunction,
  NumbersTransitionExecutionContext,
  NumbersTransitionTheme,
} from './NumbersTransition.styles';
import { Falsy, OrReadOnly } from './NumbersTransition.types';

type NumbersTransitionProps = typeof NumbersTransition<
  AnimationDuration,
  OrReadOnly<EasingFunction> | ExtendedAnimationTimingFunction,
  object,
  number,
  object,
  unknown,
  object,
  number,
  object,
  unknown,
  object,
  unknown,
  object,
  unknown,
  object,
  unknown,
  object,
  unknown
>;

type SelectType =
  | typeof DigitGroupSeparatorCharacter
  | typeof DecimalSeparatorCharacter
  | typeof NegativeCharacter
  | typeof NegativeCharacterAnimationMode
  | typeof AnimationInterruptionMode
  | typeof OptimizationStrategy;

type ComponentArgTypes = Partial<ArgTypes<ComponentProps<typeof NumbersTransition>>>;

type Story = StoryObj<NumbersTransitionProps>;

const meta: Meta<typeof NumbersTransition> = { component: NumbersTransition };

const mapInputType = ([fieldName, enumObject]: [keyof ComponentArgTypes, SelectType]): ComponentArgTypes => ({
  [fieldName]: { options: Object.keys(enumObject), mapping: enumObject, control: { type: 'select' } },
});

const reduceArgTypes = (accumulator: ComponentArgTypes, currentValue: ComponentArgTypes): ComponentArgTypes => ({
  ...accumulator,
  ...currentValue,
});

const inputTypes: [keyof ComponentArgTypes, SelectType][] = [
  ['digitGroupSeparator', DigitGroupSeparatorCharacter],
  ['decimalSeparator', DecimalSeparatorCharacter],
  ['negativeCharacter', NegativeCharacter],
  ['negativeCharacterAnimationMode', NegativeCharacterAnimationMode],
  ['animationInterruptionMode', AnimationInterruptionMode],
  ['optimizationStrategy', OptimizationStrategy],
];

const argTypes: ComponentArgTypes = inputTypes.map<ComponentArgTypes>(mapInputType).reduce(reduceArgTypes);

const basicEffectCss: RuleSet<object> = css<object>`
  font-size: ${Integer.Three}rem;
  color: #f0ff95;
`;

const basicEffectArgs: ComponentProps<NumbersTransitionProps> = {
  initialValue: Integer.Zero,
  value: [...Array(Integer.Ten)].reduce<string>((str: string, _: unknown, idx: number): string => `${idx}${str}${idx}`, Character.Dot),
  precision: Integer.Ten,
  decimalSeparator: DecimalSeparatorCharacter.Comma,
  digitGroupSeparator: DigitGroupSeparatorCharacter.Space,
  negativeCharacter: NegativeCharacter.Minus,
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode.Single,
  animationDuration: { horizontalAnimation: Integer.TwoThousand, verticalAnimation: Integer.FiveThousand },
  animationTimingFunction: AnimationTimingFunction.Ease,
  animationInterruptionMode: AnimationInterruptionMode.Interrupt,
  optimizationStrategy: OptimizationStrategy.None,
  deferChunkSize: Integer.TwoThousandFiveHundred,
  view: { css: basicEffectCss },
};

export const BasicEffect: Story = { argTypes, args: basicEffectArgs };

const stepsArgs: ComponentProps<NumbersTransitionProps> = {
  ...basicEffectArgs,
  animationTimingFunction: {
    horizontalAnimation: { steps: Integer.Five, stepPosition: StepPosition.JumpEnd },
    verticalAnimation: { steps: Integer.Twenty, stepPosition: StepPosition.JumpEnd },
  },
};

export const Steps: Story = { argTypes, args: stepsArgs };

const marginCss: RuleSet<object> = css<object>`
  ${basicEffectCss};
  margin: ${Integer.One}rem;
  > :not(:last-child),
  #${AnimationId.HorizontalAnimation} > * :not(:last-child) {
    margin-right: ${Integer.Five / Integer.Sixteen}rem;
  }
  #${AnimationId.VerticalAnimation} :not(:last-child),
  :has(~ * > #${AnimationId.VerticalAnimation}) > * :not(:last-child) {
    padding-bottom: ${Integer.Two}rem;
  }
`;

const marginArgs: ComponentProps<NumbersTransitionProps> = { ...basicEffectArgs, view: { css: marginCss } };

export const Margin: Story = { argTypes, args: marginArgs };

const opacityKeyframeFunction = (keyframeValue: number): RuleSet<object> => css<object>`
  opacity: ${keyframeValue};
`;

const opacityAnimation: Animation<object, number> = {
  keyframeFunction: opacityKeyframeFunction,
  keyframes: [Integer.One, Integer.One / Integer.Ten],
};

const opacityAnimationFactory: AnimationFactory<object, number> = ({
  theme: { numberOfAnimations },
}: NumbersTransitionExecutionContext): Animation<object, number> | Falsy => numberOfAnimations && opacityAnimation;

const opacityAnimationCss: RuleSet<object> = css<object>`
  ${basicEffectCss};
  animation-direction: alternate;
  animation-fill-mode: forwards;
  animation-duration: calc(var(${VariableName.TotalAnimationDuration}) / ${Integer.Two});
  animation-iteration-count: ${Integer.Two};
`;

const opacityAnimationArgs: ComponentProps<NumbersTransitionProps> = {
  ...basicEffectArgs,
  view: { css: opacityAnimationCss, animation: opacityAnimationFactory },
};

export const OpacityAnimation: Story = { argTypes, args: opacityAnimationArgs };

const rotateKeyframeFunction = (keyframeValue: number): RuleSet<object> => css<object>`
  transform: rotateY(${keyframeValue}turn);
`;

const getHorizontalRotateKeyframes = ({ animationNumber, animationDuration, totalAnimationDuration }: NumbersTransitionTheme): number[] =>
  animationNumber === AnimationNumber.One
    ? [Integer.Zero, animationDuration! / totalAnimationDuration! / Integer.Two]
    : [(Integer.One + (totalAnimationDuration! - animationDuration!) / totalAnimationDuration!) / Integer.Two, Integer.One];

const horizontalRotateAnimationFactory: AnimationFactory<object, number> = ({
  theme: { animationType, ...restTheme },
}: NumbersTransitionExecutionContext): Animation<object, number> | Falsy =>
  animationType === AnimationType.Horizontal && {
    keyframeFunction: rotateKeyframeFunction,
    keyframes: getHorizontalRotateKeyframes(restTheme),
  };

const getVerticalRotateKeyframes = ({
  animationNumber,
  horizontalAnimationDuration,
  verticalAnimationDuration,
  totalAnimationDuration,
}: NumbersTransitionTheme): number[] => [
  animationNumber === AnimationNumber.One ? Integer.Zero : horizontalAnimationDuration! / totalAnimationDuration!,
  animationNumber === AnimationNumber.One
    ? verticalAnimationDuration! / totalAnimationDuration!
    : (horizontalAnimationDuration! + verticalAnimationDuration!) / totalAnimationDuration!,
];

const mapVerticalRotateKeyframes =
  ({ animationDirection, columnLength, rowIndex }: NumbersTransitionTheme): ((value: number) => number) =>
  (value: number): number =>
    value +
    (columnLength! / Integer.Two === rowIndex! + Integer.One / Integer.Two
      ? Integer.One / Integer.Two
      : ((animationDirection === AnimationDirection.Normal ? Integer.Zero : Integer.One) + Math.min(rowIndex!, columnLength! - rowIndex!)) %
        Integer.Two);

const verticalRotateAnimationFactory: AnimationFactory<object, number> = ({
  theme: { animationType, columnLength, ...restTheme },
}: NumbersTransitionExecutionContext): Animation<object, number> | Falsy =>
  animationType === AnimationType.Vertical &&
  columnLength! > Integer.One && {
    keyframeFunction: rotateKeyframeFunction,
    keyframes: getVerticalRotateKeyframes(restTheme)
      .map<number>(mapVerticalRotateKeyframes({ ...restTheme, columnLength }))
      .map<number>((value: number): number => value / Integer.Two),
  };

const getInitialRotation = ({
  animationNumber,
  animationType,
  horizontalAnimationDuration,
  verticalAnimationDuration,
  totalAnimationDuration,
}: NumbersTransitionTheme): number => {
  switch (animationNumber!) {
    case AnimationNumber.Three:
      return (horizontalAnimationDuration! + verticalAnimationDuration!) / totalAnimationDuration!;
    case AnimationNumber.Two:
      return animationType === AnimationType.Horizontal
        ? verticalAnimationDuration! / totalAnimationDuration!
        : horizontalAnimationDuration! / totalAnimationDuration!;
    default:
      return Integer.Zero;
  }
};

const rotateAnimationCssFactory: CssRuleFactory<object> = ({ theme }: NumbersTransitionExecutionContext): RuleSet<object> => css<object>`
  ${rotateKeyframeFunction(getInitialRotation(theme) / Integer.Two)};
  animation-direction: normal;
  animation-fill-mode: forwards;
  animation-duration: var(${VariableName.AnimationDuration});
  animation-iteration-count: ${Integer.One};
`;

const rotateAnimationArgs: ComponentProps<NumbersTransitionProps> = {
  ...basicEffectArgs,
  digitView: { css: rotateAnimationCssFactory, animation: [horizontalRotateAnimationFactory, verticalRotateAnimationFactory] },
};

export const RotateAnimation: Story = { argTypes, args: rotateAnimationArgs };

export default meta;
