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
  CharacterIndexFunctions,
  ChildrenProps,
  ElementKeyMapper,
  StyledViewWithProps,
  useCharacterIndexFunctions,
  useElementKeyMapper,
  useHorizontalAnimationDigits,
  useHorizontalAnimationWidths,
  useNegativeElementAnimationTimingFunction,
  useNegativeElementAnimationVisibilities,
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

interface DeferProps {
  children: ReactElement<ChildrenProps>[];
  chunkSize: number;
  countElements: (child: ReactElement<ChildrenProps>) => number;
  onBeforeMount: (child: ReactElement<ChildrenProps>) => GenericReactNode<ChildrenProps>;
  onPartialMount: (child: ReactElement<ChildrenProps>, elementsToMount: number) => GenericReactNode<ChildrenProps>;
  onAfterMount?: (child: ReactElement<ChildrenProps>, index: number) => GenericReactNode<ChildrenProps>;
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

  // prettier-ignore
  useEffect(
    (): void => [(): unknown => requestAnimationFrame((): void => setMountedElements((previous: number): number => previous + chunkSize))]
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

interface NegativeElementProps<T extends object, U, V extends object, W> {
  negativeCharacter: NegativeCharacter;
  visible?: boolean;
  characterStyledView: StyledViewWithProps<Styled.Character, T, U>;
  negativeCharacterStyledView: StyledViewWithProps<Styled.Negative, V, W>;
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

interface HorizontalAnimationNegativeElementProps<T extends object, U, V extends object, W> {
  negativeCharacter: NegativeCharacter;
  characterStyledView: StyledViewWithProps<Styled.Character, T, U>;
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
  characterStyledView: StyledViewWithProps<Styled.Character, T, U>;
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

  const mapToThemeProviderElement: ElementKeyMapper<ReactElement<ChildrenProps>> = useElementKeyMapper<
    ReactElement<ChildrenProps>,
    NumbersTransitionExecutionContext
  >(ThemeProvider, (_: ReactElement<ChildrenProps>, rowIndex: number): NumbersTransitionExecutionContext => ({ theme: { rowIndex } }));

  const mapToNegativeElement: ElementKeyMapper<boolean> = useElementKeyMapper<boolean, NegativeElementProps<T, U, V, W>>(
    NegativeElement<T, U, V, W>,
    (visible: boolean): NegativeElementProps<T, U, V, W> => ({
      negativeCharacter,
      visible,
      characterStyledView,
      negativeCharacterStyledView,
    }),
  );

  const negativeElements: ReactElement<ChildrenProps>[] = animationVisibilities
    .map<ReactElement<ChildrenProps>>(mapToNegativeElement)
    .map<ReactElement<ChildrenProps>>(mapToThemeProviderElement);

  const verticalAnimationElement: ReactElement<ChildrenProps> = (
    <ThemeProvider theme={{ columnLength: animationVisibilities.length }}>
      <VerticalAnimation>
        <div>{negativeElements}</div>
      </VerticalAnimation>
    </ThemeProvider>
  );

  return (
    <Enclose<ReactElement<ChildrenProps>> enclose={enclose}>
      <Conditional condition={negativeCharacterAnimationMode === NegativeCharacterAnimationMode.Single}>
        <VerticalAnimation theme={{ ...theme, animationTimingFunction, columnLength: Integer.Two }}>
          <div>
            <NegativeElement<T, U, V, W>
              negativeCharacter={negativeCharacter}
              characterStyledView={characterStyledView}
              negativeCharacterStyledView={negativeCharacterStyledView}
            />
            {verticalAnimationElement}
          </div>
        </VerticalAnimation>
        {verticalAnimationElement}
      </Conditional>
    </Enclose>
  );
};

interface NumberElementProps<Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z> {
  precision: number;
  decimalSeparator: DecimalSeparatorCharacter;
  digitGroupSeparator: DigitGroupSeparatorCharacter;
  characterStyledView: StyledViewWithProps<Styled.Character, Q, R>;
  digitStyledView: StyledViewWithProps<Styled.Digit, S, T>;
  separatorStyledView: StyledViewWithProps<Styled.Separator, U, V>;
  decimalSeparatorStyledView: StyledViewWithProps<Styled.DecimalSeparator, W, X>;
  digitGroupSeparatorStyledView: StyledViewWithProps<Styled.DigitGroupSeparator, Y, Z>;
  mapToElement?: ElementKeyMapper<ReactElement<ChildrenProps>>[];
  children: OrArray<number[]>;
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

  const getSeparatorTheme = (partialTheme: Partial<NumbersTransitionTheme>, index: number, length: number): NumbersTransitionTheme => ({
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
    <ThemeProvider theme={getSeparatorTheme({ decimalSeparatorIndex: Integer.Zero }, index, length)}>
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
  characterStyledView: StyledViewWithProps<Styled.Character, O, P>;
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
    characterStyledView,
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
        characterStyledView={characterStyledView}
        negativeCharacterStyledView={negativeCharacterStyledView}
      />
    </Optional>
  );

  const numberElement: ReactElement = (
    <NumberElement<O, P, Q, R, S, T, U, V, W, X> {...restProps} precision={precision} characterStyledView={characterStyledView}>
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
  characterStyledView: StyledViewWithProps<Styled.Character, O, P>;
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
    characterStyledView,
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
    HTMLAttributes<HTMLElement.Div>
  >(
    HTMLElement.Div,
    (_: ReactElement<ChildrenProps>, index: number, { length }: ReactElement<ChildrenProps>[]): HTMLAttributes<HTMLElement.Div> => ({
      ...(index === length - Integer.One && { id: AnimationId.VerticalAnimation }),
    }),
  );

  const renderNegativeCharacter: boolean =
    hasSignChanged || (currentValue < Integer.Zero && negativeCharacterAnimationMode === NegativeCharacterAnimationMode.Multi);

  const getLastNestedElement = (child: ReactElement<ChildrenProps>): ReactElement<ChildrenProps> =>
    isValidElement(child?.props?.children) ? getLastNestedElement(child?.props?.children) : child;

  const getLastNestedNullableElement = (child: GenericReactNode<ChildrenProps>): Nullable<ReactElement<ChildrenProps>> =>
    isValidElement(child) ? getLastNestedElement(child) : null;

  const countElements = (child: ReactElement<ChildrenProps>): number => {
    // prettier-ignore
    const { props: { children } }: ReactElement<ChildrenProps> = getLastNestedElement(child);

    return Array.isArray<GenericReactNode<ChildrenProps>>(children) ? children.length : Integer.One;
  };

  const onElementMount = (
    child: ReactElement<ChildrenProps>,
    fromArray: (array: GenericReactNode<ChildrenProps>[]) => GenericReactNode<ChildrenProps>,
  ): GenericReactNode<ChildrenProps> => {
    const element: ReactElement<ChildrenProps> = getLastNestedElement(child);
    // prettier-ignore
    const { props: { children } }: ReactElement<ChildrenProps> = element;

    return (
      <Conditional condition={Array.isArray<GenericReactNode<ChildrenProps>>(children)}>
        {fromArray(Array.toArray<GenericReactNode<ChildrenProps>>(children))}
        {element}
      </Conditional>
    );
  };

  const onBeforeMount = (child: ReactElement<ChildrenProps>): GenericReactNode<ChildrenProps> =>
    onElementMount(
      child,
      (array: GenericReactNode<ChildrenProps>[]): GenericReactNode<ChildrenProps> =>
        array.at(animationDirection === AnimationDirection.Normal ? Integer.Zero : Integer.MinusOne),
    );

  const onPartialMount = (child: ReactElement<ChildrenProps>, numberOfElements: number): GenericReactNode<ChildrenProps> =>
    onElementMount(
      child,
      (array: GenericReactNode<ChildrenProps>[]): GenericReactNode<ChildrenProps> => (
        <AnimationPlaceholder>
          {array.slice(...(animationDirection === AnimationDirection.Normal ? [Integer.Zero, numberOfElements] : [-numberOfElements]))}
        </AnimationPlaceholder>
      ),
    );

  const onAfterMount = (child: ReactElement<ChildrenProps>, index: number): GenericReactNode<ChildrenProps> => (
    <Conditional condition={!index && child === getLastNestedElement(child)}>
      {Array.toArray<GenericReactNode<ChildrenProps>>(
        getLastNestedNullableElement(Array.toArray<GenericReactNode<ChildrenProps>>(child.props.children)[Integer.One])?.props.children,
      ).at(animationDirection === AnimationDirection.Normal ? Integer.Zero : Integer.MinusOne)}
      {onElementMount(
        child,
        (array: GenericReactNode<ChildrenProps>[]): GenericReactNode<ChildrenProps> => (
          <AnimationPlaceholder>{array}</AnimationPlaceholder>
        ),
      )}
    </Conditional>
  );

  const encloseDefer = (children: ReactElement<ChildrenProps>[]): ReactNode => (
    <Defer
      chunkSize={deferChunkSize}
      countElements={countElements}
      onBeforeMount={onBeforeMount}
      onPartialMount={onPartialMount}
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
        characterStyledView={characterStyledView}
        negativeCharacterStyledView={negativeCharacterStyledView}
        enclose={(negative: ReactElement<ChildrenProps>): ReactNode => enclose([negative, ...digits])}
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
