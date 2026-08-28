import { ActionDispatch, FC, RefObject, useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { useTheme } from 'styled-components';
import type {
  CubicBezierEasingFunction,
  EasingFunction,
  EasingFunctionTypeMapper,
  EasingFunctions,
  ElementsLength,
  LinearEasingFunction,
  NumbersTransitionTheme,
  StepsEasingFunction,
  StyledView,
} from './NumbersTransition.styles';
import type {
  Assert,
  BigDecimal,
  Nullable,
  Optional,
  OrArray,
  OrFunction,
  OrReadOnly,
  ReactElement,
  ReactNode,
  ReactState,
  Strip,
  Switch,
  Tuple,
  UncheckedBigDecimal,
  UnionProduct,
  ValueOf,
  When,
} from './NumbersTransition.types';
import {
  AnimationDirection,
  AnimationInterruptionMode,
  AnimationKey,
  AnimationNumber,
  AnimationTimingFunction,
  AnimationTransition,
  AnimationType,
  BoxSizing,
  DigitGroupSeparatorCharacter,
  Integer,
  Key,
  NegativeCharacterAnimationMode,
  NumberPrecision,
  Pattern,
  StepPosition,
  Styled,
  Text,
  ViewKey,
  ViewType,
} from './NumbersTransition.enums';

const useRerender = (): ActionDispatch<[]> => useReducer<number, []>((value: number): number => value + Integer.One, Integer.Zero).last();

export const useValidation = (value?: UncheckedBigDecimal, validValue: BigDecimal = Integer.Zero): [BigDecimal, boolean] =>
  value?.matches<UncheckedBigDecimal, BigDecimal>(Pattern.BigDecimal.test(`${value}`)) ? [value, true] : [validValue, false];

export const useValue = (
  value: Optional<UncheckedBigDecimal>,
  previousValue: BigDecimal,
  animationInterruptionMode: AnimationInterruptionMode = AnimationInterruptionMode.Interrupt,
): [BigDecimal, boolean] => {
  const rerender: ActionDispatch<[]> = useRerender();
  const values: RefObject<[BigDecimal, boolean][]> = useRef<[BigDecimal, boolean][]>([]);
  const validationTuple: [BigDecimal, boolean] = useValidation(value, values.current.last()?.first() ?? previousValue);

  values.current =
    animationInterruptionMode === AnimationInterruptionMode.Continue
      ? [...values.current, ...[validationTuple].when(!values.current.last()?.equals(validationTuple))]
      : [validationTuple];

  // prettier-ignore
  const { current: [[validValue, isValueValid]] }: RefObject<[BigDecimal, boolean][]> = values;

  const filterInvalidValues = ([, isValid]: [BigDecimal, boolean], index: number, { length }: [BigDecimal, boolean][]): boolean =>
    isValid || index === length - Integer.One;

  const filterDuplicates = ([value]: [BigDecimal, boolean], index: number, array: [BigDecimal, boolean][]): boolean =>
    !index || value !== array[index - Integer.One][Integer.Zero];

  useEffect((): void =>
    [
      (): unknown => (values.current = values.current.slice(Integer.One).filterEach(filterInvalidValues, filterDuplicates)),
      (): unknown => values.current.length && rerender(),
    ]
      .when(validValue === previousValue || !isValueValid)
      .forEach(Function.call<() => unknown>),
  );

  return [validValue, isValueValid];
};

interface UseAnimationValuesOptions {
  precision: number;
  currentValue: BigDecimal;
  previousValueOnAnimationEnd: BigDecimal;
  previousValueOnAnimationStart: BigDecimal;
}

export type AnimationValues = [[number[], number[], number[]], [bigint, bigint, bigint], [number, number, number]];

export const useAnimationValues = (options: UseAnimationValuesOptions): AnimationValues => {
  const { precision, currentValue, previousValueOnAnimationEnd, previousValueOnAnimationStart }: UseAnimationValuesOptions = options;

  const splitExponent = (value: BigDecimal): string[] => `${value}`.split(Pattern.Exponent);

  const parseExponent = ([value, { number: exponent } = `${Integer.Zero}`]: string[]): [string, string, string] => {
    const [minus, number]: [string, string] = value.partition(Number(value.startsWith(Text.Minus)));
    const [integer, fraction = Text.Empty]: string[] = number.split(Pattern.DecimalSeparator);

    return exponent >= Integer.Zero
      ? [minus, `${integer}${fraction.take(exponent).padEnd(exponent, `${Integer.Zero}`)}`, fraction.slice(exponent)]
      : [minus, integer.take(exponent), `${integer.slice(exponent).padStart(-exponent, `${Integer.Zero}`)}${fraction}`];
  };

  const parseFloatingPoint = ([minus, integer, fraction]: [string, string, string]): string => {
    const [digits, rest]: [string, string] =
      precision >= Integer.Zero
        ? [`${integer}${fraction.take(precision)}`, fraction.slice(precision)]
        : [integer.take(precision), `${integer.slice(precision)}${fraction}`];

    const numberOfZeros: number = Math.max(precision - fraction.length, -precision, Integer.Zero);
    const increase: boolean = BigInt(rest) >= BigInt(`${Integer.Five}`.padEnd(Math.max(rest.length, numberOfZeros), `${Integer.Zero}`));
    const value: bigint = (BigInt(digits) + BigInt(increase)) * BigInt(Integer.Ten) ** BigInt(numberOfZeros);

    return `${minus}${`${value}`.padStart(precision + Integer.One, `${Integer.Zero}`)}`;
  };

  // prettier-ignore
  const characters: [string, string, string] = [previousValueOnAnimationStart, previousValueOnAnimationEnd, currentValue]
    .mapEach<[string[], [string, string, string], string], Integer.Three>(splitExponent, parseExponent, parseFloatingPoint);

  const digits: [number[], number[], number[]] = characters.map<number[]>((characters: string): number[] =>
    [...characters].filter((character: string): boolean => Pattern.Digit.test(character)).map<number>(Number),
  );

  const bigInts: [bigint, bigint, bigint] = characters.map<bigint>(BigInt);

  const numbersOfDigits: [number, number, number] = digits
    .slice<Integer.One>(Integer.One)
    .map<number>(({ length }: number[]): number => length)
    .sort(Number.subtract)
    .pipe<[number, number, number]>(([min, max]: [number, number]): [number, number, number] => [min, max, max - min]);

  return [digits, bigInts, numbersOfDigits];
};

interface UseAnimationLogicOptions {
  previousValue: BigDecimal;
  value?: UncheckedBigDecimal;
  isValueValid: boolean;
  previousValueOnStart: bigint;
  previousValueOnEnd: bigint;
  currentValue: bigint;
}

export interface AnimationLogic {
  hasSignChanged: boolean;
  omitAnimation: boolean;
  restartAnimation: boolean;
  renderAnimation: boolean;
}

export const useAnimationLogic = (options: UseAnimationLogicOptions): AnimationLogic => {
  const { previousValue, value, isValueValid, previousValueOnStart, previousValueOnEnd, currentValue }: UseAnimationLogicOptions = options;

  const hasValueChanged: boolean = currentValue !== previousValueOnEnd;
  const hasSignChanged: boolean = (currentValue ^ previousValueOnEnd) < Integer.Zero;
  const omitAnimation: boolean = isValueValid && value !== previousValue && !hasValueChanged;
  const restartAnimation: boolean = currentValue !== previousValueOnStart && previousValueOnEnd !== previousValueOnStart;
  const renderAnimation: boolean = isValueValid && hasValueChanged && !restartAnimation;

  return { hasSignChanged, omitAnimation, restartAnimation, renderAnimation };
};

interface UseAnimationNumbersOptions {
  animationTransition: AnimationTransition;
  previousValueDigits: number[];
  currentValueDigits: number[];
  previousValue: bigint;
  currentValue: bigint;
  hasSignChanged: boolean;
  renderAnimation: boolean;
}

export const useAnimationNumbers = (options: UseAnimationNumbersOptions): [AnimationNumber, AnimationNumber] => {
  const {
    animationTransition,
    previousValueDigits: { length: previousLength },
    currentValueDigits: { length: currentLength },
    previousValue,
    currentValue,
    hasSignChanged,
    renderAnimation,
  }: UseAnimationNumbersOptions = options;

  const animationNumber: AnimationNumber = [AnimationTransition.SecondToThird, AnimationTransition.FirstToSecond, AnimationTransition.None]
    .zip<Tuple<AnimationTransition, Integer.Three>, Tuple<AnimationNumber, Integer.Three>>(
      AnimationNumber.Three,
      AnimationNumber.Two,
      AnimationNumber.One,
    )
    .find(([transition]: [AnimationTransition, AnimationNumber]): boolean => animationTransition === transition)!
    .last();

  const hasThreeAnimationsValueChange: boolean =
    (previousLength < currentLength && previousValue < currentValue) || (previousLength > currentLength && previousValue > currentValue);

  const numberOfAnimations: AnimationNumber = [
    !renderAnimation,
    hasSignChanged && hasThreeAnimationsValueChange,
    hasSignChanged || previousLength !== currentLength,
    true,
  ]
    .zip<Tuple<boolean, Integer.Four>, Tuple<AnimationNumber, Integer.Four>>(
      AnimationNumber.Zero,
      AnimationNumber.Three,
      AnimationNumber.Two,
      AnimationNumber.One,
    )
    .find(Array.first<[boolean, AnimationNumber]>)!
    .last();

  return [renderAnimation ? animationNumber : AnimationNumber.Zero, numberOfAnimations];
};

interface UseAnimationTypeOptions {
  animationTransition: AnimationTransition;
  previousValueDigits: number[];
  currentValueDigits: number[];
  previousValue: bigint;
  currentValue: bigint;
  hasSignChanged: boolean;
  renderAnimation: boolean;
  numberOfAnimations: AnimationNumber;
}

export const useAnimationType = (options: UseAnimationTypeOptions): AnimationType => {
  const {
    animationTransition,
    previousValueDigits: { length: previousLength },
    currentValueDigits: { length: currentLength },
    previousValue,
    currentValue,
    hasSignChanged,
    renderAnimation,
    numberOfAnimations,
  }: UseAnimationTypeOptions = options;

  const renderHorizontalAnimationForTwoAnimations: boolean = [
    hasSignChanged && animationTransition === AnimationTransition.None,
    hasSignChanged,
    animationTransition === AnimationTransition.None,
    true,
  ]
    .zip<Tuple<boolean, Integer.Four>, Tuple<boolean, Integer.Four>>(
      previousValue > currentValue,
      previousValue < currentValue,
      previousLength < currentLength,
      previousLength > currentLength,
    )
    .find(Array.first<[boolean, boolean]>)!
    .last();

  const renderHorizontalAnimation: boolean = [AnimationNumber.Two, AnimationNumber.Three]
    .zip<[AnimationNumber, AnimationNumber], [boolean, boolean]>(
      renderHorizontalAnimationForTwoAnimations,
      animationTransition !== AnimationTransition.FirstToSecond,
    )
    .some(([animationNumber, condition]: [AnimationNumber, boolean]): boolean => numberOfAnimations === animationNumber && condition);

  return [!renderAnimation, renderHorizontalAnimation, true]
    .zip<Tuple<boolean, Integer.Three>, Tuple<AnimationType, Integer.Three>>(
      AnimationType.None,
      AnimationType.Horizontal,
      AnimationType.Vertical,
    )
    .find(Array.first<[boolean, AnimationType]>)!
    .last();
};

interface UseAnimationDirectionOptions {
  animationType: AnimationType;
  animationTransition: AnimationTransition;
  previousValueDigits: number[];
  currentValueDigits: number[];
  previousValue: bigint;
  currentValue: bigint;
  hasSignChanged: boolean;
  numberOfAnimations: AnimationNumber;
}

export const useAnimationDirection = (options: UseAnimationDirectionOptions): AnimationDirection => {
  const {
    animationType,
    animationTransition,
    previousValueDigits: { length: previousLength },
    currentValueDigits: { length: currentLength },
    previousValue,
    currentValue,
    hasSignChanged,
    numberOfAnimations,
  }: UseAnimationDirectionOptions = options;

  // prettier-ignore
  const horizontalAnimationDirection: AnimationDirection = [AnimationNumber.Two, AnimationNumber.Three]
    .zip<[AnimationNumber, AnimationNumber], [boolean, boolean]>(
      hasSignChanged ? previousValue > currentValue : previousLength < currentLength,
      animationTransition === AnimationTransition.None,
    )
    .some(([animationNumber, condition]: [AnimationNumber, boolean]): boolean => numberOfAnimations === animationNumber && condition)
    .pipe<boolean, AnimationDirection>((cond: boolean): AnimationDirection => (cond ? AnimationDirection.Normal : AnimationDirection.Reverse));

  const verticalAnimationDirection: AnimationDirection =
    previousValue < currentValue ? AnimationDirection.Normal : AnimationDirection.Reverse;

  return AnimationType.values<AnimationType>()
    .zip<Tuple<AnimationType, Integer.Three>, Tuple<AnimationDirection, Integer.Three>>(
      AnimationDirection.None,
      horizontalAnimationDirection,
      verticalAnimationDirection,
    )
    .find(([animation]: [AnimationType, AnimationDirection]): boolean => animation === animationType)!
    .last();
};

// prettier-ignore
export const useEasingFunctionTypeMapper = (): EasingFunctionTypeMapper =>
  <T, U extends OrReadOnly<LinearEasingFunction>, V extends OrReadOnly<CubicBezierEasingFunction>, W extends OrReadOnly<StepsEasingFunction>, X extends unknown[] = []>(
    [linear, cubicBezier, steps]: EasingFunctions<T, U, V, W, X>, easingFunction: U | V | W, ...args: X
  ): T =>
    Array.isArray<OrReadOnly<StepsEasingFunction>, U | V>(easingFunction)
      ? easingFunction.matches<U | V, V>(easingFunction.depth === Integer.Two)
        ? cubicBezier(easingFunction, ...args)
        : linear(easingFunction, ...args)
      : steps(easingFunction, ...args);

type FixDirection<T extends EasingFunction> = (easingFunction: OrReadOnly<T>) => T;

const useLinearDirection = (animationDirection: AnimationDirection): FixDirection<LinearEasingFunction> => {
  const copyLinear = (value: OrReadOnly<LinearEasingFunction[number]>): LinearEasingFunction[number] =>
    Array.isArray<number, OrReadOnly<Tuple<number, Integer.Two | Integer.Three>>>(value) ? [...value] : value;

  const reverseLinearTuple = (number: number, index: number, { length, [length - index]: value }: OrReadOnly<number[]>): number =>
    index ? Integer.OneHundred - value : Integer.One - number;

  const reverseLinear = (
    _: OrReadOnly<LinearEasingFunction[number]>,
    index: number,
    { length, [length - index - Integer.One]: value }: OrReadOnly<OrReadOnly<LinearEasingFunction[number]>[]>,
  ): LinearEasingFunction[number] =>
    Array.isArray<number, OrReadOnly<Tuple<number, Integer.Two | Integer.Three>>>(value)
      ? value.map<number, Integer.Two | Integer.Three>(reverseLinearTuple)
      : Integer.One - value;

  return (easingFunction: OrReadOnly<LinearEasingFunction>): LinearEasingFunction =>
    easingFunction.map<LinearEasingFunction[number], LinearEasingFunction>(
      animationDirection === AnimationDirection.Normal ? copyLinear : reverseLinear,
    );
};

const useCubicBezierDirection = (animationDirection: AnimationDirection): FixDirection<CubicBezierEasingFunction> => {
  const copyCubicBezier = (tuple: OrReadOnly<CubicBezierEasingFunction[number]>): [number, number] => [...tuple];

  const reverseCubicBezier = (
    _: OrReadOnly<CubicBezierEasingFunction[number]>,
    index: number,
    easingFunction: OrReadOnly<OrReadOnly<CubicBezierEasingFunction[number]>[]>,
  ): [number, number] => easingFunction[Integer.One - index].map<number, Integer.Two>((number: number): number => Integer.One - number);

  return (easingFunction: OrReadOnly<CubicBezierEasingFunction>): CubicBezierEasingFunction =>
    easingFunction.map<[number, number], CubicBezierEasingFunction>(
      animationDirection === AnimationDirection.Normal ? copyCubicBezier : reverseCubicBezier,
    );
};

const useStepsDirection = (animationDirection: AnimationDirection): FixDirection<StepsEasingFunction> => {
  // prettier-ignore
  const reverseStepPosition = (stepPosition: StepPosition): StepPosition =>
    [[StepPosition.JumpStart, StepPosition.JumpEnd], [StepPosition.JumpNone], [StepPosition.JumpBoth]]
      .find((steps: StepPosition[]): boolean => steps.includes(stepPosition))!
      .find((step: StepPosition, _: number, steps: StepPosition[]): boolean => step === steps.at(steps.indexOf(stepPosition) - Integer.One))!;

  return ({ steps, stepPosition }: OrReadOnly<StepsEasingFunction>): StepsEasingFunction => ({
    steps,
    stepPosition: animationDirection === AnimationDirection.Normal ? stepPosition : reverseStepPosition(stepPosition),
  });
};

export interface ExtendedAnimationTimingFunction {
  horizontalAnimation: OrReadOnly<EasingFunction>;
  verticalAnimation: OrReadOnly<EasingFunction>;
}

export type UnknownAnimationTimingFunction = OrReadOnly<EasingFunction> | ExtendedAnimationTimingFunction;

interface UseAnimationTimingFunctionOptions {
  animationTimingFunction?: UnknownAnimationTimingFunction;
  animationType: AnimationType;
  animationDirection: AnimationDirection;
}

export const useAnimationTimingFunction = (options: UseAnimationTimingFunctionOptions): EasingFunction => {
  const {
    animationTimingFunction = AnimationTimingFunction.Ease,
    animationType,
    animationDirection,
  }: UseAnimationTimingFunctionOptions = options;

  const mapEasingFunction: EasingFunctionTypeMapper = useEasingFunctionTypeMapper();
  const fixLinearDirection: FixDirection<LinearEasingFunction> = useLinearDirection(animationDirection);
  const fixCubicBezierDirection: FixDirection<CubicBezierEasingFunction> = useCubicBezierDirection(animationDirection);
  const fixStepsDirection: FixDirection<StepsEasingFunction> = useStepsDirection(animationDirection);

  const isExtendedAnimationTimingFunction: boolean = [...animationTimingFunction.keys()].intersects(AnimationKey.values<AnimationKey>());

  const animationKey: AnimationKey =
    animationType === AnimationType.Horizontal ? AnimationKey.HorizontalAnimation : AnimationKey.VerticalAnimation;

  const { [animationKey]: easingFunction = AnimationTimingFunction.Ease }: ExtendedAnimationTimingFunction =
    animationTimingFunction.matches<UnknownAnimationTimingFunction, ExtendedAnimationTimingFunction>(isExtendedAnimationTimingFunction)
      ? animationTimingFunction
      : { horizontalAnimation: animationTimingFunction, verticalAnimation: animationTimingFunction };

  // prettier-ignore
  return mapEasingFunction<EasingFunction, OrReadOnly<LinearEasingFunction>, OrReadOnly<CubicBezierEasingFunction>, OrReadOnly<StepsEasingFunction>>(
    [fixLinearDirection, fixCubicBezierDirection, fixStepsDirection], 
    easingFunction,
  );
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
  animationType: AnimationType;
  animationDuration?: AnimationDuration | TotalAnimationDuration;
  numberOfAnimations: AnimationNumber;
}

export const useAnimationDuration = (options: UseAnimationDurationOptions): Tuple<number, Integer.Four> => {
  const { animationType, animationDuration = {}, numberOfAnimations }: UseAnimationDurationOptions = options;

  // prettier-ignore
  const fromAnimationDuration = ({ horizontalAnimation = Integer.TwoThousand, verticalAnimation = Integer.FiveThousand }: AnimationDuration): [number, number] => [
    numberOfAnimations === AnimationNumber.One ? Integer.Zero : horizontalAnimation,
    verticalAnimation,
  ];

  // prettier-ignore
  const fromTotalAnimationDuration = ({ animationDuration = Integer.SixThousand, ratio = Integer.Five / Integer.Two }: TotalAnimationDuration): [number, number] =>
    (numberOfAnimations === AnimationNumber.One ? Integer.Zero : animationDuration / (ratio + numberOfAnimations - Integer.One))
      .pipe<number, [number, number]>((horizontalAnimationDuration: number): [number, number] => [
        horizontalAnimationDuration,
        ratio === Integer.Zero ? Integer.Zero : animationDuration - horizontalAnimationDuration * (numberOfAnimations - Integer.One),
      ]);

  const isAnimationDuration: boolean =
    !animationDuration.keys().length || animationDuration.keys().intersects(AnimationKey.values<AnimationKey>());

  const [horizontalAnimationDuration, verticalAnimationDuration]: [number, number] =
    numberOfAnimations === AnimationNumber.Zero
      ? [Integer.Zero, Integer.Zero]
      : animationDuration.matches<AnimationDuration | TotalAnimationDuration, AnimationDuration>(isAnimationDuration)
        ? fromAnimationDuration(animationDuration)
        : fromTotalAnimationDuration(animationDuration);

  const currentAnimationDuration: number = AnimationType.values<AnimationType>()
    .zip<Tuple<AnimationType, Integer.Three>, [number, number, number]>(
      Integer.Zero,
      horizontalAnimationDuration,
      verticalAnimationDuration,
    )
    .find(([animation]: [AnimationType, number]): boolean => animation === animationType)!
    .last();

  const totalAnimationDuration: number = [AnimationNumber.Zero, AnimationNumber.One, AnimationNumber.Two, AnimationNumber.Three]
    .zip<Tuple<AnimationNumber, Integer.Four>, Tuple<number, Integer.Four>>(
      Integer.Zero,
      verticalAnimationDuration,
      horizontalAnimationDuration + verticalAnimationDuration,
      Integer.Two * horizontalAnimationDuration + verticalAnimationDuration,
    )
    .find(([animationNumber]: [AnimationNumber, number]): boolean => animationNumber === numberOfAnimations)!
    .last();

  return [currentAnimationDuration, horizontalAnimationDuration, verticalAnimationDuration, totalAnimationDuration];
};

type BaseView<T extends object = object, U = unknown> = {
  [K in keyof StyledView<Styled, T, U> as Uncapitalize<Assert<Strip<K, Styled>, Capitalize<ViewKey>>>]: StyledView<Styled, T, U>[K];
};

export interface View<T extends object = object, U = unknown> extends BaseView<T, U> {
  viewProps?: T;
}

export type StyledViewWithProps<T extends Styled, U extends object, V> = Partial<U> & StyledView<T, U, V>;

// prettier-ignore
type StyledViewTypes<
  K extends object, L, M extends object, N, O extends object, P, Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z
> = [
  [Styled.Container, K, L],
  [Styled.Character, M, N],
  [Styled.Digit, O, P],
  [Styled.Separator, Q, R],
  [Styled.DecimalSeparator, S, T],
  [Styled.DigitGroupSeparator, U, V],
  [Styled.Negative, W, X],
  [Styled.Invalid, Y, Z],
];

type ViewTypeMap<T extends ViewType, U extends Styled, V extends object, W> = Switch<
  T,
  [
    [ViewType.BaseView, BaseView<V, W>],
    [ViewType.View, Optional<View<V, W>>],
    [ViewType.StyledView, StyledView<U, V, W>],
    [ViewType.StyledViewWithProps, StyledViewWithProps<U, V, W>],
  ]
>;

// prettier-ignore
export type ViewTuple<
  F extends ViewType, G extends object, H, I extends object, J, K extends object, L, M extends object, N, O extends object, P, Q extends object, R, S extends object, T, U extends object, V, W extends unknown[] = [],
> = When<
  [W[Key.Length], StyledViewTypes<G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V>[Key.Length]],
  W,
  StyledViewTypes<G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V>[W[Key.Length]] extends [infer X extends Styled, infer Y extends object, infer Z]
    ? ViewTuple<F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, [...W, ViewTypeMap<F, X, Y, Z>]>
    : never
>;

export const useStyledView = <
  K extends object,
  L,
  M extends object,
  N,
  O extends object,
  P,
  Q extends object,
  R,
  S extends object,
  T,
  U extends object,
  V,
  W extends object,
  X,
  Y extends object,
  Z,
>(
  options: ViewTuple<ViewType.View, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>,
): ViewTuple<ViewType.StyledViewWithProps, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z> => {
  // prettier-ignore
  const mapView = ([{ viewProps, ...restView } = {}, styledComponent]: [
    ViewTuple<ViewType.View, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number],
    Styled,
  ]): UnionProduct<ViewTuple<ViewType.StyledView, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number], Optional<K | M | O | Q | S | U | W | Y>> => {
    const mapEntry = ([key, value]: [
      string,
      ValueOf<ViewTuple<ViewType.BaseView, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]>,
    ]): [string, ValueOf<ViewTuple<ViewType.StyledView, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]>] => [
      `${styledComponent}${key.capitalize()}`,
      value,
    ];

    const styledView: ViewTuple<ViewType.StyledView, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number] = restView.map<
      ValueOf<ViewTuple<ViewType.BaseView, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]>,
      ValueOf<ViewTuple<ViewType.StyledView, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]>
    >(mapEntry);

    return { ...styledView, ...viewProps };
  };

  // prettier-ignore
  return options
    .zip<Tuple<Styled, Integer.Eight>>(...Styled.values<Styled, Tuple<Styled, Integer.Eight>>())
    .map<
      UnionProduct<ViewTuple<ViewType.StyledView, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number], Optional<K | M | O | Q | S | U | W | Y>>,
      ViewTuple<ViewType.StyledViewWithProps, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>
    >(mapView);
};

