import { CSSProperties, ComponentPropsWithRef, DetailedHTMLProps, HTMLAttributes } from 'react';
import styled, { RuleSet, css, keyframes } from 'styled-components';
import { BaseObject, ExecutionProps, IStyledComponent, Keyframes, KnownTarget, Substitute } from 'styled-components/dist/types';
import {
  AnimationDirections,
  AnimationNumbers,
  AnimationTimingFunctions,
  AnimationTypes,
  HTMLElements,
  Numbers,
  Runtime,
  Strings,
  StyledComponents,
  VariableNames,
  ViewKeys,
} from './NumbersTransition.enums';
import './NumbersTransition.extensions';
import { Enum, Falsy, OrArray, TypeOf } from './NumbersTransition.types';

type StyledComponentBase<T extends object> = IStyledComponent<Runtime.WEB, T>;

type HTMLDetailedElement<T> = DetailedHTMLProps<HTMLAttributes<T>, T>;

type StyledComponent<T, U extends object = BaseObject> = StyledComponentBase<Substitute<HTMLDetailedElement<T>, U>>;

type ExtensionStyledComponent<T extends KnownTarget, U extends object = BaseObject> = StyledComponentBase<
  Substitute<ComponentPropsWithRef<T> & BaseObject, U>
>;

type AttributesStyledComponent<T extends KnownTarget, U extends object, V extends object = BaseObject> = StyledComponentBase<
  Substitute<Substitute<Substitute<U extends KnownTarget ? ComponentPropsWithRef<U> : U, ComponentPropsWithRef<T>>, V>, BaseObject>
>;

export type AnimationTimingFunction = [[number, number], [number, number]];

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
  numberOfAnimations?: AnimationNumbers;
  animationNumber?: AnimationNumbers;
  animationType?: AnimationTypes;
  animationDirection?: AnimationDirections;
  animationDuration?: number;
  animationTimingFunction?: AnimationTimingFunction;
  horizontalAnimationDuration?: number;
  verticalAnimationDuration?: number;
  totalAnimationDuration?: number;
}

export interface NumbersTransitionExecutionContext extends ExecutionProps {
  theme: NumbersTransitionTheme;
}

interface BaseProperty {
  name: VariableNames;
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
  syntax: Object.values<string | number>(enumerable).join(`${Strings.SPACE}${Strings.VERTICAL_LINE}${Strings.SPACE}`),
});

const mapTimeProperty = (name: VariableNames): Property => ({ name, syntax: '<time>', initialValue: `${Numbers.ZERO}ms` });

const mapIntegerProperty = (name: VariableNames): Property => ({ name, syntax: '<integer>', initialValue: Numbers.ZERO });

const mapProperty = ({ name, syntax, initialValue }: Property): RuleSet<object> => css<object>`
  @property ${name} {
    syntax: '${syntax}';
    inherits: true;
    initial-value: ${initialValue};
  }
`;

const enumProperties: EnumProperty<typeof AnimationTypes | typeof AnimationDirections>[] = [
  { name: VariableNames.ANIMATION_TYPE, enumerable: AnimationTypes, initialValue: AnimationTypes.NONE },
  { name: VariableNames.ANIMATION_DIRECTION, enumerable: AnimationDirections, initialValue: AnimationDirections.NONE },
];

const timeProperties: VariableNames[] = [
  VariableNames.ANIMATION_DURATION,
  VariableNames.HORIZONTAL_ANIMATION_DURATION,
  VariableNames.VERTICAL_ANIMATION_DURATION,
  VariableNames.TOTAL_ANIMATION_DURATION,
];

const integerProperties: VariableNames[] = [
  VariableNames.NUMBER_OF_ANIMATIONS,
  VariableNames.ANIMATION_NUMBER,
  VariableNames.CHARACTERS_LENGTH,
  VariableNames.DIGITS_LENGTH,
  VariableNames.SEPARATORS_LENGTH,
  VariableNames.DECIMAL_SEPARATOR_LENGTH,
  VariableNames.DIGIT_GROUP_SEPARATORS_LENGTH,
  VariableNames.NEGATIVE_CHARACTER_LENGTH,
  VariableNames.INVALID_LENGTH,
  VariableNames.COLUMN_LENGTH,
];

