import { FC, ReactElement, ReactNode } from 'react';
import { ShouldForwardProp } from 'styled-components';
import {
  AnimationDirection,
  AnimationDurationValues,
  AnimationNumber,
  AnimationTimingFunctions,
  DigitsGenerator,
  EquationSolver,
  ForwardProps,
  HorizontalAnimationDirection,
  NumberPrecision,
  Numbers,
  RegularExpressions,
  Runtime,
  Strings,
  TotalAnimationDurationValues,
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import './NumbersTransition.extensions';
import { AnimationTimingFunction } from './NumbersTransition.styles';
import { BigDecimal, OrReadOnly, UncheckedBigDecimal } from './NumbersTransition.types';

type UseForwardProp = () => ShouldForwardProp<Runtime.WEB>;

export const useForwardProp: UseForwardProp =
  (): ShouldForwardProp<Runtime.WEB> =>
  (prop: string): boolean =>
    Object.values<ForwardProps>(ForwardProps).includes<string>(prop);

export type ValidationTuple = [BigDecimal, boolean];

type UseValidation = (value?: UncheckedBigDecimal) => ValidationTuple;

export const useValidation: UseValidation = (value?: UncheckedBigDecimal): ValidationTuple => {
  const isBigDecimal = (value?: UncheckedBigDecimal): value is BigDecimal =>
    typeof value !== 'undefined' && !!`${value}`.match(RegularExpressions.BIG_DECIMAL);

  return isBigDecimal(value) ? [value, true] : [Numbers.ZERO, false];
};

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
    ...(length === Numbers.ONE ? [Strings.EMPTY] : []),
  ];

  const floatingPointReducer = (integer: string, fraction: string): string => {
    const [start, mid, end, numberOfZeros]: [string, string, string, number] =
      precision > Numbers.ZERO
        ? [
            integer.replace(Strings.MINUS, Strings.EMPTY),
            fraction,
            Strings.EMPTY,
            Math.max(precision - fraction.length, Numbers.ZERO),
          ]
        : [Strings.EMPTY, integer.replace(Strings.MINUS, Strings.EMPTY), fraction, -precision];

    const digits: string = `${start}${mid.slice(Numbers.ZERO, precision || mid.length) ?? Numbers.ZERO}`;
    const restDigits: string = `${mid.slice(precision || mid.length)}${end}`;
    const increase: number =
      BigInt(restDigits) < BigInt(`${Numbers.FIVE}`.padEnd(restDigits.length, `${Numbers.ZERO}`))
        ? Numbers.ZERO
        : Numbers.ONE;

    return [
      integer.replace(RegularExpressions.DIGITS, Strings.EMPTY),
      BigInt(start) ? Strings.EMPTY : start,
      (BigInt(digits) + BigInt(increase)) * BigInt(Numbers.TEN) ** BigInt(numberOfZeros),
    ].join(Strings.EMPTY);
  };

  return values.map<string[], AnimationCharactersTuple>((number: BigDecimal): string[] => [
    ...`${number}`
      .split(RegularExpressions.DOT_OR_COMMA)
      .reduce<string[]>(floatingPointFill, [])
      .reduce(floatingPointReducer),
  ]);
};

type UseAnimationDigitsOptions = [string[], string[]];

type AnimationDigitsTuple = [number[], number[]];

type UseAnimationDigits = (options: UseAnimationDigitsOptions) => AnimationDigitsTuple;

const useAnimationDigits: UseAnimationDigits = (options: UseAnimationDigitsOptions): AnimationDigitsTuple =>
  options.map<number[], AnimationDigitsTuple>((characters: string[]): number[] =>
    characters
      .filter((character: string): boolean => !!character.match(RegularExpressions.SINGLE_DIGIT))
      .map<number>(Number),
  );

type UseAnimationBigIntsOptions = AnimationCharactersTuple;

type AnimationBigIntsTuple = [bigint, bigint, bigint];

type UseAnimationBigInts = (options: UseAnimationBigIntsOptions) => AnimationBigIntsTuple;

const useAnimationBigInts: UseAnimationBigInts = (options: UseAnimationBigIntsOptions): AnimationBigIntsTuple =>
  options.map<bigint, AnimationBigIntsTuple>((digits: string[]): bigint => BigInt(digits.join(Strings.EMPTY)));

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
    ...(index ? [currentValue - accumulator[accumulator.length - Numbers.ONE]] : []),
  ];

  return options
    .map<number, [number, number]>(({ length }: number[]): number => length)
    .sort(subtract)
    .reduce<number[], AnimationNumbersOfDigitsTuple>(digitsLengthReducer, []);
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

  const digits: AnimationDigitsTuple = useAnimationDigits([characters[Numbers.ZERO], characters[Numbers.TWO]]);
  const bigInts: AnimationBigIntsTuple = useAnimationBigInts(characters);
  const numbersOfDigits: AnimationNumbersOfDigitsTuple = useAnimationNumberOfDigits(digits);

  return [digits, bigInts, numbersOfDigits];
};

