import {
  FC,
  Fragment,
  FragmentProps,
  HTMLAttributes,
  RefObject,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ThemeProvider, ThemeProviderProps, useTheme } from 'styled-components';
import type { Nullable, Optional, OrArray, OrFunction, ReactElement, ReactNode, ReactState, Tuple } from './NumbersTransition.types';
import {
  AnimationDirection,
  AnimationId,
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
  CharacterIndexFunction,
  CharacterIndexFunctions,
  ElementKeyMapper,
  StyledViewWithProps,
  useCharacterIndexFunctions,
  useElementKeyMapper,
  useHorizontalAnimationDigits,
  useHorizontalAnimationWidths,
  useNegativeElementAnimationTimingFunction,
  useNegativeElementAnimationVisibilities,
  useRenderHorizontalAnimationNegativeElement,
  useRenderVerticalAnimationNegativeElement,
  useVerticalAnimationDigits,
} from './NumbersTransition.hooks';
import {
  AnimationPlaceholder,
  DecimalSeparator,
  Digit,
  DigitGroupSeparator,
  DigitProps,
  EasingFunction,
  HorizontalAnimation,
  Invalid,
  Negative,
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

interface ShowProps {
  children: ReactNode;
  condition: boolean;
}

export const Show: FC<ShowProps> = ({ children, condition }: ShowProps): ReactNode => (
  <Conditional condition={condition}>
    {children}
    {undefined}
  </Conditional>
);

interface EncloseProps<T extends ReactNode> {
  children: T;
  condition?: OrFunction<[T], boolean>;
  enclose?: (children: T) => ReactNode;
}

const Enclose = <T extends ReactNode>({ children, enclose, condition = !!enclose }: EncloseProps<T>): ReactNode => (
  <Conditional condition={condition.callOrGet<[T], boolean>(children)}>
    {(enclose ?? ((children: T): ReactNode => <>{children}</>))(children)}
    {children}
  </Conditional>
);

interface DeferProps {
  children: ReactElement[];
  renderBatchSize: number;
  countElements: (child: ReactElement) => number;
  onBeforeMount: (child: ReactElement, index: number) => ReactNode;
  onPartialMount: (child: ReactElement, index: number, elementsToMount: number) => ReactNode;
  onAfterMount?: (child: ReactElement, index: number) => ReactNode;
}

const Defer: FC<DeferProps> = (props: DeferProps): ReactNode => {
  const { children, renderBatchSize, countElements, onBeforeMount, onPartialMount, onAfterMount }: DeferProps = props;

  const [mountedElements, setMountedElements]: ReactState<number> = useState<number>(renderBatchSize);

  const countAggregatedSums = useCallback<(sums: number[], child: ReactElement) => number[]>(
    (sums: number[], child: ReactElement): number[] => [...sums, (sums.last() ?? Integer.Zero) + countElements(child)],
    [countElements],
  );

  const aggregatedSums: number[] = useMemo<number[]>(
    (): number[] => children.reduce<number[]>(countAggregatedSums, []),
    [children, countAggregatedSums],
  );

  const mapToFragmentElement: ElementKeyMapper<ReactNode> = useElementKeyMapper<ReactNode, FragmentProps>(Fragment);

  useEffect(
    (): void =>
      requestAnimationFrame
        .bind<(callback: FrameRequestCallback) => number>(window)
        .invokeWhen<(callback: FrameRequestCallback) => number>(mountedElements < aggregatedSums.last(), (): void =>
          setMountedElements((previous: number): number => previous + renderBatchSize),
        ),
    [renderBatchSize, mountedElements, aggregatedSums],
  );

  const mapBeforeMount = (child: ReactElement, index: number, numberOfElements: number): ReactNode =>
    numberOfElements > Integer.Zero ? onPartialMount(child, index, numberOfElements ?? Integer.Zero) : onBeforeMount(child, index);

  const mapAfterMount = (child: ReactElement, index: number): ReactNode => onAfterMount?.(child, index) ?? child;

  const mapChildren = (child: ReactElement, index: number): ReactNode =>
    aggregatedSums[index] > mountedElements
      ? mapBeforeMount(child, index, mountedElements - (aggregatedSums[index - Integer.One] ?? Integer.Zero))
      : mapAfterMount(child, index);

  return (
    <Conditional condition={mountedElements < aggregatedSums.last() || !onAfterMount}>
      {children.mapEach<ReactNode>(mapChildren, mapToFragmentElement)}
      {children}
    </Conditional>
  );
};

interface InvalidElementProps<T extends object, U, V extends object, W> {
  invalidValue: string;
  characterStyledView: StyledViewWithProps<Styled.Character, T, U>;
  invalidStyledView: StyledViewWithProps<Styled.Invalid, V, W>;
}

export const InvalidElement = <T extends object, U, V extends object, W>({
  invalidValue,
  characterStyledView,
  invalidStyledView,
}: InvalidElementProps<T, U, V, W>): ReactNode => (
  <ThemeProvider theme={{ invalidIndex: Integer.Zero }}>
    <Invalid {...characterStyledView} {...invalidStyledView}>
      {invalidValue}
    </Invalid>
  </ThemeProvider>
);

interface DecimalSeparatorElementProps<T extends object, U, V extends object, W, X extends object, Y> {
  decimalSeparator: DecimalSeparatorCharacter;
  characterStyledView: StyledViewWithProps<Styled.Character, T, U>;
  separatorStyledView: StyledViewWithProps<Styled.Separator, V, W>;
  decimalSeparatorStyledView: StyledViewWithProps<Styled.DecimalSeparator, X, Y>;
}

const DecimalSeparatorElement = <T extends object, U, V extends object, W, X extends object, Y>({
  decimalSeparator,
  characterStyledView,
  separatorStyledView,
  decimalSeparatorStyledView,
}: DecimalSeparatorElementProps<T, U, V, W, X, Y>): ReactNode => (
  <ThemeProvider theme={{ decimalSeparatorIndex: Integer.Zero }}>
    <DecimalSeparator {...characterStyledView} {...separatorStyledView} {...decimalSeparatorStyledView}>
      {decimalSeparator}
    </DecimalSeparator>
  </ThemeProvider>
);

interface DigitGroupSeparatorElementProps<T extends object, U, V extends object, W, X extends object, Y> {
  digitGroupSeparator: DigitGroupSeparatorCharacter;
  characterStyledView: StyledViewWithProps<Styled.Character, T, U>;
  separatorStyledView: StyledViewWithProps<Styled.Separator, V, W>;
  digitGroupSeparatorStyledView: StyledViewWithProps<Styled.DigitGroupSeparator, X, Y>;
  digitGroupSeparatorIndex: number;
}

const DigitGroupSeparatorElement = <T extends object, U, V extends object, W, X extends object, Y>({
  digitGroupSeparator,
  characterStyledView,
  separatorStyledView,
  digitGroupSeparatorStyledView,
  digitGroupSeparatorIndex,
}: DigitGroupSeparatorElementProps<T, U, V, W, X, Y>): ReactNode => (
  <ThemeProvider theme={{ digitGroupSeparatorIndex }}>
    <DigitGroupSeparator {...characterStyledView} {...separatorStyledView} {...digitGroupSeparatorStyledView}>
      {digitGroupSeparator}
    </DigitGroupSeparator>
  </ThemeProvider>
);

interface SeparatorProps<S extends object, T, U extends object, V, W extends object, X, Y extends object, Z> {
  precision: number;
  digitGroupSeparator: DigitGroupSeparatorCharacter;
  decimalSeparator: DecimalSeparatorCharacter;
  characterStyledView: StyledViewWithProps<Styled.Character, S, T>;
  separatorStyledView: StyledViewWithProps<Styled.Separator, U, V>;
  decimalSeparatorStyledView: StyledViewWithProps<Styled.DecimalSeparator, W, X>;
  digitGroupSeparatorStyledView: StyledViewWithProps<Styled.DigitGroupSeparator, Y, Z>;
}

// prettier-ignore
interface SeparatorElementProps<S extends object, T, U extends object, V, W extends object, X, Y extends object, Z> extends SeparatorProps<S, T, U, V, W, X, Y, Z> {
  getCharacterSeparatorIndex: CharacterIndexFunction;
  getSeparatorIndex: CharacterIndexFunction;
  getDigitGroupSeparatorIndex: CharacterIndexFunction;
  digitIndex: number;
  numberLength: number;
}

const SeparatorElement = <S extends object, T, U extends object, V, W extends object, X, Y extends object, Z>(
  props: SeparatorElementProps<S, T, U, V, W, X, Y, Z>,
): ReactNode => {
  const {
    precision,
    digitGroupSeparator,
    decimalSeparator,
    decimalSeparatorStyledView,
    digitGroupSeparatorStyledView,
    getCharacterSeparatorIndex,
    getSeparatorIndex,
    getDigitGroupSeparatorIndex,
    digitIndex,
    numberLength,
    ...restProps
  }: SeparatorElementProps<S, T, U, V, W, X, Y, Z> = props;

  const separatorTheme: Partial<NumbersTransitionTheme> = {
    characterIndex: getCharacterSeparatorIndex(digitIndex, numberLength),
    separatorIndex: getSeparatorIndex(digitIndex, numberLength),
  };

  const decimalSeparatorElement: ReactElement = (
    <DecimalSeparatorElement<S, T, U, V, W, X>
      {...restProps}
      decimalSeparator={decimalSeparator}
      decimalSeparatorStyledView={decimalSeparatorStyledView}
    />
  );

  const digitGroupSeparatorElement: ReactElement = (
    <Show condition={digitGroupSeparator !== DigitGroupSeparatorCharacter.None}>
      <DigitGroupSeparatorElement<S, T, U, V, Y, Z>
        {...restProps}
        digitGroupSeparator={digitGroupSeparator}
        digitGroupSeparatorStyledView={digitGroupSeparatorStyledView}
        digitGroupSeparatorIndex={getDigitGroupSeparatorIndex(digitIndex, numberLength)}
      />
    </Show>
  );

  return (
    <ThemeProvider theme={separatorTheme}>
      <Conditional condition={numberLength - digitIndex === precision}>
        {decimalSeparatorElement}
        {digitGroupSeparatorElement}
      </Conditional>
    </ThemeProvider>
  );
};

export interface NegativeProps<T extends object, U> {
  negativeCharacter: NegativeCharacter;
  negativeCharacterStyledView: StyledViewWithProps<Styled.Negative, T, U>;
}

interface NegativeElementProps<T extends object, U, V extends object, W> extends NegativeProps<V, W> {
  characterStyledView: StyledViewWithProps<Styled.Character, T, U>;
  visible?: boolean;
}

export const NegativeElement = <T extends object, U, V extends object, W>({
  negativeCharacter,
  visible,
  characterStyledView,
  negativeCharacterStyledView,
}: NegativeElementProps<T, U, V, W>): ReactNode => (
  <ThemeProvider theme={{ characterIndex: Integer.Zero, negativeCharacterIndex: Integer.Zero }}>
    <Negative {...characterStyledView} {...negativeCharacterStyledView} visible={visible}>
      {negativeCharacter}
    </Negative>
  </ThemeProvider>
);

interface HorizontalAnimationNegativeElementProps<T extends object, U, V extends object, W> extends NegativeProps<V, W> {
  characterStyledView: StyledViewWithProps<Styled.Character, T, U>;
}

const HorizontalAnimationNegativeElement = <T extends object, U, V extends object, W>(
  props: HorizontalAnimationNegativeElementProps<T, U, V, W>,
): ReactNode => <NegativeElement<T, U, V, W> {...props} visible={false} />;

interface VerticalAnimationNegativeElementProps<T extends object, U, V extends object, W> extends NegativeProps<V, W> {
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode;
  animationDigits: number[][];
  hasSignChanged: boolean;
  characterStyledView: StyledViewWithProps<Styled.Character, T, U>;
  enclose: (children: ReactElement) => ReactNode;
}

const VerticalAnimationNegativeElement = <T extends object, U, V extends object, W>(
  props: VerticalAnimationNegativeElementProps<T, U, V, W>,
): ReactNode => {
  const {
    negativeCharacter,
    negativeCharacterAnimationMode,
    animationDigits,
    hasSignChanged,
    characterStyledView,
    negativeCharacterStyledView,
    enclose,
  }: VerticalAnimationNegativeElementProps<T, U, V, W> = props;

  const theme: NumbersTransitionTheme = useTheme();
  const animationVisibilities: boolean[] = useNegativeElementAnimationVisibilities({ animationDigits, hasSignChanged });
  const animationTimingFunction: EasingFunction = useNegativeElementAnimationTimingFunction({
    negativeCharacterAnimationMode,
    animationVisibilities,
  });

  const mapToThemeProviderElement: ElementKeyMapper<ReactElement> = useElementKeyMapper<ReactElement, ThemeProviderProps>(
    ThemeProvider,
    (_: ReactElement, rowIndex: number): ThemeProviderProps => ({ theme: { rowIndex } }),
  );

  // prettier-ignore
  const mapToNegativeElement: ElementKeyMapper<boolean> = useElementKeyMapper<boolean, NegativeElementProps<T, U, V, W>>(
    NegativeElement<T, U, V, W>,
    (visible: boolean): NegativeElementProps<T, U, V, W> => ({ negativeCharacter, characterStyledView, negativeCharacterStyledView, visible }),
  );

  const encloseAnimation = (animation: ReactElement): ReactNode => (
    <VerticalAnimation theme={{ ...theme, animationTimingFunction, columnLength: Integer.Three }}>
      <div>{[true, false].map<ReactNode>(mapToNegativeElement).insert(Integer.One, animation)}</div>
    </VerticalAnimation>
  );

  return (
    <Enclose<ReactElement> enclose={enclose}>
      <Enclose<ReactElement>
        condition={negativeCharacterAnimationMode === NegativeCharacterAnimationMode.Single}
        enclose={encloseAnimation}
      >
        <ThemeProvider theme={{ columnLength: animationVisibilities.length }}>
          <VerticalAnimation>
            <div>{animationVisibilities.mapEach<ReactElement>(mapToNegativeElement, mapToThemeProviderElement)}</div>
          </VerticalAnimation>
        </ThemeProvider>
      </Enclose>
    </Enclose>
  );
};

export interface NumberProps<
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
> extends SeparatorProps<Q, R, U, V, W, X, Y, Z> {
  digitStyledView: StyledViewWithProps<Styled.Digit, S, T>;
}

interface NumberElementProps<
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
> extends NumberProps<Q, R, S, T, U, V, W, X, Y, Z> {
  mapToElement?: ElementKeyMapper<ReactElement>[];
  children: OrArray<number[]>;
  enclose?: (children: ReactElement[]) => ReactNode;
}

export const NumberElement = <Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z>(
  props: NumberElementProps<Q, R, S, T, U, V, W, X, Y, Z>,
): ReactNode => {
  const {
    precision,
    digitGroupSeparator,
    characterStyledView,
    digitStyledView,
    mapToElement = [],
    children,
    enclose,
    ...restProps
  }: NumberElementProps<Q, R, S, T, U, V, W, X, Y, Z> = props;

  const mapToFragmentElement: ElementKeyMapper<ReactElement> = useElementKeyMapper<ReactElement, FragmentProps>(Fragment);

  const { getCharacterIndex, ...restIndexFunctions }: CharacterIndexFunctions = useCharacterIndexFunctions({
    precision,
    digitGroupSeparator,
  });

  // prettier-ignore
  const mapToDigitThemeProviderElement: ElementKeyMapper<OrArray<ReactElement>> = useElementKeyMapper<OrArray<ReactElement>, ThemeProviderProps>(
    ThemeProvider,
    (_: OrArray<ReactElement>, digitIndex: number, { length }: OrArray<ReactElement>[]): ThemeProviderProps => ({
    theme: { characterIndex: getCharacterIndex(digitIndex, length), digitIndex },
  }),
);

  const mapToDigitsThemeProviderElement: ElementKeyMapper<ReactElement> = useElementKeyMapper<ReactElement, ThemeProviderProps>(
    ThemeProvider,
    (_: ReactElement, rowIndex: number): ThemeProviderProps => ({ theme: { rowIndex } }),
  );

  const mapToDigitElement: ElementKeyMapper<number> = useElementKeyMapper<number, DigitProps<Q, R, S, T>>(Digit, {
    ...characterStyledView,
    ...digitStyledView,
  });

  const mapToDigitsElement = (numbers: number[]): ReactElement[] =>
    numbers.mapEach<ReactElement>(mapToDigitElement, mapToDigitsThemeProviderElement);

  const mapToNumber = (value: ReactElement, index: number, { length }: ReactElement[]): ReactElement[] => [
    <Show condition={!!index && !((length - index - Math.max(precision, Integer.Zero)) % Integer.Three)}>
      <SeparatorElement<Q, R, U, V, W, X, Y, Z>
        {...restProps}
        {...restIndexFunctions}
        precision={precision}
        digitGroupSeparator={digitGroupSeparator}
        characterStyledView={characterStyledView}
        digitIndex={index}
        numberLength={length}
      />
    </Show>,
    value,
  ];

  const mappedChildren: ReactElement[] = Array.isOfDepth<number, Integer.One>(children, Integer.One)
    ? children.mapEach<ReactElement>(mapToDigitElement, mapToDigitThemeProviderElement)
    : children.mapEach<[ReactElement[], ReactElement]>(mapToDigitsElement, mapToDigitThemeProviderElement);

  const number: ReactElement[] = mappedChildren
    .mapEach(...mapToElement)
    .flatMap<ReactElement>(mapToNumber)
    .map<ReactElement>(mapToFragmentElement);

  return <Enclose<ReactElement[]> enclose={enclose}>{number}</Enclose>;
};

export interface AnimationProps<
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
>
  extends NegativeProps<Y, Z>, NumberProps<O, P, Q, R, S, T, U, V, W, X> {
  identifier: string;
  previousValue: bigint;
  currentValue: bigint;
  maxNumberOfDigits: number;
  hasSignChanged: boolean;
}

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
> extends AnimationProps<O, P, Q, R, S, T, U, V, W, X, Y, Z> {
  animationTransition: AnimationTransition;
  previousValueDigits: number[];
  currentValueDigits: number[];
  minNumberOfDigits: number;
  numberOfDigitsDifference: number;
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
    identifier,
    precision,
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
    negativeCharacterStyledView,
    ...restProps
  }: HorizontalAnimationElementProps<O, P, Q, R, S, T, U, V, W, X, Y, Z> = props;

  const id: string = `${AnimationId.HorizontalAnimation}${identifier}`;
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
    digitGroupSeparator,
    animationTransition,
    previousValue,
    currentValue,
    minNumberOfDigits,
    maxNumberOfDigits,
    ref,
  });

  const renderNegativeElement: boolean = useRenderHorizontalAnimationNegativeElement({
    animationTransition,
    previousValue,
    currentValue,
    hasSignChanged,
    numberOfAnimations,
  });

  const negativeElement: ReactElement = (
    <Show condition={renderNegativeElement}>
      <HorizontalAnimationNegativeElement<O, P, Y, Z>
        negativeCharacter={negativeCharacter}
        characterStyledView={characterStyledView}
        negativeCharacterStyledView={negativeCharacterStyledView}
      />
    </Show>
  );

  const numberElement: ReactElement = (
    <NumberElement<O, P, Q, R, S, T, U, V, W, X>
      {...restProps}
      precision={precision}
      digitGroupSeparator={digitGroupSeparator}
      characterStyledView={characterStyledView}
    >
      {animationDigits}
    </NumberElement>
  );

  return (
    <HorizontalAnimation animationStartWidth={animationStartWidth} animationEndWidth={animationEndWidth} id={id}>
      <div ref={ref}>
        {negativeElement}
        {numberElement}
      </div>
    </HorizontalAnimation>
  );
};
export interface VerticalAnimationElementProps<
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
> extends AnimationProps<O, P, Q, R, S, T, U, V, W, X, Y, Z> {
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode;
  animationAlgorithm?: AnimationAlgorithm;
  optimizationStrategy?: OptimizationStrategy;
  renderBatchSize?: number;
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
    identifier,
    negativeCharacter,
    negativeCharacterAnimationMode,
    animationAlgorithm,
    optimizationStrategy = OptimizationStrategy.None,
    renderBatchSize = Integer.TwoThousandFiveHundred,
    previousValue,
    currentValue,
    maxNumberOfDigits,
    hasSignChanged,
    characterStyledView,
    negativeCharacterStyledView,
    ...restProps
  }: VerticalAnimationElementProps<O, P, Q, R, S, T, U, V, W, X, Y, Z> = props;

  const id: string = `${AnimationId.VerticalAnimation}${identifier}`;
  const { animationDirection }: NumbersTransitionTheme = useTheme();
  const animationDigits: number[][] = useVerticalAnimationDigits({ animationAlgorithm, maxNumberOfDigits, previousValue, currentValue });

  const mapToThemeProviderElement: ElementKeyMapper<ReactElement> = useElementKeyMapper<ReactElement, ThemeProviderProps>(
    ThemeProvider,
    (_: ReactElement, index: number): ThemeProviderProps => ({ theme: { columnLength: animationDigits[index].length } }),
  );

  const mapToVerticalAnimationElement: ElementKeyMapper<ReactElement> = useElementKeyMapper<ReactElement, VerticalAnimationProps>(
    VerticalAnimation,
  );

  const mapToDivElement: ElementKeyMapper<ReactElement> = useElementKeyMapper<ReactElement, HTMLAttributes<HTMLElement.Div>>(
    HTMLElement.Div,
    (_: ReactElement, index: number, { length }: ReactElement[]): HTMLAttributes<HTMLElement.Div> => ({
      ...(index === length - Integer.One && { id }),
    }),
  );

  const renderNegativeElement: boolean = useRenderVerticalAnimationNegativeElement({
    negativeCharacterAnimationMode,
    currentValue,
    hasSignChanged,
  });

  const getLastNestedElement = (child: ReactElement): ReactElement =>
    isValidElement(child?.props?.children) ? getLastNestedElement(child?.props?.children) : child;

  const getLastNestedOptionalElement = (child: ReactNode): Optional<ReactElement> =>
    isValidElement(child) ? getLastNestedElement(child) : undefined;

  const countElements = (child: ReactElement): number => Array.toArray<ReactNode>(getLastNestedElement(child).props.children).length;

  const onElementMountCondition = ({ props: { children } }: ReactElement): boolean => Array.isArray<ReactNode>(children);

  const onElementMountEnclose = <T extends unknown[]>(
    factory: (...args: [ReactNode[], ...T]) => ReactNode,
    args: T,
    { props: { children } }: ReactElement,
  ): ReactNode => factory(Array.toArray<ReactNode>(children), ...args);

  // prettier-ignore
  const onElementMount = <T extends unknown[] = []>(factory: (...args: [ReactNode[], ...T]) => ReactNode, child: ReactElement, index: number, ...args: T): ReactNode => (
    <Enclose<ReactElement>
      condition={onElementMountCondition}
      enclose={onElementMountEnclose.bindArgs<(...args: [(...args: [ReactNode[], ...T]) => ReactNode, T, ReactElement]) => ReactNode, Integer.Two>(factory, args)}
    >
      {(index + renderNegativeElement.int) % Integer.Two ? getLastNestedElement(child) : child}
    </Enclose>
  );

  const onBeforeElementMount = (children: ReactNode[]): ReactNode =>
    animationDirection === AnimationDirection.Normal ? children.first() : children.last();

  const onPartialElementMount = (children: ReactNode[], numberOfElements: number): ReactNode => (
    <AnimationPlaceholder>
      {children.slice(...(animationDirection === AnimationDirection.Normal ? [Integer.Zero, numberOfElements] : [-numberOfElements]))}
    </AnimationPlaceholder>
  );

  const onAfterElementMount = (children: ReactNode[]): ReactNode => <AnimationPlaceholder>{children}</AnimationPlaceholder>;

  const onAfterMountMapper = (at: number, child?: ReactElement): ReactNode => Array.toArray<ReactNode>(child?.props.children).at(at);

  const onAfterMountReducer = (
    accumulatedCallback: (child?: ReactElement) => ReactNode,
    callback: (child?: ReactElement) => ReactNode,
    child?: ReactElement,
  ): ReactNode => callback(getLastNestedOptionalElement(accumulatedCallback(child)));

  // prettier-ignore
  const onAfterMountFunction: (child?: ReactElement) => ReactNode = [
    Integer.One,
    animationDirection === AnimationDirection.Normal ? Integer.Zero : Integer.MinusOne,
  ]
    .map<(child?: ReactElement) => ReactNode>(onAfterMountMapper.splitArgs<(...args: [number, ReactElement?]) => ReactNode, Integer.One>(Integer.One))
    .reduce(onAfterMountReducer.splitArgs<(...args: [...Tuple<(child?: ReactElement) => ReactNode, Integer.Two>, ReactElement?]) => ReactNode, Integer.Two>(Integer.Two));

  const onAfterMount = (child: ReactElement, index: number): ReactNode => (
    <Conditional condition={!index && child === getLastNestedElement(child)}>
      {onAfterMountFunction(child)}
      {onElementMount<[]>(onAfterElementMount, child, index)}
    </Conditional>
  );

  // prettier-ignore
  const encloseDefer = (children: ReactElement[]): ReactNode => (
    <Defer
      renderBatchSize={renderBatchSize}
      countElements={countElements}
      onBeforeMount={onElementMount.bindArgs<(...args: [(children: ReactNode[]) => ReactNode, ReactElement, number]) => ReactNode, Integer.One>(onBeforeElementMount)}
      onPartialMount={onElementMount.bindArgs<(...args: [(...args: [ReactNode[], number]) => ReactNode, ReactElement, number, number]) => ReactNode, Integer.One>(onPartialElementMount)}
      {...(optimizationStrategy === OptimizationStrategy.Batch && { onAfterMount })}
    >
      {children}
    </Defer>
  );

  const enclose = (children: ReactElement[]): ReactNode => (
    <Enclose<ReactElement[]> condition={optimizationStrategy !== OptimizationStrategy.None} enclose={encloseDefer}>
      {children}
    </Enclose>
  );

  const encloseNumber = (digits: ReactElement[]): ReactNode => (
    <Conditional condition={renderNegativeElement}>
      <VerticalAnimationNegativeElement<O, P, Y, Z>
        negativeCharacter={negativeCharacter}
        negativeCharacterAnimationMode={negativeCharacterAnimationMode}
        animationDigits={animationDigits}
        hasSignChanged={hasSignChanged}
        characterStyledView={characterStyledView}
        negativeCharacterStyledView={negativeCharacterStyledView}
        enclose={(negative: ReactElement): ReactNode => enclose([negative, ...digits])}
      />
      {enclose(digits)}
    </Conditional>
  );

  return (
    <NumberElement<O, P, Q, R, S, T, U, V, W, X>
      {...restProps}
      characterStyledView={characterStyledView}
      mapToElement={[mapToDivElement, mapToVerticalAnimationElement, mapToThemeProviderElement]}
      enclose={encloseNumber}
    >
      {animationDigits}
    </NumberElement>
  );
};
