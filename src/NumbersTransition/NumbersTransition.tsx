import { FC, MutableRefObject, ReactNode, RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Container, HorizontalAnimation, VerticalAnimation, Character, Digit } from './NumbersTransition.styled';
import {
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
  precision?: number;
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

  const [runNextAnimation, setRunNextAnimation] = useState<boolean>(false);
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
    characters.filter((character: string): boolean => !!character.match(/\d/)).map<number>(Number),
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

  useEffect((): void => {
    if (restartAnimation) {
      setPreviousValueOnAnimationEnd(previousValueOnAnimationStartRef.current);
      setRunNextAnimation(false);
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

  const onAnimationEnd = (): void => {
    if (previousValueOnAnimationEndDigits.length === valueDigits.length) {
      setPreviousValueOnAnimationEnd(value!);
      return;
    }
    if (runNextAnimation) {
      setPreviousValueOnAnimationEnd(value!);
    }
    setRunNextAnimation(!runNextAnimation);
  };

  const getSeparatorWidth = (separator: DecimalSeparator | DigitGroupSeparator): number =>
    [separator, '0']
      .map<number>((text: string): number => canvasContextRef.current!.measureText(text).width)
      .reduce(divide);

  const getDigitsSeparatorsWidth = (numberOfDigits: number): number =>
    getSeparatorWidth(digitGroupSeparator) *
    [numberOfDigits - Math.max(precision, 0), Math.max(precision, 0)]
      .map((quantity: number): number => Math.trunc((quantity - 1) / 3))
      .reduce(sum);

  const getHorizontalAnimationWidth = (numberOfDigits: number): number =>
    [
      numberOfDigits,
      getDigitsSeparatorsWidth(numberOfDigits),
      precision > 0 ? getSeparatorWidth(decimalSeparator) : 0,
    ].reduce(sum);

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

  const getHorizontalAnimationDigits = (): number[] => [
    ...Array(numberOfDigitsDifference).fill(0),
    ...(valueBigInt > previousValueOnAnimationEndBigInt ? previousValueOnAnimationEndDigits : valueDigits),
  ];

  const getVerticalAnimationDigitsArray = (): number[][] =>
    [...Array(maxNumberOfDigits)]
      .reduce<AlgorithmValues[][]>(algorithmValuesArrayReducer, [[], []])
      .map<number[][]>(algorithmMapper)
      .flat<number[][][], 1>();

  const digitsMapperFactory = (Component: FC<KeyProps> | string, digit: ReactNode, index: number): JSX.Element => (
    <Component key={`${index + 1}`.padStart(2, '0')}>{digit}</Component>
  );

  const digitsMapper = (digit: ReactNode, index: number): JSX.Element => digitsMapperFactory(Digit, digit, index);

  const digitsVerticalAnimationMapper = (digit: number, index: number): JSX.Element =>
    digitsMapperFactory('div', digit, index);

  const digitsVerticalAnimationArrayMapper = (digits: number[], index: number): JSX.Element =>
    digitsMapper(
      <VerticalAnimation
        $animationDirection={
          valueBigInt > previousValueOnAnimationEndBigInt
            ? VerticalAnimationDirection.UP
            : VerticalAnimationDirection.DOWN
        }
        $animationDuration={verticalAnimationDuration}
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
      {!((length - index - Math.max(precision, 0)) % 3) && (
        <Character>{length - index === precision ? decimalSeparator : digitGroupSeparator}</Character>
      )}
      {currentValue}
    </>
  );

  const getHorizontalAnimation = (): JSX.Element => (
    <HorizontalAnimation
      $animationDirection={
        valueBigInt > previousValueOnAnimationEndBigInt
          ? HorizontalAnimationDirection.RIGHT
          : HorizontalAnimationDirection.LEFT
      }
      $animationDuration={horizontalAnimationDuration}
      $animationStartWidth={getHorizontalAnimationWidth(minNumberOfDigits)}
      $animationEndWidth={getHorizontalAnimationWidth(maxNumberOfDigits)}
    >
      <div>{getHorizontalAnimationDigits().map<JSX.Element>(digitsMapper).reduce(digitsReducer)}</div>
    </HorizontalAnimation>
  );

  const getVerticalAnimation = (): JSX.Element =>
    getVerticalAnimationDigitsArray().map<JSX.Element>(digitsVerticalAnimationArrayMapper).reduce(digitsReducer);

  const getAnimation: () => JSX.Element =
    valueDigits.length > previousValueOnAnimationEndDigits.length === runNextAnimation
      ? getVerticalAnimation
      : getHorizontalAnimation;

  const getEmptyValue = (): JSX.Element => <Character>{EmptyCharacter.VALUE}</Character>;

  const getNumericValue = (): JSX.Element =>
    previousValueOnAnimationEndDigits.map<JSX.Element>(digitsMapper).reduce(digitsReducer);

  const getValue: () => JSX.Element = isValueValid ? getNumericValue : getEmptyValue;

  const getContent: () => JSX.Element = isValueValid && isNewValue && !restartAnimation ? getAnimation : getValue;

  return (
    <Container ref={containerRef} onAnimationEnd={onAnimationEnd}>
      {getContent()}
    </Container>
  );
};

export default NumbersTransition;
