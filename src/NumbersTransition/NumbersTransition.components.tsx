import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react';

interface ConditionalProps {
  children: [ReactNode, ReactNode];
  condition: boolean;
}

export const Conditional: FC<ConditionalProps> = (props: ConditionalProps): ReactNode => {
  const {
    children: [onTrue, onFalse],
    condition,
  }: ConditionalProps = props;

  return condition ? onTrue : onFalse;
};

interface SwitchProps {
  children: [ReactNode, ReactNode];
  time: number;
  reverse: boolean;
}

export const Switch: FC<SwitchProps> = (props: SwitchProps): ReactNode => {
  const {
    children: [before, after],
    time,
    reverse,
  }: SwitchProps = props;

  const [switched, setSwitched]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);

  useEffect((): (() => void) => {
    const timeout: NodeJS.Timeout = setTimeout((): void => setSwitched(true), 1_000 * time);
    return (): void => clearTimeout(timeout);
  }, [time]);

  return switched === reverse ? before : after;
};
