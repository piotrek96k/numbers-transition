import {
  Dispatch,
  FC,
  Fragment,
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
import { ThemeProvider, useTheme } from 'styled-components';
import {
  AnimationDirections,
  AnimationIds,
  AnimationNumbers,
  AnimationTransitions,
  DecimalSeparators,
  DeferTypes,
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
  useReactNestedElement,
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

interface PlainDeferProps<T extends GenericReactNode<ChildrenProps>> {
  deferType: DeferTypes.PLAIN;
  children: T[];
  chunkSize: number;
  onMountPlaceholder: (child: T) => GenericReactNode<ChildrenProps>;
  isHeavy: (child: T) => boolean;
}

interface NestedDeferProps<T extends GenericReactNode<ChildrenProps>, U extends GenericReactNode<ChildrenProps>> {
  deferType: DeferTypes.NESTED;
  children?: U;
  chunkSize: number;
  toDeferredChildren: (children?: U) => T[];
  onMountEnclose: (children: ReactElement<ChildrenProps>[]) => GenericReactNode<ChildrenProps>;
}
const Defer = <T extends GenericReactNode<ChildrenProps>, U extends GenericReactNode<ChildrenProps> = GenericReactNode<ChildrenProps>>(
  props: PlainDeferProps<T> | NestedDeferProps<T, U>,
): ReactNode => {
  const { deferType, children, chunkSize, ...restProps }: PlainDeferProps<T> | NestedDeferProps<T, U> = props;
  const { onMountPlaceholder, isHeavy, toDeferredChildren, onMountEnclose }: Partial<PlainDeferProps<T>> & Partial<NestedDeferProps<T, U>> =
    restProps;

  const deferredChildren: T[] = deferType === DeferTypes.NESTED ? toDeferredChildren!(children) : children;

  const [renderedChildren, setRenderedChildren]: [number, Dispatch<SetStateAction<number>>] = useState<number>(
    Math.max(chunkSize, ...(isHeavy ? [deferredChildren.findIndex(isHeavy) + chunkSize] : [])),
  );
  const mapToFragmentElement: ElementKeyMapper<GenericReactNode<ChildrenProps>> = useElementKeyMapper(Fragment);

  useEffect((): void => {
    if (renderedChildren < deferredChildren.length) {
      requestAnimationFrame((): void => setRenderedChildren((previous: number): number => previous + chunkSize));
    }
  }, [deferredChildren.length, chunkSize, renderedChildren]);

  const renderDeferred: boolean =
    renderedChildren < deferredChildren.length ||
    (Array.isArray<GenericReactNode<ChildrenProps>>(children) && children === deferredChildren && !onMountEnclose);

  const partialChildren: ReactElement<ChildrenProps>[] = [
    ...deferredChildren.slice(Numbers.ZERO, renderedChildren),
    ...(onMountPlaceholder ? deferredChildren.slice(renderedChildren).map<GenericReactNode<ChildrenProps>>(onMountPlaceholder) : []),
  ].map<ReactElement<ChildrenProps>>(mapToFragmentElement);

  return (
    <Conditional condition={renderDeferred}>
      <Enclose<ReactElement<ChildrenProps>[]> enclose={onMountEnclose}>{partialChildren}</Enclose>
      {children}
    </Conditional>
  );
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

  const mapToFragmentElement: ElementKeyMapper<ReactElement<ChildrenProps>> = useElementKeyMapper(Fragment);

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
  const getLastNestedElement: (child: ReactElement<ChildrenProps>) => ReactElement<ChildrenProps> = useReactNestedElement();

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

  const mapToDeferElement: ElementKeyMapper<ReactElement<ChildrenProps>> = useElementKeyMapper<
    ReactElement<ChildrenProps>,
    NestedDeferProps<GenericReactNode<ChildrenProps>, ReactElement<ChildrenProps>>
  >(Defer, {
    deferType: DeferTypes.NESTED,
    chunkSize: Numbers.ONE_THOUSAND,
    toDeferredChildren: (child?: ReactElement<ChildrenProps>): GenericReactNode<ChildrenProps>[] =>
      [getLastNestedElement(child!).props.children].flat<GenericReactNode<ChildrenProps>[], Numbers.ONE>(),
    onMountEnclose: (children: GenericReactNode<ChildrenProps>[]): GenericReactNode<ChildrenProps> => <div>{children}</div>,
  });

  const renderNegativeCharacter: boolean =
    hasSignChanged || (currentValue < Numbers.ZERO && negativeCharacterAnimationMode === NegativeCharacterAnimationModes.MULTI);

  const onMountPlaceholder = (child: ReactElement<ChildrenProps>): GenericReactNode<ChildrenProps> => {
    const element: ReactElement<ChildrenProps> = getLastNestedElement(child);

    return Array.isArray<GenericReactNode<ChildrenProps>>(element.props.children)
      ? element.props.children.at(animationDirection === AnimationDirections.NORMAL ? Numbers.ZERO : Numbers.MINUS_ONE)
      : element;
  };

  const isHeavy = (child: ReactElement<ChildrenProps>): boolean => {
    // prettier-ignore
    const { props: { children } }: ReactElement<ChildrenProps> = getLastNestedElement(child);

    return (
      (Array.isArray<GenericReactNode<ChildrenProps>>(children) && children.length > Numbers.ONE) || (!children && renderNegativeCharacter)
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
      <Defer<ReactElement<ChildrenProps>>
        deferType={DeferTypes.PLAIN}
        chunkSize={Numbers.TEN}
        onMountPlaceholder={onMountPlaceholder}
        isHeavy={isHeavy}
      >
        {[negativeCharacterElement, ...children]}
      </Defer>
      <>
        {negativeCharacterElement}
        {children}
      </>
    </Conditional>
  );

  const mapToElement: ElementKeyMapper<ReactElement<ChildrenProps>>[] = [
    mapToDivElement,
    mapToVerticalAnimationElement,
    ...(optimizationStrategy === OptimizationStrategies.SPLIT ? [mapToDeferElement] : []),
    mapToThemeProviderElement,
  ];

  return (
    <NumberElement<O, P, Q, R, S, T, U, V, W, X>
      {...restProps}
      characterStyledView={characterStyledView}
      digitStyledView={digitStyledView}
      separatorStyledView={separatorStyledView}
      decimalSeparatorStyledView={decimalSeparatorStyledView}
      digitGroupSeparatorStyledView={digitGroupSeparatorStyledView}
      mapToElement={mapToElement}
      enclose={enclose}
    >
      {animationDigits}
    </NumberElement>
  );
};
