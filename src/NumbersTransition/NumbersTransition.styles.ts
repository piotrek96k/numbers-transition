import { CSSProperties, ComponentPropsWithRef, DetailedHTMLProps, HTMLAttributes } from 'react';
import styled, { RuleSet, css, keyframes } from 'styled-components';
import { BaseObject, ExecutionProps, IStyledComponent, Keyframes, KnownTarget, Substitute } from 'styled-components/dist/types';
import {
  AnimationDirection,
  AnimationNumber,
  AnimationTimingFunction,
  AnimationType,
  Character,
  HTMLElement,
  Integer,
  Runtime,
  Styled,
  VariableName,
  ViewKey,
} from './NumbersTransition.enums';
import './NumbersTransition.extensions';
import { Enum, Falsy, OrArray, TypeOf } from './NumbersTransition.types';

type StyledComponentBase<T extends object> = IStyledComponent<Runtime.Web, T>;

type HTMLDetailedElement<T> = DetailedHTMLProps<HTMLAttributes<T>, T>;

export type StyledComponent<T, U extends object = BaseObject> = StyledComponentBase<Substitute<HTMLDetailedElement<T>, U>>;

export type ExtensionStyledComponent<T extends KnownTarget, U extends object = BaseObject> = StyledComponentBase<
  Substitute<ComponentPropsWithRef<T> & BaseObject, U>
>;

export type AttributesStyledComponent<T extends KnownTarget, U extends object, V extends object = BaseObject> = StyledComponentBase<
  Substitute<Substitute<Substitute<U extends KnownTarget ? ComponentPropsWithRef<U> : U, ComponentPropsWithRef<T>>, V>, BaseObject>
>;

export type AnimationTimingFunctionTuple = [[number, number], [number, number]];

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
  animationDuration?: number;
  animationTimingFunction?: AnimationTimingFunctionTuple;
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
  initialValue: string | number;
}

interface EnumProperty<E extends Enum<E>> extends BaseProperty {
  enumerable: E;
  initialValue: TypeOf<E>;
}

