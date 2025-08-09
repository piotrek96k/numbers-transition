import { ActionDispatch, Dispatch, FC, ReactElement, RefObject, SetStateAction, useEffect, useReducer, useRef, useState } from 'react';
import { useTheme } from 'styled-components';
import {
  AnimationDirection,
  AnimationDurationValue,
  AnimationInterruptionMode,
  AnimationKey,
  AnimationNumber,
  AnimationTimingFunction,
  AnimationTransition,
  AnimationType,
  Character,
  EquationSolver,
  Integer,
  NegativeCharacterAnimationMode,
  NumberPrecision,
  RegularExpression,
  Styled,
  TotalAnimationDurationValue,
  ViewKey,
} from './NumbersTransition.enums';
import { AnimationTimingFunctionTuple, ElementsLength, NumbersTransitionTheme, StyledView } from './NumbersTransition.styles';
import {
  BigDecimal,
  GenericReactNode,
  MappedTuple,
  OrReadOnly,
  Slice,
  TupleIndex,
  TypeOf,
  UncheckedBigDecimal,
} from './NumbersTransition.types';

type ConditionalRerenderFunction = (condition: boolean) => void;

type UseConditionalRerender = () => ConditionalRerenderFunction;

const useConditionalRerender: UseConditionalRerender = (): ConditionalRerenderFunction => {
  const [, rerender]: [number, ActionDispatch<[]>] = useReducer<number, []>((value: number): number => value + Integer.One, Integer.Zero);

  return (condition: boolean): void => (condition ? rerender() : undefined);
};

type UseTimeout = (time: number) => boolean;

export const useTimeout: UseTimeout = (time: number): boolean => {
  const [timedOut, setTimedOut]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);

  useEffect((): (() => void) => {
    const timeout: NodeJS.Timeout = setTimeout((): void => setTimedOut(true), time);
    return (): void => clearTimeout(timeout);
  }, [time]);

  return timedOut;
};

export type ValidationTuple = [BigDecimal, boolean];

type UseValidation = (value?: UncheckedBigDecimal, validValue?: BigDecimal) => ValidationTuple;

export const useValidation: UseValidation = (value?: UncheckedBigDecimal, validValue: BigDecimal = Integer.Zero): ValidationTuple =>
  RegularExpression.BigDecimal.testAny<BigDecimal>(value)
    ? [value, true]
    : typeof value === 'number'
      ? [Number(value).toFixed(Integer.OneHundred), true]
      : [validValue, false];

type UseValue = (
  value: UncheckedBigDecimal | undefined,
  previousValue: BigDecimal,
  animationInterruptionMode?: AnimationInterruptionMode,
) => ValidationTuple;

export const useValue: UseValue = (
  value: UncheckedBigDecimal | undefined,
  previousValue: BigDecimal,
  animationInterruptionMode: AnimationInterruptionMode = AnimationInterruptionMode.Interrupt,
): ValidationTuple => {
  const rerenderIf: ConditionalRerenderFunction = useConditionalRerender();
  const values: RefObject<ValidationTuple[]> = useRef<ValidationTuple[]>([]);
  const validationTuple: ValidationTuple = useValidation(value, values.current.at(Integer.MinusOne)?.[Integer.Zero] ?? previousValue);

  values.current =
    animationInterruptionMode === AnimationInterruptionMode.Continue
      ? values.current.length && values.current.at(Integer.MinusOne)?.equals(validationTuple)
        ? values.current
        : [...values.current, validationTuple]
      : [validationTuple];

  const [validValue, isValueValid]: ValidationTuple = values.current[Integer.Zero];

  const filterInvalidValues = ([, isValid]: ValidationTuple, index: number, { length }: ValidationTuple[]): boolean =>
    isValid || index === length - Integer.One;

  const filterDuplicates = ([value]: ValidationTuple, index: number, array: ValidationTuple[]): boolean =>
    !index || value !== array[index - Integer.One][Integer.Zero];

  useEffect((): void => {
    if (validValue === previousValue || !isValueValid) {
      values.current = values.current.slice(Integer.One).filter(filterInvalidValues).filter(filterDuplicates);
      rerenderIf(!!values.current.length);
    }
  }, [rerenderIf, previousValue, validValue, isValueValid]);

  return [validValue, isValueValid];
};

interface UseAnimationCharactersOptions {
  precision: number;
  values: [BigDecimal, BigDecimal, BigDecimal];
}

