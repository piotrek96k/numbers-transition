import {
  AnimationEvent,
  AnimationEventHandler,
  Dispatch,
  ReactElement,
  ReactNode,
  RefObject,
  SetStateAction,
  SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { StyleSheetManager, ThemeProvider } from 'styled-components';
import {
  Conditional,
  HorizontalAnimationElement,
  InvalidElement,
  NegativeCharacterElement,
  NumberElement,
  Optional,
  VerticalAnimationElement,
} from './NumbersTransition.components';
import {
  AnimationIds,
  AnimationInterruptionModes,
  AnimationNumbers,
  AnimationTransitions,
  AnimationTypes,
  DecimalSeparators,
  DigitGroupSeparators,
  ForwardProps,
  InvalidValue,
  NegativeCharacterAnimationModes,
  NegativeCharacters,
  Numbers,
} from './NumbersTransition.enums';
import './NumbersTransition.extensions.ts';
import {
  AnimationAlgorithm,
  AnimationDuration,
  AnimationDurationTuple,
  AnimationTimingFunctionTuple,
  AnimationValuesTuple,
  ExtendedAnimationTimingFunction,
  StyledViewWithPropsTuple,
  TotalAnimationDuration,
  ValidationTuple,
  View,
  useAnimationDuration,
  useAnimationTimingFunction,
  useAnimationValues,
  useStyledView,
  useTotalAnimationDuration,
  useValidation,
  useValue,
} from './NumbersTransition.hooks';
import { AnimationTimingFunction, Container, NumbersTransitionTheme } from './NumbersTransition.styles';
import { BigDecimal, OrReadOnly, UncheckedBigDecimal } from './NumbersTransition.types';

type ReactEvent<T extends SyntheticEvent<HTMLElement, Event>> = T & { target: HTMLElement };

export interface NumbersTransitionProps<
  I extends AnimationDuration | TotalAnimationDuration = AnimationDuration,
  J extends OrReadOnly<AnimationTimingFunction> | ExtendedAnimationTimingFunction = AnimationTimingFunction,
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
  decimalSeparator?: DecimalSeparators;
  digitGroupSeparator?: DigitGroupSeparators;
  negativeCharacter?: NegativeCharacters;
  negativeCharacterAnimationMode?: NegativeCharacterAnimationModes;
  animationDuration?: I;
  animationTimingFunction?: J;
  animationInterruptionMode?: AnimationInterruptionModes;
  animationAlgorithm?: AnimationAlgorithm;
  invalidValue?: string;
  view?: View<K, L>;
  characterView?: View<M, N>;
  digitView?: View<O, P>;
  separatorView?: View<Q, R>;
  decimalSeparatorView?: View<S, T>;
  digitGroupSeparatorView?: View<U, V>;
  negativeCharacterView?: View<W, X>;
  invalidView?: View<Y, Z>;
}

