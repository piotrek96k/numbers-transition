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
  Character,
  HTMLElement,
  Integer,
  StepPosition,
  Styled,
  VariableName,
  ViewKey,
} from './NumbersTransition.enums';
import './NumbersTransition.extensions';
import { Enum, Falsy, Optional, OrArray, OrReadOnly, TypeOf } from './NumbersTransition.types';

export type LinearEasingFunction = [number, ...(number | [number, number] | [number, number, number])[], number];

export type CubicBezierEasingFunction = [[number, number], [number, number]];

export interface StepsEasingFunction {
  steps: number;
  stepPosition: StepPosition;
}

export type EasingFunction = LinearEasingFunction | CubicBezierEasingFunction | StepsEasingFunction;

interface ElementsIndex {
  symbolIndex?: number;
  digitIndex?: number;
  separatorIndex?: number;
  decimalSeparatorIndex?: number;
  digitGroupSeparatorIndex?: number;
  negativeCharacterIndex?: number;
  invalidIndex?: number;
  rowIndex?: number;
}

export interface ElementsLength {
  symbolsLength?: number;
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
  animationTimingFunction?: EasingFunction;
  animationFillMode?: AnimationFillMode;
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
  initialValue: TypeOf<E>;
}

const mapLinear = (value: LinearEasingFunction[number]): string =>
  Array.toArray<number>(value)
    .map<string>((value: number, index: number): string => `${value}${index ? Character.Percent : Character.Empty}`)
    .join(Character.Space);

const linear = (linear: LinearEasingFunction): RuleSet<object> => css<object>`linear(${linear.map<string>(mapLinear).join()})`;

const cubicBezier = (bezier: OrReadOnly<CubicBezierEasingFunction>): RuleSet<object> => css<object>`cubic-bezier(${bezier.join()})`;

const steps = ({ steps, stepPosition }: StepsEasingFunction): RuleSet<object> => css<object>`steps(${steps}, ${stepPosition})`;

const easingFunction = (easingFunction: EasingFunction): RuleSet<object> =>
  Array.isArray<StepsEasingFunction, CubicBezierEasingFunction | LinearEasingFunction>(easingFunction)
    ? Array.isOfDepth<number, Integer.Two>(easingFunction, Integer.Two)
      ? cubicBezier(easingFunction)
      : linear(easingFunction)
    : steps(easingFunction);

const mapEnumProperty = ({
  enumerable,
  ...restProperty
}: EnumProperty<typeof AnimationType> | EnumProperty<typeof AnimationDirection> | EnumProperty<typeof AnimationFillMode>): Property => ({
  ...restProperty,
  syntax: Object.values<string | number>(enumerable).join(`${Character.Space}${Character.VerticalLine}${Character.Space}`),
});

const mapTimeProperty = (name: VariableName): Property => ({ name, syntax: '<time>', initialValue: `${Integer.Zero}ms` });

const mapIntegerProperty = (name: VariableName): Property => ({ name, syntax: '<integer>', initialValue: Integer.Zero });

const mapProperty = ({ name, syntax, initialValue }: Property): RuleSet<object> => css<object>`
  @property ${name} {
    syntax: '${syntax}';
    inherits: true;
    initial-value: ${initialValue};
  }
`;

const enumProperties: [
  EnumProperty<typeof AnimationType>,
  EnumProperty<typeof AnimationDirection>,
  EnumProperty<typeof AnimationFillMode>,
] = [
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
  VariableName.SymbolsLength,
  VariableName.DigitsLength,
  VariableName.SeparatorsLength,
  VariableName.DecimalSeparatorLength,
  VariableName.DigitGroupSeparatorsLength,
  VariableName.NegativeCharacterLength,
  VariableName.InvalidLength,
  VariableName.ColumnLength,
];

const properties: Property[] = [
  ...enumProperties.map<Property>(mapEnumProperty),
  ...timeProperties.map<Property>(mapTimeProperty),
  ...integerProperties.map<Property>(mapIntegerProperty),
  { name: VariableName.AnimationTimingFunction, syntax: '*', initialValue: cubicBezier(AnimationTimingFunction.Ease) },
];

const cssProperties: RuleSet<object>[] = properties.map<RuleSet<object>>(mapProperty);

