import { ActionDispatch, FC, ReactElement, ReactNode, RefObject, useEffect, useReducer, useRef } from 'react';
import {
  AnimationDirections,
  AnimationDurationValues,
  AnimationInterruptionModes,
  AnimationKeys,
  AnimationNumbers,
  AnimationTimingFunctions,
  AnimationTransitions,
  AnimationTypes,
  EquationSolver,
  NegativeCharacterAnimationModes,
  NumberPrecision,
  Numbers,
  RegularExpressions,
  Strings,
  StyledComponents,
  TotalAnimationDurationValues,
  ViewKeys,
} from './NumbersTransition.enums';
import { AnimationTimingFunction, ElementsLength, NumbersTransitionTheme, StyledView } from './NumbersTransition.styles';
import { BigDecimal, MappedTuple, OrReadOnly, Slice, TupleIndex, TypeOf, UncheckedBigDecimal } from './NumbersTransition.types';

type RerenderFunction = (condition: boolean) => void;

type UseRerender = () => RerenderFunction;

const useRerender: UseRerender = (): RerenderFunction => {
  const [, rerender]: [number, ActionDispatch<[]>] = useReducer<number, []>((value: number): number => value + Numbers.ONE, Numbers.ZERO);

  return (condition: boolean): void => (condition ? rerender() : undefined);
};

export type ValidationTuple = [BigDecimal, boolean];

type UseValidation = (value?: UncheckedBigDecimal, validValue?: BigDecimal) => ValidationTuple;

export const useValidation: UseValidation = (value?: UncheckedBigDecimal, validValue: BigDecimal = Numbers.ZERO): ValidationTuple => {
  const matchesBigDecimal = (value?: UncheckedBigDecimal): value is BigDecimal =>
    typeof value !== 'undefined' && !!`${value}`.match(RegularExpressions.BIG_DECIMAL);

  return matchesBigDecimal(value) ? [value, true] : [validValue, false];
};

type UseValue = (
  value: UncheckedBigDecimal | undefined,
  previousValue: BigDecimal,
  animationInterruptionMode?: AnimationInterruptionModes,
) => ValidationTuple;

export const useValue: UseValue = (
  value: UncheckedBigDecimal | undefined,
  previousValue: BigDecimal,
  animationInterruptionMode: AnimationInterruptionModes = AnimationInterruptionModes.INTERRUPT,
): ValidationTuple => {
  const rerender: RerenderFunction = useRerender();
  const values: RefObject<ValidationTuple[]> = useRef<ValidationTuple[]>([]);
  const validationTuple: ValidationTuple = useValidation(value, values.current.at(Numbers.MINUS_ONE)?.[Numbers.ZERO] ?? previousValue);

  values.current =
    animationInterruptionMode === AnimationInterruptionModes.CONTINUE
      ? values.current.length && values.current.at(Numbers.MINUS_ONE)?.equals(validationTuple)
        ? values.current
        : [...values.current, validationTuple]
      : [validationTuple];

  const [validValue, isValueValid]: ValidationTuple = values.current[Numbers.ZERO];

  const filterInvalidValues = ([, isValid]: ValidationTuple, index: number, { length }: ValidationTuple[]): boolean =>
    isValid || index === length - Numbers.ONE;

  const filterDuplicates = ([value]: ValidationTuple, index: number, array: ValidationTuple[]): boolean =>
    !index || value !== array[index - Numbers.ONE][Numbers.ZERO];

  useEffect((): void => {
    if (validValue === previousValue || !isValueValid) {
      values.current = values.current.slice(Numbers.ONE).filter(filterInvalidValues).filter(filterDuplicates);
      rerender(!!values.current.length);
    }
  }, [rerender, previousValue, validValue, isValueValid]);

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
    ...(length === Numbers.ONE ? [Strings.EMPTY] : []),
  ];

  const reduceFloatingPoint = (integer: string, fraction: string): string => {
    const [start, mid, end, numberOfZeros]: [string, string, string, number] =
      precision > Numbers.ZERO
        ? [integer.replace(Strings.MINUS, Strings.EMPTY), fraction, Strings.EMPTY, Math.max(precision - fraction.length, Numbers.ZERO)]
        : [Strings.EMPTY, integer.replace(Strings.MINUS, Strings.EMPTY), fraction, -precision];

    const digits: string = `${start}${mid.slice(Numbers.ZERO, precision || mid.length) ?? Numbers.ZERO}`;
    const restDigits: string = `${mid.slice(precision || mid.length)}${end}`;
    const increase: number =
      BigInt(restDigits) < BigInt(`${Numbers.FIVE}`.padEnd(Math.max(restDigits.length, numberOfZeros), `${Numbers.ZERO}`))
        ? Numbers.ZERO
        : Numbers.ONE;
    const value: bigint = (BigInt(digits) + BigInt(increase)) * BigInt(Numbers.TEN) ** BigInt(numberOfZeros);

    return [...(integer.match(Strings.MINUS) ?? []), `${value}`.padStart(precision + Numbers.ONE, `${Numbers.ZERO}`)].join(Strings.EMPTY);
  };

  return values.map<string[], AnimationCharactersTuple>((number: BigDecimal): string[] => [
    ...`${number}`.split(RegularExpressions.DOT_OR_COMMA).reduce<string[]>(fillFloatingPoint, []).reduce(reduceFloatingPoint),
  ]);
};

