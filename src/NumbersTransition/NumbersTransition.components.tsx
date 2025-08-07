import {
  Dispatch,
  FC,
  Fragment,
  FragmentProps,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  RefObject,
  SetStateAction,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ThemeProvider, useTheme } from 'styled-components';
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
  OptimizationStrategies,
  StyledComponents,
} from './NumbersTransition.enums';
import {
  AnimationAlgorithm,
  CharacterIndexFunctions,
  ChildrenProps,
  CubicBezierTuple,
  ElementKeyMapper,
  StyledViewWithProps,
  useCharacterIndexFunctions,
  useCubicBezier,
  useElementKeyMapper,
  useHorizontalAnimationDigits,
  useNumberOfDigitGroupSeparators,
  useTimeout,
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
  NumbersTransitionExecutionContext,
  NumbersTransitionTheme,
  VerticalAnimation,
  VerticalAnimationProps,
} from './NumbersTransition.styles';
import { GenericReactNode, OrArray } from './NumbersTransition.types';

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

interface EncloseProps<T extends GenericReactNode<ChildrenProps>> {
  children: T;
  enclose?: (children: T) => ReactNode;
}

const Enclose = <T extends GenericReactNode<ChildrenProps>>({ children, enclose }: EncloseProps<T>): ReactNode => (
  <Conditional condition={!!enclose}>
    {enclose?.(children)}
    {children}
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

  const timedOut: boolean = useTimeout(time);

  return timedOut === reverse ? before : after;
};

interface DeferProps {
  children: ReactElement<ChildrenProps>[];
  chunkSize: number;
  countElements: (child: ReactElement<ChildrenProps>) => number;
  onBeforeMount: (child: ReactElement<ChildrenProps>) => GenericReactNode<ChildrenProps>;
  onPartialMount: (child: ReactElement<ChildrenProps>, elementsToMount: number) => GenericReactNode<ChildrenProps>;
}

const Defer: FC<DeferProps> = (props: DeferProps): ReactNode => {
  const { children, chunkSize, countElements, onBeforeMount, onPartialMount }: DeferProps = props;

  const [mountedElements, setMountedElements]: [number, Dispatch<SetStateAction<number>>] = useState<number>(chunkSize);

  const countAggregatedSums = useCallback<(aggregatedSums: number[], child: ReactElement<ChildrenProps>) => number[]>(
    (aggregatedSums: number[], child: ReactElement<ChildrenProps>): number[] => [
      ...aggregatedSums,
      aggregatedSums.at(Numbers.MINUS_ONE)! + countElements(child),
    ],
    [countElements],
  );

  const aggregatedSumsOfElements = useMemo<number[]>(
    (): number[] => children.reduce<number[]>(countAggregatedSums, [Numbers.ZERO]).slice(Numbers.ONE),
    [children, countAggregatedSums],
  );

  const mapToFragmentElement: ElementKeyMapper<GenericReactNode<ChildrenProps>> = useElementKeyMapper<
    GenericReactNode<ChildrenProps>,
    FragmentProps
  >(Fragment);

  useEffect((): void => {
    if (mountedElements < aggregatedSumsOfElements.at(Numbers.MINUS_ONE)!) {
      requestAnimationFrame((): void => setMountedElements((previous: number): number => previous + chunkSize));
    }
  }, [chunkSize, mountedElements, aggregatedSumsOfElements]);

  const mapBeforeMount = (child: ReactElement<ChildrenProps>, numberOfElements: number): GenericReactNode<ChildrenProps> =>
    numberOfElements > Numbers.ZERO ? onPartialMount(child, numberOfElements ?? Numbers.ZERO) : onBeforeMount(child);

  const mapChildren = (child: ReactElement<ChildrenProps>, index: number): GenericReactNode<ChildrenProps> =>
    aggregatedSumsOfElements[index] > mountedElements
      ? mapBeforeMount(child, mountedElements - (aggregatedSumsOfElements[index - Numbers.ONE] ?? Numbers.ZERO))
      : child;

  return children.map<GenericReactNode<ChildrenProps>>(mapChildren).map<ReactElement<ChildrenProps>>(mapToFragmentElement);
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
  <ThemeProvider theme={{ invalidIndex: Numbers.ZERO }}>
    <Invalid {...characterStyledView} {...invalidStyledView}>
      {invalidValue}
    </Invalid>
  </ThemeProvider>
);

interface NegativeCharacterElementProps<T extends object, U, V extends object, W> {
  negativeCharacter: NegativeCharacters;
  visible?: boolean;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, T, U>;
  negativeCharacterStyledView: StyledViewWithProps<StyledComponents.NEGATIVE_CHARACTER, V, W>;
}

