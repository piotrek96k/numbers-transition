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
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ThemeProvider, useTheme } from 'styled-components';
import {
  AnimationDirection,
  AnimationId,
  AnimationNumber,
  AnimationTransition,
  DecimalSeparatorCharacter,
  DigitGroupSeparatorCharacter,
  HTMLElement,
  Integer,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  OptimizationStrategy,
  Styled,
} from './NumbersTransition.enums';
import {
  AnimationAlgorithm,
  ChildrenProps,
  DeferFunctions,
  ElementKeyMapper,
  StyledViewWithProps,
  SymbolIndexFunctions,
  useElementKeyMapper,
  useHorizontalAnimationDigits,
  useHorizontalAnimationWidths,
  useNegativeElementAnimationTimings,
  useNegativeElementAnimationVisibilities,
  useSymbolIndexFunctions,
  useTimeout,
  useVerticalAnimationDeferFunctions,
  useVerticalAnimationDigits,
} from './NumbersTransition.hooks';
import {
  AnimationPlaceholder,
  DecimalSeparator,
  Digit,
  DigitGroupSeparator,
  DigitProps,
  HorizontalAnimation,
  Invalid,
  Negative,
  NumbersTransitionExecutionContext,
  NumbersTransitionTheme,
  VerticalAnimation,
  VerticalAnimationProps,
} from './NumbersTransition.styles';
import { GenericReactNode, Nullable, OrArray } from './NumbersTransition.types';

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
  condition?: boolean;
  enclose?: (children: T) => ReactNode;
}

