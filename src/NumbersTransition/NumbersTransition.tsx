import {
  Dispatch,
  FC,
  MutableRefObject,
  ReactNode,
  RefObject,
  SetStateAction,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Conditional, HorizontalAnimation, VerticalAnimation } from './NumbersTransition.components';
import { DigitElementMapper, DigitsReducer, useDigitElementMapper, useDigitsReducer } from './NumbersTransition.hooks';
import { StyledCharacter, StyledContainer } from './NumbersTransition.styles';
import {
  AnimationTimingFunction,
  AnimationTransition,
  DecimalSeparator,
  DigitGroupSeparator,
  EaseAnimationTimingFunction,
  EmptyCharacter,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  NumberOfAnimations,
} from './NumbersTransition.enums';
import { BigDecimal } from './NumbersTransition.types';

interface NumbersTransitionProps {
  value?: BigDecimal;
  precision?: number;
  horizontalAnimationDuration?: number;
  verticalAnimationDuration?: number;
  negativeCharacterAnimationMode?: NegativeCharacterAnimationMode;
  decimalSeparator?: DecimalSeparator;
  digitGroupSeparator?: DigitGroupSeparator;
  negativeCharacter?: NegativeCharacter;
  animationTimingFunction?: AnimationTimingFunction;
}

const NumbersTransition: FC<NumbersTransitionProps> = (props: NumbersTransitionProps): ReactNode => {
  const {
    value,
    precision = 0,
    horizontalAnimationDuration = 0.5,
    verticalAnimationDuration = 2,
    negativeCharacterAnimationMode = NegativeCharacterAnimationMode.SINGLE,
    digitGroupSeparator = DigitGroupSeparator.SPACE,
    decimalSeparator = digitGroupSeparator === DigitGroupSeparator.COMMA
      ? DecimalSeparator.DOT
      : DecimalSeparator.COMMA,
    negativeCharacter = NegativeCharacter.MINUS,
    animationTimingFunction = [[...EaseAnimationTimingFunction.VALUES[0]], [...EaseAnimationTimingFunction.VALUES[1]]],
  }: NumbersTransitionProps = props;

  const [animationTransition, setAnimationTransition]: [
    AnimationTransition,
    Dispatch<SetStateAction<AnimationTransition>>,
  ] = useState<AnimationTransition>(AnimationTransition.NONE);

  const [previousValueOnAnimationEnd, setPreviousValueOnAnimationEnd]: [
    BigDecimal,
    Dispatch<SetStateAction<BigDecimal>>,
  ] = useState<BigDecimal>(0);

  const [canvasContext, setCanvasContext]: [
    CanvasRenderingContext2D,
    Dispatch<SetStateAction<CanvasRenderingContext2D>>,
  ] = useState<CanvasRenderingContext2D>(document.createElement('canvas').getContext('2d')!);

  const previousValueOnAnimationStartRef: MutableRefObject<BigDecimal> = useRef<BigDecimal>(0);
  const containerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);

  const digitElementMapper: DigitElementMapper = useDigitElementMapper();
  const digitsReducer: DigitsReducer = useDigitsReducer({ precision, decimalSeparator, digitGroupSeparator });

  const isValueValid: boolean = !!`${value}`.match(/^-?(([1-9]\d*)|0)(\.\d+)?$/);

  const subtract = (first: number, second: number): number => first - second;

  const floatingPointFill = (accumulator: string[], currentValue: string, _: number, { length }: string[]) => [
    ...accumulator,
    currentValue,
    ...(length === 1 ? [''] : []),
  ];

  const floatingPointReducer = (integer: string, fraction: string): string => {
    const [start, mid, end, numberOfZeros]: [string, string, string, number] =
      precision > 0
        ? [integer.replace('-', ''), fraction, '', Math.max(precision - fraction.length, 0)]
        : ['', integer.replace('-', ''), fraction, -precision];
    const digits: string = `${start}${mid.slice(0, precision || mid.length) ?? 0}`;
    const restDigits: string = `${mid.slice(precision || mid.length)}${end}`;
    const increase: bigint = BigInt(restDigits) < BigInt('5'.padEnd(restDigits.length, '0')) ? 0n : 1n;
    return `${integer.replace(/\d+/, '')}${BigInt(start) ? '' : start}${(BigInt(digits) + increase) * 10n ** BigInt(numberOfZeros)}`;
  };

  const [previousValueOnAnimationEndCharacters, previousValueOnAnimationStartCharacters, valueCharacters]: string[][] =
    [previousValueOnAnimationEnd, previousValueOnAnimationStartRef.current, isValueValid ? value! : 0].map<string[]>(
      (number: BigDecimal): string[] => [
        ...`${number}`.split('.').reduce<string[]>(floatingPointFill, []).reduce(floatingPointReducer),
      ],
    );

  const [previousValueOnAnimationEndDigits, valueDigits]: number[][] = [
    previousValueOnAnimationEndCharacters,
    valueCharacters,
  ].map<number[]>((characters: string[]): number[] =>
    characters.filter((character: string): boolean => !!character.match(/^\d{1}$/)).map<number>(Number),
  );

  const digitsLengthReducer = (accumulator: number[], currentValue: number, index: number): number[] => [
    ...accumulator,
    currentValue,
    ...(index ? [currentValue - accumulator[accumulator.length - 1]] : []),
  ];

  const [minNumberOfDigits, maxNumberOfDigits, numberOfDigitsDifference]: number[] = [
    previousValueOnAnimationEndDigits,
    valueDigits,
  ]
    .map<number>(({ length }: number[]): number => length)
    .sort(subtract)
    .reduce<number[]>(digitsLengthReducer, []);

  const [previousValueOnAnimationEndBigInt, previousValueOnAnimationStartBigInt, valueBigInt]: bigint[] = [
    previousValueOnAnimationEndCharacters,
    previousValueOnAnimationStartCharacters,
    valueCharacters,
  ].map<bigint>((digits: string[]): bigint => BigInt(digits.join('')));

  const isNewValue: boolean = valueBigInt !== previousValueOnAnimationEndBigInt;
  const restartAnimation: boolean = [valueBigInt, previousValueOnAnimationEndBigInt].every(
    (val: bigint): boolean => val !== previousValueOnAnimationStartBigInt,
  );

  const isSignChange: boolean = (valueBigInt ^ previousValueOnAnimationEndBigInt) < 0;
  const isTheSameNumberOfDigits: boolean = previousValueOnAnimationEndDigits.length === valueDigits.length;

  const isAtLeastTwoAnimations: boolean =
    (previousValueOnAnimationEndDigits.length < valueDigits.length &&
      previousValueOnAnimationEndBigInt < valueBigInt) ||
    (previousValueOnAnimationEndDigits.length > valueDigits.length && previousValueOnAnimationEndBigInt > valueBigInt);

  const numberOfAnimations: NumberOfAnimations = isSignChange
    ? isAtLeastTwoAnimations
      ? NumberOfAnimations.THREE
      : NumberOfAnimations.TWO
    : isTheSameNumberOfDigits
      ? NumberOfAnimations.ONE
      : NumberOfAnimations.TWO;

  const isHorizontalAnimation: boolean =
    (numberOfAnimations === NumberOfAnimations.TWO &&
      (isSignChange
        ? animationTransition === AnimationTransition.NONE
          ? previousValueOnAnimationEndBigInt > valueBigInt
          : previousValueOnAnimationEndBigInt < valueBigInt
        : animationTransition === AnimationTransition.NONE
          ? previousValueOnAnimationEndDigits.length < valueDigits.length
          : previousValueOnAnimationEndDigits.length > valueDigits.length)) ||
    (numberOfAnimations === NumberOfAnimations.THREE && animationTransition !== AnimationTransition.FIRST_TO_SECOND);

  const isHorizontalAnimationInGivenTransition = (transition: AnimationTransition): boolean =>
    numberOfAnimations === NumberOfAnimations.THREE &&
    previousValueOnAnimationEndBigInt < valueBigInt === (animationTransition === transition);

  useLayoutEffect((): void => {
    const newCanvasContext: CanvasRenderingContext2D = document.createElement('canvas').getContext('2d')!;
    newCanvasContext.font =
      [...containerRef.current!.classList]
        .map<string>((className: string): string => window.getComputedStyle(containerRef.current!, className).font)
        .find((font: string): string => font) ?? '';
    setCanvasContext(newCanvasContext);
  }, []);

  useEffect((): void => {
    if (restartAnimation) {
      setPreviousValueOnAnimationEnd(previousValueOnAnimationStartRef.current);
      setAnimationTransition(AnimationTransition.NONE);
    }
    previousValueOnAnimationStartRef.current = isValueValid ? value! : 0;
  }, [value, isValueValid, restartAnimation]);

  const updatePreviousValueOnAnimationEnd = (): void => setPreviousValueOnAnimationEnd(value!);

  const onAnimationEnd = (): void => {
    if (numberOfAnimations === NumberOfAnimations.ONE) {
      updatePreviousValueOnAnimationEnd();
      return;
    }
    if (
      numberOfAnimations === NumberOfAnimations.THREE &&
      animationTransition === AnimationTransition.FIRST_TO_SECOND
    ) {
      setAnimationTransition(AnimationTransition.SECOND_TO_THIRD);
      return;
    }
    if (animationTransition !== AnimationTransition.NONE) {
      updatePreviousValueOnAnimationEnd();
      setAnimationTransition(AnimationTransition.NONE);
      return;
    }
    setAnimationTransition(AnimationTransition.FIRST_TO_SECOND);
  };

  const getNegativeElement = (): ReactNode =>
    ((!isSignChange && valueBigInt < 0) ||
      (isHorizontalAnimation && isHorizontalAnimationInGivenTransition(AnimationTransition.NONE))) && (
      <StyledCharacter>{negativeCharacter}</StyledCharacter>
    );

  const horizontalAnimation: JSX.Element = (
    <HorizontalAnimation
      precision={precision}
      animationDuration={horizontalAnimationDuration}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      negativeCharacter={negativeCharacter}
      animationTimingFunction={animationTimingFunction}
      animationTransition={animationTransition}
      canvasContext={canvasContext}
      previousValueDigits={previousValueOnAnimationEndDigits}
      currentValueDigits={valueDigits}
      minNumberOfDigits={minNumberOfDigits}
      maxNumberOfDigits={maxNumberOfDigits}
      numberOfDigitsDifference={numberOfDigitsDifference}
      previousValue={previousValueOnAnimationEndBigInt}
      currentValue={valueBigInt}
      isSignChange={isSignChange}
      numberOfAnimations={numberOfAnimations}
      isHorizontalAnimationInGivenTransition={isHorizontalAnimationInGivenTransition}
    />
  );

  const verticalAnimation: JSX.Element = (
    <VerticalAnimation
      precision={precision}
      animationDuration={verticalAnimationDuration}
      decimalSeparator={decimalSeparator}
      digitGroupSeparator={digitGroupSeparator}
      negativeCharacterAnimationMode={negativeCharacterAnimationMode}
      negativeCharacter={negativeCharacter}
      animationTimingFunction={animationTimingFunction}
      previousValue={previousValueOnAnimationEndBigInt}
      currentValue={valueBigInt}
      maxNumberOfDigits={maxNumberOfDigits}
      isSignChange={isSignChange}
    />
  );

  const getAnimation = (): JSX.Element => (
    <Conditional condition={isHorizontalAnimation}>
      {horizontalAnimation}
      {verticalAnimation}
    </Conditional>
  );

  const getEmptyValue = (): JSX.Element => <StyledCharacter>{EmptyCharacter.VALUE}</StyledCharacter>;

  const getNumericValue = (): JSX.Element =>
    previousValueOnAnimationEndDigits.map<JSX.Element>(digitElementMapper).reduce(digitsReducer);

  const getValue: () => JSX.Element = isValueValid ? getNumericValue : getEmptyValue;

  const getContent: () => JSX.Element | JSX.Element[] =
    isValueValid && isNewValue && !restartAnimation ? getAnimation : getValue;

  return (
    <StyledContainer ref={containerRef} onAnimationEnd={onAnimationEnd}>
      {getNegativeElement()}
      {getContent()}
    </StyledContainer>
  );
};

export default NumbersTransition;
