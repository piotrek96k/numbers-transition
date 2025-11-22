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
import { ThemeProvider, ThemeProviderProps, useTheme } from 'styled-components';
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
  NumbersTransitionTheme,
  VerticalAnimation,
  VerticalAnimationProps,
} from './NumbersTransition.styles';
import { GenericReactNode, Nullable, Optional, OrArray } from './NumbersTransition.types';

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

interface EncloseProps<T extends GenericReactNode<ChildrenProps>> {
  children: T;
  condition?: boolean | ((children: T) => boolean);
  enclose?: (children: T) => ReactNode;
}

const Enclose = <T extends GenericReactNode<ChildrenProps>>({ children, enclose, condition = !!enclose }: EncloseProps<T>): ReactNode => (
  <Conditional condition={Function.optionalCall<(children: T) => boolean, boolean>(condition, children)}>
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

  useEffect(
    (): void =>
      [(): unknown => requestAnimationFrame((): void => setMountedElements((previous: number): number => previous + chunkSize))]
        .filterAll(mountedElements < aggregatedSums.at(Integer.MinusOne)!)
        .forEach(Function.invoke<() => unknown>),
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
      {children.mapMulti<[GenericReactNode<ChildrenProps>, ReactElement<ChildrenProps>]>([mapChildren, mapToFragmentElement])}
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
    ThemeProviderProps
  >(ThemeProvider, (_: ReactElement<ChildrenProps>, rowIndex: number): ThemeProviderProps => ({ theme: { rowIndex } }));

  const mapToNegativeElement: ElementKeyMapper<boolean> = useElementKeyMapper<boolean, NegativeElementProps<T, U, V, W>>(
    NegativeElement<T, U, V, W>,
    (visible: boolean): NegativeElementProps<T, U, V, W> => ({
      negativeCharacter,
      visible,
      characterStyledView,
      negativeCharacterStyledView,
    }),
  );

  const negativeElements: ReactElement<ChildrenProps>[] = animationVisibilities.mapMulti<
    [ReactElement<ChildrenProps>, ReactElement<ChildrenProps>]
  >([mapToNegativeElement, mapToThemeProviderElement]);

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

export interface NumberProps<Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z> {
  precision: number;
  decimalSeparator: DecimalSeparatorCharacter;
  digitGroupSeparator: DigitGroupSeparatorCharacter;
  characterStyledView: StyledViewWithProps<Styled.Character, Q, R>;
  digitStyledView: StyledViewWithProps<Styled.Digit, S, T>;
  separatorStyledView: StyledViewWithProps<Styled.Separator, U, V>;
  decimalSeparatorStyledView: StyledViewWithProps<Styled.DecimalSeparator, W, X>;
  digitGroupSeparatorStyledView: StyledViewWithProps<Styled.DigitGroupSeparator, Y, Z>;
}

interface NumberElementProps<Q extends object, R, S extends object, T, U extends object, V, W extends object, X, Y extends object, Z>
  extends NumberProps<Q, R, S, T, U, V, W, X, Y, Z> {
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
    ThemeProviderProps
  >(
    ThemeProvider,
    (
      _: OrArray<ReactElement<ChildrenProps>>,
      digitIndex: number,
      { length }: OrArray<ReactElement<ChildrenProps>>[],
    ): ThemeProviderProps => ({ theme: { characterIndex: getCharacterIndex(digitIndex, length), digitIndex } }),
  );

  const mapToDigitsThemeProviderElement: ElementKeyMapper<ReactElement<ChildrenProps>> = useElementKeyMapper<
    ReactElement<ChildrenProps>,
    ThemeProviderProps
  >(ThemeProvider, (_: ReactElement<ChildrenProps>, rowIndex: number): ThemeProviderProps => ({ theme: { rowIndex } }));

  const mapToDigitElement: ElementKeyMapper<number> = useElementKeyMapper<number, DigitProps<Q, R, S, T>>(Digit, {
    ...characterStyledView,
    ...digitStyledView,
  });

  const mapToDigitsElement = (numbers: number[]): ReactElement<ChildrenProps>[] =>
    numbers.mapMulti<[ReactElement<ChildrenProps>, ReactElement<ChildrenProps>]>([mapToDigitElement, mapToDigitsThemeProviderElement]);

  const getSeparatorTheme = (
    partialTheme: Partial<NumbersTransitionTheme>,
    index: number,
    length: number,
  ): Partial<NumbersTransitionTheme> => ({
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

  const reduceToNumber = (
    accumulator: ReactElement<ChildrenProps>[],
    currentValue: ReactElement<ChildrenProps>,
    index: number,
    { length }: ReactElement<ChildrenProps>[],
  ): ReactElement<ChildrenProps>[] => [
    ...accumulator,
    ...(index && !((length - index - Math.max(precision, Integer.Zero)) % Integer.Three) ? [getSeparatorElement(index, length)] : []),
    currentValue,
  ];

  const mappedChildren: ReactElement<ChildrenProps>[] = Array.isOfDepth<number, Integer.One>(children, Integer.One)
    ? children.mapMulti<[ReactElement<ChildrenProps>, ReactElement<ChildrenProps>]>([mapToDigitElement, mapToDigitThemeProviderElement])
    : children.mapMulti<[ReactElement<ChildrenProps>[], ReactElement<ChildrenProps>]>([mapToDigitsElement, mapToDigitThemeProviderElement]);

  const number: ReactElement<ChildrenProps>[] = mappedChildren
    .mapMulti(mapToElement)
    .reduce<ReactElement<ChildrenProps>[]>(reduceToNumber, [])
    .map<ReactElement<ChildrenProps>>(mapToFragmentElement);

  return <Enclose<ReactElement<ChildrenProps>[]> enclose={enclose}>{number}</Enclose>;
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
> extends NegativeProps<Y, Z>,
    NumberProps<O, P, Q, R, S, T, U, V, W, X> {
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
    <Show condition={renderNegativeCharacter}>
      <HorizontalAnimationNegativeElement<O, P, Y, Z>
        negativeCharacter={negativeCharacter}
        characterStyledView={characterStyledView}
        negativeCharacterStyledView={negativeCharacterStyledView}
      />
    </Show>
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
      id={`${AnimationId.HorizontalAnimation}${identifier}`}
    >
      <div ref={ref}>
        {negativeElement}
        {numberElement}
      </div>
    </HorizontalAnimation>
  );
};

type VerticalAnimationChildMapper = (child: Optional<ReactElement<ChildrenProps>>) => GenericReactNode<ChildrenProps>;

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
  deferChunkSize?: number;
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
    ThemeProviderProps
  >(
    ThemeProvider,
    (_: ReactElement<ChildrenProps>, index: number): ThemeProviderProps => ({ theme: { columnLength: animationDigits[index].length } }),
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
      ...(index === length - Integer.One && { id: `${AnimationId.VerticalAnimation}${identifier}` }),
    }),
  );

  const renderNegativeCharacter: boolean =
    hasSignChanged || (currentValue < Integer.Zero && negativeCharacterAnimationMode === NegativeCharacterAnimationMode.Multi);

  const getLastNestedElement = (child: ReactElement<ChildrenProps>): ReactElement<ChildrenProps> =>
    isValidElement(child?.props?.children) ? getLastNestedElement(child?.props?.children) : child;

  const getLastNestedOptionalElement = (child: GenericReactNode<ChildrenProps>): Optional<ReactElement<ChildrenProps>> =>
    isValidElement(child) ? getLastNestedElement(child) : undefined;

  const countElements = (child: ReactElement<ChildrenProps>): number =>
    Array.toArray<GenericReactNode<ChildrenProps>>(getLastNestedElement(child).props.children).length;

  const onElementMount =
    <T extends unknown[] = []>(
      encloseFactory: (array: GenericReactNode<ChildrenProps>[], ...args: T) => GenericReactNode<ChildrenProps>,
    ): ((child: ReactElement<ChildrenProps>, ...args: T) => GenericReactNode<ChildrenProps>) =>
    (child: ReactElement<ChildrenProps>, ...args: T) => {
      const condition = ({ props: { children } }: ReactElement<ChildrenProps>): boolean =>
        Array.isArray<GenericReactNode<ChildrenProps>>(children);

      const enclose = ({ props: { children } }: ReactElement<ChildrenProps>): GenericReactNode<ChildrenProps> =>
        encloseFactory(Array.toArray<GenericReactNode<ChildrenProps>>(children), ...args);

      return (
        <Enclose<ReactElement<ChildrenProps>> condition={condition} enclose={enclose}>
          {getLastNestedElement(child)}
        </Enclose>
      );
    };

  const onBeforeElementMount = (array: GenericReactNode<ChildrenProps>[]): GenericReactNode<ChildrenProps> =>
    array.at(animationDirection === AnimationDirection.Normal ? Integer.Zero : Integer.MinusOne);

  const onPartialElementMount = (array: GenericReactNode<ChildrenProps>[], numberOfElements: number): GenericReactNode<ChildrenProps> => (
    <AnimationPlaceholder>
      {array.slice(...(animationDirection === AnimationDirection.Normal ? [Integer.Zero, numberOfElements] : [-numberOfElements]))}
    </AnimationPlaceholder>
  );

  const onAfterElementMount: (child: ReactElement<ChildrenProps>) => GenericReactNode<ChildrenProps> = onElementMount<[]>(
    (array: GenericReactNode<ChildrenProps>[]): GenericReactNode<ChildrenProps> => <AnimationPlaceholder>{array}</AnimationPlaceholder>,
  );

  const onAfterMountMapper =
    (at: number): VerticalAnimationChildMapper =>
    (child: Optional<ReactElement<ChildrenProps>>): GenericReactNode<ChildrenProps> =>
      Array.toArray<GenericReactNode<ChildrenProps>>(child?.props.children).at(at);

  const onAfterMountReducer =
    (accumulatedCallback: VerticalAnimationChildMapper, callback: VerticalAnimationChildMapper): VerticalAnimationChildMapper =>
    (child: Optional<ReactElement<ChildrenProps>>): GenericReactNode<ChildrenProps> =>
      callback(getLastNestedOptionalElement(accumulatedCallback(child)));

  const onAfterMountFunction: VerticalAnimationChildMapper = [
    Integer.One,
    animationDirection === AnimationDirection.Normal ? Integer.Zero : Integer.MinusOne,
  ]
    .map<VerticalAnimationChildMapper>(onAfterMountMapper)
    .reduce(onAfterMountReducer);

  const onAfterMount = (child: ReactElement<ChildrenProps>, index: number): GenericReactNode<ChildrenProps> => (
    <Conditional condition={!index && child === getLastNestedElement(child)}>
      {onAfterMountFunction(child)}
      {onAfterElementMount(child)}
    </Conditional>
  );

  const encloseDefer = (children: ReactElement<ChildrenProps>[]): ReactNode => (
    <Defer
      chunkSize={deferChunkSize}
      countElements={countElements}
      onBeforeMount={onElementMount<[]>(onBeforeElementMount)}
      onPartialMount={onElementMount<[number]>(onPartialElementMount)}
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
