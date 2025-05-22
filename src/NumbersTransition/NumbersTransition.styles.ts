import { CSSProperties, ComponentPropsWithRef, DetailedHTMLProps, HTMLAttributes } from 'react';
import styled, { RuleSet, css, keyframes } from 'styled-components';
import {
  BaseObject,
  ExecutionProps,
  IStyledComponent,
  Keyframes,
  KnownTarget,
  Substitute,
} from 'styled-components/dist/types';
import {
  AnimationDirection,
  AnimationNumber,
  AnimationType,
  Display,
  HTMLElements,
  HorizontalAnimationDirection,
  Numbers,
  Runtime,
  Strings,
  StyledComponents,
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

type AttributesStyledComponent<
  T extends KnownTarget,
  U extends object,
  V extends object = BaseObject,
> = StyledComponentBase<
  Substitute<
    Substitute<Substitute<U extends KnownTarget ? ComponentPropsWithRef<U> : U, ComponentPropsWithRef<T>>, V>,
    BaseObject
  >
>;

export interface NumbersTransitionTheme {
  $animationType?: AnimationType;
  $numberOfAnimations?: AnimationNumber;
  $currentAnimationNumber?: AnimationNumber;
  $totalAnimationDuration?: number;
  $horizontalAnimationDuration?: number;
  $verticalAnimationDuration?: number;
}

export interface NumbersTransitionExecutionContext extends ExecutionProps {
  theme: NumbersTransitionTheme;
}

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

type StyleView<E extends StyledComponents, T extends object> = {
  [K in `${Strings.DOLLAR}${CamelCase<E, ViewKeys.STYLE>}`]?: OrArray<CSSProperties | StyleFactory<T>>;
};

type ClassNameView<E extends StyledComponents, T extends object> = {
  [K in `${Strings.DOLLAR}${CamelCase<E, ViewKeys.CLASS_NAME>}`]?: OrArray<string | ClassNameFactory<T>>;
};

type CssView<E extends StyledComponents, T extends object> = {
  [K in `${Strings.DOLLAR}${CamelCase<E, ViewKeys.CSS>}`]?: OrArray<CssRule<T> | CssRuleFactory<T>>;
};

type AnimationView<E extends StyledComponents, T extends object, U> = {
  [K in `${Strings.DOLLAR}${CamelCase<E, ViewKeys.ANIMATION>}`]?: OrArray<Animation<T, U> | AnimationFactory<T, U>>;
};

export type View<E extends StyledComponents, T extends object, U> = StyleView<E, T> &
  ClassNameView<E, T> &
  CssView<E, T> &
  AnimationView<E, T, U>;

type Props<E extends StyledComponents, T extends object, U> = T & NumbersTransitionExecutionContext & View<E, T, U>;

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
  extends NumbersTransitionExecutionContext,
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

const animationKeyframesReducer = <T extends object>(
  previousValue: RuleSet<T>,
  currentValue: RuleSet<T>,
): RuleSet<T> => css<T>`
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

const horizontalAnimationKeyframe: KeyframeFunction<object, number> = (
  keyframeValue: number,
): RuleSet<object> => css<object>`
  width: ${keyframeValue}px;
`;

const verticalAnimationKeyframe: KeyframeFunction<object, number> = (
  keyframeValue: number,
): RuleSet<object> => css<object>`
  transform: translateY(${keyframeValue}%);
`;

const horizontalAnimation = ({ $animationStartWidth, $animationEndWidth }: AnimationWidthProps): Keyframes =>
  animationKeyframes<object, number>(horizontalAnimationKeyframe, [$animationStartWidth, $animationEndWidth]);

const verticalAnimation: Keyframes = animationKeyframes<object, number>(verticalAnimationKeyframe, [
  Numbers.ZERO,
  Numbers.MINUS_ONE_HUNDRED,
]);

const animationType = ({ theme: { $animationType }, ...restProps }: AnimationProps): undefined | Keyframes => {
  switch ($animationType) {
    case AnimationType.HORIZONTAL:
      return horizontalAnimation(<HorizontalAnimationProps>restProps);
    case AnimationType.VERTICAL:
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
  animation-direction: ${({ $animationDirection }: UnselectedAnimationDirectionProps): string =>
    $animationDirection.toLowerCase()};
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

const viewKey = <T extends object>(
  _: TemplateStringsArray,
  styledComponent: StyledComponents,
  viewKey: ViewKeys,
): keyof T =>
  <keyof T>`${Strings.DOLLAR}${styledComponent.isEmpty() ? viewKey : `${styledComponent}${viewKey.capitalize()}`}`;

const viewFactoryMapperFactory =
  <E extends StyledComponents, T extends object, U, V extends string>(
    props: Omit<Props<E, T, U>, V>,
  ): ((value?: U | Factory<T, U>) => U | Falsy) =>
  (value?: U | Factory<T, U>): U | Falsy =>
    typeof value === 'function' ? (<Factory<T, U>>value)(<T & NumbersTransitionExecutionContext>props) : value;

const styleReducer = (accumulator: CSSProperties, currentStyle: CSSProperties | Falsy): CSSProperties => ({
  ...accumulator,
  ...currentStyle,
});

const styleFactory = <E extends StyledComponents, T extends object, U>(
  style: undefined | OrArray<CSSProperties | StyleFactory<T>>,
  props: Omit<Props<E, T, U>, keyof StyleView<E, T> | keyof ClassNameView<E, T>>,
): CSSProperties =>
  [style]
    .flat<(undefined | OrArray<CSSProperties | StyleFactory<T>>)[], Numbers.ONE>()
    .map<
      CSSProperties | Falsy
    >(viewFactoryMapperFactory<E, T, CSSProperties, keyof StyleView<E, T> | keyof ClassNameView<E, T>>(props))
    .reduce<CSSProperties>(styleReducer, {});

const classNameFactory = <E extends StyledComponents, T extends object, U>(
  className: undefined | OrArray<string | ClassNameFactory<T>>,
  props: Omit<Props<E, T, U>, keyof StyleView<E, T> | keyof ClassNameView<E, T>>,
): undefined | string =>
  [className]
    .flat<(undefined | OrArray<string | ClassNameFactory<T>>)[], Numbers.ONE>()
    .map<string | Falsy>(
      viewFactoryMapperFactory<E, T, string, keyof StyleView<E, T> | keyof ClassNameView<E, T>>(props),
    )
    .filter<string>((className: string | Falsy): className is string => !!className)
    .join(Strings.SPACE);

const toCssArray = <T extends object>(
  cssStyle?: OrArray<CssRule<T> | CssRuleFactory<T>>,
): (undefined | CssRule<T> | CssRuleFactory<T>)[] =>
  Array.isArray<undefined | OrArray<CssRule<T> | CssRuleFactory<T>>>(cssStyle) && cssStyle.depth() === Numbers.TWO
    ? cssStyle
    : <(undefined | CssRule<T> | CssRuleFactory<T>)[]>[cssStyle];

const cssFactory =
  <E extends StyledComponents>(styledComponent: E): (<T extends object, U>(props: Props<E, T, U>) => CssRule<T>[]) =>
  <T extends object, U>({
    [viewKey<CssView<E, T>>`${styledComponent}${ViewKeys.CSS}`]: cssStyle,
    ...restProps
  }: Props<E, T, U>): CssRule<T>[] =>
    toCssArray<T>(cssStyle)
      .map<CssRule<T> | Falsy>(viewFactoryMapperFactory<E, T, CssRule<T>, keyof CssView<E, T>>(restProps))
      .filter<CssRule<T>>((value: CssRule<T> | Falsy): value is CssRule<T> => !!value);

const animationFalsyMapper = <T extends object, U>(
  animation: Partial<Animation<T, U>> | Falsy,
): undefined | Partial<Animation<T, U>> => animation || undefined;

const animationMapper = <T extends object, U>({
  keyframeFunction,
  keyframes,
  progress,
}: Partial<Animation<T, U>> = {}): undefined | Keyframes =>
  keyframeFunction && keyframes && animationKeyframes(keyframeFunction, keyframes, progress);

const animationsKeyframesReducer = (
  accumulator: RuleSet<object>,
  currentValue: undefined | Keyframes,
  index: number,
) => css<object>`
  ${accumulator}${index ? Strings.COMMA : Strings.EMPTY}${currentValue ?? `${currentValue}`}
`;

const animationsKeyframes = <E extends StyledComponents, T extends object, U>(
  props: Omit<Props<E, T, U>, keyof AnimationView<E, T, U>>,
  animation?: OrArray<Animation<T, U> | AnimationFactory<T, U>>,
): RuleSet<object> | false =>
  (Array.isArray<undefined | OrArray<Animation<T, U> | AnimationFactory<T, U>>>(animation)
    ? !!animation.length
    : !!animation) &&
  [animation!]
    .flat<OrArray<Animation<T, U> | AnimationFactory<T, U>>[], Numbers.ONE>()
    .map<Partial<Animation<T, U>> | Falsy>(
      viewFactoryMapperFactory<E, T, Animation<T, U>, keyof AnimationView<E, T, U>>(props),
    )
    .map<undefined | Partial<Animation<T, U>>>(animationFalsyMapper<T, U>)
    .map<undefined | Keyframes>(animationMapper<T, U>)
    .reduce<RuleSet<object>>(animationsKeyframesReducer, css<object>``);

const optionalAnimationName = (animationKeyframes: RuleSet<object> | false): RuleSet<object> | false =>
  animationKeyframes &&
  css<object>`
    animation-name: ${animationKeyframes};
  `;

const animationFactory =
  <E extends StyledComponents>(
    styledComponent: E,
  ): (<T extends object, U>(props: Props<E, T, U>) => RuleSet<T> | false) =>
  <T extends object, U>({
    [viewKey<AnimationView<E, T, U>>`${styledComponent}${ViewKeys.ANIMATION}`]: animation,
    ...restProps
  }: Props<E, T, U>): RuleSet<T> | false =>
    optionalAnimationName(animationsKeyframes<E, T, U>(restProps, animation));

const attributesFactory =
  <E extends StyledComponents>(
    styledComponent: E,
  ): (<T extends object, U>(props: Props<E, T, U>) => HTMLAttributes<HTMLDivElement>) =>
  <T extends object, U>({
    [viewKey<StyleView<E, T>>`${styledComponent}${ViewKeys.STYLE}`]: style,
    [viewKey<ClassNameView<E, T>>`${styledComponent}${ViewKeys.CLASS_NAME}`]: className,
    ...restProps
  }: Props<E, T, U>): HTMLAttributes<HTMLDivElement> => ({
    style: styleFactory(style, restProps),
    className: classNameFactory(className, restProps),
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
  display: ${({ $display = Display.INLINE_BLOCK }: DisplayProps): string =>
    $display.replaceAll(Strings.UNDERSCORE, Strings.MINUS).toLocaleLowerCase()};
`;

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
  --animation-type: ${$animationType};
  --number-of-animations: ${$numberOfAnimations};
  --current-animation-number: ${$currentAnimationNumber};
  --total-animation-duration: ${$totalAnimationDuration};
  --horizontal-animation-duration: ${$horizontalAnimationDuration};
  --vertical-animation-duration: ${$verticalAnimationDuration};
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ContainerProps extends NumbersTransitionExecutionContext, View<StyledComponents.CONTAINER, any, any> {}

type ContainerStyledComponent = AttributesStyledComponent<
  HTMLElements.DIV,
  HTMLDetailedElement<HTMLDivElement>,
  ContainerProps
>;

export const Container: ContainerStyledComponent = styled.div.attrs<ContainerProps>(
  attributesFactory<StyledComponents.CONTAINER>(StyledComponents.CONTAINER),
)`
  ${cssFactory<StyledComponents.CONTAINER>(StyledComponents.CONTAINER)};
  ${animationFactory<StyledComponents.CONTAINER>(StyledComponents.CONTAINER)};
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
  :only-child {
    ${animation};
  }
  :only-child :last-child {
    position: absolute;
    top: ${Numbers.ONE_HUNDRED}%;
  }
`;

export interface CharacterProps extends VisibilityProps, DisplayProps {}

type CharacterStyledComponent = StyledComponent<HTMLDivElement, CharacterProps>;

export const Character: CharacterStyledComponent = styled.div<CharacterProps>`
  ${visibility};
  ${display};
  overflow: hidden;
  white-space: pre;
`;

type DigitStyledComponent = ExtensionStyledComponent<CharacterStyledComponent>;

export const Digit: DigitStyledComponent = styled<CharacterStyledComponent>(Character)`
  min-width: ${Numbers.ONE}ch;
`;
