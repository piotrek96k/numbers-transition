import {
  Dispatch,
  FC,
  ReactElement,
  ReactNode,
  RefObject,
  SetStateAction,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  AnimationId,
  AnimationNumber,
  AnimationTransition,
  DecimalSeparator,
  DigitGroupSeparator,
  Display,
  HorizontalAnimationDirection,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  Numbers,
  StyledComponents,
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import {
  CubicBezierTuple,
  ElementKeyMapper,
  StyledViewWithProps,
  useAnimationTimingFunctionDirection,
  useCubicBezier,
  useElementKeyMapper,
  useHorizontalAnimationDigits,
  useVerticalAnimationDigits,
} from './NumbersTransition.hooks';
import {
  AnimationTimingFunction,
  Character,
  Digit,
  DigitProps,
  HorizontalAnimation,
  Separator,
  VerticalAnimation,
  VerticalAnimationProps,
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

interface InvalidElementProps<T extends object, U> {
  invalidValue: string;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, T, U>;
}

export const InvalidElement = <T extends object, U>({
  invalidValue,
  characterStyledView,
}: InvalidElementProps<T, U>): ReactNode => <Character {...characterStyledView}>{invalidValue}</Character>;

interface NegativeElementProps<T extends object, U> {
  negativeCharacter: NegativeCharacter;
  visible?: boolean;
  display?: Display;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, T, U>;
}

export const NegativeElement = <T extends object, U>({
  negativeCharacter,
  visible,
  display,
  characterStyledView,
}: NegativeElementProps<T, U>): ReactNode => (
  <Character {...characterStyledView} $visible={visible} $display={display}>
    {negativeCharacter}
  </Character>
);

interface HorizontalAnimationNegativeElementProps<T extends object, U> {
  negativeCharacter: NegativeCharacter;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, T, U>;
}

const HorizontalAnimationNegativeElement = <T extends object, U>(
  props: HorizontalAnimationNegativeElementProps<T, U>,
): ReactNode => <NegativeElement<T, U> {...props} visible={false} />;

interface VerticalAnimationNegativeElementProps<T extends object, U> {
  animationDuration: number;
  negativeCharacter: NegativeCharacter;
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode;
  animationTimingFunction: AnimationTimingFunction;
  animationDirection: VerticalAnimationDirection;
  animationDigits: number[];
  hasSignChanged: boolean;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, T, U>;
}

const VerticalAnimationNegativeElement = <T extends object, U>(
  props: VerticalAnimationNegativeElementProps<T, U>,
): ReactNode => {
  const {
    animationDuration,
    negativeCharacter,
    negativeCharacterAnimationMode,
    animationTimingFunction,
    animationDirection,
    animationDigits,
    hasSignChanged,
    characterStyledView,
  }: VerticalAnimationNegativeElementProps<T, U> = props;

  const [cubicBezier, solve]: CubicBezierTuple = useCubicBezier();

  const negativeElementPropsFactory = (visible: boolean): NegativeElementProps<T, U> => ({
    negativeCharacter,
    visible,
    display: Display.BLOCK,
    characterStyledView,
  });

  const negativeCharacterElementMapper: ElementKeyMapper<boolean> = useElementKeyMapper<
    NegativeElementProps<T, U>,
    boolean
  >(NegativeElement<T, U>, negativeElementPropsFactory);

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

  const inputAnimationProgress: number =
    negativeCharacterAnimationMode === NegativeCharacterAnimationMode.SINGLE
      ? xAxisCubicBezier(solve((value: number): number => yAxisCubicBezier(value) - outputAnimationProgress))
      : Numbers.ZERO;

  const animationTime: number = animationDuration * inputAnimationProgress;

  const animationSwitchTime: number =
    animationDirection === VerticalAnimationDirection.UP ? animationTime : animationDuration - animationTime;

  const animationDelay: number = animationDirection === VerticalAnimationDirection.UP ? -animationTime : Numbers.ZERO;

  const verticalAnimationElement: ReactElement = (
    <VerticalAnimation
      $animationDirection={animationDirection}
      $animationDuration={animationDuration}
      $animationTimingFunction={animationTimingFunction}
      {...(negativeCharacterAnimationMode === NegativeCharacterAnimationMode.SINGLE && {
        $animationDelay: animationDelay,
      })}
    >
      <div>{negativeCharactersVisible.map<ReactElement>(negativeCharacterElementMapper)}</div>
    </VerticalAnimation>
  );

  return (
    <Conditional condition={negativeCharacterAnimationMode === NegativeCharacterAnimationMode.SINGLE}>
      <Switch time={animationSwitchTime} reverse={animationDirection === VerticalAnimationDirection.DOWN}>
        <NegativeElement<T, U> negativeCharacter={negativeCharacter} characterStyledView={characterStyledView} />
        {verticalAnimationElement}
      </Switch>
      {verticalAnimationElement}
    </Conditional>
  );
};

interface NumberElementProps<T extends object, U, V extends object, W, X extends object, Y> {
  precision: number;
  decimalSeparator: DecimalSeparator;
  digitGroupSeparator: DigitGroupSeparator;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, T, U>;
  digitStyledView: StyledViewWithProps<StyledComponents.DIGIT, V, W>;
  separatorStyledView: StyledViewWithProps<StyledComponents.SEPARATOR, X, Y>;
  elementMapper?: ElementKeyMapper<ReactNode>;
  children: ReactNode[];
}

export const NumberElement = <T extends object, U, V extends object, W, X extends object, Y>(
  props: NumberElementProps<T, U, V, W, X, Y>,
): ReactNode => {
  const {
    precision,
    decimalSeparator,
    digitGroupSeparator,
    characterStyledView,
    digitStyledView,
    separatorStyledView,
    elementMapper,
    children,
  }: NumberElementProps<T, U, V, W, X, Y> = props;

  const digitElementMapper: ElementKeyMapper<ReactNode> = useElementKeyMapper<DigitProps<T, U, V, W>, ReactNode>(
    Digit,
    { ...characterStyledView, ...digitStyledView },
  );

  const getSeparatorElement = (index: number, length: number): ReactNode =>
    !((length - index - Math.max(precision, Numbers.ZERO)) % Numbers.THREE) && (
      <Separator {...characterStyledView} {...separatorStyledView}>
        {length - index === precision ? decimalSeparator : digitGroupSeparator}
      </Separator>
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

  return children.map<ReactElement>(elementMapper ?? digitElementMapper).reduce(digitsReducer);
};

interface HorizontalAnimationElementProps<T extends object, U, V extends object, W, X extends object, Y> {
  precision: number;
  animationDuration: number;
  decimalSeparator: DecimalSeparator;
  digitGroupSeparator: DigitGroupSeparator;
  negativeCharacter: NegativeCharacter;
  animationTimingFunction: OrReadOnly<AnimationTimingFunction>;
  animationTransition: AnimationTransition;
  previousValueDigits: number[];
  currentValueDigits: number[];
  previousValue: bigint;
  currentValue: bigint;
  minNumberOfDigits: number;
  maxNumberOfDigits: number;
  numberOfDigitsDifference: number;
  hasSignChanged: boolean;
  numberOfAnimations: AnimationNumber;
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, T, U>;
  digitStyledView: StyledViewWithProps<StyledComponents.DIGIT, V, W>;
  separatorStyledView: StyledViewWithProps<StyledComponents.SEPARATOR, X, Y>;
}

export const HorizontalAnimationElement = <T extends object, U, V extends object, W, X extends object, Y>(
  props: HorizontalAnimationElementProps<T, U, V, W, X, Y>,
): ReactNode => {
  const {
    precision,
    animationDuration,
    decimalSeparator,
    digitGroupSeparator,
    negativeCharacter,
    animationTimingFunction: animationTimingFunctionInput,
    animationTransition,
    previousValueDigits,
    currentValueDigits,
    previousValue,
    currentValue,
    minNumberOfDigits,
    maxNumberOfDigits,
    numberOfDigitsDifference,
    hasSignChanged,
    numberOfAnimations,
    characterStyledView,
    digitStyledView,
    separatorStyledView,
  }: HorizontalAnimationElementProps<T, U, V, W, X, Y> = props;

  const [animationStartWidth, setAnimationStartWidth]: [number, Dispatch<SetStateAction<number>>] = useState<number>(
    Numbers.ZERO,
  );
  const ref: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
  const animationEndWidth: number = ref.current?.getBoundingClientRect().width ?? Numbers.ZERO;

  const sum = (first: number, second: number): number => first + second;
  const subtract = (first: number, second: number): number => first - second;

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

  const numberOfDigits: number = renderZeros ? minNumberOfDigits : maxNumberOfDigits;

  const numberOfDigitGroupSeparators: number = [
    numberOfDigits - Math.max(precision, Numbers.ZERO),
    Math.max(precision, Numbers.ZERO),
  ]
    .map<number>((quantity: number): number => Math.trunc((quantity - Numbers.ONE) / Numbers.THREE))
    .reduce(sum);

  const animationStartIndex: number = [
    ref.current?.children.length ?? Numbers.ZERO,
    [numberOfDigits, numberOfDigitGroupSeparators, precision > Numbers.ZERO ? Numbers.ONE : Numbers.ZERO].reduce(sum),
  ].reduce(subtract);

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

  useLayoutEffect((): void => {
    const reduceAnimationStartWidth = (sum: number, child: Element, index: number) =>
      index >= animationStartIndex ? sum + child.getBoundingClientRect().width : Numbers.ZERO;

    setAnimationStartWidth([...(ref.current?.children ?? [])].reduce<number>(reduceAnimationStartWidth, Numbers.ZERO));
  }, [animationStartIndex]);

  const negativeElement: ReactElement = (
    <Optional condition={renderNegativeElement}>
      <HorizontalAnimationNegativeElement<T, U>
        negativeCharacter={negativeCharacter}
        characterStyledView={characterStyledView}
      />
    </Optional>
  );

  const numberElement: ReactElement = (
    <NumberElement<T, U, V, W, X, Y>
      precision={precision}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      characterStyledView={characterStyledView}
      digitStyledView={digitStyledView}
      separatorStyledView={separatorStyledView}
    >
      {animationDigits}
    </NumberElement>
  );

  return (
    <HorizontalAnimation
      $animationDirection={animationDirection}
      $animationDuration={animationDuration}
      $animationTimingFunction={animationTimingFunction}
      $animationStartWidth={animationStartWidth}
      $animationEndWidth={animationEndWidth}
      id={AnimationId.HORIZONTAL_ANIMATION}
    >
      <div ref={ref}>
        {negativeElement}
        {numberElement}
      </div>
    </HorizontalAnimation>
  );
};

interface VerticalAnimationElementProps<T extends object, U, V extends object, W, X extends object, Y> {
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
  characterStyledView: StyledViewWithProps<StyledComponents.CHARACTER, T, U>;
  digitStyledView: StyledViewWithProps<StyledComponents.DIGIT, V, W>;
  separatorStyledView: StyledViewWithProps<StyledComponents.SEPARATOR, X, Y>;
}

export const VerticalAnimationElement = <T extends object, U, V extends object, W, X extends object, Y>(
  props: VerticalAnimationElementProps<T, U, V, W, X, Y>,
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
    characterStyledView,
    digitStyledView,
    separatorStyledView,
    ...restProps
  }: VerticalAnimationElementProps<T, U, V, W, X, Y> = props;

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

  const verticalAnimationElementMapper: ElementKeyMapper<ReactNode> = useElementKeyMapper<
    VerticalAnimationProps,
    ReactNode
  >(VerticalAnimation, {
    $animationDirection: animationDirection,
    $animationDuration: animationDuration,
    $animationTimingFunction: animationTimingFunction,
  });

  const digitElementMapper: ElementKeyMapper<number> = useElementKeyMapper<DigitProps<T, U, V, W>, number>(Digit, {
    ...characterStyledView,
    ...digitStyledView,
    $display: Display.BLOCK,
  });

  const divisionMapper = (digits: number[], index: number, { length }: number[][]): ReactElement => (
    <div {...(index === length - Numbers.ONE && { id: AnimationId.VERTICAL_ANIMATION })}>
      {digits.map<ReactElement>(digitElementMapper)}
    </div>
  );

  return (
    <>
      <Optional condition={renderNegativeElement}>
        <VerticalAnimationNegativeElement<T, U>
          animationDuration={animationDuration}
          negativeCharacter={negativeCharacter}
          negativeCharacterAnimationMode={negativeCharacterAnimationMode}
          animationTimingFunction={animationTimingFunction}
          animationDirection={animationDirection}
          animationDigits={animationDigits[Numbers.ZERO]}
          hasSignChanged={hasSignChanged}
          characterStyledView={characterStyledView}
        />
      </Optional>
      <NumberElement<T, U, V, W, X, Y>
        {...restProps}
        characterStyledView={characterStyledView}
        digitStyledView={digitStyledView}
        separatorStyledView={separatorStyledView}
        elementMapper={verticalAnimationElementMapper}
      >
        {animationDigits.map<ReactElement>(divisionMapper)}
      </NumberElement>
    </>
  );
};
