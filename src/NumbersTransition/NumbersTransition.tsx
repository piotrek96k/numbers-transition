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
  AnimationDirections,
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
import { AnimationTimingFunction, Container, ElementsLength, NumbersTransitionTheme } from './NumbersTransition.styles';
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
    animationDuration: animationDurationInput,
    animationTimingFunction: animationTimingFunctionInput,
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
  const previousValueOnStart: RefObject<BigDecimal> = useRef<BigDecimal>(validInitialValue);
  const [previousValueOnEnd, setPreviousValueOnAnimationEnd]: [BigDecimal, Dispatch<SetStateAction<BigDecimal>>] =
    useState<BigDecimal>(validInitialValue);
  const [validValue, isValueValid]: ValidationTuple = useValue(value, previousValueOnEnd, animationInterruptionMode);

  const [animationTransition, setAnimationTransition]: [AnimationTransitions, Dispatch<SetStateAction<AnimationTransitions>>] =
    useState<AnimationTransitions>(AnimationTransitions.NONE);

  const [
    [previousValueOnEndDigits, valueDigits],
    [previousValueOEndBigInt, previousValueOnStartBigInt, valueBigInt],
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
    previousValueOnEnd: previousValueOEndBigInt,
    currentValue: valueBigInt,
  });

  const [animationNumber, numberOfAnimations]: AnimationNumbersTuple = useAnimationNumbers({
    animationTransition,
    previousValueDigits: previousValueOnEndDigits,
    currentValueDigits: valueDigits,
    previousValue: previousValueOEndBigInt,
    currentValue: valueBigInt,
    hasSignChanged,
    renderAnimation,
  });

  const animationType: AnimationTypes = useAnimationType({
    animationTransition,
    previousValueDigits: previousValueOnEndDigits,
    currentValueDigits: valueDigits,
    previousValue: previousValueOEndBigInt,
    currentValue: valueBigInt,
    hasSignChanged,
    renderAnimation,
    numberOfAnimations,
  });

  const animationDirection: AnimationDirections = useAnimationDirection({
    animationType,
    animationTransition,
    previousValueDigits: previousValueOnEndDigits,
    currentValueDigits: valueDigits,
    previousValue: previousValueOEndBigInt,
    currentValue: valueBigInt,
    hasSignChanged,
    numberOfAnimations,
  });

  const [animationDuration, horizontalAnimationDuration, verticalAnimationDuration, totalAnimationDuration]: AnimationDurationTuple =
    useAnimationDuration({ animationType, animationDuration: animationDurationInput, numberOfAnimations });

  const animationTimingFunction: AnimationTimingFunction = useAnimationTimingFunction({
    animationTimingFunction: animationTimingFunctionInput,
    animationType,
    animationDirection,
  });

  const renderNegativeCharacter: boolean = useRenderNegativeCharacter({
    negativeCharacterAnimationMode,
    animationTransition,
    previousValue: previousValueOEndBigInt,
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
      setAnimationTransition(AnimationTransitions.NONE);
    }
    previousValueOnStart.current = validValue;
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

  const theme: NumbersTransitionTheme = {
    ...elementsLength,
    $numberOfAnimations: numberOfAnimations,
    $animationNumber: animationNumber,
    $animationType: animationType,
    $animationDirection: animationDirection,
    $animationDuration: animationDuration,
    $animationTimingFunction: animationTimingFunction,
    $horizontalAnimationDuration: horizontalAnimationDuration,
    $verticalAnimationDuration: verticalAnimationDuration,
    $totalAnimationDuration: totalAnimationDuration,
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
      previousValue={previousValueOEndBigInt}
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
      animationAlgorithm={animationAlgorithm}
      previousValue={previousValueOEndBigInt}
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
    <Conditional condition={animationType === AnimationTypes.HORIZONTAL}>
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