interface UseNumberOfDigitGroupSeparatorsOptions {
  precision: number;
  digitGroupSeparator: DigitGroupSeparatorCharacter;
}

// prettier-ignore
const useNumberOfDigitGroupSeparators = ({ precision, digitGroupSeparator }: UseNumberOfDigitGroupSeparatorsOptions): ((numberOfDigits: number) => number) =>
  (numberOfDigits: number): number => [numberOfDigits - Math.max(precision, Integer.Zero), Math.max(precision, Integer.Zero)]
    .when(digitGroupSeparator !== DigitGroupSeparatorCharacter.None)
    .map<number>((quantity: number): number => Math.trunc((quantity - Integer.One) / Integer.Three))
    .reduce(Number.sum, Integer.Zero);

interface UseCharacterIndexFunctionsOptions {
  precision: number;
  digitGroupSeparator: DigitGroupSeparatorCharacter;
}

export type CharacterIndexFunction = (index: number, length: number) => number;

export interface CharacterIndexFunctions {
  getCharacterIndex: CharacterIndexFunction;
  getCharacterSeparatorIndex: CharacterIndexFunction;
  getSeparatorIndex: CharacterIndexFunction;
  getDigitGroupSeparatorIndex: CharacterIndexFunction;
}

export const useCharacterIndexFunctions = (options: UseCharacterIndexFunctionsOptions): CharacterIndexFunctions => {
  const { precision, digitGroupSeparator }: UseCharacterIndexFunctionsOptions = options;

  const { negativeCharacterLength }: NumbersTransitionTheme = useTheme();

  const getIndexWithoutDigitGroupSeparators = (index: number, length: number): number =>
    index >= length - Math.max(precision, Integer.Zero) ? Integer.One : Integer.Zero;

  const getIndexWithDigitGroupSeparators = (index: number, length: number): number =>
    Math.trunc(
      (index + ((Integer.Three - ((length - Math.max(precision, Integer.Zero)) % Integer.Three)) % Integer.Three)) / Integer.Three,
    );

  const getIndex: (index: number, length: number) => number =
    digitGroupSeparator === DigitGroupSeparatorCharacter.None ? getIndexWithoutDigitGroupSeparators : getIndexWithDigitGroupSeparators;

  const getCharacterIndex = (index: number, length: number): number => negativeCharacterLength + index + getIndex(index, length);
  const getCharacterSeparatorIndex = (index: number, length: number): number => getCharacterIndex(index, length) - Integer.One;
  const getSeparatorIndex = (index: number, length: number): number => getIndex(index, length) - Integer.One;
  const getDigitGroupSeparatorIndex = (index: number, length: number): number =>
    getSeparatorIndex(index, length) - Number(length - index < precision);

  return { getCharacterIndex, getCharacterSeparatorIndex, getSeparatorIndex, getDigitGroupSeparatorIndex };
};

