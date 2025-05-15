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
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import { Falsy, OrArray } from './NumbersTransition.types';

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

type VerticalAnimationProps = AnimationCommonProps<VerticalAnimationDirection>;

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
  width: calc(${Numbers.ONE}ch * ${keyframeValue});
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

interface StyleView<T extends object> {
  $style?: OrArray<CSSProperties | StyleFactory<T>>;
}

interface ClassNameView<T extends object> {
  $className?: OrArray<string | ClassNameFactory<T>>;
}

interface CssView<T extends object> {
  $css?: OrArray<CssRule<T> | CssRuleFactory<T>>;
}

interface AnimationView<T extends object, U> {
  $animation?: OrArray<Animation<T, U> | AnimationFactory<T, U>>;
}

interface View<T extends object, U> extends StyleView<T>, ClassNameView<T>, CssView<T>, AnimationView<T, U> {}

const factoryMapperFactory =
  <T extends object, U>(props: T & NumbersTransitionExecutionContext): ((value?: U | Factory<T, U>) => U | Falsy) =>
  (value?: U | Factory<T, U>): U | Falsy =>
    typeof value === 'function' ? (<Factory<T, U>>value)(props) : value;

const passedStyleReducer = (accumulator: CSSProperties, currentStyle: CSSProperties | Falsy): CSSProperties => ({
  ...accumulator,
  ...currentStyle,
});

const passedStyle = <T extends object, U>(
  style: undefined | OrArray<CSSProperties | StyleFactory<T>>,
  props: T & CssView<T> & AnimationView<T, U> & NumbersTransitionExecutionContext,
): CSSProperties =>
  [style]
    .flat<(undefined | OrArray<CSSProperties | StyleFactory<T>>)[], Numbers.ONE>()
    .map<CSSProperties | Falsy>(factoryMapperFactory<T & CssView<T> & AnimationView<T, U>, CSSProperties>(props))
    .reduce<CSSProperties>(passedStyleReducer, {});

const passedClassName = <T extends object, U>(
  className: undefined | OrArray<string | ClassNameFactory<T>>,
  props: T & CssView<T> & AnimationView<T, U> & NumbersTransitionExecutionContext,
): undefined | string =>
  [className]
    .flat<(undefined | OrArray<string | ClassNameFactory<T>>)[], Numbers.ONE>()
    .map<string | Falsy>(factoryMapperFactory<T & CssView<T> & AnimationView<T, U>, string>(props))
    .filter<string>((className: string | Falsy): className is string => !!className)
    .join(Strings.SPACE);

const toPassedCssArray = <T extends object>(
  cssStyle?: OrArray<CssRule<T> | CssRuleFactory<T>>,
): (undefined | CssRule<T> | CssRuleFactory<T>)[] =>
  Array.isArray<undefined | OrArray<CssRule<T> | CssRuleFactory<T>>>(cssStyle) && cssStyle.depth() === Numbers.TWO
    ? cssStyle
    : <(undefined | CssRule<T> | CssRuleFactory<T>)[]>[cssStyle];

const passedCss = <T extends object, U>({
  $css,
  ...restProps
}: T & View<T, U> & NumbersTransitionExecutionContext): CssRule<T>[] =>
  toPassedCssArray<T>($css)
    .map<CssRule<T> | Falsy>(
      factoryMapperFactory<T & StyleView<T> & ClassNameView<T> & AnimationView<T, U>, CssRule<T>>(
        <T & StyleView<T> & ClassNameView<T> & AnimationView<T, U> & NumbersTransitionExecutionContext>restProps,
      ),
    )
    .filter<CssRule<T>>((value: CssRule<T> | Falsy): value is CssRule<T> => !!value);

const passedAnimationFalsyMapper = <T extends object, U>(
  animation: Partial<Animation<T, U>> | Falsy,
): undefined | Partial<Animation<T, U>> => animation || undefined;

const passedAnimationMapper = <T extends object, U>({
  keyframeFunction,
  keyframes,
  progress,
}: Partial<Animation<T, U>> = {}): undefined | Keyframes =>
  keyframeFunction && keyframes && animationKeyframes(keyframeFunction, keyframes, progress);

const passedAnimationKeyframesMapper = (keyframes?: Keyframes): RuleSet<object> => css<object>`
  ${keyframes ?? `${keyframes}`}
`;

