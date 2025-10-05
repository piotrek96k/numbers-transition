import { ComponentProps } from 'react';
import { RuleSet, css } from 'styled-components';
import { ArgTypes, Meta, StoryObj } from '@storybook/react-vite';
import NumbersTransition from './NumbersTransition';
import {
  AnimationId,
  AnimationInterruptionMode,
  AnimationTimingFunction,
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
import { Animation, AnimationFactory, EasingFunction, NumbersTransitionExecutionContext } from './NumbersTransition.styles';
import { Falsy, OrReadOnly } from './NumbersTransition.types';

type NumbersTransitionProps = typeof NumbersTransition<
  AnimationDuration,
  OrReadOnly<EasingFunction> | ExtendedAnimationTimingFunction,
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
  animation-duration: calc(var(${VariableName.TotalAnimationDuration}) / ${Integer.Two});
  animation-direction: alternate;
  animation-iteration-count: ${Integer.Two};
  animation-fill-mode: forwards;
`;

const opacityAnimationArgs: ComponentProps<NumbersTransitionProps> = {
  ...basicEffectArgs,
  view: { css: opacityAnimationCss, animation: opacityAnimationFactory },
};

export const OpacityAnimation: Story = { argTypes, args: opacityAnimationArgs };

export default meta;
