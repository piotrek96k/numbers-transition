import { ComponentProps } from 'react';
import { ArgTypes, Meta, StoryObj } from '@storybook/react';
import { RuleSet, css } from 'styled-components';
import {
  AnimationTimingFunctions,
  DecimalSeparator,
  DefaultAnimationDuration,
  DefaultValue,
  DigitGroupSeparator,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  Numbers,
} from './NumbersTransition.enums';
import NumbersTransition from './NumbersTransition';

type SelectType =
  | typeof DigitGroupSeparator
  | typeof DecimalSeparator
  | typeof NegativeCharacter
  | typeof NegativeCharacterAnimationMode;

type ComponentArgTypes = Partial<ArgTypes<ComponentProps<typeof NumbersTransition>>>;

type Story = StoryObj<typeof NumbersTransition>;

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

const style: RuleSet<object> = css`
  font-size: ${Numbers.ONE_HUNDRED}px;
  color: #f0ff95;
`;

const args: Partial<ComponentProps<typeof NumbersTransition>> = {
  initialValue: Numbers.ZERO,
  value: DefaultValue.VALUE,
  precision: Numbers.ZERO,
  horizontalAnimationDuration: DefaultAnimationDuration.HORIZONTAL_ANIMATION,
  verticalAnimationDuration: DefaultAnimationDuration.VERTICAL_ANIMATION,
  decimalSeparator: DecimalSeparator.COMMA,
  digitGroupSeparator: DigitGroupSeparator.SPACE,
  negativeCharacter: NegativeCharacter.MINUS,
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode.SINGLE,
  horizontalAnimationTimingFunction: AnimationTimingFunctions.EASE,
  verticalAnimationTimingFunction: AnimationTimingFunctions.EASE,
  css: style,
};

export const Primary: Story = {
  argTypes,
  args,
};

export default meta;
