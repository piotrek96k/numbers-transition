import {
  ActionDispatch,
  Dispatch,
  FC,
  ReactElement,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useTheme } from 'styled-components';
import {
  AnimationDirection,
  AnimationInterruptionMode,
  AnimationKey,
  AnimationNumber,
  AnimationTimingFunction,
  AnimationTransition,
  AnimationType,
  Integer,
  Key,
  NegativeCharacterAnimationMode,
  NumberPrecision,
  RegularExpression,
  StepPosition,
  Styled,
  Text,
  ViewKey,
  ViewType,
} from './NumbersTransition.enums';
import {
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
import {
  BigDecimal,
  GenericReactNode,
  Nullable,
  Optional,
  OrArray,
  OrReadOnly,
  Slice,
  Switch,
  TupleOfLength,
  UncheckedBigDecimal,
  UnionProduct,
  ValueOf,
} from './NumbersTransition.types';

const useRerender = (): ActionDispatch<[]> =>
  useReducer<number, []>((value: number): number => ++value, Integer.Zero).at<Integer.One>(Integer.One);

export const useValidation = (value?: UncheckedBigDecimal, validValue: BigDecimal = Integer.Zero): [BigDecimal, boolean] =>
  RegularExpression.BigDecimal.testAny<BigDecimal>(value)
    ? [value, true]
    : typeof value === 'number'
      ? [Number(value).toFixed(Integer.OneHundred), true]
      : [validValue, false];

export const useValue = (
  value: Optional<UncheckedBigDecimal>,
  previousValue: BigDecimal,
  animationInterruptionMode: AnimationInterruptionMode = AnimationInterruptionMode.Interrupt,
): [BigDecimal, boolean] => {
  const rerender: ActionDispatch<[]> = useRerender();
  const values: RefObject<[BigDecimal, boolean][]> = useRef<[BigDecimal, boolean][]>([]);
  const validationTuple: [BigDecimal, boolean] = useValidation(value, values.current.at(Integer.MinusOne)?.[Integer.Zero] ?? previousValue);

  values.current =
    animationInterruptionMode === AnimationInterruptionMode.Continue
      ? values.current.at(Integer.MinusOne)?.equals(validationTuple)
        ? values.current
        : [...values.current, validationTuple]
      : [validationTuple];

  const [validValue, isValueValid]: [BigDecimal, boolean] = values.current[Integer.Zero];

  const filterInvalidValues = ([, isValid]: [BigDecimal, boolean], index: number, { length }: [BigDecimal, boolean][]): boolean =>
    isValid || index === length - Integer.One;

  const filterDuplicates = ([value]: [BigDecimal, boolean], index: number, array: [BigDecimal, boolean][]): boolean =>
    !index || value !== array[index - Integer.One][Integer.Zero];

  useEffect(
    (): void =>
      [
        (): unknown => (values.current = values.current.slice(Integer.One).filterMulti([filterInvalidValues, filterDuplicates])),
        (): unknown => values.current.length && rerender(),
      ]
        .filterAll(validValue === previousValue || !isValueValid)
        .forEach(Function.invoke<() => unknown>),
    [rerender, previousValue, validValue, isValueValid],
  );

  return [validValue, isValueValid];
};

const useBigDecimalParser = (precision: number): ((value: BigDecimal) => string) => {
  const reduceFloatingPoint = (integer: string, fraction: string): string => {
    const [digits, restDigits]: [string, string] =
      precision >= Integer.Zero
        ? [`${integer.replace(Text.Minus, Text.Empty)}${fraction.slice(Integer.Zero, precision)}`, fraction.slice(precision)]
        : [
            integer.replace(Text.Minus, Text.Empty).slice(Integer.Zero, precision),
            `${integer.replace(Text.Minus, Text.Empty).slice(precision)}${fraction}`,
          ];

    const numberOfZeros: number = Math.max(precision - fraction.length, -precision, Integer.Zero);
    const increase: number =
      BigInt(restDigits) < BigInt(`${Integer.Five}`.padEnd(Math.max(restDigits.length, numberOfZeros), `${Integer.Zero}`))
        ? Integer.Zero
        : Integer.One;
    const value: bigint = (BigInt(digits) + BigInt(increase)) * BigInt(Integer.Ten) ** BigInt(numberOfZeros);

    return [...(integer.match(Text.Minus) ?? []), `${value}`.padStart(precision + Integer.One, `${Integer.Zero}`)].join(Text.Empty);
  };

  return (value: BigDecimal): string =>
    [`${value}`.split(RegularExpression.DecimalSeparator)]
      .reduce<string[]>((_: string[], [integer, fraction = Text.Empty]: string[]): string[] => [integer, fraction], [])
      .reduce(reduceFloatingPoint);
};

interface UseAnimationValuesOptions {
  precision: number;
  currentValue: BigDecimal;
  previousValueOnAnimationEnd: BigDecimal;
  previousValueOnAnimationStart: BigDecimal;
}

export type AnimationValues = [[number[], number[]], [bigint, bigint, bigint], [number, number, number]];

export const useAnimationValues = (options: UseAnimationValuesOptions): AnimationValues => {
  const { precision, currentValue, previousValueOnAnimationEnd, previousValueOnAnimationStart }: UseAnimationValuesOptions = options;

  const parseBigDecimal: (value: BigDecimal) => string = useBigDecimalParser(precision);

  const characters: [string, string, string] = [previousValueOnAnimationEnd, previousValueOnAnimationStart, currentValue].map<
    string,
    [string, string, string]
  >(parseBigDecimal);

  const digits: [number[], number[]] = [characters[Integer.Zero], characters[Integer.Two]].map<number[], [number[], number[]]>(
    (characters: string): number[] =>
      [...characters].filter((character: string): boolean => RegularExpression.Digit.test(character)).map<number>(Number),
  );

  const bigInts: [bigint, bigint, bigint] = characters.map<bigint, [bigint, bigint, bigint]>(BigInt);

  const numbersOfDigits: [number, number, number] = digits
    .map<number, [number, number]>(({ length }: number[]): number => length)
    .sort((first: number, second: number): number => first - second)
    .reduce<[number[]], [[number, number]]>(([accumulator]: [number[]], value: number): [number[]] => [[...accumulator, value]], [[]])
    .reduce<number[], [number, number, number]>((_: number[], [min, max]: [number, number]): number[] => [min, max, max - min], []);

  return [digits, bigInts, numbersOfDigits];
};

interface UseAnimationLogicOptions {
  previousValue: BigDecimal;
  value: Optional<UncheckedBigDecimal>;
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

  const animationNumber: AnimationNumber = renderAnimation
    ? animationTransition === AnimationTransition.SecondToThird
      ? AnimationNumber.Three
      : animationTransition === AnimationTransition.FirstToSecond
        ? AnimationNumber.Two
        : AnimationNumber.One
    : AnimationNumber.Zero;

  const numberOfAnimations: AnimationNumber = renderAnimation
    ? hasSignChanged
      ? (previousLength < currentLength && previousValue < currentValue) || (previousLength > currentLength && previousValue > currentValue)
        ? AnimationNumber.Three
        : AnimationNumber.Two
      : previousLength !== currentLength
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

  const renderHorizontalAnimationWhenNumberOfAnimationsIsTwo: boolean = hasSignChanged
    ? animationTransition === AnimationTransition.None
      ? previousValue > currentValue
      : previousValue < currentValue
    : animationTransition === AnimationTransition.None
      ? previousLength < currentLength
      : previousLength > currentLength;

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

  const horizontalAnimationDirection: AnimationDirection =
    (numberOfAnimations === AnimationNumber.Two && (hasSignChanged ? previousValue > currentValue : previousLength < currentLength)) ||
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

// prettier-ignore
export const useEasingFunctionTypeMapper = (): EasingFunctionTypeMapper =>
  <T, U extends OrReadOnly<LinearEasingFunction>, V extends OrReadOnly<CubicBezierEasingFunction>, W extends OrReadOnly<StepsEasingFunction>, X extends unknown[] = []>(
    [linear, cubicBezier, steps]: EasingFunctions<T, U, V, W, X>, easingFunction: U | V | W, ...args: X
  ): T =>
    Array.isArray<OrReadOnly<StepsEasingFunction>, U | V>(easingFunction)
      ? Array.isOfDepth<number, Integer.Two>(easingFunction, Integer.Two)
        ? cubicBezier(easingFunction, ...args)
        : linear(easingFunction, ...args)
      : steps(easingFunction, ...args);

type FixDirection<T extends EasingFunction> = (easingFunction: OrReadOnly<T>) => T;

const useLinearDirection = (animationDirection: AnimationDirection): FixDirection<LinearEasingFunction> => {
  const copyLinear = (value: OrReadOnly<LinearEasingFunction[number]>): LinearEasingFunction[number] =>
    Array.isArray<number, OrReadOnly<[number, number] | [number, number, number]>>(value) ? [...value] : value;

  const reverseLinearTuple = (number: number, index: number, { length, [length - index]: value }: OrReadOnly<number[]>): number =>
    index ? Integer.OneHundred - value : Integer.One - number;

  const reverseLinear = (
    _: OrReadOnly<LinearEasingFunction[number]>,
    index: number,
    { length, [length - index - Integer.One]: value }: OrReadOnly<OrReadOnly<LinearEasingFunction[number]>[]>,
  ): LinearEasingFunction[number] =>
    Array.isArray<number, OrReadOnly<[number, number] | [number, number, number]>>(value)
      ? value.map<number, [number, number] | [number, number, number]>(reverseLinearTuple)
      : Integer.One - value;

  return (easingFunction: OrReadOnly<LinearEasingFunction>): LinearEasingFunction =>
    easingFunction.map<LinearEasingFunction[number], LinearEasingFunction>(
      animationDirection === AnimationDirection.Normal ? copyLinear : reverseLinear,
      [],
    );
};

const useCubicBezierDirection = (animationDirection: AnimationDirection): FixDirection<CubicBezierEasingFunction> => {
  const copyCubicBezier = (tuple: OrReadOnly<CubicBezierEasingFunction[number]>): number[] => [...tuple];

  const reverseCubicBezier = (
    _: OrReadOnly<CubicBezierEasingFunction[number]>,
    index: number,
    easingFunction: OrReadOnly<OrReadOnly<CubicBezierEasingFunction[number]>[]>,
  ): number[] =>
    easingFunction[Integer.One - index].map<number, CubicBezierEasingFunction[number]>((number: number): number => Integer.One - number);

  return (easingFunction: OrReadOnly<CubicBezierEasingFunction>): CubicBezierEasingFunction =>
    easingFunction.map<number[], CubicBezierEasingFunction>(
      animationDirection === AnimationDirection.Normal ? copyCubicBezier : reverseCubicBezier,
      [],
    );
};

const useStepsDirection = (animationDirection: AnimationDirection): FixDirection<StepsEasingFunction> => {
  const reverseStepPosition = (stepPosition: StepPosition): StepPosition =>
    [[StepPosition.JumpStart, StepPosition.JumpEnd], [StepPosition.JumpNone], [StepPosition.JumpBoth]]
      .find((steps: StepPosition[]): boolean => steps.includes(stepPosition))!
      .find(
        (step: StepPosition, _: number, steps: StepPosition[]): boolean => step === steps.at(steps.indexOf(stepPosition) - Integer.One),
      )!;

  return ({ steps, stepPosition }: OrReadOnly<StepsEasingFunction>): StepsEasingFunction => ({
    steps,
    stepPosition: animationDirection === AnimationDirection.Normal ? stepPosition : reverseStepPosition(stepPosition),
  });
};

export interface ExtendedAnimationTimingFunction {
  horizontalAnimation: OrReadOnly<EasingFunction>;
  verticalAnimation: OrReadOnly<EasingFunction>;
}

interface UseAnimationTimingFunctionOptions {
  animationTimingFunction?: OrReadOnly<EasingFunction> | ExtendedAnimationTimingFunction;
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

  const isExtendedAnimationTimingFunction = (
    animationTimingFunction: OrReadOnly<EasingFunction> | ExtendedAnimationTimingFunction,
  ): animationTimingFunction is ExtendedAnimationTimingFunction =>
    Object.keys(animationTimingFunction).some((key: string): boolean => Object.values<AnimationKey>(AnimationKey).includes<string>(key));

  const {
    [animationType === AnimationType.Horizontal ? AnimationKey.HorizontalAnimation : AnimationKey.VerticalAnimation]:
      easingFunction = AnimationTimingFunction.Ease,
  }: ExtendedAnimationTimingFunction = isExtendedAnimationTimingFunction(animationTimingFunction)
    ? animationTimingFunction
    : { horizontalAnimation: animationTimingFunction, verticalAnimation: animationTimingFunction };

  return mapEasingFunction<
    EasingFunction,
    OrReadOnly<LinearEasingFunction>,
    OrReadOnly<CubicBezierEasingFunction>,
    OrReadOnly<StepsEasingFunction>
  >([fixLinearDirection, fixCubicBezierDirection, fixStepsDirection], easingFunction);
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

export const useAnimationDuration = (options: UseAnimationDurationOptions): TupleOfLength<number, Integer.Four> => {
  const { animationType, animationDuration = {}, numberOfAnimations }: UseAnimationDurationOptions = options;

  const isAnimationDuration = (animationDuration: AnimationDuration | TotalAnimationDuration): animationDuration is AnimationDuration =>
    !Object.keys(animationDuration).length ||
    Object.keys(animationDuration).some((key: string): boolean => Object.values<AnimationKey>(AnimationKey).includes<string>(key));

  const fromAnimationDuration = ({
    horizontalAnimation = Integer.TwoThousand,
    verticalAnimation = Integer.FiveThousand,
  }: AnimationDuration): [number, number] => [
    numberOfAnimations === AnimationNumber.One ? Integer.Zero : horizontalAnimation,
    verticalAnimation,
  ];

  const fromTotalAnimationDuration = ({
    animationDuration = Integer.SixThousand,
    ratio = Integer.Five / Integer.Two,
  }: TotalAnimationDuration): [number, number] =>
    [numberOfAnimations === AnimationNumber.One ? Integer.Zero : animationDuration / (ratio + numberOfAnimations - Integer.One)].flatMap<
      number,
      [number, number]
    >((horizontalAnimationDuration: number): [number, number] => [
      horizontalAnimationDuration,
      ratio === Integer.Zero ? Integer.Zero : animationDuration - horizontalAnimationDuration * (numberOfAnimations - Integer.One),
    ]);

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

export const useRenderNegativeCharacter = (options: UseRenderNegativeCharacterOptions): boolean => {
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

type BaseView<T extends object = object, U = unknown> = {
  [K in keyof StyledView<Styled, T, U> as Uncapitalize<
    Slice<K, Styled> extends Capitalize<ViewKey> ? Slice<K, Styled> : never
  >]: StyledView<Styled, T, U>[K];
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
> = W[Key.Length] extends StyledViewTypes<G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V>[Key.Length]
  ? W
  : StyledViewTypes<G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V>[W[Key.Length]] extends [infer X extends Styled, infer Y extends object, infer Z]
    ? ViewTuple<F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, [...W, ViewTypeMap<F, X, Y, Z>]>
    : never;

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
  const mapView = ([{ viewProps, ...restView } = {}, styledComponent]: [
    ViewTuple<ViewType.View, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number],
    Styled,
  ]): UnionProduct<
    ViewTuple<ViewType.StyledView, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number],
    Optional<K | M | O | Q | S | U | W | Y>
  > => {
    const mapEntry = ([key, value]: [
      string,
      ValueOf<ViewTuple<ViewType.BaseView, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]>,
    ]): [string, ValueOf<ViewTuple<ViewType.StyledView, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]>] => [
      `${styledComponent}${key.capitalize()}`,
      value,
    ];

    const styledView: ViewTuple<ViewType.StyledView, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number] = Object.fromEntries<
      ValueOf<ViewTuple<ViewType.StyledView, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]>
    >(
      Object.entries<ValueOf<ViewTuple<ViewType.BaseView, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]>>(restView).map<
        [string, ValueOf<ViewTuple<ViewType.StyledView, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number]>]
      >(mapEntry),
    );

    return { ...styledView, ...viewProps };
  };

  return options
    .zip<TupleOfLength<Styled, Integer.Eight>>(Object.values<Styled, TupleOfLength<Styled, Integer.Eight>>(Styled))
    .map<
      UnionProduct<
        ViewTuple<ViewType.StyledView, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>[number],
        Optional<K | M | O | Q | S | U | W | Y>
      >,
      ViewTuple<ViewType.StyledViewWithProps, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>
    >(mapView);
};

