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
  ExtendedAnimationTimingFunction,
  TotalAnimationDuration,
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
  useRenderNegativeCharacter,
  useStyledView,
  useValidation,
  useValue,
} from './NumbersTransition.hooks';
import { Container, EasingFunction, EasingFunctionTypeMapper, ElementsLength, NumbersTransitionTheme } from './NumbersTransition.styles';
import { BigDecimal, OrReadOnly, ReactEvent, TupleOfLength, UncheckedBigDecimal } from './NumbersTransition.types';

export interface NumbersTransitionProps<
  I extends AnimationDuration | TotalAnimationDuration = AnimationDuration,
  J extends OrReadOnly<EasingFunction> | ExtendedAnimationTimingFunction = EasingFunction,
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
  decimalSeparator?: DecimalSeparatorCharacter;
  digitGroupSeparator?: DigitGroupSeparatorCharacter;
  negativeCharacter?: NegativeCharacter;
  negativeCharacterAnimationMode?: NegativeCharacterAnimationMode;
  animationDuration?: I;
  animationTimingFunction?: J;
  animationInterruptionMode?: AnimationInterruptionMode;
  animationAlgorithm?: AnimationAlgorithm;
  invalidValue?: string;
  optimizationStrategy?: OptimizationStrategy;
  deferChunkSize?: number;
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
  I extends AnimationDuration | TotalAnimationDuration = AnimationDuration,
  J extends OrReadOnly<EasingFunction> | ExtendedAnimationTimingFunction = EasingFunction,
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
  props: NumbersTransitionProps<I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>,
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
    invalidValue = `${Number.NaN}`,
    optimizationStrategy,
    deferChunkSize,
    view,
    characterView,
    digitView,
    separatorView,
    decimalSeparatorView,
    digitGroupSeparatorView,
    negativeCharacterView,
    invalidView,
    forwardProps = [],
  }: NumbersTransitionProps<I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z> = props;

  const [validInitialValue]: [BigDecimal, boolean] = useValidation(initialValue);
  const previousValueOnStart: RefObject<BigDecimal> = useRef<BigDecimal>(validInitialValue);
  const [previousValueOnEnd, setPreviousValueOnEnd]: [BigDecimal, Dispatch<SetStateAction<BigDecimal>>] =
    useState<BigDecimal>(validInitialValue);
  const [validValue, isValueValid]: [BigDecimal, boolean] = useValue(value, previousValueOnEnd, animationInterruptionMode);

  const [animationTransition, setAnimationTransition]: [AnimationTransition, Dispatch<SetStateAction<AnimationTransition>>] =
    useState<AnimationTransition>(AnimationTransition.None);
  const componentId: string = useId();

  const [
    [previousValueOnEndDigits, valueDigits],
    [previousValueOnEndBigInt, previousValueOnStartBigInt, valueBigInt],
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

  const [animationDuration, horizontalAnimationDuration, verticalAnimationDuration, totalAnimationDuration]: TupleOfLength<
    number,
    Integer.Four
  > = useAnimationDuration({ animationType, animationDuration: animationDurationInput, numberOfAnimations });

  const renderNegativeCharacter: boolean = useRenderNegativeCharacter({
    negativeCharacterAnimationMode,
    animationTransition,
    previousValue: previousValueOnEndBigInt,
    currentValue: valueBigInt,
    isValueValid,
    hasSignChanged,
    renderAnimation,
    numberOfAnimations,
    animationType,
  });

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

  useEffect(
    (): void => [(): void => setPreviousValueOnEnd(validValue)].filterAll(omitAnimation).forEach(Function.invoke<() => void>),
    [validValue, omitAnimation],
  );

  useEffect(
    (): void =>
      [
        (): void => setPreviousValueOnEnd(previousValueOnStart.current),
        (): void => setAnimationTransition(AnimationTransition.None),
        (): unknown => (previousValueOnStart.current = validValue),
      ]
        .filter((_: () => void, index: number, { length }: (() => void)[]): boolean => index === length - Integer.One || restartAnimation)
        .forEach(Function.invoke<() => void>),
    [validValue, restartAnimation],
  );

  const shouldForwardProp = (prop: string): boolean => [...Object.values<ForwardProp>(ForwardProp), ...forwardProps].includes<string>(prop);

  const onAnimationEnd: AnimationEventHandler<HTMLDivElement> = ({ target: { id } }: ReactEvent<AnimationEvent<HTMLDivElement>>): void =>
    [
      (): boolean => !Object.values<AnimationId>(AnimationId).some((animId: AnimationId): boolean => `${animId}${componentId}` === id),
      (): boolean => numberOfAnimations === AnimationNumber.One,
      (): boolean => numberOfAnimations === AnimationNumber.Three && animationTransition === AnimationTransition.FirstToSecond,
      (): boolean => animationTransition !== AnimationTransition.None,
      (): boolean => true,
    ]
      .zip<TupleOfLength<() => boolean, Integer.Five>, TupleOfLength<(() => void)[], Integer.Five>>([
        [],
        [(): void => setPreviousValueOnEnd(validValue)],
        [(): void => setAnimationTransition(AnimationTransition.SecondToThird)],
        [(): void => setPreviousValueOnEnd(validValue), (): void => setAnimationTransition(AnimationTransition.None)],
        [(): void => setAnimationTransition(AnimationTransition.FirstToSecond)],
      ])
      .find(([condition]: [() => boolean, (() => void)[]]): boolean => condition())!
      .at<Integer.One>(Integer.One)
      .forEach(Function.invoke<() => void>);

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
    decimalSeparator,
    digitGroupSeparator,
    characterStyledView,
    digitStyledView,
    separatorStyledView,
    decimalSeparatorStyledView,
    digitGroupSeparatorStyledView,
  };

  const animationProps: AnimationProps<M, N, O, P, Q, R, S, T, U, V, W, X> = {
    ...negativeProps,
    ...numberProps,
    componentId,
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

  const valueElement: ReactElement = (
    <Conditional condition={isValueValid}>
      <NumberElement<M, N, O, P, Q, R, S, T, U, V> {...numberProps}>{previousValueOnEndDigits}</NumberElement>
      <InvalidElement<M, N, Y, Z>
        invalidValue={invalidValue}
        characterStyledView={characterStyledView}
        invalidStyledView={invalidStyledView}
      />
    </Conditional>
  );

  const containerElement: ReactElement = (
    <Container {...styledView} onAnimationEnd={onAnimationEnd}>
      <Show condition={renderNegativeCharacter}>
        <NegativeElement<M, N, W, X> {...negativeProps} characterStyledView={characterStyledView} />
      </Show>
      <Conditional condition={renderAnimation}>
        {animationElement}
        {valueElement}
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