type UseAnimationDigitsOptions = [string[], string[]];

type AnimationDigitsTuple = [number[], number[]];

type UseAnimationDigits = (options: UseAnimationDigitsOptions) => AnimationDigitsTuple;

const useAnimationDigits: UseAnimationDigits = (options: UseAnimationDigitsOptions): AnimationDigitsTuple =>
  options.map<number[], AnimationDigitsTuple>((characters: string[]): number[] =>
    characters.filter((character: string): boolean => !!character.match(RegularExpressions.SINGLE_DIGIT)).map<number>(Number),
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

  const fillNumberOfDigitsDifference = (accumulator: number[], currentValue: number, index: number): number[] => [
    ...accumulator,
    currentValue,
    ...(index ? [currentValue - accumulator.at(Numbers.MINUS_ONE)!] : []),
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

  const digits: AnimationDigitsTuple = useAnimationDigits([characters[Numbers.ZERO], characters[Numbers.TWO]]);
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
  const hasSignChanged: boolean = (currentValue ^ previousValueOnEnd) < Numbers.ZERO;
  const omitAnimation: boolean = isValueValid && value !== previousValue && !hasValueChanged;
  const restartAnimation: boolean = currentValue !== previousValueOnStart && previousValueOnEnd !== previousValueOnStart;
  const renderAnimation: boolean = isValueValid && hasValueChanged && !restartAnimation;

  return { hasSignChanged, omitAnimation, restartAnimation, renderAnimation };
};

interface UseAnimationNumbersOptions {
  animationTransition: AnimationTransitions;
  previousValueDigits: number[];
  currentValueDigits: number[];
  previousValue: bigint;
  currentValue: bigint;
  hasSignChanged: boolean;
  renderAnimation: boolean;
}

export type AnimationNumbersTuple = [AnimationNumbers, AnimationNumbers];

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

  const animationNumber: AnimationNumbers = renderAnimation
    ? animationTransition === AnimationTransitions.SECOND_TO_THIRD
      ? AnimationNumbers.THREE
      : animationTransition === AnimationTransitions.FIRST_TO_SECOND
        ? AnimationNumbers.TWO
        : AnimationNumbers.ONE
    : AnimationNumbers.ZERO;

  const numberOfAnimations: AnimationNumbers = renderAnimation
    ? hasSignChanged
      ? hasThreeAnimations
        ? AnimationNumbers.THREE
        : AnimationNumbers.TWO
      : hasNumberOfDigitsChanged
        ? AnimationNumbers.TWO
        : AnimationNumbers.ONE
    : AnimationNumbers.ZERO;

  return [animationNumber, numberOfAnimations];
};

