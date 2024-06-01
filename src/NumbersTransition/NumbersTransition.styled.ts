import styled, { RuleSet, css, keyframes } from 'styled-components';
import { Keyframes } from 'styled-components/dist/types';

export enum HorizontalAnimationDirection {
  RIGHT = 'RIGHT',
  LEFT = 'LEFT',
}

export enum VerticalAnimationDirection {
  UP = 'UP',
  DOWN = 'DOWN',
}

export enum DigitGroupSeparator {
  NONE = '',
  COMMA = ',',
  DOT = '.',
  THIN_SPACE = ' ',
  SPACE = ' ',
  UNDERSCORE = '_',
  APOSTROPHE = "'",
}

type AnimationDirection = HorizontalAnimationDirection | VerticalAnimationDirection;

interface HorizontalAnimationProps {
  animationDirection?: HorizontalAnimationDirection;
  animationDuration?: number;
  animationStartNumberOfDigits?: number;
  animationEndNumberOfDigits?: number;
  digitGroupSeparatorWidth?: number;
}

interface VerticalAnimationProps {
  animationDirection: VerticalAnimationDirection;
  animationDuration: number;
  animationNumberOfDigits: number;
}

const getHorizontalAnimationWidth = (numberOfDigits: number, digitGroupSeparatorWidth: number): RuleSet<object> => css`
  width: calc(1ch * (${numberOfDigits} + ${digitGroupSeparatorWidth * Math.floor((numberOfDigits - 1) / 3)}));
`;

const getHorizontalAnimation = (start: number, end: number, digitGroupSeparatorWidth: number): Keyframes => keyframes`
  from {
    ${getHorizontalAnimationWidth(start, digitGroupSeparatorWidth)};
  }
  to {
    ${getHorizontalAnimationWidth(end, digitGroupSeparatorWidth)};
  }
`;

const getVerticalAnimation = (numberOfDigits: number): Keyframes => keyframes`
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(calc(100% / ${numberOfDigits} - 100%));
  }
`;

const getAnimationDirection = (animationDirection: AnimationDirection): RuleSet<object> =>
  animationDirection === HorizontalAnimationDirection.RIGHT || animationDirection === VerticalAnimationDirection.UP
    ? css`
        animation-direction: normal;
        animation-timing-function: ease;
      `
    : css`
        animation-direction: reverse;
        animation-timing-function: cubic-bezier(0.75, 0, 0.75, 0.9);
      `;

const getAnimation = (
  keyFrames: Keyframes,
  animationDirection: AnimationDirection,
  animationDuration: number,
): RuleSet<object> => css`
  animation-name: ${keyFrames};
  animation-duration: ${animationDuration}s;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
  ${getAnimationDirection(animationDirection)};
`;

const horizontalAnimationCss: RuleSet<HorizontalAnimationProps> = css<HorizontalAnimationProps>`
  ${({
    animationDirection,
    animationDuration,
    animationStartNumberOfDigits,
    animationEndNumberOfDigits,
    digitGroupSeparatorWidth,
  }) =>
    getAnimation(
      getHorizontalAnimation(animationStartNumberOfDigits!, animationEndNumberOfDigits!, digitGroupSeparatorWidth!),
      animationDirection!,
      animationDuration!,
    )};
  & > :first-child {
    position: absolute;
    display: inherit;
    height: inherit;
    right: 0;
  }
`;

export const HorizontalAnimation = styled.span<HorizontalAnimationProps>`
  font-size: 100px;
  color: #f0ff95;
  position: relative;
  display: inline-block;
  overflow: hidden;
  height: 1lh;
  white-space: nowrap;
  ${({ animationDirection }) => animationDirection && horizontalAnimationCss}
`;

export const VerticalAnimation = styled.span<VerticalAnimationProps>`
  display: inline-block;
  ${({ animationDirection, animationDuration, animationNumberOfDigits }) =>
    getAnimation(getVerticalAnimation(animationNumberOfDigits), animationDirection, animationDuration)}
`;

export const Character = styled.span`
  overflow: hidden;
  display: inline-block;
  height: inherit;
  white-space: pre;
`;

export const Digit = styled(Character)`
  min-width: 1ch;
`;
