import { Dispatch, FC, JSX, ReactNode, RefObject, SetStateAction, useEffect, useRef, useState } from 'react';
import {
  Conditional,
  EmptyElement,
  HorizontalAnimationElement,
  NegativeElement,
  NumberElement,
  VerticalAnimationElement,
} from './NumbersTransition.components';
import { AnimationTimingFunction, Container } from './NumbersTransition.styles';
import {
  AnimationTimingFunctions,
  AnimationTransition,
  DecimalSeparator,
  DefaultAnimationDuration,
  DigitGroupSeparator,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  NumberOfAnimations,
  Numbers,
} from './NumbersTransition.enums';
import { BigDecimal, ReadOnly } from './NumbersTransition.types';
import { AnimationValuesTuple, ValidationTuple, useAnimationValues, useValidation } from './NumbersTransition.hooks';

interface NumbersTransitionProps {
  initialValue?: BigDecimal;
  value?: BigDecimal;
  precision?: number;
  horizontalAnimationDuration?: number;
  verticalAnimationDuration?: number;
  decimalSeparator?: DecimalSeparator;
  digitGroupSeparator?: DigitGroupSeparator;
  negativeCharacter?: NegativeCharacter;
  negativeCharacterAnimationMode?: NegativeCharacterAnimationMode;
  horizontalAnimationTimingFunction?: ReadOnly<AnimationTimingFunction> | AnimationTimingFunction;
  verticalAnimationTimingFunction?: ReadOnly<AnimationTimingFunction> | AnimationTimingFunction;
}