export interface AnimationDuration {
  horizontalAnimation?: number;
  verticalAnimation?: number;
}

export interface TotalAnimationDuration {
  animationDuration?: number;
  ratio?: number;
}

interface UseAnimationDurationOptions {
  animationDuration?: AnimationDuration | TotalAnimationDuration;
  numberOfAnimations: AnimationNumber;
}

export type AnimationDurationTuple = [number, number];

type UseAnimationDuration = (options: UseAnimationDurationOptions) => AnimationDurationTuple;

export const useAnimationDuration: UseAnimationDuration = (
  options: UseAnimationDurationOptions,
): AnimationDurationTuple => {
  const { animationDuration = {}, numberOfAnimations }: UseAnimationDurationOptions = options;
  const keys: (keyof AnimationDuration)[] = ['horizontalAnimation', 'verticalAnimation'];

  const isAnimationDuration = (
    animationDuration: AnimationDuration | TotalAnimationDuration,
  ): animationDuration is AnimationDuration =>
    Object.isEmpty(animationDuration) ||
    Object.keys(animationDuration).some((key: string): boolean => keys.includes<string>(key));

  const fromAnimationDuration = ({
    horizontalAnimation = AnimationDurationValues.HORIZONTAL_ANIMATION,
    verticalAnimation = AnimationDurationValues.VERTICAL_ANIMATION,
  }: AnimationDuration): AnimationDurationTuple => [
    numberOfAnimations === AnimationNumber.ONE ? Numbers.ZERO : horizontalAnimation,
    verticalAnimation,
  ];

  const fromTotalAnimationDuration = ({
    animationDuration = TotalAnimationDurationValues.ANIMATION_DURATION,
    ratio = TotalAnimationDurationValues.RATIO,
  }: TotalAnimationDuration): AnimationDurationTuple => {
    const horizontalAnimationDuration: number =
      numberOfAnimations === AnimationNumber.ONE
        ? Numbers.ZERO
        : animationDuration / (ratio + numberOfAnimations - Numbers.ONE);
    const verticalAnimationDuration: number =
      ratio === Numbers.ZERO
        ? Numbers.ZERO
        : animationDuration - horizontalAnimationDuration * (numberOfAnimations - Numbers.ONE);

    return [horizontalAnimationDuration, verticalAnimationDuration];
  };

  const mapAnimationDuration:
    | ((animationDuration: AnimationDuration) => AnimationDurationTuple)
    | ((animationDuration: TotalAnimationDuration) => AnimationDurationTuple) = isAnimationDuration(animationDuration)
    ? fromAnimationDuration
    : fromTotalAnimationDuration;

  return numberOfAnimations === AnimationNumber.ZERO
    ? [Numbers.ZERO, Numbers.ZERO]
    : mapAnimationDuration(animationDuration);
};

interface UseTotalAnimationDurationOptions {
  numberOfAnimations: AnimationNumber;
  horizontalAnimationDuration: number;
  verticalAnimationDuration: number;
}

type UseTotalAnimationDuration = (options: UseTotalAnimationDurationOptions) => number;

export const useTotalAnimationDuration: UseTotalAnimationDuration = ({
  numberOfAnimations,
  horizontalAnimationDuration,
  verticalAnimationDuration,
}: UseTotalAnimationDurationOptions): number => {
  switch (numberOfAnimations) {
    case AnimationNumber.ZERO:
      return Numbers.ZERO;
    case AnimationNumber.ONE:
      return verticalAnimationDuration;
    case AnimationNumber.TWO:
      return horizontalAnimationDuration + verticalAnimationDuration;
    case AnimationNumber.THREE:
      return Numbers.TWO * horizontalAnimationDuration + verticalAnimationDuration;
  }
};

export interface ExtendedAnimationTimingFunction {
  horizontalAnimation?: OrReadOnly<AnimationTimingFunction>;
  verticalAnimation?: OrReadOnly<AnimationTimingFunction>;
}

export type AnimationTimingFunctionTuple = [OrReadOnly<AnimationTimingFunction>, OrReadOnly<AnimationTimingFunction>];

