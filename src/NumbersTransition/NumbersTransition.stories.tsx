import { ComponentProps } from 'react';
import { ArgTypes, Meta, StoryObj } from '@storybook/react';
import { RuleSet, css } from 'styled-components';
import {
  AnimationTimingFunctions,
  DecimalSeparator,
  DefaultAnimationDuration,
  DigitGroupSeparator,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  Numbers,
  StorybookDefaultValue,
} from './NumbersTransition.enums';
import { Keyframe, KeyframeFunctionFactory, NumbersTransitionExecutionContext } from './NumbersTransition.styles';
import NumbersTransition from './NumbersTransition';

type SelectType =
  | typeof DigitGroupSeparator
  | typeof DecimalSeparator
  | typeof NegativeCharacter
  | typeof NegativeCharacterAnimationMode;

type ComponentArgTypes = Partial<ArgTypes<ComponentProps<typeof NumbersTransition>>>;

type Story = StoryObj<typeof NumbersTransition<NumbersTransitionExecutionContext, number>>;

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

const opacityKeyframe = (keyframeValue: number): RuleSet<object> => css<object>`
  opacity: ${keyframeValue};
`;

const opacityKeyframeFunction: KeyframeFunctionFactory<object, number> = ({
  theme: { $numberOfAnimations },
}: NumbersTransitionExecutionContext): ((keyframeValue: number) => RuleSet<object>) | undefined =>
  $numberOfAnimations ? opacityKeyframe : undefined;

const opacityKeyframes: Keyframe<number>[] = [{ value: Numbers.ONE }, { value: Numbers.ONE / Numbers.THREE }];

const opacityAnimationDuration = ({
  theme: { $totalAnimationDuration },
}: NumbersTransitionExecutionContext): number | undefined => $totalAnimationDuration;

const style: RuleSet<NumbersTransitionExecutionContext> = css<NumbersTransitionExecutionContext>`
  font-size: ${Numbers.FIVE}rem;
  color: #f0ff95;
  animation-duration: calc(${opacityAnimationDuration}ms / ${Numbers.TWO});
  animation-direction: alternate;
  animation-iteration-count: ${Numbers.TWO};
  animation-fill-mode: forwards;
`;

const args: ComponentProps<typeof NumbersTransition<NumbersTransitionExecutionContext, number>> = {
  initialValue: Numbers.ZERO,
  value: StorybookDefaultValue.VALUE,
  precision: Numbers.ZERO,
  horizontalAnimationDuration: DefaultAnimationDuration.HORIZONTAL_ANIMATION,
  verticalAnimationDuration: DefaultAnimationDuration.VERTICAL_ANIMATION,
  decimalSeparator: DecimalSeparator.COMMA,
  digitGroupSeparator: DigitGroupSeparator.SPACE,
  negativeCharacter: NegativeCharacter.MINUS,
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode.SINGLE,
  animationTimingFunction: AnimationTimingFunctions.EASE,
  view: { css: style, keyframeFunction: opacityKeyframeFunction, keyframes: opacityKeyframes },
};

export const Primary: Story = {
  argTypes,
  args,
};

export default meta;