type AnimationCharactersTuple = [string[], string[], string[]];

type UseAnimationCharacters = (options: UseAnimationCharactersOptions) => AnimationCharactersTuple;

const useAnimationCharacters: UseAnimationCharacters = (options: UseAnimationCharactersOptions): AnimationCharactersTuple => {
  const { precision, values }: UseAnimationCharactersOptions = options;

  const fillFloatingPoint = (accumulator: string[], currentValue: string, _: number, { length }: string[]) => [
    ...accumulator,
    currentValue,
    ...(length === Integer.One ? [Character.Empty] : []),
  ];

  const reduceFloatingPoint = (integer: string, fraction: string): string => {
    const [start, mid, end, numberOfZeros]: [string, string, string, number] =
      precision > Integer.Zero
        ? [
            integer.replace(Character.Minus, Character.Empty),
            fraction,
            Character.Empty,
            Math.max(precision - fraction.length, Integer.Zero),
          ]
        : [Character.Empty, integer.replace(Character.Minus, Character.Empty), fraction, -precision];

    const digits: string = `${start}${mid.slice(Integer.Zero, precision || mid.length) ?? Integer.Zero}`;
    const restDigits: string = `${mid.slice(precision || mid.length)}${end}`;
    const increase: number =
      BigInt(restDigits) < BigInt(`${Integer.Five}`.padEnd(Math.max(restDigits.length, numberOfZeros), `${Integer.Zero}`))
        ? Integer.Zero
        : Integer.One;
    const value: bigint = (BigInt(digits) + BigInt(increase)) * BigInt(Integer.Ten) ** BigInt(numberOfZeros);

    return [...(integer.match(Character.Minus) ?? []), `${value}`.padStart(precision + Integer.One, `${Integer.Zero}`)].join(
      Character.Empty,
    );
  };

  return values.map<string[], AnimationCharactersTuple>((number: BigDecimal): string[] => [
    ...`${number}`.split(RegularExpression.DotOrComma).reduce<string[]>(fillFloatingPoint, []).reduce(reduceFloatingPoint),
  ]);
};

type UseAnimationDigitsOptions = [string[], string[]];

type AnimationDigitsTuple = [number[], number[]];

type UseAnimationDigits = (options: UseAnimationDigitsOptions) => AnimationDigitsTuple;

const useAnimationDigits: UseAnimationDigits = (options: UseAnimationDigitsOptions): AnimationDigitsTuple =>
  options.map<number[], AnimationDigitsTuple>((characters: string[]): number[] =>
    characters.filter((character: string): boolean => !!character.match(RegularExpression.SingleDigit)).map<number>(Number),
  );

type UseAnimationBigIntsOptions = AnimationCharactersTuple;

type AnimationBigIntsTuple = [bigint, bigint, bigint];

type UseAnimationBigInts = (options: UseAnimationBigIntsOptions) => AnimationBigIntsTuple;

const useAnimationBigInts: UseAnimationBigInts = (options: UseAnimationBigIntsOptions): AnimationBigIntsTuple =>
  options.map<bigint, AnimationBigIntsTuple>((digits: string[]): bigint => BigInt(digits.join(Character.Empty)));

type UseAnimationNumbersOfDigitsOptions = AnimationDigitsTuple;

type AnimationNumbersOfDigitsTuple = [number, number, number];

type UseAnimationNumbersOfDigits = (options: UseAnimationNumbersOfDigitsOptions) => AnimationNumbersOfDigitsTuple;

const useAnimationNumberOfDigits: UseAnimationNumbersOfDigits = (
  options: UseAnimationNumbersOfDigitsOptions,
): AnimationNumbersOfDigitsTuple => {
  const subtract = (first: number, second: number): number => first - second;

  const fillNumberOfDigitsDifference = (accumulator: number[], currentValue: number, index: number): number[] => [
    ...accumulator,
    currentValue,
    ...(index ? [currentValue - accumulator.at(Integer.MinusOne)!] : []),
  ];

  return options
    .map<number, [number, number]>(({ length }: number[]): number => length)
    .sort(subtract)
    .reduce<number[], AnimationNumbersOfDigitsTuple>(fillNumberOfDigitsDifference, []);
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
  const { precision, currentValue, previousValueOnAnimationEnd, previousValueOnAnimationStart }: UseAnimationValuesOptions = options;

  const characters: AnimationCharactersTuple = useAnimationCharacters({
    precision,
    values: [previousValueOnAnimationEnd, previousValueOnAnimationStart, currentValue],
  });

  const digits: AnimationDigitsTuple = useAnimationDigits([characters[Integer.Zero], characters[Integer.Two]]);
  const bigInts: AnimationBigIntsTuple = useAnimationBigInts(characters);
  const numbersOfDigits: AnimationNumbersOfDigitsTuple = useAnimationNumberOfDigits(digits);

  return [digits, bigInts, numbersOfDigits];
};

