import { CSSProperties, ComponentPropsWithRef, DetailedHTMLProps, HTMLAttributes } from 'react';
import styled, { RuleSet, css, keyframes } from 'styled-components';
import { BaseObject, ExecutionProps, IStyledComponent, Keyframes, KnownTarget, Substitute } from 'styled-components/dist/types';
import {
  AnimationDirection,
  AnimationNumbers,
  AnimationTypes,
  Display,
  HTMLElements,
  HorizontalAnimationDirection,
  Numbers,
  Runtime,
  Strings,
  StyledComponents,
  VariableNames,
  VerticalAnimationDirection,
  ViewKeys,
} from './NumbersTransition.enums';
import { CamelCase, Falsy, OrArray } from './NumbersTransition.types';

type StyledComponentBase<T extends object> = IStyledComponent<Runtime.WEB, T>;

type HTMLDetailedElement<T> = DetailedHTMLProps<HTMLAttributes<T>, T>;

type StyledComponent<T, U extends object = BaseObject> = StyledComponentBase<Substitute<HTMLDetailedElement<T>, U>>;

type ExtensionStyledComponent<T extends KnownTarget, U extends object = BaseObject> = StyledComponentBase<
  Substitute<ComponentPropsWithRef<T> & BaseObject, U>
>;

type AttributesStyledComponent<T extends KnownTarget, U extends object, V extends object = BaseObject> = StyledComponentBase<
  Substitute<Substitute<Substitute<U extends KnownTarget ? ComponentPropsWithRef<U> : U, ComponentPropsWithRef<T>>, V>, BaseObject>
>;

export interface NumbersTransitionTheme {
  $animationType?: AnimationTypes;
  $numberOfAnimations?: AnimationNumbers;
  $currentAnimationNumber?: AnimationNumbers;
  $totalAnimationDuration?: number;
  $horizontalAnimationDuration?: number;
  $verticalAnimationDuration?: number;
}

export interface NumbersTransitionExecutionContext extends ExecutionProps {
  theme: NumbersTransitionTheme;
}

interface Property {
  name: VariableNames;
  syntax: string;
  initialValue: string | number;
}

const properties: Property[] = [
  {
    name: VariableNames.ANIMATION_TYPE,
    syntax: Object.values<AnimationTypes>(AnimationTypes).join(`${Strings.SPACE}${Strings.VERTICAL_LINE}${Strings.SPACE}`),
    initialValue: AnimationTypes.NONE,
  },
  { name: VariableNames.NUMBER_OF_ANIMATIONS, syntax: '<integer>', initialValue: AnimationNumbers.ZERO },
  { name: VariableNames.CURRENT_ANIMATION_NUMBER, syntax: '<integer>', initialValue: AnimationNumbers.ZERO },
  { name: VariableNames.TOTAL_ANIMATION_DURATION, syntax: '<time>', initialValue: `${Numbers.ZERO}ms` },
  { name: VariableNames.HORIZONTAL_ANIMATION_DURATION, syntax: '<time>', initialValue: `${Numbers.ZERO}ms` },
  { name: VariableNames.VERTICAL_ANIMATION_DURATION, syntax: '<time>', initialValue: `${Numbers.ZERO}ms` },
];

const propertiesMapper = ({ name, syntax, initialValue }: Property): RuleSet<object> => css<object>`
  @property ${name} {
    syntax: '${syntax}';
    inherits: true;
    initial-value: ${initialValue};
  }
`;

const cssProperties: RuleSet<object>[] = properties.map<RuleSet<object>>(propertiesMapper);

