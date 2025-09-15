import type { Preview } from '@storybook/react-vite';
import Decorator from './decorator';

const preview: Preview = {
  parameters: { backgrounds: { options: { dark: { name: 'Dark', value: '#222' } } }, layout: 'fullscreen' },
  decorators: [Decorator],
  initialGlobals: { backgrounds: { value: 'dark' } },
};

export default preview;
