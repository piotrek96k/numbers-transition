import { Dispatch, FC, ReactElement, ReactNode, RefObject, SetStateAction, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  AnimationIds,
  AnimationNumbers,
  AnimationTransitions,
  DecimalSeparators,
  DigitGroupSeparators,
  Display,
  HorizontalAnimationDirection,
  NegativeCharacterAnimationModes,
  NegativeCharacters,
  Numbers,
  StyledComponents,
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import {
  CubicBezierTuple,
  ElementKeyMapper,
  StyledViewWithProps,
  useAnimationTimingFunctionDirection,
  useCubicBezier,
  useElementKeyMapper,
  useHorizontalAnimationDigits,
  useVerticalAnimationDigits,
} from './NumbersTransition.hooks';
import {
  AnimationTimingFunction,
  DecimalSeparator,
  Digit,
  DigitGroupSeparator,
  DigitProps,
  HorizontalAnimation,
  Invalid,
  NegativeCharacter,
  VerticalAnimation,
  VerticalAnimationProps,
} from './NumbersTransition.styles';
import { OrReadOnly } from './NumbersTransition.types';

interface ConditionalProps {
  children: [ReactNode, ReactNode];
  condition: boolean;
}

export const Conditional: FC<ConditionalProps> = ({ children: [onTrue, onFalse], condition }: ConditionalProps): ReactNode =>
  condition ? onTrue : onFalse;

interface OptionalProps {
  children: ReactNode;
  condition: boolean;
}

export const Optional: FC<OptionalProps> = ({ children, condition }: OptionalProps): ReactNode => (
  <Conditional condition={condition}>
    {children}
    {undefined}
  </Conditional>
);

interface SwitchProps {
  children: [ReactNode, ReactNode];
  time: number;
  reverse: boolean;
}

const Switch: FC<SwitchProps> = (props: SwitchProps): ReactNode => {
  const {
    children: [before, after],
    time,
    reverse,
  }: SwitchProps = props;

  const [switched, setSwitched]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);

  useEffect((): (() => void) => {
    const timeout: NodeJS.Timeout = setTimeout((): void => setSwitched(true), time);
    return (): void => clearTimeout(timeout);
  }, [time]);

  return switched === reverse ? before : after;
};

interface InvalidElementProps<T extends object, U, V extends object, W> {
  invalidValue: string;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, T, U>;
  invalidStyledView: StyledViewWithProps<StyledComponents.INVALID, V, W>;
}

export const InvalidElement = <T extends object, U, V extends object, W>({
  invalidValue,
  characterStyledView,
  invalidStyledView,
}: InvalidElementProps<T, U, V, W>): ReactNode => (
  <Invalid {...characterStyledView} {...invalidStyledView}>
    {invalidValue}
  </Invalid>
);

interface NegativeCharacterElementProps<T extends object, U, V extends object, W> {
  negativeCharacter: NegativeCharacters;
  visible?: boolean;
  display?: Display;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, T, U>;
  negativeCharacterStyledView: StyledViewWithProps<StyledComponents.NEGATIVE_CHARACTER, V, W>;
}

export const NegativeCharacterElement = <T extends object, U, V extends object, W>({
  negativeCharacter,
  visible,
  display,
  characterStyledView,
  negativeCharacterStyledView,
}: NegativeCharacterElementProps<T, U, V, W>): ReactNode => (
  <NegativeCharacter {...characterStyledView} {...negativeCharacterStyledView} $visible={visible} $display={display}>
    {negativeCharacter}
  </NegativeCharacter>
);

interface HorizontalAnimationNegativeCharacterElementProps<T extends object, U, V extends object, W> {
  negativeCharacter: NegativeCharacters;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, T, U>;
  negativeCharacterStyledView: StyledViewWithProps<StyledComponents.NEGATIVE_CHARACTER, V, W>;
}

const HorizontalAnimationNegativeCharacterElement = <T extends object, U, V extends object, W>(
  props: HorizontalAnimationNegativeCharacterElementProps<T, U, V, W>,
): ReactNode => <NegativeCharacterElement<T, U, V, W> {...props} visible={false} />;

interface VerticalAnimationNegativeCharacterElementProps<T extends object, U, V extends object, W> {
  animationDuration: number;
  negativeCharacter: NegativeCharacters;
  negativeCharacterAnimationMode: NegativeCharacterAnimationModes;
  animationTimingFunction: AnimationTimingFunction;
  animationDirection: VerticalAnimationDirection;
  animationDigits: number[];
  hasSignChanged: boolean;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, T, U>;
  negativeCharacterStyledView: StyledViewWithProps<StyledComponents.NEGATIVE_CHARACTER, V, W>;
}

