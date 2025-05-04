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
  HTMLElements,
  HorizontalAnimationDirection,
  Numbers,
  Runtime,
  Strings,
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import './NumbersTransition.extensions';

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
  $totalAnimationDuration: number;
}

export interface NumbersTransitionExecutionContext extends ExecutionProps {
  theme: NumbersTransitionTheme;
}

export type CssRule<T extends object> = RuleSet<T> | string;

export interface Keyframe<U> {
  percentage?: number;
  value: U;
}

export type KeyframeFunction<T extends object, U> = ((keyframeValue: U) => CssRule<T>) | undefined;

export type KeyframeFunctionFactory<T extends object, U> = (
  props: NumbersTransitionExecutionContext & T,
) => KeyframeFunction<T, U>;

export type AnimationTimingFunction = [[number, number], [number, number]];

interface AnimationTypeProps<T extends AnimationType> {
  $animationType: T;
}
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

type UnselectedAnimationTypeProps = AnimationTypeProps<AnimationType>;
type UnselectedAnimationDirectionProps = AnimationDirectionProps<AnimationDirection>;

interface AnimationCommonProps<T extends AnimationType, U extends AnimationDirection>
  extends AnimationTypeProps<T>,
    AnimationDirectionProps<U>,
    AnimationDurationProps,
    AnimationTimingFunctionProps,
    AnimationDelayProps {}

interface AnimationWidthProps {
  $animationStartWidth: number;
  $animationEndWidth: number;
}

interface HorizontalAnimationProps
  extends AnimationCommonProps<AnimationType.HORIZONTAL, HorizontalAnimationDirection>,
    AnimationWidthProps {}

type VerticalAnimationProps = AnimationCommonProps<AnimationType.VERTICAL, VerticalAnimationDirection>;

type AnimationProps = HorizontalAnimationProps | VerticalAnimationProps;

type OmitAnimationType<T extends AnimationProps> = Omit<T, keyof UnselectedAnimationTypeProps>;

const animationKeyframesMapper =
  <T>(mapper: (t: T) => CssRule<object>): ((val: Keyframe<T>, index: number, arr: Keyframe<T>[]) => RuleSet<object>) =>
  ({ value, percentage }: Keyframe<T>, index: number, { length }: Keyframe<T>[]): RuleSet<object> => css<object>`
    ${percentage ?? (index * Numbers.ONE_HUNDRED) / (length - Numbers.ONE)}% {
      ${mapper(value)};
    }
  `;

const animationKeyframesReducer = (
  previousValue: RuleSet<object>,
  currentValue: RuleSet<object>,
): RuleSet<object> => css<object>`
  ${previousValue}
  ${currentValue}
`;

const animationKeyframes = <T>(
  keyframeMapper: (keyframeValue: T) => CssRule<object>,
  keyframeValues: Keyframe<T>[],
): Keyframes => keyframes`
  ${keyframeValues.map<RuleSet<object>>(animationKeyframesMapper(keyframeMapper)).reduce<RuleSet<object>>(animationKeyframesReducer, css<object>``)}
`;

const horizontalAnimationKeyframe = (keyframeValue: number): RuleSet<object> => css<object>`
  width: calc(${Numbers.ONE}ch * ${keyframeValue});
`;

const verticalAnimationKeyframe = (keyframeValue: number): RuleSet<object> => css<object>`
  transform: translateY(${keyframeValue}%);
`;

const horizontalAnimation = ({ $animationStartWidth, $animationEndWidth }: AnimationWidthProps): Keyframes =>
  animationKeyframes<number>(horizontalAnimationKeyframe, [
    { value: $animationStartWidth },
    { value: $animationEndWidth },
  ]);

const verticalAnimation: Keyframes = animationKeyframes<number>(verticalAnimationKeyframe, [
  { value: Numbers.ZERO },
  { value: Numbers.MINUS_ONE_HUNDRED },
]);