// prettier-ignore
const useNumberOfDigitGroupSeparators = (precision: number): ((numberOfDigits: number) => number) =>
  (numberOfDigits: number): number =>
    [numberOfDigits - Math.max(precision, Integer.Zero), Math.max(precision, Integer.Zero)]
      .map<number>((quantity: number): number => Math.trunc((quantity - Integer.One) / Integer.Three))
      .reduce((first: number, second: number): number => first + second);

type CharacterIndexFunction = (index: number, length: number) => number;

export interface CharacterIndexFunctions {
  getCharacterIndex: CharacterIndexFunction;
  getCharacterSeparatorIndex: CharacterIndexFunction;
  getSeparatorIndex: CharacterIndexFunction;
  getDigitGroupSeparatorIndex: CharacterIndexFunction;
}

export const useCharacterIndexFunctions = (precision: number): CharacterIndexFunctions => {
  const { negativeCharacterLength }: NumbersTransitionTheme = useTheme();

  const getIndex = (index: number, length: number): number =>
    Math.trunc(
      (index + ((Integer.Three - ((length - Math.max(precision, Integer.Zero)) % Integer.Three)) % Integer.Three)) / Integer.Three,
    );

  const getCharacterIndex = (index: number, length: number): number => negativeCharacterLength + index + getIndex(index, length);
  const getCharacterSeparatorIndex = (index: number, length: number): number => getCharacterIndex(index, length) - Integer.One;
  const getSeparatorIndex = (index: number, length: number): number => getIndex(index, length) - Integer.One;
  const getDigitGroupSeparatorIndex = (index: number, length: number): number =>
    getSeparatorIndex(index, length) - (length - index < precision ? Integer.One : Integer.Zero);

  return { getCharacterIndex, getCharacterSeparatorIndex, getSeparatorIndex, getDigitGroupSeparatorIndex };
};

