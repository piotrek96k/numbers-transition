import { Dispatch, FC, Fragment, ReactNode, SetStateAction, useEffect, useState } from 'react';
import {
  AnimationTimingFunction,
  AnimationTransition,
  DecimalSeparator,
  DigitGroupSeparator,
  HorizontalAnimationDirection,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  NumberOfAnimations,
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import {
  CubicBezierTuple,
  DigitElementMapper,
  DigitsReducer,
  ElementMapperFactory,
  useAnimationTimingFunction,
  useCubicBezier,
  useDigitElementMapper,
  useDigitsReducer,
  useElementMapperFactory,
  useHorizontalAnimationDigits,
  useVerticalAnimationDigits,
} from './NumbersTransition.hooks';
import {
  StyledCharacter,
  StyledDivision,
  StyledHorizontalAnimation,
  StyledVerticalAnimation,
  StyledVisibilityProps,
} from './NumbersTransition.styles';

interface ConditionalProps {
  children: [ReactNode, ReactNode];
  condition: boolean;
}

export const Conditional: FC<ConditionalProps> = (props: ConditionalProps): ReactNode => {
  const {
    children: [onTrue, onFalse],
    condition,
  }: ConditionalProps = props;

  return condition ? onTrue : onFalse;
};

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
    const timeout: NodeJS.Timeout = setTimeout((): void => setSwitched(true), 1_000 * time);
    return (): void => clearTimeout(timeout);
  }, [time]);

  return switched === reverse ? before : after;
};

interface HorizontalAnimationProps {
  precision: number;
  animationDuration: number;
  decimalSeparator: DecimalSeparator;
  digitGroupSeparator: DigitGroupSeparator;
  negativeCharacter: NegativeCharacter;
  animationTimingFunction: AnimationTimingFunction;
  animationTransition: AnimationTransition;
  canvasContext: CanvasRenderingContext2D;
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
}

export const HorizontalAnimation: FC<HorizontalAnimationProps> = (props: HorizontalAnimationProps): ReactNode => {
  const {
    precision,
    animationDuration,
    decimalSeparator,
    digitGroupSeparator,
    negativeCharacter,
    animationTimingFunction: animationTimingFunctionInput,
    animationTransition,
    canvasContext,
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
  }: HorizontalAnimationProps = props;

  const digitElementMapper: DigitElementMapper = useDigitElementMapper();
  const digitsReducer: DigitsReducer = useDigitsReducer({ precision, decimalSeparator, digitGroupSeparator });

  const sum = (first: number, second: number): number => first + second;
  const divide = (first: number, second: number): number => first / second;

  const animationDirection: HorizontalAnimationDirection =
    (numberOfAnimations === NumberOfAnimations.TWO &&
      (isSignChange ? previousValue > currentValue : previousValueDigits.length < currentValueDigits.length)) ||
    (numberOfAnimations === NumberOfAnimations.THREE && animationTransition === AnimationTransition.NONE)
      ? HorizontalAnimationDirection.RIGHT
      : HorizontalAnimationDirection.LEFT;

  const hasEmptyNegativeCharacter: boolean =
    isSignChange &&
    (numberOfAnimations === NumberOfAnimations.TWO ||
      isHorizontalAnimationInGivenTransition(AnimationTransition.SECOND_TO_THIRD));

  const hasZeros: boolean =
    numberOfAnimations === NumberOfAnimations.TWO || isHorizontalAnimationInGivenTransition(AnimationTransition.NONE);

  const animationTimingFunction: AnimationTimingFunction = useAnimationTimingFunction(
    animationTimingFunctionInput,
    animationDirection,
  );

  const animationDigits: number[] = useHorizontalAnimationDigits({
    numberOfDigitsDifference,
    previousValueDigits,
    currentValueDigits,
    animationDirection,
    hasZeros,
  });

  const getCharacterWidth = (character: DecimalSeparator | DigitGroupSeparator | NegativeCharacter): number =>
    [character, '0'].map<number>((text: string): number => canvasContext?.measureText?.(text)?.width).reduce(divide);

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

  return (
    <StyledHorizontalAnimation
      $animationDirection={animationDirection}
      $animationDuration={animationDuration}
      $animationTimingFunction={animationTimingFunction}
      $animationStartWidth={getAnimationWidth(hasZeros ? minNumberOfDigits : maxNumberOfDigits, false)}
      $animationEndWidth={getAnimationWidth(maxNumberOfDigits, hasEmptyNegativeCharacter)}
    >
      <StyledDivision>
        {hasEmptyNegativeCharacter && <StyledCharacter $visible={false}>{negativeCharacter}</StyledCharacter>}
        {animationDigits.map<JSX.Element>(digitElementMapper).reduce(digitsReducer)}
      </StyledDivision>
    </StyledHorizontalAnimation>
  );
};

