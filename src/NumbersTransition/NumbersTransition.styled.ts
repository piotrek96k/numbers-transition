import styled, { RuleSet, css, keyframes } from 'styled-components';
import { Keyframes } from 'styled-components/dist/types';
import { HorizontalAnimationDirection, VerticalAnimationDirection, AnimationType } from './NumbersTransition.enum';

interface AnimationDurationProps {
  $animationDuration: number;
}

interface HorizontalAnimationProps extends AnimationDurationProps {
  $animationType?: AnimationType.HORIZONTAL;
  $animationDirection: HorizontalAnimationDirection;
  $animationStartWidth: number;
  $animationEndWidth: number;
}

interface VerticalAnimationProps extends AnimationDurationProps {
  $animationType?: AnimationType.VERTICAL;
  $animationDirection: VerticalAnimationDirection;
}

type AnimationProps = HorizontalAnimationProps | VerticalAnimationProps;

const horizontalAnimation = ({
  $animationStartWidth,
  $animationEndWidth,
}: HorizontalAnimationProps): Keyframes => keyframes`
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

const animationName: RuleSet<AnimationProps> = css<AnimationProps>`
  animation-name: ${(props) =>
    props.$animationType === AnimationType.HORIZONTAL ? horizontalAnimation(props) : verticalAnimation};
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
  ${animationName};
  ${animationDirection};
  animation-duration: ${({ $animationDuration }) => $animationDuration}s;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
`;

export const Container = styled.div`
  font-size: 100px;
  color: #f0ff95;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
  max-width: 100%;
  width: fit-content;
  height: 1lh;
`;

const horizontalAnimationAttrs: Partial<HorizontalAnimationProps> = {
  $animationType: AnimationType.HORIZONTAL,
};

export const HorizontalAnimation = styled.div.attrs<HorizontalAnimationProps>(horizontalAnimationAttrs)`
  ${animation};
  height: inherit;
  > :first-child {
    float: right;
    height: inherit;
  }
`;

const verticalAnimationAttrs: Partial<VerticalAnimationProps> = { $animationType: AnimationType.VERTICAL };

export const VerticalAnimation = styled.div.attrs<VerticalAnimationProps>(verticalAnimationAttrs)`
  ${animation};
  > :last-child {
    position: absolute;
    top: 100%;
  }
`;

export const Character = styled.div`
  overflow: hidden;
  display: inline-block;
  height: inherit;
`;

export const Digit = styled(Character)`
  min-width: 1ch;
`;