interface UseAnimationTypeOptions {
  animationTransition: AnimationTransitions;
  previousValueDigits: number[];
  currentValueDigits: number[];
  previousValue: bigint;
  currentValue: bigint;
  hasSignChanged: boolean;
  renderAnimation: boolean;
  numberOfAnimations: AnimationNumbers;
}

type UseAnimationType = (options: UseAnimationTypeOptions) => AnimationTypes;

export const useAnimationType: UseAnimationType = (options: UseAnimationTypeOptions): AnimationTypes => {
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
    ? animationTransition === AnimationTransitions.NONE
      ? previousValue > currentValue
      : previousValue < currentValue
    : animationTransition === AnimationTransitions.NONE
      ? previousValueDigits.length < currentValueDigits.length
      : previousValueDigits.length > currentValueDigits.length;

  const renderHorizontalAnimation: boolean =
    (numberOfAnimations === AnimationNumbers.TWO && renderHorizontalAnimationWhenNumberOfAnimationsIsTwo) ||
    (numberOfAnimations === AnimationNumbers.THREE && animationTransition !== AnimationTransitions.FIRST_TO_SECOND);

  return renderAnimation ? (renderHorizontalAnimation ? AnimationTypes.HORIZONTAL : AnimationTypes.VERTICAL) : AnimationTypes.NONE;
};

interface UseAnimationDirectionOptions {
  animationType: AnimationTypes;
  animationTransition: AnimationTransitions;
  previousValueDigits: number[];
  currentValueDigits: number[];
  previousValue: bigint;
  currentValue: bigint;
  hasSignChanged: boolean;
  numberOfAnimations: AnimationNumbers;
}

type UseAnimationDirection = (options: UseAnimationDirectionOptions) => AnimationDirections;

