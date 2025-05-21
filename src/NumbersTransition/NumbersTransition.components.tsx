import { Dispatch, FC, Fragment, ReactElement, ReactNode, RefObject, SetStateAction, useEffect, useState } from 'react';
import {
  AnimationNumber,
  AnimationTransition,
  DecimalSeparator,
  DigitGroupSeparator,
  Display,
  HorizontalAnimationDirection,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  Numbers,
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import {
  CubicBezierTuple,
  ElementKeyMapper,
  FunctionalComponent,
  GetCharacterWidth,
  useAnimationTimingFunctionDirection,
  useCharacterWidth,
  useCubicBezier,
  useElementKeyMapper,
  useHorizontalAnimationDigits,
  useVerticalAnimationDigits,
} from './NumbersTransition.hooks';
import {
  AnimationTimingFunction,
  Character,
  Digit,
  HorizontalAnimation,
  VerticalAnimation,
} from './NumbersTransition.styles';
import { OrReadOnly } from './NumbersTransition.types';

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

export const Optional: FC<OptionalProps> = ({ children, condition }: OptionalProps): ReactNode => (
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

interface InvalidElementProps {
  invalidValue: string;
}

export const InvalidElement: FC<InvalidElementProps> = ({ invalidValue }: InvalidElementProps): ReactNode => (
  <Character>{invalidValue}</Character>
);

interface NegativeElementProps {
  negativeCharacter: NegativeCharacter;
  visible?: boolean;
  display?: Display;
}

export const NegativeElement: FC<NegativeElementProps> = ({
  negativeCharacter,
  visible,
  display,
}: NegativeElementProps): ReactNode => (
  <Character $visible={visible} $display={display}>
    {negativeCharacter}
  </Character>
);

interface HorizontalAnimationNegativeElementProps {
  negativeCharacter: NegativeCharacter;
}

const HorizontalAnimationNegativeElement: FC<HorizontalAnimationNegativeElementProps> = ({
  negativeCharacter,
}: HorizontalAnimationNegativeElementProps): ReactNode => (
  <NegativeElement negativeCharacter={negativeCharacter} visible={false} />
);

interface VerticalAnimationNegativeElementProps {
  animationDuration: number;
  negativeCharacter: NegativeCharacter;
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode;
  animationTimingFunction: AnimationTimingFunction;
  animationDirection: VerticalAnimationDirection;
  animationDigits: number[];
  hasSignChanged: boolean;
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
    hasSignChanged,
  }: VerticalAnimationNegativeElementProps = props;

  const [cubicBezier, solve]: CubicBezierTuple = useCubicBezier();

  const fragmentElementMapper: ElementKeyMapper = useElementKeyMapper(Fragment);

  const animationTimingFunctionReducer = (
    accumulator: [number[], number[]],
    currentValue: AnimationTimingFunction[number],
  ): AnimationTimingFunction =>
    accumulator.map<number[], AnimationTimingFunction>((coordinates: number[], index: number): number[] => [
      ...coordinates,
      currentValue[index],
    ]);

  const [xAxisCubicBezier, yAxisCubicBezier] = animationTimingFunction
    .reduce<[number[], number[]], AnimationTimingFunction>(animationTimingFunctionReducer, [[], []])
    .map<(time: number) => number>(cubicBezier);

  const visibilityMapper = (digit: number, index: number, digits: number[]): boolean =>
    !index || (!!digit && digits[index - Numbers.ONE] > digit) || !hasSignChanged;

  const negativeCharactersVisible: boolean[] = animationDigits.map<boolean>(visibilityMapper);

  const outputAnimationProgress: number =
    negativeCharactersVisible.lastIndexOf(true) / (negativeCharactersVisible.length - Numbers.ONE);

  const inputAnimationProgress: number = xAxisCubicBezier(
    solve((value: number): number => yAxisCubicBezier(value) - outputAnimationProgress),
  );

  const animationTime: number = animationDuration * inputAnimationProgress;

  const animationSwitchTime: number =
    animationDirection === VerticalAnimationDirection.UP ? animationTime : animationDuration - animationTime;

  const animationDelay: number = animationDirection === VerticalAnimationDirection.UP ? -animationTime : Numbers.ZERO;

  const negativeCharacterElementMapper = (visible: boolean): ReactElement => (
    <NegativeElement negativeCharacter={negativeCharacter} visible={visible} display={Display.BLOCK} />
  );

  const verticalAnimationElement: ReactElement = (
    <div>
      <VerticalAnimation
        $animationDirection={animationDirection}
        $animationDuration={animationDuration}
        $animationTimingFunction={animationTimingFunction}
        {...(negativeCharacterAnimationMode === NegativeCharacterAnimationMode.SINGLE && {
          $animationDelay: animationDelay,
        })}
      >
        {negativeCharactersVisible
          .map<ReactElement>(negativeCharacterElementMapper)
          .map<ReactElement>(fragmentElementMapper)}
      </VerticalAnimation>
    </div>
  );

  return (
    <Conditional condition={negativeCharacterAnimationMode === NegativeCharacterAnimationMode.SINGLE}>
      <Switch time={animationSwitchTime} reverse={animationDirection === VerticalAnimationDirection.DOWN}>
        <NegativeElement negativeCharacter={negativeCharacter} />
        {verticalAnimationElement}
      </Switch>
      {verticalAnimationElement}
    </Conditional>
  );
};

interface NumberElementProps {
  precision: number;
  decimalSeparator: DecimalSeparator;
  digitGroupSeparator: DigitGroupSeparator;
  component?: FunctionalComponent;
  children: ReactNode[];
}

export const NumberElement: FC<NumberElementProps> = (props: NumberElementProps): ReactNode => {
  const { precision, decimalSeparator, digitGroupSeparator, component = Digit, children }: NumberElementProps = props;

  const elementMapper: ElementKeyMapper = useElementKeyMapper(component);

  const getSeparatorElement = (index: number, length: number): ReactNode =>
    !((length - index - Math.max(precision, Numbers.ZERO)) % Numbers.THREE) && (
      <Character>{length - index === precision ? decimalSeparator : digitGroupSeparator}</Character>
    );

  const digitsReducer = (
    accumulator: ReactElement,
    currentValue: ReactElement,
    index: number,
    { length }: ReactElement[],
  ): ReactElement => (
    <>
      {accumulator}
      {getSeparatorElement(index, length)}
      {currentValue}
    </>
  );

  return children.map<ReactElement>(elementMapper).reduce(digitsReducer);
};

interface HorizontalAnimationElementProps {
  precision: number;
  animationDuration: number;
  decimalSeparator: DecimalSeparator;
  digitGroupSeparator: DigitGroupSeparator;
  negativeCharacter: NegativeCharacter;
  animationTimingFunction: OrReadOnly<AnimationTimingFunction>;
  animationTransition: AnimationTransition;
  containerRef: RefObject<HTMLDivElement | null>;
  previousValueDigits: number[];
  currentValueDigits: number[];
  previousValue: bigint;
  currentValue: bigint;
  minNumberOfDigits: number;
  maxNumberOfDigits: number;
  numberOfDigitsDifference: number;
  hasSignChanged: boolean;
  numberOfAnimations: AnimationNumber;
  onAnimationEnd: () => void;
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
    containerRef,
    previousValueDigits,
    currentValueDigits,
    previousValue,
    currentValue,
    minNumberOfDigits,
    maxNumberOfDigits,
    numberOfDigitsDifference,
    hasSignChanged,
    numberOfAnimations,
    onAnimationEnd,
  }: HorizontalAnimationElementProps = props;

  const animationDirection: HorizontalAnimationDirection =
    (numberOfAnimations === AnimationNumber.TWO &&
      (hasSignChanged ? previousValue > currentValue : previousValueDigits.length < currentValueDigits.length)) ||
    (numberOfAnimations === AnimationNumber.THREE && animationTransition === AnimationTransition.NONE)
      ? HorizontalAnimationDirection.RIGHT
      : HorizontalAnimationDirection.LEFT;

  const renderNegativeElement: boolean =
    hasSignChanged &&
    (numberOfAnimations === AnimationNumber.TWO ||
      (numberOfAnimations === AnimationNumber.THREE &&
        previousValue < currentValue === (animationTransition === AnimationTransition.SECOND_TO_THIRD)));

  const renderZeros: boolean =
    numberOfAnimations === AnimationNumber.TWO ||
    (numberOfAnimations === AnimationNumber.THREE &&
      previousValue < currentValue === (animationTransition === AnimationTransition.NONE));

  const animationTimingFunction: AnimationTimingFunction = useAnimationTimingFunctionDirection({
    animationTimingFunction: animationTimingFunctionInput,
    animationDirection,
  });

  const animationDigits: number[] = useHorizontalAnimationDigits({
    numberOfDigitsDifference,
    previousValueDigits,
    currentValueDigits,
    animationDirection,
    renderZeros,
  });

  const getCharacterWidth: GetCharacterWidth = useCharacterWidth(containerRef);

  const sum = (first: number, second: number): number => first + second;

  const getDigitsSeparatorsWidth = (numberOfDigits: number): number =>
    getCharacterWidth(digitGroupSeparator) *
    [numberOfDigits - Math.max(precision, Numbers.ZERO), Math.max(precision, Numbers.ZERO)]
      .map<number>((quantity: number): number => Math.trunc((quantity - Numbers.ONE) / Numbers.THREE))
      .reduce(sum);

  const getAnimationWidth = (numberOfDigits: number, renderNegativeCharacter: boolean = false): number =>
    [
      renderNegativeCharacter ? getCharacterWidth(negativeCharacter) : Numbers.ZERO,
      numberOfDigits,
      getDigitsSeparatorsWidth(numberOfDigits),
      precision > Numbers.ZERO ? getCharacterWidth(decimalSeparator) : Numbers.ZERO,
    ].reduce(sum);

  const negativeElement: ReactElement = (
    <Optional condition={renderNegativeElement}>
      <HorizontalAnimationNegativeElement negativeCharacter={negativeCharacter} />
    </Optional>
  );

  const numberElement: ReactElement = (
    <NumberElement precision={precision} decimalSeparator={decimalSeparator} digitGroupSeparator={digitGroupSeparator}>
      {animationDigits}
    </NumberElement>
  );

  return (
    <HorizontalAnimation
      $animationDirection={animationDirection}
      $animationDuration={animationDuration}
      $animationTimingFunction={animationTimingFunction}
      $animationStartWidth={getAnimationWidth(renderZeros ? minNumberOfDigits : maxNumberOfDigits)}
      $animationEndWidth={getAnimationWidth(maxNumberOfDigits, renderNegativeElement)}
      onAnimationEnd={onAnimationEnd}
    >
      <div>
        {negativeElement}
        {numberElement}
      </div>
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
  animationTimingFunction: OrReadOnly<AnimationTimingFunction>;
  previousValue: bigint;
  currentValue: bigint;
  maxNumberOfDigits: number;
  hasSignChanged: boolean;
  onAnimationEnd: () => void;
}

export const VerticalAnimationElement: FC<VerticalAnimationElementProps> = (
  props: VerticalAnimationElementProps,
): ReactNode => {
  const {
    animationDuration,
    negativeCharacter,
    negativeCharacterAnimationMode,
    animationTimingFunction: animationTimingFunctionInput,
    previousValue,
    currentValue,
    maxNumberOfDigits,
    hasSignChanged,
    onAnimationEnd,
    ...restProps
  }: VerticalAnimationElementProps = props;

  const renderNegativeElement: boolean =
    hasSignChanged ||
    (currentValue < Numbers.ZERO && negativeCharacterAnimationMode === NegativeCharacterAnimationMode.MULTI);

  const animationDirection: VerticalAnimationDirection =
    previousValue < currentValue ? VerticalAnimationDirection.UP : VerticalAnimationDirection.DOWN;

  const animationTimingFunction: AnimationTimingFunction = useAnimationTimingFunctionDirection({
    animationTimingFunction: animationTimingFunctionInput,
    animationDirection,
  });

  const animationDigits: number[][] = useVerticalAnimationDigits({
    maxNumberOfDigits,
    previousValue,
    currentValue,
  });

  const fragmentElementMapper: ElementKeyMapper = useElementKeyMapper(Fragment);

  const digitElementMapper = (digit: number): ReactElement => <Digit $display={Display.BLOCK}>{digit}</Digit>;

  const verticalAnimationElementMapper = (digits: number[], index: number, { length }: number[][]): ReactElement => (
    <VerticalAnimation
      $animationDirection={animationDirection}
      $animationDuration={animationDuration}
      $animationTimingFunction={animationTimingFunction}
      {...(index === length - Numbers.ONE && {
        onAnimationEnd,
      })}
    >
      {digits.map<ReactElement>(digitElementMapper).map<ReactElement>(fragmentElementMapper)}
    </VerticalAnimation>
  );

  return (
    <>
      <Optional condition={renderNegativeElement}>
        <VerticalAnimationNegativeElement
          animationDuration={animationDuration}
          negativeCharacter={negativeCharacter}
          negativeCharacterAnimationMode={negativeCharacterAnimationMode}
          animationTimingFunction={animationTimingFunction}
          animationDirection={animationDirection}
          animationDigits={animationDigits.find(({ length }: number[]): boolean => length > Numbers.ONE)!}
          hasSignChanged={hasSignChanged}
        />
      </Optional>
      <NumberElement component="div" {...restProps}>
        {animationDigits.map<ReactElement>(verticalAnimationElementMapper).map<ReactElement>(fragmentElementMapper)}
      </NumberElement>
    </>
  );
};