interface UseAnimationLogicOptions {
  previousValue: BigDecimal;
  value: UncheckedBigDecimal | undefined;
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

type UseAnimationLogic = (options: UseAnimationLogicOptions) => AnimationLogic;

export const useAnimationLogic: UseAnimationLogic = (options: UseAnimationLogicOptions): AnimationLogic => {
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

export type AnimationNumbersTuple = [AnimationNumber, AnimationNumber];

type UseAnimationNumbers = (options: UseAnimationNumbersOptions) => AnimationNumbersTuple;

export const useAnimationNumbers: UseAnimationNumbers = (options: UseAnimationNumbersOptions): AnimationNumbersTuple => {
  const {
    animationTransition,
    previousValueDigits,
    currentValueDigits,
    previousValue,
    currentValue,
    hasSignChanged,
    renderAnimation,
  }: UseAnimationNumbersOptions = options;

  const hasNumberOfDigitsChanged: boolean = previousValueDigits.length !== currentValueDigits.length;
  const hasThreeAnimations: boolean =
    (previousValueDigits.length < currentValueDigits.length && previousValue < currentValue) ||
    (previousValueDigits.length > currentValueDigits.length && previousValue > currentValue);

  const animationNumber: AnimationNumber = renderAnimation
    ? animationTransition === AnimationTransition.SecondToThird
      ? AnimationNumber.Three
      : animationTransition === AnimationTransition.FirstToSecond
        ? AnimationNumber.Two
        : AnimationNumber.One
    : AnimationNumber.Zero;

  const numberOfAnimations: AnimationNumber = renderAnimation
    ? hasSignChanged
      ? hasThreeAnimations
        ? AnimationNumber.Three
        : AnimationNumber.Two
      : hasNumberOfDigitsChanged
        ? AnimationNumber.Two
        : AnimationNumber.One
    : AnimationNumber.Zero;

  return [animationNumber, numberOfAnimations];
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

type UseAnimationType = (options: UseAnimationTypeOptions) => AnimationType;

export const useAnimationType: UseAnimationType = (options: UseAnimationTypeOptions): AnimationType => {
  const {
    animationTransition,
    previousValueDigits,
    currentValueDigits,
    previousValue,
    currentValue,
    hasSignChanged,
    renderAnimation,
    numberOfAnimations,
  }: UseAnimationTypeOptions = options;

  const renderHorizontalAnimationWhenNumberOfAnimationsIsTwo: boolean = hasSignChanged
    ? animationTransition === AnimationTransition.None
      ? previousValue > currentValue
      : previousValue < currentValue
    : animationTransition === AnimationTransition.None
      ? previousValueDigits.length < currentValueDigits.length
      : previousValueDigits.length > currentValueDigits.length;

  const renderHorizontalAnimation: boolean =
    (numberOfAnimations === AnimationNumber.Two && renderHorizontalAnimationWhenNumberOfAnimationsIsTwo) ||
    (numberOfAnimations === AnimationNumber.Three && animationTransition !== AnimationTransition.FirstToSecond);

  return renderAnimation ? (renderHorizontalAnimation ? AnimationType.Horizontal : AnimationType.Vertical) : AnimationType.None;
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

type UseAnimationDirection = (options: UseAnimationDirectionOptions) => AnimationDirection;

export const useAnimationDirection: UseAnimationDirection = (options: UseAnimationDirectionOptions): AnimationDirection => {
  const {
    animationType,
    animationTransition,
    previousValueDigits,
    currentValueDigits,
    previousValue,
    currentValue,
    hasSignChanged,
    numberOfAnimations,
  }: UseAnimationDirectionOptions = options;

  const horizontalAnimationDirection: AnimationDirection =
    (numberOfAnimations === AnimationNumber.Two &&
      (hasSignChanged ? previousValue > currentValue : previousValueDigits.length < currentValueDigits.length)) ||
    (numberOfAnimations === AnimationNumber.Three && animationTransition === AnimationTransition.None)
      ? AnimationDirection.Normal
      : AnimationDirection.Reverse;

  const verticalAnimationDirection: AnimationDirection =
    previousValue < currentValue ? AnimationDirection.Normal : AnimationDirection.Reverse;

  switch (animationType) {
    case AnimationType.Horizontal:
      return horizontalAnimationDirection;
    case AnimationType.Vertical:
      return verticalAnimationDirection;
    case AnimationType.None:
      return AnimationDirection.None;
  }
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

export type AnimationDurationTuple = [number, number, number, number];

type UseAnimationDuration = (options: UseAnimationDurationOptions) => AnimationDurationTuple;

export const useAnimationDuration: UseAnimationDuration = (options: UseAnimationDurationOptions): AnimationDurationTuple => {
  const { animationType, animationDuration = {}, numberOfAnimations }: UseAnimationDurationOptions = options;

  const isAnimationDuration = (animationDuration: AnimationDuration | TotalAnimationDuration): animationDuration is AnimationDuration =>
    !Object.keys(animationDuration).length ||
    Object.keys(animationDuration).some((key: string): boolean => Object.values(AnimationKey).includes<string>(key));

  const fromAnimationDuration = ({
    horizontalAnimation = AnimationDurationValue.HorizontalAnimation,
    verticalAnimation = AnimationDurationValue.VerticalAnimation,
  }: AnimationDuration): [number, number] => [
    numberOfAnimations === AnimationNumber.One ? Integer.Zero : horizontalAnimation,
    verticalAnimation,
  ];

  const fromTotalAnimationDuration = ({
    animationDuration = TotalAnimationDurationValue.AnimationDuration,
    ratio = TotalAnimationDurationValue.Ratio,
  }: TotalAnimationDuration): [number, number] => {
    const horizontalAnimationDuration: number =
      numberOfAnimations === AnimationNumber.One ? Integer.Zero : animationDuration / (ratio + numberOfAnimations - Integer.One);
    const verticalAnimationDuration: number =
      ratio === Integer.Zero ? Integer.Zero : animationDuration - horizontalAnimationDuration * (numberOfAnimations - Integer.One);

    return [horizontalAnimationDuration, verticalAnimationDuration];
  };

  const mapAnimationDuration:
    | ((animationDuration: AnimationDuration) => [number, number])
    | ((animationDuration: TotalAnimationDuration) => [number, number]) = isAnimationDuration(animationDuration)
    ? fromAnimationDuration
    : fromTotalAnimationDuration;

  const calculateTotalAnimationDuration = (horizontalAnimationDuration: number, verticalAnimationDuration: number): number => {
    switch (numberOfAnimations) {
      case AnimationNumber.Zero:
        return Integer.Zero;
      case AnimationNumber.One:
        return verticalAnimationDuration;
      case AnimationNumber.Two:
        return horizontalAnimationDuration + verticalAnimationDuration;
      case AnimationNumber.Three:
        return Integer.Two * horizontalAnimationDuration + verticalAnimationDuration;
    }
  };

  const [horizontalAnimationDuration, verticalAnimationDuration] =
    numberOfAnimations === AnimationNumber.Zero ? [Integer.Zero, Integer.Zero] : mapAnimationDuration(animationDuration);

  const currentAnimationDuration: number =
    animationType === AnimationType.Horizontal
      ? horizontalAnimationDuration
      : animationType === AnimationType.Vertical
        ? verticalAnimationDuration
        : Integer.Zero;

  return [
    currentAnimationDuration,
    horizontalAnimationDuration,
    verticalAnimationDuration,
    calculateTotalAnimationDuration(horizontalAnimationDuration, verticalAnimationDuration),
  ];
};

export interface ExtendedAnimationTimingFunction {
  horizontalAnimation?: OrReadOnly<AnimationTimingFunctionTuple>;
  verticalAnimation?: OrReadOnly<AnimationTimingFunctionTuple>;
}

interface UseAnimationTimingFunctionOptions {
  animationTimingFunction?: OrReadOnly<AnimationTimingFunctionTuple> | ExtendedAnimationTimingFunction;
  animationType: AnimationType;
  animationDirection: AnimationDirection;
}

type UseAnimationTimingFunction = (options: UseAnimationTimingFunctionOptions) => AnimationTimingFunctionTuple;

export const useAnimationTimingFunction: UseAnimationTimingFunction = (
  options: UseAnimationTimingFunctionOptions,
): AnimationTimingFunctionTuple => {
  const {
    animationTimingFunction: animationTimingFunctionInput = AnimationTimingFunction.Ease,
    animationType,
    animationDirection,
  }: UseAnimationTimingFunctionOptions = options;

  const {
    horizontalAnimation = AnimationTimingFunction.Ease,
    verticalAnimation = AnimationTimingFunction.Ease,
  }: ExtendedAnimationTimingFunction = Array.isArray<ExtendedAnimationTimingFunction, OrReadOnly<AnimationTimingFunctionTuple>>(
    animationTimingFunctionInput,
  )
    ? { horizontalAnimation: animationTimingFunctionInput, verticalAnimation: animationTimingFunctionInput }
    : animationTimingFunctionInput;

  const reverse: boolean = animationDirection === AnimationDirection.Reverse;

  const animationTimingFunction: OrReadOnly<AnimationTimingFunctionTuple> =
    animationType === AnimationType.Horizontal ? horizontalAnimation : verticalAnimation;

  const mapAnimationTimingFunction = (tuple: OrReadOnly<AnimationTimingFunctionTuple[number]>): AnimationTimingFunctionTuple[number] =>
    reverse ? tuple.map<number, AnimationTimingFunctionTuple[number]>((number: number): number => Integer.One - number) : [...tuple];

  return animationTimingFunction
    .map<AnimationTimingFunctionTuple[number], AnimationTimingFunctionTuple>(mapAnimationTimingFunction)
    .invert(reverse);
};

interface UseRenderNegativeCharacterOptions {
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode;
  animationTransition: AnimationTransition;
  previousValue: bigint;
  currentValue: bigint;
  isValueValid: boolean;
  hasSignChanged: boolean;
  renderAnimation: boolean;
  numberOfAnimations: AnimationNumber;
  animationType: AnimationType;
}

type UseRenderNegativeCharacter = (options: UseRenderNegativeCharacterOptions) => boolean;

export const useRenderNegativeCharacter: UseRenderNegativeCharacter = (options: UseRenderNegativeCharacterOptions): boolean => {
  const {
    negativeCharacterAnimationMode,
    animationTransition,
    previousValue,
    currentValue,
    isValueValid,
    hasSignChanged,
    renderAnimation,
    numberOfAnimations,
    animationType,
  }: UseRenderNegativeCharacterOptions = options;

  const renderNegativeElementWhenNegativeCharacterAnimationModeIsNotMulti: boolean = !(
    renderAnimation &&
    animationType !== AnimationType.Horizontal &&
    negativeCharacterAnimationMode === NegativeCharacterAnimationMode.Multi
  );

  const renderNegativeElementWhenNumberOfAnimationsIsThree: boolean =
    animationType === AnimationType.Horizontal &&
    numberOfAnimations === AnimationNumber.Three &&
    previousValue < currentValue === (animationTransition === AnimationTransition.None);

  const renderNegativeCharacter: boolean =
    (isValueValid && !hasSignChanged && currentValue < Integer.Zero && renderNegativeElementWhenNegativeCharacterAnimationModeIsNotMulti) ||
    renderNegativeElementWhenNumberOfAnimationsIsThree;

  return renderNegativeCharacter;
};

type MappedView<T extends object = object, U = unknown> = {
  [K in keyof StyledView<Styled, T, U> as Uncapitalize<
    Slice<K, Styled> extends Capitalize<ViewKey> ? Slice<K, Styled> : never
  >]: StyledView<Styled, T, U>[K];
};

export interface View<T extends object = object, U = unknown> extends MappedView<T, U> {
  viewProps?: T;
}

export type StyledViewWithProps<T extends Styled, U extends object, V> = Partial<U> & StyledView<T, U, V>;

// prettier-ignore
type StyledViewTypes<
  K extends object, L, M extends object, N, O extends object, P, Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z
> = [
  [Styled.Container, K, L],
  [Styled.Symbol, M, N],
  [Styled.Digit, O, P],
  [Styled.Separator, Q, R],
  [Styled.DecimalSeparator, S, T],
  [Styled.DigitGroupSeparator, U, V],
  [Styled.Negative, W, X],
  [Styled.Invalid, Y, Z],
];

// prettier-ignore
type StyledViewTuple<
  K extends object, L, M extends object, N, O extends object, P, Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z
> = MappedTuple<{
  [I in TupleIndex<StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>>]: StyledView<
    StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[I][Integer.Zero],
    StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[I][Integer.One],
    StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[I][Integer.Two]
  >;
}>;

// prettier-ignore
type ViewTuple<
  K extends object, L, M extends object, N, O extends object, P, Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z
> = MappedTuple<{
  [I in TupleIndex<StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>>]: View<
    StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[I][Integer.One],
    StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[I][Integer.Two]
  >;
}>;

// prettier-ignore
type UseStyledViewOptions<
  K extends object, L, M extends object, N, O extends object, P, Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z
> = MappedTuple<{
  [I in TupleIndex<ViewTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>>]?: ViewTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[I];
}>;

// prettier-ignore
export type StyledViewWithPropsTuple<
  K extends object, L, M extends object, N, O extends object, P, Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z
> = MappedTuple<{
  [I in TupleIndex<StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>>]: StyledViewWithProps<
    StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[I][Integer.Zero],
    StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[I][Integer.One],
    StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[I][Integer.Two]
  >;
}>;

// prettier-ignore
type UseStyledView = <
  K extends object, L, M extends object, N, O extends object, P, Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z
>(
  options: UseStyledViewOptions<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>,
) => StyledViewWithPropsTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>;

export const useStyledView: UseStyledView = <
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
  options: UseStyledViewOptions<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>,
): StyledViewWithPropsTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z> => {
  const mapView = (
    viewWithStyledComponent:
      | [UseStyledViewOptions<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]]
      | [UseStyledViewOptions<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number], Styled],
  ): StyledViewWithPropsTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number] => {
    const [{ viewProps, ...restView } = {}, styledComponent]:
      | [UseStyledViewOptions<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]]
      | [UseStyledViewOptions<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number], Styled] = viewWithStyledComponent;