export const useAnimationDirection: UseAnimationDirection = (options: UseAnimationDirectionOptions): AnimationDirections => {
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

  const horizontalAnimationDirection: AnimationDirections =
    (numberOfAnimations === AnimationNumbers.TWO &&
      (hasSignChanged ? previousValue > currentValue : previousValueDigits.length < currentValueDigits.length)) ||
    (numberOfAnimations === AnimationNumbers.THREE && animationTransition === AnimationTransitions.NONE)
      ? AnimationDirections.NORMAL
      : AnimationDirections.REVERSE;

  const verticalAnimationDirection: AnimationDirections =
    previousValue < currentValue ? AnimationDirections.NORMAL : AnimationDirections.REVERSE;

  switch (animationType) {
    case AnimationTypes.HORIZONTAL:
      return horizontalAnimationDirection;
    case AnimationTypes.VERTICAL:
      return verticalAnimationDirection;
    case AnimationTypes.NONE:
      return AnimationDirections.NONE;
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
  animationType: AnimationTypes;
  animationDuration?: AnimationDuration | TotalAnimationDuration;
  numberOfAnimations: AnimationNumbers;
}

export type AnimationDurationTuple = [number, number, number, number];

type UseAnimationDuration = (options: UseAnimationDurationOptions) => AnimationDurationTuple;

export const useAnimationDuration: UseAnimationDuration = (options: UseAnimationDurationOptions): AnimationDurationTuple => {
  const { animationType, animationDuration = {}, numberOfAnimations }: UseAnimationDurationOptions = options;

  const isAnimationDuration = (animationDuration: AnimationDuration | TotalAnimationDuration): animationDuration is AnimationDuration =>
    !Object.keys(animationDuration).length ||
    Object.keys(animationDuration).some((key: string): boolean => Object.values(AnimationKeys).includes<string>(key));

  const fromAnimationDuration = ({
    horizontalAnimation = AnimationDurationValues.HORIZONTAL_ANIMATION,
    verticalAnimation = AnimationDurationValues.VERTICAL_ANIMATION,
  }: AnimationDuration): [number, number] => [
    numberOfAnimations === AnimationNumbers.ONE ? Numbers.ZERO : horizontalAnimation,
    verticalAnimation,
  ];

  const fromTotalAnimationDuration = ({
    animationDuration = TotalAnimationDurationValues.ANIMATION_DURATION,
    ratio = TotalAnimationDurationValues.RATIO,
  }: TotalAnimationDuration): [number, number] => {
    const horizontalAnimationDuration: number =
      numberOfAnimations === AnimationNumbers.ONE ? Numbers.ZERO : animationDuration / (ratio + numberOfAnimations - Numbers.ONE);
    const verticalAnimationDuration: number =
      ratio === Numbers.ZERO ? Numbers.ZERO : animationDuration - horizontalAnimationDuration * (numberOfAnimations - Numbers.ONE);

    return [horizontalAnimationDuration, verticalAnimationDuration];
  };

  const mapAnimationDuration:
    | ((animationDuration: AnimationDuration) => [number, number])
    | ((animationDuration: TotalAnimationDuration) => [number, number]) = isAnimationDuration(animationDuration)
    ? fromAnimationDuration
    : fromTotalAnimationDuration;

  const calculateTotalAnimationDuration = (horizontalAnimationDuration: number, verticalAnimationDuration: number): number => {
    switch (numberOfAnimations) {
      case AnimationNumbers.ZERO:
        return Numbers.ZERO;
      case AnimationNumbers.ONE:
        return verticalAnimationDuration;
      case AnimationNumbers.TWO:
        return horizontalAnimationDuration + verticalAnimationDuration;
      case AnimationNumbers.THREE:
        return Numbers.TWO * horizontalAnimationDuration + verticalAnimationDuration;
    }
  };

  const [horizontalAnimationDuration, verticalAnimationDuration] =
    numberOfAnimations === AnimationNumbers.ZERO ? [Numbers.ZERO, Numbers.ZERO] : mapAnimationDuration(animationDuration);

  const currentAnimationDuration: number =
    animationType === AnimationTypes.HORIZONTAL
      ? horizontalAnimationDuration
      : animationType === AnimationTypes.VERTICAL
        ? verticalAnimationDuration
        : Numbers.ZERO;

  return [
    currentAnimationDuration,
    horizontalAnimationDuration,
    verticalAnimationDuration,
    calculateTotalAnimationDuration(horizontalAnimationDuration, verticalAnimationDuration),
  ];
};

export interface ExtendedAnimationTimingFunction {
  horizontalAnimation?: OrReadOnly<AnimationTimingFunction>;
  verticalAnimation?: OrReadOnly<AnimationTimingFunction>;
}

interface UseAnimationTimingFunctionOptions {
  animationTimingFunction?: OrReadOnly<AnimationTimingFunction> | ExtendedAnimationTimingFunction;
  animationType: AnimationTypes;
  animationDirection: AnimationDirections;
}

type UseAnimationTimingFunction = (options: UseAnimationTimingFunctionOptions) => AnimationTimingFunction;

export const useAnimationTimingFunction: UseAnimationTimingFunction = (
  options: UseAnimationTimingFunctionOptions,
): AnimationTimingFunction => {
  const {
    animationTimingFunction: animationTimingFunctionInput = AnimationTimingFunctions.EASE,
    animationType,
    animationDirection,
  }: UseAnimationTimingFunctionOptions = options;

  const {
    horizontalAnimation = AnimationTimingFunctions.EASE,
    verticalAnimation = AnimationTimingFunctions.EASE,
  }: ExtendedAnimationTimingFunction = Array.isArray<ExtendedAnimationTimingFunction, OrReadOnly<AnimationTimingFunction>>(
    animationTimingFunctionInput,
  )
    ? { horizontalAnimation: animationTimingFunctionInput, verticalAnimation: animationTimingFunctionInput }
    : animationTimingFunctionInput;

  const reverse: boolean = animationDirection === AnimationDirections.REVERSE;

  const animationTimingFunction: OrReadOnly<AnimationTimingFunction> =
    animationType === AnimationTypes.HORIZONTAL ? horizontalAnimation : verticalAnimation;

  const mapAnimationTimingFunction = (tuple: OrReadOnly<AnimationTimingFunction[number]>): AnimationTimingFunction[number] =>
    reverse ? tuple.map<number, AnimationTimingFunction[number]>((number: number): number => Numbers.ONE - number) : [...tuple];

  return animationTimingFunction.map<AnimationTimingFunction[number], AnimationTimingFunction>(mapAnimationTimingFunction).invert(reverse);
};

interface UseRenderNegativeCharacterOptions {
  negativeCharacterAnimationMode: NegativeCharacterAnimationModes;
  animationTransition: AnimationTransitions;
  previousValue: bigint;
  currentValue: bigint;
  isValueValid: boolean;
  hasSignChanged: boolean;
  renderAnimation: boolean;
  numberOfAnimations: AnimationNumbers;
  animationType: AnimationTypes;
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
    animationType !== AnimationTypes.HORIZONTAL &&
    negativeCharacterAnimationMode === NegativeCharacterAnimationModes.MULTI
  );

  const renderNegativeElementWhenNumberOfAnimationsIsThree: boolean =
    animationType === AnimationTypes.HORIZONTAL &&
    numberOfAnimations === AnimationNumbers.THREE &&
    previousValue < currentValue === (animationTransition === AnimationTransitions.NONE);

  const renderNegativeCharacter: boolean =
    (isValueValid && !hasSignChanged && currentValue < Numbers.ZERO && renderNegativeElementWhenNegativeCharacterAnimationModeIsNotMulti) ||
    renderNegativeElementWhenNumberOfAnimationsIsThree;

  return renderNegativeCharacter;
};

