import {
  RefObject,
  HTMLAttributes,
  DetailedHTMLProps,
  DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES,
} from 'react';
import styled, { RuleSet, css, keyframes } from 'styled-components';
import { IStyledComponentBase, FastOmit, Substitute, Keyframes } from 'styled-components/dist/types';
import {
  StyledComponentType,
  AnimationType,
  HorizontalAnimationDirection,
  VerticalAnimationDirection,
  AnimationDirection,
} from './NumbersTransition.enum';

type RefFunction<T> = (
  instance: T | null,
) =>
  | void
  | DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES[keyof DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES];

type Ref<T> = RefFunction<T> | RefObject<T> | null | undefined;

interface RefProps<T> {
  ref?: Ref<T>;
}

type HTMLDetailedElement<T> = DetailedHTMLProps<HTMLAttributes<T>, T>;

type OmitNever<T extends object> = FastOmit<T, never>;

type OmitRef<T> = Omit<T, 'ref'>;

type GenericStyledComponentType<
  T extends StyledComponentType,
  U,
  V extends object = never,
> = T extends StyledComponentType.STYLED
  ? HTMLDetailedElement<U>
  : T extends StyledComponentType.EXTENSION
    ? OmitRef<OmitNever<HTMLDetailedElement<U>>> & RefProps<U>
    : T extends StyledComponentType.ATTRIBUTES
      ? Substitute<Substitute<HTMLDetailedElement<U>, OmitRef<HTMLDetailedElement<U>> & RefProps<U>>, V>
      : never;

type GenericStyledComponent<T extends StyledComponentType, U, V extends object = never> = IStyledComponentBase<
  'web',
  GenericStyledComponentType<T, U, V>
> &
  string;

type StyledComponent<T> = GenericStyledComponent<StyledComponentType.STYLED, T>;

type ExtensionStyledComponent<T> = GenericStyledComponent<StyledComponentType.EXTENSION, T>;

type AttributesStyledComponent<T, U extends object> = GenericStyledComponent<StyledComponentType.ATTRIBUTES, T, U>;

interface AnimationCommonProps<T extends AnimationType, U extends AnimationDirection> {
  $animationType?: T;
  $animationDirection: U;
  $animationDuration: number;
}

interface HorizontalAnimationProps
  extends AnimationCommonProps<AnimationType.HORIZONTAL, HorizontalAnimationDirection> {
  $animationStartWidth: number;
  $animationEndWidth: number;
}

interface VerticalAnimationProps extends AnimationCommonProps<AnimationType.VERTICAL, VerticalAnimationDirection> {}

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
  animation-name: ${(props: AnimationProps): Keyframes =>
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
  animation-duration: ${({ $animationDuration }: AnimationProps): number => $animationDuration}s;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
`;

export const Container: StyledComponent<HTMLDivElement> = styled.div`
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

export const HorizontalAnimation: AttributesStyledComponent<HTMLDivElement, HorizontalAnimationProps> =
  styled.div.attrs<HorizontalAnimationProps>(horizontalAnimationAttrs)`
    ${animation};
    height: inherit;
    :only-child {
      float: right;
      height: inherit;
    }
  `;

const verticalAnimationAttrs: Partial<VerticalAnimationProps> = { $animationType: AnimationType.VERTICAL };

export const VerticalAnimation: AttributesStyledComponent<HTMLDivElement, VerticalAnimationProps> =
  styled.div.attrs<VerticalAnimationProps>(verticalAnimationAttrs)`
    ${animation};
    :last-child {
      position: absolute;
      top: 100%;
    }
  `;

export const Character: StyledComponent<HTMLDivElement> = styled.div`
  overflow: hidden;
  display: inline-block;
  height: inherit;
  white-space: pre;
`;

export const Digit: ExtensionStyledComponent<HTMLDivElement> = styled(Character)`
  min-width: 1ch;
`;
