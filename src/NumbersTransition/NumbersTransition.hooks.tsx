import { FC, Fragment, ReactNode } from 'react';
import {
  AnimationDirection,
  AnimationTimingFunction,
  DecimalSeparator,
  DigitGroupSeparator,
  DigitsGenerator,
  EquationSolver,
  HorizontalAnimationDirection,
  NumberPrecision,
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import { StyledCharacter, StyledDigit, StyledDivision, StyledVisibilityProps } from './NumbersTransition.styles';
import { BigDecimal } from './NumbersTransition.types';

interface UseAnimationCharactersOptions {
  precision: number;
  values: [BigDecimal, BigDecimal, BigDecimal];
}

type AnimationCharactersTuple = [string[], string[], string[]];

type UseAnimationCharacters = (options: UseAnimationCharactersOptions) => AnimationCharactersTuple;

const useAnimationCharacters: UseAnimationCharacters = (
  options: UseAnimationCharactersOptions,
): AnimationCharactersTuple => {
  const { precision, values }: UseAnimationCharactersOptions = options;

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
    return `${integer.replace(/\d+/, '')}${BigInt(start) ? '' : start}${(BigInt(digits) + increase) * 10n ** BigInt(numberOfZeros)}`;
  };

  return values.map<string[]>((number: BigDecimal): string[] => [
    ...`${number}`.split('.').reduce<string[]>(floatingPointFill, []).reduce(floatingPointReducer),
  ]);
};

type UseAnimationDigitsOptions = [string[], string[]];

type AnimationDigitsTuple = [number[], number[]];

type UseAnimationDigits = (options: UseAnimationDigitsOptions) => AnimationDigitsTuple;

const useAnimationDigits: UseAnimationDigits = (options: UseAnimationDigitsOptions): AnimationDigitsTuple =>
  options.map<number[]>((characters: string[]): number[] =>
    characters.filter((character: string): boolean => !!character.match(/^\d{1}$/)).map<number>(Number),
  );

type UseAnimationBigIntsOptions = AnimationCharactersTuple;

type AnimationBigIntsTuple = [bigint, bigint, bigint];

type UseAnimationBigInts = (options: UseAnimationBigIntsOptions) => AnimationBigIntsTuple;

const useAnimationBigInts: UseAnimationBigInts = (options: UseAnimationBigIntsOptions): AnimationBigIntsTuple =>
  options.map<bigint>((digits: string[]): bigint => BigInt(digits.join('')));

type UseAnimationNumbersOfDigitsOptions = AnimationDigitsTuple;

type AnimationNumbersOfDigitsTuple = [number, number, number];

type UseAnimationNumbersOfDigits = (options: UseAnimationNumbersOfDigitsOptions) => AnimationNumbersOfDigitsTuple;

const useAnimationNumberOfDigits: UseAnimationNumbersOfDigits = (
  options: UseAnimationNumbersOfDigitsOptions,
): AnimationNumbersOfDigitsTuple => {
  const subtract = (first: number, second: number): number => first - second;

  const digitsLengthReducer = (accumulator: number[], currentValue: number, index: number): number[] => [
    ...accumulator,
    currentValue,
    ...(index ? [currentValue - accumulator[accumulator.length - 1]] : []),
  ];

  const [minNumberOfDigits, maxNumberOfDigits, numberOfDigitsDifference]: number[] = options
    .map<number>(({ length }: number[]): number => length)
    .sort(subtract)
    .reduce<number[]>(digitsLengthReducer, []);

  return [minNumberOfDigits, maxNumberOfDigits, numberOfDigitsDifference];
};

interface UseAnimationValuesOptions {
  precision: number;
  currentValue: BigDecimal;
  previousValueOnAnimationEnd: BigDecimal;
  previousValueOnAnimationStart: BigDecimal;
}

export type AnimationValuesTuple = [AnimationDigitsTuple, AnimationBigIntsTuple, AnimationNumbersOfDigitsTuple];

type UseAnimationValues = (options: UseAnimationValuesOptions) => AnimationValuesTuple;

export const useAnimationValues: UseAnimationValues = (options: UseAnimationValuesOptions): AnimationValuesTuple => {
  const {
    precision,
    currentValue,
    previousValueOnAnimationEnd,
    previousValueOnAnimationStart,
  }: UseAnimationValuesOptions = options;

  const characters: AnimationCharactersTuple = useAnimationCharacters({
    precision,
    values: [previousValueOnAnimationEnd, previousValueOnAnimationStart, currentValue],
  });

  const digits: AnimationDigitsTuple = useAnimationDigits([characters[0], characters[2]]);
  const bigInts: AnimationBigIntsTuple = useAnimationBigInts(characters);
  const numbersOfDigits: AnimationNumbersOfDigitsTuple = useAnimationNumberOfDigits(digits);

  return [digits, bigInts, numbersOfDigits];
};

