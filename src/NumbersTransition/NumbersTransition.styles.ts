import { CSSProperties, HTMLAttributes } from 'react';
import styled, {
  AttributesStyledComponent,
  BaseObject,
  ExecutionProps,
  HTMLDetailedElement,
  Keyframes,
  RuleSet,
  StyledComponent,
  css,
  keyframes,
} from 'styled-components';
import {
  AnimationDirection,
  AnimationFillMode,
  AnimationNumber,
  AnimationTimingFunction,
  AnimationType,
  CssSyntax,
  CssUnit,
  Display,
  FlexDirection,
  Float,
  HTMLElement,
  Integer,
  Overflow,
  Position,
  Size,
  StepPosition,
  Styled,
  Text,
  VariableName,
  ViewKey,
  WhiteSpace,
} from './NumbersTransition.enums';
import './NumbersTransition.extensions';
import { Enum, EnumValue, Falsy, Optional, OrArray, OrReadOnly } from './NumbersTransition.types';

export type LinearEasingFunction = [number, ...(number | [number, number] | [number, number, number])[], number];

export type CubicBezierEasingFunction = [[number, number], [number, number]];

export interface StepsEasingFunction {
  steps: number;
  stepPosition: StepPosition;
}

export type EasingFunction = LinearEasingFunction | CubicBezierEasingFunction | StepsEasingFunction;

export type EasingFunctions<
  T,
  U extends OrReadOnly<LinearEasingFunction>,
  V extends OrReadOnly<CubicBezierEasingFunction>,
  W extends OrReadOnly<StepsEasingFunction>,
  X extends unknown[],
> = [(easingFunction: U, ...args: X) => T, (easingFunction: V, ...args: X) => T, (easingFunction: W, ...args: X) => T];

export type EasingFunctionTypeMapper = <
  T,
  U extends OrReadOnly<LinearEasingFunction>,
  V extends OrReadOnly<CubicBezierEasingFunction>,
  W extends OrReadOnly<StepsEasingFunction>,
  X extends unknown[] = [],
>(
  functions: EasingFunctions<T, U, V, W, X>,
  easingFunction: U | V | W,
  ...args: X
) => T;

interface ElementsIndex {
  characterIndex?: number;
  digitIndex?: number;
  separatorIndex?: number;
  decimalSeparatorIndex?: number;
  digitGroupSeparatorIndex?: number;
  negativeCharacterIndex?: number;
  invalidIndex?: number;
  rowIndex?: number;
}

export interface ElementsLength {
  charactersLength?: number;
  digitsLength?: number;
  separatorsLength?: number;
  decimalSeparatorLength?: number;
  digitGroupSeparatorsLength?: number;
  negativeCharacterLength?: number;
  invalidLength?: number;
  columnLength?: number;
}

export interface NumbersTransitionTheme extends ElementsLength, ElementsIndex {
  numberOfAnimations?: AnimationNumber;
  animationNumber?: AnimationNumber;
  animationType?: AnimationType;
  animationDirection?: AnimationDirection;
  mapEasingFunction?: EasingFunctionTypeMapper;
  animationTimingFunction?: EasingFunction;
  animationDuration?: number;
  horizontalAnimationDuration?: number;
  verticalAnimationDuration?: number;
  totalAnimationDuration?: number;
}

export interface NumbersTransitionExecutionContext extends ExecutionProps {
  theme: NumbersTransitionTheme;
}

interface BaseProperty {
  name: VariableName;
}

interface Property extends BaseProperty {
  syntax: string;
  initialValue: number | string | RuleSet<object>;
}

interface EnumProperty<E extends Enum<E>> extends BaseProperty {
  enumerable: E;
  initialValue: EnumValue<E>;
}

type EnumerableProperty<E extends Enum<E>> = E extends unknown ? EnumProperty<E> : never;

const mapLinear = (value: LinearEasingFunction[number]): string =>
  Array.toArray<number>(value)
    .map<string>((value: number, index: number): string => `${value}${index ? CssUnit.Percent : Text.Empty}`)
    .join(Text.Space);

const linear = (linear: LinearEasingFunction): RuleSet<object> => css<object>`linear(${linear.map<string>(mapLinear).join()})`;

const cubicBezier = (bezier: OrReadOnly<CubicBezierEasingFunction>): RuleSet<object> => css<object>`cubic-bezier(${bezier.join()})`;

