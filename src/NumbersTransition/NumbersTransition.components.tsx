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
  ElementMapperFactory,
  useAnimationTimingFunction,
  useCubicBezier,
  useElementMapperFactory,
  useHorizontalAnimationDigits,
  useVerticalAnimationDigits,
} from './NumbersTransition.hooks';
import {
  Character,
  Digit,
  Division,
  HorizontalAnimation,
  VerticalAnimation,
  VisibilityProps,
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
    const timeout: NodeJS.Timeout = setTimeout((): void => setSwitched(true), time);
    return (): void => clearTimeout(timeout);
  }, [time]);

  return switched === reverse ? before : after;
};

export const EmptyElement: FC = (): ReactNode => <Character>{EmptyCharacter.VALUE}</Character>;

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
      <Character>{negativeCharacter}</Character>
    </Optional>
  );
};

interface HorizontalAnimationNegativeElementProps {
  negativeCharacter: NegativeCharacter;
}

const HorizontalAnimationNegativeElement: FC<HorizontalAnimationNegativeElementProps> = ({
  negativeCharacter,
}: HorizontalAnimationNegativeElementProps): ReactNode => <Character $visible={false}>{negativeCharacter}</Character>;

interface VerticalAnimationNegativeElementProps {
  animationDuration: number;
  negativeCharacter: NegativeCharacter;
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode;
  animationTimingFunction: AnimationTimingFunction;
  animationDirection: VerticalAnimationDirection;
  animationDigits: number[];
}

const VerticalAnimationNegativeElement: FC<VerticalAnimationNegativeElementProps> = (
  props: VerticalAnimationNegativeElementProps,
): ReactNode => {
  const {
    animationDuration,
    negativeCharacter,
    negativeCharacterAnimationMode,
    animationTimingFunction,
    animationDirection,
    animationDigits,
  }: VerticalAnimationNegativeElementProps = props;

  const [cubicBezier, solve]: CubicBezierTuple = useCubicBezier();

  const elementMapperFactory: ElementMapperFactory = useElementMapperFactory();

  const animationTimingFunctionReducer = (
    accumulator: [number[], number[]],
    currentValue: AnimationTimingFunction[number],
  ): [number[], number[]] =>
    accumulator.map<number[]>((coordinates: number[], index: number): number[] => [
      ...coordinates,
      currentValue[index],
    ]);

  const getOutputAnimationProgress = (charactersVisible: boolean[]): number =>
    charactersVisible.lastIndexOf(true) / (charactersVisible.length - 1);

  const solveInputAnimationProgress = (progress: number): number => {
    const [xAxisCubicBezier, yAxisCubicBezier] = animationTimingFunction
      .reduce<[number[], number[]]>(animationTimingFunctionReducer, [[], []])
      .map<(time: number) => number>(cubicBezier);
    const toSolve = (value: number): number => yAxisCubicBezier(value) - progress;
    return xAxisCubicBezier(solve(toSolve));
  };

  const visibilityMapper = (digit: number, index: number, digits: number[]): boolean =>
    !index || (!!digit && digits[index - 1] > digit);

  const negativeCharactersVisible: boolean[] = animationDigits.map<boolean>(visibilityMapper);

  const animationTime: number =
    animationDuration * solveInputAnimationProgress(getOutputAnimationProgress(negativeCharactersVisible));

  const animationSwitchTime: number =
    animationDirection === VerticalAnimationDirection.UP ? animationTime : animationDuration - animationTime;

  const animationDelay: number = animationDirection === VerticalAnimationDirection.UP ? -animationTime : 0;

  const negativeCharacterElementMapper = (visible: boolean, index: number): JSX.Element =>
    elementMapperFactory<VisibilityProps>(Division, negativeCharacter, index, { $visible: visible });

  const verticalAnimationElement: JSX.Element = (
    <VerticalAnimation
      $animationDirection={animationDirection}
      $animationDuration={animationDuration}
      $animationTimingFunction={animationTimingFunction}
      {...(negativeCharacterAnimationMode === NegativeCharacterAnimationMode.SINGLE && {
        $animationDelay: animationDelay,
      })}
    >
      {negativeCharactersVisible.map<JSX.Element>(negativeCharacterElementMapper)}
    </VerticalAnimation>
  );

  return (
    <Character>
      <Conditional condition={negativeCharacterAnimationMode === NegativeCharacterAnimationMode.SINGLE}>
        <Switch time={animationSwitchTime} reverse={animationDirection === VerticalAnimationDirection.DOWN}>
          {negativeCharacter}
          {verticalAnimationElement}
        </Switch>
        {verticalAnimationElement}
      </Conditional>
    </Character>
  );
};

interface NumberElementProps {
  precision: number;
  decimalSeparator: DecimalSeparator;
  digitGroupSeparator: DigitGroupSeparator;
  digits: ReactNode[];
}

