import { ComponentProps } from 'react';
import { ArgTypes, Meta, StoryObj } from '@storybook/react';
import {
  DecimalSeparator,
  DigitGroupSeparator,
  EaseAnimationTimingFunction,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
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

const args: Partial<ComponentProps<typeof NumbersTransition>> = {
  initialValue: 0,
  value: 123_456_789,
  precision: 0,
  horizontalAnimationDuration: 2_000,
  verticalAnimationDuration: 5_000,
  decimalSeparator: DecimalSeparator.COMMA,
  digitGroupSeparator: DigitGroupSeparator.SPACE,
  negativeCharacter: NegativeCharacter.MINUS,
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode.SINGLE,
  animationTimingFunction: [[...EaseAnimationTimingFunction.VALUES[0]], [...EaseAnimationTimingFunction.VALUES[1]]],
};

export const Primary: Story = {
  argTypes,
  args,
};

export default meta;
