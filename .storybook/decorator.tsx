import { ReactRenderer } from '@storybook/react-vite';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { DecoratorFunction, PartialStoryFn } from 'storybook/internal/types';

const Decorator: DecoratorFunction<ReactRenderer> = (
  Story: PartialStoryFn<ReactRenderer>,
): ReturnType<DecoratorFunction<ReactRenderer>> => {
  const [timedOut, setTimedOut]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);

  useEffect((): (() => void) => {
    const timeout: NodeJS.Timeout = setTimeout((): void => setTimedOut(true), 250);
    return (): void => clearTimeout(timeout);
  });

  return <div>{timedOut && <Story />}</div>;
};

export default Decorator;
