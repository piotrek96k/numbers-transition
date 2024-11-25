import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react';
import {
  AnimationTimingFunction,
  AnimationTransition,
  DecimalSeparator,
  DigitGroupSeparator,
  EmptyCharacter,
  HorizontalAnimationDirection,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  NumberOfAnimations,
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import {
  CubicBezierTuple,
  DigitsReducer,
  ElementMappers,
  useAnimationTimingFunction,
  useCubicBezier,
  useDigitsReducer,
  useElementMappers,
  useHorizontalAnimationDigits,
  useVerticalAnimationDigits,
} from './NumbersTransition.hooks';
import {
  StyledCharacter,
  StyledDivision,
  StyledHorizontalAnimation,
  StyledVerticalAnimation,
} from './NumbersTransition.styles';

interface ConditionalProps {
  children: [ReactNode, ReactNode];
  condition: boolean;
}

export const Conditional: FC<ConditionalProps> = ({
  children: [onTrue, onFalse],
  condition,
}: ConditionalProps): ReactNode => (condition ? onTrue : onFalse);

interface OptionalProps {
  children: ReactNode;
  condition: boolean;
}

const Optional: FC<OptionalProps> = ({ children, condition }: OptionalProps): ReactNode => (
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
    const timeout: NodeJS.Timeout = setTimeout((): void => setSwitched(true), 1_000 * time);
    return (): void => clearTimeout(timeout);
  }, [time]);

  return switched === reverse ? before : after;
};

export const EmptyElement: FC = (): ReactNode => <StyledCharacter>{EmptyCharacter.VALUE}</StyledCharacter>;

interface NegativeElementProps {
  negativeCharacter: NegativeCharacter;
  animationTransition: AnimationTransition;
  previousValue: bigint;
  currentValue: bigint;
  hasSignChanged: boolean;
  numberOfAnimations: NumberOfAnimations;
  renderHorizontalAnimation: boolean;
}

export const NegativeElement: FC<NegativeElementProps> = (props: NegativeElementProps): ReactNode => {
  const {
    negativeCharacter,
    animationTransition,
    previousValue,
    currentValue,
    hasSignChanged,
    numberOfAnimations,
    renderHorizontalAnimation,
  }: NegativeElementProps = props;

  const condition: boolean =
    (!hasSignChanged && currentValue < 0) ||
    (renderHorizontalAnimation &&
      numberOfAnimations === NumberOfAnimations.THREE &&
      previousValue < currentValue === (animationTransition === AnimationTransition.NONE));

  return (
    <Optional condition={condition}>
      <StyledCharacter>{negativeCharacter}</StyledCharacter>
    </Optional>
  );
};

interface NumberElementProps {
  precision: number;
  decimalSeparator: DecimalSeparator;
  digitGroupSeparator: DigitGroupSeparator;
  digits: number[];
}

export const NumberElement: FC<NumberElementProps> = (props: NumberElementProps): ReactNode => {
  const { precision, decimalSeparator, digitGroupSeparator, digits }: NumberElementProps = props;

  const { digitElementMapper }: ElementMappers = useElementMappers();
  const digitsReducer: DigitsReducer = useDigitsReducer({ precision, decimalSeparator, digitGroupSeparator });

  return digits.map<JSX.Element>(digitElementMapper).reduce(digitsReducer);
};

