import { FC, MutableRefObject, ReactNode, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Container, HorizontalAnimation, VerticalAnimation, Character, Digit } from './NumbersTransition.styled';
import {
  AnimationType,
  HorizontalAnimationDirection,
  VerticalAnimationDirection,
  DecimalSeparator,
  DigitGroupSeparator,
  EmptyCharacter,
  LinearAlgorithm,
  NumberPrecision,
} from './NumbersTransition.enum';

export type BigDecimal = number | bigint | `${number}`;

interface KeyProps {
  key: string;
  children: ReactNode;
}

interface AlgorithmValues {
  start: bigint;
  end: bigint;
}

interface NumbersTransitionProps {
  value?: BigDecimal;
  precision: number;
  horizontalAnimationDuration?: number;
  verticalAnimationDuration?: number;
  decimalSeparator?: DecimalSeparator;
  digitGroupSeparator?: DigitGroupSeparator;
}

const NumbersTransition: FC<NumbersTransitionProps> = (props: NumbersTransitionProps): ReactNode => {
  const {
    value,
    precision = 0,
    horizontalAnimationDuration = 0.5,
    verticalAnimationDuration = 2,
    digitGroupSeparator = DigitGroupSeparator.SPACE,
    decimalSeparator = digitGroupSeparator === DigitGroupSeparator.COMMA
      ? DecimalSeparator.DOT
      : DecimalSeparator.COMMA,
  }: NumbersTransitionProps = props;

  const [animationTypePlaying, setAnimationTypePlaying] = useState<AnimationType>();
  const [restartAnimation, setRestartAnimation] = useState<boolean>(false);

  const previousValueRef: MutableRefObject<BigDecimal> = useRef<BigDecimal>(0);
  const previousValueAnimatingRef: MutableRefObject<BigDecimal> = useRef<BigDecimal>(0);
  const containerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
  const canvasContextRef: RefObject<CanvasRenderingContext2D> = useRef<CanvasRenderingContext2D>(
    document.createElement('canvas').getContext('2d'),
  );

  const isValueValid: boolean = !!`${value}`.match(/^-?(([1-9]\d*)|0)(\.\d+)?$/);

  const sum = useCallback((first: number, second: number): number => first + second, []);

  const subtract = useCallback((first: number, second: number): number => first - second, []);

  const divide = useCallback((first: number, second: number): number => first / second, []);

  const floatingPointFill = useCallback(
    (accumulator: string[], currentValue: string, _: number, { length }: string[]) => [
      ...accumulator,
      currentValue,
      ...(length === 1 ? [''] : []),
    ],
    [],
  );

  const floatingPointReducer = useCallback(
    (integer: string, fraction: string): string => {
      const [start, mid, end, numberOfZeros]: [string, string, string, number] =
        precision > 0
          ? [integer.replace('-', ''), fraction, '', Math.max(precision - fraction.length, 0)]
          : ['', integer.replace('-', ''), fraction, -precision];
      const digits: string = `${start}${mid.slice(0, precision || mid.length) ?? 0}`;
      const restDigits: string = `${mid.slice(precision || mid.length)}${end}`;
      const increase: bigint = BigInt(restDigits) < BigInt('5'.padEnd(restDigits.length, '0')) ? 0n : 1n;
      return `${integer.replace(/\d+/, '')}${(BigInt(digits) + increase) * 10n ** BigInt(numberOfZeros)}`;
    },
    [precision],
  );

  const [previousValueCharacters, previousValueAnimatingCharacters, currentValueCharacters]: string[][] = [
    previousValueRef.current,
    previousValueAnimatingRef.current,
    isValueValid ? value! : 0,
  ].map<string[]>((number: BigDecimal): string[] => [
    ...`${number}`.split('.').reduce<string[]>(floatingPointFill, []).reduce(floatingPointReducer),
  ]);

  const [previousValueDigits, previousValueAnimatingDigits, currentValueDigits]: number[][] = [
    previousValueCharacters,
    previousValueAnimatingCharacters,
    currentValueCharacters,
  ].map<number[]>((characters: string[]): number[] =>
    characters.filter((character: string): boolean => !!character.match(/\d/)).map<number>(Number),
  );

  const digitsLengthReducer = useCallback(
    (accumulator: number[], currentValue: number, index: number): number[] => [
      ...accumulator,
      currentValue,
      ...(index ? [currentValue - accumulator[accumulator.length - 1]] : []),
    ],
    [],
  );

  const [minNumberOfDigits, maxNumberOfDigits, numberOfDigitsDifference]: number[] = [
    previousValueDigits,
    currentValueDigits,
  ]
    .map<number>(({ length }: number[]): number => length)
    .sort(subtract)
    .reduce<number[]>(digitsLengthReducer, []);

  const [previousValue, currentValue]: bigint[] = [previousValueCharacters, currentValueCharacters].map<bigint>(
    (digits: string[]): bigint => BigInt(digits.join('')),
  );

  const startAnimation = useCallback(
    (): void =>
      setAnimationTypePlaying(
        currentValueDigits.length > previousValueDigits.length ? AnimationType.HORIZONTAL : AnimationType.VERTICAL,
      ),
    [previousValueDigits.length, currentValueDigits.length],
  );

  const stopAnimation = useCallback((): void => {
    previousValueRef.current = isValueValid ? value! : 0;
    setAnimationTypePlaying(undefined);
  }, [value, previousValueRef.current, isValueValid]);

  const onAnimationEndFactory = useCallback(
    (
      { length: shorterLength }: number[],
      { length: longerLength }: number[],
      newAnimationType: AnimationType,
    ): void => {
      if (shorterLength < longerLength) {
        setAnimationTypePlaying(newAnimationType);
      } else {
        stopAnimation();
      }
    },
    [stopAnimation],
  );

  const onHorizontalAnimationEnd = useCallback(
    (): void => onAnimationEndFactory(previousValueDigits, currentValueDigits, AnimationType.VERTICAL),
    [previousValueDigits, currentValueDigits, onAnimationEndFactory],
  );

  const onVerticalAnimationEnd = useCallback(
    (): void => onAnimationEndFactory(currentValueDigits, previousValueDigits, AnimationType.HORIZONTAL),
    [previousValueDigits, currentValueDigits, onAnimationEndFactory],
  );

  const onAnimationEnd: () => void = useCallback(
    animationTypePlaying === AnimationType.HORIZONTAL ? onHorizontalAnimationEnd : onVerticalAnimationEnd,
    [animationTypePlaying, onHorizontalAnimationEnd, onVerticalAnimationEnd],
  );

  useEffect((): void => {
    if (!isValueValid) {
      stopAnimation();
      return;
    }
    if (animationTypePlaying) {
      previousValueRef.current = previousValueAnimatingRef.current;
      setRestartAnimation(true);
    } else {
      startAnimation();
    }
    previousValueAnimatingRef.current = value!;
  }, [value, precision, isValueValid]);

  useEffect((): void => {
    if (restartAnimation) {
      startAnimation();
      setRestartAnimation(false);
    }
  }, [restartAnimation]);

  useEffect((): void => {
    if (containerRef.current && canvasContextRef.current) {
      canvasContextRef.current.font =
        [...containerRef.current.classList]
          .map<string>((className: string): string => window.getComputedStyle(containerRef.current!, className).font)
          .find((font: string): string => font) ?? '';
    }
  }, [containerRef.current, canvasContextRef.current]);

  const getSeparatorWidth = useCallback(
    (separator: DecimalSeparator | DigitGroupSeparator): number =>
      [separator, '0']
        .map<number>((text: string): number => canvasContextRef.current!.measureText(text).width)
        .reduce(divide),
    [canvasContextRef.current, divide],
  );

  const getDigitsSeparatorsWidth = useCallback(
    (numberOfDigits: number): number =>
      getSeparatorWidth(digitGroupSeparator) *
      [numberOfDigits - Math.max(precision, 0), Math.max(precision, 0)]
        .map((quantity: number): number => Math.trunc((quantity - 1) / 3))
        .reduce(sum),
    [precision, digitGroupSeparator, sum, getSeparatorWidth],
  );

  const getHorizontalAnimationWidth = useCallback(
    (numberOfDigits: number): number =>
      [
        numberOfDigits,
        getDigitsSeparatorsWidth(numberOfDigits),
        precision > 0 ? getSeparatorWidth(decimalSeparator) : 0,
      ].reduce(sum),
    [precision, decimalSeparator, sum, getSeparatorWidth, getDigitsSeparatorsWidth],
  );

  const algorithmValuesArrayReducer = useCallback(
    (accumulator: AlgorithmValues[][], _: undefined, index: number): AlgorithmValues[][] => {
      const [start, end]: bigint[] = [previousValue, currentValue]
        .map<bigint>((number: bigint): bigint => number / 10n ** BigInt(maxNumberOfDigits - index - 1))
        .sort((first: bigint, second: bigint): number => (first < second ? -1 : first > second ? 1 : 0));
      const accumulatorIndex: number = end - start < LinearAlgorithm.MAX_LENGTH ? 0 : 1;
      accumulator[accumulatorIndex] = [...accumulator[accumulatorIndex], { start, end }];
      return accumulator;
    },
    [previousValue, currentValue, maxNumberOfDigits],
  );

  const linearAlgorithmMapper = useCallback(
    ({ start, end }: AlgorithmValues): number[] =>
      [...Array(Number(end - start) + 1)].map<number>((_: undefined, index: number): number =>
        Number((start + BigInt(index)) % 10n),
      ),
    [],
  );

  const nonLinearAlgorithmMapper = useCallback((values: AlgorithmValues, algorithmIndex: number): number[] => {
    const { start, end }: AlgorithmValues = values;
    const numbers: number[] = [...Array(LinearAlgorithm.MAX_LENGTH * (1 + 0.5 * algorithmIndex))]
      .map<bigint>(
        (_: undefined, index: number, { length }: number[]): bigint =>
          (NumberPrecision.VALUE * (start * BigInt(length - index) + end * BigInt(index))) / BigInt(length),
      )
      .map<[bigint, bigint]>((increasedValue: bigint): [bigint, bigint] => [
        increasedValue,
        increasedValue / NumberPrecision.VALUE,
      ])
      .map<bigint>(([increasedValue, newValue]: [bigint, bigint]): bigint =>
        increasedValue - newValue * NumberPrecision.VALUE < NumberPrecision.HALF_VALUE ? newValue : newValue + 1n,
      )
      .map<number>((roundedValue: bigint): number => Number(roundedValue % 10n));
    return numbers[numbers.length - 1] === Number(end % 10n) ? numbers : [...numbers, Number(end % 10n)];
  }, []);

  const algorithmMapper = useCallback(
    (algorithmValuesArray: AlgorithmValues[], index: number): number[][] =>
      algorithmValuesArray.map<number[]>(index ? nonLinearAlgorithmMapper : linearAlgorithmMapper),
    [linearAlgorithmMapper, nonLinearAlgorithmMapper],
  );

  const getHorizontalAnimationDigits = useCallback(
    (): number[] => [
      ...Array(numberOfDigitsDifference).fill(0),
      ...(currentValue > previousValue ? previousValueDigits : currentValueDigits),
    ],
    [previousValueDigits, currentValueDigits, numberOfDigitsDifference, previousValue, currentValue],
  );

  const getVerticalAnimationDigitsArray = useCallback(
    (): number[][] =>
      [...Array(maxNumberOfDigits)]
        .reduce<AlgorithmValues[][]>(algorithmValuesArrayReducer, [[], []])
        .map<number[][]>(algorithmMapper)
        .flat<number[][][], 1>(),
    [maxNumberOfDigits, algorithmValuesArrayReducer, algorithmMapper],
  );

  const getNumericValueDigits = useCallback(
    (): number[] => (animationTypePlaying ? previousValueAnimatingDigits : previousValueDigits),
    [animationTypePlaying, previousValueDigits, previousValueAnimatingDigits],
  );

  const digitsMapperFactory = useCallback(
    (Component: FC<KeyProps> | string, digit: ReactNode, index: number): JSX.Element => (
      <Component key={`${index + 1}`.padStart(2, '0')}>{digit}</Component>
    ),
    [],
  );

  const digitsMapper = useCallback(
    (digit: ReactNode, index: number): JSX.Element => digitsMapperFactory(Digit, digit, index),
    [digitsMapperFactory],
  );

  const digitsVerticalAnimationMapper = useCallback(
    (digit: number, index: number): JSX.Element => digitsMapperFactory('div', digit, index),
    [digitsMapperFactory],
  );

  const digitsVerticalAnimationArrayMapper = useCallback(
    (digits: number[], index: number): JSX.Element =>
      digitsMapper(
        <VerticalAnimation
          $animationDirection={
            currentValue > previousValue ? VerticalAnimationDirection.UP : VerticalAnimationDirection.DOWN
          }
          $animationDuration={verticalAnimationDuration}
        >
          {digits.map(digitsVerticalAnimationMapper)}
        </VerticalAnimation>,
        index,
      ),
    [verticalAnimationDuration, previousValue, currentValue, digitsMapper, digitsVerticalAnimationMapper],
  );

  const digitsReducer = useCallback(
    (accumulator: JSX.Element, currentValue: JSX.Element, index: number, { length }: JSX.Element[]): JSX.Element => (
      <>
        {accumulator}
        {!((length - index - Math.max(precision, 0)) % 3) && (
          <Character>{length - index === precision ? decimalSeparator : digitGroupSeparator}</Character>
        )}
        {currentValue}
      </>
    ),
    [precision, digitGroupSeparator, decimalSeparator],
  );

  const getHorizontalAnimation = useCallback(
    (): JSX.Element => (
      <HorizontalAnimation
        $animationDirection={
          currentValue > previousValue ? HorizontalAnimationDirection.RIGHT : HorizontalAnimationDirection.LEFT
        }
        $animationDuration={horizontalAnimationDuration}
        $animationStartWidth={getHorizontalAnimationWidth(minNumberOfDigits)}
        $animationEndWidth={getHorizontalAnimationWidth(maxNumberOfDigits)}
      >
        <div>{getHorizontalAnimationDigits().map<JSX.Element>(digitsMapper).reduce(digitsReducer)}</div>
      </HorizontalAnimation>
    ),
    [
      horizontalAnimationDuration,
      minNumberOfDigits,
      maxNumberOfDigits,
      previousValue,
      currentValue,
      getHorizontalAnimationWidth,
      getHorizontalAnimationDigits,
      digitsMapper,
      digitsReducer,
    ],
  );

  const getVerticalAnimation = useCallback(
    (): JSX.Element =>
      getVerticalAnimationDigitsArray().map<JSX.Element>(digitsVerticalAnimationArrayMapper).reduce(digitsReducer),
    [getVerticalAnimationDigitsArray, digitsVerticalAnimationArrayMapper, digitsReducer],
  );

  const getAnimation: () => JSX.Element = useCallback(
    animationTypePlaying === AnimationType.HORIZONTAL ? getHorizontalAnimation : getVerticalAnimation,
    [animationTypePlaying, getHorizontalAnimation, getVerticalAnimation],
  );

  const getEmptyValue = useCallback((): JSX.Element => <Character>{EmptyCharacter.VALUE}</Character>, []);

  const getNumericValue = useCallback(
    (): JSX.Element => getNumericValueDigits().map<JSX.Element>(digitsMapper).reduce(digitsReducer),
    [getNumericValueDigits, digitsMapper, digitsReducer],
  );

  const getValue: () => JSX.Element = useCallback(isValueValid ? getNumericValue : getEmptyValue, [
    isValueValid,
    getEmptyValue,
    getNumericValue,
  ]);

  const getContent: () => JSX.Element = useCallback(
    animationTypePlaying && isValueValid && currentValue !== previousValue ? getAnimation : getValue,
    [animationTypePlaying, isValueValid, previousValue, currentValue, getAnimation, getValue],
  );

  return (
    <Container ref={containerRef} onAnimationEnd={onAnimationEnd}>
      {getContent()}
    </Container>
  );
};

export default NumbersTransition;
