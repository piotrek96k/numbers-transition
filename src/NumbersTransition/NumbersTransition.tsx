import {
  FC,
  MutableRefObject,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
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

  const [runNextAnimation, setRunNextAnimation] = useState<boolean>(false);
  const [previousValueOnAnimationEnd, setPreviousValueOnAnimationEnd] = useState<BigDecimal>(0);

  const previousValueOnAnimationStartRef: MutableRefObject<BigDecimal> = useRef<BigDecimal>(0);
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

  const digitsLengthReducer = useCallback(
    (accumulator: number[], currentValue: number, index: number): number[] => [
      ...accumulator,
      currentValue,
      ...(index ? [currentValue - accumulator[accumulator.length - 1]] : []),
    ],
    [],
  );

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

  const onAnimationEnd = useCallback((): void => {
    if (previousValueOnAnimationEndDigits.length === valueDigits.length) {
      setPreviousValueOnAnimationEnd(value!);
      return;
    }
    if (runNextAnimation) {
      setPreviousValueOnAnimationEnd(value!);
    }
    setRunNextAnimation(!runNextAnimation);
  }, [value, previousValueOnAnimationEndDigits, valueDigits, runNextAnimation]);

  const getSeparatorWidth = useCallback(
    (separator: DecimalSeparator | DigitGroupSeparator): number =>
      [separator, '0']
        .map<number>((text: string): number => canvasContextRef.current!.measureText(text).width)
        .reduce(divide),
    [divide],
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
      const [start, end]: bigint[] = [previousValueOnAnimationEndBigInt, valueBigInt]
        .map<bigint>((number: bigint): bigint => number / 10n ** BigInt(maxNumberOfDigits - index - 1))
        .sort((first: bigint, second: bigint): number => (first < second ? -1 : first > second ? 1 : 0));
      const accumulatorIndex: number = end - start < LinearAlgorithm.MAX_LENGTH ? 0 : 1;
      accumulator[accumulatorIndex] = [...accumulator[accumulatorIndex], { start, end }];
      return accumulator;
    },
    [previousValueOnAnimationEndBigInt, valueBigInt, maxNumberOfDigits],
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
      ...(valueBigInt > previousValueOnAnimationEndBigInt ? previousValueOnAnimationEndDigits : valueDigits),
    ],
    [
      previousValueOnAnimationEndDigits,
      valueDigits,
      numberOfDigitsDifference,
      previousValueOnAnimationEndBigInt,
      valueBigInt,
    ],
  );

  const getVerticalAnimationDigitsArray = useCallback(
    (): number[][] =>
      [...Array(maxNumberOfDigits)]
        .reduce<AlgorithmValues[][]>(algorithmValuesArrayReducer, [[], []])
        .map<number[][]>(algorithmMapper)
        .flat<number[][][], 1>(),
    [maxNumberOfDigits, algorithmValuesArrayReducer, algorithmMapper],
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
            valueBigInt > previousValueOnAnimationEndBigInt
              ? VerticalAnimationDirection.UP
              : VerticalAnimationDirection.DOWN
          }
          $animationDuration={verticalAnimationDuration}
        >
          {digits.map(digitsVerticalAnimationMapper)}
        </VerticalAnimation>,
        index,
      ),
    [
      verticalAnimationDuration,
      previousValueOnAnimationEndBigInt,
      valueBigInt,
      digitsMapper,
      digitsVerticalAnimationMapper,
    ],
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
    ),
    [
      horizontalAnimationDuration,
      minNumberOfDigits,
      maxNumberOfDigits,
      previousValueOnAnimationEndBigInt,
      valueBigInt,
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

  const getAnimation: () => JSX.Element =
    valueDigits.length > previousValueOnAnimationEndDigits.length === runNextAnimation
      ? getVerticalAnimation
      : getHorizontalAnimation;

  const getEmptyValue = useCallback((): JSX.Element => <Character>{EmptyCharacter.VALUE}</Character>, []);

  const getNumericValue = useCallback(
    (): JSX.Element => previousValueOnAnimationEndDigits.map<JSX.Element>(digitsMapper).reduce(digitsReducer),
    [previousValueOnAnimationEndDigits, digitsMapper, digitsReducer],
  );

  const getValue: () => JSX.Element = isValueValid ? getNumericValue : getEmptyValue;

  const getContent: () => JSX.Element = isValueValid && isNewValue && !restartAnimation ? getAnimation : getValue;

  return (
    <Container ref={containerRef} onAnimationEnd={onAnimationEnd}>
      {getContent()}
    </Container>
  );
};

export default NumbersTransition;
