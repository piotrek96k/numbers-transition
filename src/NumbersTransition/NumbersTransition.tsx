import { FC, MutableRefObject, ReactNode, RefObject, useEffect, useRef, useState } from 'react';
import { HorizontalAnimation, VerticalAnimation, Character, Digit } from './NumbersTransition.styled';
import {
  AnimationType,
  HorizontalAnimationDirection,
  VerticalAnimationDirection,
  DigitGroupSeparator,
  LinearAlgorithm,
  EmptyCharacter,
} from './NumbersTransition.enum';

interface AlgorithmValues {
  start: number;
  end: number;
}

interface KeyProps {
  key: string;
  children: ReactNode;
}

interface NumbersTransitionProps {
  value?: number;
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
  const previousValueRef: MutableRefObject<number> = useRef<number>(0);
  const previousValueAnimatingRef: MutableRefObject<number> = useRef<number>(0);
  const componentRef: RefObject<HTMLSpanElement> = useRef<HTMLSpanElement>(null);
  const canvasContextRef: RefObject<CanvasRenderingContext2D> = useRef<CanvasRenderingContext2D>(
    document.createElement('canvas').getContext('2d'),
  );

  const previousValue: number = previousValueRef.current;
  const previousValueAnimating: number = previousValueAnimatingRef.current;

  const [previousValueDigits, previousValueAnimatingDigits, currentValueDigits] = [
    previousValue,
    previousValueAnimating,
    value ?? 0,
  ].map((number: number): number[] => [...String(number)].map(Number));

  const numberOfDigits: number = Math.max(previousValueDigits.length, currentValueDigits.length);
  const nonZeroNumberOfDigits: number = Math.min(previousValueDigits.length, currentValueDigits.length);
  const numberOfDigitsDifference: number = Math.abs(previousValueDigits.length - currentValueDigits.length);
  const isValueInvalid: boolean = value === undefined || value < 0;

  const startAnimation = () =>
    setAnimationTypePlaying(
      currentValueDigits.length > previousValueDigits.length ? AnimationType.HORIZONTAL : AnimationType.VERTICAL,
    );

  const stopAnimation = () => {
    previousValueRef.current = isValueInvalid ? 0 : value!;
    setAnimationTypePlaying(undefined);
  };

  useEffect(() => {
    if (isValueInvalid) {
      stopAnimation();
      return;
    }
    if (animationTypePlaying) {
      previousValueRef.current = previousValueAnimatingRef.current;
      setAnimationTypePlaying(undefined);
      setRestartAnimation(true);
    } else {
      startAnimation();
    }
    previousValueAnimatingRef.current = value!;
  }, [value]);

  useEffect(() => {
    if (restartAnimation) {
      startAnimation();
      setRestartAnimation(false);
    }
  }, [restartAnimation]);

  const onAnimationEnd = (
    { length: shorterLength }: number[],
    { length: longerLength }: number[],
    newAnimationType: AnimationType,
  ) => {
    if (shorterLength < longerLength) {
      setAnimationTypePlaying(newAnimationType);
    } else {
      stopAnimation();
    }
  };

  const onHorizontalAnimationEnd = () =>
    onAnimationEnd(previousValueDigits, currentValueDigits, AnimationType.VERTICAL);

  const OnVerticalAnimationEnd = () =>
    onAnimationEnd(currentValueDigits, previousValueDigits, AnimationType.HORIZONTAL);

  useEffect(() => {
    if (componentRef.current && canvasContextRef.current) {
      canvasContextRef.current.font =
        [...componentRef.current.classList]
          .map((className: string): string => window.getComputedStyle(componentRef.current!, className).font)
          .find((font: string): string => font) ?? '';
    }
  }, [componentRef.current, canvasContextRef.current]);

  const getSeparatorWidth = (): number =>
    [digitGroupSeparator, '0']
      .map((text: string): number => canvasContextRef.current!.measureText(text).width)
      .reduce((accumulator: number, currentValue: number): number => accumulator / currentValue);