    const mapEntry = ([key, value]: [string, TypeOf<ViewTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]>]): [
      string,
      TypeOf<ViewTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]>,
    ] => [`${styledComponent}${key.capitalize()}`, value];

    const styledView: ViewTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number] = Object.fromEntries<
      keyof StyledViewTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number],
      TypeOf<ViewTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]>
    >(
      Object.entries<TypeOf<ViewTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]>>(restView).map<
        [string, TypeOf<ViewTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]>]
      >(mapEntry),
    );

    return Object.assign<
      Partial<U | V>,
      ViewTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number],
      StyledViewWithPropsTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]
    >(viewProps ?? {}, styledView);
  };

  return options
    .zip<Styled>(Object.values<Styled>(Styled))
    .map<
      StyledViewWithPropsTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number],
      StyledViewWithPropsTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>
    >(mapView);
};

type UseNumberOfDigitGroupSeparators = (precision: number) => (numberOfDigits: number) => number;

export const useNumberOfDigitGroupSeparators: UseNumberOfDigitGroupSeparators =
  (precision: number): ((numberOfDigits: number) => number) =>
  (numberOfDigits: number): number =>
    [numberOfDigits - Math.max(precision, Integer.Zero), Math.max(precision, Integer.Zero)]
      .map<number>((quantity: number): number => Math.trunc((quantity - Integer.One) / Integer.Three))
      .reduce((first: number, second: number): number => first + second);

