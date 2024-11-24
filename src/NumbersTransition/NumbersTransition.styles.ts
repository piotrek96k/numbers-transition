import styled, { RuleSet, css, keyframes } from 'styled-components';
import { Keyframes } from 'styled-components/dist/types';
import {
  AnimationDirection,
  AnimationTimingFunction,
  AnimationType,
  HorizontalAnimationDirection,
  VerticalAnimationDirection,
} from './NumbersTransition.enums';
import {
  AttributesStyledComponent,
  ExtensionStyledComponent,
  HTMLDetailedElement,
  StyledComponent,
} from './NumbersTransition.types';

interface StyledAnimationCommonProps<T extends AnimationType, U extends AnimationDirection> {
  $animationType: T;
  $animationDirection: U;
  $animationDuration: number;
  $animationTimingFunction: AnimationTimingFunction;
  $animationDelay?: number;
}

interface StyledHorizontalAnimationProps
  extends StyledAnimationCommonProps<AnimationType.HORIZONTAL, HorizontalAnimationDirection> {
  $animationStartWidth: number;
  $animationEndWidth: number;
}

type StyledVerticalAnimationProps = StyledAnimationCommonProps<AnimationType.VERTICAL, VerticalAnimationDirection>;

type StyledAnimationProps = StyledHorizontalAnimationProps | StyledVerticalAnimationProps;

type PickAnimationType<T extends StyledAnimationProps> = Pick<T, '$animationType'>;

type OmitAnimationType<T extends StyledAnimationProps> = Omit<T, '$animationType'>;

export interface StyledVisibilityProps {
  $visible?: boolean;
}

type ContainerStyledComponent = StyledComponent<HTMLDivElement>;

type AnimationStyledComponent<T extends StyledAnimationProps> = AttributesStyledComponent<
  'div',
  HTMLDetailedElement<HTMLDivElement>,
  OmitAnimationType<T>
>;

type HorizontalAnimationStyledComponent = AnimationStyledComponent<StyledHorizontalAnimationProps>;

type VerticalAnimationStyledComponent = AnimationStyledComponent<StyledVerticalAnimationProps>;

type CharacterStyledComponent = StyledComponent<HTMLDivElement, StyledVisibilityProps>;

type DigitStyledComponent = ExtensionStyledComponent<CharacterStyledComponent>;

type DivisionStyledComponent = StyledComponent<HTMLDivElement, StyledVisibilityProps>;

const visible: RuleSet<StyledVisibilityProps> = css<StyledVisibilityProps>`
  color: ${({ $visible = true }: StyledVisibilityProps): string => ($visible ? 'inherit' : 'transparent')};
`;

const horizontalAnimation = ({
  $animationStartWidth,
  $animationEndWidth,
}: OmitAnimationType<StyledHorizontalAnimationProps>): Keyframes => keyframes`
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

const getAnimation = ({ $animationType, ...restProps }: StyledAnimationProps): Keyframes => {
  switch ($animationType) {
    case AnimationType.HORIZONTAL:
      return horizontalAnimation(<OmitAnimationType<StyledHorizontalAnimationProps>>restProps);
    case AnimationType.VERTICAL:
      return verticalAnimation;
  }
};

const animationName: RuleSet<StyledAnimationProps> = css<StyledAnimationProps>`
  animation-name: ${(props: StyledAnimationProps): Keyframes => getAnimation(props)};
`;

const animationDuration: RuleSet<StyledAnimationProps> = css<StyledAnimationProps>`
  animation-duration: ${({ $animationDuration }: StyledAnimationProps): number => $animationDuration}s;
`;

const animationDirection: RuleSet<StyledAnimationProps> = css<StyledAnimationProps>`
  animation-direction: ${({ $animationDirection }: StyledAnimationProps): string => $animationDirection.toLowerCase()};
`;

const animationTimingFunction: RuleSet<StyledAnimationProps> = css<StyledAnimationProps>`
  animation-timing-function: cubic-bezier(
    ${({ $animationTimingFunction }: StyledAnimationProps): string => $animationTimingFunction.join()}
  );
`;

const animationDelay: RuleSet<StyledAnimationProps> = css<StyledAnimationProps>`
  animation-delay: ${({ $animationDelay }: StyledAnimationProps): number => $animationDelay ?? 0}s;
`;

const animation: RuleSet<StyledAnimationProps> = css<StyledAnimationProps>`
  ${animationName};
  ${animationDuration};
  ${animationDirection};
  ${animationTimingFunction};
  ${animationDelay};
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
`;

const horizontalAnimationAttrs: PickAnimationType<StyledHorizontalAnimationProps> = {
  $animationType: AnimationType.HORIZONTAL,
};

const verticalAnimationAttrs: PickAnimationType<StyledVerticalAnimationProps> = {
  $animationType: AnimationType.VERTICAL,
};

export const StyledContainer: ContainerStyledComponent = styled.div`
  font-size: 100px;
  color: #f0ff95;
  position: relative;
  white-space: nowrap;
  max-width: 100%;
  width: fit-content;
  height: 1lh;
`;

export const StyledHorizontalAnimation: HorizontalAnimationStyledComponent = styled.div.attrs<StyledHorizontalAnimationProps>(
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

export const StyledVerticalAnimation: VerticalAnimationStyledComponent = styled.div.attrs<StyledVerticalAnimationProps>(
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

export const StyledCharacter: CharacterStyledComponent = styled.div<StyledVisibilityProps>`
  ${visible};
  overflow: hidden;
  display: inline-block;
  text-align: end;
  height: inherit;
  white-space: pre;
`;

export const StyledDigit: DigitStyledComponent = styled(StyledCharacter)`
  min-width: 1ch;
`;

export const StyledDivision: DivisionStyledComponent = styled.div<StyledVisibilityProps>`
  ${visible};
`;
