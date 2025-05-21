import { ComponentProps } from 'react';
import { RuleSet, css } from 'styled-components';
import { ArgTypes, Meta, StoryObj } from '@storybook/react';
import NumbersTransition from './NumbersTransition';
import {
  AnimationDurationValues,
  AnimationTimingFunctions,
  DecimalSeparator,
  DigitGroupSeparator,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  Numbers,
  StorybookValue,
} from './NumbersTransition.enums';
import { AnimationDuration } from './NumbersTransition.hooks';
import {
  Animation,
  AnimationFactory,
  AnimationTimingFunction,
  NumbersTransitionExecutionContext,
} from './NumbersTransition.styles';
import { OrReadOnly } from './NumbersTransition.types';

type NumbersTransitionProps = typeof NumbersTransition<
  AnimationDuration,
  OrReadOnly<AnimationTimingFunction>,
  NumbersTransitionExecutionContext,
  number
>;

type SelectType =
  | typeof DigitGroupSeparator
  | typeof DecimalSeparator
  | typeof NegativeCharacter
  | typeof NegativeCharacterAnimationMode;

type ComponentArgTypes = Partial<ArgTypes<ComponentProps<typeof NumbersTransition>>>;

type Story = StoryObj<NumbersTransitionProps>;

const meta: Meta<typeof NumbersTransition> = { component: NumbersTransition };

const inputTypeMapper = ([fieldName, enumObject]: [keyof ComponentArgTypes, SelectType]): ComponentArgTypes => ({
  [fieldName]: {
    options: Object.keys(enumObject),
    mapping: enumObject,
    control: {
      type: 'select',
    },
  },
});

const argTypesReducer = (accumulator: ComponentArgTypes, currentValue: ComponentArgTypes): ComponentArgTypes => ({
  ...accumulator,
  ...currentValue,
});

const inputTypes: [keyof ComponentArgTypes, SelectType][] = [
  ['digitGroupSeparator', DigitGroupSeparator],
  ['decimalSeparator', DecimalSeparator],
  ['negativeCharacter', NegativeCharacter],
  ['negativeCharacterAnimationMode', NegativeCharacterAnimationMode],
];

const argTypes: ComponentArgTypes = inputTypes.map<ComponentArgTypes>(inputTypeMapper).reduce(argTypesReducer);

const opacityKeyframeFunction = (keyframeValue: number): RuleSet<object> => css<object>`
  opacity: ${keyframeValue};
`;

const opacityAnimation: Animation<object, number> = {
  keyframeFunction: opacityKeyframeFunction,
  keyframes: [Numbers.ONE, Numbers.ONE / Numbers.THREE],
};

const opacityAnimationFactory: AnimationFactory<object, number> = ({
  theme: { $numberOfAnimations },
}: NumbersTransitionExecutionContext): undefined | Animation<object, number> =>
  $numberOfAnimations ? opacityAnimation : undefined;

const opacityAnimationDuration = ({
  theme: { $totalAnimationDuration },
}: NumbersTransitionExecutionContext): undefined | number => $totalAnimationDuration;

const style: RuleSet<NumbersTransitionExecutionContext> = css<NumbersTransitionExecutionContext>`
  font-size: ${Numbers.FIVE}rem;
  color: #f0ff95;
  animation-duration: calc(${opacityAnimationDuration}ms / ${Numbers.TWO});
  animation-direction: alternate;
  animation-iteration-count: ${Numbers.TWO};
  animation-fill-mode: forwards;
`;

const args: ComponentProps<NumbersTransitionProps> = {
  initialValue: Numbers.ZERO,
  value: StorybookValue.VALUE,
  precision: Numbers.ZERO,
  animationDuration: {
    horizontalAnimation: AnimationDurationValues.HORIZONTAL_ANIMATION,
    verticalAnimation: AnimationDurationValues.VERTICAL_ANIMATION,
  },
  decimalSeparator: DecimalSeparator.COMMA,
  digitGroupSeparator: DigitGroupSeparator.SPACE,
  negativeCharacter: NegativeCharacter.MINUS,
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode.SINGLE,
  animationTimingFunction: AnimationTimingFunctions.EASE,
  view: { css: style, animation: opacityAnimationFactory },
};

export const Primary: Story = {
  argTypes,
  args,
};

export default meta;
