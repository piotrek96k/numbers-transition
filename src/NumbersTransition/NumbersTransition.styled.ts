import { ComponentPropsWithRef, DetailedHTMLProps, HTMLAttributes } from 'react';
import styled, { RuleSet, css, keyframes } from 'styled-components';
import { Substitute, Keyframes, IStyledComponent, BaseObject, KnownTarget } from 'styled-components/dist/types';
import {
  AnimationType,
  HorizontalAnimationDirection,
  VerticalAnimationDirection,
  AnimationDirection,
} from './NumbersTransition.enum';

type StyledComponentBase<T extends object> = IStyledComponent<'web', T>;

type HTMLDetailedElement<T> = DetailedHTMLProps<HTMLAttributes<T>, T>;

type StyledComponent<T, U extends object = BaseObject> = StyledComponentBase<Substitute<HTMLDetailedElement<T>, U>>;

type ExtensionStyledComponent<T extends KnownTarget> = StyledComponentBase<
  Substitute<ComponentPropsWithRef<T> & BaseObject, BaseObject>
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

export interface DivisionProps {
  $visible?: boolean;
}

interface AnimationCommonProps<T extends AnimationType, U extends AnimationDirection> {
  $animationType: T;
  $animationDirection: U;
  $animationDuration: number;
}

interface HorizontalAnimationProps
  extends AnimationCommonProps<AnimationType.HORIZONTAL, HorizontalAnimationDirection> {
  $animationStartWidth: number;
  $animationEndWidth: number;
}

interface VerticalAnimationProps extends AnimationCommonProps<AnimationType.VERTICAL, VerticalAnimationDirection> {
  $animationStartProgress?: number;
}

type AnimationProps = HorizontalAnimationProps | VerticalAnimationProps;

type ContainerStyledComponent = StyledComponent<HTMLDivElement>;

type CharacterStyledComponent = StyledComponent<HTMLDivElement>;

type DigitStyledComponent = ExtensionStyledComponent<CharacterStyledComponent>;

type DivisionStyledComponent = StyledComponent<HTMLDivElement, DivisionProps>;

type HorizontalAnimationStyledComponent = AttributesStyledComponent<
  'div',
  HTMLDetailedElement<HTMLDivElement>,
  Omit<HorizontalAnimationProps, '$animationType'>
>;

type VerticalAnimationStyledComponent = AttributesStyledComponent<
  'div',
  HTMLDetailedElement<HTMLDivElement>,
  Omit<VerticalAnimationProps, '$animationType'>
>;

export const Container: ContainerStyledComponent = styled.div`
  font-size: 100px;
  color: #f0ff95;
  position: relative;
  white-space: nowrap;
  max-width: 100%;
  width: fit-content;
  height: 1lh;
`;

export const Character: CharacterStyledComponent = styled.div`
  overflow: hidden;
  display: inline-block;
  text-align: end;
  height: inherit;
  white-space: pre;
`;

export const Digit: DigitStyledComponent = styled(Character)`
  min-width: 1ch;
`;

export const Division: DivisionStyledComponent = styled.div<DivisionProps>`
  color: ${({ $visible = true }: DivisionProps): string => ($visible ? 'inherit' : 'transparent')};
`;

const getHorizontalAnimation = ({
  $animationStartWidth,
  $animationEndWidth,
}: HorizontalAnimationProps): Keyframes => keyframes`
  0% {
    width: calc(1ch * ${$animationStartWidth});
  }
  100% {
    width: calc(1ch * ${$animationEndWidth});
  }
`;

const getVerticalAnimation = ({ $animationStartProgress }: VerticalAnimationProps): Keyframes => keyframes`
  0% {
    transform: translateY(-${$animationStartProgress ?? 0}%);
  }
  ${
    $animationStartProgress
      ? css`
          ${$animationStartProgress}% {
            transform: translateY(-${$animationStartProgress}%);
          }
        `
      : css``
  }
  100% {
    transform: translateY(-100%);
  }
`;

const animationName: RuleSet<AnimationProps> = css<AnimationProps>`
  animation-name: ${(props: AnimationProps): Keyframes =>
    props.$animationType === AnimationType.HORIZONTAL ? getHorizontalAnimation(props) : getVerticalAnimation(props)};
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
  animation-duration: ${({ $animationDuration }: AnimationProps): number => $animationDuration}s;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
`;

const horizontalAnimationAttrs: Partial<HorizontalAnimationProps> = {
  $animationType: AnimationType.HORIZONTAL,
};

const verticalAnimationAttrs: Partial<VerticalAnimationProps> = { $animationType: AnimationType.VERTICAL };

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
`;
