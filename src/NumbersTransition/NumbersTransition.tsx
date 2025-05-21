import { Dispatch, ReactElement, ReactNode, RefObject, SetStateAction, useEffect, useRef, useState } from 'react';
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
  Strings,
  StyledComponents,
} from './NumbersTransition.enums';
import {
  AnimationDuration,
  AnimationDurationTuple,
  AnimationTimingFunctionTuple,
  AnimationValuesTuple,
  ExtendedAnimationTimingFunction,
  TotalAnimationDuration,
  ValidationTuple,
  useAnimationDuration,
  useAnimationTimingFunction,
  useAnimationValues,
  useForwardProp,
  useTotalAnimationDuration,
  useValidation,
} from './NumbersTransition.hooks';
import {
  AnimationTimingFunction,
  Container,
  NumbersTransitionTheme,
  View as StyledComponentView,
} from './NumbersTransition.styles';
import { BigDecimal, OrReadOnly, Slice, UncheckedBigDecimal } from './NumbersTransition.types';

type MappedView<T extends object = object, U = unknown> = {
  [K in keyof StyledComponentView<StyledComponents.CONTAINER, T, U> as Slice<Strings.DOLLAR, K>]: StyledComponentView<
    StyledComponents.CONTAINER,
    T,
    U
  >[K];
};

export interface View<T extends object = object, U = unknown> extends MappedView<T, U> {
  viewProps?: T;
}

export interface NumbersTransitionProps<
  T extends AnimationDuration | TotalAnimationDuration = AnimationDuration,
  U extends OrReadOnly<AnimationTimingFunction> | ExtendedAnimationTimingFunction = OrReadOnly<AnimationTimingFunction>,
  V extends object = object,
  W = unknown,
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
}

const NumbersTransition = <
  T extends AnimationDuration | TotalAnimationDuration = AnimationDuration,
  U extends OrReadOnly<AnimationTimingFunction> | ExtendedAnimationTimingFunction = OrReadOnly<AnimationTimingFunction>,
  V extends object = object,
  W = unknown,
>(
  props: NumbersTransitionProps<T, U, V, W>,
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
    view: { style, className, css, animation, viewProps } = {},
  }: NumbersTransitionProps<T, U, V, W> = props;

  const shouldForwardProp: ShouldForwardProp<Runtime.WEB> = useForwardProp();

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

  const onAnimationEnd = (): void => {
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

  const numberElement: ReactElement = (
    <NumberElement precision={precision} decimalSeparator={decimalSeparator} digitGroupSeparator={digitGroupSeparator}>
      {previousValueOnAnimationEndDigits}
    </NumberElement>
  );

  const horizontalAnimationElement: ReactElement = (
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
      onAnimationEnd={onAnimationEnd}
    />
  );

  const verticalAnimationElement: ReactElement = (
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
      onAnimationEnd={onAnimationEnd}
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
      <InvalidElement invalidValue={invalidValue} />
    </Conditional>
  );

  return (
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <ThemeProvider theme={theme}>
        <Container
          $style={style}
          $className={className}
          $css={css}
          $animation={animation}
          ref={containerRef}
          {...viewProps}
        >
          <Optional condition={renderNegativeElement}>
            <NegativeElement negativeCharacter={negativeCharacter} />
          </Optional>
          <Conditional condition={renderAnimation}>
            {animationElement}
            {valueElement}
          </Conditional>
        </Container>
      </ThemeProvider>
    </StyleSheetManager>
  );
};

export default NumbersTransition;