const containerVariables = ({
  theme: {
    $animationType,
    $numberOfAnimations,
    $currentAnimationNumber,
    $totalAnimationDuration,
    $horizontalAnimationDuration,
    $verticalAnimationDuration,
  },
}: NumbersTransitionExecutionContext): RuleSet<object> => css<object>`
  ${VariableNames.ANIMATION_TYPE}: ${$animationType};
  ${VariableNames.NUMBER_OF_ANIMATIONS}: ${$numberOfAnimations};
  ${VariableNames.CURRENT_ANIMATION_NUMBER}: ${$currentAnimationNumber};
  ${VariableNames.TOTAL_ANIMATION_DURATION}: ${$totalAnimationDuration}ms;
  ${VariableNames.HORIZONTAL_ANIMATION_DURATION}: ${$horizontalAnimationDuration}ms;
  ${VariableNames.VERTICAL_ANIMATION_DURATION}: ${$verticalAnimationDuration}ms;
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
  [K in `${Strings.DOLLAR}${CamelCase<T, ViewKeys.STYLE>}`]?: OrArray<CSSProperties | StyleFactory<U>>;
};

type ClassNameView<T extends StyledComponents, U extends object> = {
  [K in `${Strings.DOLLAR}${CamelCase<T, ViewKeys.CLASS_NAME>}`]?: OrArray<string | ClassNameFactory<U>>;
};

type CssView<T extends StyledComponents, U extends object> = {
  [K in `${Strings.DOLLAR}${CamelCase<T, ViewKeys.CSS>}`]?: OrArray<CssRule<U> | CssRuleFactory<U>>;
};

type AnimationView<T extends StyledComponents, U extends object, V> = {
  [K in `${Strings.DOLLAR}${CamelCase<T, ViewKeys.ANIMATION>}`]?: OrArray<Animation<U, V> | AnimationFactory<U, V>>;
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

export type AnimationTimingFunction = [[number, number], [number, number]];

interface AnimationDirectionProps<T extends AnimationDirection> {
  $animationDirection: T;
}

interface AnimationDurationProps {
  $animationDuration: number;
}

interface AnimationTimingFunctionProps {
  $animationTimingFunction: AnimationTimingFunction;
}

interface AnimationDelayProps {
  $animationDelay?: number;
}

type UnselectedAnimationDirectionProps = AnimationDirectionProps<AnimationDirection>;

interface AnimationCommonProps<T extends AnimationDirection>
  extends Partial<NumbersTransitionExecutionContext>,
    AnimationDirectionProps<T>,
    AnimationDurationProps,
    AnimationTimingFunctionProps,
    AnimationDelayProps {}

interface AnimationWidthProps {
  $animationStartWidth: number;
  $animationEndWidth: number;
}

interface HorizontalAnimationProps extends AnimationCommonProps<HorizontalAnimationDirection>, AnimationWidthProps {}

export type VerticalAnimationProps = AnimationCommonProps<VerticalAnimationDirection>;

type AnimationProps = HorizontalAnimationProps | VerticalAnimationProps;

const animationKeyframesMapper =
  <T extends object, U>(
    mapper: KeyframeFunction<T, U>,
  ): ((value: [U] | [U, number], index: number, array: ([U] | [U, number])[]) => RuleSet<T>) =>
  ([value, progress]: [U] | [U, number], index: number, { length }: ([U] | [U, number])[]): RuleSet<T> => css<T>`
    ${progress ?? (index * Numbers.ONE_HUNDRED) / (length - Numbers.ONE)}% {
      ${mapper(value)};
    }
  `;

const animationKeyframesReducer = <T extends object>(previousValue: RuleSet<T>, currentValue: RuleSet<T>): RuleSet<T> => css<T>`
  ${previousValue}
  ${currentValue}
`;

const animationKeyframes = <T extends object, U>(
  keyframeMapper: KeyframeFunction<T, U>,
  keyframesValues: U[],
  progress: number[] = [],
): Keyframes => keyframes<T>`
  ${keyframesValues
    .zip<number>(progress)
    .map<RuleSet<T>>(animationKeyframesMapper<T, U>(keyframeMapper))
    .reduce<RuleSet<T>>(animationKeyframesReducer<T>, css<T>``)}
`;

const horizontalAnimationKeyframe: KeyframeFunction<object, number> = (keyframeValue: number): RuleSet<object> => css<object>`
  width: ${keyframeValue}px;
`;

const verticalAnimationKeyframe: KeyframeFunction<object, number> = (keyframeValue: number): RuleSet<object> => css<object>`
  transform: translateY(${keyframeValue}%);
`;

const horizontalAnimation = ({ $animationStartWidth, $animationEndWidth }: AnimationWidthProps): Keyframes =>
  animationKeyframes<object, number>(horizontalAnimationKeyframe, [$animationStartWidth, $animationEndWidth]);

const verticalAnimation: Keyframes = animationKeyframes<object, number>(verticalAnimationKeyframe, [
  Numbers.ZERO,
  Numbers.MINUS_ONE_HUNDRED,
]);

const animationType = ({ theme: { $animationType } = {}, ...restProps }: AnimationProps): undefined | Keyframes => {
  switch ($animationType) {
    case AnimationTypes.HORIZONTAL:
      return horizontalAnimation(<HorizontalAnimationProps>restProps);
    case AnimationTypes.VERTICAL:
      return verticalAnimation;
  }
};

const animationName: RuleSet<AnimationProps> = css<AnimationProps>`
  animation-name: ${animationType};
`;

const animationDuration: RuleSet<AnimationDurationProps> = css<AnimationDurationProps>`
  animation-duration: ${({ $animationDuration }: AnimationDurationProps): number => $animationDuration}ms;
