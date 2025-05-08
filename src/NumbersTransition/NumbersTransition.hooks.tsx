import { Dispatch, FC, JSX, ReactNode, RefObject, SetStateAction, useLayoutEffect, useState } from 'react';
import {
  AnimationDirection,
  Canvas,
  DecimalSeparator,
  DigitGroupSeparator,
  DigitsGenerator,
  EquationSolver,
  HorizontalAnimationDirection,
  NegativeCharacter,
  NumberOfAnimations,
  NumberPrecision,
  Numbers,
  RegularExpressions,
  Strings,
  Types,
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import './NumbersTransition.extensions';
import { AnimationTimingFunction } from './NumbersTransition.styles';

export type ReadOnly<T> = {
  +readonly [K in keyof T]: ReadOnly<T[K]>;
};

export type UncheckedBigDecimal = number | bigint | string;

export type BigDecimal = number | bigint | `${number}`;

export type ValidationTuple = [BigDecimal, boolean];

type UseValidation = (value?: UncheckedBigDecimal) => ValidationTuple;

export const useValidation: UseValidation = (value?: UncheckedBigDecimal): ValidationTuple => {
  const isBigDecimal = (value?: UncheckedBigDecimal): value is BigDecimal =>
    typeof value !== Types.UNDEFINED && !!`${value}`.match(RegularExpressions.BIG_DECIMAL);

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

  return values.map<string[]>((number: BigDecimal): string[] => [
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

interface UseTotalAnimationDurationOptions {
  numberOfAnimations: NumberOfAnimations;
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
    case NumberOfAnimations.ZERO:
      return Numbers.ZERO;
    case NumberOfAnimations.ONE:
      return verticalAnimationDuration;
    case NumberOfAnimations.TWO:
      return horizontalAnimationDuration + verticalAnimationDuration;
    case NumberOfAnimations.THREE:
      return Numbers.TWO * horizontalAnimationDuration + verticalAnimationDuration;
  }
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

  const reverse: boolean = [HorizontalAnimationDirection.LEFT, VerticalAnimationDirection.DOWN].includes(
    animationDirection,
  );

  const animationTimingFunctionMapper = (
    tuple: ReadOnly<AnimationTimingFunction[number]> | AnimationTimingFunction[number],
  ): AnimationTimingFunction[number] =>
    reverse ? tuple.map<number>((number: number): number => Numbers.ONE - number) : [...tuple];

  return animationTimingFunction
    .map<AnimationTimingFunction[number], AnimationTimingFunction>(animationTimingFunctionMapper)
    .invert(reverse);
};

type Character = DecimalSeparator | DigitGroupSeparator | NegativeCharacter;

export type GetCharacterWidth = (character: Character) => number;

type UseCharacterWidth = (ref: RefObject<HTMLElement | null>) => GetCharacterWidth;

export const useCharacterWidth: UseCharacterWidth = (ref: RefObject<HTMLElement | null>): GetCharacterWidth => {
  const { current }: RefObject<HTMLElement | null> = ref;

  const [canvasContext, setCanvasContext]: [
    CanvasRenderingContext2D | null,
    Dispatch<SetStateAction<CanvasRenderingContext2D | null>>,
  ] = useState<CanvasRenderingContext2D | null>(null);

  useLayoutEffect((): void => {
    const newCanvasContext: CanvasRenderingContext2D = document
      .createElement(Canvas.ELEMENT)
      .getContext(Canvas.CONTEXT_ID)!;

    newCanvasContext.font =
      [...(current?.classList ?? [])]
        .map<string>((className: string): string => window.getComputedStyle(current!, className).font)
        .find((font: string): string => font) ?? Strings.EMPTY;

    setCanvasContext(newCanvasContext);
  }, [current]);

  const divide = (first: number, second: number): number => first / second;

  const characterWidthMapper = (text: string): number => canvasContext?.measureText?.(text)?.width ?? Numbers.ZERO;

  return (character: Character): number =>
    [character, `${Numbers.ZERO}`].map<number>(characterWidthMapper).reduce(divide);
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
    .map<number[][]>(digitsGeneratorMapper)
    .flat<[number[][], number[][]], Numbers.ONE>();
};

interface KeyProps {
  key: string;
}

interface ChildrenProps {
  children: ReactNode;
}

type ComponentProps = KeyProps & ChildrenProps;

type FunctionalComponent = FC<ComponentProps> | string;

export type ElementKeyMapper = (child: ReactNode, index: number, children: ReactNode[]) => JSX.Element;

type UseElementKeyMapper = (Component: FunctionalComponent) => ElementKeyMapper;

export const useElementKeyMapper: UseElementKeyMapper =
  (Component: FunctionalComponent): ElementKeyMapper =>
  (child: ReactNode, index: number, { length }: ReactNode[]): JSX.Element => (
    <Component
      key={`${Component.toString()}${`${index + Numbers.ONE}`.padStart(`${length}`.length, `${Numbers.ZERO}`)}`}
    >
      {child}
    </Component>
  );
