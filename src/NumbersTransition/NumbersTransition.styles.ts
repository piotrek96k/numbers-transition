import type { CSSProperties, ComponentPropsWithRef, ComponentType, DetailedHTMLProps, ExoticComponent, HTMLAttributes } from 'react';
import styled, {
  ExecutionProps,
  FastOmit,
  IStyledComponent,
  Interpolation,
  RuleSet,
  StyleFunction,
  StyledObject,
  SupportedHTMLElements,
  css,
  keyframes,
} from 'styled-components';
import type { Enum, EnumValue, Maybe, Optional, OrArray, OrFunction, OrReadOnly, Remove, Tuple, When } from './NumbersTransition.types';
import {
  AnimationDirection,
  AnimationFillMode,
  AnimationNumber,
  AnimationTimingFunction,
  AnimationType,
  Color,
  CssSyntax,
  CssUnit,
  Display,
  FlexDirection,
  Float,
  HTMLElement,
  Integer,
  Overflow,
  Position,
  Runtime,
  Size,
  StepPosition,
  Styled,
  Text,
  VariableName,
  ViewKey,
  WhiteSpace,
} from './NumbersTransition.enums';

type BaseObject = {};

interface CSSPropertiesWithVars extends CSSProperties {
  [key: `${Text.Minus}${Text.Minus}${string}`]: Optional<string | number>;
}

interface ExoticComponentWithDisplayName<T extends BaseObject = BaseObject> extends ExoticComponent<T> {
  defaultProps?: Partial<T>;
  displayName?: string;
}

type AnyComponent<T extends BaseObject = any> = ExoticComponentWithDisplayName<T> | ComponentType<T>;
type KnownTarget = SupportedHTMLElements | AnyComponent;
type Substitute<T extends BaseObject, U extends BaseObject> = FastOmit<T, keyof U> & U;
type StyledComponentBase<T extends object> = IStyledComponent<Runtime.Web, T>;
type HTMLDetailedElement<T> = DetailedHTMLProps<HTMLAttributes<T>, T>;
type Styles<T extends BaseObject> = TemplateStringsArray | StyledObject<T> | StyleFunction<T>;

export type StyledComponent<T, U extends object = BaseObject> = StyledComponentBase<Substitute<HTMLDetailedElement<T>, U>>;
export type ExtensionStyledComponent<T extends KnownTarget, U extends object = BaseObject> = StyledComponentBase<
  Substitute<ComponentPropsWithRef<T> & BaseObject, U>
>;
export type AttributesStyledComponent<T extends KnownTarget, U extends object, V extends object = BaseObject> = StyledComponentBase<
  Substitute<Substitute<Substitute<U extends KnownTarget ? ComponentPropsWithRef<U> : U, ComponentPropsWithRef<T>>, V>, BaseObject>
>;

interface StyledHTMLAttributes<T> extends HTMLAttributes<T> {
  style: CSSPropertiesWithVars;
}

interface Keyframes {
  id: string;
  name: string;
  rules: string;
}

export type LinearEasingFunction = [number, ...(number | Tuple<number, Integer.Two | Integer.Three>)[], number];

export type CubicBezierEasingFunction = Tuple<[number, number], Integer.Two>;

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
  charactersLength: number;
  digitsLength: number;
  separatorsLength: number;
  decimalSeparatorLength: number;
  digitGroupSeparatorsLength: number;
  negativeCharacterLength: number;
  invalidLength: number;
  columnLength?: number;
}