interface HorizontalAnimationProps {
  precision: number;
  animationDuration: number;
  decimalSeparator: DecimalSeparator;
  digitGroupSeparator: DigitGroupSeparator;
  negativeCharacter: NegativeCharacter;
  animationTimingFunction: AnimationTimingFunction;
  animationTransition: AnimationTransition;
  canvasContext: CanvasRenderingContext2D | null;
  previousValueDigits: number[];
  currentValueDigits: number[];
  previousValue: bigint;
  currentValue: bigint;
  minNumberOfDigits: number;
  maxNumberOfDigits: number;
  numberOfDigitsDifference: number;
  hasSignChanged: boolean;
  numberOfAnimations: NumberOfAnimations;
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
    previousValue,
    currentValue,
    minNumberOfDigits,
    maxNumberOfDigits,
    numberOfDigitsDifference,
    hasSignChanged,
    numberOfAnimations,
  }: HorizontalAnimationProps = props;

  const sum = (first: number, second: number): number => first + second;
  const divide = (first: number, second: number): number => first / second;

  const animationDirection: HorizontalAnimationDirection =
    (numberOfAnimations === NumberOfAnimations.TWO &&
      (hasSignChanged ? previousValue > currentValue : previousValueDigits.length < currentValueDigits.length)) ||
    (numberOfAnimations === NumberOfAnimations.THREE && animationTransition === AnimationTransition.NONE)
      ? HorizontalAnimationDirection.RIGHT
      : HorizontalAnimationDirection.LEFT;

  const hasEmptyNegativeCharacter: boolean =
    hasSignChanged &&
    (numberOfAnimations === NumberOfAnimations.TWO ||
      (numberOfAnimations === NumberOfAnimations.THREE &&
        previousValue < currentValue === (animationTransition === AnimationTransition.SECOND_TO_THIRD)));

  const hasZeros: boolean =
    numberOfAnimations === NumberOfAnimations.TWO ||
    (numberOfAnimations === NumberOfAnimations.THREE &&
      previousValue < currentValue === (animationTransition === AnimationTransition.NONE));

  const animationTimingFunction: AnimationTimingFunction = useAnimationTimingFunction({
    animationTimingFunction: animationTimingFunctionInput,
    animationDirection,
  });

  const animationDigits: number[] = useHorizontalAnimationDigits({
    numberOfDigitsDifference,
    previousValueDigits,
    currentValueDigits,
    animationDirection,
    hasZeros,
  });

  const getCharacterWidth = (character: DecimalSeparator | DigitGroupSeparator | NegativeCharacter): number =>
    [character, '0']
      .map<number>((text: string): number => canvasContext?.measureText?.(text)?.width ?? 0)
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

  const numberElement: JSX.Element = (
    <NumberElement
      precision={precision}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      digits={animationDigits}
    />
  );

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
        {numberElement}
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
  previousValue: bigint;
  currentValue: bigint;
  maxNumberOfDigits: number;
  hasSignChanged: boolean;
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
    previousValue,
    currentValue,
    maxNumberOfDigits,
    hasSignChanged,
  }: VerticalAnimationProps = props;

  const [cubicBezier, solve]: CubicBezierTuple = useCubicBezier();

  const animationDigits: number[][] = useVerticalAnimationDigits({
    maxNumberOfDigits,
    previousValue,
    currentValue,
  });

  const {
    fragmentElementMapper,
    divisionElementMapper,
    simpleDivisionElementMapper,
    characterElementMapper,
    digitElementMapper,
  }: ElementMappers = useElementMappers();

  const digitsReducer: DigitsReducer = useDigitsReducer({ precision, decimalSeparator, digitGroupSeparator });

  const animationDirection: VerticalAnimationDirection =
    previousValue < currentValue ? VerticalAnimationDirection.UP : VerticalAnimationDirection.DOWN;

  const animationTimingFunction: AnimationTimingFunction = useAnimationTimingFunction({
    animationTimingFunction: animationTimingFunctionInput,
    animationDirection,
  });

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
    const toSolve = (value: number): number => yAxisCubicBezier(value) - progress;
    return xAxisCubicBezier(solve(toSolve));
  };

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
    !hasSignChanged || accumulator[0].length || currentValue.length === 1
      ? accumulator[0]
      : [negativeCharacterAnimationElementMapper(currentValue.map(negativeCharacterVisibilityMapper), index)],
    [...accumulator[1], digitAnimationElementMapper(currentValue, index + (hasSignChanged ? 1 : 0))],
  ];

  const animationElementsMapper = (elements: JSX.Element[], index: number): JSX.Element =>
    fragmentElementMapper(index ? elements.reduce(digitsReducer) : elements[0], index);

  return animationDigits
    .reduce<[JSX.Element[], JSX.Element[]]>(animationReducer, [[], []])
    .map<JSX.Element>(animationElementsMapper);
};
