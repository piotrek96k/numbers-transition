import styled, { RuleSet, css, keyframes } from 'styled-components';
import { BaseObject, Keyframes } from 'styled-components/dist/types';
import {
  AnimationDirection,
  AnimationType,
  HorizontalAnimationDirection,
  Numbers,
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import {
  AttributesStyledComponent,
  ExtensionStyledComponent,
  HTMLDetailedElement,
  StyledComponent,
} from './NumbersTransition.types';

export type AnimationTimingFunction = [[number, number], [number, number]];

interface AnimationCommonProps<T extends AnimationType, U extends AnimationDirection> {
  $animationType: T;
  $animationDirection: U;
  $animationDuration: number;
  $animationTimingFunction: AnimationTimingFunction;
  $animationDelay?: number;
}

interface HorizontalAnimationProps
  extends AnimationCommonProps<AnimationType.HORIZONTAL, HorizontalAnimationDirection> {
  $animationStartWidth: number;
  $animationEndWidth: number;
}

type VerticalAnimationProps = AnimationCommonProps<AnimationType.VERTICAL, VerticalAnimationDirection>;

type AnimationProps = HorizontalAnimationProps | VerticalAnimationProps;

type PickAnimationType<T extends AnimationProps> = Pick<T, '$animationType'>;

type OmitAnimationType<T extends AnimationProps> = Omit<T, '$animationType'>;

export interface VisibilityProps {
  $visible?: boolean;
}

type ContainerStyledComponent = StyledComponent<HTMLDivElement>;

type AnimationStyledComponent<T extends AnimationProps> = AttributesStyledComponent<
  'div',
  HTMLDetailedElement<HTMLDivElement>,
  OmitAnimationType<T>
>;

type HorizontalAnimationStyledComponent = AnimationStyledComponent<HorizontalAnimationProps>;

type VerticalAnimationStyledComponent = AnimationStyledComponent<VerticalAnimationProps>;

type CharacterStyledComponent = StyledComponent<HTMLDivElement, VisibilityProps>;

type DigitStyledComponent = ExtensionStyledComponent<CharacterStyledComponent>;

type DivisionStyledComponent = StyledComponent<HTMLDivElement, VisibilityProps>;

const visible: RuleSet<VisibilityProps> = css<VisibilityProps>`
  color: ${({ $visible = true }: VisibilityProps): string => ($visible ? 'inherit' : 'transparent')};
`;

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

const horizontalAnimation = ({
  $animationStartWidth,
  $animationEndWidth,
}: OmitAnimationType<HorizontalAnimationProps>): Keyframes =>
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

const animationDuration: RuleSet<AnimationProps> = css<AnimationProps>`
  animation-duration: ${({ $animationDuration }: AnimationProps): number => $animationDuration}ms;
`;

const animationDirection: RuleSet<AnimationProps> = css<AnimationProps>`
  animation-direction: ${({ $animationDirection }: AnimationProps): string => $animationDirection.toLowerCase()};
`;

const animationTimingFunction: RuleSet<AnimationProps> = css<AnimationProps>`
  animation-timing-function: cubic-bezier(
    ${({ $animationTimingFunction }: AnimationProps): string => $animationTimingFunction.join()}
  );
`;

const animationDelay: RuleSet<AnimationProps> = css<AnimationProps>`
  animation-delay: ${({ $animationDelay }: AnimationProps): number => $animationDelay ?? Numbers.ZERO}ms;
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

const horizontalAnimationAttrs: PickAnimationType<HorizontalAnimationProps> = {
  $animationType: AnimationType.HORIZONTAL,
};

const verticalAnimationAttrs: PickAnimationType<VerticalAnimationProps> = {
  $animationType: AnimationType.VERTICAL,
};

export const Container: ContainerStyledComponent = styled.div`
  font-size: ${Numbers.ONE_HUNDRED}px;
  color: #f0ff95;
  position: relative;
  white-space: nowrap;
  max-width: ${Numbers.ONE_HUNDRED}%;
  width: fit-content;
  height: ${Numbers.ONE}lh;
`;

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

export const VerticalAnimation: VerticalAnimationStyledComponent = styled.div.attrs<VerticalAnimationProps>(
  verticalAnimationAttrs,
)`
  ${animation};
  :last-child {
    position: absolute;
    top: ${Numbers.ONE_HUNDRED}%;
  }
`;

export const Character: CharacterStyledComponent = styled.div<VisibilityProps>`
  ${visible};
  overflow: hidden;
  display: inline-block;
  text-align: end;
  height: inherit;
  white-space: pre;
`;

export const Digit: DigitStyledComponent = styled<CharacterStyledComponent, BaseObject>(Character)`
  min-width: ${Numbers.ONE}ch;
`;

export const Division: DivisionStyledComponent = styled.div<VisibilityProps>`
  ${visible};
`;