interface VerticalAnimationProps {
  precision: number;
  animationDuration: number;
  decimalSeparator: DecimalSeparator;
  digitGroupSeparator: DigitGroupSeparator;
  negativeCharacterAnimationMode?: NegativeCharacterAnimationMode;
  negativeCharacter: NegativeCharacter;
  animationTimingFunction: AnimationTimingFunction;
  maxNumberOfDigits: number;
  previousValue: bigint;
  currentValue: bigint;
  isSignChange: boolean;
}

export const VerticalAnimation: FC<VerticalAnimationProps> = (props: VerticalAnimationProps): ReactNode => {
  const {
    precision,
    animationDuration,
    decimalSeparator,
    digitGroupSeparator,
    negativeCharacterAnimationMode,
    negativeCharacter,
    animationTimingFunction: animationTimingFunctionInput,
    maxNumberOfDigits,
    previousValue,
    currentValue,
    isSignChange,
  }: VerticalAnimationProps = props;

  const [cubicBezier, solve]: CubicBezierTuple = useCubicBezier();
  const animationDigits: number[][] = useVerticalAnimationDigits({
    maxNumberOfDigits,
    previousValue,
    currentValue,
  });

  const elementMapperFactory: ElementMapperFactory = useElementMapperFactory();
  const digitElementMapper: DigitElementMapper = useDigitElementMapper();
  const digitsReducer: DigitsReducer = useDigitsReducer({ precision, decimalSeparator, digitGroupSeparator });

  const animationDirection: VerticalAnimationDirection =
    previousValue < currentValue ? VerticalAnimationDirection.UP : VerticalAnimationDirection.DOWN;

  const animationTimingFunction: AnimationTimingFunction = useAnimationTimingFunction(
    animationTimingFunctionInput,
    animationDirection,
  );

  const animationTimingFunctionReducer = (
    accumulator: [number[], number[]],
    currentValue: AnimationTimingFunction[number],
  ): [number[], number[]] =>
    accumulator.map<number[]>((coordinates: number[], index: number): number[] => [
      ...coordinates,
      currentValue[index],
    ]);

  const getAnimationProgress = (progress: number): number => {
    const [xAxisCubicBezier, yAxisCubicBezier] = animationTimingFunction
      .reduce<[number[], number[]]>(animationTimingFunctionReducer, [[], []])
      .map<(time: number) => number>(cubicBezier);
    const toSolve = (functionVal: number): number => yAxisCubicBezier(functionVal) - progress;
    return xAxisCubicBezier(solve(toSolve));
  };

  const fragmentElementMapper = (child: ReactNode, index: number): JSX.Element =>
    elementMapperFactory<object>(Fragment, child, index);

  const characterElementMapper = (child: ReactNode, index: number): JSX.Element =>
    elementMapperFactory<StyledVisibilityProps>(StyledCharacter, child, index);

  const divisionElementMapper = (child: ReactNode, index: number, props?: StyledVisibilityProps): JSX.Element =>
    elementMapperFactory<StyledVisibilityProps>(StyledDivision, child, index, props);

  const simpleDivisionElementMapper = (child: ReactNode, index: number): JSX.Element =>
    divisionElementMapper(child, index);

  const negativeCharacterElementMapper = (visible: boolean, index: number): JSX.Element =>
    divisionElementMapper(negativeCharacter, index, { $visible: visible });

  const getVerticalAnimationElement = <T,>(
    children: T[],
    mapper: (element: T, index: number) => JSX.Element,
    animationDelay: number = 0,
  ): JSX.Element => (
    <StyledVerticalAnimation
      $animationDirection={animationDirection}
      $animationDuration={animationDuration}
      $animationTimingFunction={animationTimingFunction}
      $animationDelay={animationDelay}
    >
      {children.map<JSX.Element>(mapper)}
    </StyledVerticalAnimation>
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
        time={animationDirection === VerticalAnimationDirection.UP ? time : animationDuration - time}
        reverse={animationDirection === VerticalAnimationDirection.DOWN}
      >
        <StyledCharacter>{negativeCharacter}</StyledCharacter>
        {getAnimation(animationDirection === VerticalAnimationDirection.UP ? -time : 0)}
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

  return animationDigits
    .reduce<[JSX.Element[], JSX.Element[]]>(animationReducer, [[], []])
    .map<JSX.Element>(animationElementsMapper);
};