type MappedView<T extends object = object, U = unknown> = {
  [K in keyof StyledView<StyledComponents, T, U> as Uncapitalize<
    Slice<K, StyledComponents> extends Capitalize<ViewKeys> ? Slice<K, StyledComponents> : never
  >]: StyledView<StyledComponents, T, U>[K];
};

export interface View<T extends object = object, U = unknown> extends MappedView<T, U> {
  viewProps?: T;
}

export type StyledViewWithProps<T extends StyledComponents, U extends object, V> = Partial<U> & StyledView<T, U, V>;

// prettier-ignore
type StyledViewTypes<
  K extends object, L, M extends object, N, O extends object, P, Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z
> = [
  [StyledComponents.CONTAINER, K, L],
  [StyledComponents.CHARACTER, M, N],
  [StyledComponents.DIGIT, O, P],
  [StyledComponents.SEPARATOR, Q, R],
  [StyledComponents.DECIMAL_SEPARATOR, S, T],
  [StyledComponents.DIGIT_GROUP_SEPARATOR, U, V],
  [StyledComponents.NEGATIVE_CHARACTER, W, X],
  [StyledComponents.INVALID, Y, Z],
];

// prettier-ignore
type StyledViewTuple<
  K extends object, L, M extends object, N, O extends object, P, Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z
> = MappedTuple<{
  [I in TupleIndex<StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>>]: StyledView<
    StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[I][Numbers.ZERO],
    StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[I][Numbers.ONE],
    StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[I][Numbers.TWO]
  >;
}>;

// prettier-ignore
type ViewTuple<
  K extends object, L, M extends object, N, O extends object, P, Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z
> = MappedTuple<{
  [I in TupleIndex<StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>>]: View<
    StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[I][Numbers.ONE],
    StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[I][Numbers.TWO]
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
    StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[I][Numbers.ZERO],
    StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[I][Numbers.ONE],
    StyledViewTypes<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[I][Numbers.TWO]
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
      | [UseStyledViewOptions<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number], StyledComponents],
  ): StyledViewWithPropsTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number] => {
    const [{ viewProps, ...restView } = {}, styledComponent]:
      | [UseStyledViewOptions<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]]
      | [UseStyledViewOptions<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number], StyledComponents] = viewWithStyledComponent;

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
    .zip<StyledComponents>(Object.values<StyledComponents>(StyledComponents))
    .map<
      StyledViewWithPropsTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number],
      StyledViewWithPropsTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>
    >(mapView);
};