const properties: Property[] = [
  ...enumProperties.map<Property>(mapEnumProperty),
  ...timeProperties.map<Property>(mapTimeProperty),
  ...integerProperties.map<Property>(mapIntegerProperty),
  { name: VariableNames.ANIMATION_TIMING_FUNCTION, syntax: '*', initialValue: `cubic-bezier(${AnimationTimingFunctions.EASE.join()})` },
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
    charactersLength,
    digitsLength,
    separatorsLength,
    decimalSeparatorLength,
    digitGroupSeparatorsLength,
    negativeCharacterLength,
    invalidLength,
  },
}: NumbersTransitionExecutionContext): RuleSet<object> => css<object>`
  ${VariableNames.NUMBER_OF_ANIMATIONS}: ${numberOfAnimations};
  ${VariableNames.ANIMATION_NUMBER}: ${animationNumber};
  ${VariableNames.ANIMATION_TYPE}: ${animationType};
  ${VariableNames.ANIMATION_DIRECTION}: ${animationDirection};
  ${VariableNames.ANIMATION_TIMING_FUNCTION}: cubic-bezier(${animationTimingFunction?.join()});
  ${VariableNames.ANIMATION_DURATION}: ${animationDuration}ms;
  ${VariableNames.HORIZONTAL_ANIMATION_DURATION}: ${horizontalAnimationDuration}ms;
  ${VariableNames.VERTICAL_ANIMATION_DURATION}: ${verticalAnimationDuration}ms;
  ${VariableNames.TOTAL_ANIMATION_DURATION}: ${totalAnimationDuration}ms;
  ${VariableNames.CHARACTERS_LENGTH}: ${charactersLength};
  ${VariableNames.DIGITS_LENGTH}: ${digitsLength};
  ${VariableNames.SEPARATORS_LENGTH}: ${separatorsLength};
  ${VariableNames.DECIMAL_SEPARATOR_LENGTH}: ${decimalSeparatorLength};
  ${VariableNames.DIGIT_GROUP_SEPARATORS_LENGTH}: ${digitGroupSeparatorsLength};
  ${VariableNames.NEGATIVE_CHARACTER_LENGTH}: ${negativeCharacterLength};
  ${VariableNames.INVALID_LENGTH}: ${invalidLength};
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

type StyleView<T extends StyledComponents, U extends object> = {
  [K in `${T}${Capitalize<ViewKeys.STYLE>}`]?: OrArray<CSSProperties | StyleFactory<U>>;
};

type ClassNameView<T extends StyledComponents, U extends object> = {
  [K in `${T}${Capitalize<ViewKeys.CLASS_NAME>}`]?: OrArray<string | ClassNameFactory<U>>;
};

type CssView<T extends StyledComponents, U extends object> = {
  [K in `${T}${Capitalize<ViewKeys.CSS>}`]?: OrArray<CssRule<U> | CssRuleFactory<U>>;
};

type AnimationView<T extends StyledComponents, U extends object, V> = {
  [K in `${T}${Capitalize<ViewKeys.ANIMATION>}`]?: OrArray<Animation<U, V> | AnimationFactory<U, V>>;
};

export type StyledView<T extends StyledComponents, U extends object, V> = StyleView<T, U> &
  ClassNameView<T, U> &
  CssView<T, U> &
  AnimationView<T, U, V>;

type Props<T extends StyledComponents, U extends object, V> = U &
  HTMLAttributes<HTMLDivElement> &
  NumbersTransitionExecutionContext &
  StyledView<T, U, V>;

type AttributesOmittedKeys<T extends StyledComponents, U extends object> =
  | keyof StyleView<T, U>
  | keyof ClassNameView<T, U>
  | `${ViewKeys.STYLE}`
  | `${ViewKeys.CLASS_NAME}`;

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
    ${progress ?? (index * Numbers.ONE_HUNDRED) / (length - Numbers.ONE)}% {
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
  Numbers.ZERO,
  Numbers.MINUS_ONE_HUNDRED,
]);

const animationName = ({ theme: { animationType }, ...restProps }: NumbersTransitionExecutionContext): undefined | Keyframes => {
  switch (animationType) {
    case AnimationTypes.HORIZONTAL:
      return horizontalAnimation(<HorizontalAnimationProps>restProps);
    case AnimationTypes.VERTICAL:
      return verticalAnimation;
  }
};

const animation: RuleSet<AnimationProps> = css<AnimationProps>`
  animation-name: ${animationName};
  animation-direction: var(${VariableNames.ANIMATION_DIRECTION});
  animation-duration: var(${VariableNames.ANIMATION_DURATION});
  animation-timing-function: var(${VariableNames.ANIMATION_TIMING_FUNCTION});
  animation-delay: ${({ animationDelay = Numbers.ZERO }: AnimationDelayProps): number => animationDelay}ms;
  animation-iteration-count: ${Numbers.ONE};
  animation-fill-mode: forwards;