const VerticalAnimationNegativeCharacterElement = <T extends object, U, V extends object, W>(
  props: VerticalAnimationNegativeCharacterElementProps<T, U, V, W>,
): ReactNode => {
  const {
    animationDuration,
    negativeCharacter,
    negativeCharacterAnimationMode,
    animationTimingFunction,
    animationDirection,
    animationDigits,
    hasSignChanged,
    characterStyledView,
    negativeCharacterStyledView,
  }: VerticalAnimationNegativeCharacterElementProps<T, U, V, W> = props;

  const [cubicBezier, solve]: CubicBezierTuple = useCubicBezier();

  const negativeCharacterElementPropsFactory = (visible: boolean): NegativeCharacterElementProps<T, U, V, W> => ({
    negativeCharacter,
    visible,
    display: Display.BLOCK,
    characterStyledView,
    negativeCharacterStyledView,
  });

  const negativeCharacterElementMapper: ElementKeyMapper<boolean> = useElementKeyMapper<NegativeCharacterElementProps<T, U, V, W>, boolean>(
    NegativeCharacterElement<T, U, V, W>,
    negativeCharacterElementPropsFactory,
  );

  const animationTimingFunctionReducer = (
    accumulator: [number[], number[]],
    currentValue: AnimationTimingFunction[number],
  ): AnimationTimingFunction =>
    accumulator.map<number[], AnimationTimingFunction>((coordinates: number[], index: number): number[] => [...coordinates, currentValue[index]]);

  const [xAxisCubicBezier, yAxisCubicBezier] = animationTimingFunction
    .reduce<[number[], number[]], AnimationTimingFunction>(animationTimingFunctionReducer, [[], []])
    .map<(time: number) => number>(cubicBezier);

  const visibilityMapper = (digit: number, index: number, digits: number[]): boolean =>
    !index || (!!digit && digits[index - Numbers.ONE] > digit) || !hasSignChanged;

  const negativeCharactersVisible: boolean[] = animationDigits.map<boolean>(visibilityMapper);

  const outputAnimationProgress: number = negativeCharactersVisible.lastIndexOf(true) / (negativeCharactersVisible.length - Numbers.ONE);

  const inputAnimationProgress: number =
    negativeCharacterAnimationMode === NegativeCharacterAnimationModes.SINGLE
      ? xAxisCubicBezier(solve((value: number): number => yAxisCubicBezier(value) - outputAnimationProgress))
      : Numbers.ZERO;

  const animationTime: number = animationDuration * inputAnimationProgress;

  const animationSwitchTime: number = animationDirection === VerticalAnimationDirection.UP ? animationTime : animationDuration - animationTime;

  const animationDelay: number = animationDirection === VerticalAnimationDirection.UP ? -animationTime : Numbers.ZERO;

  const verticalAnimationElement: ReactElement = (
    <VerticalAnimation
      $animationDirection={animationDirection}
      $animationDuration={animationDuration}
      $animationTimingFunction={animationTimingFunction}
      {...(negativeCharacterAnimationMode === NegativeCharacterAnimationModes.SINGLE && { $animationDelay: animationDelay })}
    >
      <div>{negativeCharactersVisible.map<ReactElement>(negativeCharacterElementMapper)}</div>
    </VerticalAnimation>
  );

  return (
    <Conditional condition={negativeCharacterAnimationMode === NegativeCharacterAnimationModes.SINGLE}>
      <Switch time={animationSwitchTime} reverse={animationDirection === VerticalAnimationDirection.DOWN}>
        <NegativeCharacterElement<T, U, V, W>
          negativeCharacter={negativeCharacter}
          characterStyledView={characterStyledView}
          negativeCharacterStyledView={negativeCharacterStyledView}
        />
        {verticalAnimationElement}
      </Switch>
      {verticalAnimationElement}
    </Conditional>
  );
};

interface NumberElementProps<Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z> {
  precision: number;
  decimalSeparator: DecimalSeparators;
  digitGroupSeparator: DigitGroupSeparators;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, Q, R>;
  digitStyledView: StyledViewWithProps<StyledComponents.DIGIT, S, T>;
  separatorStyledView: StyledViewWithProps<StyledComponents.SEPARATOR, U, V>;
  decimalSeparatorStyledView: StyledViewWithProps<StyledComponents.DECIMAL_SEPARATOR, W, X>;
  digitGroupSeparatorStyledView: StyledViewWithProps<StyledComponents.DIGIT_GROUP_SEPARATOR, Y, Z>;
  elementMapper?: ElementKeyMapper<ReactNode>;
  children: ReactNode[];
}