const steps = ({ steps, stepPosition }: StepsEasingFunction): RuleSet<object> => css<object>`steps(${steps}, ${stepPosition})`;

const easingFunction = (mapEasingFunction: EasingFunctionTypeMapper, easingFunction: EasingFunction): RuleSet<object> =>
  mapEasingFunction<RuleSet<object>, LinearEasingFunction, CubicBezierEasingFunction, StepsEasingFunction>(
    [linear, cubicBezier, steps],
    easingFunction,
  );

const animationFillMode = (animationType: AnimationType, animationDirection: AnimationDirection): AnimationFillMode =>
  animationType === AnimationType.Horizontal || animationDirection === AnimationDirection.Normal
    ? AnimationFillMode.Forwards
    : AnimationFillMode.Backwards;

const mapEnumProperty = <E extends Enum<E>>({ enumerable, ...restProperty }: EnumerableProperty<E>): Property => ({
  ...restProperty,
  syntax: Object.values<string | number>(enumerable).join(`${Text.Space}${Text.VerticalLine}${Text.Space}`),
});

const mapTimeProperty = (name: VariableName): Property => ({
  name,
  syntax: CssSyntax.Time,
  initialValue: `${Integer.Zero}${CssUnit.Millisecond}`,
});

const mapIntegerProperty = (name: VariableName): Property => ({ name, syntax: CssSyntax.Integer, initialValue: Integer.Zero });

const mapProperty = ({ name, syntax, initialValue }: Property): RuleSet<object> => css<object>`
  @property ${name} {
    syntax: '${syntax}';
    inherits: true;
    initial-value: ${initialValue};
  }
`;

const enumProperties: EnumerableProperty<typeof AnimationType | typeof AnimationDirection | typeof AnimationFillMode>[] = [
  { name: VariableName.AnimationType, enumerable: AnimationType, initialValue: AnimationType.None },
  { name: VariableName.AnimationDirection, enumerable: AnimationDirection, initialValue: AnimationDirection.None },
  { name: VariableName.AnimationFillMode, enumerable: AnimationFillMode, initialValue: AnimationFillMode.Forwards },
];

const timeProperties: VariableName[] = [
  VariableName.AnimationDuration,
  VariableName.HorizontalAnimationDuration,
  VariableName.VerticalAnimationDuration,
  VariableName.TotalAnimationDuration,
];

const integerProperties: VariableName[] = [
  VariableName.NumberOfAnimations,
  VariableName.AnimationNumber,
  VariableName.CharactersLength,
  VariableName.DigitsLength,
  VariableName.SeparatorsLength,
  VariableName.DecimalSeparatorLength,
  VariableName.DigitGroupSeparatorsLength,
  VariableName.NegativeCharacterLength,
  VariableName.InvalidLength,
  VariableName.ColumnLength,
];

const properties: Property[] = [
  ...enumProperties.map<Property>(mapEnumProperty<typeof AnimationType | typeof AnimationDirection | typeof AnimationFillMode>),
  ...timeProperties.map<Property>(mapTimeProperty),
  ...integerProperties.map<Property>(mapIntegerProperty),
  { name: VariableName.AnimationTimingFunction, syntax: CssSyntax.Universal, initialValue: cubicBezier(AnimationTimingFunction.Ease) },
];

const cssProperties: RuleSet<object>[] = properties.map<RuleSet<object>>(mapProperty);