interface UseElementsLengthOptions {
  precision: number;
  digitGroupSeparator: DigitGroupSeparatorCharacter;
  isValueValid: boolean;
  currentValue: bigint;
  hasSignChanged: boolean;
  numberOfDigits: number;
}

export const useElementsLength = (options: UseElementsLengthOptions): ElementsLength => {
  const { precision, digitGroupSeparator, isValueValid, currentValue, hasSignChanged, numberOfDigits }: UseElementsLengthOptions = options;

  const calculateNumberOfDigitGroupSeparators: (numberOfDigits: number) => number = useNumberOfDigitGroupSeparators({
    precision,
    digitGroupSeparator,
  });

  const invalidLength: number = Number(!isValueValid);
  const negativeCharacterLength: number = Number(isValueValid && (hasSignChanged || currentValue < Integer.Zero));
  const decimalSeparatorLength: number = Number(isValueValid && precision > Integer.Zero);
  const digitGroupSeparatorsLength: number = isValueValid ? calculateNumberOfDigitGroupSeparators(numberOfDigits) : Integer.Zero;
  const separatorsLength: number = [digitGroupSeparatorsLength, decimalSeparatorLength].reduce(Number.sum);
  const digitsLength: number = isValueValid ? numberOfDigits : Integer.Zero;
  const charactersLength: number = [digitsLength, separatorsLength, negativeCharacterLength].reduce(Number.sum);

  return {
    charactersLength,
    digitsLength,
    separatorsLength,
    decimalSeparatorLength,
    digitGroupSeparatorsLength,
    negativeCharacterLength,
    invalidLength,
  };
};

