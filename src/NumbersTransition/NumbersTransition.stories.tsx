import type { ComponentProps } from 'react';
import { RuleSet, css } from 'styled-components';
import type { ArgTypes, Meta, StoryObj } from '@storybook/react-vite';
import type { InputType } from 'storybook/internal/types';
import NumbersTransition from './NumbersTransition';
import {
  AnimationDirection,
  AnimationFillMode,
  AnimationId,
  AnimationInterruptionMode,
  AnimationNumber,
  AnimationTimingFunction,
  AnimationType,
  Color,
  CssUnit,
  DecimalSeparatorCharacter,
  DigitGroupSeparatorCharacter,
  Integer,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  OptimizationStrategy,
  StepPosition,
  Text,
  VariableName,
} from './NumbersTransition.enums';
import type { AnimationDuration, ExtendedAnimationTimingFunction } from './NumbersTransition.hooks';
import type {
  Animation,
  AnimationFactory,
  CssRuleFactory,
  EasingFunction,
  NumbersTransitionExecutionContext,
  NumbersTransitionTheme,
} from './NumbersTransition.styles';
import type { EnumType, EnumValue, Falsy, OrReadOnly, Remove, Select } from './NumbersTransition.types';

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

type SelectTypes = {
  [K in keyof Select<Required<ComponentProps<NumbersTransitionProps>>, EnumValue<SelectType>>]: EnumType<
    SelectType,
    Required<ComponentProps<NumbersTransitionProps>>[K]
  >;
};

type ComponentArgTypes = Partial<ArgTypes<ComponentProps<NumbersTransitionProps>>>;

type Story = StoryObj<NumbersTransitionProps>;

const mapInputType = ([fieldName, enumObject]: [string, SelectType]): [string, InputType] => [
  fieldName,
  { options: Object.keys(enumObject ?? {}), mapping: enumObject, control: { type: 'select' } },
];

const meta: Meta<typeof NumbersTransition> = { component: NumbersTransition };

const inputTypes: SelectTypes = {
  digitGroupSeparator: DigitGroupSeparatorCharacter,
  decimalSeparator: DecimalSeparatorCharacter,
  negativeCharacter: NegativeCharacter,
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode,
  animationInterruptionMode: AnimationInterruptionMode,
  optimizationStrategy: OptimizationStrategy,
};

const argTypes: ComponentArgTypes = Object.fromEntries<InputType>(
  Object.entries<SelectType>(inputTypes).map<[string, InputType]>(mapInputType),
);

const basicEffectCss: RuleSet<object> = css<object>`
  font-size: ${Integer.Three}${CssUnit.Rem};
  color: ${Color.Yellow};
`;

const basicEffectArgs: ComponentProps<NumbersTransitionProps> = {
  initialValue: Integer.Zero,
  value: [...Array(Integer.Ten)].reduce<string>((text: string, _: unknown, index: number): string => `${index}${text}${index}`, Text.Dot),
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
  margin: ${Integer.One}${CssUnit.Rem};
  > :not(:last-child),
  [id^=${AnimationId.HorizontalAnimation}] > * :not(:last-child) {
    margin-right: ${Integer.Five / Integer.Sixteen}${CssUnit.Rem};
  }
  [id^=${AnimationId.VerticalAnimation}] :not(:last-child),
  :has(~ * > [id^=${AnimationId.VerticalAnimation}]) > * :not(:last-child) {
    padding-bottom: ${Integer.Two}${CssUnit.Rem};
  }
`;

const marginArgs: ComponentProps<NumbersTransitionProps> = { ...basicEffectArgs, view: { css: marginCss } };

export const Margin: Story = { argTypes, args: marginArgs };

const opacityKeyframeFunction = (keyframeValue: number): RuleSet<object> => css<object>`
  opacity: ${keyframeValue};
`;

const opacityAnimation: Animation<object, number> = {
  keyframeFunction: opacityKeyframeFunction,
  keyframes: [Integer.One, Integer.One / Integer.Ten, Integer.One],
};

const opacityAnimationFactory: AnimationFactory<object, number> = ({
  theme: { numberOfAnimations },
}: NumbersTransitionExecutionContext): Animation<object, number> | Falsy => numberOfAnimations && opacityAnimation;

const opacityAnimationCss: RuleSet<object> = css<object>`
  ${basicEffectCss};
  animation-fill-mode: ${AnimationFillMode.Forwards};
  animation-duration: var(${VariableName.TotalAnimationDuration});
  animation-iteration-count: ${Integer.One};
`;

const opacityAnimationArgs: ComponentProps<NumbersTransitionProps> = {
  ...basicEffectArgs,
  view: { css: opacityAnimationCss, animation: opacityAnimationFactory },
};

export const OpacityAnimation: Story = { argTypes, args: opacityAnimationArgs };

const rotateKeyframeFunction = (keyframeValue: number): RuleSet<object> => css<object>`
  transform: rotateY(${keyframeValue}${CssUnit.Turn});
`;

const getHorizontalRotateKeyframes = ({
  animationNumber,
  animationDuration,
  totalAnimationDuration,
}: Remove<NumbersTransitionTheme, AnimationType>): number[] =>
  animationNumber === AnimationNumber.One
    ? [Integer.Zero, animationDuration / totalAnimationDuration / Integer.Two]
    : [(Integer.One + (totalAnimationDuration - animationDuration) / totalAnimationDuration) / Integer.Two, Integer.One];

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
}: Remove<NumbersTransitionTheme, AnimationType>): number[] =>
  animationNumber === AnimationNumber.One
    ? [Integer.Zero, verticalAnimationDuration / totalAnimationDuration]
    : [
        horizontalAnimationDuration / totalAnimationDuration,
        (horizontalAnimationDuration + verticalAnimationDuration) / totalAnimationDuration,
      ];

const mapVerticalRotateKeyframes =
  ({ animationDirection, columnLength, rowIndex }: Remove<NumbersTransitionTheme, AnimationType>): ((value: number) => number) =>
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
    keyframes: getVerticalRotateKeyframes(restTheme).mapMulti<[number, number]>([
      mapVerticalRotateKeyframes({ ...restTheme, columnLength }),
      (value: number): number => value / Integer.Two,
    ]),
  };

const getInitialRotation = ({
  animationNumber,
  animationType,
  horizontalAnimationDuration,
  verticalAnimationDuration,
  totalAnimationDuration,
}: NumbersTransitionTheme): number => {
  switch (animationNumber) {
    case AnimationNumber.Three:
      return (horizontalAnimationDuration + verticalAnimationDuration) / totalAnimationDuration;
    case AnimationNumber.Two:
      return (
        (animationType === AnimationType.Horizontal ? verticalAnimationDuration : horizontalAnimationDuration) / totalAnimationDuration
      );
    default:
      return Integer.Zero;
  }
};

const rotateAnimationCssFactory: CssRuleFactory<object> = ({ theme }: NumbersTransitionExecutionContext): RuleSet<object> => css<object>`
  ${rotateKeyframeFunction(getInitialRotation(theme) / Integer.Two)};
  animation-fill-mode: ${AnimationFillMode.Forwards};
  animation-duration: var(${VariableName.AnimationDuration});
  animation-iteration-count: ${Integer.One};
`;

const rotateAnimationArgs: ComponentProps<NumbersTransitionProps> = {
  ...basicEffectArgs,
  digitView: { css: rotateAnimationCssFactory, animation: [horizontalRotateAnimationFactory, verticalRotateAnimationFactory] },
};

export const RotateAnimation: Story = { argTypes, args: rotateAnimationArgs };

export default meta;
