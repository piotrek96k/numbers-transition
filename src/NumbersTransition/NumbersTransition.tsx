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
  NegativeElement,
  NumberElement,
  Optional,
  VerticalAnimationElement,
} from './NumbersTransition.components';
import {
  AnimationId,
  AnimationNumber,
  AnimationTransition,
  AnimationType,
  DecimalSeparator,
  DigitGroupSeparator,
  InvalidValue,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
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
  P extends AnimationDuration | TotalAnimationDuration = AnimationDuration,
  R extends OrReadOnly<AnimationTimingFunction> | ExtendedAnimationTimingFunction = AnimationTimingFunction,
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
  animationDuration?: P;
  decimalSeparator?: DecimalSeparator;
  digitGroupSeparator?: DigitGroupSeparator;
  negativeCharacter?: NegativeCharacter;
  negativeCharacterAnimationMode?: NegativeCharacterAnimationMode;
  animationTimingFunction?: R;
  invalidValue?: string;
  view?: View<S, T>;
  characterView?: View<U, V>;
  digitView?: View<W, X>;
  separatorView?: View<Y, Z>;
}

const NumbersTransition = <
  P extends AnimationDuration | TotalAnimationDuration = AnimationDuration,
  R extends OrReadOnly<AnimationTimingFunction> | ExtendedAnimationTimingFunction = AnimationTimingFunction,
  S extends object = object,
  T = unknown,
  U extends object = object,
  V = unknown,
  W extends object = object,
  X = unknown,
  Y extends object = object,
  Z = unknown,