const variables = ({
  theme: {
    numberOfAnimations,
    animationNumber,
    animationType,
    animationDirection,
    animationTimingFunction,
    animationFillMode = animationType === AnimationType.Horizontal || animationDirection === AnimationDirection.Normal
      ? AnimationFillMode.Forwards
      : AnimationFillMode.Backwards,
    animationDuration,
    horizontalAnimationDuration,
    verticalAnimationDuration,
    totalAnimationDuration,
    symbolsLength,
    digitsLength,
    separatorsLength,
    decimalSeparatorLength,
    digitGroupSeparatorsLength,
    negativeCharacterLength,
    invalidLength,
    columnLength,
  },
}: NumbersTransitionExecutionContext): RuleSet<object> => css<object>`
  ${VariableName.NumberOfAnimations}: ${numberOfAnimations};
  ${VariableName.AnimationNumber}: ${animationNumber};
  ${VariableName.AnimationType}: ${animationType};
  ${VariableName.AnimationDirection}: ${animationDirection};
  ${VariableName.AnimationTimingFunction}: ${easingFunction(animationTimingFunction!)};
  ${VariableName.AnimationFillMode}: ${animationFillMode};
  ${VariableName.AnimationDuration}: ${animationDuration}ms;
  ${VariableName.HorizontalAnimationDuration}: ${horizontalAnimationDuration}ms;
  ${VariableName.VerticalAnimationDuration}: ${verticalAnimationDuration}ms;
  ${VariableName.TotalAnimationDuration}: ${totalAnimationDuration}ms;
  ${VariableName.SymbolsLength}: ${symbolsLength};
  ${VariableName.DigitsLength}: ${digitsLength};
  ${VariableName.SeparatorsLength}: ${separatorsLength};
  ${VariableName.DecimalSeparatorLength}: ${decimalSeparatorLength};
  ${VariableName.DigitGroupSeparatorsLength}: ${digitGroupSeparatorsLength};
  ${VariableName.NegativeCharacterLength}: ${negativeCharacterLength};
  ${VariableName.InvalidLength}: ${invalidLength};
  ${columnLength && `${VariableName.ColumnLength}: ${columnLength}`};
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
    ${progress ?? (index * Integer.OneHundred) / (length - Integer.One)}% {
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
  width: ${keyframeValue}px;
`;

const verticalAnimationKeyframe: KeyframeFunction<object, number> = (keyframeValue: number): RuleSet<object> => css<object>`
  transform: translateY(${keyframeValue}%);
`;

const horizontalAnimation = ({ animationStartWidth, animationEndWidth }: AnimationWidthProps): Keyframes =>
  createAnimationKeyframes<object, number>(horizontalAnimationKeyframe, [animationStartWidth, animationEndWidth]);

const verticalAnimation: Keyframes = createAnimationKeyframes<object, number>(verticalAnimationKeyframe, [
  Integer.Zero,
  Integer.MinusOneHundred,
]);

