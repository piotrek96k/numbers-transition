import {
  AnimationEvent,
  AnimationEventHandler,
  Dispatch,
  ReactElement,
  ReactNode,
  RefObject,
  SetStateAction,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { StyleSheetManager, ThemeProvider } from 'styled-components';
import {
  AnimationProps,
  Conditional,
  HorizontalAnimationElement,
  InvalidElement,
  NegativeElement,
  NegativeProps,
  NumberElement,
  NumberProps,
  Show,
  VerticalAnimationElement,
} from './NumbersTransition.components';
import {
  AnimationDirection,
  AnimationId,
  AnimationInterruptionMode,
  AnimationNumber,
  AnimationTransition,
  AnimationType,
  DecimalSeparatorCharacter,
  DigitGroupSeparatorCharacter,
  ForwardProp,
  Integer,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  OptimizationStrategy,
  ViewType,
} from './NumbersTransition.enums';
import {
  AnimationAlgorithm,
  AnimationDuration,
  AnimationLogic,
  AnimationValues,
  TotalAnimationDuration,
  UnknownAnimationTimingFunction,
  View,
  ViewTuple,
  useAnimationDirection,
  useAnimationDuration,
  useAnimationLogic,
  useAnimationNumbers,
  useAnimationTimingFunction,
  useAnimationType,
  useAnimationValues,
  useEasingFunctionTypeMapper,
  useElementsLength,
  useRenderNegativeElement,
  useStyledView,
  useValidation,
  useValue,
} from './NumbersTransition.hooks';
import { Container, EasingFunction, EasingFunctionTypeMapper, ElementsLength, NumbersTransitionTheme } from './NumbersTransition.styles';
import type { BigDecimal, ReactEvent, TupleOfLength, UncheckedBigDecimal } from './NumbersTransition.types';
import { CharSequence, Double, List, Long, Pattern, Predicate, Struct } from './NumbersTransition.extensions';

export interface NumbersTransitionProps<
  K extends object = object,
  L = unknown,
  M extends object = object,
  N = unknown,
  O extends object = object,
  P = unknown,
  Q extends object = object,
  R = unknown,
  S extends object = object,
  T = unknown,
  U extends object = object,
  V = unknown,
  W extends object = object,
  X = unknown,
  Y extends object = object,
  Z = unknown,
> {
  initialValue?: UncheckedBigDecimal | BigDecimal;
  value?: UncheckedBigDecimal | BigDecimal;
  precision?: number;
  digitGroupSeparator?: DigitGroupSeparatorCharacter;
  decimalSeparator?: DecimalSeparatorCharacter;
  negativeCharacter?: NegativeCharacter;
  negativeCharacterAnimationMode?: NegativeCharacterAnimationMode;
  animationDuration?: AnimationDuration | TotalAnimationDuration;
  animationTimingFunction?: UnknownAnimationTimingFunction;
  animationInterruptionMode?: AnimationInterruptionMode;
  animationAlgorithm?: AnimationAlgorithm;
  optimizationStrategy?: OptimizationStrategy;
  deferChunkSize?: number;
  invalidValue?: string;
  view?: View<K, L>;
  characterView?: View<M, N>;
  digitView?: View<O, P>;
  separatorView?: View<Q, R>;
  decimalSeparatorView?: View<S, T>;
  digitGroupSeparatorView?: View<U, V>;
  negativeCharacterView?: View<W, X>;
  invalidView?: View<Y, Z>;
  forwardProps?: string[];
}

const NumbersTransition = <
  K extends object = object,
  L = unknown,
  M extends object = object,
  N = unknown,
  O extends object = object,
  P = unknown,
  Q extends object = object,
  R = unknown,
  S extends object = object,
  T = unknown,
  U extends object = object,
  V = unknown,
  W extends object = object,
  X = unknown,
  Y extends object = object,
  Z = unknown,
>(
  props: NumbersTransitionProps<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>,
): ReactNode => {
  const {
    initialValue,
    value,
    precision = Integer.Zero,
    digitGroupSeparator = DigitGroupSeparatorCharacter.Space,
    decimalSeparator = digitGroupSeparator === DigitGroupSeparatorCharacter.Comma
      ? DecimalSeparatorCharacter.Dot
      : DecimalSeparatorCharacter.Comma,
    negativeCharacter = NegativeCharacter.Minus,
    negativeCharacterAnimationMode = NegativeCharacterAnimationMode.Single,
    animationDuration: animationDurationInput,
    animationTimingFunction: animationTimingFunctionInput,
    animationInterruptionMode,
    animationAlgorithm,
    optimizationStrategy,
    deferChunkSize,
    invalidValue = `${Number.NaN}`,
    view,
    characterView,
    digitView,
    separatorView,
    decimalSeparatorView,
    digitGroupSeparatorView,
    negativeCharacterView,
    invalidView,
    forwardProps = [],
  }: NumbersTransitionProps<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z> = props;

  const identifier: string = useId();

  const [validInitialValue]: [BigDecimal, boolean] = useValidation(initialValue);
  const previousValueOnStart: RefObject<BigDecimal> = useRef<BigDecimal>(validInitialValue);
  const [previousValueOnEnd, setPreviousValueOnEnd]: [BigDecimal, Dispatch<SetStateAction<BigDecimal>>] =
    useState<BigDecimal>(validInitialValue);
  const [validValue, isValueValid]: [BigDecimal, boolean] = useValue(value, previousValueOnEnd, animationInterruptionMode);

  const [animationTransition, setAnimationTransition]: [AnimationTransition, Dispatch<SetStateAction<AnimationTransition>>] =
    useState<AnimationTransition>(AnimationTransition.None);

  const [
    [previousValueOnStartDigits, previousValueOnEndDigits, valueDigits],
    [previousValueOnStartBigInt, previousValueOnEndBigInt, valueBigInt],
    [minNumberOfDigits, maxNumberOfDigits, numberOfDigitsDifference],
  ]: AnimationValues = useAnimationValues({
    precision,
    currentValue: validValue,
    previousValueOnAnimationEnd: previousValueOnEnd,
    previousValueOnAnimationStart: previousValueOnStart.current,
  });

  const { hasSignChanged, omitAnimation, restartAnimation, renderAnimation }: AnimationLogic = useAnimationLogic({
    previousValue: previousValueOnEnd,
    value,
    isValueValid,
    previousValueOnStart: previousValueOnStartBigInt,
    previousValueOnEnd: previousValueOnEndBigInt,
    currentValue: valueBigInt,
  });

  const [animationNumber, numberOfAnimations]: [AnimationNumber, AnimationNumber] = useAnimationNumbers({
    animationTransition,
    previousValueDigits: previousValueOnEndDigits,
    currentValueDigits: valueDigits,
    previousValue: previousValueOnEndBigInt,
    currentValue: valueBigInt,
    hasSignChanged,
    renderAnimation,
  });

  const animationType: AnimationType = useAnimationType({
    animationTransition,
    previousValueDigits: previousValueOnEndDigits,
    currentValueDigits: valueDigits,
    previousValue: previousValueOnEndBigInt,
    currentValue: valueBigInt,
    hasSignChanged,
    renderAnimation,
    numberOfAnimations,
  });

  const animationDirection: AnimationDirection = useAnimationDirection({
    animationType,
    animationTransition,
    previousValueDigits: previousValueOnEndDigits,
    currentValueDigits: valueDigits,
    previousValue: previousValueOnEndBigInt,
    currentValue: valueBigInt,
    hasSignChanged,
    numberOfAnimations,
  });

  const mapEasingFunction: EasingFunctionTypeMapper = useEasingFunctionTypeMapper();

  const animationTimingFunction: EasingFunction = useAnimationTimingFunction({
    animationTimingFunction: animationTimingFunctionInput,
    animationType,
    animationDirection,
  });

  // prettier-ignore
  const [animationDuration, horizontalAnimationDuration, verticalAnimationDuration, totalAnimationDuration]: TupleOfLength<number, Integer.Four> = 
    useAnimationDuration({ animationType, animationDuration: animationDurationInput, numberOfAnimations });

  // prettier-ignore
  const [
    styledView,
    characterStyledView,
    digitStyledView,
    separatorStyledView,
    decimalSeparatorStyledView,
    digitGroupSeparatorStyledView,
    negativeCharacterStyledView,
    invalidStyledView,
  ]: ViewTuple<ViewType.StyledViewWithProps, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z> = useStyledView<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>([
    view,
    characterView,
    digitView,
    separatorView,
    decimalSeparatorView,
    digitGroupSeparatorView,
    negativeCharacterView,
    invalidView,
  ]);

  const elementsLength: ElementsLength = useElementsLength({
    precision,
    isValueValid,
    currentValue: valueBigInt,
    hasSignChanged,
    numberOfDigits: maxNumberOfDigits,
  });

  const renderNegativeElement: boolean = useRenderNegativeElement({
    negativeCharacterAnimationMode,
    animationTransition,
    previousValueOnStart: previousValueOnStartBigInt,
    previousValueOnEnd: previousValueOnEndBigInt,
    currentValue: valueBigInt,
    hasSignChanged,
    restartAnimation,
    renderAnimation,
    numberOfAnimations,
    animationType,
  });

  const typeMap = new Map([
      ['Boolean', Predicate],
      ['Number', Double],
      ['BigInt', Long],
      ['String', CharSequence],
      ['RegExp', Pattern],
      ['Array', List],
      ['Object', Struct],
    ]),
    readSources = (extension) => {
      const sources = [extension];
      let prototype = Object.getPrototypeOf(extension);
      while (prototype && prototype !== Object.prototype) {
        sources.unshift(prototype);
        prototype = Object.getPrototypeOf(prototype);
      }
      return sources;
    };

  const wrap = (value, cls, isStatic, key) =>
      value?.[key] === void 0 ? (isStatic ? typeMap.get(cls) : new (typeMap.get(cls))(value)) : value,
    merge = (value, cls, isStatic) => {
      const object = Object.create(isStatic ? value : Object.getPrototypeOf(value));
      Object.defineProperties(object, Object.getOwnPropertyDescriptors(isStatic ? value : Object(value)));
      const descriptions = Object.assign(
        {},
        ...readSources(isStatic ? typeMap.get(cls) : new (typeMap.get(cls))(value)).map((source) =>
          Object.fromEntries(
            Object.getOwnPropertyNames(source)
              .filter((key) => key !== 'constructor' && !(key in object))
              .map((key) => [key, Object.getOwnPropertyDescriptor(source, key)]),
          ),
        ),
      );
      return Object.defineProperties(object, descriptions);
    },
    proxy = (value, tuples, key) => {
      const found = tuples.find(([cls, isStatic]) => (isStatic ? typeMap.get(cls).type === value : typeMap.get(cls).isType(value)));
      return found ? (key !== undefined ? wrap(value, found[0], found[1], key) : merge(value, found[0], found[1])) : value;
    };

  const { sum } = proxy(
    Number,
    [
      ['Number', true],
      ['Number', false],
    ],
    'sum',
  );

  function distance(value, ctor) {
    let d = 0;
    let p = Object.getPrototypeOf(value);

    while (p) {
      if (p.constructor === ctor) return d;
      p = Object.getPrototypeOf(p);
      d++;
    }

    return Infinity;
  }

  console.log(sum);
  console.log(distance([], Array));
  // console.log(wrap(Number, 'Number', true, 'sum').sum);
  // console.log(merge(1, 'Number', false));

  useEffect(
    (): void => [(): void => setPreviousValueOnEnd(validValue)].when(omitAnimation).forEach(Function.invoke<void>),
    [validValue, omitAnimation],
  );

  useEffect(
    (): void =>
      [(): void => setPreviousValueOnEnd(previousValueOnStart.current), (): void => setAnimationTransition(AnimationTransition.None)]
        .when(restartAnimation)
        .append<() => unknown>((): unknown => (previousValueOnStart.current = validValue))
        .forEach(Function.invoke<unknown>),
    [validValue, restartAnimation],
  );

  const shouldForwardProp = (prop: string): boolean => [...ForwardProp.values<ForwardProp>(), ...forwardProps].includes<string>(prop);

  const onAnimationEnd: AnimationEventHandler<HTMLDivElement> = ({ target: { id } }: ReactEvent<AnimationEvent<HTMLDivElement>>): void =>
    [
      numberOfAnimations === AnimationNumber.One,
      numberOfAnimations === AnimationNumber.Three && animationTransition === AnimationTransition.FirstToSecond,
      animationTransition !== AnimationTransition.None,
      true,
    ]
      .zip<TupleOfLength<boolean, Integer.Four>, TupleOfLength<(() => void)[], Integer.Four>>(
        [(): void => setPreviousValueOnEnd(validValue)],
        [(): void => setAnimationTransition(AnimationTransition.SecondToThird)],
        [(): void => setPreviousValueOnEnd(validValue), (): void => setAnimationTransition(AnimationTransition.None)],
        [(): void => setAnimationTransition(AnimationTransition.FirstToSecond)],
      )
      .when(AnimationId.values<AnimationId>().some((animation: AnimationId): boolean => `${animation}${identifier}` === id))
      .findMap<void>(
        ([condition]: [boolean, (() => void)[]]): boolean => condition,
        ([, callbacks]: [boolean, (() => void)[]]): void => callbacks.forEach(Function.invoke<void>),
      );

  const theme: NumbersTransitionTheme = {
    ...elementsLength,
    numberOfAnimations,
    animationNumber,
    animationType,
    animationDirection,
    mapEasingFunction,
    animationTimingFunction,
    animationDuration,
    horizontalAnimationDuration,
    verticalAnimationDuration,
    totalAnimationDuration,
  };

  const negativeProps: NegativeProps<W, X> = { negativeCharacter, negativeCharacterStyledView };

  const numberProps: NumberProps<M, N, O, P, Q, R, S, T, U, V> = {
    precision,
    digitGroupSeparator,
    decimalSeparator,
    characterStyledView,
    digitStyledView,
    separatorStyledView,
    decimalSeparatorStyledView,
    digitGroupSeparatorStyledView,
  };

  const animationProps: AnimationProps<M, N, O, P, Q, R, S, T, U, V, W, X> = {
    ...negativeProps,
    ...numberProps,
    identifier,
    previousValue: previousValueOnEndBigInt,
    currentValue: valueBigInt,
    maxNumberOfDigits,
    hasSignChanged,
  };

  const horizontalAnimationElement: ReactElement = (
    <HorizontalAnimationElement<M, N, O, P, Q, R, S, T, U, V, W, X>
      {...animationProps}
      animationTransition={animationTransition}
      previousValueDigits={previousValueOnEndDigits}
      currentValueDigits={valueDigits}
      minNumberOfDigits={minNumberOfDigits}
      numberOfDigitsDifference={numberOfDigitsDifference}
    />
  );

  const verticalAnimationElement: ReactElement = (
    <VerticalAnimationElement<M, N, O, P, Q, R, S, T, U, V, W, X>
      {...animationProps}
      negativeCharacterAnimationMode={negativeCharacterAnimationMode}
      animationAlgorithm={animationAlgorithm}
      optimizationStrategy={optimizationStrategy}
      deferChunkSize={deferChunkSize}
    />
  );

  const animationElement: ReactElement = (
    <Conditional condition={animationType === AnimationType.Horizontal}>
      {horizontalAnimationElement}
      {verticalAnimationElement}
    </Conditional>
  );

  const numberElement: ReactElement = (
    <NumberElement<M, N, O, P, Q, R, S, T, U, V> {...numberProps}>
      {restartAnimation ? previousValueOnStartDigits : previousValueOnEndDigits}
    </NumberElement>
  );

  const validElement: ReactElement = (
    <>
      <Show condition={renderNegativeElement}>
        <NegativeElement<M, N, W, X> {...negativeProps} characterStyledView={characterStyledView} />
      </Show>
      <Conditional condition={renderAnimation}>
        {animationElement}
        {numberElement}
      </Conditional>
    </>
  );

  const invalidElement: ReactElement = (
    <InvalidElement<M, N, Y, Z>
      invalidValue={invalidValue}
      characterStyledView={characterStyledView}
      invalidStyledView={invalidStyledView}
    />
  );

  const containerElement: ReactElement = (
    <Container {...styledView} onAnimationEnd={onAnimationEnd}>
      <Conditional condition={isValueValid}>
        {validElement}
        {invalidElement}
      </Conditional>
    </Container>
  );

  return (
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <ThemeProvider theme={theme}>{containerElement}</ThemeProvider>
    </StyleSheetManager>
  );
};

export default NumbersTransition;