const containerVariables = ({
  theme: {
    numberOfAnimations,
    animationNumber,
    animationType,
    animationDirection,
    mapEasingFunction,
    animationTimingFunction,
    animationDuration,
    horizontalAnimationDuration,
    verticalAnimationDuration,
    totalAnimationDuration,
    charactersLength,
    digitsLength,
    separatorsLength,
    decimalSeparatorLength,
    digitGroupSeparatorsLength,
    negativeCharacterLength,
    invalidLength,
  },
}: NumbersTransitionExecutionContext): RuleSet<object> => css<object>`
  ${VariableName.NumberOfAnimations}: ${numberOfAnimations};
  ${VariableName.AnimationNumber}: ${animationNumber};
  ${VariableName.AnimationType}: ${animationType};
  ${VariableName.AnimationDirection}: ${animationDirection};
  ${VariableName.AnimationTimingFunction}: ${easingFunction(mapEasingFunction!, animationTimingFunction!)};
  ${VariableName.AnimationFillMode}: ${animationFillMode(animationType!, animationDirection!)};
  ${VariableName.AnimationDuration}: ${animationDuration}${CssUnit.Millisecond};
  ${VariableName.HorizontalAnimationDuration}: ${horizontalAnimationDuration}${CssUnit.Millisecond};
  ${VariableName.VerticalAnimationDuration}: ${verticalAnimationDuration}${CssUnit.Millisecond};
  ${VariableName.TotalAnimationDuration}: ${totalAnimationDuration}${CssUnit.Millisecond};
  ${VariableName.CharactersLength}: ${charactersLength};
  ${VariableName.DigitsLength}: ${digitsLength};
  ${VariableName.SeparatorsLength}: ${separatorsLength};
  ${VariableName.DecimalSeparatorLength}: ${decimalSeparatorLength};
  ${VariableName.DigitGroupSeparatorsLength}: ${digitGroupSeparatorsLength};
  ${VariableName.NegativeCharacterLength}: ${negativeCharacterLength};
  ${VariableName.InvalidLength}: ${invalidLength};
`;

const verticalAnimationVariables = ({
  theme: { mapEasingFunction, animationTimingFunction, columnLength },
}: NumbersTransitionExecutionContext): RuleSet<object> => css<object>`
  ${VariableName.AnimationTimingFunction}: ${easingFunction(mapEasingFunction!, animationTimingFunction!)};
  ${VariableName.ColumnLength}: ${columnLength};
`;

type Factory<T extends object, U> = (props: T & NumbersTransitionExecutionContext) => U | Falsy;

export type StyleFactory<T extends object> = Factory<T, CSSProperties>;

export type ClassNameFactory<T extends object> = Factory<T, string>;

export type CssRule<T extends object> = RuleSet<T> | string;

export type CssRuleFactory<T extends object> = Factory<T, CssRule<T>>;

export type KeyframeFunction<T extends object, U> = (keyframeValue: U) => CssRule<T>;

export interface Animation<T extends object, U> {
  keyframeFunction: KeyframeFunction<T, U>;
  keyframes: U[];
  progress?: number[];
}

export type AnimationFactory<T extends object, U> = Factory<T, Animation<T, U>>;

type StyleView<T extends Styled, U extends object> = {
  [K in `${T}${Capitalize<ViewKey.Style>}`]?: OrArray<CSSProperties | StyleFactory<U>>;
};

type ClassNameView<T extends Styled, U extends object> = {
  [K in `${T}${Capitalize<ViewKey.ClassName>}`]?: OrArray<string | ClassNameFactory<U>>;
};

type CssView<T extends Styled, U extends object> = { [K in `${T}${Capitalize<ViewKey.Css>}`]?: OrArray<CssRule<U> | CssRuleFactory<U>> };

type AnimationView<T extends Styled, U extends object, V> = {
  [K in `${T}${Capitalize<ViewKey.Animation>}`]?: OrArray<Animation<U, V> | AnimationFactory<U, V>>;
};

export type StyledView<T extends Styled, U extends object, V> = StyleView<T, U> &
  ClassNameView<T, U> &
  CssView<T, U> &
  AnimationView<T, U, V>;

type Props<T extends Styled, U extends object, V> = U &
  HTMLAttributes<HTMLDivElement> &
  NumbersTransitionExecutionContext &
  StyledView<T, U, V>;

type AttributesOmittedKeys<T extends Styled, U extends object> =
  | keyof StyleView<T, U>
  | keyof ClassNameView<T, U>
  | `${ViewKey.Style}`
  | `${ViewKey.ClassName}`;

interface AnimationWidthProps {
  animationStartWidth: number;
  animationEndWidth: number;
}

interface HorizontalAnimationProps extends NumbersTransitionExecutionContext, AnimationWidthProps {}

export interface VerticalAnimationProps extends NumbersTransitionExecutionContext {}

type AnimationProps = HorizontalAnimationProps | VerticalAnimationProps;

const createAnimationKeyframeMapper =
  <T extends object, U>(map: KeyframeFunction<T, U>): ((val: [U] | [U, number], index: number, arr: ([U] | [U, number])[]) => RuleSet<T>) =>
  ([value, progress]: [U] | [U, number], index: number, { length }: ([U] | [U, number])[]): RuleSet<T> => css<T>`
    ${progress ?? (index * Integer.OneHundred) / (length - Integer.One)}${CssUnit.Percent} {
      ${map(value)};
    }
  `;