`;

const animationDirection: RuleSet<UnselectedAnimationDirectionProps> = css<UnselectedAnimationDirectionProps>`
  animation-direction: ${({ $animationDirection }: UnselectedAnimationDirectionProps): string => $animationDirection};
`;

const animationTimingFunction: RuleSet<AnimationTimingFunctionProps> = css<AnimationTimingFunctionProps>`
  animation-timing-function: cubic-bezier(
    ${({ $animationTimingFunction }: AnimationTimingFunctionProps): string => $animationTimingFunction.join()}
  );
`;

const animationDelay: RuleSet<AnimationDelayProps> = css<AnimationDelayProps>`
  animation-delay: ${({ $animationDelay = Numbers.ZERO }: AnimationDelayProps): number => $animationDelay}ms;
`;

const animation: RuleSet<AnimationProps> = css<AnimationProps>`
  ${animationName};
  ${animationDuration};
  ${animationDirection};
  ${animationTimingFunction};
  ${animationDelay};
  animation-iteration-count: ${Numbers.ONE};
  animation-fill-mode: forwards;
`;

const viewKey = <T extends object>(_: TemplateStringsArray, styledComponent: StyledComponents, viewKey: ViewKeys): keyof T =>
  <keyof T>`${Strings.DOLLAR}${styledComponent ? `${styledComponent}${viewKey.capitalize()}` : viewKey}`;

const viewFactoryMapperFactory =
  <T extends StyledComponents, U extends object, V, W extends string>(
    props: Omit<Props<T, U, V>, W>,
  ): ((value?: V | Factory<U, V>) => V | Falsy) =>
  (value?: V | Factory<U, V>): V | Falsy =>
    typeof value === 'function' ? (<Factory<U, V>>value)(<U & NumbersTransitionExecutionContext>props) : value;

const styleReducer = (accumulator: CSSProperties, currentStyle: CSSProperties | Falsy): CSSProperties => ({
  ...accumulator,
  ...currentStyle,
});

const styleFactory = <T extends StyledComponents, U extends object, V>(
  style: undefined | OrArray<CSSProperties | StyleFactory<U>>,
  props: Omit<Props<T, U, V>, AttributesOmittedKeys<T, U>>,
): CSSProperties =>
  [style]
    .flat<(undefined | OrArray<CSSProperties | StyleFactory<U>>)[], Numbers.ONE>()
    .map<CSSProperties | Falsy>(viewFactoryMapperFactory<T, U, CSSProperties, AttributesOmittedKeys<T, U>>(props))
    .reduce<CSSProperties>(styleReducer, {});

const classNameFactory = <T extends StyledComponents, U extends object, V>(
  className: undefined | OrArray<string | ClassNameFactory<U>>,
  props: Omit<Props<T, U, V>, AttributesOmittedKeys<T, U>>,
): undefined | string =>
  [className]
    .flat<(undefined | OrArray<string | ClassNameFactory<U>>)[], Numbers.ONE>()
    .map<string | Falsy>(viewFactoryMapperFactory<T, U, string, AttributesOmittedKeys<T, U>>(props))
    .filter<string>((className: string | Falsy): className is string => !!className)
    .join(Strings.SPACE);

const toCssArray = <T extends object>(
  cssStyle?: OrArray<CssRule<T> | CssRuleFactory<T>>,
): (undefined | CssRule<T> | CssRuleFactory<T>)[] =>
  Array.isArray<undefined | OrArray<CssRule<T> | CssRuleFactory<T>>>(cssStyle) && cssStyle.depth() === Numbers.TWO
    ? cssStyle
    : <(undefined | CssRule<T> | CssRuleFactory<T>)[]>[cssStyle];

const cssFactory =
  <T extends StyledComponents>(styledComponent: T): (<U extends object, V>(props: Props<T, U, V>) => CssRule<U>[]) =>
  <U extends object, V>({
    [viewKey<CssView<T, U>>`${styledComponent}${ViewKeys.CSS}`]: cssStyle,
    ...restProps
  }: Props<T, U, V>): CssRule<U>[] =>
    toCssArray<U>(cssStyle)
      .map<CssRule<U> | Falsy>(viewFactoryMapperFactory<T, U, CssRule<U>, keyof CssView<T, U>>(restProps))
      .filter<CssRule<U>>((value: CssRule<U> | Falsy): value is CssRule<U> => !!value);

const animationFalsyMapper = <T extends object, U>(animation: Partial<Animation<T, U>> | Falsy): undefined | Partial<Animation<T, U>> =>
  animation || undefined;

const animationMapper = <T extends object, U>({ keyframeFunction, keyframes, progress }: Partial<Animation<T, U>> = {}):
  | undefined
  | Keyframes => keyframeFunction && keyframes && animationKeyframes(keyframeFunction, keyframes, progress);

const animationsKeyframesReducer = (accumulator: RuleSet<object>, currentValue: undefined | Keyframes, index: number) => css<object>`
  ${accumulator}${index ? Strings.COMMA : Strings.EMPTY}${currentValue ?? AnimationTypes.NONE}
