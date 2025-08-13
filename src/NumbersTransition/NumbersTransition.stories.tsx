import { ComponentProps } from 'react';
import { RuleSet, css } from 'styled-components';
import { ArgTypes, Meta, StoryObj } from '@storybook/react';
import NumbersTransition from './NumbersTransition';
import {
  AnimationDurationValue,
  AnimationInterruptionMode,
  AnimationTimingFunction,
  DecimalSeparatorCharacter,
  DigitGroupSeparatorCharacter,
  Integer,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  OptimizationStrategy,
  StorybookValue,
  VariableName,
} from './NumbersTransition.enums';
import { AnimationDuration } from './NumbersTransition.hooks';
import { Animation, AnimationFactory, AnimationTimingFunctionTuple, NumbersTransitionExecutionContext } from './NumbersTransition.styles';
import { Falsy, ReadOnly } from './NumbersTransition.types';

type NumbersTransitionProps = typeof NumbersTransition<
  AnimationDuration,
  ReadOnly<AnimationTimingFunctionTuple>,
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

const opacityKeyframeFunction = (keyframeValue: number): RuleSet<object> => css<object>`
  opacity: ${keyframeValue};
`;

const opacityAnimation: Animation<object, number> = {
  keyframeFunction: opacityKeyframeFunction,
  keyframes: [Integer.One, Integer.One / Integer.Three],
};

const opacityAnimationFactory: AnimationFactory<object, number> = ({
  theme: { numberOfAnimations },
}: NumbersTransitionExecutionContext): Animation<object, number> | Falsy => numberOfAnimations && opacityAnimation;

const style: RuleSet<object> = css<object>`
  font-size: ${Integer.Three}rem;
  color: #f0ff95;
  animation-duration: calc(var(${VariableName.TotalAnimationDuration}) / ${Integer.Two});
  animation-direction: alternate;
  animation-iteration-count: ${Integer.Two};
  animation-fill-mode: forwards;
`;

const args: ComponentProps<NumbersTransitionProps> = {
  initialValue: Integer.Zero,
  value: StorybookValue.Value,
  precision: Integer.Zero,
  decimalSeparator: DecimalSeparatorCharacter.Comma,
  digitGroupSeparator: DigitGroupSeparatorCharacter.Space,
  negativeCharacter: NegativeCharacter.Minus,
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode.Single,
  animationDuration: {
    horizontalAnimation: AnimationDurationValue.HorizontalAnimation,
    verticalAnimation: AnimationDurationValue.VerticalAnimation,
  },
  animationTimingFunction: AnimationTimingFunction.Ease,
  animationInterruptionMode: AnimationInterruptionMode.Interrupt,
  optimizationStrategy: OptimizationStrategy.None,
  deferChunkSize: Integer.TwoThousandFiveHundred,
  view: { css: style, animation: opacityAnimationFactory },
};

export const Primary: Story = { argTypes, args };

export default meta;