const reduceAnimationKeyframes = <T extends object>(previousValue: RuleSet<T>, currentValue: RuleSet<T>): RuleSet<T> => css<T>`
  ${previousValue}
  ${currentValue}
`;

const createAnimationKeyframes = <T extends object, U>(
  mapKeyframe: KeyframeFunction<T, U>,
  keyframesValues: U[],
  progress: number[] = [],
): Keyframes => keyframes<T>`
  ${keyframesValues
    .zip<number[]>(progress)
    .map<RuleSet<T>>(createAnimationKeyframeMapper<T, U>(mapKeyframe))
    .reduce<RuleSet<T>>(reduceAnimationKeyframes<T>, css<T>``)}
`;

const horizontalAnimationKeyframe: KeyframeFunction<object, number> = (keyframeValue: number): RuleSet<object> => css<object>`
  width: ${keyframeValue}${CssUnit.Pixel};
`;

const verticalAnimationKeyframe: KeyframeFunction<object, number> = (keyframeValue: number): RuleSet<object> => css<object>`
  transform: translateY(${keyframeValue}${CssUnit.Percent});
`;

const horizontalAnimation = ({ animationStartWidth, animationEndWidth }: AnimationWidthProps): Keyframes =>
  createAnimationKeyframes<object, number>(horizontalAnimationKeyframe, [animationStartWidth, animationEndWidth]);

const verticalAnimation: Keyframes = createAnimationKeyframes<object, number>(verticalAnimationKeyframe, [
  Integer.Zero,
  Integer.MinusOneHundred,
]);

const animationName = ({ theme: { animationType }, ...restProps }: AnimationProps): Optional<Keyframes> => {
  switch (animationType) {
    case AnimationType.Horizontal:
      return horizontalAnimation(<HorizontalAnimationProps>restProps);
    case AnimationType.Vertical:
      return verticalAnimation;
  }
};

const animation: RuleSet<AnimationProps> = css<AnimationProps>`
  animation-name: ${animationName};
  animation-direction: var(${VariableName.AnimationDirection});
  animation-timing-function: var(${VariableName.AnimationTimingFunction});
  animation-fill-mode: var(${VariableName.AnimationFillMode});
  animation-duration: var(${VariableName.AnimationDuration});
  animation-iteration-count: ${Integer.One};
`;

const createViewFactoryMapper =
  <T extends Styled, U extends object, V, W extends string>(props: Omit<Props<T, U, V>, W>): ((value?: V | Factory<U, V>) => V | Falsy) =>
  (value?: V | Factory<U, V>): V | Falsy =>
    typeof value === 'function' ? (<Factory<U, V>>value)(<U & NumbersTransitionExecutionContext>props) : value;

const reduceStyles = (accumulator: CSSProperties, currentStyle: CSSProperties | Falsy): CSSProperties => ({
  ...accumulator,
  ...currentStyle,
});

const styleFactory = <T extends Styled, U extends object, V>(
  style: Optional<OrArray<CSSProperties | StyleFactory<U>>>,
  props: Omit<Props<T, U, V>, AttributesOmittedKeys<T, U>>,
): CSSProperties =>
  Array.toArray<Optional<CSSProperties | StyleFactory<U>>>(style)
    .map<CSSProperties | Falsy>(createViewFactoryMapper<T, U, CSSProperties, AttributesOmittedKeys<T, U>>(props))
    .reduce<CSSProperties>(reduceStyles, {});

const classNameFactory = <T extends Styled, U extends object, V>(
  className: Optional<OrArray<string | ClassNameFactory<U>>>,
  props: Omit<Props<T, U, V>, AttributesOmittedKeys<T, U>>,
): Optional<string> =>
  Array.toArray<Optional<string | ClassNameFactory<U>>>(className)
    .map<string | Falsy>(createViewFactoryMapper<T, U, string, AttributesOmittedKeys<T, U>>(props))
    .filter<string>((className: string | Falsy): className is string => !!className)
    .join(Text.Space);