type SymbolIndexFunction = (index: number, length: number) => number;

export interface SymbolIndexFunctions {
  getSymbolIndex: SymbolIndexFunction;
  getCharacterSeparatorIndex: SymbolIndexFunction;
  getSeparatorIndex: SymbolIndexFunction;
  getDigitGroupSeparatorIndex: SymbolIndexFunction;
}

type UseSymbolIndexFunctions = (precision: number) => SymbolIndexFunctions;

export const useSymbolIndexFunctions: UseSymbolIndexFunctions = (precision: number): SymbolIndexFunctions => {
  const { negativeCharacterLength }: NumbersTransitionTheme = useTheme();

  const getIndex = (index: number, length: number): number =>
    Math.trunc(
      (index + ((Integer.Three - ((length - Math.max(precision, Integer.Zero)) % Integer.Three)) % Integer.Three)) / Integer.Three,
    );

  const getSymbolIndex = (index: number, length: number): number => negativeCharacterLength! + index + getIndex(index, length);
  const getCharacterSeparatorIndex = (index: number, length: number): number => getSymbolIndex(index, length) - Integer.One;
  const getSeparatorIndex = (index: number, length: number): number => getIndex(index, length) - Integer.One;
  const getDigitGroupSeparatorIndex = (index: number, length: number): number =>
    getSeparatorIndex(index, length) - (length - index < precision ? Integer.One : Integer.Zero);

  return { getSymbolIndex, getCharacterSeparatorIndex, getSeparatorIndex, getDigitGroupSeparatorIndex };
};