export const NegativeCharacterElement = <T extends object, U, V extends object, W>({
  negativeCharacter,
  visible,
  characterStyledView,
  negativeCharacterStyledView,
}: NegativeCharacterElementProps<T, U, V, W>): ReactNode => (
  <ThemeProvider theme={{ characterIndex: Numbers.ZERO, negativeCharacterIndex: Numbers.ZERO }}>
    <NegativeCharacter {...characterStyledView} {...negativeCharacterStyledView} visible={visible}>
      {negativeCharacter}
    </NegativeCharacter>
  </ThemeProvider>
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
  negativeCharacter: NegativeCharacters;
  negativeCharacterAnimationMode: NegativeCharacterAnimationModes;
  animationDigits: number[];
  hasSignChanged: boolean;
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
    characterStyledView,
    negativeCharacterStyledView,
  }: VerticalAnimationNegativeCharacterElementProps<T, U, V, W> = props;

  const { animationDirection, animationDuration, animationTimingFunction }: NumbersTransitionTheme = useTheme();
  const [cubicBezier, solve]: CubicBezierTuple = useCubicBezier();

  const mapToThemeProviderElement: ElementKeyMapper<ReactElement<ChildrenProps>> = useElementKeyMapper<
    ReactElement<ChildrenProps>,
    NumbersTransitionExecutionContext
  >(
    ThemeProvider,
    (
      _: ReactElement<ChildrenProps>,
      rowIndex: number,
      { length: columnLength }: ReactElement<ChildrenProps>[],
    ): NumbersTransitionExecutionContext => ({ theme: { columnLength, rowIndex } }),
  );

  const mapToNegativeCharacterElement: ElementKeyMapper<boolean> = useElementKeyMapper<boolean, NegativeCharacterElementProps<T, U, V, W>>(
    NegativeCharacterElement<T, U, V, W>,
    (visible: boolean): NegativeCharacterElementProps<T, U, V, W> => ({
      negativeCharacter,
      visible,
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

  const [xAxisCubicBezier, yAxisCubicBezier]: [(time: number) => number, (time: number) => number] = animationTimingFunction!
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

  const animationTime: number = animationDuration! * inputAnimationProgress;
  const animationSwitchTime: number =
    animationDirection === AnimationDirections.NORMAL ? animationTime : animationDuration! - animationTime;
  const animationDelay: number = animationDirection === AnimationDirections.NORMAL ? -animationTime : Numbers.ZERO;

  const verticalAnimationElement: ReactElement<ChildrenProps> = (
    <ThemeProvider theme={{ columnLength: negativeCharactersVisible.length }}>
      <VerticalAnimation {...(negativeCharacterAnimationMode === NegativeCharacterAnimationModes.SINGLE && { animationDelay })}>
        <div>
          {negativeCharactersVisible
            .map<ReactElement<ChildrenProps>>(mapToNegativeCharacterElement)
            .map<ReactElement<ChildrenProps>>(mapToThemeProviderElement)}
        </div>
      </VerticalAnimation>
    </ThemeProvider>
  );

  return (
    <Conditional condition={negativeCharacterAnimationMode === NegativeCharacterAnimationModes.SINGLE}>
      <Switch time={animationSwitchTime} reverse={animationDirection === AnimationDirections.REVERSE}>
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
  mapToElement?: ElementKeyMapper<ReactElement<ChildrenProps>>[];
  children: number[] | number[][];
  enclose?: (children: ReactElement<ChildrenProps>[]) => ReactNode;
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
    mapToElement = [],
    children,
    enclose,
  }: NumberElementProps<Q, R, S, T, U, V, W, X, Y, Z> = props;

  const { getCharacterIndex, getCharacterSeparatorIndex, getSeparatorIndex, getDigitGroupSeparatorIndex }: CharacterIndexFunctions =
    useCharacterIndexFunctions(precision);

  const mapToFragmentElement: ElementKeyMapper<ReactElement<ChildrenProps>> = useElementKeyMapper<
    ReactElement<ChildrenProps>,
    FragmentProps
  >(Fragment);

  const mapToDigitThemeProviderElement: ElementKeyMapper<OrArray<ReactElement<ChildrenProps>>> = useElementKeyMapper<
    OrArray<ReactElement<ChildrenProps>>,
    NumbersTransitionExecutionContext
  >(
    ThemeProvider,
    (
      _: OrArray<ReactElement<ChildrenProps>>,
      digitIndex: number,
      { length }: OrArray<ReactElement<ChildrenProps>>[],
    ): NumbersTransitionExecutionContext => ({ theme: { characterIndex: getCharacterIndex(digitIndex, length), digitIndex } }),
  );

  const mapToDigitsThemeProviderElement: ElementKeyMapper<ReactElement<ChildrenProps>> = useElementKeyMapper<
    ReactElement<ChildrenProps>,
    NumbersTransitionExecutionContext
  >(ThemeProvider, (_: ReactElement<ChildrenProps>, rowIndex: number): NumbersTransitionExecutionContext => ({ theme: { rowIndex } }));

  const mapToDigitElement: ElementKeyMapper<number> = useElementKeyMapper<number, DigitProps<Q, R, S, T>>(Digit, {
    ...characterStyledView,
    ...digitStyledView,
  });

  const mapToDigitsElement = (numbers: number[]): ReactElement<ChildrenProps>[] =>
    numbers.map<ReactElement<ChildrenProps>>(mapToDigitElement).map<ReactElement<ChildrenProps>>(mapToDigitsThemeProviderElement);

  const getSeparatorTheme = (partialTheme: Partial<NumbersTransitionTheme>, index: number, length: number) => ({
    ...partialTheme,
    characterIndex: getCharacterSeparatorIndex(index, length),
    separatorIndex: getSeparatorIndex(index, length),
  });

  const getDigitGroupSeparatorElement = (index: number, length: number): ReactElement<ChildrenProps> => (
    <ThemeProvider theme={getSeparatorTheme({ digitGroupSeparatorIndex: getDigitGroupSeparatorIndex(index, length) }, index, length)}>
      <DigitGroupSeparator {...characterStyledView} {...separatorStyledView} {...digitGroupSeparatorStyledView}>
        {digitGroupSeparator}
      </DigitGroupSeparator>
    </ThemeProvider>
  );

  const getDecimalSeparatorElement = (index: number, length: number): ReactElement<ChildrenProps> => (
    <ThemeProvider theme={getSeparatorTheme({ decimalSeparatorIndex: Numbers.ZERO }, index, length)}>
      <DecimalSeparator {...characterStyledView} {...separatorStyledView} {...decimalSeparatorStyledView}>
        {decimalSeparator}
      </DecimalSeparator>
    </ThemeProvider>
  );

  const getSeparatorElement = (index: number, length: number): ReactElement<ChildrenProps> =>
    (length - index === precision ? getDecimalSeparatorElement : getDigitGroupSeparatorElement)(index, length);

  const reduceToElements = (
    previousMapped: ReactElement<ChildrenProps>[],
    mapToElement: ElementKeyMapper<ReactElement<ChildrenProps>>,
  ): ReactElement<ChildrenProps>[] => previousMapped.map<ReactElement<ChildrenProps>>(mapToElement);

  const reduceToNumber = (
    accumulator: ReactElement<ChildrenProps>[],
    currentValue: ReactElement<ChildrenProps>,
    index: number,
    { length }: ReactElement<ChildrenProps>[],
  ): ReactElement<ChildrenProps>[] => [
    ...accumulator,
    ...(!!index && !((length - index - Math.max(precision, Numbers.ZERO)) % Numbers.THREE) ? [getSeparatorElement(index, length)] : []),
    currentValue,
  ];

  const mappedChildren: ReactElement<ChildrenProps>[] = Array.isOfDepth<number, Numbers.ONE>(children, Numbers.ONE)
    ? children.map<ReactElement<ChildrenProps>>(mapToDigitElement).map<ReactElement<ChildrenProps>>(mapToDigitThemeProviderElement)
    : children.map<ReactElement<ChildrenProps>[]>(mapToDigitsElement).map<ReactElement<ChildrenProps>>(mapToDigitThemeProviderElement);

  const number: ReactElement<ChildrenProps>[] = mapToElement
    .reduce<ReactElement<ChildrenProps>[]>(reduceToElements, mappedChildren)
    .reduce<ReactElement<ChildrenProps>[]>(reduceToNumber, [])
    .map<ReactElement<ChildrenProps>>(mapToFragmentElement);

  return <Enclose<ReactElement<ChildrenProps>[]> enclose={enclose}>{number}</Enclose>;
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
    characterStyledView,
    digitStyledView,
    separatorStyledView,
    decimalSeparatorStyledView,
    digitGroupSeparatorStyledView,
    negativeCharacterStyledView,
  }: HorizontalAnimationElementProps<O, P, Q, R, S, T, U, V, W, X, Y, Z> = props;

  const { numberOfAnimations, animationDirection }: NumbersTransitionTheme = useTheme();
  const [animationStartWidth, setAnimationStartWidth]: [number, Dispatch<SetStateAction<number>>] = useState<number>(Numbers.ZERO);
  const ref: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
  const animationEndWidth: number = ref.current?.getBoundingClientRect().width ?? Numbers.ZERO;

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
    animationDirection: animationDirection!,
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
  optimizationStrategy?: OptimizationStrategies;
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
    negativeCharacter,
    negativeCharacterAnimationMode,
    animationAlgorithm,
    optimizationStrategy = OptimizationStrategies.NONE,
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

  const { animationDirection }: NumbersTransitionTheme = useTheme();
  const animationDigits: number[][] = useVerticalAnimationDigits({ animationAlgorithm, maxNumberOfDigits, previousValue, currentValue });

  const mapToThemeProviderElement: ElementKeyMapper<ReactElement<ChildrenProps>> = useElementKeyMapper<
    ReactElement<ChildrenProps>,
    NumbersTransitionExecutionContext
  >(
    ThemeProvider,
    (_: ReactElement<ChildrenProps>, index: number): NumbersTransitionExecutionContext => ({
      theme: { columnLength: animationDigits[index].length },
    }),
  );

  const mapToVerticalAnimationElement: ElementKeyMapper<ReactElement<ChildrenProps>> = useElementKeyMapper<
    ReactElement<ChildrenProps>,
    VerticalAnimationProps
  >(VerticalAnimation);

  const mapToDivElement: ElementKeyMapper<ReactElement<ChildrenProps>> = useElementKeyMapper<
    ReactElement<ChildrenProps>,
    HTMLAttributes<HTMLElements.DIV>
  >(
    HTMLElements.DIV,
    (_: ReactElement<ChildrenProps>, index: number, { length }: ReactElement<ChildrenProps>[]): HTMLAttributes<HTMLElements.DIV> => ({
      ...(index === length - Numbers.ONE && { id: AnimationIds.VERTICAL_ANIMATION }),
    }),
  );

  const renderNegativeCharacter: boolean =
    hasSignChanged || (currentValue < Numbers.ZERO && negativeCharacterAnimationMode === NegativeCharacterAnimationModes.MULTI);

  const getLastNestedElement = (child: ReactElement<ChildrenProps>): ReactElement<ChildrenProps> =>
    isValidElement(child.props.children) ? getLastNestedElement(child.props.children) : child;

  const countElements = (child: ReactElement<ChildrenProps>): number => {
    // prettier-ignore
    const { props: { children } }: ReactElement<ChildrenProps> = getLastNestedElement(child);

    return Array.isArray<GenericReactNode<ChildrenProps>>(children) ? children.length : Numbers.ONE;
  };

  const onBeforeMount = (child: ReactElement<ChildrenProps>): GenericReactNode<ChildrenProps> => {
    const element: ReactElement<ChildrenProps> = getLastNestedElement(child);

    return Array.isArray<GenericReactNode<ChildrenProps>>(element.props.children)
      ? element.props.children.at(animationDirection === AnimationDirections.NORMAL ? Numbers.ZERO : Numbers.MINUS_ONE)
      : element;
  };

  const onPartialMount = (child: ReactElement<ChildrenProps>, numberOfElements: number): GenericReactNode<ChildrenProps> => {
    const element: ReactElement<ChildrenProps> = getLastNestedElement(child);

    return (
      <Conditional condition={Array.isArray<GenericReactNode<ChildrenProps>>(element.props.children)}>
        <div>
          {[element.props.children]
            .flat<GenericReactNode<ChildrenProps>[], Numbers.ONE>()
            .slice(...(animationDirection === AnimationDirections.NORMAL ? [Numbers.ZERO, numberOfElements] : [-numberOfElements]))}
        </div>
        {element}
      </Conditional>
    );
  };

  const negativeCharacterElement: ReactElement<ChildrenProps> = (
    <Optional condition={renderNegativeCharacter}>
      <VerticalAnimationNegativeCharacterElement<O, P, Y, Z>
        negativeCharacter={negativeCharacter}
        negativeCharacterAnimationMode={negativeCharacterAnimationMode}
        animationDigits={animationDigits.find((digits: number[]): boolean => digits.length > Numbers.ONE || !!digits[Numbers.ZERO])!}
        hasSignChanged={hasSignChanged}
        characterStyledView={characterStyledView}
        negativeCharacterStyledView={negativeCharacterStyledView}
      />
    </Optional>
  );

  const enclose = (children: ReactElement<ChildrenProps>[]): ReactNode => (
    <Conditional condition={optimizationStrategy === OptimizationStrategies.SPLIT}>
      <Defer chunkSize={Numbers.FIVE_THOUSAND} countElements={countElements} onBeforeMount={onBeforeMount} onPartialMount={onPartialMount}>
        {[negativeCharacterElement, ...children]}
      </Defer>
      <>
        {negativeCharacterElement}
        {children}
      </>
    </Conditional>
  );

  return (
    <NumberElement<O, P, Q, R, S, T, U, V, W, X>
      {...restProps}
      characterStyledView={characterStyledView}
      digitStyledView={digitStyledView}
      separatorStyledView={separatorStyledView}
      decimalSeparatorStyledView={decimalSeparatorStyledView}
      digitGroupSeparatorStyledView={digitGroupSeparatorStyledView}
      mapToElement={[mapToDivElement, mapToVerticalAnimationElement, mapToThemeProviderElement]}
      enclose={enclose}
    >
      {animationDigits}
    </NumberElement>
  );
};