const toCssArray = <T extends object>(cssStyle?: OrArray<CssRule<T> | CssRuleFactory<T>>): Optional<CssRule<T> | CssRuleFactory<T>>[] =>
  Array.isArray<Optional<CssRule<T> | CssRuleFactory<T>>>(cssStyle) &&
  Array.isOfDepth<CssRule<T> | CssRuleFactory<T>, Integer.Two>(cssStyle, Integer.Two)
    ? cssStyle
    : [<Optional<CssRule<T> | CssRuleFactory<T>>>cssStyle];

const cssFactory =
  <T extends Styled>(styledComponent: T): (<U extends object, V>(props: Props<T, U, V>) => CssRule<U>[]) =>
  <U extends object, V>({
    [<keyof CssView<T, U>>`${styledComponent}${ViewKey.Css.capitalize()}`]: cssStyle,
    ...restProps
  }: Props<T, U, V>): CssRule<U>[] =>
    toCssArray<U>(cssStyle)
      .map<CssRule<U> | Falsy>(createViewFactoryMapper<T, U, CssRule<U>, keyof CssView<T, U>>(restProps))
      .filter<CssRule<U>>((value: CssRule<U> | Falsy): value is CssRule<U> => !!value);

const mapAnimationFalsyValue = <T extends object, U>(animation: Partial<Animation<T, U>> | Falsy): Optional<Partial<Animation<T, U>>> =>
  animation || undefined;

const mapAnimation = <T extends object, U>({ keyframeFunction, keyframes, progress }: Partial<Animation<T, U>> = {}): Optional<Keyframes> =>
  keyframeFunction && keyframes && createAnimationKeyframes(keyframeFunction, keyframes, progress);

const reduceAnimationsKeyframes = (accumulator: RuleSet<object>, currentValue: Optional<Keyframes>, index: number) => css<object>`
  ${accumulator}${index ? Text.Comma : Text.Empty}${currentValue ?? AnimationType.None}
`;

const createAnimationsKeyframes = <T extends Styled, U extends object, V>(
  props: Omit<Props<T, U, V>, keyof AnimationView<T, U, V>>,
  animation?: OrArray<Animation<U, V> | AnimationFactory<U, V>>,
): Optional<RuleSet<object>> =>
  Array.toArray<Optional<Animation<U, V> | AnimationFactory<U, V>>>(animation)
    .filter((): boolean => !!(Array.isArray<Optional<Animation<U, V> | AnimationFactory<U, V>>>(animation) ? animation.length : animation))
    .map<Partial<Animation<U, V>> | Falsy>(createViewFactoryMapper<T, U, Animation<U, V>, keyof AnimationView<T, U, V>>(props))
    .map<Optional<Partial<Animation<U, V>>>>(mapAnimationFalsyValue<U, V>)
    .map<Optional<Keyframes>>(mapAnimation<U, V>)
    .reduce<RuleSet<object>>(reduceAnimationsKeyframes, css<object>``);

// prettier-ignore
const createOptionalAnimation = (animationsKeyframes: Optional<RuleSet<object>>): Optional<RuleSet<object>> =>
  [css<object>`animation-name: ${animationsKeyframes};`].filter((): boolean => !!animationsKeyframes)[Integer.Zero];

const animationFactory =
  <T extends Styled>(styledComponent: T): (<U extends object, V>(props: Props<T, U, V>) => Optional<RuleSet<U>>) =>
  <U extends object, V>({
    [<keyof AnimationView<T, U, V>>`${styledComponent}${ViewKey.Animation.capitalize()}`]: animation,
    ...restProps
  }: Props<T, U, V>): Optional<RuleSet<U>> =>
    createOptionalAnimation(createAnimationsKeyframes<T, U, V>(restProps, animation));

const attributesFactory =
  <T extends Styled>(styledComponent: T): (<U extends object, V>(props: Props<T, U, V>) => HTMLAttributes<HTMLDivElement>) =>
  <U extends object, V>({
    style,
    className,
    [<keyof StyleView<T, U>>`${styledComponent}${ViewKey.Style.capitalize()}`]: styleView,
    [<keyof ClassNameView<T, U>>`${styledComponent}${ViewKey.ClassName.capitalize()}`]: classNameView,
    ...restProps
  }: Props<T, U, V>): HTMLAttributes<HTMLDivElement> => ({
    style: { ...style, ...styleFactory(styleView, restProps) },
    className: [className, classNameFactory(classNameView, restProps)]
      .filter<string>((className: Optional<string>): className is string => !!className)
      .join(Text.Space),
  });