type UseNumberOfDigitGroupSeparators = (precision: number) => (numberOfDigits: number) => number;

export const useNumberOfDigitGroupSeparators: UseNumberOfDigitGroupSeparators =
  (precision: number): ((numberOfDigits: number) => number) =>
  (numberOfDigits: number): number =>
    [numberOfDigits - Math.max(precision, Numbers.ZERO), Math.max(precision, Numbers.ZERO)]
      .map<number>((quantity: number): number => Math.trunc((quantity - Numbers.ONE) / Numbers.THREE))
      .reduce((first: number, second: number): number => first + second);

type CharacterIndexFunction = (index: number, length: number) => number;

interface UseCharacterIndexFunctionsOptions {
  precision: number;
  theme: NumbersTransitionTheme;
}

export interface CharacterIndexFunctions {
  getCharacterIndex: CharacterIndexFunction;
  getCharacterSeparatorIndex: CharacterIndexFunction;
  getSeparatorIndex: CharacterIndexFunction;
  getDigitGroupSeparatorIndex: CharacterIndexFunction;
}

type UseCharacterIndexFunctions = (options: UseCharacterIndexFunctionsOptions) => CharacterIndexFunctions;

export const useCharacterIndexFunctions: UseCharacterIndexFunctions = (
  options: UseCharacterIndexFunctionsOptions,
): CharacterIndexFunctions => {
  const {
    precision,
    theme: { negativeCharacterLength },
  }: UseCharacterIndexFunctionsOptions = options;

  const getIndex = (index: number, length: number): number =>
    Math.trunc(
      (index + ((Numbers.THREE - ((length - Math.max(precision, Numbers.ZERO)) % Numbers.THREE)) % Numbers.THREE)) / Numbers.THREE,
    );

  const getCharacterIndex = (index: number, length: number): number => negativeCharacterLength + index + getIndex(index, length);
  const getCharacterSeparatorIndex = (index: number, length: number): number => getCharacterIndex(index, length) - Numbers.ONE;
  const getSeparatorIndex = (index: number, length: number): number => getIndex(index, length) - Numbers.ONE;
  const getDigitGroupSeparatorIndex = (index: number, length: number): number =>
    getSeparatorIndex(index, length) - (length - index < precision ? Numbers.ONE : Numbers.ZERO);

  return { getCharacterIndex, getCharacterSeparatorIndex, getSeparatorIndex, getDigitGroupSeparatorIndex };
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

  const invalidLength: number = isValueValid ? Numbers.ZERO : Numbers.ONE;
  const negativeCharacterLength: number = isValueValid && (hasSignChanged || currentValue < Numbers.ZERO) ? Numbers.ONE : Numbers.ZERO;
  const digitGroupSeparatorsLength: number = isValueValid ? calculateNumberOfDigitGroupSeparators(numberOfDigits) : Numbers.ZERO;
  const decimalSeparatorLength: number = isValueValid && precision > Numbers.ZERO ? Numbers.ONE : Numbers.ZERO;
  const separatorsLength: number = [digitGroupSeparatorsLength, decimalSeparatorLength].reduce(sum);
  const digitsLength: number = isValueValid ? numberOfDigits : Numbers.ZERO;
  const charactersLength: number = [digitsLength, separatorsLength, negativeCharacterLength].reduce(sum);

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
      Numbers.THREE * (firstPoint * time * (Numbers.ONE - time) ** Numbers.TWO + secondPoint * (Numbers.ONE - time) * time ** Numbers.TWO) +
      time ** Numbers.THREE;

  return [cubicBezier, (func: (value: number) => number): number => solve(func)];
};