  const getHorizontalAnimationWidth = (numberOfDigits: number): number =>
    numberOfDigits + getSeparatorWidth() * Math.floor((numberOfDigits - 1) / 3);

  const algorithmValuesArrayReducer = (
    accumulator: AlgorithmValues[][],
    _: undefined,
    index: number,
  ): AlgorithmValues[][] => {
    const [start, end] = [previousValue, value!]
      .map((number: number): number => Math.floor(number / 10 ** (numberOfDigits - index - 1)))
      .sort((first: number, second: number): number => first - second);
    const accumulatorIndex: number = end - start < LinearAlgorithm.MAX_LENGTH ? 0 : 1;
    accumulator[accumulatorIndex] = [...accumulator[accumulatorIndex], { start, end }];
    return accumulator;
  };

  const linearAlgorithmMapper = ({ start, end }: AlgorithmValues): number[] =>
    [...Array(end - start + 1)].map((_: undefined, index: number): number => (start + index) % 10);

  const nonLinearAlgorithmMapper = (values: AlgorithmValues, algorithmIndex: number): number[] => {
    const { start, end } = values;
    const increment: number = (end - start) / (LinearAlgorithm.MAX_LENGTH * (1 + 0.5 * algorithmIndex));
    const numbers: number[] = [...Array(Math.round((end - start) / increment))].map(
      (_: undefined, index: number): number => Math.round(start + index * increment) % 10,
    );
    return numbers[numbers.length - 1] === end % 10 ? numbers : [...numbers, end % 10];
  };

  const algorithmMapper = (algorithmValuesArray: AlgorithmValues[], index: number): number[][] =>
    algorithmValuesArray.map(index ? nonLinearAlgorithmMapper : linearAlgorithmMapper);

  const getHorizontalAnimationDigits = (): number[] => [
    ...Array(numberOfDigitsDifference).fill(0),
    ...(value! > previousValue ? previousValueDigits : currentValueDigits),
  ];

  const getVerticalAnimationDigitsArray = (): number[][] =>
    [...Array(numberOfDigits)]
      .reduce<AlgorithmValues[][]>(algorithmValuesArrayReducer, [[], []])
      .map(algorithmMapper)
      .flat();

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
        $animationDirection={value! > previousValue ? VerticalAnimationDirection.UP : VerticalAnimationDirection.DOWN}
        $animationDuration={verticalAnimationDuration}
        $animationNumberOfDigits={digits.length}
        onAnimationEnd={OnVerticalAnimationEnd}
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
    <span>{getHorizontalAnimationDigits().map(digitsMapper).reduce(digitsReducer)}</span>
  );

  const getVerticalAnimation = (): JSX.Element =>
    getVerticalAnimationDigitsArray().map(digitsVerticalAnimationArrayMapper).reduce(digitsReducer);

  const getAnimation: () => JSX.Element =
    animationTypePlaying === AnimationType.HORIZONTAL ? getHorizontalAnimation : getVerticalAnimation;

  const getEmptyValue = (): JSX.Element => <Character>{EmptyCharacter.VALUE}</Character>;

  const getNumericValue = (): JSX.Element => getNumericValueDigits().map(digitsMapper).reduce(digitsReducer);

  const getValue: () => JSX.Element = isValueInvalid ? getEmptyValue : getNumericValue;

  const getContent: () => JSX.Element =
    animationTypePlaying && !isValueInvalid && value !== previousValue ? getAnimation : getValue;

  return (
    <HorizontalAnimation
      ref={componentRef}
      {...(animationTypePlaying === AnimationType.HORIZONTAL && {
        $animationDirection:
          value! > previousValue ? HorizontalAnimationDirection.RIGHT : HorizontalAnimationDirection.LEFT,
        $animationDuration: horizontalAnimationDuration,
        $animationStartWidth: getHorizontalAnimationWidth(nonZeroNumberOfDigits),
        $animationEndWidth: getHorizontalAnimationWidth(numberOfDigits),
        onAnimationEnd: onHorizontalAnimationEnd,
      })}
    >
      {getContent()}
    </HorizontalAnimation>
  );
};

export default NumbersTransition;