interface VisibilityProps {
  visible?: boolean;
}

// prettier-ignore
const visibility = ({ visible = true }: VisibilityProps): Optional<RuleSet<object>> =>
  [css<object>`opacity: ${Integer.Zero};`].filter((): boolean => !visible)[Integer.Zero];

interface ContainerProps<T extends object, U> extends NumbersTransitionExecutionContext, StyledView<Styled.Container, T, U> {}

type ContainerStyledComponent = AttributesStyledComponent<HTMLElement.Div, HTMLDetailedElement<HTMLDivElement>, ContainerProps<any, any>>;

export const Container: ContainerStyledComponent = styled.div.attrs<ContainerProps<any, any>>(
  attributesFactory<Styled.Container>(Styled.Container),
)`
  max-width: ${Integer.OneHundred}${CssUnit.Percent};
  width: ${Size.FitContent};
  height: ${Integer.One}${CssUnit.LineHeight};
  white-space: ${WhiteSpace.NoWrap};
  overflow-y: ${Overflow.Clip};
  ${cssProperties};
  ${containerVariables};
  ${cssFactory<Styled.Container>(Styled.Container)};
  ${animationFactory<Styled.Container>(Styled.Container)};
`;

type HorizontalAnimationStyledComponent = StyledComponent<HTMLDivElement, HorizontalAnimationProps>;

export const HorizontalAnimation: HorizontalAnimationStyledComponent = styled.div<HorizontalAnimationProps>`
  ${animation};
  &,
  :has(~ &):not(:has(:first-child)) {
    display: ${Display.InlineBlock};
    overflow-x: ${Overflow.Hidden};
  }
  :only-child {
    float: ${Float.Right};
  }
`;

type VerticalAnimationStyledComponent = StyledComponent<HTMLDivElement, VerticalAnimationProps>;

export const VerticalAnimation: VerticalAnimationStyledComponent = styled.div<VerticalAnimationProps>`
  ${verticalAnimationVariables};
  display: ${Display.InlineFlex};
  flex-direction: ${FlexDirection.Column};
  height: ${Size.Inherit};
  overflow-y: ${Overflow.Hidden};
  > :only-child:has(:not(:only-child)) {
    ${animation};
    position: ${Position.Relative};
  }
  :last-child:not(:only-child) {
    position: ${Position.Absolute};
    top: ${Integer.OneHundred}${CssUnit.Percent};
  }
  :only-child > * {
    display: ${Display.Block};
  }
`;

type AnimationPlaceholderStyledComponent = StyledComponent<HTMLDivElement, BaseObject>;

export const AnimationPlaceholder: AnimationPlaceholderStyledComponent = styled.div<BaseObject>`
  display: ${Display.InlineFlex};
  flex-direction: ${({ theme: { animationDirection } }: NumbersTransitionExecutionContext): FlexDirection =>
    animationDirection === AnimationDirection.Normal ? FlexDirection.Column : FlexDirection.ColumnReverse};
  height: ${Size.Inherit};
  > * {
    display: ${Display.Block};
  }
`;

interface CharacterProps<T extends object, U> extends StyledView<Styled.Character, T, U> {}

type CharacterStyledComponent = AttributesStyledComponent<HTMLElement.Div, HTMLDetailedElement<HTMLDivElement>, CharacterProps<any, any>>;

const Character: CharacterStyledComponent = styled.div.attrs<CharacterProps<any, any>>(
  attributesFactory<Styled.Character>(Styled.Character),
)`
  display: ${Display.InlineBlock};
  ${cssFactory<Styled.Character>(Styled.Character)};
  ${animationFactory<Styled.Character>(Styled.Character)};
`;

export interface DigitProps<T extends object, U, V extends object, W> extends CharacterProps<T, U>, StyledView<Styled.Digit, V, W> {}

type DigitStyledComponent = AttributesStyledComponent<CharacterStyledComponent, CharacterStyledComponent, DigitProps<any, any, any, any>>;

