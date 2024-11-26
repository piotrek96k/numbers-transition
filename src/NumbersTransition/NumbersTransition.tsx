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
  HorizontalAnimation,
  NegativeElement,
  NumberElement,
  VerticalAnimation,
} from './NumbersTransition.components';
import { StyledContainer } from './NumbersTransition.styles';
import {
  AnimationTimingFunction,
  AnimationTransition,
  DecimalSeparator,
  DigitGroupSeparator,
  EaseAnimationTimingFunction,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  NumberOfAnimations,
} from './NumbersTransition.enums';
import { BigDecimal } from './NumbersTransition.types';
import { AnimationValuesTuple, useAnimationValues } from './NumbersTransition.hooks';

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
  animationTimingFunction?: AnimationTimingFunction;
}

const NumbersTransition: FC<NumbersTransitionProps> = (props: NumbersTransitionProps): ReactNode => {
  const {
    initialValue = 0,
    value,
    precision = 0,
    horizontalAnimationDuration = 0.5,
    verticalAnimationDuration = 2,
    digitGroupSeparator = DigitGroupSeparator.SPACE,
    decimalSeparator = digitGroupSeparator === DigitGroupSeparator.COMMA
      ? DecimalSeparator.DOT
      : DecimalSeparator.COMMA,
    negativeCharacter = NegativeCharacter.MINUS,
    negativeCharacterAnimationMode = NegativeCharacterAnimationMode.SINGLE,
    animationTimingFunction = [[...EaseAnimationTimingFunction.VALUES[0]], [...EaseAnimationTimingFunction.VALUES[1]]],
  }: NumbersTransitionProps = props;

  const [animationTransition, setAnimationTransition]: [
    AnimationTransition,
    Dispatch<SetStateAction<AnimationTransition>>,
  ] = useState<AnimationTransition>(AnimationTransition.NONE);

  const [previousValueOnAnimationEnd, setPreviousValueOnAnimationEnd]: [
    BigDecimal,
    Dispatch<SetStateAction<BigDecimal>>,
  ] = useState<BigDecimal>(initialValue);

  const [canvasContext, setCanvasContext]: [
    CanvasRenderingContext2D | null,
    Dispatch<SetStateAction<CanvasRenderingContext2D | null>>,
  ] = useState<CanvasRenderingContext2D | null>(null);

  const previousValueOnAnimationStartRef: MutableRefObject<BigDecimal> = useRef<BigDecimal>(initialValue);
  const containerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);

  const isValueValid: boolean = !!`${value}`.match(/^-?(([1-9]\d*)|0)(\.\d+)?$/);
  const validValue: BigDecimal = isValueValid ? value! : 0;

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
  const hasSignChanged: boolean = (valueBigInt ^ previousValueOnAnimationEndBigInt) < 0;
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
    const newCanvasContext: CanvasRenderingContext2D = document.createElement('canvas').getContext('2d')!;
    newCanvasContext.font =
      [...containerRef.current!.classList]
        .map<string>((className: string): string => window.getComputedStyle(containerRef.current!, className).font)
        .find((font: string): string => font) ?? '';
    setCanvasContext(newCanvasContext);
  }, []);

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

  const horizontalAnimation: JSX.Element = (
    <HorizontalAnimation
      precision={precision}
      animationDuration={horizontalAnimationDuration}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      negativeCharacter={negativeCharacter}
      animationTimingFunction={animationTimingFunction}
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

  const verticalAnimation: JSX.Element = (
    <VerticalAnimation
      precision={precision}
      animationDuration={verticalAnimationDuration}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      negativeCharacter={negativeCharacter}
      negativeCharacterAnimationMode={negativeCharacterAnimationMode}
      animationTimingFunction={animationTimingFunction}
      previousValue={previousValueOnAnimationEndBigInt}
      currentValue={valueBigInt}
      maxNumberOfDigits={maxNumberOfDigits}
      hasSignChanged={hasSignChanged}
    />
  );

  const animationElement: JSX.Element = (
    <Conditional condition={renderHorizontalAnimation}>
      {horizontalAnimation}
      {verticalAnimation}
    </Conditional>
  );

  const valueElement: JSX.Element = (
    <Conditional condition={isValueValid}>
      {numberElement}
      <EmptyElement />
    </Conditional>
  );

  return (
    <StyledContainer ref={containerRef} onAnimationEnd={onAnimationEnd}>
      {negativeElement}
      <Conditional condition={renderAnimation}>
        {animationElement}
        {valueElement}
      </Conditional>
    </StyledContainer>
  );
};

export default NumbersTransition;
