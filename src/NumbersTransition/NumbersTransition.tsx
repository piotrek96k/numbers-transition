import { FC, MutableRefObject, ReactNode, RefObject, useEffect, useRef, useState } from 'react';
import { HorizontalAnimation, VerticalAnimation, Character, Digit } from './NumbersTransition.styled';
import {
  AnimationType,
  HorizontalAnimationDirection,
  VerticalAnimationDirection,
  DecimalSeparator,
  DigitGroupSeparator,
  LinearAlgorithm,
  EmptyCharacter,
  NumberPrecision,
} from './NumbersTransition.enum';

type BigDecimal = number | bigint | `${number}`;

interface AlgorithmValues {
  start: bigint;
  end: bigint;
}

interface KeyProps {
  key: string;
  children: ReactNode;
}

interface NumbersTransitionProps {
  value?: BigDecimal;
  horizontalAnimationDuration?: number;
  verticalAnimationDuration?: number;
  digitGroupSeparator?: DigitGroupSeparator;
}

const NumbersTransition: FC<NumbersTransitionProps> = (props) => {
  const {
    value,
    horizontalAnimationDuration = 0.5,
    verticalAnimationDuration = 2,
    digitGroupSeparator = DigitGroupSeparator.SPACE,
  } = props;

  const [animationTypePlaying, setAnimationTypePlaying] = useState<AnimationType>();
  const [restartAnimation, setRestartAnimation] = useState<boolean>(false);

  const previousValueRef: MutableRefObject<BigDecimal> = useRef<BigDecimal>(0);
  const previousValueAnimatingRef: MutableRefObject<BigDecimal> = useRef<BigDecimal>(0);
  const componentRef: RefObject<HTMLSpanElement> = useRef<HTMLSpanElement>(null);
  const canvasContextRef: RefObject<CanvasRenderingContext2D> = useRef<CanvasRenderingContext2D>(
    document.createElement('canvas').getContext('2d'),
  );

  const isValueValid: boolean = !!`${value}`.match(/^-?\d+(\.\d+)?$/);

  const [previousValueDigits, previousValueAnimatingDigits, currentValueDigits] = [
    previousValueRef.current,
    previousValueAnimatingRef.current,
    isValueValid ? value! : 0,
  ].map<number[]>((number: BigDecimal): number[] => [...`${number}`].map<number>(Number));

  const digitsLengthReducer = (accumulator: number[], currentValue: number, index: number): number[] => [
    ...accumulator,
    currentValue,
    ...(index ? [currentValue - accumulator[accumulator.length - 1]] : []),
  ];

  const [minNumberOfDigits, maxNumberOfDigits, numberOfDigitsDifference] = [previousValueDigits, currentValueDigits]
    .map<number>(({ length }: number[]): number => length)
    .sort((first: number, second: number): number => first - second)
    .reduce<number[]>(digitsLengthReducer, []);

  const [previousValue, currentValue] = [previousValueDigits, currentValueDigits].map<bigint>(
    (number: number[]): bigint => BigInt(number.join('')),
  );

  const startAnimation = (): void =>
    setAnimationTypePlaying(
      currentValueDigits.length > previousValueDigits.length ? AnimationType.HORIZONTAL : AnimationType.VERTICAL,
    );

  const stopAnimation = (): void => {
    previousValueRef.current = isValueValid ? value! : 0;
    setAnimationTypePlaying(undefined);
  };

  const onAnimationEnd = (
    { length: shorterLength }: number[],
    { length: longerLength }: number[],
    newAnimationType: AnimationType,
  ): void => {
    if (shorterLength < longerLength) {
      setAnimationTypePlaying(newAnimationType);
    } else {
      stopAnimation();
    }
  };

  const onHorizontalAnimationEnd = (): void =>
    onAnimationEnd(previousValueDigits, currentValueDigits, AnimationType.VERTICAL);

  const onVerticalAnimationEnd = (): void =>
    onAnimationEnd(currentValueDigits, previousValueDigits, AnimationType.HORIZONTAL);

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
  }, [value]);

  useEffect((): void => {
    if (restartAnimation) {
      startAnimation();
      setRestartAnimation(false);
    }
  }, [restartAnimation]);

  useEffect((): void => {
    if (componentRef.current && canvasContextRef.current) {
      canvasContextRef.current.font =
        [...componentRef.current.classList]
          .map<string>((className: string): string => window.getComputedStyle(componentRef.current!, className).font)
          .find((font: string): string => font) ?? '';
    }
  }, [componentRef.current, canvasContextRef.current]);

  const getSeparatorWidth = (): number =>
    [digitGroupSeparator, '0']
      .map<number>((text: string): number => canvasContextRef.current!.measureText(text).width)
      .reduce((accumulator: number, currentValue: number): number => accumulator / currentValue);

  const getHorizontalAnimationWidth = (numberOfDigits: number): number =>
    numberOfDigits + getSeparatorWidth() * Math.floor((numberOfDigits - 1) / 3);

  const algorithmValuesArrayReducer = (
    accumulator: AlgorithmValues[][],
    _: undefined,
    index: number,
  ): AlgorithmValues[][] => {
    const [start, end] = [previousValue, currentValue]
      .map<bigint>((number: bigint): bigint => number / 10n ** BigInt(maxNumberOfDigits - index - 1))
      .sort((first: bigint, second: bigint): number => (first < second ? -1 : first > second ? 1 : 0));
    const accumulatorIndex: number = end - start < LinearAlgorithm.MAX_LENGTH ? 0 : 1;
    accumulator[accumulatorIndex] = [...accumulator[accumulatorIndex], { start, end }];
    return accumulator;
  };

  const linearAlgorithmMapper = ({ start, end }: AlgorithmValues): number[] =>
    [...Array(Number(end - start) + 1)].map<number>((_: undefined, index: number): number =>
      Number((start + BigInt(index)) % 10n),
    );

  const nonLinearAlgorithmMapper = (values: AlgorithmValues, algorithmIndex: number): number[] => {
    const { start, end } = values;
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
        increasedValue - newValue * NumberPrecision.VALUE <= NumberPrecision.HALF_VALUE ? newValue : newValue + 1n,
      )
      .map<number>((roundedValue: bigint): number => Number(roundedValue % 10n));
    return numbers[numbers.length - 1] === Number(end % 10n) ? numbers : [...numbers, Number(end % 10n)];
  };

  const algorithmMapper = (algorithmValuesArray: AlgorithmValues[], index: number): number[][] =>
    algorithmValuesArray.map<number[]>(index ? nonLinearAlgorithmMapper : linearAlgorithmMapper);

  const getHorizontalAnimationDigits = (): number[] => [
    ...Array(numberOfDigitsDifference).fill(0),
    ...(currentValue > previousValue ? previousValueDigits : currentValueDigits),
  ];

  const getVerticalAnimationDigitsArray = (): number[][] =>
    [...Array(maxNumberOfDigits)]
      .reduce<AlgorithmValues[][]>(algorithmValuesArrayReducer, [[], []])
      .map<number[][]>(algorithmMapper)
      .flat<number[][][]>();

  const getNumericValueDigits = (): number[] =>
    animationTypePlaying ? previousValueAnimatingDigits : previousValueDigits;

  const digitsMapperFactory = (Component: FC<KeyProps> | string, digit: ReactNode, index: number): JSX.Element => (
    <Component key={String(index + 1).padStart(2, '0')}>{digit}</Component>
  );

  const digitsMapper = (digit: ReactNode, index: number): JSX.Element => digitsMapperFactory(Digit, digit, index);

  const digitsVerticalAnimationMapper = (digit: number, index: number): JSX.Element =>
    digitsMapperFactory('div', digit, index);

  const digitsVerticalAnimationArrayMapper = (digits: number[], index: number): JSX.Element =>
    digitsMapper(
      <VerticalAnimation
        $animationDirection={
          currentValue > previousValue ? VerticalAnimationDirection.UP : VerticalAnimationDirection.DOWN
        }
        $animationDuration={verticalAnimationDuration}
        $animationNumberOfDigits={digits.length}
        onAnimationEnd={onVerticalAnimationEnd}
      >
        {digits.map(digitsVerticalAnimationMapper)}
      </VerticalAnimation>,
      index,
    );

  const digitsReducer = (
    accumulator: JSX.Element,
    currentValue: JSX.Element,
    index: number,
    { length }: JSX.Element[],
  ): JSX.Element => (
    <>
      {accumulator}
      {digitGroupSeparator !== DigitGroupSeparator.NONE && !((length - index) % 3) && (
        <Character>{digitGroupSeparator}</Character>
      )}
      {currentValue}
    </>
  );

  const getHorizontalAnimation = (): JSX.Element => (
    <span>{getHorizontalAnimationDigits().map<JSX.Element>(digitsMapper).reduce(digitsReducer)}</span>
  );

  const getVerticalAnimation = (): JSX.Element =>
    getVerticalAnimationDigitsArray().map<JSX.Element>(digitsVerticalAnimationArrayMapper).reduce(digitsReducer);

  const getAnimation: () => JSX.Element =
    animationTypePlaying === AnimationType.HORIZONTAL ? getHorizontalAnimation : getVerticalAnimation;

  const getEmptyValue = (): JSX.Element => <Character>{EmptyCharacter.VALUE}</Character>;

  const getNumericValue = (): JSX.Element =>
    getNumericValueDigits().map<JSX.Element>(digitsMapper).reduce(digitsReducer);

  const getValue: () => JSX.Element = isValueValid ? getNumericValue : getEmptyValue;

  const getContent: () => JSX.Element =
    animationTypePlaying && isValueValid && currentValue !== previousValue ? getAnimation : getValue;

  return (
    <HorizontalAnimation
      ref={componentRef}
      {...(animationTypePlaying === AnimationType.HORIZONTAL && {
        $animationDirection:
          currentValue > previousValue ? HorizontalAnimationDirection.RIGHT : HorizontalAnimationDirection.LEFT,
        $animationDuration: horizontalAnimationDuration,
        $animationStartWidth: getHorizontalAnimationWidth(minNumberOfDigits),
        $animationEndWidth: getHorizontalAnimationWidth(maxNumberOfDigits),
        onAnimationEnd: onHorizontalAnimationEnd,
      })}
    >
      {getContent()}
    </HorizontalAnimation>
  );
};

export default NumbersTransition;
