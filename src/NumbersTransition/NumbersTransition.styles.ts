/* eslint-disable @typescript-eslint/no-explicit-any */
import styled, { RuleSet, css, keyframes } from 'styled-components';
import {
  BaseObject,
  ExecutionProps,
  IStyledComponent,
  Keyframes,
  KnownTarget,
  Substitute,
} from 'styled-components/dist/types';
import { ComponentPropsWithRef, DetailedHTMLProps, HTMLAttributes } from 'react';
import {
  AnimationDirection,
  AnimationType,
  Display,
  HorizontalAnimationDirection,
  Numbers,
  Runtime,
  Strings,
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import './NumbersTransition.extensions';

type StyledComponentBase<T extends object> = IStyledComponent<Runtime.WEB, T>;

type HTMLDetailedElement<T> = DetailedHTMLProps<HTMLAttributes<T>, T>;

export type StyledComponent<T, U extends object = BaseObject> = StyledComponentBase<
  Substitute<HTMLDetailedElement<T>, U>
>;

export type ExtensionStyledComponent<T extends KnownTarget, U extends object = BaseObject> = StyledComponentBase<
  Substitute<ComponentPropsWithRef<T> & BaseObject, U>
>;

export type AttributesStyledComponent<
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
  $numberOfAnimations?: number;
  $totalAnimationDuration?: number;
  $horizontalAnimationDuration?: number;
  $verticalAnimationDuration?: number;
}

export interface NumbersTransitionExecutionContext extends ExecutionProps {
  theme: NumbersTransitionTheme;
}

export type CssRule<T extends object> = RuleSet<T> | string;

export type KeyframeFunction<T extends object, U> = (keyframeValue: U) => CssRule<T>;

export interface Animation<T extends object, U> {
  keyframeFunction: KeyframeFunction<T, U>;
  keyframes: U[];
  progress?: number[];
}

export type AnimationFactory<T extends object, U> = (
  props: T & NumbersTransitionExecutionContext,
) => Animation<T, U> | undefined;

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

const animationType = ({ theme: { $animationType }, ...restProps }: AnimationProps): Keyframes | undefined => {
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

interface CssView<T extends object> {
  $css?: CssRule<T> | CssRule<T>[];
}

interface AnimationView<T extends object, U> {
  $animation?: Animation<T, U> | AnimationFactory<T, U> | (Animation<T, U> | AnimationFactory<T, U>)[];
}

interface StyleView<T extends object, U> extends CssView<T>, AnimationView<T, U> {}

const customCss: RuleSet<CssView<object>> = css<CssView<object>>`
  ${({ $css }: CssView<object>): CssRule<object> | undefined => $css};
`;

const customAnimationMapper = <T extends object, U>({
  keyframeFunction,
  keyframes,
  progress,
}: Partial<Animation<T, U>> | undefined = {}): Keyframes | undefined =>
  keyframeFunction && keyframes && animationKeyframes(keyframeFunction, keyframes, progress);

const customAnimationKeyframesMapper = (keyframes: Keyframes | undefined): RuleSet<object> => css<object>`
  ${keyframes ?? `${keyframes}`}
`;

const customAnimationKeyframesReducer = (accumulator: RuleSet<object>, currentValue: RuleSet<object>) => css<object>`
  ${accumulator}${Strings.COMMA}${currentValue}
`;

const customAnimationKeyframes = <T extends object, U>(
  animation: Animation<T, U> | AnimationFactory<T, U> | (Animation<T, U> | AnimationFactory<T, U>)[] | undefined,
  props: T & NumbersTransitionExecutionContext,
): RuleSet<object> | false =>
  (Array.isArray<undefined | Animation<T, U> | AnimationFactory<T, U> | (Animation<T, U> | AnimationFactory<T, U>)[]>(
    animation,
  )
    ? !!animation.length
    : !!animation) &&
  [animation!]
    .flat<(Animation<T, U> | AnimationFactory<T, U> | (Animation<T, U> | AnimationFactory<T, U>)[])[], Numbers.ONE>()
    .map<Partial<Animation<T, U>> | undefined>(
      (animation: Animation<T, U> | AnimationFactory<T, U>): Partial<Animation<T, U>> | undefined =>
        typeof animation === 'function' ? animation(props) : animation,
    )
    .map<Keyframes | undefined>(customAnimationMapper<T, U>)
    .map<RuleSet<object>>(customAnimationKeyframesMapper)
    .reduce(customAnimationKeyframesReducer);

const customAnimationName = (animationKeyframes: RuleSet<object> | false): RuleSet<object> | false =>
  animationKeyframes &&
  css<object>`
    animation-name: ${animationKeyframes};
  `;

const customAnimation = <T extends object, U, V extends T & NumbersTransitionExecutionContext & AnimationView<T, U>>({
  $animation,
  ...restProps
}: V): RuleSet<T> | false =>
  customAnimationName(customAnimationKeyframes<T, U>($animation, <T & NumbersTransitionExecutionContext>restProps));

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
    $totalAnimationDuration,
    $horizontalAnimationDuration,
    $verticalAnimationDuration,
  },
}: NumbersTransitionExecutionContext): RuleSet<object> => css<object>`
  --animation-type: ${$animationType};
  --number-of-animations: ${$numberOfAnimations};
  --total-animation-duration: ${$totalAnimationDuration};
  --horizontal-animation-duration: ${$horizontalAnimationDuration};
  --vertical-animation-duration: ${$verticalAnimationDuration};
`;

interface ContainerProps extends NumbersTransitionExecutionContext, StyleView<any, any> {}

type ContainerStyledComponent = StyledComponent<HTMLDivElement, ContainerProps>;

export const Container: ContainerStyledComponent = styled.div<ContainerProps>`
  ${customCss};
  ${customAnimation};
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
