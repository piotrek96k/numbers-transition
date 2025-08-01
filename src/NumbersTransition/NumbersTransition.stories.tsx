import { ComponentProps } from 'react';
import { RuleSet, css } from 'styled-components';
import { ArgTypes, Meta, StoryObj } from '@storybook/react';
import NumbersTransition from './NumbersTransition';
import {
  AnimationDurationValues,
  AnimationInterruptionModes,
  AnimationTimingFunctions,
  DecimalSeparators,
  DigitGroupSeparators,
  NegativeCharacterAnimationModes,
  NegativeCharacters,
  Numbers,
  OptimizationStrategies,
  StorybookValue,
  VariableNames,
} from './NumbersTransition.enums';
import { AnimationDuration } from './NumbersTransition.hooks';
import { Animation, AnimationFactory, AnimationTimingFunction, NumbersTransitionExecutionContext } from './NumbersTransition.styles';
import { Falsy, ReadOnly } from './NumbersTransition.types';

type NumbersTransitionProps = typeof NumbersTransition<
  AnimationDuration,
  ReadOnly<AnimationTimingFunction>,
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
  | typeof DigitGroupSeparators
  | typeof DecimalSeparators
  | typeof NegativeCharacters
  | typeof NegativeCharacterAnimationModes
  | typeof AnimationInterruptionModes
  | typeof OptimizationStrategies;

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
  ['digitGroupSeparator', DigitGroupSeparators],
  ['decimalSeparator', DecimalSeparators],
  ['negativeCharacter', NegativeCharacters],
  ['negativeCharacterAnimationMode', NegativeCharacterAnimationModes],
  ['animationInterruptionMode', AnimationInterruptionModes],
  ['optimizationStrategy', OptimizationStrategies],
];

const argTypes: ComponentArgTypes = inputTypes.map<ComponentArgTypes>(mapInputType).reduce(reduceArgTypes);

const opacityKeyframeFunction = (keyframeValue: number): RuleSet<object> => css<object>`
  opacity: ${keyframeValue};
`;

const opacityAnimation: Animation<object, number> = {
  keyframeFunction: opacityKeyframeFunction,
  keyframes: [Numbers.ONE, Numbers.ONE / Numbers.THREE],
};

const opacityAnimationFactory: AnimationFactory<object, number> = ({
  theme: { numberOfAnimations },
}: NumbersTransitionExecutionContext): Animation<object, number> | Falsy => numberOfAnimations && opacityAnimation;

const style: RuleSet<object> = css<object>`
  font-size: ${Numbers.FIVE}rem;
  color: #f0ff95;
  animation-duration: calc(var(${VariableNames.TOTAL_ANIMATION_DURATION}) / ${Numbers.TWO});
  animation-direction: alternate;
  animation-iteration-count: ${Numbers.TWO};
  animation-fill-mode: forwards;
`;

const args: ComponentProps<NumbersTransitionProps> = {
  initialValue: Numbers.ZERO,
  value: StorybookValue.VALUE,
  precision: Numbers.ZERO,
  decimalSeparator: DecimalSeparators.COMMA,
  digitGroupSeparator: DigitGroupSeparators.SPACE,
  negativeCharacter: NegativeCharacters.MINUS,
  negativeCharacterAnimationMode: NegativeCharacterAnimationModes.SINGLE,
  animationDuration: {
    horizontalAnimation: AnimationDurationValues.HORIZONTAL_ANIMATION,
    verticalAnimation: AnimationDurationValues.VERTICAL_ANIMATION,
  },
  animationTimingFunction: AnimationTimingFunctions.EASE,
  animationInterruptionMode: AnimationInterruptionModes.INTERRUPT,
  optimizationStrategy: OptimizationStrategies.NONE,
  view: { css: style, animation: opacityAnimationFactory },
};

export const Primary: Story = { argTypes, args };

export default meta;