interface UseAnimationTimingFunctionOptions {
  animationTimingFunction: AnimationTimingFunction;
  animationDirection: AnimationDirection;
}

type UseAnimationTimingFunction = (options: UseAnimationTimingFunctionOptions) => AnimationTimingFunction;

export const useAnimationTimingFunction: UseAnimationTimingFunction = (
  options: UseAnimationTimingFunctionOptions,
): AnimationTimingFunction => {
  const { animationTimingFunction, animationDirection }: UseAnimationTimingFunctionOptions = options;

  const reverseAnimationTimingFunctionMapper = (
    tuple: AnimationTimingFunction[number],
  ): AnimationTimingFunction[number] => tuple.map<number>((number: number): number => 1 - number);

  const reverseAnimationTimingFunction = (animationTimingFunction: AnimationTimingFunction): AnimationTimingFunction =>
    animationTimingFunction.map<AnimationTimingFunction[number]>(reverseAnimationTimingFunctionMapper).reverse();

  return animationDirection === HorizontalAnimationDirection.RIGHT ||
    animationDirection === VerticalAnimationDirection.UP
    ? animationTimingFunction
    : reverseAnimationTimingFunction(animationTimingFunction);
};

type CubicBezier = (points: number[]) => (time: number) => number;

type Solve = (func: (inputValue: number) => number, previousValue?: number, previousFuncResult?: number) => number;

export type CubicBezierTuple = [CubicBezier, Solve];

type UseCubicBezier = () => CubicBezierTuple;

export const useCubicBezier: UseCubicBezier = (): CubicBezierTuple => {
  const derivative = (func: (val: number) => number, val: number) =>
    (func(val + EquationSolver.DERIVATIVE_DELTA) - func(val - EquationSolver.DERIVATIVE_DELTA)) /
    (2 * EquationSolver.DERIVATIVE_DELTA);

  const solve = (
    func: (inputValue: number) => number,
    previousValue: number = EquationSolver.INITIAL_VALUE,
    previousFuncResult: number = func(previousValue),
  ): number => {
    const newValue: number = previousValue - previousFuncResult / derivative(func, previousValue);
    const newFuncResult: number = func(newValue);
    return Math.abs(newValue - previousValue) < EquationSolver.DERIVATIVE_DELTA &&
      newFuncResult < EquationSolver.DERIVATIVE_DELTA
      ? newValue
      : solve(func, newValue, newFuncResult);
  };

  const cubicBezier =
    ([firstPoint, secondPoint]: number[]): ((time: number) => number) =>
    (time: number): number =>
      3 * (firstPoint * time * (1 - time) ** 2 + secondPoint * (1 - time) * time ** 2) + time ** 3;

  return [cubicBezier, solve];
};

interface UseHorizontalAnimationDigitsOptions {
  previousValueDigits: number[];
  currentValueDigits: number[];
  numberOfDigitsDifference: number;
  animationDirection: HorizontalAnimationDirection;
  hasZeros: boolean;
}

type UseHorizontalAnimationDigits = (options: UseHorizontalAnimationDigitsOptions) => number[];

export const useHorizontalAnimationDigits: UseHorizontalAnimationDigits = (
  options: UseHorizontalAnimationDigitsOptions,
): number[] => {
  const {
    numberOfDigitsDifference,
    previousValueDigits,
    currentValueDigits,
    animationDirection,
    hasZeros,
  }: UseHorizontalAnimationDigitsOptions = options;

  return [
    ...(hasZeros ? Array(numberOfDigitsDifference).fill(0) : []),
    ...(animationDirection === HorizontalAnimationDirection.RIGHT ? previousValueDigits : currentValueDigits),
  ];
};

interface DigitsGeneratorValues {
  start: bigint;
  end: bigint;
}

interface UseVerticalAnimationDigitsOptions {
  maxNumberOfDigits: number;
  previousValue: bigint;
  currentValue: bigint;
}

type UseVerticalAnimationDigits = (options: UseVerticalAnimationDigitsOptions) => number[][];