interface UseElementsLengthOptions {
  precision: number;
  isValueValid: boolean;
  currentValue: bigint;
  hasSignChanged: boolean;
  numberOfDigits: number;
}

type UseElementsLength = (options: UseElementsLengthOptions) => ElementsLength;

export const useElementsLength: UseElementsLength = (options: UseElementsLengthOptions): ElementsLength => {
  const { precision, isValueValid, currentValue, hasSignChanged, numberOfDigits }: UseElementsLengthOptions = options;

  const calculateNumberOfDigitGroupSeparators: (numberOfDigits: number) => number = useNumberOfDigitGroupSeparators(precision);
  const sum = (first: number, second: number): number => first + second;

  const invalidLength: number = isValueValid ? Integer.Zero : Integer.One;
  const negativeCharacterLength: number = isValueValid && (hasSignChanged || currentValue < Integer.Zero) ? Integer.One : Integer.Zero;
  const digitGroupSeparatorsLength: number = isValueValid ? calculateNumberOfDigitGroupSeparators(numberOfDigits) : Integer.Zero;
  const decimalSeparatorLength: number = isValueValid && precision > Integer.Zero ? Integer.One : Integer.Zero;
  const separatorsLength: number = [digitGroupSeparatorsLength, decimalSeparatorLength].reduce(sum);
  const digitsLength: number = isValueValid ? numberOfDigits : Integer.Zero;
  const symbolsLength: number = [digitsLength, separatorsLength, negativeCharacterLength].reduce(sum);

  return {
    symbolsLength,
    digitsLength,
    separatorsLength,
    decimalSeparatorLength,
    digitGroupSeparatorsLength,
    negativeCharacterLength,
    invalidLength,
  };
};