export const NumberElement = <Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z>(
  props: NumberElementProps<Q, R, S, T, U, V, W, X, Y, Z>,
): ReactNode => {
  const {
    precision,
    decimalSeparator,
    digitGroupSeparator,
    characterStyledView,
    digitStyledView,
    separatorStyledView,
    decimalSeparatorStyledView,
    digitGroupSeparatorStyledView,
    elementMapper,
    children,
  }: NumberElementProps<Q, R, S, T, U, V, W, X, Y, Z> = props;

  const digitElementMapper: ElementKeyMapper<ReactNode> = useElementKeyMapper<DigitProps<Q, R, S, T>, ReactNode>(Digit, {
    ...characterStyledView,
    ...digitStyledView,
  });

  const decimalSeparatorElement: ReactElement = (
    <DecimalSeparator {...characterStyledView} {...separatorStyledView} {...decimalSeparatorStyledView}>
      {decimalSeparator}
    </DecimalSeparator>
  );

  const digitGroupSeparatorElement: ReactElement = (
    <DigitGroupSeparator {...characterStyledView} {...separatorStyledView} {...digitGroupSeparatorStyledView}>
      {digitGroupSeparator}
    </DigitGroupSeparator>
  );

  const getSeparatorElement = (index: number, length: number): ReactNode =>
    !((length - index - Math.max(precision, Numbers.ZERO)) % Numbers.THREE) &&
    (length - index === precision ? decimalSeparatorElement : digitGroupSeparatorElement);

  const digitsReducer = (accumulator: ReactElement, currentValue: ReactElement, index: number, { length }: ReactElement[]): ReactElement => (
    <>
      {accumulator}
      {getSeparatorElement(index, length)}
      {currentValue}
    </>
  );

  return children.map<ReactElement>(elementMapper ?? digitElementMapper).reduce(digitsReducer);
};

interface HorizontalAnimationElementProps<
  O extends object,
  P,
  Q extends object,
  R,
  S extends object,
  T,
  U extends object,
  V,
  W extends object,
  X,
  Y extends object,
  Z,
> {
  precision: number;
  animationDuration: number;
  decimalSeparator: DecimalSeparators;
  digitGroupSeparator: DigitGroupSeparators;
  negativeCharacter: NegativeCharacters;
  animationTimingFunction: OrReadOnly<AnimationTimingFunction>;
  animationTransition: AnimationTransitions;
  previousValueDigits: number[];
  currentValueDigits: number[];
  previousValue: bigint;
  currentValue: bigint;
  minNumberOfDigits: number;
  maxNumberOfDigits: number;
  numberOfDigitsDifference: number;
  hasSignChanged: boolean;
  numberOfAnimations: AnimationNumbers;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, O, P>;
  digitStyledView: StyledViewWithProps<StyledComponents.DIGIT, Q, R>;
  separatorStyledView: StyledViewWithProps<StyledComponents.SEPARATOR, S, T>;
  decimalSeparatorStyledView: StyledViewWithProps<StyledComponents.DECIMAL_SEPARATOR, U, V>;
  digitGroupSeparatorStyledView: StyledViewWithProps<StyledComponents.DIGIT_GROUP_SEPARATOR, W, X>;
  negativeCharacterStyledView: StyledViewWithProps<StyledComponents.NEGATIVE_CHARACTER, Y, Z>;
}

export const HorizontalAnimationElement = <
  O extends object,
  P,
  Q extends object,
  R,
  S extends object,
  T,
  U extends object,
  V,
  W extends object,
  X,
  Y extends object,
  Z,