interface UseElementsLengthOptions {
  precision: number;
  isValueValid: boolean;
  currentValue: bigint;
  hasSignChanged: boolean;
  numberOfDigits: number;
}

export const useElementsLength = (options: UseElementsLengthOptions): ElementsLength => {
  const { precision, isValueValid, currentValue, hasSignChanged, numberOfDigits }: UseElementsLengthOptions = options;

  const calculateNumberOfDigitGroupSeparators: (numberOfDigits: number) => number = useNumberOfDigitGroupSeparators(precision);
  const sum = (first: number, second: number): number => first + second;

  const invalidLength: number = isValueValid ? Integer.Zero : Integer.One;
  const negativeCharacterLength: number = isValueValid && (hasSignChanged || currentValue < Integer.Zero) ? Integer.One : Integer.Zero;
  const digitGroupSeparatorsLength: number = isValueValid ? calculateNumberOfDigitGroupSeparators(numberOfDigits) : Integer.Zero;
  const decimalSeparatorLength: number = isValueValid && precision > Integer.Zero ? Integer.One : Integer.Zero;
  const separatorsLength: number = [digitGroupSeparatorsLength, decimalSeparatorLength].reduce(sum);
  const digitsLength: number = isValueValid ? numberOfDigits : Integer.Zero;
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

interface UseNegativeElementAnimationVisibilitiesOptions {
  animationDigits: number[][];
  hasSignChanged: boolean;
}

// prettier-ignore
export const useNegativeElementAnimationVisibilities = ({
  animationDigits,
  hasSignChanged,
}: UseNegativeElementAnimationVisibilitiesOptions): boolean[] =>
  animationDigits
    .find(({ length, ...rest }: number[]): boolean => length > Integer.One || !!rest[Integer.Zero])!
    .map((digit: number, index: number, digits: number[]): boolean => !index || (!!digit && digits[index - Integer.One] > digit) || !hasSignChanged);

type Solve<T extends EasingFunction> = (easingFunction: T, outputValue: number) => number[];

const useLinearSolver = (): Solve<LinearEasingFunction> => {
  const normalize = (value: OrArray<number>): OrArray<number | [number, number]> =>
    Array.isArray<number>(value)
      ? [value].flatMap<[number, number]>(([first, second, third]: number[]): [number, number][] => [
          [first, second / Integer.OneHundred],
          ...(third ? [[first, third / Integer.OneHundred] satisfies [number, number]] : []),
        ])
      : value;

  // prettier-ignore
  const findPrevious = (index: number): ((value: number | [number, number], currentIndex: number) => boolean) =>
    (value: number | [number, number], currentIndex: number): boolean =>
      currentIndex < index && Array.isArray<number>(value);

  // prettier-ignore
  const findNext = (index: number): ((value: number | [number, number], currentIndex: number) => boolean) =>
    (value: number | [number, number], currentIndex: number): boolean =>
      currentIndex > index && Array.isArray<number>(value);

  // prettier-ignore
  const calculateProgressInput = (index: number, array: (number | [number, number])[]): ((startIndex: number, endIndex: number) => number) =>
    (startIndex: number, endIndex: number): number =>
      [
        Array.toArray<number>(array[endIndex]).at<Integer.One>(Integer.One) * (index - startIndex),
        Array.toArray<number>(array[startIndex]).at<Integer.One>(Integer.One) * (endIndex - index),
      ].reduce((first: number, second: number): number => (first + second) / (endIndex - startIndex));

  const fillProgressInput = (value: number | [number, number], index: number, array: (number | [number, number])[]): [number, number] =>
    Array.isArray<number>(value)
      ? value
      : [value, [array.findLastIndex(findPrevious(index)), array.findIndex(findNext(index))].reduce(calculateProgressInput(index, array))];

  const getValue = ([value]: [number, number]): number => value;
  const sort = (first: number, second: number): number => first - second;

  // prettier-ignore
  const isInInterval = (index: number, outputValue: number): ((tuple: number[]) => boolean) =>
    ([first, second]: number[]): boolean =>
      (index === Integer.One ? outputValue >= first : outputValue > first) && outputValue <= second;

  // prettier-ignore
  const findInterval = (index: number, outputValue: number): ((_: [number, number][][], array: [number, number][]) => [number, number][][]) =>
    (_: [number, number][][], array: [number, number][]): [number, number][][] =>
      index && [array.map<number>(getValue).sort(sort)].every(isInInterval(index, outputValue)) ? [array] : [];

  // prettier-ignore
  const findIntervals = (outputValue: number): ((acc: [number, number][][], tuple: [number, number], index: number, array: [number, number][]) => [number, number][][]) =>
    (accumulator: [number, number][][], _: [number, number], index: number, array: [number, number][]): [number, number][][] => [
      ...accumulator,
      ...[[array[index - Integer.One], array[index]]].reduce<[number, number][][]>(findInterval(index, outputValue), []),
    ];

  // prettier-ignore
  const findSolutions = (outputValue: number): ((tuple: [[number, number], [number, number]]) => number) =>
    ([[firstY, firstX], [secondY, secondX]]: [[number, number], [number, number]]): number =>
      [(secondY - firstY) / (secondX - firstX)]
        .flatMap<number, [number, number]>((slope: number): number[] => [slope, firstY - slope * firstX])
        .reduce((slope: number, intercept: number): number => (Number.isFinite(slope) && slope ? (outputValue - intercept) / slope : firstX));

  return (easingFunction: LinearEasingFunction, outputValue: number): number[] =>
    [
      [easingFunction[Integer.Zero], Integer.Zero],
      ...easingFunction.slice(Integer.One, Integer.MinusOne),
      [...Array.toArray<number, [number]>(easingFunction.at(Integer.MinusOne)!), Integer.OneHundred],
    ]
      .flatMap<number | [number, number]>(normalize)
      .map<[number, number]>(fillProgressInput)
      .reduce<[number, number][][], [[number, number], [number, number]][]>(findIntervals(outputValue), [])
      .map<number>(findSolutions(outputValue));
};

const useCubicBezierSolver = (): Solve<CubicBezierEasingFunction> => {
  const sum = (first: number, second: number): number => first + second;

  const mapControlPoints = (_: [number, number], index: number, array: [number, number][]): [number, number] =>
    array.map<number, [number, number]>((tuple: [number, number]): number => tuple[index]);

  const calculateCoefficients = ([firstPoint, secondPoint]: [number, number]): [number, number, number] => [
    Integer.Three * (firstPoint - secondPoint) + Integer.One,
    Integer.Three * (secondPoint - Integer.Two * firstPoint),
    Integer.Three * firstPoint,
  ];

  // prettier-ignore
  const cubicBezierFunction = (tuple: [number, number]): ((value: number) => number) =>
    (value: number): number => calculateCoefficients(tuple)
      .map<number>((coefficient: number, index: number, { length }: number[]): number => coefficient * value ** (length - index))
      .reduce(sum);

  // prettier-ignore
  const calculateCubicCoefficients = (outputValue: number): ((tuple: [number, number]) => TupleOfLength<number, Integer.Four>) =>
    (tuple: [number, number]): TupleOfLength<number, Integer.Four> => [...calculateCoefficients(tuple), -outputValue];

  const calculateDepressedCoefficients = ([first, second, third, fourth]: TupleOfLength<number, Integer.Four>): [
    TupleOfLength<number, Integer.Four>,
    [number, number],
  ] => [
    [first, second, third, fourth],
    [
      (Integer.Three * first * third - second ** Integer.Two) / (Integer.Three * first ** Integer.Two),
      (Integer.Two * second ** Integer.Three -
        Integer.Nine * first * second * third +
        Integer.TwentySeven * first ** Integer.Two * fourth) /
        (Integer.TwentySeven * first ** Integer.Three),
    ],
  ];

  const calculateDiscriminant = ([coefficients, [first, second]]: [TupleOfLength<number, Integer.Four>, [number, number]]): [
    TupleOfLength<number, Integer.Four>,
    [number, number, number],
  ] => [coefficients, [(first / Integer.Three) ** Integer.Three + (second / Integer.Two) ** Integer.Two, first, second]];

  const solveForOneRoot = ([first, second]: number[], [, secondDepressed]: number[], discriminant: number): number[] => [
    [Integer.MinusOne, Integer.One]
      .map<number>((multiplier: number): number => Math.cbrt(-secondDepressed / Integer.Two + multiplier * Math.sqrt(discriminant)))
      .reduce(sum) -
      second / (Integer.Three * first),
  ];

  const solveForRepeatedRoots = ([first, second]: number[], [firstDepressed, secondDepressed]: number[]): number[] =>
    firstDepressed
      ? [Integer.MinusOne, Integer.MinusOne, Integer.Two].map<number>(
          (multiplier: number): number => multiplier * Math.cbrt(-secondDepressed / Integer.Two) - second / (Integer.Three * first),
        )
      : [-second / (Integer.Three * first)];

  const solveForThreeRoots = ([first, second]: number[], [firstDepressed, secondDepressed]: number[]): number[] =>
    [...Array(Integer.Three)].map(
      (_: unknown, index: number): number =>
        Integer.Two *
          Math.sqrt(-firstDepressed / Integer.Three) *
          Math.cos(
            (Integer.One / Integer.Three) *
              Math.acos(((Integer.Three * secondDepressed) / (Integer.Two * firstDepressed)) * Math.sqrt(-Integer.Three / firstDepressed)) -
              (Integer.Two * index * Math.PI) / Integer.Three,
          ) -
        second / (Integer.Three * first),
    );

  // prettier-ignore
  const solveCubicBezier = (coefficients: number[], [discriminant, ...depressedCoefficients]: number[]): number[] =>
    [
      (discriminant: number): boolean => Math.abs(discriminant) <= Integer.Ten ** Integer.MinusFifteen,
      (discriminant: number): boolean => discriminant > Integer.Zero,
      (discriminant: number): boolean => discriminant < Integer.Zero,
    ]
      .zip<TupleOfLength<(disc: number) => boolean, Integer.Three>, TupleOfLength<(coeffs: number[], nextCoeffs: number[], disc: number) => number[], Integer.Three>>([
        solveForRepeatedRoots, 
        solveForOneRoot, 
        solveForThreeRoots
      ])
      .find(([condition]: [(disc: number) => boolean, (coeffs: number[], nextCoeffs: number[], disc: number) => number[]]): boolean => condition(discriminant))!
      .at<Integer.One>(Integer.One)
      .call<undefined, [number[], number[], number], number[]>(undefined, coefficients, depressedCoefficients, discriminant);

  // prettier-ignore
  const findSolutions = (outputValue: number): ((xAxisPoints: [number, number], yAxisPoints: [number, number]) => number[]) =>
    (xAxisPoints: [number, number], yAxisPoints: [number, number]): number[] =>
      [yAxisPoints]
        .mapMulti<[TupleOfLength<number, Integer.Four>, number[][], number[][]], [[TupleOfLength<number, Integer.Four>], [[TupleOfLength<number, Integer.Four>, [number, number]]], [[TupleOfLength<number, Integer.Four>, [number, number, number]]]]>([calculateCubicCoefficients(outputValue), calculateDepressedCoefficients, calculateDiscriminant])
        .flat<[[number[], number[]]], Integer.One>()
        .reduce(solveCubicBezier)
        .filter((solution: number): boolean => solution >= Integer.Zero && solution <= Integer.One)
        .sort((first: number, second: number): number => first - second)
        .filter((_: number, index: number, { length }: number[]): boolean => !index || length !== Integer.Two)
        .map<number>((solved: number): number => cubicBezierFunction(xAxisPoints).call<undefined, [number], number>(undefined, solved));

  return (easingFunction: CubicBezierEasingFunction, outputValue: number): number[] =>
    easingFunction.map<[number, number], CubicBezierEasingFunction>(mapControlPoints).reduce(findSolutions(outputValue));
};

// prettier-ignore
const useStepsSolver = (): Solve<StepsEasingFunction> =>
  ({ steps, stepPosition }: StepsEasingFunction, outputValue: number): number[] => {
    switch (stepPosition) {
      case StepPosition.JumpStart:
        return [Math.floor(outputValue * steps) / steps];
      case StepPosition.JumpEnd:
        return [Math.ceil(outputValue * steps) / steps];
      case StepPosition.JumpNone:
        return [Math.ceil(outputValue * (steps - Integer.One)) / steps];
      case StepPosition.JumpBoth:
        return [Math.floor(outputValue * (steps + Integer.One)) / steps];
    }
  };

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

  const mapToLinear = (solution: number, index: number): LinearEasingFunction[number][] =>
    [...Array(Integer.Two)].map<LinearEasingFunction[number]>((_: unknown, value: number): LinearEasingFunction[number] => [
      (index + value) % Integer.Two,
      solution * Integer.OneHundred,
    ]);

  const input: number = animationVisibilities.lastIndexOf(true) / (animationVisibilities.length - Integer.One);
  const solutions: number[] = negativeCharacterAnimationMode === NegativeCharacterAnimationMode.Single ? solve(input) : [Integer.Zero];

  return [Integer.Zero, ...solutions.flatMap<LinearEasingFunction[number]>(mapToLinear), Integer.One];
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

  const fillZeros: boolean =
    numberOfAnimations === AnimationNumber.Two || previousValue < currentValue === (animationTransition === AnimationTransition.None);

  return [
    ...(fillZeros ? Array(numberOfDigitsDifference).fill(Integer.Zero) : []),
    ...(animationDirection === AnimationDirection.Normal ? previousValueDigits : currentValueDigits),
  ];
};