const mapEnumProperty = <E extends Enum<E>>({ enumerable, ...restProperty }: EnumProperty<E>): Property => ({
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

const enumProperties: EnumProperty<typeof AnimationType | typeof AnimationDirection>[] = [
  { name: VariableName.AnimationType, enumerable: AnimationType, initialValue: AnimationType.None },
  { name: VariableName.AnimationDirection, enumerable: AnimationDirection, initialValue: AnimationDirection.None },
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
  { name: VariableName.AnimationTimingFunction, syntax: '*', initialValue: `cubic-bezier(${AnimationTimingFunction.Ease.join()})` },
];

const cssProperties: RuleSet<object>[] = properties.map<RuleSet<object>>(mapProperty);

const containerVariables = ({
  theme: {
    numberOfAnimations,
    animationNumber,
    animationType,
    animationDirection,
    animationDuration,
    animationTimingFunction,
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
  },
}: NumbersTransitionExecutionContext): RuleSet<object> => css<object>`
  ${VariableName.NumberOfAnimations}: ${numberOfAnimations};
  ${VariableName.AnimationNumber}: ${animationNumber};
  ${VariableName.AnimationType}: ${animationType};
  ${VariableName.AnimationDirection}: ${animationDirection};
  ${VariableName.AnimationTimingFunction}: cubic-bezier(${animationTimingFunction?.join()});
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

interface AnimationDelayProps {
  animationDelay?: number;
}

interface AnimationCommonProps extends NumbersTransitionExecutionContext, AnimationDelayProps {}

interface AnimationWidthProps {
  animationStartWidth: number;
  animationEndWidth: number;
}

interface HorizontalAnimationProps extends AnimationCommonProps, AnimationWidthProps {}

export type VerticalAnimationProps = AnimationCommonProps;

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
    .zip<number>(progress)
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

const animationName = ({ theme: { animationType }, ...restProps }: NumbersTransitionExecutionContext): undefined | Keyframes => {
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
  animation-duration: var(${VariableName.AnimationDuration});
  animation-timing-function: var(${VariableName.AnimationTimingFunction});
  animation-delay: ${({ animationDelay = Integer.Zero }: AnimationDelayProps): number => animationDelay}ms;
  animation-iteration-count: ${Integer.One};
  animation-fill-mode: forwards;
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
  style: undefined | OrArray<CSSProperties | StyleFactory<U>>,
  props: Omit<Props<T, U, V>, AttributesOmittedKeys<T, U>>,
): CSSProperties =>
  [style]
    .flat<(undefined | OrArray<CSSProperties | StyleFactory<U>>)[], Integer.One>()
    .map<CSSProperties | Falsy>(createViewFactoryMapper<T, U, CSSProperties, AttributesOmittedKeys<T, U>>(props))
    .reduce<CSSProperties>(reduceStyles, {});

const classNameFactory = <T extends Styled, U extends object, V>(
  className: undefined | OrArray<string | ClassNameFactory<U>>,
  props: Omit<Props<T, U, V>, AttributesOmittedKeys<T, U>>,
): undefined | string =>
  [className]
    .flat<(undefined | OrArray<string | ClassNameFactory<U>>)[], Integer.One>()
    .map<string | Falsy>(createViewFactoryMapper<T, U, string, AttributesOmittedKeys<T, U>>(props))
    .filter<string>((className: string | Falsy): className is string => !!className)
    .join(Character.Space);

const toCssArray = <T extends object>(
  cssStyle?: OrArray<CssRule<T> | CssRuleFactory<T>>,
): (undefined | CssRule<T> | CssRuleFactory<T>)[] =>
  Array.isArray<undefined | CssRule<T> | CssRuleFactory<T>>(cssStyle) &&
  Array.isOfDepth<CssRule<T> | CssRuleFactory<T>, Integer.Two>(cssStyle, Integer.Two)
    ? cssStyle
    : [<undefined | CssRule<T> | CssRuleFactory<T>>cssStyle];

const cssFactory =
  <T extends Styled>(styledComponent: T): (<U extends object, V>(props: Props<T, U, V>) => CssRule<U>[]) =>
  <U extends object, V>({
    [<keyof CssView<T, U>>`${styledComponent}${ViewKey.Css.capitalize()}`]: cssStyle,
    ...restProps
  }: Props<T, U, V>): CssRule<U>[] =>
    toCssArray<U>(cssStyle)
      .map<CssRule<U> | Falsy>(createViewFactoryMapper<T, U, CssRule<U>, keyof CssView<T, U>>(restProps))
      .filter<CssRule<U>>((value: CssRule<U> | Falsy): value is CssRule<U> => !!value);

const mapAnimationFalsyValue = <T extends object, U>(animation: Partial<Animation<T, U>> | Falsy): undefined | Partial<Animation<T, U>> =>
  animation || undefined;

const mapAnimation = <T extends object, U>({ keyframeFunction, keyframes, progress }: Partial<Animation<T, U>> = {}):
  | undefined
  | Keyframes => keyframeFunction && keyframes && createAnimationKeyframes(keyframeFunction, keyframes, progress);

const reduceAnimationsKeyframes = (accumulator: RuleSet<object>, currentValue: undefined | Keyframes, index: number) => css<object>`
  ${accumulator}${index ? Character.Comma : Character.Empty}${currentValue ?? AnimationType.None}
`;

const createAnimationsKeyframes = <T extends Styled, U extends object, V>(
  props: Omit<Props<T, U, V>, keyof AnimationView<T, U, V>>,
  animation?: OrArray<Animation<U, V> | AnimationFactory<U, V>>,
): RuleSet<object> | false =>
  !!(Array.isArray<undefined | Animation<U, V> | AnimationFactory<U, V>>(animation) ? animation.length : animation) &&
  [animation!]
    .flat<OrArray<Animation<U, V> | AnimationFactory<U, V>>[], Integer.One>()
    .map<Partial<Animation<U, V>> | Falsy>(createViewFactoryMapper<T, U, Animation<U, V>, keyof AnimationView<T, U, V>>(props))
    .map<undefined | Partial<Animation<U, V>>>(mapAnimationFalsyValue<U, V>)
    .map<undefined | Keyframes>(mapAnimation<U, V>)
    .reduce<RuleSet<object>>(reduceAnimationsKeyframes, css<object>``);

const createOptionalAnimation = (animationsKeyframes: RuleSet<object> | false): RuleSet<object> | false =>
  animationsKeyframes &&
  css<object>`
    animation-name: ${animationsKeyframes};
  `;

const animationFactory =
  <T extends Styled>(styledComponent: T): (<U extends object, V>(props: Props<T, U, V>) => RuleSet<U> | false) =>
  <U extends object, V>({
    [<keyof AnimationView<T, U, V>>`${styledComponent}${ViewKey.Animation.capitalize()}`]: animation,
    ...restProps
  }: Props<T, U, V>): RuleSet<U> | false =>
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
      .filter<string>((className: undefined | string): className is string => !!className)
      .join(Character.Space),
  });

interface VisibilityProps {
  visible?: boolean;
}

const visibility = ({ visible = true }: VisibilityProps): RuleSet<object> | false =>
  !visible &&
  css<object>`
    opacity: ${Integer.Zero};
  `;

interface ContainerProps<T extends object, U> extends NumbersTransitionExecutionContext, StyledView<Styled.Container, T, U> {}

type ContainerStyledComponent = AttributesStyledComponent<HTMLElement.Div, HTMLDetailedElement<HTMLDivElement>, ContainerProps<any, any>>;

export const Container: ContainerStyledComponent = styled.div.attrs<ContainerProps<any, any>>(
  attributesFactory<Styled.Container>(Styled.Container),
)`
  ${cssFactory<Styled.Container>(Styled.Container)};
  ${animationFactory<Styled.Container>(Styled.Container)};
  ${cssProperties};
  ${containerVariables};
  max-width: ${Integer.OneHundred}%;
  width: fit-content;
  height: ${Integer.One}lh;
  white-space: nowrap;
  overflow-y: clip;
`;

type HorizontalAnimationStyledComponent = StyledComponent<HTMLDivElement, HorizontalAnimationProps>;

export const HorizontalAnimation: HorizontalAnimationStyledComponent = styled.div<HorizontalAnimationProps>`
  ${animation};
  &,
  :has(~ &):not(:has(:first-child)) {
    display: inline-block;
    height: inherit;
    overflow-x: hidden;
  }
  :only-child {
    float: right;
    height: inherit;
  }
`;

type VerticalAnimationStyledComponent = StyledComponent<HTMLDivElement, VerticalAnimationProps>;

export const VerticalAnimation: VerticalAnimationStyledComponent = styled.div<VerticalAnimationProps>`
  display: inline-flex;
  flex-direction: column;
  height: inherit;
  :only-child:has(:not(:only-child)) {
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

type DelayStyledComponent = StyledComponent<HTMLDivElement, BaseObject>;

export const Delay: DelayStyledComponent = styled.div<BaseObject>`
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
  ${cssFactory<Styled.Symbol>(Styled.Symbol)};
  ${animationFactory<Styled.Symbol>(Styled.Symbol)};
  display: inline-block;
`;

export interface DigitProps<T extends object, U, V extends object, W> extends SymbolProps<T, U>, StyledView<Styled.Digit, V, W> {}

type DigitStyledComponent = AttributesStyledComponent<SymbolStyledComponent, SymbolStyledComponent, DigitProps<any, any, any, any>>;

export const Digit: DigitStyledComponent = styled<SymbolStyledComponent>(Symbol).attrs<DigitProps<any, any, any, any>>(
  attributesFactory<Styled.Digit>(Styled.Digit),
)`
  ${cssFactory<Styled.Digit>(Styled.Digit)};
  ${animationFactory<Styled.Digit>(Styled.Digit)};
  min-width: ${Integer.One}ch;
`;

interface SeparatorProps<T extends object, U, V extends object, W> extends SymbolProps<T, U>, StyledView<Styled.Separator, V, W> {}

type SeparatorStyledComponent = AttributesStyledComponent<SymbolStyledComponent, SymbolStyledComponent, SeparatorProps<any, any, any, any>>;

const Separator: SeparatorStyledComponent = styled<SymbolStyledComponent>(Symbol).attrs<SeparatorProps<any, any, any, any>>(
  attributesFactory<Styled.Separator>(Styled.Separator),
)`
  ${cssFactory<Styled.Separator>(Styled.Separator)};
  ${animationFactory<Styled.Separator>(Styled.Separator)};
  white-space: pre;
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
  ${cssFactory<Styled.Negative>(Styled.Negative)};
  ${animationFactory<Styled.Negative>(Styled.Negative)};
  ${visibility};
`;

interface InvalidProps<T extends object, U, V extends object, W> extends SymbolProps<T, U>, StyledView<Styled.Invalid, V, W> {}

type InvalidStyledComponent = AttributesStyledComponent<SymbolStyledComponent, SymbolStyledComponent, InvalidProps<any, any, any, any>>;

export const Invalid: InvalidStyledComponent = styled<SymbolStyledComponent>(Symbol).attrs<InvalidProps<any, any, any, any>>(
  attributesFactory<Styled.Invalid>(Styled.Invalid),
)`
  ${cssFactory<Styled.Invalid>(Styled.Invalid)};
  ${animationFactory<Styled.Invalid>(Styled.Invalid)};
`;
