import {
  CSSProperties,
  Dispatch,
  ReactElement,
  ReactNode,
  RefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ThemeProvider } from 'styled-components';
import {
  Conditional,
  EmptyElement,
  HorizontalAnimationElement,
  NegativeElement,
  NumberElement,
  Optional,
  VerticalAnimationElement,
} from './NumbersTransition.components';
import {
  AnimationTimingFunction,
  Container,
  CssRule,
  Keyframe,
  KeyframeFunctionFactory,
  NumbersTransitionTheme,
} from './NumbersTransition.styles';
import {
  AnimationTimingFunctions,
  AnimationTransition,
  AnimationType,
  DecimalSeparator,
  DefaultAnimationDuration,
  DigitGroupSeparator,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  NumberOfAnimations,
  Numbers,
  Strings,
} from './NumbersTransition.enums';
import {
  AnimationDuration,
  AnimationDurationTuple,
  AnimationTimingFunctionTuple,
  AnimationValuesTuple,
  BigDecimal,
  ExtendedAnimationTimingFunction,
  OptionalReadOnly,
  TotalAnimationDuration,
  UncheckedBigDecimal,
  ValidationTuple,
  useAnimationDuration,
  useAnimationTimingFunction,
  useAnimationValues,
  useTotalAnimationDuration,
  useValidation,
} from './NumbersTransition.hooks';

export interface View<T extends object = object, U = unknown> {
  css?: CssRule<T> | CssRule<T>[];
  cssProps?: T;
  keyframeFunction?: KeyframeFunctionFactory<T, U> | KeyframeFunctionFactory<T, U>[];
  keyframes?: Keyframe<U>[] | Keyframe<U>[][];
  className?: string | string[];
  style?: CSSProperties;
}

export interface NumbersTransitionProps<T extends object = object, U = unknown> {
  initialValue?: UncheckedBigDecimal;
  value?: UncheckedBigDecimal;
  precision?: number;
  animationDuration?: AnimationDuration | TotalAnimationDuration;
  decimalSeparator?: DecimalSeparator;
  digitGroupSeparator?: DigitGroupSeparator;
  negativeCharacter?: NegativeCharacter;
  negativeCharacterAnimationMode?: NegativeCharacterAnimationMode;
  animationTimingFunction?: OptionalReadOnly<AnimationTimingFunction> | ExtendedAnimationTimingFunction;
  view?: View<T, U>;
}

const NumbersTransition = <T extends object = object, U = unknown>(props: NumbersTransitionProps<T, U>): ReactNode => {
  const {
    initialValue,
    value,
    precision = Numbers.ZERO,
    animationDuration = {
      horizontalAnimation: DefaultAnimationDuration.HORIZONTAL_ANIMATION,
      verticalAnimation: DefaultAnimationDuration.VERTICAL_ANIMATION,
    },
    digitGroupSeparator = DigitGroupSeparator.SPACE,
    decimalSeparator = digitGroupSeparator === DigitGroupSeparator.COMMA
      ? DecimalSeparator.DOT
      : DecimalSeparator.COMMA,
    negativeCharacter = NegativeCharacter.MINUS,
    negativeCharacterAnimationMode = NegativeCharacterAnimationMode.SINGLE,
    animationTimingFunction = AnimationTimingFunctions.EASE,
    view: { css, cssProps, keyframeFunction, keyframes, className, style } = {},
  }: NumbersTransitionProps<T, U> = props;

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

  const numberOfAnimations: NumberOfAnimations = renderAnimation
    ? hasSignChanged
      ? hasThreeAnimations
        ? NumberOfAnimations.THREE
        : NumberOfAnimations.TWO
      : hasTheSameNumberOfDigits
        ? NumberOfAnimations.ONE
        : NumberOfAnimations.TWO
    : NumberOfAnimations.ZERO;

  const renderHorizontalAnimationWhenNumberOfAnimationsIsTwo: boolean = hasSignChanged
    ? animationTransition === AnimationTransition.NONE
      ? previousValueOnAnimationEndBigInt > valueBigInt
      : previousValueOnAnimationEndBigInt < valueBigInt
    : animationTransition === AnimationTransition.NONE
      ? previousValueOnAnimationEndDigits.length < valueDigits.length
      : previousValueOnAnimationEndDigits.length > valueDigits.length;

  const renderHorizontalAnimation: boolean =
    (numberOfAnimations === NumberOfAnimations.TWO && renderHorizontalAnimationWhenNumberOfAnimationsIsTwo) ||
    (numberOfAnimations === NumberOfAnimations.THREE && animationTransition !== AnimationTransition.FIRST_TO_SECOND);

  const renderNegativeElementWhenNumberOfAnimationsIsThree: boolean =
    numberOfAnimations === NumberOfAnimations.THREE &&
    previousValueOnAnimationEndBigInt < valueBigInt === (animationTransition === AnimationTransition.NONE);

  const renderNegativeElement: boolean =
    (!hasSignChanged && valueBigInt < Numbers.ZERO) ||
    (renderHorizontalAnimation && renderNegativeElementWhenNumberOfAnimationsIsThree);

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

  const animationType: AnimationType = renderAnimation
    ? renderHorizontalAnimation
      ? AnimationType.HORIZONTAL
      : AnimationType.VERTICAL
    : AnimationType.NONE;

  const theme: NumbersTransitionTheme = {
    $animationType: animationType,
    $numberOfAnimations: numberOfAnimations,
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
      <EmptyElement />
    </Conditional>
  );

  return (
    <ThemeProvider theme={theme}>
      <Container
        {...cssProps}
        $css={css}
        $keyframeFunction={keyframeFunction}
        $keyframes={keyframes}
        className={[className].flat<(undefined | string | string[])[], Numbers.ONE>().join(Strings.SPACE)}
        style={style}
        ref={containerRef}
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
  );
};

export default NumbersTransition;
