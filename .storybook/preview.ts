import type { Preview } from '@storybook/react-vite';
import Decorator from './decorator';

const preview: Preview = {
  parameters: {
    backgrounds: { options: { dark: { name: 'Dark', value: '#222' }, light: { name: 'Light', value: '#F7F9F2' } } },
    layout: 'fullscreen',
  },
  decorators: [Decorator],
  initialGlobals: { backgrounds: { value: 'dark' } },
};

export default preview;
