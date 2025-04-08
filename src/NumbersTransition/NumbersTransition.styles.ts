import styled, { RuleSet, css, keyframes } from 'styled-components';
import { Keyframes } from 'styled-components/dist/types';
import {
  AnimationDirection,
  AnimationType,
  Display,
  HorizontalAnimationDirection,
  Numbers,
  Strings,
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import {
  AttributesStyledComponent,
  ExtensionStyledComponent,
  HTMLDetailedElement,
  StyledComponent,
} from './NumbersTransition.types';

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
  (mapper: (value: number) => RuleSet<object>): ((value: number, index: number, array: number[]) => RuleSet<object>) =>
  (keyframeValue: number, index: number, { length }: number[]): RuleSet<object> => css<object>`
    ${(index * Numbers.ONE_HUNDRED) / (length - Numbers.ONE)}% {
      ${mapper(keyframeValue)};
    }
  `;

const animationKeyframesReducer = (
  previousValue: RuleSet<object>,
  currentValue: RuleSet<object>,
): RuleSet<object> => css<object>`
  ${previousValue}
  ${currentValue}
`;

const animationKeyframes = (
  keyframeMapper: (keyframeValue: number) => RuleSet<object>,
  keyframeValues: number[],
): Keyframes => keyframes`
  ${keyframeValues.map<RuleSet<object>>(animationKeyframesMapper(keyframeMapper)).reduce(animationKeyframesReducer)}
`;

const horizontalAnimationKeyframe = (keyframeValue: number): RuleSet<object> => css<object>`
  width: calc(${Numbers.ONE}ch * ${keyframeValue});
`;

const verticalAnimationKeyframe = (keyframeValue: number): RuleSet<object> => css<object>`
  transform: translateY(${keyframeValue}%);
`;

const horizontalAnimation = ({ $animationStartWidth, $animationEndWidth }: AnimationWidthProps): Keyframes =>
  animationKeyframes(horizontalAnimationKeyframe, [$animationStartWidth, $animationEndWidth]);

const verticalAnimation: Keyframes = animationKeyframes(verticalAnimationKeyframe, [
  Numbers.ZERO,
  Numbers.MINUS_ONE_HUNDRED,
]);

const getAnimation = ({ $animationType, ...restProps }: AnimationProps): Keyframes => {
  switch ($animationType) {
    case AnimationType.HORIZONTAL:
      return horizontalAnimation(<OmitAnimationType<HorizontalAnimationProps>>restProps);
    case AnimationType.VERTICAL:
      return verticalAnimation;
  }
};

const animationName: RuleSet<AnimationProps> = css<AnimationProps>`
  animation-name: ${(props: AnimationProps): Keyframes => getAnimation(props)};
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

interface VisibilityProps {
  $visible?: boolean;
}
interface DisplayProps {
  $display?: Display;
}

interface CharacterProps extends VisibilityProps, DisplayProps {}

const visible: RuleSet<VisibilityProps> = css<VisibilityProps>`
  color: ${({ $visible = true }: VisibilityProps): string => ($visible ? 'inherit' : 'transparent')};
`;

const display: RuleSet<DisplayProps> = css<DisplayProps>`
  display: ${({ $display = Display.INLINE }: DisplayProps): string =>
    $display.replaceAll(Strings.UNDERSCORE, Strings.MINUS).toLocaleLowerCase()};
`;

type ContainerStyledComponent = StyledComponent<HTMLDivElement>;

export const Container: ContainerStyledComponent = styled.div`
  font-size: ${Numbers.ONE_HUNDRED}px;
  color: #f0ff95;
  position: relative;
  white-space: nowrap;
  max-width: ${Numbers.ONE_HUNDRED}%;
  width: fit-content;
  height: ${Numbers.ONE}lh;
`;

type AnimationStyledComponent<T extends AnimationProps> = AttributesStyledComponent<
  'div',
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

type DivisionStyledComponent = StyledComponent<HTMLDivElement>;

export const Division: DivisionStyledComponent = styled.div``;

type CharacterStyledComponent = ExtensionStyledComponent<DivisionStyledComponent, CharacterProps>;

export const Character: CharacterStyledComponent = styled<DivisionStyledComponent>(Division)<CharacterProps>`
  ${visible};
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