>(
  props: HorizontalAnimationElementProps<O, P, Q, R, S, T, U, V, W, X, Y, Z>,
): ReactNode => {
  const {
    precision,
    animationDuration,
    decimalSeparator,
    digitGroupSeparator,
    negativeCharacter,
    animationTimingFunction: animationTimingFunctionInput,
    animationTransition,
    previousValueDigits,
    currentValueDigits,
    previousValue,
    currentValue,
    minNumberOfDigits,
    maxNumberOfDigits,
    numberOfDigitsDifference,
    hasSignChanged,
    numberOfAnimations,
    characterStyledView,
    digitStyledView,
    separatorStyledView,
    decimalSeparatorStyledView,
    digitGroupSeparatorStyledView,
    negativeCharacterStyledView,
  }: HorizontalAnimationElementProps<O, P, Q, R, S, T, U, V, W, X, Y, Z> = props;

  const [animationStartWidth, setAnimationStartWidth]: [number, Dispatch<SetStateAction<number>>] = useState<number>(Numbers.ZERO);
  const ref: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
  const animationEndWidth: number = ref.current?.getBoundingClientRect().width ?? Numbers.ZERO;

  const sum = (first: number, second: number): number => first + second;
  const subtract = (first: number, second: number): number => first - second;

  const animationDirection: HorizontalAnimationDirection =
    (numberOfAnimations === AnimationNumbers.TWO &&
      (hasSignChanged ? previousValue > currentValue : previousValueDigits.length < currentValueDigits.length)) ||
    (numberOfAnimations === AnimationNumbers.THREE && animationTransition === AnimationTransitions.NONE)
      ? HorizontalAnimationDirection.RIGHT
      : HorizontalAnimationDirection.LEFT;

  const renderNegativeCharacter: boolean =
    hasSignChanged &&
    (numberOfAnimations === AnimationNumbers.TWO ||
      (numberOfAnimations === AnimationNumbers.THREE &&
        previousValue < currentValue === (animationTransition === AnimationTransitions.SECOND_TO_THIRD)));

  const renderZeros: boolean =
    numberOfAnimations === AnimationNumbers.TWO ||
    (numberOfAnimations === AnimationNumbers.THREE && previousValue < currentValue === (animationTransition === AnimationTransitions.NONE));

  const numberOfDigits: number = renderZeros ? minNumberOfDigits : maxNumberOfDigits;

  const numberOfDigitGroupSeparators: number = [numberOfDigits - Math.max(precision, Numbers.ZERO), Math.max(precision, Numbers.ZERO)]
    .map<number>((quantity: number): number => Math.trunc((quantity - Numbers.ONE) / Numbers.THREE))
    .reduce(sum);

  const animationStartIndex: number = [
    ref.current?.children.length ?? Numbers.ZERO,
    [numberOfDigits, numberOfDigitGroupSeparators, precision > Numbers.ZERO ? Numbers.ONE : Numbers.ZERO].reduce(sum),
  ].reduce(subtract);

  const animationTimingFunction: AnimationTimingFunction = useAnimationTimingFunctionDirection({
    animationTimingFunction: animationTimingFunctionInput,
    animationDirection,
  });

  const animationDigits: number[] = useHorizontalAnimationDigits({
    numberOfDigitsDifference,
    previousValueDigits,
    currentValueDigits,
    animationDirection,
    renderZeros,
  });

  useLayoutEffect((): void => {
    const reduceAnimationStartWidth = (sum: number, child: Element, index: number) =>
      index >= animationStartIndex ? sum + child.getBoundingClientRect().width : Numbers.ZERO;

    setAnimationStartWidth([...(ref.current?.children ?? [])].reduce<number>(reduceAnimationStartWidth, Numbers.ZERO));
  }, [animationStartIndex]);

  const negativeCharacterElement: ReactElement = (
    <Optional condition={renderNegativeCharacter}>
      <HorizontalAnimationNegativeCharacterElement<O, P, Y, Z>
        negativeCharacter={negativeCharacter}
        characterStyledView={characterStyledView}
        negativeCharacterStyledView={negativeCharacterStyledView}
      />
    </Optional>
  );

  const numberElement: ReactElement = (
    <NumberElement<O, P, Q, R, S, T, U, V, W, X>
      precision={precision}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      characterStyledView={characterStyledView}
      digitStyledView={digitStyledView}
      separatorStyledView={separatorStyledView}
      decimalSeparatorStyledView={decimalSeparatorStyledView}
      digitGroupSeparatorStyledView={digitGroupSeparatorStyledView}
    >
      {animationDigits}
    </NumberElement>
  );

  return (
    <HorizontalAnimation
      $animationDirection={animationDirection}
      $animationDuration={animationDuration}
      $animationTimingFunction={animationTimingFunction}
      $animationStartWidth={animationStartWidth}
      $animationEndWidth={animationEndWidth}
      id={AnimationIds.HORIZONTAL_ANIMATION}
    >
      <div ref={ref}>
        {negativeCharacterElement}
        {numberElement}
      </div>
    </HorizontalAnimation>
  );
};

interface VerticalAnimationElementProps<
  O extends object,
  P,
  Q extends object,
  R,
  S extends object,
  T,
  U extends object,
  V,
  W extends object,
  X,
  Y extends object,
  Z,
