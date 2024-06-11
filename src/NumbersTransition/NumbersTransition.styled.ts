import styled, { RuleSet, css, keyframes } from 'styled-components';
import { Keyframes } from 'styled-components/dist/types';
import { HorizontalAnimationDirection, VerticalAnimationDirection, AnimationType } from './NumbersTransition.enum';

interface AnimationDurationProps {
  $animationDuration: number;
}

interface HorizontalAnimationProps extends Partial<AnimationDurationProps> {
  $animationType?: AnimationType.HORIZONTAL;
  $animationDirection?: HorizontalAnimationDirection;
  $animationStartWidth?: number;
  $animationEndWidth?: number;
}

interface VerticalAnimationProps extends AnimationDurationProps {
  $animationType?: AnimationType.VERTICAL;
  $animationDirection: VerticalAnimationDirection;
}

type AnimationProps = HorizontalAnimationProps | VerticalAnimationProps;

const horizontalAnimation = ({
  $animationStartWidth,
  $animationEndWidth,
}: Omit<HorizontalAnimationProps, '$animationDirection'>): Keyframes => keyframes`
  from {
    width: calc(1ch * ${$animationStartWidth});
  }
  to {
    width: calc(1ch * ${$animationEndWidth});
  }
`;

const verticalAnimation: Keyframes = keyframes`
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-100%);
  }
`;

const animationDirection = ({ $animationDirection }: AnimationProps): RuleSet<object> =>
  $animationDirection === HorizontalAnimationDirection.RIGHT || $animationDirection === VerticalAnimationDirection.UP
    ? css`
        animation-direction: normal;
        animation-timing-function: ease;
      `
    : css`
        animation-direction: reverse;
        animation-timing-function: cubic-bezier(0.75, 0, 0.75, 0.9);
      `;

const animation: RuleSet<AnimationProps> = css<AnimationProps>`
  animation-name: ${({ $animationType, ...restProps }) =>
    $animationType === AnimationType.HORIZONTAL ? horizontalAnimation(restProps) : verticalAnimation};
  ${animationDirection};
  animation-duration: ${({ $animationDuration }) => $animationDuration}s;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
`;

const horizontalAnimationCss: RuleSet<HorizontalAnimationProps> = css<HorizontalAnimationProps>`
  ${animation};
  & > :first-child {
    position: absolute;
    display: inherit;
    height: inherit;
    right: 0;
  }
`;

export const HorizontalAnimation = styled.div.attrs<HorizontalAnimationProps>({
  $animationType: AnimationType.HORIZONTAL,
})`
  font-size: 100px;
  color: #f0ff95;
  position: relative;
  display: inline-block;
  overflow: hidden;
  height: 1lh;
  white-space: nowrap;
  ${({ $animationDirection }) => $animationDirection && horizontalAnimationCss};
`;

export const VerticalAnimation = styled.div.attrs<VerticalAnimationProps>({ $animationType: AnimationType.VERTICAL })`
  ${animation};
  & > :last-child {
    position: absolute;
    top: 100%;
  }
`;

export const Character = styled.div`
  overflow: hidden;
  display: inline-block;
  height: inherit;
  white-space: pre;
`;

export const Digit = styled(Character)`
  min-width: 1ch;
`;
