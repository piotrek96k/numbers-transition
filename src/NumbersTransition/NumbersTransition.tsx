import {
  Dispatch,
  FC,
  MutableRefObject,
  ReactNode,
  RefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  DigitElementMapper,
  DigitsReducer,
  GetAnimationTimingFunction,
  GetHorizontalAnimation,
  GetVerticalAnimation,
  useAnimationTimingFunction,
  useDigitElementMapper,
  useDigitsReducer,
  useHorizontalAnimation,
  useVerticalAnimation,
} from './NumbersTransition.hooks';
import { Character, Container } from './NumbersTransition.styles';
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

  const previousValueOnAnimationStartRef: MutableRefObject<BigDecimal> = useRef<BigDecimal>(0);
  const containerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);

  const getAnimationTimingFunction: GetAnimationTimingFunction = useAnimationTimingFunction(animationTimingFunction);
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
    return `${integer.replace(/\d+/, '')}${(BigInt(digits) + increase) * 10n ** BigInt(numberOfZeros)}`;
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

  const getHorizontalAnimation: GetHorizontalAnimation = useHorizontalAnimation({
    precision,
    animationDuration: horizontalAnimationDuration,
    decimalSeparator,
    digitGroupSeparator,
    negativeCharacter,
    animationTransition,
    containerRef,
    previousValueDigits: previousValueOnAnimationEndDigits,
    currentValueDigits: valueDigits,
    minNumberOfDigits,
    maxNumberOfDigits,
    numberOfDigitsDifference,
    previousValue: previousValueOnAnimationEndBigInt,
    currentValue: valueBigInt,
    isSignChange,
    numberOfAnimations,
    isHorizontalAnimationInGivenTransition,
    getAnimationTimingFunction,
    digitElementMapper,
    digitsReducer,
  });

  const getVerticalAnimation: GetVerticalAnimation = useVerticalAnimation({
    animationDuration: verticalAnimationDuration,
    negativeCharacterAnimationMode,
    negativeCharacter,
    previousValue: previousValueOnAnimationEndBigInt,
    currentValue: valueBigInt,
    maxNumberOfDigits,
    isSignChange,
    getAnimationTimingFunction,
    digitElementMapper,
    digitsReducer,
  });

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
      <Character>{negativeCharacter}</Character>
    );

  const getAnimation: () => JSX.Element | JSX.Element[] = isHorizontalAnimation
    ? getHorizontalAnimation
    : getVerticalAnimation;

  const getEmptyValue = (): JSX.Element => <Character>{EmptyCharacter.VALUE}</Character>;

  const getNumericValue = (): JSX.Element =>
    previousValueOnAnimationEndDigits.map<JSX.Element>(digitElementMapper).reduce(digitsReducer);

  const getValue: () => JSX.Element = isValueValid ? getNumericValue : getEmptyValue;

  const getContent: () => JSX.Element | JSX.Element[] =
    isValueValid && isNewValue && !restartAnimation ? getAnimation : getValue;

  return (
    <Container ref={containerRef} onAnimationEnd={onAnimationEnd}>
      {getNegativeElement()}
      {getContent()}
    </Container>
  );
};

export default NumbersTransition;