`;

const animationsKeyframes = <T extends StyledComponents, U extends object, V>(
  props: Omit<Props<T, U, V>, keyof AnimationView<T, U, V>>,
  animation?: OrArray<Animation<U, V> | AnimationFactory<U, V>>,
): RuleSet<object> | false =>
  !!(Array.isArray<undefined | OrArray<Animation<U, V> | AnimationFactory<U, V>>>(animation) ? animation.length : animation) &&
  [animation!]
    .flat<OrArray<Animation<U, V> | AnimationFactory<U, V>>[], Numbers.ONE>()
    .map<Partial<Animation<U, V>> | Falsy>(viewFactoryMapperFactory<T, U, Animation<U, V>, keyof AnimationView<T, U, V>>(props))
    .map<undefined | Partial<Animation<U, V>>>(animationFalsyMapper<U, V>)
    .map<undefined | Keyframes>(animationMapper<U, V>)
    .reduce<RuleSet<object>>(animationsKeyframesReducer, css<object>``);

const optionalAnimationName = (animationKeyframes: RuleSet<object> | false): RuleSet<object> | false =>
  animationKeyframes &&
  css<object>`
    animation-name: ${animationKeyframes};
  `;

const animationFactory =
  <T extends StyledComponents>(styledComponent: T): (<U extends object, V>(props: Props<T, U, V>) => RuleSet<U> | false) =>
  <U extends object, V>({
    [viewKey<AnimationView<T, U, V>>`${styledComponent}${ViewKeys.ANIMATION}`]: animation,
    ...restProps
  }: Props<T, U, V>): RuleSet<U> | false =>
    optionalAnimationName(animationsKeyframes<T, U, V>(restProps, animation));

const attributesFactory =
  <T extends StyledComponents>(styledComponent: T): (<U extends object, V>(props: Props<T, U, V>) => HTMLAttributes<HTMLDivElement>) =>
  <U extends object, V>({
    style,
    className,
    [viewKey<StyleView<T, U>>`${styledComponent}${ViewKeys.STYLE}`]: styleView,
    [viewKey<ClassNameView<T, U>>`${styledComponent}${ViewKeys.CLASS_NAME}`]: classNameView,
    ...restProps
  }: Props<T, U, V>): HTMLAttributes<HTMLDivElement> => ({
    style: { ...style, ...styleFactory(styleView, restProps) },
    className: [className, classNameFactory(classNameView, restProps)]
      .filter<string>((className: undefined | string): className is string => !!className)
      .join(Strings.SPACE),
  });

interface VisibilityProps {
  $visible?: boolean;
}

const visibility = ({ $visible = true }: VisibilityProps): RuleSet<object> | false =>
  !$visible &&
  css<object>`
    opacity: ${Numbers.ZERO};
  `;

interface DisplayProps {
  $display?: Display;
}

const display: RuleSet<DisplayProps> = css<DisplayProps>`
  display: ${({ $display = Display.INLINE_BLOCK }: DisplayProps): string => $display};
`;

interface ContainerProps<T extends object, U>
  extends Partial<NumbersTransitionExecutionContext>,
    StyledView<StyledComponents.CONTAINER, T, U> {}

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
  display: inline-block;
  overflow: hidden;
  height: inherit;
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
  :has(~ &):not(:has(:first-child)) {
    overflow: hidden;
  }
`;

interface CharacterProps<T extends object, U>
  extends DisplayProps,
    Partial<NumbersTransitionExecutionContext>,
    StyledView<StyledComponents.CHARACTER, T, U> {}

type CharacterStyledComponent = AttributesStyledComponent<HTMLElements.DIV, HTMLDetailedElement<HTMLDivElement>, CharacterProps<any, any>>;

const Character: CharacterStyledComponent = styled.div.attrs<CharacterProps<any, any>>(
  attributesFactory<StyledComponents.CHARACTER>(StyledComponents.CHARACTER),
)`
  ${cssFactory<StyledComponents.CHARACTER>(StyledComponents.CHARACTER)};
  ${animationFactory<StyledComponents.CHARACTER>(StyledComponents.CHARACTER)};
  ${display};
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