interface UseHorizontalAnimationDigitsOptions {
  previousValueDigits: number[];
  currentValueDigits: number[];
  numberOfDigitsDifference: number;
  animationDirection: AnimationDirections;
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
  ...(animationDirection === AnimationDirections.NORMAL ? previousValueDigits : currentValueDigits),
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
    animationAlgorithm: { incrementMaxLength = Numbers.FOURTEEN, numberOfDigitsIncrease = Numbers.SEVEN } = {},
    maxNumberOfDigits,
    previousValue,
    currentValue,
  }: UseVerticalAnimationDigitsOptions = options;

  const createDigitValues = (accumulator: [DigitValues[], DigitValues[]], _: undefined, index: number): [DigitValues[], DigitValues[]] => {
    const [start, end]: bigint[] = [previousValue, currentValue]
      .map<bigint>((number: bigint): bigint => number / BigInt(Numbers.TEN) ** BigInt(maxNumberOfDigits - index - Numbers.ONE))
      .sort((first: bigint, second: bigint): number => (first < second ? Numbers.MINUS_ONE : first > second ? Numbers.ONE : Numbers.ZERO));

    const accumulatorIndex: number = end - start < incrementMaxLength ? Numbers.ZERO : Numbers.ONE;
    accumulator[accumulatorIndex] = [...accumulator[accumulatorIndex], { start, end }];

    return accumulator;
  };

  const getDigit = (number: bigint): number => Math.abs(Number(number % BigInt(Numbers.TEN)));

  const incrementValues = ({ start, end }: DigitValues): number[] =>
    [...Array(Number(end - start) + Numbers.ONE)].map<number>((_: undefined, index: number): number => getDigit(start + BigInt(index)));

  const generateValues = (values: DigitValues, index: number): number[] => {
    const { start, end }: DigitValues = values;

    const calculate = (_: undefined, index: number, { length }: number[]): bigint =>
      (NumberPrecision.VALUE * (start * BigInt(length - index) + end * BigInt(index))) / BigInt(length);

    const round = (value: bigint): bigint =>
      value / NumberPrecision.VALUE +
      BigInt(value - (value / NumberPrecision.VALUE) * NumberPrecision.VALUE < NumberPrecision.HALF_VALUE ? Numbers.ZERO : Numbers.ONE);

    const numbers: number[] = [...Array(incrementMaxLength + numberOfDigitsIncrease * index)]
      .map<bigint>(calculate)
      .map<bigint>(round)
      .map<number>(getDigit);

    return numbers.at(Numbers.MINUS_ONE) === getDigit(end) ? numbers : [...numbers, getDigit(end)];
  };

  const mapDigitValues = (algorithmValuesArray: DigitValues[], index: number): number[][] =>
    algorithmValuesArray.map<number[]>(index ? generateValues : incrementValues);

  return [...Array(maxNumberOfDigits)]
    .reduce<[DigitValues[], DigitValues[]]>(createDigitValues, [[], []])
    .map<number[][], [number[][], number[][]]>(mapDigitValues)
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
type FunctionalComponent<T extends object> = (T extends object ? FC<ComponentProps<T>> : FC<IterableProps>) | string;

type PropsFactory<T extends object, U extends ReactNode, V extends unknown[] = unknown[]> = (
  value: U,
  index: number,
  array: U[],
  ...args: V
) => T;

export type ElementKeyMapper<T extends ReactNode, U extends unknown[] = unknown[]> = (
  child: T,
  index: number,
  children: T[],
  ...args: U
) => ReactElement;

type UseElementKeyMapper = <T extends object, U extends ReactNode, V extends unknown[] = unknown[]>(
  Component: FunctionalComponent<T>,
  props?: T | PropsFactory<T, U, V>,
) => ElementKeyMapper<U, V>;

export const useElementKeyMapper: UseElementKeyMapper =
  <T extends object, U extends ReactNode, V extends unknown[] = unknown[]>(
    Component: FunctionalComponent<T>,
    props?: T | PropsFactory<T, U, V>,
  ): ElementKeyMapper<U, V> =>
  (child: U, index: number, array: U[], ...args: V): ReactElement => (
    <Component
      key={`${Component}${`${index + Numbers.ONE}`.padStart(`${array.length}`.length, `${Numbers.ZERO}`)}`}
      {...(typeof props === 'function' ? props(child, index, array, ...args) : props)}
    >
      {child}
    </Component>
  );
