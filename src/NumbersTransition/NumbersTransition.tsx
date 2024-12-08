import {
  Dispatch,
  FC,
  MutableRefObject,
  ReactNode,
  RefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
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
  DigitGroupSeparator,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  NumberOfAnimations,
  Numbers,
  RegExps,
} from './NumbersTransition.enums';
import { BigDecimal, ReadOnly } from './NumbersTransition.types';
import { AnimationValuesTuple, useAnimationValues, useCanvasContext } from './NumbersTransition.hooks';

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
    initialValue = Numbers.ZERO,
    value,
    precision = Numbers.ZERO,
    horizontalAnimationDuration = 2_000,
    verticalAnimationDuration = 5_000,
    digitGroupSeparator = DigitGroupSeparator.SPACE,
    decimalSeparator = digitGroupSeparator === DigitGroupSeparator.COMMA
      ? DecimalSeparator.DOT
      : DecimalSeparator.COMMA,
    negativeCharacter = NegativeCharacter.MINUS,
    negativeCharacterAnimationMode = NegativeCharacterAnimationMode.SINGLE,
    horizontalAnimationTimingFunction = AnimationTimingFunctions.EASE,
    verticalAnimationTimingFunction = AnimationTimingFunctions.EASE,
  }: NumbersTransitionProps = props;

  const [animationTransition, setAnimationTransition]: [
    AnimationTransition,
    Dispatch<SetStateAction<AnimationTransition>>,
  ] = useState<AnimationTransition>(AnimationTransition.NONE);

  const [previousValueOnAnimationEnd, setPreviousValueOnAnimationEnd]: [
    BigDecimal,
    Dispatch<SetStateAction<BigDecimal>>,
  ] = useState<BigDecimal>(initialValue);

  const previousValueOnAnimationStartRef: MutableRefObject<BigDecimal> = useRef<BigDecimal>(initialValue);
  const containerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);

  const canvasContext: CanvasRenderingContext2D | null = useCanvasContext(containerRef);

  const isValueValid: boolean = !!`${value}`.match(RegExps.BIG_DECIMAL);
  const validValue: BigDecimal = isValueValid ? value! : Numbers.ZERO;

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

  const notValueOnAnimationStart = (val: bigint): boolean => val !== previousValueOnAnimationStartBigInt;

  const hasValueChanged: boolean = valueBigInt !== previousValueOnAnimationEndBigInt;
  const hasSignChanged: boolean = (valueBigInt ^ previousValueOnAnimationEndBigInt) < Numbers.ZERO;
  const hasTheSameNumberOfDigits: boolean = previousValueOnAnimationEndDigits.length === valueDigits.length;
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
    if (restartAnimation) {
      setPreviousValueOnAnimationEnd(previousValueOnAnimationStartRef.current);
      setAnimationTransition(AnimationTransition.NONE);
    }
    previousValueOnAnimationStartRef.current = validValue;
  }, [validValue, restartAnimation]);

  const updatePreviousValueOnAnimationEnd = (): void => setPreviousValueOnAnimationEnd(validValue);

  const onAnimationEnd = (): void => {
    if (numberOfAnimations === NumberOfAnimations.ONE) {
      updatePreviousValueOnAnimationEnd();
      return;
    }
    if (
      numberOfAnimations === NumberOfAnimations.THREE &&
      animationTransition === AnimationTransition.FIRST_TO_SECOND
    ) {
      setAnimationTransition(AnimationTransition.SECOND_TO_THIRD);
      return;
    }
    if (animationTransition !== AnimationTransition.NONE) {
      updatePreviousValueOnAnimationEnd();
      setAnimationTransition(AnimationTransition.NONE);
      return;
    }
    setAnimationTransition(AnimationTransition.FIRST_TO_SECOND);
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
      canvasContext={canvasContext}
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