interface UseRenderNegativeElementOptions {
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode;
  animationTransition: AnimationTransition;
  previousValueOnStart: bigint;
  previousValueOnEnd: bigint;
  currentValue: bigint;
  hasSignChanged: boolean;
  restartAnimation: boolean;
  renderAnimation: boolean;
  numberOfAnimations: AnimationNumber;
  animationType: AnimationType;
}

export const useRenderNegativeElement = (options: UseRenderNegativeElementOptions): boolean => {
  const {
    negativeCharacterAnimationMode,
    animationTransition,
    previousValueOnStart,
    previousValueOnEnd,
    currentValue,
    hasSignChanged,
    restartAnimation,
    renderAnimation,
    numberOfAnimations,
    animationType,
  }: UseRenderNegativeElementOptions = options;

  const renderNegativeElementForNotMultiCharacterAnimationMode: boolean = ![
    renderAnimation,
    animationType !== AnimationType.Horizontal,
    negativeCharacterAnimationMode === NegativeCharacterAnimationMode.Multi,
  ].every(Function.identity<boolean>);

  const renderNegativeElementForThreeAnimations: boolean = [
    animationType === AnimationType.Horizontal,
    numberOfAnimations === AnimationNumber.Three,
    previousValueOnEnd < currentValue === (animationTransition === AnimationTransition.None),
  ].every(Function.identity<boolean>);

  const renderNegativeElement: boolean = [
    [!hasSignChanged, currentValue < Integer.Zero, renderNegativeElementForNotMultiCharacterAnimationMode].every(
      Function.identity<boolean>,
    ),
    renderNegativeElementForThreeAnimations,
  ].some(Function.identity<boolean>);

  return restartAnimation ? previousValueOnStart < Integer.Zero : renderNegativeElement;
};