> {
  precision: number;
  animationDuration: number;
  decimalSeparator: DecimalSeparators;
  digitGroupSeparator: DigitGroupSeparators;
  negativeCharacter: NegativeCharacters;
  negativeCharacterAnimationMode: NegativeCharacterAnimationModes;
  animationTimingFunction: OrReadOnly<AnimationTimingFunction>;
  previousValue: bigint;
  currentValue: bigint;
  maxNumberOfDigits: number;
  hasSignChanged: boolean;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, O, P>;
  digitStyledView: StyledViewWithProps<StyledComponents.DIGIT, Q, R>;
  separatorStyledView: StyledViewWithProps<StyledComponents.SEPARATOR, S, T>;
  decimalSeparatorStyledView: StyledViewWithProps<StyledComponents.DECIMAL_SEPARATOR, U, V>;
  digitGroupSeparatorStyledView: StyledViewWithProps<StyledComponents.DIGIT_GROUP_SEPARATOR, W, X>;
  negativeCharacterStyledView: StyledViewWithProps<StyledComponents.NEGATIVE_CHARACTER, Y, Z>;
}

export const VerticalAnimationElement = <
  O extends object,
  P,
  Q extends object,
  R,
  S extends object,
  T,
  U extends object,
  V,
  W extends object,
  X,
  Y extends object,
  Z,
>(
  props: VerticalAnimationElementProps<O, P, Q, R, S, T, U, V, W, X, Y, Z>,
): ReactNode => {
  const {
    animationDuration,
    negativeCharacter,
    negativeCharacterAnimationMode,
    animationTimingFunction: animationTimingFunctionInput,
    previousValue,
    currentValue,
    maxNumberOfDigits,
    hasSignChanged,
    characterStyledView,
    digitStyledView,
    separatorStyledView,
    decimalSeparatorStyledView,
    digitGroupSeparatorStyledView,
    negativeCharacterStyledView,
    ...restProps
  }: VerticalAnimationElementProps<O, P, Q, R, S, T, U, V, W, X, Y, Z> = props;

  const renderNegativeCharacter: boolean =
    hasSignChanged || (currentValue < Numbers.ZERO && negativeCharacterAnimationMode === NegativeCharacterAnimationModes.MULTI);

  const animationDirection: VerticalAnimationDirection =
    previousValue < currentValue ? VerticalAnimationDirection.UP : VerticalAnimationDirection.DOWN;

  const animationTimingFunction: AnimationTimingFunction = useAnimationTimingFunctionDirection({
    animationTimingFunction: animationTimingFunctionInput,
    animationDirection,
  });

  const animationDigits: number[][] = useVerticalAnimationDigits({ maxNumberOfDigits, previousValue, currentValue });

  const verticalAnimationElementMapper: ElementKeyMapper<ReactNode> = useElementKeyMapper<VerticalAnimationProps, ReactNode>(VerticalAnimation, {
    $animationDirection: animationDirection,
    $animationDuration: animationDuration,
    $animationTimingFunction: animationTimingFunction,
  });

  const digitElementMapper: ElementKeyMapper<number> = useElementKeyMapper<DigitProps<O, P, Q, R>, number>(Digit, {
    ...characterStyledView,
    ...digitStyledView,
    $display: Display.BLOCK,
  });

  const divisionMapper = (digits: number[], index: number, { length }: number[][]): ReactElement => (
    <div {...(index === length - Numbers.ONE && { id: AnimationIds.VERTICAL_ANIMATION })}>{digits.map<ReactElement>(digitElementMapper)}</div>
  );

  return (
    <>
      <Optional condition={renderNegativeCharacter}>
        <VerticalAnimationNegativeCharacterElement<O, P, Y, Z>
          animationDuration={animationDuration}
          negativeCharacter={negativeCharacter}
          negativeCharacterAnimationMode={negativeCharacterAnimationMode}
          animationTimingFunction={animationTimingFunction}
          animationDirection={animationDirection}
          animationDigits={animationDigits[Numbers.ZERO]}
          hasSignChanged={hasSignChanged}
          characterStyledView={characterStyledView}
          negativeCharacterStyledView={negativeCharacterStyledView}
        />
      </Optional>
      <NumberElement<O, P, Q, R, S, T, U, V, W, X>
        {...restProps}
        characterStyledView={characterStyledView}
        digitStyledView={digitStyledView}
        separatorStyledView={separatorStyledView}
        decimalSeparatorStyledView={decimalSeparatorStyledView}
        digitGroupSeparatorStyledView={digitGroupSeparatorStyledView}
        elementMapper={verticalAnimationElementMapper}
      >
        {animationDigits.map<ReactElement>(divisionMapper)}
      </NumberElement>
    </>
  );
};
