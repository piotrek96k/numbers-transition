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
  T extends AnimationDuration | TotalAnimationDuration = AnimationDuration,
  U extends OrReadOnly<AnimationTimingFunction> | ExtendedAnimationTimingFunction = OrReadOnly<AnimationTimingFunction>,
  V extends object = object,
  W = unknown,
  X extends object = object,
  Y = unknown,
> {
  initialValue?: UncheckedBigDecimal | BigDecimal;
  value?: UncheckedBigDecimal | BigDecimal;
  precision?: number;
  animationDuration?: T;
  decimalSeparator?: DecimalSeparator;
  digitGroupSeparator?: DigitGroupSeparator;
  negativeCharacter?: NegativeCharacter;
  negativeCharacterAnimationMode?: NegativeCharacterAnimationMode;
  animationTimingFunction?: U;
  invalidValue?: string;
  view?: View<V, W>;
  characterView?: View<X, Y>;
}

const NumbersTransition = <
  T extends AnimationDuration | TotalAnimationDuration = AnimationDuration,
  U extends OrReadOnly<AnimationTimingFunction> | ExtendedAnimationTimingFunction = OrReadOnly<AnimationTimingFunction>,
  V extends object = object,
  W = unknown,
  X extends object = object,
  Y = unknown,
>(
  props: NumbersTransitionProps<T, U, V, W, X, Y>,
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
  }: NumbersTransitionProps<T, U, V, W, X, Y> = props;

  const shouldForwardProp: ShouldForwardProp<Runtime.WEB> = useForwardProp();

  const [validInitialValue]: ValidationTuple = useValidation(initialValue);
  const [validValue, isValueValid]: ValidationTuple = useValidation(value);

  const [styledView, characterStyledView]: StyledViewWithPropsTuple<V, W, X, Y> = useStyledView<V, W, X, Y>([
    view,
    characterView,
  ]);

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

  const onAnimationEnd: AnimationEventHandler<HTMLDivElement> = ({
    target: { id },
  }: ReactEvent<AnimationEvent<HTMLDivElement>>): void => {
    if (!Object.values(AnimationId).includes<string>(id)) {
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
      <NegativeElement<X, Y> negativeCharacter={negativeCharacter} characterStyledView={characterStyledView} />
    </Optional>
  );

  const numberElement: ReactElement = (
    <NumberElement<X, Y>
      precision={precision}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      characterStyledView={characterStyledView}
    >
      {previousValueOnAnimationEndDigits}
    </NumberElement>
  );

  const horizontalAnimationElement: ReactElement = (
    <HorizontalAnimationElement<X, Y>
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
    />
  );

  const verticalAnimationElement: ReactElement = (
    <VerticalAnimationElement<X, Y>
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