interface UseRenderHorizontalAnimationNegativeElementOptions {
  animationTransition: AnimationTransition;
  previousValue: bigint;
  currentValue: bigint;
  hasSignChanged: boolean;
  numberOfAnimations: AnimationNumber;
}

export const useRenderHorizontalAnimationNegativeElement = ({
  animationTransition,
  previousValue,
  currentValue,
  hasSignChanged,
  numberOfAnimations,
}: UseRenderHorizontalAnimationNegativeElementOptions): boolean =>
  [
    hasSignChanged,
    [
      numberOfAnimations === AnimationNumber.Two,
      previousValue < currentValue === (animationTransition === AnimationTransition.SecondToThird),
    ].some(Function.identity<boolean>),
  ].every(Function.identity<boolean>);

interface UseRenderVerticalAnimationNegativeElementOptions {
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode;
  currentValue: bigint;
  hasSignChanged: boolean;
}

export const useRenderVerticalAnimationNegativeElement = ({
  negativeCharacterAnimationMode,
  currentValue,
  hasSignChanged,
}: UseRenderVerticalAnimationNegativeElementOptions): boolean =>
  [
    hasSignChanged,
    [currentValue < Integer.Zero, negativeCharacterAnimationMode === NegativeCharacterAnimationMode.Multi].every(
      Function.identity<boolean>,
    ),
  ].some(Function.identity<boolean>);

interface UseNegativeElementAnimationVisibilitiesOptions {
  animationDigits: number[][];
  hasSignChanged: boolean;
}

// prettier-ignore
export const useNegativeElementAnimationVisibilities = ({ animationDigits, hasSignChanged }: UseNegativeElementAnimationVisibilitiesOptions): boolean[] =>
  animationDigits
    .find(({ length, ...digits }: number[]): boolean => length > Integer.One || !!digits[Integer.Zero])!
    .map<boolean>((digit: number, index: number, digits: number[]): boolean => !index || (!!digit && digits[index - Integer.One] > digit) || !hasSignChanged);

type Solve<T extends EasingFunction> = (easingFunction: T, outputValue: number) => number[];

