import {
  Dispatch,
  FC,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  RefObject,
  SetStateAction,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  AnimationDirections,
  AnimationIds,
  AnimationNumbers,
  AnimationTransitions,
  DecimalSeparators,
  DigitGroupSeparators,
  HTMLElements,
  NegativeCharacterAnimationModes,
  NegativeCharacters,
  Numbers,
  StyledComponents,
} from './NumbersTransition.enums';
import {
  AnimationAlgorithm,
  CharacterIndexFunctions,
  CubicBezierTuple,
  ElementKeyMapper,
  StyledViewWithProps,
  useCharacterIndexFunctions,
  useCubicBezier,
  useElementKeyMapper,
  useHorizontalAnimationDigits,
  useNumberOfDigitGroupSeparators,
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
  NumbersTransitionTheme,
  VerticalAnimation,
  VerticalAnimationProps,
} from './NumbersTransition.styles';

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
  theme: NumbersTransitionTheme;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, T, U>;
  invalidStyledView: StyledViewWithProps<StyledComponents.INVALID, V, W>;
}

export const InvalidElement = <T extends object, U, V extends object, W>({
  invalidValue,
  theme,
  characterStyledView,
  invalidStyledView,
}: InvalidElementProps<T, U, V, W>): ReactNode => (
  <Invalid {...characterStyledView} {...invalidStyledView} theme={{ ...theme, invalidIndex: Numbers.ZERO }}>
    {invalidValue}
  </Invalid>
);

interface NegativeCharacterElementProps<T extends object, U, V extends object, W> {
  negativeCharacter: NegativeCharacters;
  visible?: boolean;
  theme: NumbersTransitionTheme;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, T, U>;
  negativeCharacterStyledView: StyledViewWithProps<StyledComponents.NEGATIVE_CHARACTER, V, W>;
}

export const NegativeCharacterElement = <T extends object, U, V extends object, W>({
  negativeCharacter,
  visible,
  theme,
  characterStyledView,
  negativeCharacterStyledView,
}: NegativeCharacterElementProps<T, U, V, W>): ReactNode => (
  <NegativeCharacter
    {...characterStyledView}
    {...negativeCharacterStyledView}
    theme={{ ...theme, characterIndex: Numbers.ZERO, negativeCharacterIndex: Numbers.ZERO }}
    visible={visible}
  >
    {negativeCharacter}
  </NegativeCharacter>
);

interface HorizontalAnimationNegativeCharacterElementProps<T extends object, U, V extends object, W> {
  negativeCharacter: NegativeCharacters;
  theme: NumbersTransitionTheme;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, T, U>;
  negativeCharacterStyledView: StyledViewWithProps<StyledComponents.NEGATIVE_CHARACTER, V, W>;
}

const HorizontalAnimationNegativeCharacterElement = <T extends object, U, V extends object, W>(
  props: HorizontalAnimationNegativeCharacterElementProps<T, U, V, W>,
): ReactNode => <NegativeCharacterElement<T, U, V, W> {...props} visible={false} />;

interface VerticalAnimationNegativeCharacterElementProps<T extends object, U, V extends object, W> {
  negativeCharacter: NegativeCharacters;
  negativeCharacterAnimationMode: NegativeCharacterAnimationModes;
  animationDigits: number[];
  hasSignChanged: boolean;
  theme: NumbersTransitionTheme;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, T, U>;
  negativeCharacterStyledView: StyledViewWithProps<StyledComponents.NEGATIVE_CHARACTER, V, W>;
}