`;

const createViewFactoryMapper =
  <T extends StyledComponents, U extends object, V, W extends string>(
    props: Omit<Props<T, U, V>, W>,
  ): ((value?: V | Factory<U, V>) => V | Falsy) =>
  (value?: V | Factory<U, V>): V | Falsy =>
    typeof value === 'function' ? (<Factory<U, V>>value)(<U & NumbersTransitionExecutionContext>props) : value;

const reduceStyles = (accumulator: CSSProperties, currentStyle: CSSProperties | Falsy): CSSProperties => ({
  ...accumulator,
  ...currentStyle,
});

const styleFactory = <T extends StyledComponents, U extends object, V>(
  style: undefined | OrArray<CSSProperties | StyleFactory<U>>,
  props: Omit<Props<T, U, V>, AttributesOmittedKeys<T, U>>,
): CSSProperties =>
  [style]
    .flat<(undefined | OrArray<CSSProperties | StyleFactory<U>>)[], Numbers.ONE>()
    .map<CSSProperties | Falsy>(createViewFactoryMapper<T, U, CSSProperties, AttributesOmittedKeys<T, U>>(props))
    .reduce<CSSProperties>(reduceStyles, {});

const classNameFactory = <T extends StyledComponents, U extends object, V>(
  className: undefined | OrArray<string | ClassNameFactory<U>>,
  props: Omit<Props<T, U, V>, AttributesOmittedKeys<T, U>>,
): undefined | string =>
  [className]
    .flat<(undefined | OrArray<string | ClassNameFactory<U>>)[], Numbers.ONE>()
    .map<string | Falsy>(createViewFactoryMapper<T, U, string, AttributesOmittedKeys<T, U>>(props))
    .filter<string>((className: string | Falsy): className is string => !!className)
    .join(Strings.SPACE);

const toCssArray = <T extends object>(
  cssStyle?: OrArray<CssRule<T> | CssRuleFactory<T>>,
): (undefined | CssRule<T> | CssRuleFactory<T>)[] =>
  Array.isArray<undefined | CssRule<T> | CssRuleFactory<T>>(cssStyle) &&
  Array.isOfDepth<CssRule<T> | CssRuleFactory<T>, Numbers.TWO>(cssStyle, Numbers.TWO)
    ? cssStyle
    : [<undefined | CssRule<T> | CssRuleFactory<T>>cssStyle];

const cssFactory =
  <T extends StyledComponents>(styledComponent: T): (<U extends object, V>(props: Props<T, U, V>) => CssRule<U>[]) =>
  <U extends object, V>({
    [<keyof CssView<T, U>>`${styledComponent}${ViewKeys.CSS.capitalize()}`]: cssStyle,
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
  ${accumulator}${index ? Strings.COMMA : Strings.EMPTY}${currentValue ?? AnimationTypes.NONE}
`;

const createAnimationsKeyframes = <T extends StyledComponents, U extends object, V>(
  props: Omit<Props<T, U, V>, keyof AnimationView<T, U, V>>,
  animation?: OrArray<Animation<U, V> | AnimationFactory<U, V>>,
): RuleSet<object> | false =>
  !!(Array.isArray<undefined | Animation<U, V> | AnimationFactory<U, V>>(animation) ? animation.length : animation) &&
  [animation!]
    .flat<OrArray<Animation<U, V> | AnimationFactory<U, V>>[], Numbers.ONE>()
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
  <T extends StyledComponents>(styledComponent: T): (<U extends object, V>(props: Props<T, U, V>) => RuleSet<U> | false) =>
  <U extends object, V>({
    [<keyof AnimationView<T, U, V>>`${styledComponent}${ViewKeys.ANIMATION.capitalize()}`]: animation,
    ...restProps
  }: Props<T, U, V>): RuleSet<U> | false =>
    createOptionalAnimation(createAnimationsKeyframes<T, U, V>(restProps, animation));

const attributesFactory =
  <T extends StyledComponents>(styledComponent: T): (<U extends object, V>(props: Props<T, U, V>) => HTMLAttributes<HTMLDivElement>) =>
  <U extends object, V>({
    style,
    className,
    [<keyof StyleView<T, U>>`${styledComponent}${ViewKeys.STYLE.capitalize()}`]: styleView,
    [<keyof ClassNameView<T, U>>`${styledComponent}${ViewKeys.CLASS_NAME.capitalize()}`]: classNameView,
    ...restProps
  }: Props<T, U, V>): HTMLAttributes<HTMLDivElement> => ({
    style: { ...style, ...styleFactory(styleView, restProps) },
    className: [className, classNameFactory(classNameView, restProps)]
      .filter<string>((className: undefined | string): className is string => !!className)
      .join(Strings.SPACE),
  });