const useLinearSolver = (): Solve<LinearEasingFunction> => {
  const findPrevious = (index: number, value: OrArray<number>, currentIndex: number): boolean =>
    currentIndex < index && Array.isArray<number>(value);

  const findNext = (index: number, value: OrArray<number>, currentIndex: number): boolean =>
    currentIndex > index && Array.isArray<number>(value);

  const calculateProgressInput = (index: number, array: OrArray<number>[], startIndex: number, endIndex: number): number =>
    [
      (Array.toArray<number>(array[endIndex]).at(Integer.One)! / Integer.OneHundred) * (index - startIndex),
      (Array.toArray<number>(array[startIndex]).last() / Integer.OneHundred) * (endIndex - index),
    ].reduce((first: number, second: number): number => (first + second) / (endIndex - startIndex));

  const fillProgressInput = (index: number, array: OrArray<number>[]): number =>
    [
      array.findLastIndex(findPrevious.bindArgs<(...args: [number, OrArray<number>, number]) => boolean, Integer.One>(index)),
      array.findIndex(findNext.bindArgs<(...args: [number, OrArray<number>, number]) => boolean, Integer.One>(index)),
    ].reduce(calculateProgressInput.bindArgs<(...args: [number, OrArray<number>[], number, number]) => number, Integer.Two>(index, array));

  const normalizePoints = ([first, second, third]: number[]): [number, number][] => [
    [first, second / Integer.OneHundred],
    ...(third ? [[first, third / Integer.OneHundred] satisfies [number, number]] : []),
  ];

  const normalize = (value: OrArray<number>, index: number, array: OrArray<number>[]): [number, number][] =>
    Array.isArray<number>(value) ? normalizePoints(value) : [[value, fillProgressInput(index, array)]];

  const filterInterval = (out: number, index: number, array: [number, number][]): unknown =>
    index &&
    array
      .map<number>(Array.first<[number, number]>)
      .sort(Number.subtract)
      .pipe<boolean>(([first, second]: number[]): boolean => (index === Integer.One ? out >= first : out > first) && out <= second);

  // prettier-ignore
  const findIntervals = (out: number, accumulator: [number, number][][], _: [number, number], index: number, array: [number, number][]): [number, number][][] => [
    ...accumulator,
    ...[[array[index - Integer.One], array[index]]].filter(
      filterInterval.bindArgs<(...args: [number, number, [number, number][]]) => unknown, Integer.Two>(out, index),
    ),
  ];

  const findSolutions = (outputValue: number, [[firstY, firstX], [secondY, secondX]]: [[number, number], [number, number]]): number =>
    ((secondY - firstY) / (secondX - firstX))
      .pipe<number, [number, number]>((slope: number): [number, number] => [slope, firstY - slope * firstX])
      .reduce((slope: number, intercept: number): number => (Number.isFinite(slope) && slope ? (outputValue - intercept) / slope : firstX));

  // prettier-ignore
  return (easingFunction: LinearEasingFunction, outputValue: number): number[] =>
    [
      [easingFunction.first(), Integer.Zero],
      ...easingFunction.slice(Integer.One, Integer.MinusOne),
      [easingFunction.last(), Integer.OneHundred],
    ]
      .flatMap<[number, number]>(normalize)
      .reduce<[number, number][][], [[number, number], [number, number]][]>(
        findIntervals.bindArgs<(...args: [number, [number, number][][], [number, number], number, [number, number][]]) => [number, number][][], Integer.One>(outputValue),
        [],
      )
      .map<number>(findSolutions.bindArgs<(...args: [number, [[number, number], [number, number]]]) => number, Integer.One>(outputValue));
};

const useCubicBezierSolver = (): Solve<CubicBezierEasingFunction> => {
  const mapControlPoints = (_: [number, number], index: number, array: [number, number][]): [number, number] =>
    array.map<number, Integer.Two>((tuple: [number, number]): number => tuple[index]);

  const calculateCoefficients = ([firstPoint, secondPoint]: [number, number]): [number, number, number] => [
    Integer.Three * (firstPoint - secondPoint) + Integer.One,
    Integer.Three * (secondPoint - Integer.Two * firstPoint),
    Integer.Three * firstPoint,
  ];

  const cubicBezierFunction = (tuple: [number, number], value: number): number =>
    calculateCoefficients(tuple)
      .map<number>((coefficient: number, index: number, { length }: number[]): number => coefficient * value ** (length - index))
      .reduce(Number.sum);

  const calculateCubicCoefficients = (outputValue: number, tuple: [number, number]): Tuple<number, Integer.Four> => [
    ...calculateCoefficients(tuple),
    -outputValue,
  ];

  const calculateFirstDepressedCoefficient = ([first, second, third]: Tuple<number, Integer.Four>): number =>
    (Integer.Three * first * third - second ** Integer.Two) / (Integer.Three * first ** Integer.Two);

  const calculateSecondDepressedCoefficient = ([first, second, third, fourth]: Tuple<number, Integer.Four>): number =>
    (Integer.Two * second ** Integer.Three - Integer.Nine * first * second * third + Integer.TwentySeven * first ** Integer.Two * fourth) /
    (Integer.TwentySeven * first ** Integer.Three);

  const calculateDepressedCoefficients = (coefficients: Tuple<number, Integer.Four>): [Tuple<number, Integer.Four>, [number, number]] => [
    coefficients,
    [calculateFirstDepressedCoefficient(coefficients), calculateSecondDepressedCoefficient(coefficients)],
  ];

  const calculateDiscriminant = ([coefficients, [first, second]]: [Tuple<number, Integer.Four>, [number, number]]): [
    Tuple<number, Integer.Four>,
    [number, number],
    number,
  ] => [coefficients, [first, second], (first / Integer.Three) ** Integer.Three + (second / Integer.Two) ** Integer.Two];

  const solveForOneRoot = (
    [first, second]: Tuple<number, Integer.Four>,
    [, secondDepressed]: [number, number],
    discriminant: number,
  ): number[] => [
    [Integer.MinusOne, Integer.One]
      .map<number>((multiplier: number): number => Math.cbrt(-secondDepressed / Integer.Two + multiplier * Math.sqrt(discriminant)))
      .reduce(Number.sum) -
      second / (Integer.Three * first),
  ];

  const solveForRepeatedRoots = (
    [first, second]: Tuple<number, Integer.Four>,
    [firstDepressed, secondDepressed]: [number, number],
  ): number[] =>
    firstDepressed
      ? [Integer.MinusOne, Integer.MinusOne, Integer.Two].map<number>(
          (multiplier: number): number => multiplier * Math.cbrt(-secondDepressed / Integer.Two) - second / (Integer.Three * first),
        )
      : [-second / (Integer.Three * first)];

  const calculateThreeRootsAcos = (firstDepressed: number, secondDepressed: number): number =>
    Math.acos(((Integer.Three * secondDepressed) / (Integer.Two * firstDepressed)) * Math.sqrt(-Integer.Three / firstDepressed));

  const calculateThreeRootsCos = (firstDepressed: number, secondDepressed: number, index: number): number =>
    Math.cos(
      (Integer.One / Integer.Three) * calculateThreeRootsAcos(firstDepressed, secondDepressed) -
        (Integer.Two * index * Math.PI) / Integer.Three,
    );

  const solveForThreeRoots = (
    [first, second]: Tuple<number, Integer.Four>,
    [firstDepressed, secondDepressed]: [number, number],
  ): number[] =>
    Array.range(Integer.Three).map<number>(
      (index: number): number =>
        Integer.Two * Math.sqrt(-firstDepressed / Integer.Three) * calculateThreeRootsCos(firstDepressed, secondDepressed, index) -
        second / (Integer.Three * first),
    );

  // prettier-ignore
  const solveCubicBezier = ([coefficients, depressedCoefficients, discriminant]: [Tuple<number, Integer.Four>, [number, number], number]): number[] =>
    [
      (disc: number): boolean => Math.abs(disc) <= Integer.Ten ** Integer.MinusFifteen,
      (disc: number): boolean => disc > Integer.Zero,
      (disc: number): boolean => disc < Integer.Zero,
    ]
      .zip<Tuple<(disc: number) => boolean, Integer.Three>, Tuple<(...args: [Tuple<number, Integer.Four>, [number, number], number]) => number[], Integer.Three>>(
        solveForRepeatedRoots, 
        solveForOneRoot, 
        solveForThreeRoots,
      )
      .find(([condition]: [(disc: number) => boolean, (...args: [Tuple<number, Integer.Four>, [number, number], number]) => number[]]): boolean => condition(discriminant))!
      .last()
      .call<undefined, [Tuple<number, Integer.Four>, [number, number], number], number[]>(undefined, coefficients, depressedCoefficients, discriminant);

  // prettier-ignore
  return (easingFunction: CubicBezierEasingFunction, outputValue: number): number[] =>
    easingFunction
      .map<[number, number], CubicBezierEasingFunction>(mapControlPoints)
      .pipe<number[]>(([xAxisPoints, yAxisPoints]: CubicBezierEasingFunction): number[] =>
        yAxisPoints
          .pipeEach<[Tuple<number, Integer.Four>, [Tuple<number, Integer.Four>, [number, number]], [Tuple<number, Integer.Four>, [number, number], number], number[]]>(
            calculateCubicCoefficients.bindArgs<(...args: [number, [number, number]]) => Tuple<number, Integer.Four>, Integer.One>(outputValue),
            calculateDepressedCoefficients,
            calculateDiscriminant,
            solveCubicBezier,
          )
          .map<number>((value: number): number => Math.roundTo(value, Integer.Six))
          .filter((solution: number): boolean => solution >= Integer.Zero && solution <= Integer.One)
          .sort(Number.subtract)
          .filter((_: number, index: number, { length }: number[]): boolean => !index || length !== Integer.Two)
          .map<number>(cubicBezierFunction.bindArgs<(...args: [[number, number], number]) => number, Integer.One>(xAxisPoints)),
      );
};

