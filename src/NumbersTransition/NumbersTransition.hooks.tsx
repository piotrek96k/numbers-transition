import { FC, Fragment, ReactNode, RefObject, useLayoutEffect, useRef } from 'react';
import { Conditional, Switch } from './NumbersTransition.components';
import {
  AnimationDirection,
  AnimationTimingFunction,
  AnimationTransition,
  DecimalSeparator,
  DigitGroupSeparator,
  EquationSolver,
  HorizontalAnimationDirection,
  LinearAlgorithm,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  NumberOfAnimations,
  NumberPrecision,
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import {
  Character,
  Digit,
  Division,
  HorizontalAnimation,
  VerticalAnimation,
  VisibilityProps,
} from './NumbersTransition.styles';

export type GetAnimationTimingFunction = (animationDirection: AnimationDirection) => AnimationTimingFunction;

type UseAnimationTimingFunction = (animationTimingFunction: AnimationTimingFunction) => GetAnimationTimingFunction;

export const useAnimationTimingFunction: UseAnimationTimingFunction = (
  animationTimingFunction: AnimationTimingFunction,
): GetAnimationTimingFunction => {
  const reverseAnimationTimingFunctionMapper = (
    tuple: AnimationTimingFunction[number],
  ): AnimationTimingFunction[number] => tuple.map<number>((number: number): number => 1 - number);

  const reverseAnimationTimingFunction = (animationTimingFunction: AnimationTimingFunction): AnimationTimingFunction =>
    animationTimingFunction.map<AnimationTimingFunction[number]>(reverseAnimationTimingFunctionMapper).reverse();

  return (animationDirection: AnimationDirection): AnimationTimingFunction =>
    animationDirection === HorizontalAnimationDirection.RIGHT || animationDirection === VerticalAnimationDirection.UP
      ? animationTimingFunction
      : reverseAnimationTimingFunction(animationTimingFunction);
};

type CubicBezier = (points: number[]) => (time: number) => number;

type Solve = (func: (inputValue: number) => number, previousValue?: number, previousFuncResult?: number) => number;

type CubicBezierTuple = [CubicBezier, Solve];

type UseCubicBezier = () => CubicBezierTuple;

const useCubicBezier: UseCubicBezier = (): CubicBezierTuple => {
  const derivative = (func: (val: number) => number, val: number) =>
    (func(val + EquationSolver.DERIVATIVE_DELTA) - func(val - EquationSolver.DERIVATIVE_DELTA)) /
    (2 * EquationSolver.DERIVATIVE_DELTA);

  const solve = (
    func: (inputValue: number) => number,
    previousValue: number = EquationSolver.INITIAL_VALUE,
    previousFuncResult: number = func(previousValue),
  ): number => {
    const newValue: number = previousValue - previousFuncResult / derivative(func, previousValue);
    const newFuncResult: number = func(newValue);
    return Math.abs(newValue - previousValue) < EquationSolver.DERIVATIVE_DELTA &&
      newFuncResult < EquationSolver.DERIVATIVE_DELTA
      ? newValue
      : solve(func, newValue, newFuncResult);
  };

  const cubicBezier =
    ([firstPoint, secondPoint]: number[]): ((time: number) => number) =>
    (time: number): number =>
      3 * (firstPoint * time * (1 - time) ** 2 + secondPoint * (1 - time) * time ** 2) + time ** 3;

  return [cubicBezier, solve];
};

interface UseHorizontalAnimationDigitsOptions {
  previousValueDigits: number[];
  currentValueDigits: number[];
  numberOfDigitsDifference: number;
  getAnimationDirection: () => HorizontalAnimationDirection;
  hasZeros: () => boolean;
}

type GetHorizontalAnimationDigits = () => number[];

type UseHorizontalAnimationDigits = (options: UseHorizontalAnimationDigitsOptions) => GetHorizontalAnimationDigits;

const useHorizontalAnimationDigits: UseHorizontalAnimationDigits = (
  options: UseHorizontalAnimationDigitsOptions,
): GetHorizontalAnimationDigits => {
  const {
    numberOfDigitsDifference,
    previousValueDigits,
    currentValueDigits,
    getAnimationDirection,
    hasZeros,
  }: UseHorizontalAnimationDigitsOptions = options;

  return (): number[] => [
    ...(hasZeros() ? Array(numberOfDigitsDifference).fill(0) : []),
    ...(getAnimationDirection() === HorizontalAnimationDirection.RIGHT ? previousValueDigits : currentValueDigits),
  ];
};

interface AlgorithmValues {
  start: bigint;
  end: bigint;
}

interface UseVerticalAnimationDigitsOptions {
  maxNumberOfDigits: number;
  previousValue: bigint;
  currentValue: bigint;
}

type GetVerticalAnimationDigits = () => number[][];

type UseVerticalAnimationDigits = (options: UseVerticalAnimationDigitsOptions) => GetVerticalAnimationDigits;

const useVerticalAnimationDigits: UseVerticalAnimationDigits = (
  options: UseVerticalAnimationDigitsOptions,
): GetVerticalAnimationDigits => {
  const { maxNumberOfDigits, previousValue, currentValue }: UseVerticalAnimationDigitsOptions = options;

  const algorithmValuesArrayReducer = (
    accumulator: AlgorithmValues[][],
    _: undefined,
    index: number,
  ): AlgorithmValues[][] => {
    const [start, end]: bigint[] = [previousValue, currentValue]
      .map<bigint>((number: bigint): bigint => number / 10n ** BigInt(maxNumberOfDigits - index - 1))
      .sort((first: bigint, second: bigint): number => (first < second ? -1 : first > second ? 1 : 0));
    const accumulatorIndex: number = end - start < LinearAlgorithm.MAX_LENGTH ? 0 : 1;
    accumulator[accumulatorIndex] = [...accumulator[accumulatorIndex], { start, end }];
    return accumulator;
  };

  const digitMapper = (number: bigint): number => Math.abs(Number(number % 10n));

  const linearAlgorithmMapper = ({ start, end }: AlgorithmValues): number[] =>
    [...Array(Number(end - start) + 1)].map<number>((_: undefined, index: number): number =>
      digitMapper(start + BigInt(index)),
    );

  const nonLinearAlgorithmMapper = (values: AlgorithmValues, algorithmIndex: number): number[] => {
    const { start, end }: AlgorithmValues = values;
    const numbers: number[] = [...Array(LinearAlgorithm.MAX_LENGTH * (1 + 0.5 * algorithmIndex))]
      .map<bigint>(
        (_: undefined, index: number, { length }: number[]): bigint =>
          (NumberPrecision.VALUE * (start * BigInt(length - index) + end * BigInt(index))) / BigInt(length),
      )
      .map<[bigint, bigint]>((increasedValue: bigint): [bigint, bigint] => [
        increasedValue,
        increasedValue / NumberPrecision.VALUE,
      ])
      .map<bigint>(([increasedValue, newValue]: [bigint, bigint]): bigint =>
        increasedValue - newValue * NumberPrecision.VALUE < NumberPrecision.HALF_VALUE ? newValue : newValue + 1n,
      )
      .map<number>(digitMapper);
    return numbers[numbers.length - 1] === digitMapper(end) ? numbers : [...numbers, digitMapper(end)];
  };

  const algorithmMapper = (algorithmValuesArray: AlgorithmValues[], index: number): number[][] =>
    algorithmValuesArray.map<number[]>(index ? nonLinearAlgorithmMapper : linearAlgorithmMapper);

  return (): number[][] =>
    [...Array(maxNumberOfDigits)]
      .reduce<AlgorithmValues[][]>(algorithmValuesArrayReducer, [[], []])
      .map<number[][]>(algorithmMapper)
      .flat<number[][][], 1>();
};

interface KeyProps {
  key: string;
  children: ReactNode;
}

type ElementMapperFactory = <T extends object>(
  Component: FC<T | KeyProps> | string,
  child: ReactNode,
  index: number,
  props?: T,
) => JSX.Element;

type UseElementMapperFactory = () => ElementMapperFactory;

const useElementMapperFactory: UseElementMapperFactory =
  (): ElementMapperFactory =>
  <T extends object>(Component: FC<T | KeyProps> | string, child: ReactNode, index: number, props?: T): JSX.Element => (
    <Component key={`${typeof Component === 'symbol' ? '' : Component}${`${index + 1}`.padStart(2, '0')}`} {...props}>
      {child}
    </Component>
  );

export type DigitElementMapper = (child: ReactNode, index: number) => JSX.Element;

type UseDigitElementMapper = () => DigitElementMapper;

export const useDigitElementMapper: UseDigitElementMapper = (): DigitElementMapper => {
  const elementMapperFactory: ElementMapperFactory = useElementMapperFactory();
  return (child: ReactNode, index: number): JSX.Element => elementMapperFactory<object>(Digit, child, index);
};

interface UseDigitsReducerOptions {
  precision: number;
  decimalSeparator: DecimalSeparator;
  digitGroupSeparator: DigitGroupSeparator;
}

export type DigitsReducer = (
  accumulator: JSX.Element,
  currentValue: JSX.Element,
  index: number,
  array: JSX.Element[],
) => JSX.Element;

type UseDigitsReducer = (options: UseDigitsReducerOptions) => DigitsReducer;

export const useDigitsReducer: UseDigitsReducer = (options: UseDigitsReducerOptions): DigitsReducer => {
  const { precision, decimalSeparator, digitGroupSeparator }: UseDigitsReducerOptions = options;

  const getSeparatorElement = (index: number, length: number): ReactNode =>
    !((length - index - Math.max(precision, 0)) % 3) && (
      <Character>{length - index === precision ? decimalSeparator : digitGroupSeparator}</Character>
    );

  return (
    accumulator: JSX.Element,
    currentValue: JSX.Element,
    index: number,
    { length }: JSX.Element[],
  ): JSX.Element => (
    <>
      {accumulator}
      {getSeparatorElement(index, length)}
      {currentValue}
    </>
  );
};

interface UseHorizontalAnimationOptions {
  precision: number;
  animationDuration: number;
  decimalSeparator: DecimalSeparator;
  digitGroupSeparator: DigitGroupSeparator;
  negativeCharacter: NegativeCharacter;
  animationTransition: AnimationTransition;
  containerRef: RefObject<HTMLDivElement>;
  previousValueDigits: number[];
  currentValueDigits: number[];
  minNumberOfDigits: number;
  maxNumberOfDigits: number;
  numberOfDigitsDifference: number;
  previousValue: bigint;
  currentValue: bigint;
  isSignChange: boolean;
  numberOfAnimations: NumberOfAnimations;
  isHorizontalAnimationInGivenTransition: (transition: AnimationTransition) => boolean;
  getAnimationTimingFunction: GetAnimationTimingFunction;
  digitElementMapper: DigitElementMapper;
  digitsReducer: DigitsReducer;
}

export type GetHorizontalAnimation = () => JSX.Element;

type UseHorizontalAnimation = (options: UseHorizontalAnimationOptions) => GetHorizontalAnimation;

export const useHorizontalAnimation: UseHorizontalAnimation = (
  options: UseHorizontalAnimationOptions,
): GetHorizontalAnimation => {
  const {
    precision,
    animationDuration,
    decimalSeparator,
    digitGroupSeparator,
    negativeCharacter,
    animationTransition,
    containerRef,
    previousValueDigits,
    currentValueDigits,
    minNumberOfDigits,
    maxNumberOfDigits,
    numberOfDigitsDifference,
    previousValue,
    currentValue,
    isSignChange,
    numberOfAnimations,
    isHorizontalAnimationInGivenTransition,
    getAnimationTimingFunction,
    digitElementMapper,
    digitsReducer,
  }: UseHorizontalAnimationOptions = options;

  const canvasContextRef: RefObject<CanvasRenderingContext2D> = useRef<CanvasRenderingContext2D>(
    document.createElement('canvas').getContext('2d'),
  );

  useLayoutEffect((): void => {
    if (containerRef.current && canvasContextRef.current) {
      canvasContextRef.current.font =
        [...containerRef.current.classList]
          .map<string>((className: string): string => window.getComputedStyle(containerRef.current!, className).font)
          .find((font: string): string => font) ?? '';
    }
  }, [containerRef]);

  const sum = (first: number, second: number): number => first + second;
  const divide = (first: number, second: number): number => first / second;

  const getAnimationDirection = (): HorizontalAnimationDirection =>
    (numberOfAnimations === NumberOfAnimations.TWO &&
      (isSignChange ? previousValue > currentValue : previousValueDigits.length < currentValueDigits.length)) ||
    (numberOfAnimations === NumberOfAnimations.THREE && animationTransition === AnimationTransition.NONE)
      ? HorizontalAnimationDirection.RIGHT
      : HorizontalAnimationDirection.LEFT;

  const hasEmptyNegativeCharacter = (): boolean =>
    isSignChange &&
    (numberOfAnimations === NumberOfAnimations.TWO ||
      isHorizontalAnimationInGivenTransition(AnimationTransition.SECOND_TO_THIRD));

  const hasZeros = (): boolean =>
    numberOfAnimations === NumberOfAnimations.TWO || isHorizontalAnimationInGivenTransition(AnimationTransition.NONE);

  const getAnimationDigits: GetHorizontalAnimationDigits = useHorizontalAnimationDigits({
    numberOfDigitsDifference,
    previousValueDigits,
    currentValueDigits,
    getAnimationDirection,
    hasZeros,
  });

  const getCharacterWidth = (character: DecimalSeparator | DigitGroupSeparator | NegativeCharacter): number =>
    [character, '0']
      .map<number>((text: string): number => canvasContextRef.current!.measureText(text).width)
      .reduce(divide);

  const getDigitsSeparatorsWidth = (numberOfDigits: number): number =>
    getCharacterWidth(digitGroupSeparator) *
    [numberOfDigits - Math.max(precision, 0), Math.max(precision, 0)]
      .map<number>((quantity: number): number => Math.trunc((quantity - 1) / 3))
      .reduce(sum);

  const getAnimationWidth = (numberOfDigits: number, hasNegativeCharacter: boolean): number =>
    [
      hasNegativeCharacter ? getCharacterWidth(negativeCharacter) : 0,
      numberOfDigits,
      getDigitsSeparatorsWidth(numberOfDigits),
      precision > 0 ? getCharacterWidth(decimalSeparator) : 0,
    ].reduce(sum);

  const getAnimationStartWidth = (): number =>
    getAnimationWidth(hasZeros() ? minNumberOfDigits : maxNumberOfDigits, false);

  const getAnimationEndWidth = (): number => getAnimationWidth(maxNumberOfDigits, hasEmptyNegativeCharacter());

  return (): JSX.Element => (
    <HorizontalAnimation
      $animationDirection={getAnimationDirection()}
      $animationDuration={animationDuration}
      $animationTimingFunction={getAnimationTimingFunction(getAnimationDirection())}
      $animationStartWidth={getAnimationStartWidth()}
      $animationEndWidth={getAnimationEndWidth()}
    >
      <Division>
        {hasEmptyNegativeCharacter() && <Character $visible={false}>{negativeCharacter}</Character>}
        {getAnimationDigits().map<JSX.Element>(digitElementMapper).reduce(digitsReducer)}
      </Division>
    </HorizontalAnimation>
  );
};

interface UseVerticalAnimationOptions {
  animationDuration: number;
  negativeCharacterAnimationMode?: NegativeCharacterAnimationMode;
  negativeCharacter: NegativeCharacter;
  maxNumberOfDigits: number;
  previousValue: bigint;
  currentValue: bigint;
  isSignChange: boolean;
  getAnimationTimingFunction: GetAnimationTimingFunction;
  digitElementMapper: DigitElementMapper;
  digitsReducer: DigitsReducer;
}

export type GetVerticalAnimation = () => JSX.Element[];

type UseVerticalAnimation = (options: UseVerticalAnimationOptions) => GetVerticalAnimation;

export const useVerticalAnimation: UseVerticalAnimation = (options: UseVerticalAnimationOptions) => {
  const {
    animationDuration,
    negativeCharacterAnimationMode,
    negativeCharacter,
    maxNumberOfDigits,
    previousValue,
    currentValue,
    isSignChange,
    getAnimationTimingFunction,
    digitElementMapper,
    digitsReducer,
  }: UseVerticalAnimationOptions = options;

  const [cubicBezier, solve]: CubicBezierTuple = useCubicBezier();

  const getAnimationDigits: GetVerticalAnimationDigits = useVerticalAnimationDigits({
    maxNumberOfDigits,
    previousValue,
    currentValue,
  });

  const elementMapperFactory: ElementMapperFactory = useElementMapperFactory();

  const getAnimationDirection = (): VerticalAnimationDirection =>
    previousValue < currentValue ? VerticalAnimationDirection.UP : VerticalAnimationDirection.DOWN;

  const animationTimingFunctionReducer = (
    accumulator: [number[], number[]],
    currentValue: AnimationTimingFunction[number],
  ): [number[], number[]] =>
    accumulator.map<number[]>((coordinates: number[], index: number): number[] => [
      ...coordinates,
      currentValue[index],
    ]);

  const getAnimationProgress = (progress: number): number => {
    const [xAxisCubicBezier, yAxisCubicBezier] = getAnimationTimingFunction(getAnimationDirection())
      .reduce<[number[], number[]]>(animationTimingFunctionReducer, [[], []])
      .map<(time: number) => number>(cubicBezier);
    const toSolve = (functionVal: number): number => yAxisCubicBezier(functionVal) - progress;
    return xAxisCubicBezier(solve(toSolve));
  };

  const fragmentElementMapper = (child: ReactNode, index: number): JSX.Element =>
    elementMapperFactory<object>(Fragment, child, index);

  const characterElementMapper = (child: ReactNode, index: number): JSX.Element =>
    elementMapperFactory<VisibilityProps>(Character, child, index);

  const divisionElementMapper = (child: ReactNode, index: number, props?: VisibilityProps): JSX.Element =>
    elementMapperFactory<VisibilityProps>(Division, child, index, props);

  const simpleDivisionElementMapper = (child: ReactNode, index: number): JSX.Element =>
    divisionElementMapper(child, index);

  const negativeCharacterElementMapper = (visible: boolean, index: number): JSX.Element =>
    divisionElementMapper(negativeCharacter, index, { $visible: visible });

  const getVerticalAnimationElement = <T,>(
    children: T[],
    mapper: (element: T, index: number) => JSX.Element,
    animationDelay: number = 0,
  ): JSX.Element => (
    <VerticalAnimation
      $animationDirection={getAnimationDirection()}
      $animationDuration={animationDuration}
      $animationTimingFunction={getAnimationTimingFunction(getAnimationDirection())}
      $animationDelay={animationDelay}
    >
      {children.map<JSX.Element>(mapper)}
    </VerticalAnimation>
  );

  const negativeCharacterAnimationElementMapper = (
    charactersVisible: boolean[],
    index: number,
    time: number = animationDuration *
      getAnimationProgress(charactersVisible.lastIndexOf(true) / (charactersVisible.length - 1)),
    getAnimation = (delay: number = 0): JSX.Element =>
      characterElementMapper(
        getVerticalAnimationElement<boolean>(charactersVisible, negativeCharacterElementMapper, delay),
        index,
      ),
  ): JSX.Element => (
    <Conditional condition={negativeCharacterAnimationMode === NegativeCharacterAnimationMode.SINGLE}>
      <Switch
        time={getAnimationDirection() === VerticalAnimationDirection.UP ? time : animationDuration - time}
        reverse={getAnimationDirection() === VerticalAnimationDirection.DOWN}
      >
        <Character>{negativeCharacter}</Character>
        {getAnimation(getAnimationDirection() === VerticalAnimationDirection.UP ? -time : 0)}
      </Switch>
      {getAnimation()}
    </Conditional>
  );

  const negativeCharacterVisibilityMapper = (digit: number, index: number, digits: number[]): boolean =>
    !index || (!!digit && digits[index - 1] > digit);

  const digitAnimationElementMapper = (digits: number[], index: number): JSX.Element =>
    digitElementMapper(getVerticalAnimationElement<number>(digits, simpleDivisionElementMapper), index);

  const animationReducer = (
    accumulator: [JSX.Element[], JSX.Element[]],
    currentValue: number[],
    index: number,
  ): [JSX.Element[], JSX.Element[]] => [
    !isSignChange || accumulator[0].length || currentValue.length === 1
      ? accumulator[0]
      : [negativeCharacterAnimationElementMapper(currentValue.map(negativeCharacterVisibilityMapper), index)],
    [...accumulator[1], digitAnimationElementMapper(currentValue, index + (isSignChange ? 1 : 0))],
  ];

  const animationElementsMapper = (elements: JSX.Element[], index: number): JSX.Element =>
    fragmentElementMapper(index ? elements.reduce(digitsReducer) : elements[0], index);

  return (): JSX.Element[] =>
    getAnimationDigits()
      .reduce<[JSX.Element[], JSX.Element[]]>(animationReducer, [[], []])
      .map<JSX.Element>(animationElementsMapper);
};