const NumbersTransition: FC<NumbersTransitionProps> = (props: NumbersTransitionProps): ReactNode => {
  const {
    initialValue,
    value,
    precision = Numbers.ZERO,
    horizontalAnimationDuration = DefaultAnimationDuration.HORIZONTAL_ANIMATION,
    verticalAnimationDuration = DefaultAnimationDuration.VERTICAL_ANIMATION,
    digitGroupSeparator = DigitGroupSeparator.SPACE,
    decimalSeparator = digitGroupSeparator === DigitGroupSeparator.COMMA
      ? DecimalSeparator.DOT
      : DecimalSeparator.COMMA,
    negativeCharacter = NegativeCharacter.MINUS,
    negativeCharacterAnimationMode = NegativeCharacterAnimationMode.SINGLE,
    horizontalAnimationTimingFunction = AnimationTimingFunctions.EASE,
    verticalAnimationTimingFunction = AnimationTimingFunctions.EASE,
  }: NumbersTransitionProps = props;

  const [validInitialValue]: ValidationTuple = useValidation(initialValue);
  const [validValue, isValueValid]: ValidationTuple = useValidation(value);

  const [animationTransition, setAnimationTransition]: [
    AnimationTransition,
    Dispatch<SetStateAction<AnimationTransition>>,
  ] = useState<AnimationTransition>(AnimationTransition.NONE);

  const [previousValueOnAnimationEnd, setPreviousValueOnAnimationEnd]: [
    BigDecimal,
    Dispatch<SetStateAction<BigDecimal>>,
  ] = useState<BigDecimal>(validInitialValue);

  const previousValueOnAnimationStartRef: RefObject<BigDecimal> = useRef<BigDecimal>(validInitialValue);
  const containerRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);

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

  const notValueOnAnimationStart = (value: bigint): boolean => value !== previousValueOnAnimationStartBigInt;

  const hasValueChanged: boolean = valueBigInt !== previousValueOnAnimationEndBigInt;
  const hasSignChanged: boolean = (valueBigInt ^ previousValueOnAnimationEndBigInt) < Numbers.ZERO;
  const hasTheSameNumberOfDigits: boolean = previousValueOnAnimationEndDigits.length === valueDigits.length;
  const omitAnimation: boolean = isValueValid && value !== previousValueOnAnimationEnd && !hasValueChanged;
  const restartAnimation: boolean = [valueBigInt, previousValueOnAnimationEndBigInt].every(notValueOnAnimationStart);
  const renderAnimation: boolean = isValueValid && hasValueChanged && !restartAnimation;

  const hasAtLeastTwoAnimations: boolean =
    (previousValueOnAnimationEndDigits.length < valueDigits.length &&
      previousValueOnAnimationEndBigInt < valueBigInt) ||
    (previousValueOnAnimationEndDigits.length > valueDigits.length && previousValueOnAnimationEndBigInt > valueBigInt);

  const numberOfAnimations: NumberOfAnimations = hasSignChanged
    ? hasAtLeastTwoAnimations
      ? NumberOfAnimations.THREE
      : NumberOfAnimations.TWO
    : hasTheSameNumberOfDigits
      ? NumberOfAnimations.ONE
      : NumberOfAnimations.TWO;

  const renderHorizontalAnimation: boolean =
    (numberOfAnimations === NumberOfAnimations.TWO &&
      (hasSignChanged
        ? animationTransition === AnimationTransition.NONE
          ? previousValueOnAnimationEndBigInt > valueBigInt
          : previousValueOnAnimationEndBigInt < valueBigInt
        : animationTransition === AnimationTransition.NONE
          ? previousValueOnAnimationEndDigits.length < valueDigits.length
          : previousValueOnAnimationEndDigits.length > valueDigits.length)) ||
    (numberOfAnimations === NumberOfAnimations.THREE && animationTransition !== AnimationTransition.FIRST_TO_SECOND);

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

  const onAnimationEnd = (): void => {
    if (numberOfAnimations === NumberOfAnimations.ONE) {
      setPreviousValueOnAnimationEnd(validValue);
    } else if (
      numberOfAnimations === NumberOfAnimations.THREE &&
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

  const negativeElement: JSX.Element = (
    <NegativeElement
      negativeCharacter={negativeCharacter}
      animationTransition={animationTransition}
      previousValue={previousValueOnAnimationEndBigInt}
      currentValue={valueBigInt}
      hasSignChanged={hasSignChanged}
      numberOfAnimations={numberOfAnimations}
      renderHorizontalAnimation={renderHorizontalAnimation}
    />
  );

  const numberElement: JSX.Element = (
    <NumberElement
      precision={precision}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      digits={previousValueOnAnimationEndDigits}
    />
  );

  const horizontalAnimationElement: JSX.Element = (
    <HorizontalAnimationElement
      precision={precision}
      animationDuration={horizontalAnimationDuration}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      negativeCharacter={negativeCharacter}
      animationTimingFunction={horizontalAnimationTimingFunction}
      animationTransition={animationTransition}
      containerRef={containerRef}
      previousValueDigits={previousValueOnAnimationEndDigits}
      currentValueDigits={valueDigits}
      previousValue={previousValueOnAnimationEndBigInt}
      currentValue={valueBigInt}
      minNumberOfDigits={minNumberOfDigits}
      maxNumberOfDigits={maxNumberOfDigits}
      numberOfDigitsDifference={numberOfDigitsDifference}
      hasSignChanged={hasSignChanged}
      numberOfAnimations={numberOfAnimations}
    />
  );

  const verticalAnimationElement: JSX.Element = (
    <VerticalAnimationElement
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
    />
  );

  const animationElement: JSX.Element = (
    <Conditional condition={renderHorizontalAnimation}>
      {horizontalAnimationElement}
      {verticalAnimationElement}
    </Conditional>
  );

  const valueElement: JSX.Element = (
    <Conditional condition={isValueValid}>
      {numberElement}
      <EmptyElement />
    </Conditional>
  );

  return (
    <Container ref={containerRef} onAnimationEnd={onAnimationEnd}>
      {negativeElement}
      <Conditional condition={renderAnimation}>
        {animationElement}
        {valueElement}
      </Conditional>
    </Container>
  );
};

export default NumbersTransition;