type UseAnimationTimingFunction = (
  animationTimingFunction?: OrReadOnly<AnimationTimingFunction> | ExtendedAnimationTimingFunction,
) => AnimationTimingFunctionTuple;

export const useAnimationTimingFunction: UseAnimationTimingFunction = (
  animationTimingFunction:
    | OrReadOnly<AnimationTimingFunction>
    | ExtendedAnimationTimingFunction = AnimationTimingFunctions.EASE,
): AnimationTimingFunctionTuple => {
  const isAnimationTimingFunction: (
    animationTimingFunction: OrReadOnly<AnimationTimingFunction> | ExtendedAnimationTimingFunction,
  ) => animationTimingFunction is OrReadOnly<AnimationTimingFunction> = Array.isArray;

  const {
    horizontalAnimation = AnimationTimingFunctions.EASE,
    verticalAnimation = AnimationTimingFunctions.EASE,
  }: ExtendedAnimationTimingFunction = isAnimationTimingFunction(animationTimingFunction)
    ? { horizontalAnimation: animationTimingFunction, verticalAnimation: animationTimingFunction }
    : animationTimingFunction;

  return [horizontalAnimation, verticalAnimation];
};

interface UseAnimationTimingFunctionDirectionOptions {
  animationTimingFunction: OrReadOnly<AnimationTimingFunction>;
  animationDirection: AnimationDirection;
}

type UseAnimationTimingFunctionDirection = (
  options: UseAnimationTimingFunctionDirectionOptions,
) => AnimationTimingFunction;

export const useAnimationTimingFunctionDirection: UseAnimationTimingFunctionDirection = (
  options: UseAnimationTimingFunctionDirectionOptions,
): AnimationTimingFunction => {
  const { animationTimingFunction, animationDirection }: UseAnimationTimingFunctionDirectionOptions = options;

  const reverse: boolean = [HorizontalAnimationDirection.LEFT, VerticalAnimationDirection.DOWN].includes(
    animationDirection,
  );

  const animationTimingFunctionMapper = (
    tuple: OrReadOnly<AnimationTimingFunction[number]>,
  ): AnimationTimingFunction[number] =>
    reverse
      ? tuple.map<number, AnimationTimingFunction[number]>((number: number): number => Numbers.ONE - number)
      : [...tuple];

  return animationTimingFunction
    .map<AnimationTimingFunction[number], AnimationTimingFunction>(animationTimingFunctionMapper)
    .invert(reverse);
};

type CubicBezier = (points: AnimationTimingFunction[number]) => (time: number) => number;

type Solve = (func: (inputValue: number) => number, previousValue?: number, previousFuncResult?: number) => number;

export type CubicBezierTuple = [CubicBezier, Solve];

type UseCubicBezier = () => CubicBezierTuple;

export const useCubicBezier: UseCubicBezier = (): CubicBezierTuple => {
  const derivative = (func: (value: number) => number, value: number) =>
    (func(value + EquationSolver.DERIVATIVE_DELTA) - func(value - EquationSolver.DERIVATIVE_DELTA)) /
    (Numbers.TWO * EquationSolver.DERIVATIVE_DELTA);

  const solve = (
    func: (value: number) => number,
    previousValue: number = EquationSolver.INITIAL_VALUE,
    previousFuncResult: number = func(previousValue),
  ): number => {
    const newValue: number = previousValue - previousFuncResult / derivative(func, previousValue);
    const newFuncResult: number = func(newValue);

    const isConvergent: boolean = [newValue - previousValue, newFuncResult]
      .map<boolean>((value: number): boolean => Math.abs(value) < EquationSolver.DERIVATIVE_DELTA)
      .reduce((accumulator: boolean, currentValue: boolean): boolean => accumulator && currentValue);

    return isConvergent ? newValue : solve(func, newValue, newFuncResult);
  };

  const cubicBezier =
    ([firstPoint, secondPoint]: AnimationTimingFunction[number]): ((time: number) => number) =>
    (time: number): number =>
      Numbers.THREE *
        (firstPoint * time * (Numbers.ONE - time) ** Numbers.TWO +
          secondPoint * (Numbers.ONE - time) * time ** Numbers.TWO) +
      time ** Numbers.THREE;

  return [cubicBezier, (func: (value: number) => number): number => solve(func)];
};

interface UseHorizontalAnimationDigitsOptions {
  previousValueDigits: number[];
  currentValueDigits: number[];
  numberOfDigitsDifference: number;
  animationDirection: HorizontalAnimationDirection;
  renderZeros: boolean;
}