type CubicBezier = (points: AnimationTimingFunctionTuple[number]) => (time: number) => number;

type Solve = (func: (inputValue: number) => number, previousValue?: number, previousFuncResult?: number) => number;

export type CubicBezierTuple = [CubicBezier, Solve];

type UseCubicBezier = () => CubicBezierTuple;

export const useCubicBezier: UseCubicBezier = (): CubicBezierTuple => {
  const derivative = (func: (value: number) => number, value: number) =>
    (func(value + EquationSolver.DerivativeDelta) - func(value - EquationSolver.DerivativeDelta)) /
    (Integer.Two * EquationSolver.DerivativeDelta);

  const solve = (
    func: (value: number) => number,
    previousValue: number = EquationSolver.InitialValue,
    previousFuncResult: number = func(previousValue),
  ): number => {
    const newValue: number = previousValue - previousFuncResult / derivative(func, previousValue);
    const newFuncResult: number = func(newValue);

    const isConvergent: boolean = [newValue - previousValue, newFuncResult]
      .map<boolean>((value: number): boolean => Math.abs(value) < EquationSolver.DerivativeDelta)
      .reduce((accumulator: boolean, currentValue: boolean): boolean => accumulator && currentValue);

    return isConvergent ? newValue : solve(func, newValue, newFuncResult);
  };

  const cubicBezier =
    ([firstPoint, secondPoint]: AnimationTimingFunctionTuple[number]): ((time: number) => number) =>
    (time: number): number =>
      Integer.Three * (firstPoint * time * (Integer.One - time) ** Integer.Two + secondPoint * (Integer.One - time) * time ** Integer.Two) +
      time ** Integer.Three;

  return [cubicBezier, (func: (value: number) => number): number => solve(func)];
};

interface UseHorizontalAnimationDigitsOptions {
  previousValueDigits: number[];
  currentValueDigits: number[];
  numberOfDigitsDifference: number;
  animationDirection: AnimationDirection;
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
  ...(renderZeros ? Array(numberOfDigitsDifference).fill(Integer.Zero) : []),
  ...(animationDirection === AnimationDirection.Normal ? previousValueDigits : currentValueDigits),
];

export interface AnimationAlgorithm {
  incrementMaxLength?: number;
  numberOfDigitsIncrease?: number;
}

interface DigitValues {
  start: bigint;
  end: bigint;
}

interface UseVerticalAnimationDigitsOptions {
  animationAlgorithm?: AnimationAlgorithm;
  maxNumberOfDigits: number;
  previousValue: bigint;
  currentValue: bigint;
}