const VerticalAnimationNegativeCharacterElement = <T extends object, U, V extends object, W>(
  props: VerticalAnimationNegativeCharacterElementProps<T, U, V, W>,
): ReactNode => {
  const {
    negativeCharacter,
    negativeCharacterAnimationMode,
    animationDigits,
    hasSignChanged,
    theme,
    characterStyledView,
    negativeCharacterStyledView,
  }: VerticalAnimationNegativeCharacterElementProps<T, U, V, W> = props;

  const { animationDirection, animationDuration, animationTimingFunction }: NumbersTransitionTheme = theme;

  const [cubicBezier, solve]: CubicBezierTuple = useCubicBezier();

  const mapToNegativeCharacterElement: ElementKeyMapper<boolean> = useElementKeyMapper<NegativeCharacterElementProps<T, U, V, W>, boolean>(
    NegativeCharacterElement<T, U, V, W>,
    (visible: boolean, rowIndex: number, { length: columnLength }: boolean[]): NegativeCharacterElementProps<T, U, V, W> => ({
      negativeCharacter,
      visible,
      theme: { ...theme, columnLength, rowIndex },
      characterStyledView,
      negativeCharacterStyledView,
    }),
  );

  const mapAnimationTimingFunction = (
    accumulator: [number[], number[]],
    currentValue: AnimationTimingFunction[number],
  ): AnimationTimingFunction =>
    accumulator.map<number[], AnimationTimingFunction>((coordinates: number[], index: number): number[] => [
      ...coordinates,
      currentValue[index],
    ]);

  const [xAxisCubicBezier, yAxisCubicBezier]: [(time: number) => number, (time: number) => number] = animationTimingFunction
    .reduce<[number[], number[]], AnimationTimingFunction>(mapAnimationTimingFunction, [[], []])
    .map<(time: number) => number, [(time: number) => number, (time: number) => number]>(cubicBezier);

  const mapVisibility = (digit: number, index: number, digits: number[]): boolean =>
    !index || (!!digit && digits[index - Numbers.ONE] > digit) || !hasSignChanged;

  const negativeCharactersVisible: boolean[] = animationDigits.map<boolean>(mapVisibility);
  const outputAnimationProgress: number = negativeCharactersVisible.lastIndexOf(true) / (negativeCharactersVisible.length - Numbers.ONE);
  const inputAnimationProgress: number =
    negativeCharacterAnimationMode === NegativeCharacterAnimationModes.SINGLE
      ? xAxisCubicBezier(solve((value: number): number => yAxisCubicBezier(value) - outputAnimationProgress))
      : Numbers.ZERO;

  const animationTime: number = animationDuration * inputAnimationProgress;
  const animationSwitchTime: number = animationDirection === AnimationDirections.NORMAL ? animationTime : animationDuration - animationTime;
  const animationDelay: number = animationDirection === AnimationDirections.NORMAL ? -animationTime : Numbers.ZERO;

  const verticalAnimationElement: ReactElement = (
    <VerticalAnimation
      {...(negativeCharacterAnimationMode === NegativeCharacterAnimationModes.SINGLE && { animationDelay })}
      theme={{ ...theme, columnLength: negativeCharactersVisible.length }}
    >
      <div>{negativeCharactersVisible.map<ReactElement>(mapToNegativeCharacterElement)}</div>
    </VerticalAnimation>
  );

  return (
    <Conditional condition={negativeCharacterAnimationMode === NegativeCharacterAnimationModes.SINGLE}>
      <Switch time={animationSwitchTime} reverse={animationDirection === AnimationDirections.REVERSE}>
        <NegativeCharacterElement<T, U, V, W>
          negativeCharacter={negativeCharacter}
          theme={theme}
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
  theme: NumbersTransitionTheme;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, Q, R>;
  digitStyledView: StyledViewWithProps<StyledComponents.DIGIT, S, T>;
  separatorStyledView: StyledViewWithProps<StyledComponents.SEPARATOR, U, V>;
  decimalSeparatorStyledView: StyledViewWithProps<StyledComponents.DECIMAL_SEPARATOR, W, X>;
  digitGroupSeparatorStyledView: StyledViewWithProps<StyledComponents.DIGIT_GROUP_SEPARATOR, Y, Z>;
  mapToElement?: ElementKeyMapper<ReactElement>[];
  children: number[] | number[][];
}

export const NumberElement = <Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z>(
  props: NumberElementProps<Q, R, S, T, U, V, W, X, Y, Z>,
): ReactNode => {
  const {
    precision,
    decimalSeparator,
    digitGroupSeparator,
    theme,
    characterStyledView,
    digitStyledView,
    separatorStyledView,
    decimalSeparatorStyledView,
    digitGroupSeparatorStyledView,
    mapToElement = [],
    children,
  }: NumberElementProps<Q, R, S, T, U, V, W, X, Y, Z> = props;

  const { getCharacterIndex, getCharacterSeparatorIndex, getSeparatorIndex, getDigitGroupSeparatorIndex }: CharacterIndexFunctions =
    useCharacterIndexFunctions({ precision, theme });

  const mapToDigitElement: ElementKeyMapper<number, [number, number[][]] | []> = useElementKeyMapper<
    DigitProps<Q, R, S, T>,
    number,
    [number, number[][]] | []
  >(
    Digit,
    (_: number, index: number, { length }: number[], number: number = Numbers.ZERO, elements: number[][] = []): DigitProps<Q, R, S, T> => ({
      ...characterStyledView,
      ...digitStyledView,
      theme: {
        ...theme,
        ...(Array.isOfDepth<number, Numbers.ONE>(children, Numbers.ONE)
          ? { characterIndex: getCharacterIndex(index, length), digitIndex: index }
          : { characterIndex: getCharacterIndex(number, elements.length), digitIndex: number, columnLength: length, rowIndex: index }),
      },
    }),
  );

  const mapToDigitsElement = (element: number[], number: number, elements: number[][]): ReactElement => (
    <>
      {element.map<ReactElement>(
        (digit: number, index: number, digits: number[]): ReactElement => mapToDigitElement(digit, index, digits, number, elements),
      )}
    </>
  );

  const getSeparatorTheme = (partialTheme: Partial<NumbersTransitionTheme>, index: number, length: number) => ({
    ...theme,
    ...partialTheme,
    characterIndex: getCharacterSeparatorIndex(index, length),
    separatorIndex: getSeparatorIndex(index, length),
  });

  const getDigitGroupSeparatorElement = (index: number, length: number): ReactElement => (
    <DigitGroupSeparator
      {...characterStyledView}
      {...separatorStyledView}
      {...digitGroupSeparatorStyledView}
      theme={getSeparatorTheme({ digitGroupSeparatorIndex: getDigitGroupSeparatorIndex(index, length) }, index, length)}
    >
      {digitGroupSeparator}
    </DigitGroupSeparator>
  );

  const getDecimalSeparatorElement = (index: number, length: number): ReactElement => (
    <DecimalSeparator
      {...characterStyledView}
      {...separatorStyledView}
      {...decimalSeparatorStyledView}
      theme={getSeparatorTheme({ decimalSeparatorIndex: Numbers.ZERO }, index, length)}
    >
      {decimalSeparator}
    </DecimalSeparator>
  );

  const reduceToElements = (previousMapped: ReactElement[], mapToElement: ElementKeyMapper<ReactElement>): ReactElement[] =>
    previousMapped.map<ReactElement>(mapToElement);

  const reduceToNumber = (
    accumulator: ReactElement,
    currentValue: ReactElement,
    index: number,
    { length }: ReactElement[],
  ): ReactElement => (
    <>
      {accumulator}
      {!index ||
        !!((length - index - Math.max(precision, Numbers.ZERO)) % Numbers.THREE) ||
        (length - index === precision ? getDecimalSeparatorElement(index, length) : getDigitGroupSeparatorElement(index, length))}
      {currentValue}
    </>
  );

  const mappedChildren: ReactElement[] = Array.isOfDepth<number, Numbers.ONE>(children, Numbers.ONE)
    ? children.map<ReactElement>(mapToDigitElement)
    : children.map<ReactElement>(mapToDigitsElement);

  return mapToElement.reduce<ReactElement[]>(reduceToElements, mappedChildren).reduce(reduceToNumber, <></>);
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
  decimalSeparator: DecimalSeparators;
  digitGroupSeparator: DigitGroupSeparators;
  negativeCharacter: NegativeCharacters;
  animationTransition: AnimationTransitions;
  previousValueDigits: number[];
  currentValueDigits: number[];
  previousValue: bigint;
  currentValue: bigint;
  minNumberOfDigits: number;
  maxNumberOfDigits: number;
  numberOfDigitsDifference: number;
  hasSignChanged: boolean;
  theme: NumbersTransitionTheme;
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
    decimalSeparator,
    digitGroupSeparator,
    negativeCharacter,
    animationTransition,
    previousValueDigits,
    currentValueDigits,
    previousValue,
    currentValue,
    minNumberOfDigits,
    maxNumberOfDigits,
    numberOfDigitsDifference,
    hasSignChanged,
    theme,
    characterStyledView,
    digitStyledView,
    separatorStyledView,
    decimalSeparatorStyledView,
    digitGroupSeparatorStyledView,
    negativeCharacterStyledView,
  }: HorizontalAnimationElementProps<O, P, Q, R, S, T, U, V, W, X, Y, Z> = props;

  const { numberOfAnimations }: NumbersTransitionTheme = theme;

  const [animationStartWidth, setAnimationStartWidth]: [number, Dispatch<SetStateAction<number>>] = useState<number>(Numbers.ZERO);
  const ref: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
  const animationEndWidth: number = ref.current?.getBoundingClientRect().width ?? Numbers.ZERO;

  const { animationDirection }: NumbersTransitionTheme = theme;
  const calculateNumberOfDigitGroupSeparators: (numberOfDigits: number) => number = useNumberOfDigitGroupSeparators(precision);

  const sum = (first: number, second: number): number => first + second;
  const subtract = (first: number, second: number): number => first - second;

  const renderNegativeCharacter: boolean =
    hasSignChanged &&
    (numberOfAnimations === AnimationNumbers.TWO ||
      (numberOfAnimations === AnimationNumbers.THREE &&
        previousValue < currentValue === (animationTransition === AnimationTransitions.SECOND_TO_THIRD)));

  const renderZeros: boolean =
    numberOfAnimations === AnimationNumbers.TWO ||
    (numberOfAnimations === AnimationNumbers.THREE && previousValue < currentValue === (animationTransition === AnimationTransitions.NONE));

  const numberOfDigits: number = renderZeros ? minNumberOfDigits : maxNumberOfDigits;

  const animationStartIndex: number = [
    ref.current?.children.length ?? Numbers.ZERO,
    [numberOfDigits, calculateNumberOfDigitGroupSeparators(numberOfDigits), precision > Numbers.ZERO ? Numbers.ONE : Numbers.ZERO].reduce(
      sum,
    ),
  ].reduce(subtract);

  const animationDigits: number[] = useHorizontalAnimationDigits({
    numberOfDigitsDifference,
    previousValueDigits,
    currentValueDigits,
    animationDirection,
    renderZeros,
  });

  useLayoutEffect((): void => {
    const reduceAnimationStartWidth = (sum: number, child: Element, index: number) =>
      animationStartIndex <= index ? sum + child.getBoundingClientRect().width : Numbers.ZERO;

    setAnimationStartWidth([...(ref.current?.children ?? [])].reduce<number>(reduceAnimationStartWidth, Numbers.ZERO));
  }, [animationStartIndex]);

  const negativeCharacterElement: ReactElement = (
    <Optional condition={renderNegativeCharacter}>
      <HorizontalAnimationNegativeCharacterElement<O, P, Y, Z>
        negativeCharacter={negativeCharacter}
        theme={theme}
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
      theme={theme}
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
      theme={theme}
      animationStartWidth={animationStartWidth}
      animationEndWidth={animationEndWidth}
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
  decimalSeparator: DecimalSeparators;
  digitGroupSeparator: DigitGroupSeparators;
  negativeCharacter: NegativeCharacters;
  negativeCharacterAnimationMode: NegativeCharacterAnimationModes;
  animationAlgorithm?: AnimationAlgorithm;
  previousValue: bigint;
  currentValue: bigint;
  maxNumberOfDigits: number;
  hasSignChanged: boolean;
  theme: NumbersTransitionTheme;
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
    negativeCharacter,
    negativeCharacterAnimationMode,
    animationAlgorithm,
    previousValue,
    currentValue,
    maxNumberOfDigits,
    hasSignChanged,
    theme,
    characterStyledView,
    digitStyledView,
    separatorStyledView,
    decimalSeparatorStyledView,
    digitGroupSeparatorStyledView,
    negativeCharacterStyledView,
    ...restProps
  }: VerticalAnimationElementProps<O, P, Q, R, S, T, U, V, W, X, Y, Z> = props;

  const animationDigits: number[][] = useVerticalAnimationDigits({ animationAlgorithm, maxNumberOfDigits, previousValue, currentValue });

  const mapToVerticalAnimationElement: ElementKeyMapper<ReactElement> = useElementKeyMapper<VerticalAnimationProps, ReactElement>(
    VerticalAnimation,
    (_: ReactElement, index: number): VerticalAnimationProps => ({ theme: { ...theme, columnLength: animationDigits[index].length } }),
  );

  const mapToDivElement: ElementKeyMapper<ReactElement> = useElementKeyMapper<HTMLAttributes<HTMLElements.DIV>, ReactElement>(
    HTMLElements.DIV,
    (_: ReactElement, index: number, { length }: ReactElement[]): HTMLAttributes<HTMLElements.DIV> => ({
      ...(index === length - Numbers.ONE && { id: AnimationIds.VERTICAL_ANIMATION }),
    }),
  );

  const renderNegativeCharacter: boolean =
    hasSignChanged || (currentValue < Numbers.ZERO && negativeCharacterAnimationMode === NegativeCharacterAnimationModes.MULTI);

  return (
    <>
      <Optional condition={renderNegativeCharacter}>
        <VerticalAnimationNegativeCharacterElement<O, P, Y, Z>
          negativeCharacter={negativeCharacter}
          negativeCharacterAnimationMode={negativeCharacterAnimationMode}
          animationDigits={animationDigits.find((digits: number[]): boolean => digits.length > Numbers.ONE || !!digits[Numbers.ZERO])!}
          hasSignChanged={hasSignChanged}
          theme={theme}
          characterStyledView={characterStyledView}
          negativeCharacterStyledView={negativeCharacterStyledView}
        />
      </Optional>
      <NumberElement<O, P, Q, R, S, T, U, V, W, X>
        {...restProps}
        theme={theme}
        characterStyledView={characterStyledView}
        digitStyledView={digitStyledView}
        separatorStyledView={separatorStyledView}
        decimalSeparatorStyledView={decimalSeparatorStyledView}
        digitGroupSeparatorStyledView={digitGroupSeparatorStyledView}
        mapToElement={[mapToDivElement, mapToVerticalAnimationElement]}
      >
        {animationDigits}
      </NumberElement>
    </>
  );
};
