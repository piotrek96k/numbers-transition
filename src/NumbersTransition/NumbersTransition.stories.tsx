import { ArgTypes, Meta, StoryObj } from '@storybook/react';
import { ComponentProps } from 'react';
import NumbersTransition from './NumbersTransition';
import { DecimalSeparator, DigitGroupSeparator, NegativeCharacter } from './NumbersTransition.enum';

type SelectType = typeof DigitGroupSeparator | typeof DecimalSeparator | typeof NegativeCharacter;

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
];

const argTypes: ComponentArgTypes = inputTypes.map<ComponentArgTypes>(inputTypeMapper).reduce(argTypesReducer);

const args: Partial<ComponentProps<typeof NumbersTransition>> = {
  value: 123456789,
  precision: 0,
  horizontalAnimationDuration: 0.5,
  verticalAnimationDuration: 2,
  digitGroupSeparator: DigitGroupSeparator.SPACE,
  decimalSeparator: DecimalSeparator.COMMA,
  negativeCharacter: NegativeCharacter.MINUS,
};

export const Primary: Story = {
  argTypes,
  args,
};

export default meta;