type UseHorizontalAnimationDigits = (options: UseHorizontalAnimationDigitsOptions) => number[];

export const useHorizontalAnimationDigits: UseHorizontalAnimationDigits = ({
  numberOfDigitsDifference,
  previousValueDigits,
  currentValueDigits,
  animationDirection,
  renderZeros,
}: UseHorizontalAnimationDigitsOptions): number[] => [
  ...(renderZeros ? Array(numberOfDigitsDifference).fill(Numbers.ZERO) : []),
  ...(animationDirection === HorizontalAnimationDirection.RIGHT ? previousValueDigits : currentValueDigits),
];

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
    accumulator: [DigitsGeneratorValues[], DigitsGeneratorValues[]],
    _: undefined,
    index: number,
  ): [DigitsGeneratorValues[], DigitsGeneratorValues[]] => {
    const [start, end]: bigint[] = [previousValue, currentValue]
      .map<bigint>(
        (number: bigint): bigint => number / BigInt(Numbers.TEN) ** BigInt(maxNumberOfDigits - index - Numbers.ONE),
      )
      .sort((first: bigint, second: bigint): number =>
        first < second ? Numbers.MINUS_ONE : first > second ? Numbers.ONE : Numbers.ZERO,
      );

    const accumulatorIndex: number = end - start < DigitsGenerator.SWITCH_VALUE ? Numbers.ZERO : Numbers.ONE;
    accumulator[accumulatorIndex] = [...accumulator[accumulatorIndex], { start, end }];

    return accumulator;
  };

  const digitMapper = (number: bigint): number => Math.abs(Number(number % BigInt(Numbers.TEN)));

  const linearDigitsGeneratorMapper = ({ start, end }: DigitsGeneratorValues): number[] =>
    [...Array(Number(end - start) + Numbers.ONE)].map<number>((_: undefined, index: number): number =>
      digitMapper(start + BigInt(index)),
    );

  const nonLinearDigitsGeneratorMapper = (values: DigitsGeneratorValues, index: number): number[] => {
    const { start, end }: DigitsGeneratorValues = values;
    const numbers: number[] = [
      ...Array(DigitsGenerator.SWITCH_VALUE * (DigitsGenerator.INITIAL_VALUE + DigitsGenerator.MULTIPLY_VALUE * index)),
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
        increasedValue - newValue * NumberPrecision.VALUE < NumberPrecision.HALF_VALUE
          ? newValue
          : newValue + BigInt(Numbers.ONE),
      )
      .map<number>(digitMapper);

    return numbers[numbers.length - Numbers.ONE] === digitMapper(end) ? numbers : [...numbers, digitMapper(end)];
  };

  const digitsGeneratorMapper = (algorithmValuesArray: DigitsGeneratorValues[], index: number): number[][] =>
    algorithmValuesArray.map<number[]>(index ? nonLinearDigitsGeneratorMapper : linearDigitsGeneratorMapper);

  return [...Array(maxNumberOfDigits)]
    .reduce<[DigitsGeneratorValues[], DigitsGeneratorValues[]]>(digitsGeneratorValuesArrayReducer, [[], []])
    .map<number[][], [number[][], number[][]]>(digitsGeneratorMapper)
    .flat<[number[][], number[][]], Numbers.ONE>();
};

interface KeyProps {
  key?: string;
}

interface ChildrenProps {
  children?: ReactNode;
}

interface IterableProps extends KeyProps, ChildrenProps {}
type ComponentProps<T extends object> = T & IterableProps;
type FunctionalComponent<T extends object> = FC<ComponentProps<T>> | string;

type PropsFactory<T extends object, U extends ReactNode> = (value: U, index: number, length: number) => T;

export type ElementKeyMapper<T extends ReactNode> = (child: T, index: number, children: T[]) => ReactElement;

type UseElementKeyMapper = <T extends object, U extends ReactNode>(
  Component: FunctionalComponent<T>,
  props: T | PropsFactory<T, U>,
) => ElementKeyMapper<U>;

export const useElementKeyMapper: UseElementKeyMapper =
  <T extends object, U extends ReactNode>(
    Component: FunctionalComponent<T>,
    props: T | PropsFactory<T, U>,
  ): ElementKeyMapper<U> =>
  (child: U, index: number, { length }: U[]): ReactElement => (
    <Component
      key={`${Component.toString()}${`${index + Numbers.ONE}`.padStart(`${length}`.length, `${Numbers.ZERO}`)}`}
      {...(typeof props === 'function' ? props(child, index, length) : props)}
    >
      {child}
    </Component>
  );
