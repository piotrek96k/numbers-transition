import type { ArgTypes, Meta, ReactRenderer, StoryObj } from '@storybook/react-vite';
import type { InputType, PartialStoryFn, StoryContext } from 'storybook/internal/types';
import { ComponentProps, PointerEvent, ReactNode, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { RuleSet, css } from 'styled-components';
import type {
  EnumType,
  EnumValue,
  Maybe,
  Nullable,
  Optional,
  ReactState,
  Remove,
  Select,
  SetState,
  UncheckedBigDecimal,
} from './NumbersTransition.types';
import NumbersTransition from './NumbersTransition';
import {
  AnimationDirection,
  AnimationFillMode,
  AnimationId,
  AnimationInterruptionMode,
  AnimationNumber,
  AnimationTimingFunction,
  AnimationType,
  BorderStyle,
  BoxSizing,
  Color,
  CssUnit,
  Cursor,
  DecimalSeparatorCharacter,
  DigitGroupSeparatorCharacter,
  DragAndDropForwardProp,
  DragAndDropVariableName,
  Integer,
  NegativeCharacter,
  NegativeCharacterAnimationMode,
  OptimizationStrategy,
  Pattern,
  StepPosition,
  StorybookInputType,
  Text,
  TouchAction,
  UserSelect,
  VariableName,
} from './NumbersTransition.enums';
import { AnimationDuration, TotalAnimationDuration, View } from './NumbersTransition.hooks';
import {
  Animation,
  AnimationFactory,
  Character,
  CssRuleFactory,
  HorizontalAnimation,
  NumbersTransitionExecutionContext,
  NumbersTransitionTheme,
  VerticalAnimation,
} from './NumbersTransition.styles';

type NumbersTransitionComponent<
  K extends object = object,
  L = unknown,
  M extends object = object,
  N = unknown,
  O extends object = object,
  P = unknown,
  Q extends object = object,
  R = unknown,
  S extends object = object,
  T = unknown,
  U extends object = object,
  V = unknown,
  W extends object = object,
  X = unknown,
  Y extends object = object,
  Z = unknown,
> = typeof NumbersTransition<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>;

type SelectType =
  | typeof DigitGroupSeparatorCharacter
  | typeof DecimalSeparatorCharacter
  | typeof NegativeCharacter
  | typeof NegativeCharacterAnimationMode
  | typeof AnimationInterruptionMode
  | typeof OptimizationStrategy;

type SelectTypes = {
  [K in keyof Select<Required<ComponentProps<NumbersTransitionComponent>>, EnumValue<SelectType>>]: EnumType<
    SelectType,
    Required<ComponentProps<NumbersTransitionComponent>>[K]
  >;
};

type ComponentArgTypes = Partial<ArgTypes<ComponentProps<NumbersTransitionComponent>>>;

type Story<
  K extends object = object,
  L = unknown,
  M extends object = object,
  N = unknown,
  O extends object = object,
  P = unknown,
  Q extends object = object,
  R = unknown,
  S extends object = object,
  T = unknown,
  U extends object = object,
  V = unknown,
  W extends object = object,
  X = unknown,
  Y extends object = object,
  Z = unknown,
> = StoryObj<NumbersTransitionComponent<K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>>;

const mapInputType = ([fieldName, enumObject]: [string, SelectType]): [string, InputType] => [
  fieldName,
  { options: enumObject?.keys(), mapping: enumObject, control: { type: StorybookInputType.Select } },
];

const meta: Meta<typeof NumbersTransition> = { component: NumbersTransition };

const inputTypes: SelectTypes = {
  digitGroupSeparator: DigitGroupSeparatorCharacter,
  decimalSeparator: DecimalSeparatorCharacter,
  negativeCharacter: NegativeCharacter,
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode,
  animationInterruptionMode: AnimationInterruptionMode,
  optimizationStrategy: OptimizationStrategy,
};

const argTypes: ComponentArgTypes = inputTypes.map<SelectType, InputType>(mapInputType);

const basicEffectCss: RuleSet<object> = css<object>`
  font-size: ${Integer.Three}${CssUnit.Rem};
  color: ${Color.Yellow};
`;

const basicEffectArgs: ComponentProps<NumbersTransitionComponent> = {
  initialValue: Integer.Zero,
  value: Array.range(Integer.Ten).reduce<string>((text: string, index: number): string => `${index}${text}${index}`, Text.Dot),
  precision: Integer.Ten,
  decimalSeparator: DecimalSeparatorCharacter.Comma,
  digitGroupSeparator: DigitGroupSeparatorCharacter.Space,
  negativeCharacter: NegativeCharacter.Minus,
  negativeCharacterAnimationMode: NegativeCharacterAnimationMode.Single,
  animationDuration: { horizontalAnimation: Integer.TwoThousand, verticalAnimation: Integer.FiveThousand },
  animationTimingFunction: AnimationTimingFunction.Ease,
  animationInterruptionMode: AnimationInterruptionMode.Interrupt,
  optimizationStrategy: OptimizationStrategy.None,
  renderBatchSize: Integer.TwoThousandFiveHundred,
  view: { css: basicEffectCss },
};

export const BasicEffect: Story = { argTypes, args: basicEffectArgs };

const stepsArgs: ComponentProps<NumbersTransitionComponent> = {
  ...basicEffectArgs,
  animationTimingFunction: {
    horizontalAnimation: { steps: Integer.Five, stepPosition: StepPosition.JumpEnd },
    verticalAnimation: { steps: Integer.Twenty, stepPosition: StepPosition.JumpEnd },
  },
};

export const Steps: Story = { argTypes, args: stepsArgs };

const marginCss: RuleSet<object> = css<object>`
  ${basicEffectCss};
  margin: ${Integer.One}${CssUnit.Rem};
  > :not(:last-child),
  [id^=${AnimationId.HorizontalAnimation}] > * :not(:last-child) {
    margin-right: ${Integer.Five / Integer.Sixteen}${CssUnit.Rem};
  }
  [id^=${AnimationId.VerticalAnimation}] :not(:last-child),
  :has(~ * > [id^=${AnimationId.VerticalAnimation}]) > * :not(:last-child) {
    padding-bottom: ${Integer.Two}${CssUnit.Rem};
  }
`;

const marginArgs: ComponentProps<NumbersTransitionComponent> = { ...basicEffectArgs, view: { css: marginCss } };

export const Margin: Story = { argTypes, args: marginArgs };

const border: string = `${Integer.Three}${CssUnit.Pixel} ${BorderStyle.Solid} ${Color.Blue}`;

const borderCss: RuleSet<object> = css<object>`
  ${basicEffectCss}
  height: calc(${Integer.One}${CssUnit.LineHeight} + ${Integer.Six}${CssUnit.Pixel});
  > * {
    border-top: ${border};
  }
  > :first-child {
    border-left: ${border};
  }
  > *,
  ${HorizontalAnimation} > * :not(:last-child) {
    border-right: ${border};
  }
  ${Character},
  ${VerticalAnimation} {
    border-bottom: ${border};
  }
  ${VerticalAnimation} {
    box-sizing: ${BoxSizing.BorderBox};
  }
`;

const borderArgs: ComponentProps<NumbersTransitionComponent> = { ...basicEffectArgs, view: { css: borderCss } };

export const Border: Story = { argTypes, args: borderArgs };

const opacityKeyframeFunction = (keyframeValue: number): RuleSet<object> => css<object>`
  opacity: ${keyframeValue};
`;

const opacityAnimation: Animation<object, number> = {
  keyframeFunction: opacityKeyframeFunction,
  keyframes: [Integer.One, Integer.One / Integer.Ten, Integer.One],
};

const opacityAnimationFactory: AnimationFactory<object, number> = ({
  theme: { numberOfAnimations },
}: NumbersTransitionExecutionContext): Maybe<Animation<object, number>> => numberOfAnimations && opacityAnimation;

const opacityAnimationCss: RuleSet<object> = css<object>`
  ${basicEffectCss};
  animation-fill-mode: ${AnimationFillMode.Forwards};
  animation-duration: var(${VariableName.TotalAnimationDuration});
  animation-iteration-count: ${Integer.One};
`;

const opacityAnimationArgs: ComponentProps<NumbersTransitionComponent<object, number>> = {
  ...basicEffectArgs,
  view: { css: opacityAnimationCss, animation: opacityAnimationFactory },
};

export const OpacityAnimation: Story<object, number> = { argTypes, args: opacityAnimationArgs };

const rotateKeyframeFunction = (keyframeValue: number): RuleSet<object> => css<object>`
  transform: rotateY(${keyframeValue}${CssUnit.Turn});
`;

const getHorizontalRotateKeyframes = ({
  animationNumber,
  animationDuration,
  totalAnimationDuration,
}: Remove<NumbersTransitionTheme, AnimationType>): number[] =>
  animationNumber === AnimationNumber.One
    ? [Integer.Zero, animationDuration / totalAnimationDuration / Integer.Two]
    : [(Integer.One + (totalAnimationDuration - animationDuration) / totalAnimationDuration) / Integer.Two, Integer.One];

const horizontalRotateAnimationFactory: AnimationFactory<object, number> = ({
  theme: { animationType, ...restTheme },
}: NumbersTransitionExecutionContext): Maybe<Animation<object, number>> =>
  animationType === AnimationType.Horizontal && {
    keyframeFunction: rotateKeyframeFunction,
    keyframes: getHorizontalRotateKeyframes(restTheme),
  };

const getVerticalRotateKeyframes = ({
  animationNumber,
  horizontalAnimationDuration,
  verticalAnimationDuration,
  totalAnimationDuration,
}: Remove<NumbersTransitionTheme, AnimationType>): number[] =>
  animationNumber === AnimationNumber.One
    ? [Integer.Zero, verticalAnimationDuration / totalAnimationDuration]
    : [
        horizontalAnimationDuration / totalAnimationDuration,
        (horizontalAnimationDuration + verticalAnimationDuration) / totalAnimationDuration,
      ];

// prettier-ignore
const mapVerticalRotateKeyframes = ({ animationDirection, columnLength, rowIndex }: Remove<NumbersTransitionTheme, AnimationType>): ((value: number) => number) =>
  (value: number): number => 
    value + (columnLength! / Integer.Two === rowIndex! + Integer.One / Integer.Two
      ? Integer.One / Integer.Two
      : ((animationDirection !== AnimationDirection.Normal).int + Math.min(rowIndex!, columnLength! - rowIndex!)) % Integer.Two);

const verticalRotateAnimationFactory: AnimationFactory<object, number> = ({
  theme: { animationType, columnLength, ...restTheme },
}: NumbersTransitionExecutionContext): Maybe<Animation<object, number>> =>
  animationType === AnimationType.Vertical &&
  columnLength! > Integer.One && {
    keyframeFunction: rotateKeyframeFunction,
    keyframes: getVerticalRotateKeyframes(restTheme).mapEach<number>(
      mapVerticalRotateKeyframes({ ...restTheme, columnLength }),
      (value: number): number => value / Integer.Two,
    ),
  };

const getInitialRotation = ({
  animationNumber,
  animationType,
  horizontalAnimationDuration,
  verticalAnimationDuration,
  totalAnimationDuration,
}: NumbersTransitionTheme): number =>
  [AnimationNumber.Three, AnimationNumber.Two]
    .zip<[AnimationNumber, AnimationNumber], [number, number]>(
      (horizontalAnimationDuration + verticalAnimationDuration) / totalAnimationDuration,
      (animationType === AnimationType.Horizontal ? verticalAnimationDuration : horizontalAnimationDuration) / totalAnimationDuration,
    )
    .findMap<number>(
      ([animation]: [AnimationNumber, number]): boolean => animation === animationNumber,
      ([, value]: [AnimationNumber, number]): number => value,
      Integer.Zero,
    );

const rotateAnimationCssFactory: CssRuleFactory<object> = ({ theme }: NumbersTransitionExecutionContext): RuleSet<object> => css<object>`
  ${rotateKeyframeFunction(getInitialRotation(theme) / Integer.Two)};
  animation-fill-mode: ${AnimationFillMode.Forwards};
  animation-duration: var(${VariableName.AnimationDuration});
  animation-iteration-count: ${Integer.One};
`;

const rotateAnimationArgs: ComponentProps<NumbersTransitionComponent<object, unknown, object, unknown, object, number>> = {
  ...basicEffectArgs,
  digitView: { css: rotateAnimationCssFactory, animation: [horizontalRotateAnimationFactory, verticalRotateAnimationFactory] },
};

export const RotateAnimation: Story<object, unknown, object, unknown, object, number> = { argTypes, args: rotateAnimationArgs };

type DragAndDropElementsTuple = [string[], HTMLElement[], DOMRect[], number[], number[], number[]];

interface DragAndDropContainerProps {
  onAnimationEndCapture: () => void;
}

const dragAndDropCss: RuleSet<object> = css<object>`
  ${basicEffectCss};
  user-select: ${UserSelect.None};
  touch-action: ${TouchAction.None};
`;

interface DragAndDropDigitProps {
  isDragging: boolean;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
}

const dragAndDropDigitCssFactory: CssRuleFactory<Partial<DragAndDropDigitProps>> = ({
  theme: { numberOfAnimations },
}: NumbersTransitionExecutionContext): Maybe<RuleSet<Partial<DragAndDropDigitProps>>> =>
  numberOfAnimations === AnimationNumber.Zero &&
  css<Partial<DragAndDropDigitProps>>`
    cursor: ${({ isDragging }: Partial<DragAndDropDigitProps>): string => (isDragging ? Cursor.Grabbing : Cursor.Grab)};
    transform: translateX(var(${DragAndDropVariableName.Transform}));
    transition: transform ${Integer.OneHundred}${CssUnit.Millisecond};
  `;

type DragAndDropNumbersTransitionProps = ComponentProps<
  NumbersTransitionComponent<Partial<DragAndDropContainerProps>, unknown, object, unknown, Partial<DragAndDropDigitProps>>
>;

interface DragAndDropDigitsProps {
  Story: PartialStoryFn<ReactRenderer, DragAndDropNumbersTransitionProps>;
  context: StoryContext<ReactRenderer, DragAndDropNumbersTransitionProps>;
}

const DragAndDropDigits = (props: DragAndDropDigitsProps): ReactNode => {
  const {
    Story,
    context: {
      args: { value: providedValue, precision = Integer.Zero, animationDuration: providedAnimationDuration, ...restArgs },
    },
  }: DragAndDropDigitsProps = props;

  const [activePointer, setActivePointer]: ReactState<Nullable<number>> = useState<Nullable<number>>(null);
  const [dragValue, setDragValue]: ReactState<Nullable<string>> = useState<Nullable<string>>(null);

  const baseValue: RefObject<Optional<UncheckedBigDecimal>> = useRef<Optional<UncheckedBigDecimal>>(providedValue);
  const timeout: RefObject<Optional<NodeJS.Timeout>> = useRef<Optional<NodeJS.Timeout>>(undefined);

  const elements: RefObject<DragAndDropElementsTuple> = useRef<DragAndDropElementsTuple>([[], [], [], [], [], []]);

  const dragIndex: RefObject<number> = useRef<number>(Integer.Zero);
  const startOffset: RefObject<number> = useRef<number>(Integer.Zero);

  const updateTransform = useCallback<(transform: (index: number) => number) => (element: HTMLElement, index?: number) => void>(
    (transform: (index: number) => number): ((element: HTMLElement, index?: number) => void) =>
      ({ style }: HTMLElement, index: number = Integer.Zero): void =>
        style.setProperty(DragAndDropVariableName.Transform, `${transform(index)}${CssUnit.Pixel}`),
    [],
  );

  useEffect((): void => elements.current[Integer.One].forEach(updateTransform((): number => Integer.Zero)), [precision, updateTransform]);

  useEffect(
    (): void =>
      ((): unknown => (baseValue.current = providedValue)).invokeWhen<undefined, () => unknown>(
        dragValue === null && !timeout.current,
        undefined,
      ),
    [providedValue, dragValue],
  );

  const filterElements = (child: Element): child is HTMLElement => child instanceof HTMLElement && Pattern.Digit.test(child.textContent);

  const groupElements = ([unorderedDigits, digits]: [string[], HTMLElement[]], digit: HTMLElement): [string[], HTMLElement[]] => [
    unorderedDigits.append(digit.textContent),
    digits.append(digit),
  ];

  const reduceElements = (
    [digits, rects, centers, transforms, currentTransforms]: [HTMLElement[], DOMRect[], number[], number[], number[]],
    [digit, rect]: [HTMLElement, DOMRect],
  ): [HTMLElement[], DOMRect[], number[], number[], number[]] => [
    digits.append(digit),
    rects.append(rect),
    centers.append(rect.left + rect.width / Integer.Two),
    transforms.append(digit.style.transformProperty.number || Integer.Zero),
    currentTransforms.append(Integer.Zero),
  ];

  const readValue = (digits: string[]): string => {
    const inputValue: string = `${baseValue.current}`;
    const hasMinus: boolean = inputValue[Integer.Zero] === Text.Minus;
    const index: number = [...inputValue].findIndex((character: string): boolean => Pattern.DecimalSeparator.test(character));
    const separatorIndex: number = (index === Integer.MinusOne ? inputValue.length : index) - hasMinus.int;

    return [...(hasMinus ? [Text.Minus] : []), ...(precision > Integer.Zero ? digits.insert(Text.Dot, separatorIndex) : digits)].collapse();
  };

  const isZero = ({ number }: string): boolean => !number;

  const scheduleUpdate = (value: string): NodeJS.Timeout =>
    (timeout.current = setTimeout(
      (): void => [(): void => (timeout.current = undefined), (): void => setDragValue(value)].forEach(Function.call<() => void>),
      Integer.TwoThousand,
    ));

  const onPointerDown = ({ currentTarget, clientX, pointerId }: PointerEvent<HTMLElement>): void => {
    clearTimeout(timeout.current);
    timeout.current = undefined;
    currentTarget.setPointerCapture(pointerId);

    const currentElements: DragAndDropElementsTuple = [...currentTarget.parentElement!.children]
      .filter<HTMLElement>(filterElements)
      .reduce<[string[], HTMLElement[]]>(groupElements, [[], []])
      .pipe<DragAndDropElementsTuple>(([unorderedDigits, digits]: [string[], HTMLElement[]]): DragAndDropElementsTuple => [
        unorderedDigits,
        ...digits
          .map<[HTMLElement, DOMRect]>((digit: HTMLElement): [HTMLElement, DOMRect] => [digit, digit.getBoundingClientRect()])
          .sort(([, first]: [HTMLElement, DOMRect], [, second]: [HTMLElement, DOMRect]): number => first.left - second.left)
          .reduce<[HTMLElement[], DOMRect[], number[], number[], number[]]>(reduceElements, [[], [], [], [], []]),
      ]);

    elements.current = currentElements;
    dragIndex.current = currentElements[Integer.One].indexOf(currentTarget);
    startOffset.current = clientX;
    setActivePointer(pointerId);
  };

  const onPointerMove = ({ clientX }: PointerEvent<HTMLElement>): void => {
    const [, digits, rects, centers, transforms, lastTransforms]: DragAndDropElementsTuple = elements.current;
    const dragIdx: number = dragIndex.current;
    const min: number = centers.at(Integer.Zero)! - centers[dragIdx];
    const max: number = centers.at(Integer.MinusOne)! - centers[dragIdx];

    const dragOffset: number = Math.max(Math.min(clientX - startOffset.current, max), min);
    const dragCenter: number = centers[dragIdx] + dragOffset;
    const dragCenterOffset: number = rects[dragIdx].width / Integer.Two;

    const getPreviousDigitTransform = (index: number): number =>
      centers[index] > dragCenter - dragCenterOffset || centers[index] + lastTransforms[index] > dragCenter + dragCenterOffset
        ? centers[index + Integer.One] - centers[index]
        : Integer.Zero;

    const getNextDigitTransform = (index: number): number =>
      centers[index] < dragCenter + dragCenterOffset || centers[index] + lastTransforms[index] < dragCenter - dragCenterOffset
        ? centers[index - Integer.One] - centers[index]
        : Integer.Zero;

    const getTransform = (index: number): number =>
      [index < dragIdx, index > dragIdx]
        .zip<[boolean, boolean], [(index: number) => number, (index: number) => number]>(getPreviousDigitTransform, getNextDigitTransform)
        .findMap<number>(
          ([condition]: [boolean, (index: number) => number]): boolean => condition,
          ([, transform]: [boolean, (index: number) => number]): number => transform(index),
          dragOffset,
        );

    const currentTransforms: number[] = digits.map<number>((_: HTMLElement, index: number): number => getTransform(index));
    elements.current[Integer.Five] = currentTransforms;
    digits.forEach(updateTransform((index: number): number => transforms[index] + currentTransforms[index]));
  };

  const onPointerUp = ({ currentTarget, pointerId }: PointerEvent<HTMLElement>): void => {
    const [unorderedDigits, digits, , centers, transforms, currentTransforms]: DragAndDropElementsTuple = elements.current;
    const dragIdx: number = dragIndex.current;

    const reorderedDigitsIndexes: [string, number][] = digits
      .map<[string, number]>(({ textContent }: HTMLElement, index: number): [string, number] => [textContent, index])
      .sort(
        ([, first]: [string, number], [, second]: [string, number]): number =>
          centers[first] + currentTransforms[first] - (centers[second] + currentTransforms[second]),
      );

    const freeIndex: number = reorderedDigitsIndexes.findIndex(([, index]: [string, number]): boolean => index === dragIdx);
    const reorderedDigits: string[] = reorderedDigitsIndexes.map<string>(([digit]: [string, number]): string => digit);
    const newValue: string = readValue(reorderedDigits);

    const isNewValueValid: boolean =
      Pattern.BigDecimal.test(newValue) &&
      (precision >= Integer.Zero ||
        (reorderedDigits.slice(digits.length + precision).every(isZero) && dragIdx < digits.length + precision));

    const previousDigits: Optional<string[]> = isNewValueValid
      ? undefined
      : digits.map<string>(({ textContent }: HTMLElement): string => textContent);

    [
      (): void =>
        currentTarget.pipe<HTMLElement, void>(updateTransform((): number => centers[freeIndex] - centers[dragIdx] + transforms[dragIdx])),
      (): void => digits.forEach(updateTransform((index: number): number => transforms[index])),
    ]
      .zip<[() => void, () => void], [boolean, boolean]>(isNewValueValid, true)
      .findMap<void>(
        ([, condition]: [() => void, boolean]): boolean => condition,
        ([callback]: [() => void, boolean]): void => callback(),
      );

    scheduleUpdate.invokeWhen<undefined, (value: string) => NodeJS.Timeout>(
      (previousDigits ?? reorderedDigits).some((digit: string, idx: number): boolean => digit !== unorderedDigits[idx]),
      undefined,
      previousDigits?.pipe<string>(readValue) ?? newValue,
    );

    currentTarget.releasePointerCapture(pointerId);
    setActivePointer(null);
  };

  const onPointerCancel = (): void => setActivePointer(null);

  const isActivePointer = ({ pointerId }: PointerEvent<HTMLElement>): boolean => pointerId === activePointer;

  const forwardProps = ({ numberOfAnimations }: NumbersTransitionTheme): DragAndDropForwardProp[] =>
    numberOfAnimations === AnimationNumber.Zero
      ? [
          DragAndDropForwardProp.OnPointerDown,
          DragAndDropForwardProp.OnPointerMove,
          DragAndDropForwardProp.OnPointerUp,
          DragAndDropForwardProp.OnPointerCancel,
        ]
      : [DragAndDropForwardProp.OnAnimationEndCapture];

  const value: Optional<UncheckedBigDecimal> = timeout.current ? baseValue.current : (dragValue ?? providedValue);

  const animationDuration: Optional<AnimationDuration | TotalAnimationDuration> =
    dragValue === null ? providedAnimationDuration : { horizontalAnimation: Integer.Zero, verticalAnimation: Integer.Zero };

  const view: View<Partial<DragAndDropContainerProps>, unknown> = {
    css: dragAndDropCss,
    viewProps: {
      onAnimationEndCapture: (): void => setDragValue.callWhen<undefined, SetState<Nullable<string>>>(dragValue !== null, undefined, null),
    },
  };

  const digitView: View<Partial<DragAndDropDigitProps>, unknown> = {
    css: dragAndDropDigitCssFactory,
    viewProps: {
      isDragging: activePointer !== null,
      onPointerDown: onPointerDown.bindWhen<undefined, (event: PointerEvent<HTMLElement>) => void>(activePointer === null, undefined),
      onPointerMove: onPointerMove.bindWhen<undefined, (event: PointerEvent<HTMLElement>) => void>(isActivePointer, undefined),
      onPointerUp: onPointerUp.bindWhen<undefined, (event: PointerEvent<HTMLElement>) => void>(isActivePointer, undefined),
      onPointerCancel: onPointerCancel.bindWhen<undefined, (event: PointerEvent<HTMLElement>) => void>(isActivePointer, undefined),
    },
  };

  return <Story args={{ ...restArgs, value, precision, animationDuration, view, digitView, forwardProps }} />;
};

export const DragAndDrop: Story<Partial<DragAndDropContainerProps>, unknown, object, unknown, Partial<DragAndDropDigitProps>> = {
  argTypes,
  args: { ...basicEffectArgs, animationInterruptionMode: AnimationInterruptionMode.Continue },
  decorators: [
    (
      Story: PartialStoryFn<ReactRenderer, DragAndDropNumbersTransitionProps>,
      context: StoryContext<ReactRenderer, DragAndDropNumbersTransitionProps>,
    ) => <DragAndDropDigits Story={Story} context={context} />,
  ],
};

export default meta;
