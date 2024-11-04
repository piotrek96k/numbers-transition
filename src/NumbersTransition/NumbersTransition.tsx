import { FC, MutableRefObject, ReactNode, RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Container, HorizontalAnimation, VerticalAnimation, Character, Digit } from './NumbersTransition.styled';
import {
  NumberOfAnimations,
  AnimationTransition,
  HorizontalAnimationDirection,
  VerticalAnimationDirection,
  DecimalSeparator,
  DigitGroupSeparator,
  NegativeCharacter,
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
  precision?: number;
  horizontalAnimationDuration?: number;
  verticalAnimationDuration?: number;
  decimalSeparator?: DecimalSeparator;
  digitGroupSeparator?: DigitGroupSeparator;
  negativeCharacter?: NegativeCharacter;
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
    negativeCharacter = NegativeCharacter.MINUS,
  }: NumbersTransitionProps = props;

  const [animationTransition, setAnimationTransition] = useState<AnimationTransition>(AnimationTransition.NONE);
  const [previousValueOnAnimationEnd, setPreviousValueOnAnimationEnd] = useState<BigDecimal>(0);

  const previousValueOnAnimationStartRef: MutableRefObject<BigDecimal> = useRef<BigDecimal>(0);
  const containerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
  const canvasContextRef: RefObject<CanvasRenderingContext2D> = useRef<CanvasRenderingContext2D>(
    document.createElement('canvas').getContext('2d'),
  );

  const isValueValid: boolean = !!`${value}`.match(/^-?(([1-9]\d*)|0)(\.\d+)?$/);

  const sum = (first: number, second: number): number => first + second;
  const subtract = (first: number, second: number): number => first - second;
  const divide = (first: number, second: number): number => first / second;

  const floatingPointFill = (accumulator: string[], currentValue: string, _: number, { length }: string[]) => [
    ...accumulator,
    currentValue,
    ...(length === 1 ? [''] : []),
  ];

  const floatingPointReducer = (integer: string, fraction: string): string => {
    const [start, mid, end, numberOfZeros]: [string, string, string, number] =
      precision > 0
        ? [integer.replace('-', ''), fraction, '', Math.max(precision - fraction.length, 0)]
        : ['', integer.replace('-', ''), fraction, -precision];
    const digits: string = `${start}${mid.slice(0, precision || mid.length) ?? 0}`;
    const restDigits: string = `${mid.slice(precision || mid.length)}${end}`;
    const increase: bigint = BigInt(restDigits) < BigInt('5'.padEnd(restDigits.length, '0')) ? 0n : 1n;
    return `${integer.replace(/\d+/, '')}${(BigInt(digits) + increase) * 10n ** BigInt(numberOfZeros)}`;
  };

  const [previousValueOnAnimationEndCharacters, previousValueOnAnimationStartCharacters, valueCharacters]: string[][] =
    [previousValueOnAnimationEnd, previousValueOnAnimationStartRef.current, isValueValid ? value! : 0].map<string[]>(
      (number: BigDecimal): string[] => [
        ...`${number}`.split('.').reduce<string[]>(floatingPointFill, []).reduce(floatingPointReducer),
      ],
    );

  const [previousValueOnAnimationEndDigits, valueDigits]: number[][] = [
    previousValueOnAnimationEndCharacters,
    valueCharacters,
  ].map<number[]>((characters: string[]): number[] =>
    characters.filter((character: string): boolean => !!character.match(/^\d{1}$/)).map<number>(Number),
  );

  const digitsLengthReducer = (accumulator: number[], currentValue: number, index: number): number[] => [
    ...accumulator,
    currentValue,
    ...(index ? [currentValue - accumulator[accumulator.length - 1]] : []),
  ];

  const [minNumberOfDigits, maxNumberOfDigits, numberOfDigitsDifference]: number[] = [
    previousValueOnAnimationEndDigits,
    valueDigits,
  ]
    .map<number>(({ length }: number[]): number => length)
    .sort(subtract)
    .reduce<number[]>(digitsLengthReducer, []);

  const [previousValueOnAnimationEndBigInt, previousValueOnAnimationStartBigInt, valueBigInt]: bigint[] = [
    previousValueOnAnimationEndCharacters,
    previousValueOnAnimationStartCharacters,
    valueCharacters,
  ].map<bigint>((digits: string[]): bigint => BigInt(digits.join('')));

  const isNewValue: boolean = valueBigInt !== previousValueOnAnimationEndBigInt;
  const restartAnimation: boolean = [valueBigInt, previousValueOnAnimationEndBigInt].every(
    (val: bigint): boolean => val !== previousValueOnAnimationStartBigInt,
  );

  const isSignChange: boolean = (valueBigInt ^ previousValueOnAnimationEndBigInt) < 0;
  const isTheSameNumberOfDigits: boolean = previousValueOnAnimationEndDigits.length === valueDigits.length;

  const isAtLeastTwoAnimations: boolean =
    (previousValueOnAnimationEndDigits.length < valueDigits.length &&
      previousValueOnAnimationEndBigInt < valueBigInt) ||
    (previousValueOnAnimationEndDigits.length > valueDigits.length && previousValueOnAnimationEndBigInt > valueBigInt);

  const numberOfAnimations: NumberOfAnimations = isSignChange
    ? isAtLeastTwoAnimations
      ? NumberOfAnimations.THREE
      : NumberOfAnimations.TWO
    : isTheSameNumberOfDigits
      ? NumberOfAnimations.ONE
      : NumberOfAnimations.TWO;

  const getHorizontalAnimationDirection = (): HorizontalAnimationDirection =>
    (numberOfAnimations === NumberOfAnimations.TWO &&
      (isSignChange
        ? previousValueOnAnimationEndBigInt > valueBigInt
        : previousValueOnAnimationEndDigits.length < valueDigits.length)) ||
    (numberOfAnimations === NumberOfAnimations.THREE && animationTransition === AnimationTransition.NONE)
      ? HorizontalAnimationDirection.RIGHT
      : HorizontalAnimationDirection.LEFT;

  const getVerticalAnimationDirection = (): VerticalAnimationDirection =>
    previousValueOnAnimationEndBigInt < valueBigInt ? VerticalAnimationDirection.UP : VerticalAnimationDirection.DOWN;

  const isHorizontalAnimation = (): boolean =>
    (numberOfAnimations === NumberOfAnimations.TWO &&
      (isSignChange
        ? animationTransition === AnimationTransition.NONE
          ? previousValueOnAnimationEndBigInt > valueBigInt
          : previousValueOnAnimationEndBigInt < valueBigInt
        : animationTransition === AnimationTransition.NONE
          ? previousValueOnAnimationEndDigits.length < valueDigits.length
          : previousValueOnAnimationEndDigits.length > valueDigits.length)) ||
    (numberOfAnimations === NumberOfAnimations.THREE && animationTransition !== AnimationTransition.FIRST_TO_SECOND);

  const isHorizontalAnimationInGivenTransition = (transition: AnimationTransition): boolean =>
    numberOfAnimations === NumberOfAnimations.THREE &&
    previousValueOnAnimationEndBigInt < valueBigInt === (animationTransition === transition);

  const hasHorizontalAnimationEmptyNegativeCharacter = (): boolean =>
    isSignChange &&
    (numberOfAnimations === NumberOfAnimations.TWO ||
      isHorizontalAnimationInGivenTransition(AnimationTransition.SECOND_TO_THIRD));

  const hasHorizontalAnimationZeros = (): boolean =>
    numberOfAnimations === NumberOfAnimations.TWO || isHorizontalAnimationInGivenTransition(AnimationTransition.NONE);

  useEffect((): void => {
    if (restartAnimation) {
      setPreviousValueOnAnimationEnd(previousValueOnAnimationStartRef.current);
      setAnimationTransition(AnimationTransition.NONE);
    }
    previousValueOnAnimationStartRef.current = isValueValid ? value! : 0;
  }, [value, isValueValid, restartAnimation]);

  useLayoutEffect((): void => {
    if (containerRef.current && canvasContextRef.current) {
      canvasContextRef.current.font =
        [...containerRef.current.classList]
          .map<string>((className: string): string => window.getComputedStyle(containerRef.current!, className).font)
          .find((font: string): string => font) ?? '';
    }
  }, []);

  const updatePreviousValueOnAnimationEnd = (): void => setPreviousValueOnAnimationEnd(value!);

  const onAnimationEnd = (): void => {
    if (numberOfAnimations === NumberOfAnimations.ONE) {
      updatePreviousValueOnAnimationEnd();
      return;
    }
    if (
      numberOfAnimations === NumberOfAnimations.THREE &&
      animationTransition === AnimationTransition.FIRST_TO_SECOND
    ) {
      setAnimationTransition(AnimationTransition.SECOND_TO_THIRD);
      return;
    }
    if (animationTransition !== AnimationTransition.NONE) {
      updatePreviousValueOnAnimationEnd();
      setAnimationTransition(AnimationTransition.NONE);
      return;
    }
    setAnimationTransition(AnimationTransition.FIRST_TO_SECOND);
  };

  const getCharacterWidth = (character: DecimalSeparator | DigitGroupSeparator | NegativeCharacter): number =>
    [character, '0']
      .map<number>((text: string): number => canvasContextRef.current!.measureText(text).width)
      .reduce(divide);

  const getDigitsSeparatorsWidth = (numberOfDigits: number): number =>
    getCharacterWidth(digitGroupSeparator) *
    [numberOfDigits - Math.max(precision, 0), Math.max(precision, 0)]
      .map<number>((quantity: number): number => Math.trunc((quantity - 1) / 3))
      .reduce(sum);

  const getHorizontalAnimationWidth = (numberOfDigits: number, hasNegativeCharacter: boolean): number =>
    [
      hasNegativeCharacter ? getCharacterWidth(negativeCharacter) : 0,
      numberOfDigits,
      getDigitsSeparatorsWidth(numberOfDigits),
      precision > 0 ? getCharacterWidth(decimalSeparator) : 0,
    ].reduce(sum);

  const getHorizontalAnimationStartWidth = (): number =>
    getHorizontalAnimationWidth(hasHorizontalAnimationZeros() ? minNumberOfDigits : maxNumberOfDigits, false);

  const getHorizontalAnimationEndWidth = (): number =>
    getHorizontalAnimationWidth(maxNumberOfDigits, hasHorizontalAnimationEmptyNegativeCharacter());

  const algorithmValuesArrayReducer = (
    accumulator: AlgorithmValues[][],
    _: undefined,
    index: number,
  ): AlgorithmValues[][] => {
    const [start, end]: bigint[] = [previousValueOnAnimationEndBigInt, valueBigInt]
      .map<bigint>((number: bigint): bigint => number / 10n ** BigInt(maxNumberOfDigits - index - 1))
      .sort((first: bigint, second: bigint): number => (first < second ? -1 : first > second ? 1 : 0));
    const accumulatorIndex: number = end - start < LinearAlgorithm.MAX_LENGTH ? 0 : 1;
    accumulator[accumulatorIndex] = [...accumulator[accumulatorIndex], { start, end }];
    return accumulator;
  };

  const digitMapper = (number: bigint): number => Math.abs(Number(number % 10n));

  const linearAlgorithmMapper = ({ start, end }: AlgorithmValues): number[] =>
    [...Array(Number(end - start) + 1)].map<number>((_: undefined, index: number): number =>
      digitMapper(start + BigInt(index)),
    );

  const nonLinearAlgorithmMapper = (values: AlgorithmValues, algorithmIndex: number): number[] => {
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
      .map<number>(digitMapper);
    return numbers[numbers.length - 1] === digitMapper(end) ? numbers : [...numbers, digitMapper(end)];
  };

  const algorithmMapper = (algorithmValuesArray: AlgorithmValues[], index: number): number[][] =>
    algorithmValuesArray.map<number[]>(index ? nonLinearAlgorithmMapper : linearAlgorithmMapper);

  const getHorizontalAnimationCharacters = (): number[] => [
    ...(hasHorizontalAnimationZeros() ? Array(numberOfDigitsDifference).fill(0) : []),
    ...(getHorizontalAnimationDirection() === HorizontalAnimationDirection.RIGHT
      ? previousValueOnAnimationEndDigits
      : valueDigits),
  ];

  const getVerticalAnimationDigitsArray = (): number[][] =>
    [...Array(maxNumberOfDigits)]
      .reduce<AlgorithmValues[][]>(algorithmValuesArrayReducer, [[], []])
      .map<number[][]>(algorithmMapper)
      .flat<number[][][], 1>();

  const digitsMapperFactory = (Component: FC<KeyProps> | string, children: ReactNode, index: number): JSX.Element => (
    <Component key={`${index + 1}`.padStart(2, '0')}>{children}</Component>
  );

  const digitsMapper = (digit: ReactNode, index: number): JSX.Element => digitsMapperFactory(Digit, digit, index);

  const digitsVerticalAnimationMapper = (digit: number, index: number): JSX.Element =>
    digitsMapperFactory('div', digit, index);

  const digitsVerticalAnimationArrayMapper = (digits: number[], index: number): JSX.Element =>
    digitsMapper(
      <VerticalAnimation
        $animationDirection={getVerticalAnimationDirection()}
        $animationDuration={verticalAnimationDuration}
      >
        {digits.map<JSX.Element>(digitsVerticalAnimationMapper)}
      </VerticalAnimation>,
      index,
    );

  const getSeparatorElement = (index: number, length: number): ReactNode =>
    !((length - index - Math.max(precision, 0)) % 3) && (
      <Character>{length - index === precision ? decimalSeparator : digitGroupSeparator}</Character>
    );

  const digitsReducer = (
    accumulator: JSX.Element,
    currentValue: JSX.Element,
    index: number,
    { length }: JSX.Element[],
  ): JSX.Element => (
    <>
      {accumulator}
      {getSeparatorElement(index, length)}
      {currentValue}
    </>
  );

  const getNegativeElement = (): ReactNode =>
    //TODO, delete it, it will be handled by Vertical animation
    (((isSignChange || valueBigInt < 0) && !isHorizontalAnimation()) ||
      //TODO end
      (!isSignChange && valueBigInt < 0) ||
      isHorizontalAnimationInGivenTransition(AnimationTransition.NONE)) && <Character>{negativeCharacter}</Character>;

  const getHorizontalAnimation = (): JSX.Element => (
    <HorizontalAnimation
      $animationDirection={getHorizontalAnimationDirection()}
      $animationDuration={horizontalAnimationDuration}
      $animationStartWidth={getHorizontalAnimationStartWidth()}
      $animationEndWidth={getHorizontalAnimationEndWidth()}
    >
      <div>{getHorizontalAnimationCharacters().map<JSX.Element>(digitsMapper).reduce(digitsReducer)}</div>
    </HorizontalAnimation>
  );

  const getVerticalAnimation = (): JSX.Element =>
    getVerticalAnimationDigitsArray().map<JSX.Element>(digitsVerticalAnimationArrayMapper).reduce(digitsReducer);

  const getAnimation: () => JSX.Element = isHorizontalAnimation() ? getHorizontalAnimation : getVerticalAnimation;

  const getEmptyValue = (): JSX.Element => <Character>{EmptyCharacter.VALUE}</Character>;

  const getNumericValue = (): JSX.Element =>
    previousValueOnAnimationEndDigits.map<JSX.Element>(digitsMapper).reduce(digitsReducer);

  const getValue: () => JSX.Element = isValueValid ? getNumericValue : getEmptyValue;

  const getContent: () => JSX.Element = isValueValid && isNewValue && !restartAnimation ? getAnimation : getValue;

  return (
    <Container ref={containerRef} onAnimationEnd={onAnimationEnd}>
      {getNegativeElement()}
      {getContent()}
    </Container>
  );
};

export default NumbersTransition;