const NumbersTransition = <
  I extends AnimationDuration | TotalAnimationDuration = AnimationDuration,
  J extends OrReadOnly<AnimationTimingFunction> | ExtendedAnimationTimingFunction = AnimationTimingFunction,
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
    precision = Numbers.ZERO,
    digitGroupSeparator = DigitGroupSeparators.SPACE,
    decimalSeparator = digitGroupSeparator === DigitGroupSeparators.COMMA ? DecimalSeparators.DOT : DecimalSeparators.COMMA,
    negativeCharacter = NegativeCharacters.MINUS,
    negativeCharacterAnimationMode = NegativeCharacterAnimationModes.SINGLE,
    animationDuration,
    animationTimingFunction,
    animationInterruptionMode,
    animationAlgorithm,
    invalidValue = InvalidValue.VALUE,
    view,
    characterView,
    digitView,
    separatorView,
    decimalSeparatorView,
    digitGroupSeparatorView,
    negativeCharacterView,
    invalidView,
  }: NumbersTransitionProps<I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z> = props;

  const [validInitialValue]: ValidationTuple = useValidation(initialValue);
  const previousValueOnAnimationStart: RefObject<BigDecimal> = useRef<BigDecimal>(validInitialValue);
  const [previousValueOnAnimationEnd, setPreviousValueOnAnimationEnd]: [BigDecimal, Dispatch<SetStateAction<BigDecimal>>] =
    useState<BigDecimal>(validInitialValue);
  const [validValue, isValueValid]: ValidationTuple = useValue(value, previousValueOnAnimationEnd, animationInterruptionMode);

  const [animationTransition, setAnimationTransition]: [AnimationTransitions, Dispatch<SetStateAction<AnimationTransitions>>] =
    useState<AnimationTransitions>(AnimationTransitions.NONE);

  const [
    [previousValueOnAnimationEndDigits, valueDigits],
    [previousValueOnAnimationEndBigInt, previousValueOnAnimationStartBigInt, valueBigInt],
    [minNumberOfDigits, maxNumberOfDigits, numberOfDigitsDifference],
  ]: AnimationValuesTuple = useAnimationValues({
    precision,
    currentValue: validValue,
    previousValueOnAnimationEnd,
    previousValueOnAnimationStart: previousValueOnAnimationStart.current,
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
  ]: StyledViewWithPropsTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z> = useStyledView<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>([
    view,
    characterView,
    digitView,
    separatorView,
    decimalSeparatorView,
    digitGroupSeparatorView,
    negativeCharacterView,
    invalidView,
  ]);

  const hasValueChanged: boolean = valueBigInt !== previousValueOnAnimationEndBigInt;
  const hasSignChanged: boolean = (valueBigInt ^ previousValueOnAnimationEndBigInt) < Numbers.ZERO;
  const hasTheSameNumberOfDigits: boolean = previousValueOnAnimationEndDigits.length === valueDigits.length;
  const omitAnimation: boolean = isValueValid && value !== previousValueOnAnimationEnd && !hasValueChanged;
  const restartAnimation: boolean =
    valueBigInt !== previousValueOnAnimationStartBigInt && previousValueOnAnimationEndBigInt !== previousValueOnAnimationStartBigInt;
  const renderAnimation: boolean = isValueValid && hasValueChanged && !restartAnimation;

  const hasThreeAnimations: boolean =
    (previousValueOnAnimationEndDigits.length < valueDigits.length && previousValueOnAnimationEndBigInt < valueBigInt) ||
    (previousValueOnAnimationEndDigits.length > valueDigits.length && previousValueOnAnimationEndBigInt > valueBigInt);

  const numberOfAnimations: AnimationNumbers = renderAnimation
    ? hasSignChanged
      ? hasThreeAnimations
        ? AnimationNumbers.THREE
        : AnimationNumbers.TWO
      : hasTheSameNumberOfDigits
        ? AnimationNumbers.ONE
        : AnimationNumbers.TWO
    : AnimationNumbers.ZERO;

  const currentAnimationNumber: AnimationNumbers = renderAnimation
    ? animationTransition === AnimationTransitions.SECOND_TO_THIRD
      ? AnimationNumbers.THREE
      : animationTransition === AnimationTransitions.FIRST_TO_SECOND
        ? AnimationNumbers.TWO
        : AnimationNumbers.ONE
    : AnimationNumbers.ZERO;

  const renderHorizontalAnimationWhenNumberOfAnimationsIsTwo: boolean = hasSignChanged
    ? animationTransition === AnimationTransitions.NONE
      ? previousValueOnAnimationEndBigInt > valueBigInt
      : previousValueOnAnimationEndBigInt < valueBigInt
    : animationTransition === AnimationTransitions.NONE
      ? previousValueOnAnimationEndDigits.length < valueDigits.length
      : previousValueOnAnimationEndDigits.length > valueDigits.length;

  const renderHorizontalAnimation: boolean =
    (numberOfAnimations === AnimationNumbers.TWO && renderHorizontalAnimationWhenNumberOfAnimationsIsTwo) ||
    (numberOfAnimations === AnimationNumbers.THREE && animationTransition !== AnimationTransitions.FIRST_TO_SECOND);

  const renderNegativeElementWhenNegativeCharacterAnimationModeIsNotMulti: boolean = !(
    renderAnimation &&
    !renderHorizontalAnimation &&
    negativeCharacterAnimationMode === NegativeCharacterAnimationModes.MULTI
  );

  const renderNegativeElementWhenNumberOfAnimationsIsThree: boolean =
    renderHorizontalAnimation &&
    numberOfAnimations === AnimationNumbers.THREE &&
    previousValueOnAnimationEndBigInt < valueBigInt === (animationTransition === AnimationTransitions.NONE);

  const renderNegativeCharacter: boolean =
    (isValueValid && !hasSignChanged && valueBigInt < Numbers.ZERO && renderNegativeElementWhenNegativeCharacterAnimationModeIsNotMulti) ||
    renderNegativeElementWhenNumberOfAnimationsIsThree;

  const animationType: AnimationTypes = renderAnimation
    ? renderHorizontalAnimation
      ? AnimationTypes.HORIZONTAL
      : AnimationTypes.VERTICAL
    : AnimationTypes.NONE;

  const [horizontalAnimationDuration, verticalAnimationDuration]: AnimationDurationTuple = useAnimationDuration({
    animationDuration,
    numberOfAnimations,
  });

  const totalAnimationDuration: number = useTotalAnimationDuration({
    numberOfAnimations,
    horizontalAnimationDuration,
    verticalAnimationDuration,
  });

  const [horizontalAnimationTimingFunction, verticalAnimationTimingFunction]: AnimationTimingFunctionTuple =
    useAnimationTimingFunction(animationTimingFunction);

  const theme: NumbersTransitionTheme = {
    $animationType: animationType,
    $numberOfAnimations: numberOfAnimations,
    $currentAnimationNumber: currentAnimationNumber,
    $totalAnimationDuration: totalAnimationDuration,
    $horizontalAnimationDuration: horizontalAnimationDuration,
    $verticalAnimationDuration: verticalAnimationDuration,
  };

  useEffect((): void => {
    if (omitAnimation) {
      setPreviousValueOnAnimationEnd(validValue);
    }
  }, [validValue, omitAnimation]);

  useEffect((): void => {
    if (restartAnimation) {
      setPreviousValueOnAnimationEnd(previousValueOnAnimationStart.current);
      setAnimationTransition(AnimationTransitions.NONE);
    }
    previousValueOnAnimationStart.current = validValue;
  }, [validValue, restartAnimation]);

  const onAnimationEnd: AnimationEventHandler<HTMLDivElement> = (event: ReactEvent<AnimationEvent<HTMLDivElement>>): void => {
    if (!Object.values(AnimationIds).includes<string>(event.target.id)) {
      return;
    }

    if (numberOfAnimations === AnimationNumbers.ONE) {
      setPreviousValueOnAnimationEnd(validValue);
    } else if (numberOfAnimations === AnimationNumbers.THREE && animationTransition === AnimationTransitions.FIRST_TO_SECOND) {
      setAnimationTransition(AnimationTransitions.SECOND_TO_THIRD);
    } else if (animationTransition !== AnimationTransitions.NONE) {
      setPreviousValueOnAnimationEnd(validValue);
      setAnimationTransition(AnimationTransitions.NONE);
    } else {
      setAnimationTransition(AnimationTransitions.FIRST_TO_SECOND);
    }
  };

  const negativeCharacterElement: ReactElement = (
    <Optional condition={renderNegativeCharacter}>
      <NegativeCharacterElement<M, N, W, X>
        negativeCharacter={negativeCharacter}
        characterStyledView={characterStyledView}
        negativeCharacterStyledView={negativeCharacterStyledView}
      />
    </Optional>
  );

  const numberElement: ReactElement = (
    <NumberElement<M, N, O, P, Q, R, S, T, U, V>
      precision={precision}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      characterStyledView={characterStyledView}
      digitStyledView={digitStyledView}
      separatorStyledView={separatorStyledView}
      decimalSeparatorStyledView={decimalSeparatorStyledView}
      digitGroupSeparatorStyledView={digitGroupSeparatorStyledView}
    >
      {previousValueOnAnimationEndDigits}
    </NumberElement>
  );

  const horizontalAnimationElement: ReactElement = (
    <HorizontalAnimationElement<M, N, O, P, Q, R, S, T, U, V, W, X>
      precision={precision}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      negativeCharacter={negativeCharacter}
      animationDuration={horizontalAnimationDuration}
      animationTimingFunction={horizontalAnimationTimingFunction}
      animationTransition={animationTransition}
      previousValueDigits={previousValueOnAnimationEndDigits}
      currentValueDigits={valueDigits}
      previousValue={previousValueOnAnimationEndBigInt}
      currentValue={valueBigInt}
      minNumberOfDigits={minNumberOfDigits}
      maxNumberOfDigits={maxNumberOfDigits}
      numberOfDigitsDifference={numberOfDigitsDifference}
      hasSignChanged={hasSignChanged}
      numberOfAnimations={numberOfAnimations}
      characterStyledView={characterStyledView}
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
      animationDuration={verticalAnimationDuration}
      animationTimingFunction={verticalAnimationTimingFunction}
      animationAlgorithm={animationAlgorithm}
      previousValue={previousValueOnAnimationEndBigInt}
      currentValue={valueBigInt}
      maxNumberOfDigits={maxNumberOfDigits}
      hasSignChanged={hasSignChanged}
      characterStyledView={characterStyledView}
      digitStyledView={digitStyledView}
      separatorStyledView={separatorStyledView}
      decimalSeparatorStyledView={decimalSeparatorStyledView}
      digitGroupSeparatorStyledView={digitGroupSeparatorStyledView}
      negativeCharacterStyledView={negativeCharacterStyledView}
    />
  );

  const animationElement: ReactElement = (
    <Conditional condition={renderHorizontalAnimation}>
      {horizontalAnimationElement}
      {verticalAnimationElement}
    </Conditional>
  );

  const valueElement: ReactElement = (
    <Conditional condition={isValueValid}>
      {numberElement}
      <InvalidElement<M, N, Y, Z>
        invalidValue={invalidValue}
        characterStyledView={characterStyledView}
        invalidStyledView={invalidStyledView}
      />
    </Conditional>
  );

  const containerElement: ReactElement = (
    <Container {...styledView} onAnimationEnd={onAnimationEnd}>
      {negativeCharacterElement}
      <Conditional condition={renderAnimation}>
        {animationElement}
        {valueElement}
      </Conditional>
    </Container>
  );

  return (
    <StyleSheetManager shouldForwardProp={(prop: string): boolean => Object.values<ForwardProps>(ForwardProps).includes<string>(prop)}>
      <ThemeProvider theme={theme}>{containerElement}</ThemeProvider>
    </StyleSheetManager>
  );
};

export default NumbersTransition;