export const Digit: DigitStyledComponent = styled<CharacterStyledComponent>(Character).attrs<DigitProps<any, any, any, any>>(
  attributesFactory<Styled.Digit>(Styled.Digit),
)`
  min-width: ${Integer.One}${CssUnit.Character};
  ${cssFactory<Styled.Digit>(Styled.Digit)};
  ${animationFactory<Styled.Digit>(Styled.Digit)};
`;

interface SeparatorProps<T extends object, U, V extends object, W> extends CharacterProps<T, U>, StyledView<Styled.Separator, V, W> {}

type SeparatorStyledComponent = AttributesStyledComponent<
  CharacterStyledComponent,
  CharacterStyledComponent,
  SeparatorProps<any, any, any, any>
>;

const Separator: SeparatorStyledComponent = styled<CharacterStyledComponent>(Character).attrs<SeparatorProps<any, any, any, any>>(
  attributesFactory<Styled.Separator>(Styled.Separator),
)`
  white-space: ${WhiteSpace.Pre};
  ${cssFactory<Styled.Separator>(Styled.Separator)};
  ${animationFactory<Styled.Separator>(Styled.Separator)};
`;

interface DecimalSeparatorProps<T extends object, U, V extends object, W, X extends object, Y>
  extends SeparatorProps<T, U, V, W>,
    StyledView<Styled.DecimalSeparator, X, Y> {}

type DecimalSeparatorStyledComponent = AttributesStyledComponent<
  SeparatorStyledComponent,
  SeparatorStyledComponent,
  DecimalSeparatorProps<any, any, any, any, any, any>
>;

export const DecimalSeparator: DecimalSeparatorStyledComponent = styled<SeparatorStyledComponent>(Separator).attrs<
  DecimalSeparatorProps<any, any, any, any, any, any>
>(attributesFactory<Styled.DecimalSeparator>(Styled.DecimalSeparator))`
  ${cssFactory<Styled.DecimalSeparator>(Styled.DecimalSeparator)};
  ${animationFactory<Styled.DecimalSeparator>(Styled.DecimalSeparator)};
`;

interface DigitGroupSeparatorProps<T extends object, U, V extends object, W, X extends object, Y>
  extends SeparatorProps<T, U, V, W>,
    StyledView<Styled.DigitGroupSeparator, X, Y> {}

type DigitGroupSeparatorStyledComponent = AttributesStyledComponent<
  SeparatorStyledComponent,
  SeparatorStyledComponent,
  DigitGroupSeparatorProps<any, any, any, any, any, any>
>;

export const DigitGroupSeparator: DigitGroupSeparatorStyledComponent = styled<SeparatorStyledComponent>(Separator).attrs<
  DigitGroupSeparatorProps<any, any, any, any, any, any>
>(attributesFactory<Styled.DigitGroupSeparator>(Styled.DigitGroupSeparator))`
  ${cssFactory<Styled.DigitGroupSeparator>(Styled.DigitGroupSeparator)};
  ${animationFactory<Styled.DigitGroupSeparator>(Styled.DigitGroupSeparator)};
`;

interface NegativeProps<T extends object, U, V extends object, W>
  extends VisibilityProps,
    CharacterProps<T, U>,
    StyledView<Styled.Negative, V, W> {}

type NegativeStyledComponent = AttributesStyledComponent<
  CharacterStyledComponent,
  CharacterStyledComponent,
  NegativeProps<any, any, any, any>
>;

export const Negative: NegativeStyledComponent = styled<CharacterStyledComponent>(Character).attrs<NegativeProps<any, any, any, any>>(
  attributesFactory<Styled.Negative>(Styled.Negative),
)`
  ${visibility};
  ${cssFactory<Styled.Negative>(Styled.Negative)};
  ${animationFactory<Styled.Negative>(Styled.Negative)};
`;

interface InvalidProps<T extends object, U, V extends object, W> extends CharacterProps<T, U>, StyledView<Styled.Invalid, V, W> {}

type InvalidStyledComponent = AttributesStyledComponent<
  CharacterStyledComponent,
  CharacterStyledComponent,
  InvalidProps<any, any, any, any>
>;

export const Invalid: InvalidStyledComponent = styled<CharacterStyledComponent>(Character).attrs<InvalidProps<any, any, any, any>>(
  attributesFactory<Styled.Invalid>(Styled.Invalid),
)`
  ${cssFactory<Styled.Invalid>(Styled.Invalid)};
  ${animationFactory<Styled.Invalid>(Styled.Invalid)};
`;
