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
import { ShouldForwardProp, StyleSheetManager, ThemeProvider } from 'styled-components';
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
  AnimationNumbers,
  AnimationTransitions,
  AnimationTypes,
  DecimalSeparators,
  DigitGroupSeparators,
  InvalidValue,
  NegativeCharacterAnimationModes,
  NegativeCharacters,
  Numbers,
  Runtime,
} from './NumbersTransition.enums';
import {
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
  useForwardProp,
  useStyledView,
  useTotalAnimationDuration,
  useValidation,
} from './NumbersTransition.hooks';
import { AnimationTimingFunction, Container, NumbersTransitionTheme } from './NumbersTransition.styles';
import { BigDecimal, OrReadOnly, UncheckedBigDecimal } from './NumbersTransition.types';

type ReactEvent<T extends SyntheticEvent<HTMLElement, Event>> = T & {
  target: HTMLElement;
};

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
  animationDuration?: I;
  decimalSeparator?: DecimalSeparators;
  digitGroupSeparator?: DigitGroupSeparators;
  negativeCharacter?: NegativeCharacters;
  negativeCharacterAnimationMode?: NegativeCharacterAnimationModes;
  animationTimingFunction?: J;
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
    animationDuration,
    digitGroupSeparator = DigitGroupSeparators.SPACE,
    decimalSeparator = digitGroupSeparator === DigitGroupSeparators.COMMA
      ? DecimalSeparators.DOT
      : DecimalSeparators.COMMA,
    negativeCharacter = NegativeCharacters.MINUS,
    negativeCharacterAnimationMode = NegativeCharacterAnimationModes.SINGLE,
    animationTimingFunction,
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

  const shouldForwardProp: ShouldForwardProp<Runtime.WEB> = useForwardProp();

  const [validInitialValue]: ValidationTuple = useValidation(initialValue);
  const [validValue, isValueValid]: ValidationTuple = useValidation(value);

  const [
    styledView,
    characterStyledView,
    digitStyledView,
    separatorStyledView,
    decimalSeparatorStyledView,
    digitGroupSeparatorStyledView,
    negativeCharacterStyledView,
    invalidStyledView,
  ]: StyledViewWithPropsTuple<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z> = useStyledView<
    K,
    L,
    M,
    N,
    O,
    P,
    Q,
    R,
    S,
    T,
    U,
    V,
    W,
    X,
    Y,
    Z
  >([
    view,
    characterView,
    digitView,
    separatorView,
    decimalSeparatorView,
    digitGroupSeparatorView,
    negativeCharacterView,
    invalidView,
  ]);

  const [animationTransition, setAnimationTransition]: [
    AnimationTransitions,
    Dispatch<SetStateAction<AnimationTransitions>>,
  ] = useState<AnimationTransitions>(AnimationTransitions.NONE);

  const [previousValueOnAnimationEnd, setPreviousValueOnAnimationEnd]: [
    BigDecimal,
    Dispatch<SetStateAction<BigDecimal>>,
  ] = useState<BigDecimal>(validInitialValue);

  const previousValueOnAnimationStartRef: RefObject<BigDecimal> = useRef<BigDecimal>(validInitialValue);

  const [
    [previousValueOnAnimationEndDigits, valueDigits],
    [previousValueOnAnimationEndBigInt, previousValueOnAnimationStartBigInt, valueBigInt],
    [minNumberOfDigits, maxNumberOfDigits, numberOfDigitsDifference],
  ]: AnimationValuesTuple = useAnimationValues({
    precision,
    currentValue: validValue,
    previousValueOnAnimationEnd,
    previousValueOnAnimationStart: previousValueOnAnimationStartRef.current,
  });

  const hasValueChanged: boolean = valueBigInt !== previousValueOnAnimationEndBigInt;
  const hasSignChanged: boolean = (valueBigInt ^ previousValueOnAnimationEndBigInt) < Numbers.ZERO;
  const hasTheSameNumberOfDigits: boolean = previousValueOnAnimationEndDigits.length === valueDigits.length;
  const omitAnimation: boolean = isValueValid && value !== previousValueOnAnimationEnd && !hasValueChanged;
  const restartAnimation: boolean =
    valueBigInt !== previousValueOnAnimationStartBigInt &&
    previousValueOnAnimationEndBigInt !== previousValueOnAnimationStartBigInt;
  const renderAnimation: boolean = isValueValid && hasValueChanged && !restartAnimation;

  const hasThreeAnimations: boolean =
    (previousValueOnAnimationEndDigits.length < valueDigits.length &&
      previousValueOnAnimationEndBigInt < valueBigInt) ||
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

  const renderNegativeElementWhenNumberOfAnimationsIsThree: boolean =
    renderHorizontalAnimation &&
    numberOfAnimations === AnimationNumbers.THREE &&
    previousValueOnAnimationEndBigInt < valueBigInt === (animationTransition === AnimationTransitions.NONE);

  const renderNegativeElementWhenNegativeCharacterAnimationModeIsNotMulti: boolean = !(
    renderAnimation &&
    !renderHorizontalAnimation &&
    negativeCharacterAnimationMode === NegativeCharacterAnimationModes.MULTI
  );

  const renderNegativeCharacter: boolean =
    (!hasSignChanged &&
      valueBigInt < Numbers.ZERO &&
      renderNegativeElementWhenNegativeCharacterAnimationModeIsNotMulti) ||
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
    if (restartAnimation) {
      setPreviousValueOnAnimationEnd(previousValueOnAnimationStartRef.current);
      setAnimationTransition(AnimationTransitions.NONE);
    }
    previousValueOnAnimationStartRef.current = validValue;
  }, [validValue, omitAnimation, restartAnimation]);

  const onAnimationEnd: AnimationEventHandler<HTMLDivElement> = (
    event: ReactEvent<AnimationEvent<HTMLDivElement>>,
  ): void => {
    if (!Object.values(AnimationIds).includes<string>(event.target.id)) {
      return;
    }

    if (numberOfAnimations === AnimationNumbers.ONE) {
      setPreviousValueOnAnimationEnd(validValue);
    } else if (
      numberOfAnimations === AnimationNumbers.THREE &&
      animationTransition === AnimationTransitions.FIRST_TO_SECOND
    ) {
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
      animationDuration={horizontalAnimationDuration}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      negativeCharacter={negativeCharacter}
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
      animationDuration={verticalAnimationDuration}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      negativeCharacter={negativeCharacter}
      negativeCharacterAnimationMode={negativeCharacterAnimationMode}
      animationTimingFunction={verticalAnimationTimingFunction}
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
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <ThemeProvider theme={theme}>{containerElement}</ThemeProvider>
    </StyleSheetManager>
  );
};

export default NumbersTransition;