interface VisibilityProps {
  visible?: boolean;
}

const visibility = ({ visible = true }: VisibilityProps): RuleSet<object> | false =>
  !visible &&
  css<object>`
    opacity: ${Numbers.ZERO};
  `;

interface ContainerProps<T extends object, U> extends NumbersTransitionExecutionContext, StyledView<StyledComponents.CONTAINER, T, U> {}

type ContainerStyledComponent = AttributesStyledComponent<HTMLElements.DIV, HTMLDetailedElement<HTMLDivElement>, ContainerProps<any, any>>;

export const Container: ContainerStyledComponent = styled.div.attrs<ContainerProps<any, any>>(
  attributesFactory<StyledComponents.CONTAINER>(StyledComponents.CONTAINER),
)`
  ${cssFactory<StyledComponents.CONTAINER>(StyledComponents.CONTAINER)};
  ${animationFactory<StyledComponents.CONTAINER>(StyledComponents.CONTAINER)};
  ${cssProperties};
  ${containerVariables};
  max-width: ${Numbers.ONE_HUNDRED}%;
  width: fit-content;
  height: ${Numbers.ONE}lh;
  white-space: nowrap;
`;

type AnimationStyledComponent = StyledComponent<HTMLDivElement>;

const Animation: AnimationStyledComponent = styled.div`
  &,
  ~ *:not(:has(:only-child)) {
    display: inline-block;
    overflow: hidden;
    height: inherit;
  }
  :has(~ &):not(:has(:first-child)) {
    overflow: hidden;
  }
`;

type HorizontalAnimationStyledComponent = ExtensionStyledComponent<AnimationStyledComponent, HorizontalAnimationProps>;

export const HorizontalAnimation: HorizontalAnimationStyledComponent = styled(Animation)<HorizontalAnimationProps>`
  ${animation};
  :only-child {
    float: right;
    height: inherit;
  }
`;

type VerticalAnimationStyledComponent = ExtensionStyledComponent<AnimationStyledComponent, VerticalAnimationProps>;

export const VerticalAnimation: VerticalAnimationStyledComponent = styled(Animation)<VerticalAnimationProps>`
  :only-child:has(:not(:only-child)) {
    ${animation};
    position: relative;
  }
  :last-child:not(:only-child) {
    position: absolute;
    top: ${Numbers.ONE_HUNDRED}%;
  }
  :only-child > *,
  ~ *:not(:has(:only-child)) > * {
    display: block;
  }
`;

interface CharacterProps<T extends object, U> extends StyledView<StyledComponents.CHARACTER, T, U> {}

type CharacterStyledComponent = AttributesStyledComponent<HTMLElements.DIV, HTMLDetailedElement<HTMLDivElement>, CharacterProps<any, any>>;

const Character: CharacterStyledComponent = styled.div.attrs<CharacterProps<any, any>>(
  attributesFactory<StyledComponents.CHARACTER>(StyledComponents.CHARACTER),
)`
  ${cssFactory<StyledComponents.CHARACTER>(StyledComponents.CHARACTER)};
  ${animationFactory<StyledComponents.CHARACTER>(StyledComponents.CHARACTER)};
  display: inline-block;
`;

export interface DigitProps<T extends object, U, V extends object, W>
  extends CharacterProps<T, U>,
    StyledView<StyledComponents.DIGIT, V, W> {}

type DigitStyledComponent = AttributesStyledComponent<CharacterStyledComponent, CharacterStyledComponent, DigitProps<any, any, any, any>>;

export const Digit: DigitStyledComponent = styled<CharacterStyledComponent>(Character).attrs<DigitProps<any, any, any, any>>(
  attributesFactory<StyledComponents.DIGIT>(StyledComponents.DIGIT),
)`
  ${cssFactory<StyledComponents.DIGIT>(StyledComponents.DIGIT)};
  ${animationFactory<StyledComponents.DIGIT>(StyledComponents.DIGIT)};
  min-width: ${Numbers.ONE}ch;
`;

interface SeparatorProps<T extends object, U, V extends object, W>
  extends CharacterProps<T, U>,
    StyledView<StyledComponents.SEPARATOR, V, W> {}

type SeparatorStyledComponent = AttributesStyledComponent<
  CharacterStyledComponent,
  CharacterStyledComponent,
  SeparatorProps<any, any, any, any>
>;