interface UseHorizontalAnimationWidthsOptions {
  precision: number;
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
    animationTransition,
    previousValue,
    currentValue,
    minNumberOfDigits,
    maxNumberOfDigits,
    ref,
  }: UseHorizontalAnimationWidthsOptions = options;

  const [animationStartWidth, setAnimationStartWidth]: [number, Dispatch<SetStateAction<number>>] = useState<number>(Integer.Zero);
  const { numberOfAnimations }: NumbersTransitionTheme = useTheme();
  const calculateNumberOfDigitGroupSeparators: (numberOfDigits: number) => number = useNumberOfDigitGroupSeparators(precision);

  const numberOfDigits: number =
    numberOfAnimations === AnimationNumber.Two || previousValue < currentValue === (animationTransition === AnimationTransition.None)
      ? minNumberOfDigits
      : maxNumberOfDigits;

  const startIndex: number = [
    ref.current?.children.length ?? Integer.Zero,
    numberOfDigits,
    calculateNumberOfDigitGroupSeparators(numberOfDigits),
    precision > Integer.Zero ? Integer.One : Integer.Zero,
  ].reduce((first: number, second: number): number => first - second);

  const sum = (first: number, second: number): number => first + second;

  const getElementWidth = useCallback<(element: HTMLElement) => number>(
    (element: HTMLElement): number =>
      element.offsetWidth +
      [getComputedStyle(element)]
        .flatMap<string>(({ marginLeft, marginRight }: CSSStyleDeclaration): string[] => [marginLeft, marginRight])
        .map<number>(parseFloat)
        .reduce(sum),
    [],
  );

  useLayoutEffect((): void => {
    const animationStartWidth: number = [...(ref.current?.children ?? [])]
      .filter<HTMLElement>((child: Element, index: number): child is HTMLElement => index >= startIndex && child instanceof HTMLElement)
      .map<number>(getElementWidth)
      .reduce(sum);

    setAnimationStartWidth(animationStartWidth);
  }, [ref, startIndex, getElementWidth]);

  return [animationStartWidth, ref.current?.offsetWidth ?? Integer.Zero];
};