// prettier-ignore
const useStepsSolver = (): Solve<StepsEasingFunction> => ({ steps, stepPosition }: StepsEasingFunction, outputValue: number): number[] => [
  StepPosition.values<StepPosition>()
    .zip<Tuple<StepPosition, Integer.Four>, Tuple<number, Integer.Four>>(
      Math.floor(outputValue * steps) / steps,
      Math.ceil(outputValue * steps) / steps,
      Math.ceil(outputValue * (steps - Integer.One)) / steps,
      Math.floor(outputValue * (steps + Integer.One)) / steps,
    )
    .find(([position]: [StepPosition, number]): boolean => position === stepPosition)!
    .last(),
];

interface UseNegativeElementAnimationTimingFunctionOptions {
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode;
  animationVisibilities: boolean[];
}

export const useNegativeElementAnimationTimingFunction = (
  options: UseNegativeElementAnimationTimingFunctionOptions,
): LinearEasingFunction => {
  const { negativeCharacterAnimationMode, animationVisibilities }: UseNegativeElementAnimationTimingFunctionOptions = options;

  const { animationTimingFunction }: NumbersTransitionTheme = useTheme();

  const mapEasingFunction: EasingFunctionTypeMapper = useEasingFunctionTypeMapper();
  const solveLinear: Solve<LinearEasingFunction> = useLinearSolver();
  const solveCubicBezier: Solve<CubicBezierEasingFunction> = useCubicBezierSolver();
  const solveSteps: Solve<StepsEasingFunction> = useStepsSolver();

  const solve = (input: number): number[] =>
    mapEasingFunction<number[], LinearEasingFunction, CubicBezierEasingFunction, StepsEasingFunction, [number]>(
      [solveLinear, solveCubicBezier, solveSteps],
      animationTimingFunction,
      input,
    );

  const mapToLinear = (increment: number, solution: number, index: number): [number, number][] =>
    Array.range(Integer.Two).map<[number, number]>((value: number): [number, number] => [
      increment ^ ((index + value) % Integer.Two) ? Integer.One / animationVisibilities.length : (index + value) % Integer.Two,
      solution * Integer.OneHundred,
    ]);

  const flatMapToLinear = (values: number[], index: number): [number, number][] =>
    values.flatMap<[number, number]>(mapToLinear.bindArgs<(...args: [number, number, number]) => [number, number][], Integer.One>(index));

  const points: [number, number][] = [animationVisibilities.lastIndexOf(true), animationVisibilities.indexOf(false)]
    .when(negativeCharacterAnimationMode === NegativeCharacterAnimationMode.Single)
    .mapEach<[number, number[]]>((input: number): number => input / (animationVisibilities.length - Integer.One), solve)
    .flatMap<[number, number]>(flatMapToLinear)
    .sort(([, first]: [number, number], [, second]: [number, number]): number => first - second);

  return [Integer.Zero, ...points, Integer.One];
};

interface UseHorizontalAnimationDigitsOptions {
  animationTransition: AnimationTransition;
  previousValueDigits: number[];
  currentValueDigits: number[];
  previousValue: bigint;
  currentValue: bigint;
  numberOfDigitsDifference: number;
}

export const useHorizontalAnimationDigits = (options: UseHorizontalAnimationDigitsOptions): number[] => {
  const {
    animationTransition,
    previousValueDigits,
    currentValueDigits,
    previousValue,
    currentValue,
    numberOfDigitsDifference,
  }: UseHorizontalAnimationDigitsOptions = options;

  const { numberOfAnimations, animationDirection }: NumbersTransitionTheme = useTheme();

  // prettier-ignore
  return [
    ...Array<number>(numberOfDigitsDifference)
      .when(numberOfAnimations === AnimationNumber.Two || previousValue < currentValue === (animationTransition === AnimationTransition.None))
      .fill(Integer.Zero),
    ...(animationDirection === AnimationDirection.Normal ? previousValueDigits : currentValueDigits),
  ];
};