export interface NumbersTransitionTheme extends ElementsLength, ElementsIndex {
  numberOfAnimations: AnimationNumber;
  animationNumber: AnimationNumber;
  animationType: AnimationType;
  animationDirection: AnimationDirection;
  mapEasingFunction: EasingFunctionTypeMapper;
  animationTimingFunction: EasingFunction;
  animationDuration: number;
  horizontalAnimationDuration: number;
  verticalAnimationDuration: number;
  totalAnimationDuration: number;
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

type EnumerableProperty<E extends Enum<E>> = When<[E, unknown], EnumProperty<E>, never>;

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
  syntax: enumerable.values<string | number>().join(`${Text.Space}${Text.VerticalLine}${Text.Space}`),
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
  ${VariableName.AnimationTimingFunction}: ${easingFunction(mapEasingFunction, animationTimingFunction)};
  ${VariableName.AnimationFillMode}: ${animationFillMode(animationType, animationDirection)};
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
  ${VariableName.AnimationTimingFunction}: ${easingFunction(mapEasingFunction, animationTimingFunction)};
  ${VariableName.ColumnLength}: ${columnLength};
`;

export type WithContext<T> = T & NumbersTransitionExecutionContext;
export type CssRule<T extends object> = RuleSet<T> | string;
export type KeyframeFunction<T extends object, U> = (keyframeValue: U) => CssRule<T>;

export interface Animation<T extends object, U> {
  keyframeFunction: KeyframeFunction<T, U>;
  keyframes: U[];
  progress?: number[];
}

export type StyleViewFactory<T extends object> = OrFunction<[WithContext<T>], Maybe<CSSProperties>>;
export type ClassNameViewFactory<T extends object> = OrFunction<[WithContext<T>], Maybe<string>>;
export type CssViewFactory<T extends object> = OrFunction<[WithContext<T>], Maybe<CssRule<T>>>;
export type AnimationViewFactory<T extends object, U> = OrFunction<[WithContext<T>], Maybe<Animation<T, U>>>;

type StyleView<T extends Styled, U extends object> = { [K in `${T}${Capitalize<ViewKey.Style>}`]?: OrArray<StyleViewFactory<U>> };
type ClassNameView<T extends Styled, U extends object> = {
  [K in `${T}${Capitalize<ViewKey.ClassName>}`]?: OrArray<ClassNameViewFactory<U>>;
};
type CssView<T extends Styled, U extends object> = { [K in `${T}${Capitalize<ViewKey.Css>}`]?: OrArray<CssViewFactory<U>> };
type AnimationView<T extends Styled, U extends object, V> = {
  [K in `${T}${Capitalize<ViewKey.Animation>}`]?: OrArray<AnimationViewFactory<U, V>>;
};

export type StyledView<T extends Styled, U extends object, V> = StyleView<T, U> &
  ClassNameView<T, U> &
  CssView<T, U> &
  AnimationView<T, U, V>;

type Props<T extends Styled, U extends object, V> = U &
  HTMLAttributes<HTMLDivElement> &
  NumbersTransitionExecutionContext &
  StyledView<T, U, V>;

interface AnimationWidthProps {
  animationStartWidth: number;
  animationEndWidth: number;
}

export interface HorizontalAnimationProps extends NumbersTransitionExecutionContext, AnimationWidthProps {}
export interface VerticalAnimationProps extends NumbersTransitionExecutionContext {}

type AnimationProps = HorizontalAnimationProps | VerticalAnimationProps;

type NoThemeHorizontalAnimationProps = Remove<HorizontalAnimationProps, NumbersTransitionTheme>;
type NoThemeVerticalAnimationProps = Remove<VerticalAnimationProps, NumbersTransitionTheme>;

type AnimationKeyframeMapper<T extends object, U> = (
  ...args: [KeyframeFunction<T, U>, [U] | [U, number], number, ([U] | [U, number])[]]
) => RuleSet<T>;

const animationKeyframeMapper = <T extends object, U>(
  map: KeyframeFunction<T, U>,
  [value, progress]: [U] | [U, number],
  index: number,
  { length }: ([U] | [U, number])[],
): RuleSet<T> => css<T>`
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
    .zip<number[]>(...progress)
    .map<RuleSet<T>>(animationKeyframeMapper.bindArgs<AnimationKeyframeMapper<T, U>, Integer.One>(mapKeyframe))
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

const animationName = ({ theme: { animationType }, ...restProps }: AnimationProps): Keyframes =>
  [AnimationType.Horizontal, AnimationType.Vertical]
    .zip<[AnimationType, AnimationType], [(props: AnimationWidthProps) => Keyframes, Keyframes]>(horizontalAnimation, verticalAnimation)
    .find(([animation]: [AnimationType, OrFunction<[AnimationWidthProps], Keyframes>]): boolean => animation === animationType)!
    .at<Integer.One>(Integer.One)
    .callOrGet<[NoThemeHorizontalAnimationProps], [NoThemeVerticalAnimationProps], Keyframes>(restProps);

const animation: RuleSet<AnimationProps> = css<AnimationProps>`
  animation-name: ${animationName};
  animation-direction: var(${VariableName.AnimationDirection});
  animation-timing-function: var(${VariableName.AnimationTimingFunction});
  animation-fill-mode: var(${VariableName.AnimationFillMode});
  animation-duration: var(${VariableName.AnimationDuration});
  animation-iteration-count: ${Integer.One};
`;

type ViewFactoryMapper<T extends Styled, U extends object, V> = (
  ...args: [Props<T, U, V>, Optional<OrFunction<[WithContext<U>], Maybe<V>>>]
) => Maybe<V>;

const viewFactoryMapper = <T extends Styled, U extends object, V>(
  props: Props<T, U, V>,
  value?: OrFunction<[WithContext<U>], Maybe<V>>,
): Maybe<V> => value?.callOrGet<[WithContext<U>], Maybe<V>>(props);

const reduceStyles = (accumulator: CSSProperties, currentStyle: Maybe<CSSProperties>): CSSProperties => ({
  ...accumulator,
  ...currentStyle,
});

const styleFactory = <T extends Styled, U extends object, V>(
  style: Optional<OrArray<StyleViewFactory<U>>>,
  props: Props<T, U, V>,
): CSSProperties =>
  Array.toArray<Optional<StyleViewFactory<U>>>(style)
    .map<Maybe<CSSProperties>>(viewFactoryMapper.bindArgs<ViewFactoryMapper<T, U, CSSProperties>, Integer.One>(props))
    .reduce<CSSProperties>(reduceStyles, {});

const classNameFactory = <T extends Styled, U extends object, V>(
  className: Optional<OrArray<ClassNameViewFactory<U>>>,
  props: Props<T, U, V>,
): Optional<string> =>
  Array.toArray<Optional<ClassNameViewFactory<U>>>(className)
    .map<Maybe<string>>(viewFactoryMapper.bindArgs<ViewFactoryMapper<T, U, string>, Integer.One>(props))
    .filter<string>((className: Maybe<string>): className is string => !!className)
    .join(Text.Space);

type CssFactory<T extends Styled> = <U extends object, V>(...args: [T, Props<T, U, V>]) => CssRule<U>[];

const cssFactory = <T extends Styled, U extends object, V>(styledComponent: T, props: Props<T, U, V>): CssRule<U>[] =>
  Array.toArray<Optional<CssViewFactory<U>>>(props[`${styledComponent}${ViewKey.Css.capitalize<ViewKey.Css>()}`])
    .map<Maybe<CssRule<U>>>(viewFactoryMapper.bindArgs<ViewFactoryMapper<T, U, CssRule<U>>, Integer.One>(props))
    .filter<CssRule<U>>((value: Maybe<CssRule<U>>): value is CssRule<U> => !!value);

const mapAnimationFalsyValue = <T extends object, U>(animation: Maybe<Partial<Animation<T, U>>>): Optional<Partial<Animation<T, U>>> =>
  animation || undefined;

const mapAnimation = <T extends object, U>({ keyframeFunction, keyframes, progress }: Partial<Animation<T, U>> = {}): Optional<Keyframes> =>
  keyframeFunction && keyframes && createAnimationKeyframes(keyframeFunction, keyframes, progress);

const reduceAnimationsKeyframes = (accumulator: RuleSet<object>, currentValue: Optional<Keyframes>, index: number) => css<object>`
  ${accumulator}${index ? Text.Comma : Text.Empty}${currentValue ?? AnimationType.None}
`;

const createAnimationsKeyframes = <T extends Styled, U extends object, V>(
  props: Props<T, U, V>,
  animation?: OrArray<AnimationViewFactory<U, V>>,
): Optional<RuleSet<object>> =>
  Array.toArray<Optional<AnimationViewFactory<U, V>>>(animation)
    .when(Array.isArray<Optional<AnimationViewFactory<U, V>>>(animation) ? animation.length : animation)
    .mapEach<[Maybe<Partial<Animation<U, V>>>, Optional<Partial<Animation<U, V>>>, Optional<Keyframes>]>(
      viewFactoryMapper.bindArgs<ViewFactoryMapper<T, U, Animation<U, V>>, Integer.One>(props),
      mapAnimationFalsyValue<U, V>,
      mapAnimation<U, V>,
    )
    .reduce<RuleSet<object>>(reduceAnimationsKeyframes, css<object>``);

const createOptionalAnimationKeyframes = (animationsKeyframes?: RuleSet<object>): Optional<RuleSet<object>> =>
  css.bindWhen<(styles: Styles<object>, ...inter: Interpolation<object>[]) => RuleSet<object>>(animationsKeyframes)`
    animation-name: ${animationsKeyframes};
  `;

type AnimationFactory<T extends Styled> = <U extends object, V>(...args: [T, Props<T, U, V>]) => Optional<RuleSet<U>>;

const animationFactory = <T extends Styled, U extends object, V>(styledComponent: T, props: Props<T, U, V>): Optional<RuleSet<U>> =>
  createOptionalAnimationKeyframes(
    createAnimationsKeyframes<T, U, V>(props, props[`${styledComponent}${ViewKey.Animation.capitalize<ViewKey.Animation>()}`]),
  );

type AttributesFactory<T extends Styled> = <U extends object, V>(...args: [T, Props<T, U, V>]) => StyledHTMLAttributes<HTMLDivElement>;

const attributesFactory = <T extends Styled, U extends object, V>(
  styledComponent: T,
  props: Props<T, U, V>,
): StyledHTMLAttributes<HTMLDivElement> => ({
  style: { ...props.style, ...styleFactory(props[`${styledComponent}${ViewKey.Style.capitalize<ViewKey.Style>()}`], props) },
  className: [props.className, classNameFactory(props[`${styledComponent}${ViewKey.ClassName.capitalize<ViewKey.ClassName>()}`], props)]
    .filter<string>((className: Optional<string>): className is string => !!className)
    .join(Text.Space),
});

interface VisibilityProps {
  visible?: boolean;
}

const visibility = ({ visible = true }: VisibilityProps): Optional<RuleSet<object>> =>
  css.bindWhen<(styles: Styles<object>, ...inter: Interpolation<object>[]) => RuleSet<object>>(!visible)`
    color: ${Color.Transparent};
  `;

interface ContainerProps<T extends object, U> extends NumbersTransitionExecutionContext, StyledView<Styled.Container, T, U> {}

type ContainerStyledComponent = AttributesStyledComponent<HTMLElement.Div, HTMLDetailedElement<HTMLDivElement>, ContainerProps<any, any>>;

// prettier-ignore
export const Container: ContainerStyledComponent = styled.div.attrs<ContainerProps<any, any>>(attributesFactory.bindArgs<AttributesFactory<Styled.Container>, Integer.One>(Styled.Container))`
  max-width: ${Integer.OneHundred}${CssUnit.Percent};
  width: ${Size.FitContent};
  height: ${Integer.One}${CssUnit.LineHeight};
  white-space: ${WhiteSpace.NoWrap};
  overflow-y: ${Overflow.Clip};
  ${cssProperties};
  ${containerVariables};
  ${cssFactory.bindArgs<CssFactory<Styled.Container>, Integer.One>(Styled.Container)};
  ${animationFactory.bindArgs<AnimationFactory<Styled.Container>, Integer.One>(Styled.Container)};
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
  > * {
    display: ${Display.Block};
  }
`;

interface CharacterProps<T extends object, U> extends StyledView<Styled.Character, T, U> {}

type CharacterStyledComponent = AttributesStyledComponent<HTMLElement.Div, HTMLDetailedElement<HTMLDivElement>, CharacterProps<any, any>>;

// prettier-ignore
export const Character: CharacterStyledComponent = styled.div.attrs<CharacterProps<any, any>>(attributesFactory.bindArgs<AttributesFactory<Styled.Character>, Integer.One>(Styled.Character))`
  display: ${Display.InlineBlock};
  ${cssFactory.bindArgs<CssFactory<Styled.Character>, Integer.One>(Styled.Character)};
  ${animationFactory.bindArgs<AnimationFactory<Styled.Character>, Integer.One>(Styled.Character)};
`;

export interface DigitProps<T extends object, U, V extends object, W> extends CharacterProps<T, U>, StyledView<Styled.Digit, V, W> {}

type DigitStyledComponent = AttributesStyledComponent<CharacterStyledComponent, CharacterStyledComponent, DigitProps<any, any, any, any>>;

// prettier-ignore
export const Digit: DigitStyledComponent = styled<CharacterStyledComponent>(Character).attrs<DigitProps<any, any, any, any>>(attributesFactory.bindArgs<AttributesFactory<Styled.Digit>, Integer.One>(Styled.Digit))`
  min-width: ${Integer.One}${CssUnit.Character};
  ${cssFactory.bindArgs<CssFactory<Styled.Digit>, Integer.One>(Styled.Digit)};
  ${animationFactory.bindArgs<AnimationFactory<Styled.Digit>, Integer.One>(Styled.Digit)};
`;

interface SeparatorProps<T extends object, U, V extends object, W> extends CharacterProps<T, U>, StyledView<Styled.Separator, V, W> {}

type SeparatorStyledComponent = AttributesStyledComponent<
  CharacterStyledComponent,
  CharacterStyledComponent,
  SeparatorProps<any, any, any, any>
>;

// prettier-ignore
export const Separator: SeparatorStyledComponent = styled<CharacterStyledComponent>(Character).attrs<SeparatorProps<any, any, any, any>>(attributesFactory.bindArgs<AttributesFactory<Styled.Separator>, Integer.One>(Styled.Separator))`
  white-space: ${WhiteSpace.Pre};
  ${cssFactory.bindArgs<CssFactory<Styled.Separator>, Integer.One>(Styled.Separator)};
  ${animationFactory.bindArgs<AnimationFactory<Styled.Separator>, Integer.One>(Styled.Separator)};
`;

interface DecimalSeparatorProps<T extends object, U, V extends object, W, X extends object, Y>
  extends SeparatorProps<T, U, V, W>, StyledView<Styled.DecimalSeparator, X, Y> {}

type DecimalSeparatorStyledComponent = AttributesStyledComponent<
  SeparatorStyledComponent,
  SeparatorStyledComponent,
  DecimalSeparatorProps<any, any, any, any, any, any>
>;

// prettier-ignore
export const DecimalSeparator: DecimalSeparatorStyledComponent = styled<SeparatorStyledComponent>(Separator).attrs<DecimalSeparatorProps<any, any, any, any, any, any>>(attributesFactory.bindArgs<AttributesFactory<Styled.DecimalSeparator>, Integer.One>(Styled.DecimalSeparator))`
  ${cssFactory.bindArgs<CssFactory<Styled.DecimalSeparator>, Integer.One>(Styled.DecimalSeparator)};
  ${animationFactory.bindArgs<AnimationFactory<Styled.DecimalSeparator>, Integer.One>(Styled.DecimalSeparator)};
`;

interface DigitGroupSeparatorProps<T extends object, U, V extends object, W, X extends object, Y>
  extends SeparatorProps<T, U, V, W>, StyledView<Styled.DigitGroupSeparator, X, Y> {}

type DigitGroupSeparatorStyledComponent = AttributesStyledComponent<
  SeparatorStyledComponent,
  SeparatorStyledComponent,
  DigitGroupSeparatorProps<any, any, any, any, any, any>
>;

// prettier-ignore
export const DigitGroupSeparator: DigitGroupSeparatorStyledComponent = styled<SeparatorStyledComponent>(Separator).attrs<DigitGroupSeparatorProps<any, any, any, any, any, any>>(attributesFactory.bindArgs<AttributesFactory<Styled.DigitGroupSeparator>, Integer.One>(Styled.DigitGroupSeparator))`
  ${cssFactory.bindArgs<CssFactory<Styled.DigitGroupSeparator>, Integer.One>(Styled.DigitGroupSeparator)};
  ${animationFactory.bindArgs<AnimationFactory<Styled.DigitGroupSeparator>, Integer.One>(Styled.DigitGroupSeparator)};
`;

interface NegativeProps<T extends object, U, V extends object, W>
  extends VisibilityProps, CharacterProps<T, U>, StyledView<Styled.Negative, V, W> {}

type NegativeStyledComponent = AttributesStyledComponent<
  CharacterStyledComponent,
  CharacterStyledComponent,
  NegativeProps<any, any, any, any>
>;

// prettier-ignore
export const Negative: NegativeStyledComponent = styled<CharacterStyledComponent>(Character).attrs<NegativeProps<any, any, any, any>>(attributesFactory.bindArgs<AttributesFactory<Styled.Negative>, Integer.One>(Styled.Negative))`
  ${visibility};
  ${cssFactory.bindArgs<CssFactory<Styled.Negative>, Integer.One>(Styled.Negative)};
  ${animationFactory.bindArgs<AnimationFactory<Styled.Negative>, Integer.One>(Styled.Negative)};
`;

interface InvalidProps<T extends object, U, V extends object, W> extends CharacterProps<T, U>, StyledView<Styled.Invalid, V, W> {}

type InvalidStyledComponent = AttributesStyledComponent<
  CharacterStyledComponent,
  CharacterStyledComponent,
  InvalidProps<any, any, any, any>
>;

// prettier-ignore
export const Invalid: InvalidStyledComponent = styled<CharacterStyledComponent>(Character).attrs<InvalidProps<any, any, any, any>>(attributesFactory.bindArgs<AttributesFactory<Styled.Invalid>, Integer.One>(Styled.Invalid))`
  ${cssFactory.bindArgs<CssFactory<Styled.Invalid>, Integer.One>(Styled.Invalid)};
  ${animationFactory.bindArgs<AnimationFactory<Styled.Invalid>, Integer.One>(Styled.Invalid)};
`;
