import styled, { RuleSet, css, keyframes } from 'styled-components';
import { Keyframes } from 'styled-components/dist/types';
import {
  AnimationDirection,
  AnimationTimingFunction,
  AnimationType,
  HorizontalAnimationDirection,
  StepAnimationDirection,
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import {
  AttributesStyledComponent,
  ExtensionStyledComponent,
  HTMLDetailedElement,
  StyledComponent,
} from './NumbersTransition.types';

interface AnimationCommonProps<T extends AnimationType, U extends AnimationDirection> {
  $animationType: T;
  $animationDirection: U;
  $animationDuration: number;
  $animationTimingFunction: AnimationTimingFunction;
}

interface HorizontalAnimationProps
  extends AnimationCommonProps<AnimationType.HORIZONTAL, HorizontalAnimationDirection> {
  $animationStartWidth: number;
  $animationEndWidth: number;
}

type VerticalAnimationProps = AnimationCommonProps<AnimationType.VERTICAL, VerticalAnimationDirection>;

export interface StepAnimationProps extends AnimationCommonProps<AnimationType.STEP, StepAnimationDirection> {
  $animationStepProgress: number;
}

type AnimationProps = HorizontalAnimationProps | VerticalAnimationProps | StepAnimationProps;

type PickAnimationType<T extends AnimationProps> = Pick<T, '$animationType'>;

export type OmitAnimationType<T extends AnimationProps> = Omit<T, '$animationType'>;

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

type StepAnimationStyledComponent = AnimationStyledComponent<StepAnimationProps>;

type CharacterStyledComponent = StyledComponent<HTMLDivElement, VisibilityProps>;

type DigitStyledComponent = ExtensionStyledComponent<CharacterStyledComponent>;

type DivisionStyledComponent = StyledComponent<HTMLDivElement, VisibilityProps>;

const visible: RuleSet<VisibilityProps> = css<VisibilityProps>`
  color: ${({ $visible = true }: VisibilityProps): string => ($visible ? 'inherit' : 'transparent')};
`;

const horizontalAnimation = ({
  $animationStartWidth,
  $animationEndWidth,
}: OmitAnimationType<HorizontalAnimationProps>): Keyframes => keyframes`
  0% {
    width: calc(1ch * ${$animationStartWidth});
  }
  100% {
    width: calc(1ch * ${$animationEndWidth});
  }
`;

const verticalAnimation: Keyframes = keyframes`
  0% {
    transform: translateY(0%);
  }
  100% {
    transform: translateY(-100%);
  }
`;

const stepAnimation = ({ $animationStepProgress }: OmitAnimationType<StepAnimationProps>): Keyframes => keyframes`
  0% {
    color: transparent;
  }
  ${$animationStepProgress}% {
    color: inherit;
  }
`;

const getAnimation = ({ $animationType, ...restProps }: AnimationProps): Keyframes => {
  switch ($animationType) {
    case AnimationType.HORIZONTAL:
      return horizontalAnimation(<OmitAnimationType<HorizontalAnimationProps>>restProps);
    case AnimationType.VERTICAL:
      return verticalAnimation;
    case AnimationType.STEP:
      return stepAnimation(<OmitAnimationType<StepAnimationProps>>restProps);
  }
};

const animationName: RuleSet<AnimationProps> = css<AnimationProps>`
  animation-name: ${(props: AnimationProps): Keyframes => getAnimation(props)};
`;

const animationDuration: RuleSet<AnimationProps> = css<AnimationProps>`
  animation-duration: ${({ $animationDuration }: AnimationProps): number => $animationDuration}s;
`;

const animationDirection: RuleSet<AnimationProps> = css<AnimationProps>`
  animation-direction: ${({ $animationDirection }: AnimationProps): string => $animationDirection.toLowerCase()};
`;

const animationTimingFunction: RuleSet<AnimationProps> = css<AnimationProps>`
  animation-timing-function: ${({ $animationType, $animationTimingFunction }: AnimationProps): RuleSet<object> =>
    $animationType === AnimationType.STEP
      ? css<object>`steps(1)`
      : css<object>`cubic-bezier(${$animationTimingFunction.join()})`};
`;

const animation: RuleSet<AnimationProps> = css<AnimationProps>`
  ${animationName};
  ${animationDuration};
  ${animationDirection};
  ${animationTimingFunction};
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
`;

const horizontalAnimationAttrs: PickAnimationType<HorizontalAnimationProps> = {
  $animationType: AnimationType.HORIZONTAL,
};

const verticalAnimationAttrs: PickAnimationType<VerticalAnimationProps> = {
  $animationType: AnimationType.VERTICAL,
};

const stepAnimationAttrs: PickAnimationType<StepAnimationProps> = { $animationType: AnimationType.STEP };

export const Container: ContainerStyledComponent = styled.div`
  font-size: 100px;
  color: #f0ff95;
  position: relative;
  white-space: nowrap;
  max-width: 100%;
  width: fit-content;
  height: 1lh;
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
    top: 100%;
  }
  :not(:last-child) {
    position: relative;
  }
`;

export const StepAnimation: StepAnimationStyledComponent = styled.div.attrs<StepAnimationProps>(stepAnimationAttrs)`
  ${animation};
  position: absolute;
`;

export const Character: CharacterStyledComponent = styled.div<VisibilityProps>`
  ${visible};
  overflow: hidden;
  display: inline-block;
  text-align: end;
  height: inherit;
  white-space: pre;
`;

export const Digit: DigitStyledComponent = styled(Character)`
  min-width: 1ch;
`;

export const Division: DivisionStyledComponent = styled.div<VisibilityProps>`
  ${visible};
`;