interface UseHorizontalAnimationWidthsOptions {
  precision: number;
  digitGroupSeparator: DigitGroupSeparatorCharacter;
  animationTransition: AnimationTransition;
  previousValue: bigint;
  currentValue: bigint;
  minNumberOfDigits: number;
  maxNumberOfDigits: number;
  ref: RefObject<Nullable<HTMLDivElement>>;
}

export const useHorizontalAnimationWidths = (options: UseHorizontalAnimationWidthsOptions): [number, number] => {
  const {
    precision,
    digitGroupSeparator,
    animationTransition,
    previousValue,
    currentValue,
    minNumberOfDigits,
    maxNumberOfDigits,
    ref,
  }: UseHorizontalAnimationWidthsOptions = options;

  const [animationStartWidth, setAnimationStartWidth]: ReactState<number> = useState<number>(Integer.Zero);
  const { numberOfAnimations }: NumbersTransitionTheme = useTheme();

  const calculateNumberOfDigitGroupSeparators: (numberOfDigits: number) => number = useNumberOfDigitGroupSeparators({
    precision,
    digitGroupSeparator,
  });

  const numberOfDigits: number =
    numberOfAnimations === AnimationNumber.Two || previousValue < currentValue === (animationTransition === AnimationTransition.None)
      ? minNumberOfDigits
      : maxNumberOfDigits;

  const startIndex: number = [
    ref.current?.children.length ?? Integer.Zero,
    numberOfDigits,
    calculateNumberOfDigitGroupSeparators(numberOfDigits),
    Number(precision > Integer.Zero),
  ].reduce(Number.subtract);

  const calculateElementWidth = useCallback<(element: HTMLElement) => number>(
    ({
      computedStyle: { boxSizing, width, paddingLeft, paddingRight, borderLeftWidth, borderRightWidth, marginLeft, marginRight },
    }: HTMLElement): number =>
      [
        width,
        marginLeft,
        marginRight,
        ...(boxSizing === BoxSizing.BorderBox ? [] : [paddingLeft, paddingRight, borderLeftWidth, borderRightWidth]),
      ]
        .map<number>(({ number }: string): number => number)
        .reduce(Number.sum),
    [],
  );

  const calculateAnimationStartWidth = useCallback<() => number>(
    (): number =>
      [...(ref.current?.children ?? [])]
        .filter<HTMLElement>((child: Element, index: number): child is HTMLElement => index >= startIndex && child instanceof HTMLElement)
        .map<number>(calculateElementWidth)
        .reduce(Number.sum),
    [ref, startIndex, calculateElementWidth],
  );

  useLayoutEffect((): void => setAnimationStartWidth(calculateAnimationStartWidth()), [calculateAnimationStartWidth]);

  return [animationStartWidth, ref.current?.computedStyle.width.number ?? Integer.Zero];
};

export interface AnimationAlgorithm {
  incrementThreshold?: number;
  numberOfDigitsIncrease?: number;
}

interface UseVerticalAnimationDigitsOptions {
  animationAlgorithm?: AnimationAlgorithm;
  maxNumberOfDigits: number;
  previousValue: bigint;
  currentValue: bigint;
}

export const useVerticalAnimationDigits = (options: UseVerticalAnimationDigitsOptions): number[][] => {
  const {
    animationAlgorithm: { incrementThreshold = Integer.Fourteen, numberOfDigitsIncrease = Integer.Seven } = {},
    maxNumberOfDigits,
    previousValue,
    currentValue,
  }: UseVerticalAnimationDigitsOptions = options;

  // prettier-ignore
  const createDigitValues = ([first, second]: Tuple<[bigint, bigint][], Integer.Two>, index: number): Tuple<[bigint, bigint][], Integer.Two> =>
    [previousValue, currentValue]
      .map<bigint, Integer.Two>((val: bigint): bigint => val / BigInt(Integer.Ten) ** BigInt(maxNumberOfDigits - index - Integer.One))
      .sort((first: bigint, second: bigint): number => (first < second ? Integer.MinusOne : Number(first > second)))
      .pipe<Tuple<[bigint, bigint][], Integer.Two>>(([start, end]: [bigint, bigint]): Tuple<[bigint, bigint][], Integer.Two> =>
        end - start < incrementThreshold ? [[...first, [start, end]], second] : [first, [...second, [start, end]]],
      );

  const calculate = (start: bigint, end: bigint, _: number, index: number, { length }: number[]): bigint =>
    (NumberPrecision.Value * (start * BigInt(length - index) + end * BigInt(index))) / BigInt(length);

  const round = (value: bigint): bigint =>
    value / NumberPrecision.Value + BigInt(value - (value / NumberPrecision.Value) * NumberPrecision.Value >= NumberPrecision.HalfValue);

  const incrementValues = ([start, end]: [bigint, bigint]): number[] =>
    Array.range(Number(end - start) + Integer.One).mapEach<[bigint, number]>(
      (value: number): bigint => start + BigInt(value),
      ({ digit }: bigint): number => digit,
    );

  const generateValues = ([start, end]: [bigint, bigint], index: number): number[] =>
    Array.range(incrementThreshold + numberOfDigitsIncrease * index)
      .mapEach<[bigint, bigint, number]>(
        calculate.bindArgs<(...args: [bigint, bigint, number, number, number[]]) => bigint, Integer.Two>(start, end),
        round,
        ({ digit }: bigint): number => digit,
      )
      .pipe<number[]>((numbers: number[]): number[] => (numbers.last() === end.digit ? numbers : [...numbers, end.digit]));

  const mapDigitValues = (algorithmValuesArray: [bigint, bigint][], index: number): number[][] =>
    algorithmValuesArray.map<number[]>(index ? generateValues : incrementValues);

  return Array.range(maxNumberOfDigits)
    .reduce<Tuple<[bigint, bigint][], Integer.Two>>(createDigitValues, [[], []])
    .map<number[][]>(mapDigitValues)
    .flat<[number[][], number[][]], Integer.One>();
};

export interface ChildrenProps {
  children?: ReactNode;
}

interface KeyProps {
  key?: string;
}

interface IterableProps extends KeyProps, ChildrenProps {}
type ComponentProps<T extends object> = T & IterableProps;
type FunctionalComponent<T extends object> = (T extends object ? FC<ComponentProps<T>> : FC<IterableProps>) | string;

export type ElementKeyMapper<T extends ReactNode> = (child: T, index: number, children: T[]) => ReactElement;

export const useElementKeyMapper =
  <T extends ReactNode, U extends object>(
    Component: FunctionalComponent<U>,
    props?: OrFunction<[T, number, T[]], U>,
  ): ElementKeyMapper<T> =>
  (child: T, index: number, { length, ...array }: T[]): ReactElement => (
    <Component
      key={`${Component.toString()}${`${index + Integer.One}`.padStart(`${length}`.length, `${Integer.Zero}`)}`}
      {...props?.callOrGet<[T, number, T[]], U>(child, index, { ...array, length })}
    >
      {child}
    </Component>
  );