>(
  props: NumbersTransitionProps<P, R, S, T, U, V, W, X, Y, Z>,
): ReactNode => {
  const {
    initialValue,
    value,
    precision = Numbers.ZERO,
    animationDuration,
    digitGroupSeparator = DigitGroupSeparator.SPACE,
    decimalSeparator = digitGroupSeparator === DigitGroupSeparator.COMMA
      ? DecimalSeparator.DOT
      : DecimalSeparator.COMMA,
    negativeCharacter = NegativeCharacter.MINUS,
    negativeCharacterAnimationMode = NegativeCharacterAnimationMode.SINGLE,
    animationTimingFunction,
    invalidValue = InvalidValue.VALUE,
    view,
    characterView,
    digitView,
    separatorView,
  }: NumbersTransitionProps<P, R, S, T, U, V, W, X, Y, Z> = props;

  const shouldForwardProp: ShouldForwardProp<Runtime.WEB> = useForwardProp();

  const [validInitialValue]: ValidationTuple = useValidation(initialValue);
  const [validValue, isValueValid]: ValidationTuple = useValidation(value);

  const [styledView, characterStyledView, digitStyledView, separatorStyledView]: StyledViewWithPropsTuple<
    S,
    T,
    U,
    V,
    W,
    X,
    Y,
    Z
  > = useStyledView<S, T, U, V, W, X, Y, Z>([view, characterView, digitView, separatorView]);

  const [animationTransition, setAnimationTransition]: [
    AnimationTransition,
    Dispatch<SetStateAction<AnimationTransition>>,
  ] = useState<AnimationTransition>(AnimationTransition.NONE);

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

  const numberOfAnimations: AnimationNumber = renderAnimation
    ? hasSignChanged
      ? hasThreeAnimations
        ? AnimationNumber.THREE
        : AnimationNumber.TWO
      : hasTheSameNumberOfDigits
        ? AnimationNumber.ONE
        : AnimationNumber.TWO
    : AnimationNumber.ZERO;

  const currentAnimationNumber: AnimationNumber = renderAnimation
    ? animationTransition === AnimationTransition.SECOND_TO_THIRD
      ? AnimationNumber.THREE
      : animationTransition === AnimationTransition.FIRST_TO_SECOND
        ? AnimationNumber.TWO
        : AnimationNumber.ONE
    : AnimationNumber.ZERO;

  const renderHorizontalAnimationWhenNumberOfAnimationsIsTwo: boolean = hasSignChanged
    ? animationTransition === AnimationTransition.NONE
      ? previousValueOnAnimationEndBigInt > valueBigInt
      : previousValueOnAnimationEndBigInt < valueBigInt
    : animationTransition === AnimationTransition.NONE
      ? previousValueOnAnimationEndDigits.length < valueDigits.length
      : previousValueOnAnimationEndDigits.length > valueDigits.length;

  const renderHorizontalAnimation: boolean =
    (numberOfAnimations === AnimationNumber.TWO && renderHorizontalAnimationWhenNumberOfAnimationsIsTwo) ||
    (numberOfAnimations === AnimationNumber.THREE && animationTransition !== AnimationTransition.FIRST_TO_SECOND);

  const renderNegativeElementWhenNumberOfAnimationsIsThree: boolean =
    renderHorizontalAnimation &&
    numberOfAnimations === AnimationNumber.THREE &&
    previousValueOnAnimationEndBigInt < valueBigInt === (animationTransition === AnimationTransition.NONE);

  const renderNegativeElementWhenNegativeCharacterAnimationModeIsNotMulti: boolean = !(
    renderAnimation &&
    !renderHorizontalAnimation &&
    negativeCharacterAnimationMode === NegativeCharacterAnimationMode.MULTI
  );

  const renderNegativeElement: boolean =
    (!hasSignChanged &&
      valueBigInt < Numbers.ZERO &&
      renderNegativeElementWhenNegativeCharacterAnimationModeIsNotMulti) ||
    renderNegativeElementWhenNumberOfAnimationsIsThree;

  const animationType: AnimationType = renderAnimation
    ? renderHorizontalAnimation
      ? AnimationType.HORIZONTAL
      : AnimationType.VERTICAL
    : AnimationType.NONE;

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
      setAnimationTransition(AnimationTransition.NONE);
    }
    previousValueOnAnimationStartRef.current = validValue;
  }, [validValue, omitAnimation, restartAnimation]);

  const onAnimationEnd: AnimationEventHandler<HTMLDivElement> = (
    event: ReactEvent<AnimationEvent<HTMLDivElement>>,
  ): void => {
    if (!Object.values(AnimationId).includes<string>(event.target.id)) {
      return;
    }

    if (numberOfAnimations === AnimationNumber.ONE) {
      setPreviousValueOnAnimationEnd(validValue);
    } else if (
      numberOfAnimations === AnimationNumber.THREE &&
      animationTransition === AnimationTransition.FIRST_TO_SECOND
    ) {
      setAnimationTransition(AnimationTransition.SECOND_TO_THIRD);
    } else if (animationTransition !== AnimationTransition.NONE) {
      setPreviousValueOnAnimationEnd(validValue);
      setAnimationTransition(AnimationTransition.NONE);
    } else {
      setAnimationTransition(AnimationTransition.FIRST_TO_SECOND);
    }
  };

  const negativeElement: ReactElement = (
    <Optional condition={renderNegativeElement}>
      <NegativeElement<U, V> negativeCharacter={negativeCharacter} characterStyledView={characterStyledView} />
    </Optional>
  );

  const numberElement: ReactElement = (
    <NumberElement<U, V, W, X, Y, Z>
      precision={precision}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      characterStyledView={characterStyledView}
      digitStyledView={digitStyledView}
      separatorStyledView={separatorStyledView}
    >
      {previousValueOnAnimationEndDigits}
    </NumberElement>
  );

  const horizontalAnimationElement: ReactElement = (
    <HorizontalAnimationElement<U, V, W, X, Y, Z>
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
    />
  );

  const verticalAnimationElement: ReactElement = (
    <VerticalAnimationElement<U, V, W, X, Y, Z>
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
      <InvalidElement invalidValue={invalidValue} characterStyledView={characterStyledView} />
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