export const NumberElement: FC<NumberElementProps> = (props: NumberElementProps): ReactNode => {
  const { precision, decimalSeparator, digitGroupSeparator, digits }: NumberElementProps = props;

  const elementMapperFactory: ElementMapperFactory = useElementMapperFactory();

  const digitElementMapper = (child: ReactNode, index: number): JSX.Element =>
    elementMapperFactory<object>(Digit, child, index);

  const getSeparatorElement = (index: number, length: number): ReactNode =>
    !((length - index - Math.max(precision, 0)) % 3) && (
      <Character>{length - index === precision ? decimalSeparator : digitGroupSeparator}</Character>
    );

  const digitsReducer = (
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

  return digits.map<JSX.Element>(digitElementMapper).reduce(digitsReducer);
};

interface HorizontalAnimationElementProps {
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

export const HorizontalAnimationElement: FC<HorizontalAnimationElementProps> = (
  props: HorizontalAnimationElementProps,
): ReactNode => {
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
  }: HorizontalAnimationElementProps = props;

  const sum = (first: number, second: number): number => first + second;
  const divide = (first: number, second: number): number => first / second;

  const animationDirection: HorizontalAnimationDirection =
    (numberOfAnimations === NumberOfAnimations.TWO &&
      (hasSignChanged ? previousValue > currentValue : previousValueDigits.length < currentValueDigits.length)) ||
    (numberOfAnimations === NumberOfAnimations.THREE && animationTransition === AnimationTransition.NONE)
      ? HorizontalAnimationDirection.RIGHT
      : HorizontalAnimationDirection.LEFT;

  const hasNegativeCharacter: boolean =
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

  const negativeElement: JSX.Element = (
    <Optional condition={hasNegativeCharacter}>
      <HorizontalAnimationNegativeElement negativeCharacter={negativeCharacter} />
    </Optional>
  );

  const numberElement: JSX.Element = (
    <NumberElement
      precision={precision}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      digits={animationDigits}
    />
  );

  return (
    <HorizontalAnimation
      $animationDirection={animationDirection}
      $animationDuration={animationDuration}
      $animationTimingFunction={animationTimingFunction}
      $animationStartWidth={getAnimationWidth(hasZeros ? minNumberOfDigits : maxNumberOfDigits, false)}
      $animationEndWidth={getAnimationWidth(maxNumberOfDigits, hasNegativeCharacter)}
    >
      <Division>
        {negativeElement}
        {numberElement}
      </Division>
    </HorizontalAnimation>
  );
};

interface VerticalAnimationElementProps {
  precision: number;
  animationDuration: number;
  decimalSeparator: DecimalSeparator;
  digitGroupSeparator: DigitGroupSeparator;
  negativeCharacter: NegativeCharacter;
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode;
  animationTimingFunction: AnimationTimingFunction;
  previousValue: bigint;
  currentValue: bigint;
  maxNumberOfDigits: number;
  hasSignChanged: boolean;
}

export const VerticalAnimationElement: FC<VerticalAnimationElementProps> = (
  props: VerticalAnimationElementProps,
): ReactNode => {
  const {
    precision,
    animationDuration,
    decimalSeparator,
    digitGroupSeparator,
    negativeCharacter,
    negativeCharacterAnimationMode,
    animationTimingFunction: animationTimingFunctionInput,
    previousValue,
    currentValue,
    maxNumberOfDigits,
    hasSignChanged,
  }: VerticalAnimationElementProps = props;

  const animationDigits: number[][] = useVerticalAnimationDigits({
    maxNumberOfDigits,
    previousValue,
    currentValue,
  });

  const elementMapperFactory: ElementMapperFactory = useElementMapperFactory();

  const animationDirection: VerticalAnimationDirection =
    previousValue < currentValue ? VerticalAnimationDirection.UP : VerticalAnimationDirection.DOWN;

  const animationTimingFunction: AnimationTimingFunction = useAnimationTimingFunction({
    animationTimingFunction: animationTimingFunctionInput,
    animationDirection,
  });

  const divisionElementMapper = (child: ReactNode, index: number): JSX.Element =>
    elementMapperFactory<object>(Division, child, index);

  const verticalAnimationElementMapper = (digits: number[]) => (
    <VerticalAnimation
      $animationDirection={animationDirection}
      $animationDuration={animationDuration}
      $animationTimingFunction={animationTimingFunction}
    >
      {digits.map<JSX.Element>(divisionElementMapper)}
    </VerticalAnimation>
  );

  const negativeElement: JSX.Element = (
    <Optional condition={hasSignChanged}>
      <VerticalAnimationNegativeElement
        animationDuration={animationDuration}
        negativeCharacter={negativeCharacter}
        negativeCharacterAnimationMode={negativeCharacterAnimationMode}
        animationTimingFunction={animationTimingFunction}
        animationDirection={animationDirection}
        animationDigits={animationDigits.find(({ length }: number[]): boolean => length > 1)!}
      />
    </Optional>
  );

  return (
    <>
      {negativeElement}
      <NumberElement
        precision={precision}
        decimalSeparator={decimalSeparator}
        digitGroupSeparator={digitGroupSeparator}
        digits={animationDigits.map<JSX.Element>(verticalAnimationElementMapper)}
      />
    </>
  );
};
