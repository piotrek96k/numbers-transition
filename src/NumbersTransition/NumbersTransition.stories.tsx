import { Meta, StoryObj } from '@storybook/react';
import { DigitGroupSeparator } from './NumbersTransition.styled';
import NumbersTransition from './NumbersTransition';

const meta: Meta<typeof NumbersTransition> = { component: NumbersTransition };

export default meta;

type Story = StoryObj<typeof NumbersTransition>;

export const Primary: Story = {
  args: {
    value: 123456,
    horizontalAnimationDuration: 0.5,
    verticalAnimationDuration: 2,
    digitGroupSeparator: DigitGroupSeparator.SPACE,
  },
  argTypes: {
    digitGroupSeparator: {
      options: Object.keys(DigitGroupSeparator),
      mapping: DigitGroupSeparator,
      control: {
        type: 'select',
      },
    },
  },
};
