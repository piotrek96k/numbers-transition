import { ComponentProps, Dispatch, PointerEvent, ReactNode, RefObject, SetStateAction, useEffect, useRef, useState } from 'react';
import { RuleSet, css } from 'styled-components';
import type { InputType, PartialStoryFn, StoryContext } from 'storybook/internal/types';
import type { ArgTypes, Meta, ReactRenderer, StoryObj } from '@storybook/react-vite';
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
  RegularExpression,
  StepPosition,
  StorybookInputType,
  Text,
  TouchAction,
  UserSelect,
  VariableName,
} from './NumbersTransition.enums';
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
import type { EnumType, EnumValue, Falsy, Nullable, Optional, Remove, Select, UncheckedBigDecimal } from './NumbersTransition.types';
import { AnimationDuration, TotalAnimationDuration, View } from './NumbersTransition.hooks';

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
  value: [...Array<unknown>(Integer.Ten).keys()].reduce<string>((txt: string, index: number): string => `${index}${txt}${index}`, Text.Dot),
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
}: NumbersTransitionExecutionContext): Animation<object, number> | Falsy => numberOfAnimations && opacityAnimation;

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
}: NumbersTransitionExecutionContext): Animation<object, number> | Falsy =>
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

// prettier-ignore
const verticalRotateAnimationFactory: AnimationFactory<object, number> = ({
  theme: { animationType, columnLength, ...restTheme },
}: NumbersTransitionExecutionContext): Animation<object, number> | Falsy =>
  animationType === AnimationType.Vertical && columnLength! > Integer.One && {
    keyframeFunction: rotateKeyframeFunction,
    keyframes: getVerticalRotateKeyframes(restTheme).mapEach<[number, number]>(
      mapVerticalRotateKeyframes({ ...restTheme, columnLength }),
      (value: number): number => value / Integer.Two,
    ),
  };