const animationType = ({ $animationType, ...restProps }: AnimationProps): Keyframes => {
  switch ($animationType) {
    case AnimationType.HORIZONTAL:
      return horizontalAnimation(<OmitAnimationType<HorizontalAnimationProps>>restProps);
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

const horizontalAnimationAttrs: AnimationTypeProps<AnimationType.HORIZONTAL> = {
  $animationType: AnimationType.HORIZONTAL,
};

const verticalAnimationAttrs: AnimationTypeProps<AnimationType.VERTICAL> = {
  $animationType: AnimationType.VERTICAL,
};

interface CssView<T extends object> {
  $css?: CssRule<T> | CssRule<T>[];
}

interface KeyframeView<T extends object, U> {
  $keyframeFunction?: KeyframeFunctionFactory<T, U> | KeyframeFunctionFactory<T, U>[];
  $keyframes?: Keyframe<U>[] | Keyframe<U>[][];
}

interface StyleView<T extends object, U> extends CssView<T>, KeyframeView<T, U> {}

const customCss: RuleSet<CssView<any>> = css<CssView<any>>`
  ${({ $css }: CssView<any>): CssRule<object> | undefined => $css};
`;

const parseKeyframeFunctions = (
  keyframeFunction: KeyframeFunctionFactory<any, any> | KeyframeFunctionFactory<any, any>[] = [],
): KeyframeFunctionFactory<any, any>[] =>
  [keyframeFunction].flat<(KeyframeFunctionFactory<any, any> | KeyframeFunctionFactory<any, any>[])[], Numbers.ONE>();

const parseKeyframes = (keyframes: Keyframe<any>[] | Keyframe<any>[][] = []): Keyframe<any>[][] =>
  <Keyframe<any>[][]>(keyframes.depth() === Numbers.ONE ? [keyframes] : keyframes);

const customAnimationName = <T>(
  keyframeFunction: KeyframeFunctionFactory<any, any>[],
  keyframes: Keyframe<any>[][],
  props: T,
): RuleSet<object> | false =>
  !!keyframeFunction.length &&
  keyframeFunction
    .map<KeyframeFunction<any, any>>(
      (keyframeFunctionFactory: KeyframeFunctionFactory<any, any>): KeyframeFunction<any, any> =>
        keyframeFunctionFactory(props),
    )
    .map<Keyframes | undefined>(
      (keyframeFunction: KeyframeFunction<any, any>, index: number): Keyframes | undefined =>
        keyframeFunction && animationKeyframes<any>(keyframeFunction, keyframes[index]),
    )
    .map<RuleSet<object>>(
      (keyframes: Keyframes | undefined): RuleSet<object> => css<object>`
        ${keyframes ?? `${keyframes}`}
      `,
    )
    .reduce(
      (accumulator: RuleSet<object>, currentValue: RuleSet<object>) => css<object>`
        ${accumulator}${Strings.COMMA}${currentValue}
      `,
    );

const customAnimation = <T extends KeyframeView<any, any>>(keyframeProps: T): RuleSet<object> | false => {
  const { $keyframeFunction, $keyframes, ...restProps }: T = keyframeProps;

  const animationName: RuleSet<object> | false = customAnimationName<Omit<T, keyof KeyframeView<any, any>>>(
    parseKeyframeFunctions($keyframeFunction),
    parseKeyframes($keyframes),
    restProps,
  );

  return (
    animationName &&
    css<object>`
      animation-name: ${animationName};
    `
  );
};

interface VisibilityProps {
  $visible?: boolean;
}

const visibility = ({ $visible = true }: VisibilityProps): RuleSet<VisibilityProps> | false =>
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

interface ContainerProps extends NumbersTransitionExecutionContext, StyleView<any, any> {}

type ContainerStyledComponent = StyledComponent<HTMLDivElement, ContainerProps>;

export const Container: ContainerStyledComponent = styled.div<ContainerProps>`
  ${customCss};
  ${customAnimation};
  position: relative;
  white-space: nowrap;
  max-width: ${Numbers.ONE_HUNDRED}%;
  width: fit-content;
  height: ${Numbers.ONE}lh;
`;

type AnimationStyledComponent<T extends AnimationProps> = AttributesStyledComponent<
  HTMLElements.DIV,
  HTMLDetailedElement<HTMLDivElement>,
  OmitAnimationType<T>
>;

type HorizontalAnimationStyledComponent = AnimationStyledComponent<HorizontalAnimationProps>;

export const HorizontalAnimation: HorizontalAnimationStyledComponent = styled.div.attrs<HorizontalAnimationProps>(
  horizontalAnimationAttrs,
)`
  ${animation};
  display: inline-block;
  overflow: hidden;
  height: inherit;
  :only-child {
    float: right;
    height: inherit;
  }
`;

type VerticalAnimationStyledComponent = AnimationStyledComponent<VerticalAnimationProps>;

export const VerticalAnimation: VerticalAnimationStyledComponent = styled.div.attrs<VerticalAnimationProps>(
  verticalAnimationAttrs,
)`
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