const passedAnimationKeyframesReducer = (accumulator: RuleSet<object>, currentValue: RuleSet<object>) => css<object>`
  ${accumulator}${Strings.COMMA}${currentValue}
`;

const passedAnimationKeyframes = <T extends object, U>(
  props: T & StyleView<T> & ClassNameView<T> & CssView<T> & NumbersTransitionExecutionContext,
  animation?: OrArray<Animation<T, U> | AnimationFactory<T, U>>,
): RuleSet<object> | false =>
  (Array.isArray<undefined | OrArray<Animation<T, U> | AnimationFactory<T, U>>>(animation)
    ? !!animation.length
    : !!animation) &&
  [animation!]
    .flat<OrArray<Animation<T, U> | AnimationFactory<T, U>>[], Numbers.ONE>()
    .map<Partial<Animation<T, U>> | Falsy>(
      factoryMapperFactory<T & StyleView<T> & ClassNameView<T> & CssView<T>, Animation<T, U>>(props),
    )
    .map<undefined | Partial<Animation<T, U>>>(passedAnimationFalsyMapper<T, U>)
    .map<undefined | Keyframes>(passedAnimationMapper<T, U>)
    .map<RuleSet<object>>(passedAnimationKeyframesMapper)
    .reduce(passedAnimationKeyframesReducer);

const passedAnimationName = (animationKeyframes: RuleSet<object> | false): RuleSet<object> | false =>
  animationKeyframes &&
  css<object>`
    animation-name: ${animationKeyframes};
  `;

const passedAnimation = <T extends object, U>({
  $animation,
  ...restProps
}: T & View<T, U> & NumbersTransitionExecutionContext): RuleSet<T> | false =>
  passedAnimationName(
    passedAnimationKeyframes<T, U>(
      <T & StyleView<T> & ClassNameView<T> & CssView<T> & NumbersTransitionExecutionContext>restProps,
      $animation,
    ),
  );

const attributes = <T extends object, U>({
  $style,
  $className,
  ...restProps
}: T & View<T, U> & NumbersTransitionExecutionContext): HTMLAttributes<HTMLDivElement> => ({
  style: passedStyle($style, <T & CssView<T> & AnimationView<T, U> & NumbersTransitionExecutionContext>restProps),
  className: passedClassName(
    $className,
    <T & CssView<T> & AnimationView<T, U> & NumbersTransitionExecutionContext>restProps,
  ),
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
  display: ${({ $display = Display.INLINE }: DisplayProps): string =>
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
interface ContainerProps extends NumbersTransitionExecutionContext, View<any, any> {}

type ContainerStyledComponent = AttributesStyledComponent<
  HTMLElements.DIV,
  HTMLDetailedElement<HTMLDivElement>,
  ContainerProps
>;

export const Container: ContainerStyledComponent = styled.div.attrs<ContainerProps>(attributes)`
  ${passedCss};
  ${passedAnimation};
  ${containerVariables};
  position: relative;
  white-space: nowrap;
  max-width: ${Numbers.ONE_HUNDRED}%;
  width: fit-content;
  height: ${Numbers.ONE}lh;
`;

type HorizontalAnimationStyledComponent = StyledComponent<HTMLDivElement, HorizontalAnimationProps>;

export const HorizontalAnimation: HorizontalAnimationStyledComponent = styled.div<HorizontalAnimationProps>`
  ${animation};
  display: inline-block;
  overflow: hidden;
  height: inherit;
  :only-child {
    float: right;
    height: inherit;
  }
`;

type VerticalAnimationStyledComponent = StyledComponent<HTMLDivElement, VerticalAnimationProps>;

export const VerticalAnimation: VerticalAnimationStyledComponent = styled.div<VerticalAnimationProps>`
  ${animation};
  :last-child {
    position: absolute;
    top: ${Numbers.ONE_HUNDRED}%;
  }
`;

interface CharacterProps extends VisibilityProps, DisplayProps {}

type CharacterStyledComponent = StyledComponent<HTMLDivElement, CharacterProps>;

export const Character: CharacterStyledComponent = styled.div<CharacterProps>`
  ${visibility};
  ${display};
  overflow: hidden;
  text-align: end;
  height: inherit;
  white-space: pre;
`;

type DigitStyledComponent = ExtensionStyledComponent<CharacterStyledComponent>;

export const Digit: DigitStyledComponent = styled<CharacterStyledComponent>(Character)`
  min-width: ${Numbers.ONE}ch;
`;