// prettier-ignore
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
}: NumbersTransitionExecutionContext): RuleSet<Partial<DragAndDropDigitProps>> | Falsy =>
  numberOfAnimations === AnimationNumber.Zero &&
  css<Partial<DragAndDropDigitProps>>`
    cursor: ${({ isDragging }: NumbersTransitionExecutionContext & Partial<DragAndDropDigitProps>): string =>
      isDragging ? Cursor.Grabbing : Cursor.Grab};
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
      args: { value: providedValue, animationDuration: providedAnimationDuration, ...restArgs },
    },
  }: DragAndDropDigitsProps = props;

  const [activePointer, setActivePointer]: [Nullable<number>, Dispatch<SetStateAction<Nullable<number>>>] =
    useState<Nullable<number>>(null);
  const [dragValue, setDragValue]: [Nullable<string>, Dispatch<SetStateAction<Nullable<string>>>] = useState<Nullable<string>>(null);

  const baseValue: RefObject<Optional<UncheckedBigDecimal>> = useRef<Optional<UncheckedBigDecimal>>(providedValue);
  const timeout: RefObject<Optional<NodeJS.Timeout>> = useRef<Optional<NodeJS.Timeout>>(undefined);

  const elements: RefObject<[HTMLElement[], DOMRect[], number[], number[], number[]]> = useRef<
    [HTMLElement[], DOMRect[], number[], number[], number[]]
  >([[], [], [], [], []]);

  const dragIndex: RefObject<number> = useRef<number>(Integer.Zero);
  const startOffset: RefObject<number> = useRef<number>(Integer.Zero);

  useEffect(
    (): void =>
      [(): unknown => (baseValue.current = providedValue)]
        .when(dragValue === null && !timeout.current)
        .forEach(Function.call<() => unknown>),
    [providedValue, dragValue],
  );

  const filterElements = (child: Element): child is HTMLElement =>
    child instanceof HTMLElement && RegularExpression.Digit.test(child.textContent);

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

  const updateTransform =
    (transform: (index: number) => number): ((element: HTMLElement, index?: number) => void) =>
    ({ style }: HTMLElement, index: number = Integer.Zero): void =>
      style.setProperty(DragAndDropVariableName.Transform, `${transform(index)}${CssUnit.Pixel}`);

  const reduceToNewValue =
    (reorderedDigits: string[]): ((acc: [string[], number], character: string) => [string[], number]) =>
    ([characters, index]: [string[], number], character: string): [string[], number] =>
      RegularExpression.Digit.test(character)
        ? [characters.append(reorderedDigits[index]), index + Integer.One]
        : [characters.append(character), index];

  const readNewValue = (digits: string[]): string =>
    [...`${baseValue.current}`]
      .reduce<[string[], number]>(reduceToNewValue(digits), [[], Integer.Zero])
      .at<Integer.Zero>(Integer.Zero)
      .join(Text.Empty);

  const scheduleUpdate = (value: string): NodeJS.Timeout =>
    (timeout.current = setTimeout(
      (): void => [(): void => (timeout.current = undefined), (): void => setDragValue(value)].forEach(Function.call<() => void>),
      Integer.TwoThousand,
    ));

  const onPointerDown = ({ currentTarget, clientX, pointerId }: PointerEvent<HTMLElement>): void => {
    clearTimeout(timeout.current);
    currentTarget.setPointerCapture(pointerId);

    const currentElements: [HTMLElement[], DOMRect[], number[], number[], number[]] = [...currentTarget.parentElement!.children]
      .filter<HTMLElement>(filterElements)
      .map<[HTMLElement, DOMRect]>((digit: HTMLElement): [HTMLElement, DOMRect] => [digit, digit.getBoundingClientRect()])
      .sort(([, first]: [HTMLElement, DOMRect], [, second]: [HTMLElement, DOMRect]): number => first.left - second.left)
      .reduce<[HTMLElement[], DOMRect[], number[], number[], number[]]>(reduceElements, [[], [], [], [], []]);

    elements.current = currentElements;
    dragIndex.current = currentElements[Integer.Zero].indexOf(currentTarget);
    startOffset.current = clientX;
    setActivePointer(pointerId);
  };

  const onPointerMove = ({ clientX }: PointerEvent<HTMLElement>): void => {
    const [digits, rects, centers, transforms]: [HTMLElement[], DOMRect[], number[], number[], number[]] = elements.current;
    const dragIdx: number = dragIndex.current;
    const min: number = centers.at(Integer.Zero)! - centers[dragIdx];
    const max: number = centers.at(Integer.MinusOne)! - centers[dragIdx];

    const dragOffset: number = Math.max(Math.min(clientX - startOffset.current, max), min);
    const dragCenter: number = centers[dragIdx] + dragOffset;

    const getTransform = (index: number): number =>
      [
        centers[index] > dragCenter - rects[dragIdx].width / Integer.Two ? centers[index + Integer.One] - centers[index] : Integer.Zero,
        centers[index] < dragCenter + rects[dragIdx].width / Integer.Two ? centers[index - Integer.One] - centers[index] : Integer.Zero,
      ]
        .zip<[number, number], [boolean, boolean]>(index < dragIdx, index > dragIdx)
        .findMap<number>(
          ([, condition]: [number, boolean]): boolean => condition,
          ([transform]: [number, boolean]): number => transform,
          dragOffset,
        );

    const currentTransforms: number[] = digits.map<number>((_: HTMLElement, index: number): number => getTransform(index));
    elements.current[Integer.Four] = currentTransforms;
    digits.forEach(updateTransform((index: number): number => transforms[index] + currentTransforms[index]));
  };

  const onPointerUp = ({ currentTarget, pointerId }: PointerEvent<HTMLElement>): void => {
    const [digits, , centers, transforms, currentTransforms]: [HTMLElement[], DOMRect[], number[], number[], number[]] = elements.current;
    const dragIdx: number = dragIndex.current;

    const reorderedDigits: [string, number][] = digits
      .map<[string, number]>(({ textContent }: HTMLElement, index: number): [string, number] => [textContent, index])
      .sort(
        ([, first]: [string, number], [, second]: [string, number]): number =>
          centers[first] + currentTransforms[first] - (centers[second] + currentTransforms[second]),
      );

    const freeIndex: number = reorderedDigits.findIndex(([, index]: [string, number]): boolean => index === dragIdx);
    const newValue: string = readNewValue(reorderedDigits.map<string>(([digit]: [string, number]): string => digit));
    const isNewValueValid: boolean = RegularExpression.BigDecimal.test(newValue);

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

    currentTarget.releasePointerCapture(pointerId);
    setActivePointer(null);
    scheduleUpdate(isNewValueValid ? newValue : readNewValue(digits.map<string>(({ textContent }: HTMLElement): string => textContent)));
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
      onAnimationEndCapture: (): void => setDragValue.callWhen<Dispatch<SetStateAction<Nullable<string>>>>(dragValue !== null, null),
    },
  };

  const digitView: View<Partial<DragAndDropDigitProps>, unknown> = {
    css: dragAndDropDigitCssFactory,
    viewProps: {
      isDragging: activePointer !== null,
      onPointerDown: onPointerDown.bindWhen<(event: PointerEvent<HTMLElement>) => void>(activePointer === null),
      onPointerMove: onPointerMove.bindWhen<(event: PointerEvent<HTMLElement>) => void>(isActivePointer),
      onPointerUp: onPointerUp.bindWhen<(event: PointerEvent<HTMLElement>) => void>(isActivePointer),
      onPointerCancel: onPointerCancel.bindWhen<(event: PointerEvent<HTMLElement>) => void>(isActivePointer),
    },
  };

  return <Story args={{ ...restArgs, value, animationDuration, view, digitView, forwardProps }} />;
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