export interface AnimationAlgorithm {
  incrementMaxLength?: number;
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
    animationAlgorithm: { incrementMaxLength = Integer.Fourteen, numberOfDigitsIncrease = Integer.Seven } = {},
    maxNumberOfDigits,
    previousValue,
    currentValue,
  }: UseVerticalAnimationDigitsOptions = options;

  const createDigitValues = (
    [first, second]: [[bigint, bigint][], [bigint, bigint][]],
    _: unknown,
    index: number,
  ): [[bigint, bigint][], [bigint, bigint][]] =>
    [previousValue, currentValue]
      .map<bigint, [bigint, bigint]>((val: bigint): bigint => val / BigInt(Integer.Ten) ** BigInt(maxNumberOfDigits - index - Integer.One))
      .sort((first: bigint, second: bigint): number => (first < second ? Integer.MinusOne : first > second ? Integer.One : Integer.Zero))
      .mapAll<[[bigint, bigint][], [bigint, bigint][]]>(([start, end]: [bigint, bigint]): [[bigint, bigint][], [bigint, bigint][]] =>
        end - start < incrementMaxLength ? [[...first, [start, end]], second] : [first, [...second, [start, end]]],
      );

  const calculate =
    (start: bigint, end: bigint): ((value: unknown, index: number, array: unknown[]) => bigint) =>
    (_: unknown, index: number, { length }: unknown[]): bigint =>
      (NumberPrecision.Value * (start * BigInt(length - index) + end * BigInt(index))) / BigInt(length);

  const round = (value: bigint): bigint =>
    value / NumberPrecision.Value +
    BigInt(value - (value / NumberPrecision.Value) * NumberPrecision.Value < NumberPrecision.HalfValue ? Integer.Zero : Integer.One);

  const getDigit = (number: bigint): number => Math.abs(Number(number % BigInt(Integer.Ten)));

  const incrementValues = ([start, end]: [bigint, bigint]): number[] =>
    [...Array(Number(end - start) + Integer.One)].map<number>((_: unknown, index: number): number => getDigit(start + BigInt(index)));

  const generateValues = ([start, end]: [bigint, bigint], index: number): number[] =>
    [...Array(incrementMaxLength + numberOfDigitsIncrease * index)]
      .mapMulti<[bigint, bigint, number]>([calculate(start, end), round, getDigit])
      .mapAll<
        number[]
      >((numbers: number[]): number[] => (numbers.at(Integer.MinusOne) === getDigit(end) ? numbers : [...numbers, getDigit(end)]));

  const mapDigitValues = (algorithmValuesArray: [bigint, bigint][], index: number): number[][] =>
    algorithmValuesArray.map<number[]>(index ? generateValues : incrementValues);

  return [...Array(maxNumberOfDigits)]
    .reduce<[[bigint, bigint][], [bigint, bigint][]]>(createDigitValues, [[], []])
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

export const useElementKeyMapper =
  <T extends GenericReactNode<ChildrenProps>, U extends object>(
    Component: FunctionalComponent<U>,
    props?: U | PropsFactory<T, U>,
  ): ElementKeyMapper<T> =>
  (child: T, index: number, { length, ...array }: T[]): ReactElement<ChildrenProps> => (
    <Component
      key={`${Component.toString()}${`${index + Integer.One}`.padStart(`${length}`.length, `${Integer.Zero}`)}`}
      {...Function.optionalCall<PropsFactory<T, U>, Optional<U>>(props, child, index, { ...array, length })}
    >
      {child}
    </Component>
  );
