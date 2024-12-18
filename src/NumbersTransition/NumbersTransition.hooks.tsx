import { Dispatch, FC, ReactNode, RefObject, SetStateAction, useEffect, useState } from 'react';
import {
  AnimationDirection,
  Canvas,
  DigitsGenerator,
  EquationSolver,
  HorizontalAnimationDirection,
  NumberPrecision,
  Numbers,
  RegularExpressions,
  Strings,
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import { AnimationTimingFunction } from './NumbersTransition.styles';
import { BigDecimal, ReadOnly } from './NumbersTransition.types';

type UseCanvasContext = (ref: RefObject<HTMLElement>) => CanvasRenderingContext2D | null;

export const useCanvasContext: UseCanvasContext = (ref: RefObject<HTMLElement>): CanvasRenderingContext2D | null => {
  const { current }: RefObject<HTMLElement> = ref;

  const [canvasContext, setCanvasContext]: [
    CanvasRenderingContext2D | null,
    Dispatch<SetStateAction<CanvasRenderingContext2D | null>>,
  ] = useState<CanvasRenderingContext2D | null>(null);

  useEffect((): void => {
    const newCanvasContext: CanvasRenderingContext2D = document
      .createElement(Canvas.ELEMENT)
      .getContext(Canvas.CONTEXT_ID)!;

    newCanvasContext.font =
      [...(current?.classList ?? [])]
        .map<string>((className: string): string => window.getComputedStyle(current!, className).font)
        .find((font: string): string => font) ?? Strings.EMPTY;

    setCanvasContext(newCanvasContext);
  }, [current]);

  return canvasContext;
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

  return values.map<string[]>((number: BigDecimal): string[] => [
    ...`${number}`.split(Strings.DOT).reduce<string[]>(floatingPointFill, []).reduce(floatingPointReducer),
  ]);
};

type UseAnimationDigitsOptions = [string[], string[]];

type AnimationDigitsTuple = [number[], number[]];

type UseAnimationDigits = (options: UseAnimationDigitsOptions) => AnimationDigitsTuple;

const useAnimationDigits: UseAnimationDigits = (options: UseAnimationDigitsOptions): AnimationDigitsTuple =>
  options.map<number[]>((characters: string[]): number[] =>
    characters
      .filter((character: string): boolean => !!character.match(RegularExpressions.SINGLE_DIGIT))
      .map<number>(Number),
  );

type UseAnimationBigIntsOptions = AnimationCharactersTuple;

type AnimationBigIntsTuple = [bigint, bigint, bigint];

type UseAnimationBigInts = (options: UseAnimationBigIntsOptions) => AnimationBigIntsTuple;

const useAnimationBigInts: UseAnimationBigInts = (options: UseAnimationBigIntsOptions): AnimationBigIntsTuple =>
  options.map<bigint>((digits: string[]): bigint => BigInt(digits.join(Strings.EMPTY)));

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
    .map<number>(({ length }: number[]): number => length)
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

interface UseAnimationTimingFunctionOptions {
  animationTimingFunction: ReadOnly<AnimationTimingFunction> | AnimationTimingFunction;
  animationDirection: AnimationDirection;
}

type UseAnimationTimingFunction = (options: UseAnimationTimingFunctionOptions) => AnimationTimingFunction;

export const useAnimationTimingFunction: UseAnimationTimingFunction = (
  options: UseAnimationTimingFunctionOptions,
): AnimationTimingFunction => {
  const { animationTimingFunction, animationDirection }: UseAnimationTimingFunctionOptions = options;

  const mutableAnimationTimingFunctionMapper = (
    tuple: ReadOnly<AnimationTimingFunction[number]> | AnimationTimingFunction[number],
  ): AnimationTimingFunction[number] => [...tuple];

  const reverseAnimationTimingFunctionMapper = (
    tuple: ReadOnly<AnimationTimingFunction[number]> | AnimationTimingFunction[number],
  ): AnimationTimingFunction[number] => tuple.map<number>((number: number): number => Numbers.ONE - number);

  return animationDirection === HorizontalAnimationDirection.RIGHT ||
    animationDirection === VerticalAnimationDirection.UP
    ? animationTimingFunction.map<AnimationTimingFunction[number], AnimationTimingFunction>(
        mutableAnimationTimingFunctionMapper,
      )
    : animationTimingFunction
        .map<AnimationTimingFunction[number], AnimationTimingFunction>(reverseAnimationTimingFunctionMapper)
        .reverse();
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

    return Math.abs(newValue - previousValue) < EquationSolver.DERIVATIVE_DELTA &&
      newFuncResult < EquationSolver.DERIVATIVE_DELTA
      ? newValue
      : solve(func, newValue, newFuncResult);
  };

  const cubicBezier =
    ([firstPoint, secondPoint]: AnimationTimingFunction[number]): ((time: number) => number) =>
    (time: number): number =>
      Numbers.THREE *
        (firstPoint * time * (Numbers.ONE - time) ** Numbers.TWO +
          secondPoint * (Numbers.ONE - time) * time ** Numbers.TWO) +
      time ** Numbers.THREE;

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
    ...(hasZeros ? Array(numberOfDigitsDifference).fill(Numbers.ZERO) : []),
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
        increasedValue - newValue * NumberPrecision.VALUE < NumberPrecision.HALF_VALUE ? newValue : newValue + 1n,
      )
      .map<number>(digitMapper);

    return numbers[numbers.length - Numbers.ONE] === digitMapper(end) ? numbers : [...numbers, digitMapper(end)];
  };

  const digitsGeneratorMapper = (algorithmValuesArray: DigitsGeneratorValues[], index: number): number[][] =>
    algorithmValuesArray.map<number[]>(index ? nonLinearDigitsGeneratorMapper : linearDigitsGeneratorMapper);

  return [...Array(maxNumberOfDigits)]
    .reduce<DigitsGeneratorValues[][]>(digitsGeneratorValuesArrayReducer, [[], []])
    .map<number[][]>(digitsGeneratorMapper)
    .flat<number[][][], Numbers.ONE>();
};

interface KeyProps {
  key: string;
}

interface ChildrenProps {
  children: ReactNode;
}

type ComponentProps<T extends object> = (T & KeyProps & ChildrenProps) | (KeyProps & ChildrenProps);

type FunctionalComponent<T extends object> = FC<ComponentProps<T>> | string;

export type ElementMapper<T extends object> = (
  child: ReactNode,
  index: number,
  children: ReactNode[],
  props?: T,
) => JSX.Element;

type UseElementMapper = <T extends object>(Component: FunctionalComponent<T>) => ElementMapper<T>;

export const useElementMapper: UseElementMapper =
  <T extends object>(Component: FunctionalComponent<T>): ElementMapper<T> =>
  (child: ReactNode, index: number, { length }: ReactNode[], props?: T): JSX.Element => (
    <Component
      key={`${Component}${`${index + Numbers.ONE}`.padStart(`${length}`.length, `${Numbers.ZERO}`)}`}
      {...props}
    >
      {child}
    </Component>
  );
