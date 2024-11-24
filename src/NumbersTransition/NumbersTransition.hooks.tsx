import { FC, ReactNode } from 'react';
import {
  AnimationDirection,
  AnimationTimingFunction,
  DecimalSeparator,
  DigitGroupSeparator,
  EquationSolver,
  HorizontalAnimationDirection,
  LinearAlgorithm,
  NumberPrecision,
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import { StyledCharacter, StyledDigit } from './NumbersTransition.styles';

type UseAnimationTimingFunction = (
  animationTimingFunction: AnimationTimingFunction,
  animationDirection: AnimationDirection,
) => AnimationTimingFunction;

export const useAnimationTimingFunction: UseAnimationTimingFunction = (
  animationTimingFunction: AnimationTimingFunction,
  animationDirection: AnimationDirection,
): AnimationTimingFunction => {
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

interface AlgorithmValues {
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

  const algorithmValuesArrayReducer = (
    accumulator: AlgorithmValues[][],
    _: undefined,
    index: number,
  ): AlgorithmValues[][] => {
    const [start, end]: bigint[] = [previousValue, currentValue]
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

  return [...Array(maxNumberOfDigits)]
    .reduce<AlgorithmValues[][]>(algorithmValuesArrayReducer, [[], []])
    .map<number[][]>(algorithmMapper)
    .flat<number[][][], 1>();
};

interface KeyProps {
  key: string;
  children: ReactNode;
}

export type ElementMapperFactory = <T extends object>(
  Component: FC<T | KeyProps> | string,
  child: ReactNode,
  index: number,
  props?: T,
) => JSX.Element;

type UseElementMapperFactory = () => ElementMapperFactory;

export const useElementMapperFactory: UseElementMapperFactory =
  (): ElementMapperFactory =>
  <T extends object>(Component: FC<T | KeyProps> | string, child: ReactNode, index: number, props?: T): JSX.Element => (
    <Component key={`${typeof Component === 'symbol' ? '' : Component}${`${index + 1}`.padStart(2, '0')}`} {...props}>
      {child}
    </Component>
  );

export type DigitElementMapper = (child: ReactNode, index: number) => JSX.Element;

type UseDigitElementMapper = () => DigitElementMapper;

export const useDigitElementMapper: UseDigitElementMapper = (): DigitElementMapper => {
  const elementMapperFactory: ElementMapperFactory = useElementMapperFactory();
  return (child: ReactNode, index: number): JSX.Element => elementMapperFactory<object>(StyledDigit, child, index);
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