type UseVerticalAnimationDigits = (options: UseVerticalAnimationDigitsOptions) => number[][];

export const useVerticalAnimationDigits: UseVerticalAnimationDigits = (options: UseVerticalAnimationDigitsOptions): number[][] => {
  const {
    animationAlgorithm: { incrementMaxLength = Integer.Fourteen, numberOfDigitsIncrease = Integer.Seven } = {},
    maxNumberOfDigits,
    previousValue,
    currentValue,
  }: UseVerticalAnimationDigitsOptions = options;

  const createDigitValues = (accumulator: [DigitValues[], DigitValues[]], _: undefined, index: number): [DigitValues[], DigitValues[]] => {
    const [start, end]: bigint[] = [previousValue, currentValue]
      .map<bigint>((number: bigint): bigint => number / BigInt(Integer.Ten) ** BigInt(maxNumberOfDigits - index - Integer.One))
      .sort((first: bigint, second: bigint): number => (first < second ? Integer.MinusOne : first > second ? Integer.One : Integer.Zero));

    const accumulatorIndex: number = end - start < incrementMaxLength ? Integer.Zero : Integer.One;
    accumulator[accumulatorIndex] = [...accumulator[accumulatorIndex], { start, end }];

    return accumulator;
  };

  const getDigit = (number: bigint): number => Math.abs(Number(number % BigInt(Integer.Ten)));

  const incrementValues = ({ start, end }: DigitValues): number[] =>
    [...Array(Number(end - start) + Integer.One)].map<number>((_: undefined, index: number): number => getDigit(start + BigInt(index)));

  const generateValues = (values: DigitValues, index: number): number[] => {
    const { start, end }: DigitValues = values;

    const calculate = (_: undefined, index: number, { length }: number[]): bigint =>
      (NumberPrecision.Value * (start * BigInt(length - index) + end * BigInt(index))) / BigInt(length);

    const round = (value: bigint): bigint =>
      value / NumberPrecision.Value +
      BigInt(value - (value / NumberPrecision.Value) * NumberPrecision.Value < NumberPrecision.HalfValue ? Integer.Zero : Integer.One);

    const numbers: number[] = [...Array(incrementMaxLength + numberOfDigitsIncrease * index)]
      .map<bigint>(calculate)
      .map<bigint>(round)
      .map<number>(getDigit);

    return numbers.at(Integer.MinusOne) === getDigit(end) ? numbers : [...numbers, getDigit(end)];
  };

  const mapDigitValues = (algorithmValuesArray: DigitValues[], index: number): number[][] =>
    algorithmValuesArray.map<number[]>(index ? generateValues : incrementValues);

  return [...Array(maxNumberOfDigits)]
    .reduce<[DigitValues[], DigitValues[]]>(createDigitValues, [[], []])
    .map<number[][], [number[][], number[][]]>(mapDigitValues)
    .flat<[number[][], number[][]], Integer.One>();
};

export interface ChildrenProps {
  children?: GenericReactNode<ChildrenProps>;
}

interface KeyProps {
  key?: string;
}

interface IterableProps extends KeyProps, ChildrenProps {}
type ComponentProps<T extends object> = T & IterableProps;
type FunctionalComponent<T extends object> = (T extends object ? FC<ComponentProps<T>> : FC<IterableProps>) | string;

type PropsFactory<T extends GenericReactNode<ChildrenProps>, U extends object> = (value: T, index: number, array: T[]) => U;

export type ElementKeyMapper<T extends GenericReactNode<ChildrenProps>> = (
  child: T,
  index: number,
  children: T[],
) => ReactElement<ChildrenProps>;

type UseElementKeyMapper = <T extends GenericReactNode<ChildrenProps>, U extends object>(
  Component: FunctionalComponent<U>,
  props?: U | PropsFactory<T, U>,
) => ElementKeyMapper<T>;

export const useElementKeyMapper: UseElementKeyMapper =
  <T extends GenericReactNode<ChildrenProps>, U extends object>(
    Component: FunctionalComponent<U>,
    props?: U | PropsFactory<T, U>,
  ): ElementKeyMapper<T> =>
  (child: T, index: number, array: T[]): ReactElement<ChildrenProps> => (
    <Component
      key={`${Component.toString()}${`${index + Integer.One}`.padStart(`${array.length}`.length, `${Integer.Zero}`)}`}
      {...(typeof props === 'function' ? props(child, index, array) : props)}
    >
      {child}
    </Component>
  );