const Separator: SeparatorStyledComponent = styled<CharacterStyledComponent>(Character).attrs<SeparatorProps<any, any, any, any>>(
  attributesFactory<StyledComponents.SEPARATOR>(StyledComponents.SEPARATOR),
)`
  ${cssFactory<StyledComponents.SEPARATOR>(StyledComponents.SEPARATOR)};
  ${animationFactory<StyledComponents.SEPARATOR>(StyledComponents.SEPARATOR)};
  white-space: pre;
`;

interface DecimalSeparatorProps<T extends object, U, V extends object, W, X extends object, Y>
  extends SeparatorProps<T, U, V, W>,
    StyledView<StyledComponents.DECIMAL_SEPARATOR, X, Y> {}

type DecimalSeparatorStyledComponent = AttributesStyledComponent<
  SeparatorStyledComponent,
  SeparatorStyledComponent,
  DecimalSeparatorProps<any, any, any, any, any, any>
>;

export const DecimalSeparator: DecimalSeparatorStyledComponent = styled<SeparatorStyledComponent>(Separator).attrs<
  DecimalSeparatorProps<any, any, any, any, any, any>
>(attributesFactory<StyledComponents.DECIMAL_SEPARATOR>(StyledComponents.DECIMAL_SEPARATOR))`
  ${cssFactory<StyledComponents.DECIMAL_SEPARATOR>(StyledComponents.DECIMAL_SEPARATOR)};
  ${animationFactory<StyledComponents.DECIMAL_SEPARATOR>(StyledComponents.DECIMAL_SEPARATOR)};
`;

interface DigitGroupSeparatorProps<T extends object, U, V extends object, W, X extends object, Y>
  extends SeparatorProps<T, U, V, W>,
    StyledView<StyledComponents.DIGIT_GROUP_SEPARATOR, X, Y> {}

type DigitGroupSeparatorStyledComponent = AttributesStyledComponent<
  SeparatorStyledComponent,
  SeparatorStyledComponent,
  DigitGroupSeparatorProps<any, any, any, any, any, any>
>;

export const DigitGroupSeparator: DigitGroupSeparatorStyledComponent = styled<SeparatorStyledComponent>(Separator).attrs<
  DigitGroupSeparatorProps<any, any, any, any, any, any>
>(attributesFactory<StyledComponents.DIGIT_GROUP_SEPARATOR>(StyledComponents.DIGIT_GROUP_SEPARATOR))`
  ${cssFactory<StyledComponents.DIGIT_GROUP_SEPARATOR>(StyledComponents.DIGIT_GROUP_SEPARATOR)};
  ${animationFactory<StyledComponents.DIGIT_GROUP_SEPARATOR>(StyledComponents.DIGIT_GROUP_SEPARATOR)};
`;

interface NegativeCharacterProps<T extends object, U, V extends object, W>
  extends VisibilityProps,
    CharacterProps<T, U>,
    StyledView<StyledComponents.NEGATIVE_CHARACTER, V, W> {}

type NegativeCharacterStyledComponent = AttributesStyledComponent<
  CharacterStyledComponent,
  CharacterStyledComponent,
  NegativeCharacterProps<any, any, any, any>
>;

export const NegativeCharacter: NegativeCharacterStyledComponent = styled<CharacterStyledComponent>(Character).attrs<
  NegativeCharacterProps<any, any, any, any>
>(attributesFactory<StyledComponents.NEGATIVE_CHARACTER>(StyledComponents.NEGATIVE_CHARACTER))`
  ${cssFactory<StyledComponents.NEGATIVE_CHARACTER>(StyledComponents.NEGATIVE_CHARACTER)};
  ${animationFactory<StyledComponents.NEGATIVE_CHARACTER>(StyledComponents.NEGATIVE_CHARACTER)};
  ${visibility};
`;

interface InvalidProps<T extends object, U, V extends object, W> extends CharacterProps<T, U>, StyledView<StyledComponents.INVALID, V, W> {}

type InvalidStyledComponent = AttributesStyledComponent<
  CharacterStyledComponent,
  CharacterStyledComponent,
  InvalidProps<any, any, any, any>
>;

export const Invalid: InvalidStyledComponent = styled<CharacterStyledComponent>(Character).attrs<InvalidProps<any, any, any, any>>(
  attributesFactory<StyledComponents.INVALID>(StyledComponents.INVALID),
)`
  ${cssFactory<StyledComponents.INVALID>(StyledComponents.INVALID)};
  ${animationFactory<StyledComponents.INVALID>(StyledComponents.INVALID)};
`;