const animationName = ({ theme: { animationType }, ...restProps }: NumbersTransitionExecutionContext): Optional<Keyframes> => {
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
    .join(Character.Space);

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
  ${accumulator}${index ? Character.Comma : Character.Empty}${currentValue ?? AnimationType.None}
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
      .join(Character.Space),
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
  max-width: ${Integer.OneHundred}%;
  width: fit-content;
  height: ${Integer.One}lh;
  white-space: nowrap;
  overflow-y: clip;
  ${cssProperties};
  ${variables};
  ${cssFactory<Styled.Container>(Styled.Container)};
  ${animationFactory<Styled.Container>(Styled.Container)};
`;

type HorizontalAnimationStyledComponent = StyledComponent<HTMLDivElement, HorizontalAnimationProps>;

export const HorizontalAnimation: HorizontalAnimationStyledComponent = styled.div<HorizontalAnimationProps>`
  ${animation};
  &,
  :has(~ &):not(:has(:first-child)) {
    display: inline-block;
    overflow-x: hidden;
  }
  :only-child {
    float: right;
  }
`;

type VerticalAnimationStyledComponent = StyledComponent<HTMLDivElement, VerticalAnimationProps>;

export const VerticalAnimation: VerticalAnimationStyledComponent = styled.div<VerticalAnimationProps>`
  ${variables};
  display: inline-flex;
  flex-direction: column;
  height: inherit;
  overflow-y: hidden;
  > :only-child:has(:not(:only-child)) {
    ${animation};
    position: relative;
  }
  :last-child:not(:only-child) {
    position: absolute;
    top: ${Integer.OneHundred}%;
  }
  :only-child > * {
    display: block;
  }
`;

type AnimationPlaceholderStyledComponent = StyledComponent<HTMLDivElement, BaseObject>;

export const AnimationPlaceholder: AnimationPlaceholderStyledComponent = styled.div<BaseObject>`
  display: inline-flex;
  flex-direction: ${({ theme: { animationDirection } }: NumbersTransitionExecutionContext): string =>
    animationDirection === AnimationDirection.Normal ? 'column' : 'column-reverse'};
  height: inherit;
  > * {
    display: block;
  }
`;

interface SymbolProps<T extends object, U> extends StyledView<Styled.Symbol, T, U> {}

type SymbolStyledComponent = AttributesStyledComponent<HTMLElement.Div, HTMLDetailedElement<HTMLDivElement>, SymbolProps<any, any>>;

const Symbol: SymbolStyledComponent = styled.div.attrs<SymbolProps<any, any>>(attributesFactory<Styled.Symbol>(Styled.Symbol))`
  display: inline-block;
  ${cssFactory<Styled.Symbol>(Styled.Symbol)};
  ${animationFactory<Styled.Symbol>(Styled.Symbol)};
`;

export interface DigitProps<T extends object, U, V extends object, W> extends SymbolProps<T, U>, StyledView<Styled.Digit, V, W> {}

type DigitStyledComponent = AttributesStyledComponent<SymbolStyledComponent, SymbolStyledComponent, DigitProps<any, any, any, any>>;

export const Digit: DigitStyledComponent = styled<SymbolStyledComponent>(Symbol).attrs<DigitProps<any, any, any, any>>(
  attributesFactory<Styled.Digit>(Styled.Digit),
)`
  min-width: ${Integer.One}ch;
  ${cssFactory<Styled.Digit>(Styled.Digit)};
  ${animationFactory<Styled.Digit>(Styled.Digit)};
`;

interface SeparatorProps<T extends object, U, V extends object, W> extends SymbolProps<T, U>, StyledView<Styled.Separator, V, W> {}

type SeparatorStyledComponent = AttributesStyledComponent<SymbolStyledComponent, SymbolStyledComponent, SeparatorProps<any, any, any, any>>;

const Separator: SeparatorStyledComponent = styled<SymbolStyledComponent>(Symbol).attrs<SeparatorProps<any, any, any, any>>(
  attributesFactory<Styled.Separator>(Styled.Separator),
)`
  white-space: pre;
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
    SymbolProps<T, U>,
    StyledView<Styled.Negative, V, W> {}

type NegativeStyledComponent = AttributesStyledComponent<SymbolStyledComponent, SymbolStyledComponent, NegativeProps<any, any, any, any>>;

export const Negative: NegativeStyledComponent = styled<SymbolStyledComponent>(Symbol).attrs<NegativeProps<any, any, any, any>>(
  attributesFactory<Styled.Negative>(Styled.Negative),
)`
  ${visibility};
  ${cssFactory<Styled.Negative>(Styled.Negative)};
  ${animationFactory<Styled.Negative>(Styled.Negative)};
`;

interface InvalidProps<T extends object, U, V extends object, W> extends SymbolProps<T, U>, StyledView<Styled.Invalid, V, W> {}

type InvalidStyledComponent = AttributesStyledComponent<SymbolStyledComponent, SymbolStyledComponent, InvalidProps<any, any, any, any>>;

export const Invalid: InvalidStyledComponent = styled<SymbolStyledComponent>(Symbol).attrs<InvalidProps<any, any, any, any>>(
  attributesFactory<Styled.Invalid>(Styled.Invalid),
)`
  ${cssFactory<Styled.Invalid>(Styled.Invalid)};
  ${animationFactory<Styled.Invalid>(Styled.Invalid)};
`;
