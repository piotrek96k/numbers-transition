import {
  AnimationEvent,
  AnimationEventHandler,
  Dispatch,
  ReactElement,
  ReactNode,
  RefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import { StyleSheetManager, ThemeProvider } from 'styled-components';
import {
  Conditional,
  HorizontalAnimationElement,
  InvalidElement,
  NegativeElement,
  NumberElement,
  Optional,
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
  InvalidValue,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  OptimizationStrategy,
} from './NumbersTransition.enums';
import {
  AnimationAlgorithm,
  AnimationDuration,
  AnimationDurationTuple,
  AnimationLogic,
  AnimationNumbersTuple,
  AnimationValuesTuple,
  ExtendedAnimationTimingFunction,
  StyledViewWithPropsTuple,
  TotalAnimationDuration,
  ValidationTuple,
  View,
  useAnimationDirection,
  useAnimationDuration,
  useAnimationLogic,
  useAnimationNumbers,
  useAnimationTimingFunction,
  useAnimationType,
  useAnimationValues,
  useElementsLength,
  useRenderNegativeCharacter,
  useStyledView,
  useValidation,
  useValue,
} from './NumbersTransition.hooks';
import { AnimationTimingFunctionTuple, Container, ElementsLength, NumbersTransitionTheme } from './NumbersTransition.styles';
import { BigDecimal, OrReadOnly, ReactEvent, UncheckedBigDecimal } from './NumbersTransition.types';

export interface NumbersTransitionProps<
  I extends AnimationDuration | TotalAnimationDuration = AnimationDuration,
  J extends OrReadOnly<AnimationTimingFunctionTuple> | ExtendedAnimationTimingFunction = AnimationTimingFunctionTuple,
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
  view?: View<K, L>;
  symbolView?: View<M, N>;
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
  J extends OrReadOnly<AnimationTimingFunctionTuple> | ExtendedAnimationTimingFunction = AnimationTimingFunctionTuple,
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
    invalidValue = InvalidValue.Value,
    optimizationStrategy,
    view,
    symbolView,
    digitView,
    separatorView,
    decimalSeparatorView,
    digitGroupSeparatorView,
    negativeCharacterView,
    invalidView,
    forwardProps = [],
  }: NumbersTransitionProps<I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z> = props;

  const [validInitialValue]: ValidationTuple = useValidation(initialValue);
  const previousValueOnStart: RefObject<BigDecimal> = useRef<BigDecimal>(validInitialValue);
  const [previousValueOnEnd, setPreviousValueOnAnimationEnd]: [BigDecimal, Dispatch<SetStateAction<BigDecimal>>] =
    useState<BigDecimal>(validInitialValue);
  const [validValue, isValueValid]: ValidationTuple = useValue(value, previousValueOnEnd, animationInterruptionMode);

  const [animationTransition, setAnimationTransition]: [AnimationTransition, Dispatch<SetStateAction<AnimationTransition>>] =
    useState<AnimationTransition>(AnimationTransition.None);

  const [
    [previousValueOnEndDigits, valueDigits],
    [previousValueOnEndBigInt, previousValueOnStartBigInt, valueBigInt],
    [minNumberOfDigits, maxNumberOfDigits, numberOfDigitsDifference],
  ]: AnimationValuesTuple = useAnimationValues({
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

  const [animationNumber, numberOfAnimations]: AnimationNumbersTuple = useAnimationNumbers({
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

  const [animationDuration, horizontalAnimationDuration, verticalAnimationDuration, totalAnimationDuration]: AnimationDurationTuple =
    useAnimationDuration({ animationType, animationDuration: animationDurationInput, numberOfAnimations });

  const animationTimingFunction: AnimationTimingFunctionTuple = useAnimationTimingFunction({
    animationTimingFunction: animationTimingFunctionInput,
    animationType,
    animationDirection,
  });

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
    symbolStyledView,
    digitStyledView,
    separatorStyledView,
    decimalSeparatorStyledView,
    digitGroupSeparatorStyledView,
    negativeCharacterStyledView,
    invalidStyledView,
  ]: StyledViewWithPropsTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z> = useStyledView<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>([
    view,
    symbolView,
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

  useEffect((): void => {
    if (omitAnimation) {
      setPreviousValueOnAnimationEnd(validValue);
    }
  }, [validValue, omitAnimation]);

  useEffect((): void => {
    if (restartAnimation) {
      setPreviousValueOnAnimationEnd(previousValueOnStart.current);
      setAnimationTransition(AnimationTransition.None);
    }
    previousValueOnStart.current = validValue;
  }, [validValue, restartAnimation]);

  const shouldForwardProp = (prop: string): boolean =>
    [Object.values<ForwardProp>(ForwardProp), forwardProps].some((forwardProps: string[]): boolean => forwardProps.includes<string>(prop));

  const onAnimationEnd: AnimationEventHandler<HTMLDivElement> = (event: ReactEvent<AnimationEvent<HTMLDivElement>>): void => {
    if (!Object.values(AnimationId).includes<string>(event.target.id)) {
      return;
    }

    if (numberOfAnimations === AnimationNumber.One) {
      setPreviousValueOnAnimationEnd(validValue);
    } else if (numberOfAnimations === AnimationNumber.Three && animationTransition === AnimationTransition.FirstToSecond) {
      setAnimationTransition(AnimationTransition.SecondToThird);
    } else if (animationTransition !== AnimationTransition.None) {
      setPreviousValueOnAnimationEnd(validValue);
      setAnimationTransition(AnimationTransition.None);
    } else {
      setAnimationTransition(AnimationTransition.FirstToSecond);
    }
  };

  const theme: NumbersTransitionTheme = {
    ...elementsLength,
    numberOfAnimations,
    animationNumber,
    animationType,
    animationDirection,
    animationDuration,
    animationTimingFunction,
    horizontalAnimationDuration,
    verticalAnimationDuration,
    totalAnimationDuration,
  };

  const negativeElement: ReactElement = (
    <Optional condition={renderNegativeCharacter}>
      <NegativeElement<M, N, W, X>
        negativeCharacter={negativeCharacter}
        symbolStyledView={symbolStyledView}
        negativeCharacterStyledView={negativeCharacterStyledView}
      />
    </Optional>
  );

  const numberElement: ReactElement = (
    <NumberElement<M, N, O, P, Q, R, S, T, U, V>
      precision={precision}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      symbolStyledView={symbolStyledView}
      digitStyledView={digitStyledView}
      separatorStyledView={separatorStyledView}
      decimalSeparatorStyledView={decimalSeparatorStyledView}
      digitGroupSeparatorStyledView={digitGroupSeparatorStyledView}
    >
      {previousValueOnEndDigits}
    </NumberElement>
  );

  const horizontalAnimationElement: ReactElement = (
    <HorizontalAnimationElement<M, N, O, P, Q, R, S, T, U, V, W, X>
      precision={precision}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      negativeCharacter={negativeCharacter}
      animationTransition={animationTransition}
      previousValueDigits={previousValueOnEndDigits}
      currentValueDigits={valueDigits}
      previousValue={previousValueOnEndBigInt}
      currentValue={valueBigInt}
      minNumberOfDigits={minNumberOfDigits}
      maxNumberOfDigits={maxNumberOfDigits}
      numberOfDigitsDifference={numberOfDigitsDifference}
      hasSignChanged={hasSignChanged}
      symbolStyledView={symbolStyledView}
      digitStyledView={digitStyledView}
      separatorStyledView={separatorStyledView}
      decimalSeparatorStyledView={decimalSeparatorStyledView}
      digitGroupSeparatorStyledView={digitGroupSeparatorStyledView}
      negativeCharacterStyledView={negativeCharacterStyledView}
    />
  );

  const verticalAnimationElement: ReactElement = (
    <VerticalAnimationElement<M, N, O, P, Q, R, S, T, U, V, W, X>
      precision={precision}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      negativeCharacter={negativeCharacter}
      negativeCharacterAnimationMode={negativeCharacterAnimationMode}
      animationAlgorithm={animationAlgorithm}
      optimizationStrategy={optimizationStrategy}
      previousValue={previousValueOnEndBigInt}
      currentValue={valueBigInt}
      maxNumberOfDigits={maxNumberOfDigits}
      hasSignChanged={hasSignChanged}
      symbolStyledView={symbolStyledView}
      digitStyledView={digitStyledView}
      separatorStyledView={separatorStyledView}
      decimalSeparatorStyledView={decimalSeparatorStyledView}
      digitGroupSeparatorStyledView={digitGroupSeparatorStyledView}
      negativeCharacterStyledView={negativeCharacterStyledView}
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
      {numberElement}
      <InvalidElement<M, N, Y, Z> invalidValue={invalidValue} symbolStyledView={symbolStyledView} invalidStyledView={invalidStyledView} />
    </Conditional>
  );

  const containerElement: ReactElement = (
    <Container {...styledView} onAnimationEnd={onAnimationEnd}>
      {negativeElement}
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