export const useVerticalAnimationDigits: UseVerticalAnimationDigits = (
  options: UseVerticalAnimationDigitsOptions,
): number[][] => {
  const { maxNumberOfDigits, previousValue, currentValue }: UseVerticalAnimationDigitsOptions = options;

  const digitsGeneratorValuesArrayReducer = (
    accumulator: DigitsGeneratorValues[][],
    _: undefined,
    index: number,
  ): DigitsGeneratorValues[][] => {
    const [start, end]: bigint[] = [previousValue, currentValue]
      .map<bigint>((number: bigint): bigint => number / 10n ** BigInt(maxNumberOfDigits - index - 1))
      .sort((first: bigint, second: bigint): number => (first < second ? -1 : first > second ? 1 : 0));
    const accumulatorIndex: number = end - start < DigitsGenerator.SWITCH_VALUE ? 0 : 1;
    accumulator[accumulatorIndex] = [...accumulator[accumulatorIndex], { start, end }];
    return accumulator;
  };

  const digitMapper = (number: bigint): number => Math.abs(Number(number % 10n));

  const linearDigitsGeneratorMapper = ({ start, end }: DigitsGeneratorValues): number[] =>
    [...Array(Number(end - start) + 1)].map<number>((_: undefined, index: number): number =>
      digitMapper(start + BigInt(index)),
    );

  const nonLinearDigitsGeneratorMapper = (values: DigitsGeneratorValues, algorithmIndex: number): number[] => {
    const { start, end }: DigitsGeneratorValues = values;
    const numbers: number[] = [
      ...Array(
        DigitsGenerator.SWITCH_VALUE *
          (DigitsGenerator.INITIAL_VALUE + DigitsGenerator.MULTIPLY_VALUE * algorithmIndex),
      ),
    ]
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

  const digitsGeneratorMapper = (algorithmValuesArray: DigitsGeneratorValues[], index: number): number[][] =>
    algorithmValuesArray.map<number[]>(index ? nonLinearDigitsGeneratorMapper : linearDigitsGeneratorMapper);

  return [...Array(maxNumberOfDigits)]
    .reduce<DigitsGeneratorValues[][]>(digitsGeneratorValuesArrayReducer, [[], []])
    .map<number[][]>(digitsGeneratorMapper)
    .flat<number[][][], 1>();
};

interface KeyProps {
  key: string;
  children: ReactNode;
}

export interface ElementMappers {
  fragmentElementMapper: (child: ReactNode, index: number) => JSX.Element;
  divisionElementMapper: (child: ReactNode, index: number, props?: StyledVisibilityProps) => JSX.Element;
  simpleDivisionElementMapper: (child: ReactNode, index: number) => JSX.Element;
  characterElementMapper: (child: ReactNode, index: number) => JSX.Element;
  digitElementMapper: (child: ReactNode, index: number) => JSX.Element;
}

type UseElementMappers = () => ElementMappers;

export const useElementMappers: UseElementMappers = (): ElementMappers => {
  const elementMapperFactory = <T extends object>(
    Component: FC<T | KeyProps> | string,
    child: ReactNode,
    index: number,
    props?: T,
  ): JSX.Element => (
    <Component key={`${typeof Component === 'symbol' ? '' : Component}${`${index + 1}`.padStart(2, '0')}`} {...props}>
      {child}
    </Component>
  );

  const fragmentElementMapper = (child: ReactNode, index: number): JSX.Element =>
    elementMapperFactory<object>(Fragment, child, index);

  const divisionElementMapper = (child: ReactNode, index: number, props?: StyledVisibilityProps): JSX.Element =>
    elementMapperFactory<StyledVisibilityProps>(StyledDivision, child, index, props);

  const simpleDivisionElementMapper = (child: ReactNode, index: number): JSX.Element =>
    divisionElementMapper(child, index);

  const characterElementMapper = (child: ReactNode, index: number): JSX.Element =>
    elementMapperFactory<StyledVisibilityProps>(StyledCharacter, child, index);

  const digitElementMapper = (child: ReactNode, index: number): JSX.Element =>
    elementMapperFactory<object>(StyledDigit, child, index);

  return {
    fragmentElementMapper,
    divisionElementMapper,
    simpleDivisionElementMapper,
    characterElementMapper,
    digitElementMapper,
  };
};

interface UseDigitsReducerOptions {
  precision: number;
  decimalSeparator: DecimalSeparator;
  digitGroupSeparator: DigitGroupSeparator;
}

export type DigitsReducer = (
  accumulator: JSX.Element,
  currentValue: JSX.Element,
  index: number,
  array: JSX.Element[],
) => JSX.Element;

type UseDigitsReducer = (options: UseDigitsReducerOptions) => DigitsReducer;

export const useDigitsReducer: UseDigitsReducer = (options: UseDigitsReducerOptions): DigitsReducer => {
  const { precision, decimalSeparator, digitGroupSeparator }: UseDigitsReducerOptions = options;

  const getSeparatorElement = (index: number, length: number): ReactNode =>
    !((length - index - Math.max(precision, 0)) % 3) && (
      <StyledCharacter>{length - index === precision ? decimalSeparator : digitGroupSeparator}</StyledCharacter>
    );

  return (
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
};