const Enclose = <T extends GenericReactNode<ChildrenProps>>({ children, enclose, condition = !!enclose }: EncloseProps<T>): ReactNode => (
  <Conditional condition={condition}>
    {(enclose ?? ((children: T): ReactNode => <>{children}</>))(children)}
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

interface DeferProps extends DeferFunctions {
  children: ReactElement<ChildrenProps>[];
  chunkSize: number;
}

const Defer: FC<DeferProps> = (props: DeferProps): ReactNode => {
  const { children, chunkSize, countElements, onBeforeMount, onPartialMount, onAfterMount }: DeferProps = props;

  const [mountedElements, setMountedElements]: [number, Dispatch<SetStateAction<number>>] = useState<number>(chunkSize);

  const countAggregatedSums = useCallback<(aggregatedSums: number[], child: ReactElement<ChildrenProps>) => number[]>(
    (aggregatedSums: number[], child: ReactElement<ChildrenProps>): number[] => [
      ...aggregatedSums,
      (aggregatedSums.at(Integer.MinusOne) ?? Integer.Zero) + countElements(child),
    ],
    [countElements],
  );

  const aggregatedSums = useMemo<number[]>(
    (): number[] => children.reduce<number[]>(countAggregatedSums, []),
    [children, countAggregatedSums],
  );

  const mapToFragmentElement: ElementKeyMapper<GenericReactNode<ChildrenProps>> = useElementKeyMapper<
    GenericReactNode<ChildrenProps>,
    FragmentProps
  >(Fragment);

  useEffect(
    (): void =>
      [(): unknown => requestAnimationFrame((): void => setMountedElements((previous: number): number => previous + chunkSize))]
        .filter((): boolean => mountedElements < aggregatedSums.at(Integer.MinusOne)!)
        .forEach((callback: () => unknown): unknown => callback()),
    [chunkSize, mountedElements, aggregatedSums],
  );

  const mapBeforeMount = (child: ReactElement<ChildrenProps>, numberOfElements: number): GenericReactNode<ChildrenProps> =>
    numberOfElements > Integer.Zero ? onPartialMount(child, numberOfElements ?? Integer.Zero) : onBeforeMount(child);

  const mapAfterMount = (child: ReactElement<ChildrenProps>, index: number): GenericReactNode<ChildrenProps> =>
    onAfterMount?.(child, index) ?? child;

  const mapChildren = (child: ReactElement<ChildrenProps>, index: number): GenericReactNode<ChildrenProps> =>
    aggregatedSums[index] > mountedElements
      ? mapBeforeMount(child, mountedElements - (aggregatedSums[index - Integer.One] ?? Integer.Zero))
      : mapAfterMount(child, index);

  return (
    <Conditional condition={mountedElements < aggregatedSums.at(Integer.MinusOne)! || !onAfterMount}>
      {children.map<GenericReactNode<ChildrenProps>>(mapChildren).map<ReactElement<ChildrenProps>>(mapToFragmentElement)}
      {children}
    </Conditional>
  );
};

interface InvalidElementProps<T extends object, U, V extends object, W> {
  invalidValue: string;
  symbolStyledView: StyledViewWithProps<Styled.Symbol, T, U>;
  invalidStyledView: StyledViewWithProps<Styled.Invalid, V, W>;
}

export const InvalidElement = <T extends object, U, V extends object, W>({
  invalidValue,
  symbolStyledView,
  invalidStyledView,
}: InvalidElementProps<T, U, V, W>): ReactNode => (
  <ThemeProvider theme={{ invalidIndex: Integer.Zero }}>
    <Invalid {...symbolStyledView} {...invalidStyledView}>
      {invalidValue}
    </Invalid>
  </ThemeProvider>
);

interface NegativeElementProps<T extends object, U, V extends object, W> {
  negativeCharacter: NegativeCharacter;
  visible?: boolean;
  symbolStyledView: StyledViewWithProps<Styled.Symbol, T, U>;
  negativeCharacterStyledView: StyledViewWithProps<Styled.Negative, V, W>;
}

export const NegativeElement = <T extends object, U, V extends object, W>({
  negativeCharacter,
  visible,
  symbolStyledView,
  negativeCharacterStyledView,
}: NegativeElementProps<T, U, V, W>): ReactNode => (
  <ThemeProvider theme={{ symbolIndex: Integer.Zero, negativeCharacterIndex: Integer.Zero }}>
    <Negative {...symbolStyledView} {...negativeCharacterStyledView} visible={visible}>
      {negativeCharacter}
    </Negative>
  </ThemeProvider>
);

interface HorizontalAnimationNegativeElementProps<T extends object, U, V extends object, W> {
  negativeCharacter: NegativeCharacter;
  symbolStyledView: StyledViewWithProps<Styled.Symbol, T, U>;
  negativeCharacterStyledView: StyledViewWithProps<Styled.Negative, V, W>;
}

const HorizontalAnimationNegativeElement = <T extends object, U, V extends object, W>(
  props: HorizontalAnimationNegativeElementProps<T, U, V, W>,
): ReactNode => <NegativeElement<T, U, V, W> {...props} visible={false} />;

interface VerticalAnimationNegativeElementProps<T extends object, U, V extends object, W> {
  negativeCharacter: NegativeCharacter;
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode;
  animationDigits: number[][];
  hasSignChanged: boolean;
  symbolStyledView: StyledViewWithProps<Styled.Symbol, T, U>;
  negativeCharacterStyledView: StyledViewWithProps<Styled.Negative, V, W>;
  enclose: (children: ReactElement<ChildrenProps>) => ReactNode;
}

const VerticalAnimationNegativeElement = <T extends object, U, V extends object, W>(
  props: VerticalAnimationNegativeElementProps<T, U, V, W>,
): ReactNode => {
  const {
    negativeCharacter,
    negativeCharacterAnimationMode,
    animationDigits,
    hasSignChanged,
    symbolStyledView,
    negativeCharacterStyledView,
    enclose,
  }: VerticalAnimationNegativeElementProps<T, U, V, W> = props;

  const { animationDirection }: NumbersTransitionTheme = useTheme();
  const animationVisibilities: boolean[] = useNegativeElementAnimationVisibilities({ animationDigits, hasSignChanged });

  const [animationSwitchTime, animationDelay]: [number, number] = useNegativeElementAnimationTimings({
    negativeCharacterAnimationMode,
    animationVisibilities,
  });

  const mapToThemeProviderElement: ElementKeyMapper<ReactElement<ChildrenProps>> = useElementKeyMapper<
    ReactElement<ChildrenProps>,
    NumbersTransitionExecutionContext
  >(
    ThemeProvider,
    (_: ReactElement<ChildrenProps>, rowIndex: number, { length }: ReactElement<ChildrenProps>[]): NumbersTransitionExecutionContext => ({
      theme: { columnLength: length, rowIndex },
    }),
  );

  const mapToNegativeElement: ElementKeyMapper<boolean> = useElementKeyMapper<boolean, NegativeElementProps<T, U, V, W>>(
    NegativeElement<T, U, V, W>,
    (visible: boolean): NegativeElementProps<T, U, V, W> => ({ negativeCharacter, visible, symbolStyledView, negativeCharacterStyledView }),
  );

  const negativeElements: ReactElement<ChildrenProps>[] = animationVisibilities
    .map<ReactElement<ChildrenProps>>(mapToNegativeElement)
    .map<ReactElement<ChildrenProps>>(mapToThemeProviderElement);

  const verticalAnimationElement: ReactElement<ChildrenProps> = (
    <ThemeProvider theme={{ columnLength: animationVisibilities.length }}>
      <VerticalAnimation {...(negativeCharacterAnimationMode === NegativeCharacterAnimationMode.Single && { animationDelay })}>
        <div>{negativeElements}</div>
      </VerticalAnimation>
    </ThemeProvider>
  );

  return (
    <Enclose<ReactElement<ChildrenProps>> enclose={enclose}>
      <Conditional condition={negativeCharacterAnimationMode === NegativeCharacterAnimationMode.Single}>
        <Switch time={animationSwitchTime} reverse={animationDirection === AnimationDirection.Reverse}>
          <NegativeElement<T, U, V, W>
            negativeCharacter={negativeCharacter}
            symbolStyledView={symbolStyledView}
            negativeCharacterStyledView={negativeCharacterStyledView}
          />
          {verticalAnimationElement}
        </Switch>
        {verticalAnimationElement}
      </Conditional>
    </Enclose>
  );
};

interface NumberElementProps<Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z> {
  precision: number;
  decimalSeparator: DecimalSeparatorCharacter;
  digitGroupSeparator: DigitGroupSeparatorCharacter;
  symbolStyledView: StyledViewWithProps<Styled.Symbol, Q, R>;
  digitStyledView: StyledViewWithProps<Styled.Digit, S, T>;
  separatorStyledView: StyledViewWithProps<Styled.Separator, U, V>;
  decimalSeparatorStyledView: StyledViewWithProps<Styled.DecimalSeparator, W, X>;
  digitGroupSeparatorStyledView: StyledViewWithProps<Styled.DigitGroupSeparator, Y, Z>;
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
    symbolStyledView,
    digitStyledView,
    separatorStyledView,
    decimalSeparatorStyledView,
    digitGroupSeparatorStyledView,
    mapToElement = [],
    children,
    enclose,
  }: NumberElementProps<Q, R, S, T, U, V, W, X, Y, Z> = props;

  const { getSymbolIndex, getCharacterSeparatorIndex, getSeparatorIndex, getDigitGroupSeparatorIndex }: SymbolIndexFunctions =
    useSymbolIndexFunctions(precision);

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
    ): NumbersTransitionExecutionContext => ({ theme: { symbolIndex: getSymbolIndex(digitIndex, length), digitIndex } }),
  );

  const mapToDigitsThemeProviderElement: ElementKeyMapper<ReactElement<ChildrenProps>> = useElementKeyMapper<
    ReactElement<ChildrenProps>,
    NumbersTransitionExecutionContext
  >(ThemeProvider, (_: ReactElement<ChildrenProps>, rowIndex: number): NumbersTransitionExecutionContext => ({ theme: { rowIndex } }));

  const mapToDigitElement: ElementKeyMapper<number> = useElementKeyMapper<number, DigitProps<Q, R, S, T>>(Digit, {
    ...symbolStyledView,
    ...digitStyledView,
  });

  const mapToDigitsElement = (numbers: number[]): ReactElement<ChildrenProps>[] =>
    numbers.map<ReactElement<ChildrenProps>>(mapToDigitElement).map<ReactElement<ChildrenProps>>(mapToDigitsThemeProviderElement);

  const getSeparatorTheme = (partialTheme: Partial<NumbersTransitionTheme>, index: number, length: number) => ({
    ...partialTheme,
    symbolIndex: getCharacterSeparatorIndex(index, length),
    separatorIndex: getSeparatorIndex(index, length),
  });

  const getDigitGroupSeparatorElement = (index: number, length: number): ReactElement<ChildrenProps> => (
    <ThemeProvider theme={getSeparatorTheme({ digitGroupSeparatorIndex: getDigitGroupSeparatorIndex(index, length) }, index, length)}>
      <DigitGroupSeparator {...symbolStyledView} {...separatorStyledView} {...digitGroupSeparatorStyledView}>
        {digitGroupSeparator}
      </DigitGroupSeparator>
    </ThemeProvider>
  );

  const getDecimalSeparatorElement = (index: number, length: number): ReactElement<ChildrenProps> => (
    <ThemeProvider theme={getSeparatorTheme({ decimalSeparatorIndex: Integer.Zero }, index, length)}>
      <DecimalSeparator {...symbolStyledView} {...separatorStyledView} {...decimalSeparatorStyledView}>
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
    ...(!!index && !((length - index - Math.max(precision, Integer.Zero)) % Integer.Three) ? [getSeparatorElement(index, length)] : []),
    currentValue,
  ];

  const mappedChildren: ReactElement<ChildrenProps>[] = Array.isOfDepth<number, Integer.One>(children, Integer.One)
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
  decimalSeparator: DecimalSeparatorCharacter;
  digitGroupSeparator: DigitGroupSeparatorCharacter;
  negativeCharacter: NegativeCharacter;
  animationTransition: AnimationTransition;
  previousValueDigits: number[];
  currentValueDigits: number[];
  previousValue: bigint;
  currentValue: bigint;
  minNumberOfDigits: number;
  maxNumberOfDigits: number;
  numberOfDigitsDifference: number;
  hasSignChanged: boolean;
  symbolStyledView: StyledViewWithProps<Styled.Symbol, O, P>;
  digitStyledView: StyledViewWithProps<Styled.Digit, Q, R>;
  separatorStyledView: StyledViewWithProps<Styled.Separator, S, T>;
  decimalSeparatorStyledView: StyledViewWithProps<Styled.DecimalSeparator, U, V>;
  digitGroupSeparatorStyledView: StyledViewWithProps<Styled.DigitGroupSeparator, W, X>;
  negativeCharacterStyledView: StyledViewWithProps<Styled.Negative, Y, Z>;
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
    symbolStyledView,
    negativeCharacterStyledView,
    ...restProps
  }: HorizontalAnimationElementProps<O, P, Q, R, S, T, U, V, W, X, Y, Z> = props;

  const ref: RefObject<Nullable<HTMLDivElement>> = useRef<HTMLDivElement>(null);
  const { numberOfAnimations }: NumbersTransitionTheme = useTheme();

  const animationDigits: number[] = useHorizontalAnimationDigits({
    animationTransition,
    previousValueDigits,
    currentValueDigits,
    previousValue,
    currentValue,
    numberOfDigitsDifference,
  });

  const [animationStartWidth, animationEndWidth]: [number, number] = useHorizontalAnimationWidths({
    precision,
    animationTransition,
    previousValue,
    currentValue,
    minNumberOfDigits,
    maxNumberOfDigits,
    ref,
  });

  const renderNegativeCharacter: boolean =
    hasSignChanged &&
    (numberOfAnimations === AnimationNumber.Two ||
      previousValue < currentValue === (animationTransition === AnimationTransition.SecondToThird));

  const negativeElement: ReactElement = (
    <Optional condition={renderNegativeCharacter}>
      <HorizontalAnimationNegativeElement<O, P, Y, Z>
        negativeCharacter={negativeCharacter}
        symbolStyledView={symbolStyledView}
        negativeCharacterStyledView={negativeCharacterStyledView}
      />
    </Optional>
  );

  const numberElement: ReactElement = (
    <NumberElement<O, P, Q, R, S, T, U, V, W, X> {...restProps} precision={precision} symbolStyledView={symbolStyledView}>
      {animationDigits}
    </NumberElement>
  );

  return (
    <HorizontalAnimation
      animationStartWidth={animationStartWidth}
      animationEndWidth={animationEndWidth}
      id={AnimationId.HorizontalAnimation}
    >
      <div ref={ref}>
        {negativeElement}
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
  decimalSeparator: DecimalSeparatorCharacter;
  digitGroupSeparator: DigitGroupSeparatorCharacter;
  negativeCharacter: NegativeCharacter;
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode;
  animationAlgorithm?: AnimationAlgorithm;
  optimizationStrategy?: OptimizationStrategy;
  deferChunkSize?: number;
  previousValue: bigint;
  currentValue: bigint;
  maxNumberOfDigits: number;
  hasSignChanged: boolean;
  symbolStyledView: StyledViewWithProps<Styled.Symbol, O, P>;
  digitStyledView: StyledViewWithProps<Styled.Digit, Q, R>;
  separatorStyledView: StyledViewWithProps<Styled.Separator, S, T>;
  decimalSeparatorStyledView: StyledViewWithProps<Styled.DecimalSeparator, U, V>;
  digitGroupSeparatorStyledView: StyledViewWithProps<Styled.DigitGroupSeparator, W, X>;
  negativeCharacterStyledView: StyledViewWithProps<Styled.Negative, Y, Z>;
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
    optimizationStrategy = OptimizationStrategy.None,
    deferChunkSize = Integer.TwoThousandFiveHundred,
    previousValue,
    currentValue,
    maxNumberOfDigits,
    hasSignChanged,
    symbolStyledView,
    negativeCharacterStyledView,
    ...restProps
  }: VerticalAnimationElementProps<O, P, Q, R, S, T, U, V, W, X, Y, Z> = props;

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
    HTMLAttributes<HTMLElement.Div>
  >(
    HTMLElement.Div,
    (_: ReactElement<ChildrenProps>, index: number, { length }: ReactElement<ChildrenProps>[]): HTMLAttributes<HTMLElement.Div> => ({
      ...(index === length - Integer.One && { id: AnimationId.VerticalAnimation }),
    }),
  );

  const { onAfterMount, ...restDeferFunctions }: DeferFunctions = useVerticalAnimationDeferFunctions({ Conditional, AnimationPlaceholder });

  const renderNegativeCharacter: boolean =
    hasSignChanged || (currentValue < Integer.Zero && negativeCharacterAnimationMode === NegativeCharacterAnimationMode.Multi);

  const encloseDefer = (children: ReactElement<ChildrenProps>[]): ReactNode => (
    <Defer
      chunkSize={deferChunkSize}
      {...restDeferFunctions}
      {...(optimizationStrategy === OptimizationStrategy.Delay && { onAfterMount })}
    >
      {children}
    </Defer>
  );

  const enclose = (children: ReactElement<ChildrenProps>[]): ReactNode => (
    <Enclose<ReactElement<ChildrenProps>[]> condition={optimizationStrategy !== OptimizationStrategy.None} enclose={encloseDefer}>
      {children}
    </Enclose>
  );

  const encloseNumber = (digits: ReactElement<ChildrenProps>[]): ReactNode => (
    <Conditional condition={renderNegativeCharacter}>
      <VerticalAnimationNegativeElement<O, P, Y, Z>
        negativeCharacter={negativeCharacter}
        negativeCharacterAnimationMode={negativeCharacterAnimationMode}
        animationDigits={animationDigits}
        hasSignChanged={hasSignChanged}
        symbolStyledView={symbolStyledView}
        negativeCharacterStyledView={negativeCharacterStyledView}
        enclose={(negative: ReactElement<ChildrenProps>): ReactNode => enclose([negative, ...digits])}
      />
      {enclose(digits)}
    </Conditional>
  );

  return (
    <NumberElement<O, P, Q, R, S, T, U, V, W, X>
      {...restProps}
      symbolStyledView={symbolStyledView}
      mapToElement={[mapToDivElement, mapToVerticalAnimationElement, mapToThemeProviderElement]}
      enclose={encloseNumber}
    >
      {animationDigits}
    </NumberElement>
  );
};
