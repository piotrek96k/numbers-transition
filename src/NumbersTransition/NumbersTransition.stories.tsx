import { ArgTypes, Meta, StoryObj } from '@storybook/react';
import { ComponentProps } from 'react';
import NumbersTransition from './NumbersTransition';
import { DecimalSeparator, DigitGroupSeparator } from './NumbersTransition.enum';

const meta: Meta<typeof NumbersTransition> = { component: NumbersTransition };

export default meta;

type Story = StoryObj<typeof NumbersTransition>;

const argTypes: Partial<ArgTypes<ComponentProps<typeof NumbersTransition>>> = {
  digitGroupSeparator: {
    options: Object.keys(DigitGroupSeparator),
    mapping: DigitGroupSeparator,
    control: {
      type: 'select',
    },
  },
  decimalSeparator: {
    options: Object.keys(DecimalSeparator),
    mapping: DecimalSeparator,
    control: {
      type: 'select',
    },
  },
};

const args: Partial<ComponentProps<typeof NumbersTransition>> = {
  value: 123456789,
  precision: 0,
  horizontalAnimationDuration: 0.5,
  verticalAnimationDuration: 2,
  digitGroupSeparator: DigitGroupSeparator.SPACE,
  decimalSeparator: DecimalSeparator.COMMA,
};

export const Primary: Story = {
  argTypes,
  args,
};
